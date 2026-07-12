import { STORAGE_KEYS } from '../lib/constants';
// src/services/sheetsService.ts

// Google Sheets API Integration Service
import {
  requestAccessToken,
  refreshAccessToken,
  clearTokens,
  getSheetNotifier,
} from './googleAuth';

export type SheetValue = string | number | boolean | null;
export type SheetRow = SheetValue[];
export type SheetGrid = SheetRow[];

export interface DeleteDimensionRequest {
  deleteDimension: {
    range: {
      sheetId: number;
      dimension: 'ROWS' | 'COLUMNS';
      startIndex: number;
      endIndex: number;
    };
  };
}

export interface AddSheetRequest {
  addSheet: {
    properties: { title: string };
  };
}

export type BatchRequest = DeleteDimensionRequest | AddSheetRequest;

async function withSheetToast<T>(promise: Promise<T>): Promise<T> {
  try {
    const res = await promise;
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    if (message !== 'UNAUTHENTICATED') {
      const activeNotifier = getSheetNotifier();
      activeNotifier.error('Failed to update sheet');
    }
    throw err;
  }
}

let currentSpreadsheetId = (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.spreadsheetId) : null) || import.meta.env.VITE_SPREADSHEET_ID || '';

export const getSpreadsheetId = () => currentSpreadsheetId;
export const setSpreadsheetId = (id: string) => {
  currentSpreadsheetId = id;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.spreadsheetId, id);
  }
};

/**
 * Resolves the active spreadsheet ID using the standard fallback chain:
 * 1. Active Campaign (from localStorage)
 * 2. Primary Spreadsheet ID (from localStorage)
 * 3. In-memory currentSpreadsheetId
 * 4. Environment variable fallback
 */
export function resolveActiveSpreadsheetId(): string {
  const activeCampaignId = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.activeCampaignSpreadsheetId) : null;
  const primaryId = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.spreadsheetId) : null;

  return (
    activeCampaignId ||
    primaryId ||
    getSpreadsheetId() ||
    import.meta.env.VITE_SPREADSHEET_ID ||
    ''
  );
}

async function googleFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token: string;
  try {
    token = await requestAccessToken();
  } catch (err) {
    // If we can't get a token, we must fail with 401
    return new Response(JSON.stringify({ error: 'UNAUTHENTICATED' }), { status: 401 });
  }

  const MAX_RETRIES = 3;
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt <= MAX_RETRIES) {
    try {
      let response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        console.warn('[Sheets] Google API returned 401 (Unauthorized). Attempting token refresh...');
        const newToken = await refreshAccessToken();
        if (newToken) {
          token = newToken;
          response = await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newToken}`,
            },
          });
        } else {
          console.error('[Sheets] Refresh failed or not available. Clearing tokens.');
          clearTokens();
          return response;
        }
      }

      // Retry on 429 Too Many Requests or 5xx Server Errors
      if (response.status === 429 || response.status >= 500) {
        if (attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 500 + Math.random() * 200;
          console.warn(
            `[Sheets] API returned ${response.status}. Retrying in ${Math.round(delay)}ms... (Attempt ${attempt + 1} of ${MAX_RETRIES})`
          );
          await new Promise(res => setTimeout(res, delay));
          attempt++;
          continue;
        }
      }

      return response;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 500 + Math.random() * 200;
        console.warn(
          `[Sheets] Network error. Retrying in ${Math.round(delay)}ms... (Attempt ${attempt + 1} of ${MAX_RETRIES})`
        );
        await new Promise(res => setTimeout(res, delay));
        attempt++;
      } else {
        throw err;
      }
    }
  }

  throw lastError;
}

export async function fetchSheetData(range: string): Promise<any>;
export async function fetchSheetData(spreadsheetId: string, range: string): Promise<any>;
export async function fetchSheetData(
  arg1: string,
  arg2?: string
): Promise<any> {
  let spreadsheetId: string;
  let range: string;
  if (arg2 === undefined) {
    spreadsheetId = getSpreadsheetId();
    range = arg1;
  } else {
    spreadsheetId = arg1;
    range = arg2;
  }

  const response = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`
  );

  if (!response.ok) {
    if (response.status === 401) throw new Error('UNAUTHENTICATED');
    const errorText = await response.text();
    throw new Error(`Failed to fetch sheet data for ${range}: ${response.statusText}. Details: ${errorText}`);
  }

  return await response.json();
}

export function updateSheetData(range: string, values: SheetGrid): any;
export function updateSheetData(spreadsheetId: string, range: string, values: SheetGrid): any;
export function updateSheetData(
  arg1: string,
  arg2: any,
  arg3?: any
): any {
  let spreadsheetId: string;
  let range: string;
  let values: SheetGrid;
  if (arg3 === undefined) {
    spreadsheetId = getSpreadsheetId();
    range = arg1;
    values = arg2;
  } else {
    spreadsheetId = arg1;
    range = arg2;
    values = arg3;
  }
  return withSheetToast(_updateSheetData(spreadsheetId, range, values));
}

