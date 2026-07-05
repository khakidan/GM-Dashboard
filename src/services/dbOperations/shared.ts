// src/services/dbOperations/shared.ts

import * as sheetsService from '../sheetsService';
import { SheetGrid, BatchRequest, SheetMetadataEntry } from '../sheetsService';
import * as writeQueue from '../writeQueue';
import { serializeSpellcastingAbility } from '../../lib/spellcasting';

// Local proxy wrappers to protect backward compatibility for test spies
export function queueWriteResolved(spreadsheetId: string | undefined, range: string, values: any) {
  if (spreadsheetId) {
    writeQueue.queueWrite(spreadsheetId, range, values);
  } else {
    writeQueue.queueWrite(range, values);
  }
}

export async function fetchSheetData(spreadsheetId: string | undefined, range: string) {
  if (spreadsheetId) return sheetsService.fetchSheetData(spreadsheetId, range);
  return sheetsService.fetchSheetData(range);
}

export async function updateSheetData(spreadsheetId: string | undefined, range: string, values: SheetGrid) {
  if (spreadsheetId) return sheetsService.updateSheetData(spreadsheetId, range, values);
  return sheetsService.updateSheetData(range, values);
}

export async function appendSheetData(spreadsheetId: string | undefined, range: string, values: SheetGrid) {
  if (spreadsheetId) return sheetsService.appendSheetData(spreadsheetId, range, values);
  return sheetsService.appendSheetData(range, values);
}

export async function deleteSheetRow(spreadsheetId: string | undefined, sheetId: number, rowIndex: number) {
  if (spreadsheetId) return sheetsService.deleteSheetRow(spreadsheetId, sheetId, rowIndex);
  return sheetsService.deleteSheetRow(sheetId, rowIndex);
}

export async function fetchSpreadsheetMetadata(spreadsheetId: string | undefined) {
  if (spreadsheetId) return sheetsService.fetchSpreadsheetMetadata(spreadsheetId);
  return sheetsService.fetchSpreadsheetMetadata();
}

export async function batchUpdateSpreadsheet(spreadsheetId: string | undefined, requests: BatchRequest[]) {
  if (spreadsheetId) return sheetsService.batchUpdateSpreadsheet(spreadsheetId, requests);
  return sheetsService.batchUpdateSpreadsheet(requests);
}

export function resolveSpreadsheetId(spreadsheetId: string | undefined): string {
  if (spreadsheetId && typeof spreadsheetId === 'string' && spreadsheetId.trim().length > 0) {
    return spreadsheetId.trim();
  }
  let getSpId = '';
  try {
    const fn = (sheetsService as any).getSpreadsheetId;
    if (typeof fn === 'function') {
      getSpId = fn();
    }
  } catch {
    // Fallback for mock environments
  }
  if (typeof window !== 'undefined') {
    return sheetsService.resolveActiveSpreadsheetId();
  }
  return getSpId || process.env.SPREADSHEET_ID || '';
}

export function castInt(val: unknown, fallback: number = 0): number {
  if (val === null || val === undefined) return fallback;
  const parsed = parseInt(String(val), 10);
  return isNaN(parsed) ? fallback : parsed;
}

export function sanitizeString(val: unknown): string {
  if (!val) return '';
  return String(val).trim();
}

export function getSpellcastingAbilityToSave(
  characterPartial: { spellcastingAbility?: string; proficiencies?: string },
  fullState: { spellcastingAbility?: string; proficiencies?: string }
): string {
  if (characterPartial.spellcastingAbility !== undefined) {
    return serializeSpellcastingAbility(characterPartial.spellcastingAbility as any);
  }
  if (characterPartial.proficiencies) {
    try {
      const parsed = JSON.parse(characterPartial.proficiencies);
      if (parsed && parsed.hasOwnProperty('spellcastingAbility')) {
        return serializeSpellcastingAbility(parsed.spellcastingAbility);
      }
    } catch {}
  }
  if (fullState.spellcastingAbility !== undefined) {
    return serializeSpellcastingAbility(fullState.spellcastingAbility as any);
  }
  if (fullState.proficiencies) {
    try {
      const parsed = JSON.parse(fullState.proficiencies);
      if (parsed && parsed.hasOwnProperty('spellcastingAbility')) {
        return serializeSpellcastingAbility(parsed.spellcastingAbility);
      }
    } catch {}
  }
  return '';
}

