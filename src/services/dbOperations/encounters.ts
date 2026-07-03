// src/services/dbOperations/encounters.ts

import {
  fetchSheetData,
  updateSheetData,
  appendSheetData,
  batchUpdateSpreadsheet,
  resolveSpreadsheetId,
  castInt,
  sanitizeString,
  getNextId,
  findRowIndexById,
  getSheetIds,
  buildCascadeDeleteRequests,
} from './shared';

export async function deleteEncounterFully(encounterId: string): Promise<void>;
export async function deleteEncounterFully(spreadsheetId: string | undefined, encounterId: string): Promise<void>;
export async function deleteEncounterFully(
  arg1: string | undefined,
  arg2?: string
): Promise<void> {
  let spreadsheetId: string | undefined;
  let encounterId: string;
  if (arg2 === undefined) {
    spreadsheetId = undefined;
    encounterId = arg1 as string;
  } else {
    spreadsheetId = arg1;
    encounterId = arg2;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const ids = await getSheetIds(resolvedId);
    // Encounter_ID is column index 1 in Encounter_Combatants
    const requests = await buildCascadeDeleteRequests(resolvedId, 'Encounters', encounterId, 1, ids) || [];

    // Add encounter log deletion
    try {
      const logData = await fetchSheetData(resolvedId, 'EncounterLogs!A2:J');
      const logRows = logData.values || [];
      
      const logsToDelete = logRows
        .map((row, i) => ({ row, i }))
        .filter(({ row }) => row && String(row[1]).trim() === String(encounterId).trim())
        .map(({ i }) => i + 1)
        .sort((a, b) => b - a);

      logsToDelete.forEach(idx => {
        requests.push({
          deleteDimension: {
            range: {
              sheetId: ids['EncounterLogs'],
              dimension: 'ROWS' as const,
              startIndex: idx,
              endIndex: idx + 1,
            },
          },
        });
      });
    } catch (err) {
      console.warn('[DB] Failed to cleanup EncounterLogs during encounter deletion:', err);
    }

    if (requests.length > 0) {
      await batchUpdateSpreadsheet(resolvedId, requests);
    }
  } catch (err) {
    console.error('[DB] deleteEncounterFully failed:', err);
    throw err;
  }
}

export async function addEncounterDB(
  name: string,
  location: string,
  difficultyId: number,
  numberOfNpcs?: number
): Promise<any>;
export async function addEncounterDB(
  spreadsheetId: string | undefined,
  name: string,
  location: string,
  difficultyId: number,
  numberOfNpcs?: number
): Promise<any>;
export async function addEncounterDB(
  arg1: any,
  arg2: any,
  arg3: any,
  arg4?: any,
  arg5?: any
) {
  let spreadsheetId: string | undefined;
  let name: string;
  let location: string;
  let difficultyId: number;
  let numberOfNpcs = 0;

  if (typeof arg3 === 'number') {
    spreadsheetId = undefined;
    name = arg1;
    location = arg2;
    difficultyId = arg3;
    numberOfNpcs = arg4 ?? 0;
  } else {
    spreadsheetId = arg1;
    name = arg2;
    location = arg3;
    difficultyId = arg4;
    numberOfNpcs = arg5 ?? 0;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const nextIdVal = await getNextId(resolvedId, 'Encounters');
    const finalId = nextIdVal.toString();

    const rowData = [
      finalId,
      sanitizeString(name),
      sanitizeString(location),
      difficultyId,
      numberOfNpcs,
      0,
      '',
    ];

    await appendSheetData(resolvedId, 'Encounters!A:G', [rowData]);
    return { id: finalId, name, location, difficultyId, numberOfNpcs, currentRound: 0, activeTurnId: '' };
  } catch (err) {
    console.error('[DB] addEncounterDB failed:', err);
    throw err;
  }
}