async function _updateSheetData(spreadsheetId: string, range: string, values: SheetGrid) {
  const response = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    }
  );

  if (!response.ok) {
    if (response.status === 401) throw new Error('UNAUTHENTICATED');
    const errorText = await response.text();
    throw new Error(`Failed to update sheet data: ${errorText}`);
  }

  return await response.json();
}

export function appendSheetData(range: string, values: SheetGrid): any;
export function appendSheetData(spreadsheetId: string, range: string, values: SheetGrid): any;
export function appendSheetData(
  arg1: string,
  arg2: any,
  arg3?: any
): any {
  let spreadsheetId: string;
  let range: string;
  let values: SheetGrid;
  if (arg3 === undefined) {
    spreadsheetId = getSpreadsheetId();
    range = arg1;
    values = arg2;
  } else {
    spreadsheetId = arg1;
    range = arg2;
    values = arg3;
  }
  return withSheetToast(_appendSheetData(spreadsheetId, range, values));
}

async function _appendSheetData(spreadsheetId: string, range: string, values: SheetGrid) {
  const response = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    }
  );

  if (!response.ok) {
    if (response.status === 401) throw new Error('UNAUTHENTICATED');
    const errorText = await response.text();
    throw new Error(`Failed to append sheet data: ${errorText}`);
  }

  return await response.json();
}

export async function deleteSheetRow(sheetId: number, rowIndex: number): Promise<any>;
export async function deleteSheetRow(spreadsheetId: string, sheetId: number, rowIndex: number): Promise<any>;
export async function deleteSheetRow(
  arg1: string | number,
  arg2: number,
  arg3?: number
): Promise<any> {
  let spreadsheetId: string;
  let sheetId: number;
  let rowIndex: number;
  if (arg3 === undefined) {
    spreadsheetId = getSpreadsheetId();
    sheetId = arg1 as number;
    rowIndex = arg2;
  } else {
    spreadsheetId = arg1 as string;
    sheetId = arg2;
    rowIndex = arg3;
  }

  const requests: BatchRequest[] = [
    {
      deleteDimension: {
        range: {
          sheetId: sheetId,
          dimension: 'ROWS' as const,
          startIndex: rowIndex,
          endIndex: rowIndex + 1,
        },
      },
    },
  ];
  return await batchUpdateSpreadsheet(spreadsheetId, requests);
}

export async function fetchSpreadsheetMetadata(): Promise<any>;
export async function fetchSpreadsheetMetadata(spreadsheetId: string): Promise<any>;
export async function fetchSpreadsheetMetadata(
  arg1?: string
): Promise<any> {
  const spreadsheetId = arg1 || getSpreadsheetId();
  const response = await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`);

  if (!response.ok) {
    if (response.status === 401) throw new Error('UNAUTHENTICATED');
    const errorText = await response.text();
    throw new Error(`Failed to fetch metadata: ${errorText}`);
  }

  return await response.json();
}

export async function batchUpdateValues(
  data: Array<{ range: string; values: SheetGrid }>
): Promise<void>;
export async function batchUpdateValues(
  spreadsheetId: string,
  data: Array<{ range: string; values: SheetGrid }>
): Promise<void>;
export async function batchUpdateValues(
  arg1: string | Array<{ range: string; values: SheetGrid }>,
  arg2?: Array<{ range: string; values: SheetGrid }>
): Promise<void> {
  let spreadsheetId: string;
  let data: Array<{ range: string; values: SheetGrid }>;
  if (arg2 === undefined) {
    spreadsheetId = getSpreadsheetId();
    data = arg1 as Array<{ range: string; values: SheetGrid }>;
  } else {
    spreadsheetId = arg1 as string;
    data = arg2;
  }

  const response = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data }),
    }
  );

  if (!response.ok) {
    if (response.status === 401) throw new Error('UNAUTHENTICATED');
    const errorText = await response.text();
    throw new Error(`Failed to batch update values: ${errorText}`);
  }

  await response.json();
}

export function batchUpdateSpreadsheet(requests: BatchRequest[]): any;
export function batchUpdateSpreadsheet(spreadsheetId: string, requests: BatchRequest[]): any;
export function batchUpdateSpreadsheet(
  arg1: string | BatchRequest[],
  arg2?: BatchRequest[]
): any {
  let spreadsheetId: string;
  let requests: BatchRequest[];
  if (arg2 === undefined) {
    spreadsheetId = getSpreadsheetId();
    requests = arg1 as BatchRequest[];
  } else {
    spreadsheetId = arg1 as string;
    requests = arg2;
  }
  return withSheetToast(_batchUpdateSpreadsheet(spreadsheetId, requests));
}

async function _batchUpdateSpreadsheet(spreadsheetId: string, requests: BatchRequest[]) {
  const response = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    }
  );

  if (!response.ok) {
    if (response.status === 401) throw new Error('UNAUTHENTICATED');
    const errorText = await response.text();
    throw new Error(`Failed batch update: ${errorText}`);
  }

  return await response.json();
}

export interface SheetMetadataEntry {
  properties: {
    title: string;
    sheetId: number;
  };
}