export function injectSpellcastingAbility(profJson: string, ability: string): string {
  if (!ability) return profJson;
  try {
    const parsed = JSON.parse(profJson || '{}');
    parsed.spellcastingAbility = ability;
    return JSON.stringify(parsed);
  } catch {
    return profJson;
  }
}

export async function getNextId(sheetName: string, idColumnIndex?: number): Promise<number>;
export async function getNextId(spreadsheetId: string | undefined, sheetName: string, idColumnIndex?: number): Promise<number>;
export async function getNextId(
  arg1: string | undefined,
  arg2?: string | number,
  arg3?: number
): Promise<number> {
  let spreadsheetId: string | undefined;
  let sheetName: string;
  let idColumnIndex = 0;

  if (typeof arg2 === 'string') {
    spreadsheetId = arg1;
    sheetName = arg2;
    idColumnIndex = arg3 ?? 0;
  } else {
    spreadsheetId = undefined;
    sheetName = arg1 as string;
    idColumnIndex = typeof arg2 === 'number' ? arg2 : 0;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const data = await fetchSheetData(resolvedId, `${sheetName}!A2:Z`);
    const rows = data.values || [];
    let maxId = 0;
    for (const row of rows) {
      if (row[idColumnIndex]) {
        const idVal = row[idColumnIndex].toString().replace(/\D/g, '');
        const idNum = castInt(idVal);
        if (idNum > maxId) maxId = idNum;
      }
    }
    return maxId + 1;
  } catch (e) {
    return 1;
  }
}

export async function findRowIndexById(
  spreadsheetId: string | undefined,
  sheetName: string,
  idVal: string,
  idColumnIndex: number = 0
): Promise<number | null> {
  const resolvedId = resolveSpreadsheetId(spreadsheetId);
  const data = await fetchSheetData(resolvedId, `${sheetName}!A2:Z`);
  const rows = data.values || [];
  for (let i = 0; i < rows.length; i++) {
    if (
      rows[i] &&
      rows[i][idColumnIndex] &&
      String(rows[i][idColumnIndex]).trim() === String(idVal).trim()
    ) {
      return i + 1;
    }
  }
  return null;
}

export async function getSheetIds(spreadsheetId: string | undefined): Promise<Record<string, number>> {
  const resolvedId = resolveSpreadsheetId(spreadsheetId);
  const metadata = await fetchSpreadsheetMetadata(resolvedId);
  const res: Record<string, number> = {};
  metadata.sheets.forEach((s: SheetMetadataEntry) => {
    res[s.properties.title] = s.properties.sheetId;
  });
  return res;
}

export async function buildCascadeDeleteRequests(
  spreadsheetId: string | undefined,
  primarySheet: string,
  primaryId: string,
  ecColumnIndex: number,
  ids: Record<string, number>
): Promise<BatchRequest[] | null> {
  const resolvedId = resolveSpreadsheetId(spreadsheetId);
  const rowIdx = await findRowIndexById(resolvedId, primarySheet, primaryId);
  if (rowIdx === null) return null;

  const requests: BatchRequest[] = [
    {
      deleteDimension: {
        range: {
          sheetId: ids[primarySheet],
          dimension: 'ROWS' as const,
          startIndex: rowIdx,
          endIndex: rowIdx + 1,
        },
      },
    },
  ];

  const ecData = await fetchSheetData(resolvedId, 'Encounter_Combatants!A2:Z');
  const ecRows = ecData.values || [];

  const toDelete = ecRows
    .map((row: unknown[], i: number) => ({ row, i }))
    .filter(
      ({ row }: { row: unknown[] }) =>
        row && String(row[ecColumnIndex]).trim() === String(primaryId).trim()
    )
    .map(({ i }: { i: number }) => i + 1)
    .sort((a: number, b: number) => b - a);

  toDelete.forEach((idx: number) => {
    requests.push({
      deleteDimension: {
        range: {
          sheetId: ids['Encounter_Combatants'],
          dimension: 'ROWS' as const,
          startIndex: idx,
          endIndex: idx + 1,
        },
      },
    });
  });

  return requests;
}
