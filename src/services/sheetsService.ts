// src/services/sheetsService.ts

// Google Sheets Service with Authorization Code Flow Support
declare global {
  interface Window {
    google?: any;
  }
}

import { toast } from 'sonner';

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

export interface Notifier {
  loading: (message: string) => string | number;
  success: (message: string, options?: { id: string | number }) => void;
  error:   (message: string, options?: { id: string | number }) => void;
  dismiss: (id: string | number) => void;
}

export const silentNotifier: Notifier = {
  loading: () => '',
  success: () => {},
  error:   () => {},
  dismiss: () => {},
};

let activeNotifier: Notifier = toast;

export function setSheetNotifier(notifier: Notifier): void {
  activeNotifier = notifier;
}

export function getSheetNotifier(): Notifier {
  return activeNotifier;
}

async function withSheetToast<T>(promise: Promise<T>): Promise<T> {
  const tId = activeNotifier.loading('Updating sheet...');
  try {
    const res = await promise;
    activeNotifier.success('Sheet updated successfully', { id: tId });
    return res;
  } catch (err: any) {
    if (err?.message !== 'UNAUTHENTICATED') {
      activeNotifier.error('Failed to update sheet', { id: tId });
    } else {
      activeNotifier.dismiss(tId);
    }
    throw err;
  }
}

let currentSpreadsheetId = localStorage.getItem('GM_DATA_SPREADSHEET_ID') || import.meta.env.VITE_DEFAULT_SPREADSHEET_ID || '';

export const getSpreadsheetId = () => currentSpreadsheetId;
export const setSpreadsheetId = (id: string) => {
  currentSpreadsheetId = id;
  localStorage.setItem('GM_DATA_SPREADSHEET_ID', id);
  console.log(`[Sheets] Spreadsheet ID updated to: ${id}`);
};

let cachedClientId: string | null = null;
export async function getGoogleClientId(): Promise<string> {
  if (cachedClientId) return cachedClientId;
  if (import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    cachedClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    return cachedClientId;
  }
  try {
    const res = await fetch('/api/auth/config');
    if (res.ok) {
      const data = await res.json();
      if (data.clientId) {
        cachedClientId = data.clientId;
        return cachedClientId;
      }
    }
  } catch (err) {
    console.error('[Sheets] Failed to fetch google client_id from server config:', err);
  }
  return '';
}

/**
 * Trigger a full-page redirect to Google's OAuth page.
 * Uses Authorization Code Flow for persistence.
 */
export async function signInWithRedirect() {
  const clientId = await getGoogleClientId();
  if (!clientId) {
    console.error('[Sheets] Cannot sign in: No Google Client ID available.');
    return;
  }
  const redirectUri = window.location.origin;
  const scope = 'https://www.googleapis.com/auth/spreadsheets';

  console.log(`[Sheets] signInWithRedirect: Starting OAuth redirect flow...`);

  // Clear any stale tokens before starting a fresh flow
  clearTokens();

  // Use code flow for offline access (refresh token)
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&access_type=offline` +
    `&scope=${encodeURIComponent(scope)}` +
    `&prompt=consent select_account`; // Force consent to ensure we get a fresh refresh token

  // Open in a new tab so the OAuth flow is not inside an iframe
  window.open(authUrl, '_blank', 'noopener');
}

/**
 * Trigger implicit flow for temporary access.
 */
export async function signInWithToken() {
  const clientId = await getGoogleClientId();
  if (!clientId) {
    console.error('[Sheets] Cannot sign in: No Google Client ID available.');
    return;
  }
  const redirectUri = window.location.origin;
  const scope = 'https://www.googleapis.com/auth/spreadsheets';

  console.log(`[Sheets] signInWithToken: Starting Implicit flow...`);

  clearTokens();

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=token` +
    `&scope=${encodeURIComponent(scope)}`;

  window.location.href = authUrl;
}

let tokenClient: any;
let accessToken: string | null = null;
let refreshToken: string | null = null;

// Helper to keep local variables in sync with storage
function refreshLocalTokens() {
  accessToken = localStorage.getItem('GM_GOOGLE_ACCESS_TOKEN');
  refreshToken = localStorage.getItem('GM_GOOGLE_REFRESH_TOKEN');
}

export function clearTokens() {
  console.log('[Sheets] Clearing all authentication tokens from storage.');
  localStorage.removeItem('GM_GOOGLE_ACCESS_TOKEN');
  localStorage.removeItem('GM_GOOGLE_REFRESH_TOKEN');
  accessToken = null;
  refreshToken = null;
}

export function hasToken() {
  refreshLocalTokens();
  return !!accessToken || !!refreshToken;
}

// ✅ REPLACED setManualToken with two explicit functions.
// The old version used a fragile heuristic (checking for "//" and length > 50)
// to guess which slot to write to. These are unambiguous.

export function setManualAccessToken(token: string) {
  localStorage.setItem('GM_GOOGLE_ACCESS_TOKEN', token);
  accessToken = token;
  console.log('[Sheets] Manual Access Token successfully set.');
}

