// src/services/dbOperations/encounterLogs.ts

import { BatchRequest } from '../sheetsService';
import {
  resolveSpreadsheetId,
  appendSheetData,
  fetchSheetData,
  getSheetIds,
  findRowIndexById,
  batchUpdateSpreadsheet,
} from './shared';

export async function appendEncounterLog(
  log: {
    id: string;
    encounterId: string;
    encounterName: string;
    location: string;
    date: string;
    durationRounds: number;
    outcome: string;
    partySnapshot: string;
    events: string;
    transcript: string;
  }
): Promise<void>;
export async function appendEncounterLog(
  spreadsheetId: string | undefined,
  log: {
    id: string;
    encounterId: string;
    encounterName: string;
    location: string;
    date: string;
    durationRounds: number;
    outcome: string;
    partySnapshot: string;
    events: string;
    transcript: string;
  }
): Promise<void>;
export async function appendEncounterLog(
  arg1: any,
  arg2?: any
): Promise<void> {
  let spreadsheetId: string | undefined;
  let log: {
    id: string;
    encounterId: string;
    encounterName: string;
    location: string;
    date: string;
    durationRounds: number;
    outcome: string;
    partySnapshot: string;
    events: string;
    transcript: string;
  };
  if (arg2 === undefined) {
    spreadsheetId = undefined;
    log = arg1;
  } else {
    spreadsheetId = arg1;
    log = arg2;
  }
  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const rowData = [
      log.id,
      log.encounterId,
      log.encounterName,
      log.location,
      log.date,
      log.durationRounds,
      log.outcome,
      log.partySnapshot,
      log.events,
      log.transcript
    ];
    await appendSheetData(resolvedId, 'EncounterLogs!A:J', [rowData]);
  } catch (err) {
    console.error('[DB] appendEncounterLog failed:', err);
    throw err;
  }
}

export async function readEncounterLogs(spreadsheetId?: string): Promise<any[][]> {
  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const data = await fetchSheetData(resolvedId, 'EncounterLogs!A2:J');
    return data.values || [];
  } catch (err) {
    console.error('[DB] readEncounterLogs failed:', err);
    throw err;
  }
}

export async function deleteEncounterLog(logId: string): Promise<void>;
export async function deleteEncounterLog(spreadsheetId: string | undefined, logId: string): Promise<void>;
export async function deleteEncounterLog(
  arg1: any,
  arg2?: any
): Promise<void> {
  let spreadsheetId: string | undefined;
  let logId: string;
  if (arg2 === undefined) {
    spreadsheetId = undefined;
    logId = arg1;
  } else {
    spreadsheetId = arg1;
    logId = arg2;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const ids = await getSheetIds(resolvedId);
    const rowIdx = await findRowIndexById(resolvedId, 'EncounterLogs', logId);
    if (rowIdx === null) {
      throw new Error(`Encounter log ${logId} not found`);
    }

    const requests: BatchRequest[] = [
      {
        deleteDimension: {
          range: {
            sheetId: ids['EncounterLogs'],
            dimension: 'ROWS' as const,
            startIndex: rowIdx,
            endIndex: rowIdx + 1,
          },
        },
      },
    ];

    await batchUpdateSpreadsheet(resolvedId, requests);
  } catch (err) {
    console.error('[DB] deleteEncounterLog failed:', err);
    throw err;
  }
}