export async function updateEncounterStateDB(
  encounterId: string,
  currentRound: number,
  activeTurnId: string
): Promise<void>;
export async function updateEncounterStateDB(
  spreadsheetId: string | undefined,
  encounterId: string,
  currentRound: number,
  activeTurnId: string
): Promise<void>;
export async function updateEncounterStateDB(
  arg1: any,
  arg2: any,
  arg3: any,
  arg4?: any
) {
  let spreadsheetId: string | undefined;
  let encounterId: string;
  let currentRound: number;
  let activeTurnId: string;
  if (arg4 === undefined) {
    spreadsheetId = undefined;
    encounterId = arg1;
    currentRound = arg2;
    activeTurnId = arg3;
  } else {
    spreadsheetId = arg1;
    encounterId = arg2;
    currentRound = arg3;
    activeTurnId = arg4;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const rowIdx = await findRowIndexById(resolvedId, 'Encounters', encounterId);
    if (rowIdx === null) {
      throw new Error(`Encounter ${encounterId} not found`);
    }
    const a1Row = rowIdx + 1;
    await updateSheetData(resolvedId, `Encounters!F${a1Row}:G${a1Row}`, [
      [currentRound.toString(), sanitizeString(activeTurnId)],
    ]);
  } catch (err) {
    console.error('[DB] updateEncounterStateDB failed:', err);
    throw err;
  }
}

export async function clearEncounterStateDB(encounterId: string): Promise<void>;
export async function clearEncounterStateDB(spreadsheetId: string | undefined, encounterId: string): Promise<void>;
export async function clearEncounterStateDB(
  arg1: any,
  arg2?: any
) {
  let spreadsheetId: string | undefined;
  let encounterId: string;
  if (arg2 === undefined) {
    spreadsheetId = undefined;
    encounterId = arg1;
  } else {
    spreadsheetId = arg1;
    encounterId = arg2;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const rowIdx = await findRowIndexById(resolvedId, 'Encounters', encounterId);
    if (rowIdx === null) {
      throw new Error(`Encounter ${encounterId} not found`);
    }
    const a1Row = rowIdx + 1;
    await updateSheetData(resolvedId, `Encounters!F${a1Row}:G${a1Row}`, [
      ['0', ''],
    ]);
  } catch (err) {
    console.error('[DB] clearEncounterStateDB failed:', err);
    throw err;
  }
}

export async function updateEncounterDB(encounterId: string, name: string, location: string, difficultyId: number): Promise<void>;
export async function updateEncounterDB(spreadsheetId: string | undefined, encounterId: string, name: string, location: string, difficultyId: number): Promise<void>;
export async function updateEncounterDB(
  arg1: any,
  arg2: any,
  arg3: any,
  arg4: any,
  arg5?: any
) {
  let spreadsheetId: string | undefined;
  let encounterId: string;
  let name: string;
  let location: string;
  let difficultyId: number;

  if (arg5 === undefined) {
    spreadsheetId = undefined;
    encounterId = arg1;
    name = arg2;
    location = arg3;
    difficultyId = arg4;
  } else {
    spreadsheetId = arg1;
    encounterId = arg2;
    name = arg3;
    location = arg4;
    difficultyId = arg5;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const rowIdx = await findRowIndexById(resolvedId, 'Encounters', encounterId);
    if (rowIdx === null) {
      throw new Error(`Encounter ${encounterId} not found`);
    }
    const a1Row = rowIdx + 1;
    
    const data = await fetchSheetData(resolvedId, `Encounters!A${a1Row}:G${a1Row}`);
    const existingRow = data.values?.[0] || [];
    
    const npcDefinitions = existingRow[4] !== undefined ? String(existingRow[4]) : '';
    const currentRound = existingRow[5] !== undefined ? castInt(existingRow[5], 0) : 0;
    const activeTurnId = existingRow[6] !== undefined ? String(existingRow[6]) : '';

    const rowData = [
      encounterId,
      sanitizeString(name),
      sanitizeString(location),
      difficultyId,
      npcDefinitions,
      currentRound,
      activeTurnId,
    ];

    await updateSheetData(resolvedId, `Encounters!A${a1Row}:G${a1Row}`, [rowData]);
  } catch (err) {
    console.error('[DB] updateEncounterDB failed:', err);
    throw err;
  }
}