export function setManualRefreshToken(token: string) {
  localStorage.setItem('GM_GOOGLE_REFRESH_TOKEN', token);
  refreshToken = token;
  console.log('[Sheets] Manual Refresh Token successfully set and saved.');
}

export async function checkAndCaptureToken() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const hashParams = new URLSearchParams(
    window.location.hash.includes('?')
      ? window.location.hash.split('?')[1]
      : window.location.hash.substring(1)
  );
  const hashToken = hashParams.get('access_token');

  if (hashToken) {
    console.log('[Sheets] checkAndCaptureToken: Found access_token in hash (Implicit Flow).');
    localStorage.setItem('GM_GOOGLE_ACCESS_TOKEN', hashToken);
    accessToken = hashToken;
    // Clean up hash
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    return true;
  }

  if (code) {
    console.log(`[Sheets] checkAndCaptureToken: Authorization code received: ${code.substring(0, 5)}...`);
    console.log('[Sheets] Exchanging code for tokens via backend API...');
    try {
      const redirectUri = window.location.origin;
      const res = await fetch('/api/auth/google-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: redirectUri }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ [Sheets] Token exchange FAILED:', errorData);
        // Clear code to prevent loops
        window.history.replaceState(null, '', window.location.pathname);
        throw new Error(errorData.error || 'Token exchange failed');
      }

      const data = await res.json();
      console.log('✅ [Sheets] Token exchange SUCCESS.');

      if (data.access_token) {
        localStorage.setItem('GM_GOOGLE_ACCESS_TOKEN', data.access_token);
        accessToken = data.access_token;
        console.log('[Sheets] Access token saved.');
      }

      if (data.refresh_token) {
        localStorage.setItem('GM_GOOGLE_REFRESH_TOKEN', data.refresh_token);
        refreshToken = data.refresh_token;
        console.log('[Sheets] Refresh token received and saved. Persistent sync enabled.');
      } else {
        console.warn(
          '⚠️ [Sheets] NO REFRESH TOKEN RECEIVED. This usually happens if you have already authorized this app. Persistent background sync will FAIL when the access token expires in 1 hour.'
        );
        console.warn(
          '💡 ACTION: Go to https://myaccount.google.com/permissions, remove this app, and sign in again.'
        );
      }

      // Clean up URL
      window.history.replaceState(null, '', window.location.pathname);
      return true;
    } catch (err) {
      console.error('[Sheets] CRITICAL: Failed to exchange code:', err);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }
  return false;
}

export async function refreshAccessToken(): Promise<string | null> {
  refreshLocalTokens();
  if (!refreshToken) {
    console.warn('[Sheets] refreshAccessToken: CANNOT REFRESH. No refresh token available in storage.');
    return null;
  }

  console.log('[Sheets] refreshAccessToken: Attempting background token refresh via backend...');
  try {
    const res = await fetch('/api/auth/google-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error('❌ [Sheets] Background Refresh FAILED:', res.status, errData);

      if (errData.error === 'invalid_grant') {
        console.warn('⚠️ [Sheets] Refresh token is invalid (expired or revoked). Clearing credentials.');
        clearTokens();
      } else if (errData.message && errData.message.includes('VITE_GOOGLE_CLIENT_SECRET')) {
        console.error('❌ [Sheets] REFRESH FAILED: VITE_GOOGLE_CLIENT_SECRET is missing in AI Studio Secrets.');
      }
      return null;
    }

    const data = await res.json();
    if (data.access_token) {
      console.log('[Sheets] Background refresh SUCCESS. New access token acquired.');
      localStorage.setItem('GM_GOOGLE_ACCESS_TOKEN', data.access_token);
      accessToken = data.access_token;
      return accessToken;
    }
  } catch (err) {
    console.error('[Sheets] refreshAccessToken: Exception occurred during refresh:', err);
  }
  return null;
}

export async function initGoogleAuth(): Promise<void> {
  console.log('[Sheets] initGoogleAuth: Initializing Google Identity Services...');
  refreshLocalTokens();

  await checkAndCaptureToken();

  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      setupClient(resolve, reject);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setupClient(resolve, reject);
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
}

async function setupClient(resolve: () => void, reject: (err: Error) => void) {
  try {
    const clientId = await getGoogleClientId();
    if (!clientId) {
      throw new Error('Missing Google Client ID in environment variables.');
    }

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      callback: (tokenResponse: any) => {
        if (tokenResponse.error !== undefined) {
          reject(tokenResponse);
        }
        accessToken = tokenResponse.access_token;
        localStorage.setItem('GM_GOOGLE_ACCESS_TOKEN', accessToken!);
        resolve();
      },
    });
    resolve();
  } catch (error: any) {
    reject(error);
  }
}

export async function requestAccessToken(): Promise<string> {
  refreshLocalTokens();

  // 1. Check if we have an access token
  if (accessToken) {
    console.log('[Sheets] requestAccessToken: Using existing cached access token.');
    return accessToken;
  }

  // 2. Try refreshing
  if (refreshToken) {
    console.log('[Sheets] requestAccessToken: Attempting silent refresh using refresh token...');
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return refreshed;
    }
  }

  // 3. Fallback: Trigger login
  console.log('[Sheets] requestAccessToken: No valid token available. Triggering fresh authentication...');

  // If we're in a background context, we can't show a popup.
  // We throw UNAUTHENTICATED and let the UI handle it.
  throw new Error('UNAUTHENTICATED');
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
  let lastError: any = null;

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
          console.log('[Sheets] Refresh successful. Retrying original request...');
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
          localStorage.removeItem('GM_GOOGLE_ACCESS_TOKEN');
          accessToken = null;
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

export async function fetchSheetData(range: string) {
  const sid = getSpreadsheetId();
  const response = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`
  );

  if (!response.ok) {
    if (response.status === 401) throw new Error('UNAUTHENTICATED');
    const errorText = await response.text();
    throw new Error(`Failed to fetch sheet data for ${range}: ${response.statusText}. Details: ${errorText}`);
  }

  return await response.json();
}

export function updateSheetData(range: string, values: SheetGrid) {
  return withSheetToast(_updateSheetData(range, values));
}

async function _updateSheetData(range: string, values: SheetGrid) {
  const sid = getSpreadsheetId();
  const response = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${range}?valueInputOption=USER_ENTERED`,
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

export function appendSheetData(range: string, values: SheetGrid) {
  return withSheetToast(_appendSheetData(range, values));
}

async function _appendSheetData(range: string, values: SheetGrid) {
  const sid = getSpreadsheetId();
  const response = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${range}:append?valueInputOption=USER_ENTERED`,
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

export async function deleteSheetRow(sheetId: number, rowIndex: number) {
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
  return await batchUpdateSpreadsheet(requests);
}

export async function fetchSpreadsheetMetadata() {
  const sid = getSpreadsheetId();
  const response = await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}`);

  if (!response.ok) {
    if (response.status === 401) throw new Error('UNAUTHENTICATED');
    const errorText = await response.text();
    throw new Error(`Failed to fetch metadata: ${errorText}`);
  }

  return await response.json();
}

export async function batchUpdateValues(
  data: Array<{ range: string; values: SheetGrid }>
): Promise<void> {
  const sid = getSpreadsheetId();
  const response = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sid}/values:batchUpdate`,
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

export function batchUpdateSpreadsheet(requests: BatchRequest[]) {
  return withSheetToast(_batchUpdateSpreadsheet(requests));
}

async function _batchUpdateSpreadsheet(requests: BatchRequest[]) {
  const sid = getSpreadsheetId();
  const response = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sid}:batchUpdate`,
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

export async function initializeDatabaseSchema() {
  try {
    const metadata = await fetchSpreadsheetMetadata();
    const existingSheets = metadata.sheets.map((s: any) => s.properties.title);

    const requiredSheets = [
      {
        title: 'Characters',
        headers: ['Player_ID', 'Player_Name', 'Character_Name', 'AC', 'Max_HP', 'Temp_HP', 'Current_HP', 'Current_Condition', 'Passive_Perception', 'Current_Level', 'Status', 'Notes'],
      },
      {
        title: 'Status',
        headers: ['Status_ID', 'Status_Name'],
      },
      {
        title: 'Encounters',
        headers: ['Encounter_ID', 'Encounter_Name', 'Location', 'Difficulty', 'Number_of_NPCs'],
      },
      {
        title: 'Difficulty_Level',
        headers: ['Difficulty_ID', 'Difficulty_Name'],
      },
      {
        title: 'NPCs',
        headers: ['NPC_ID', 'NPC_Name', 'AC', 'Max_HP', 'Temp_HP', 'Current_HP', 'Current_Condition', 'Notes'],
      },
      {
        title: 'Encounter_Combatants',
        headers: ['Encounter_Combatants_ID', 'Encounter_ID', 'Player_ID', 'NPC_ID', 'Quantity'],
      },
    ];

    const missingSheets = requiredSheets.filter(req => !existingSheets.includes(req.title));

    if (missingSheets.length > 0) {
      const createRequests = missingSheets.map(sheet => ({
        addSheet: { properties: { title: sheet.title } },
      }));
      await _batchUpdateSpreadsheet(createRequests);
      await new Promise(r => setTimeout(r, 1000));
    }

    for (const sheet of requiredSheets) {
      try {
        const data = await fetchSheetData(`${sheet.title}!A1:Z1`);
        if (!data.values || data.values.length === 0 || data.values[0].join(',') !== sheet.headers.join(',')) {
          await _updateSheetData(`${sheet.title}!A1:Z1`, [sheet.headers]);
        }
      } catch (e) {
        await _updateSheetData(
          `${sheet.title}!A1:${String.fromCharCode(65 + sheet.headers.length - 1)}1`,
          [sheet.headers]
        );
      }
    }

    return true;
  } catch (error) {
    console.error('[Sheets] initializeDatabaseSchema failed:', error);
    throw error;
  }
}