// src/services/dbOperations/index.ts

import { Character, NPC, EncounterCombatant } from '../../types';
import { BatchRequest } from '../sheetsService';
import {
  queueWrite,
  fetchSheetData,
  updateSheetData,
  appendSheetData,
  batchUpdateSpreadsheet,
  resolveSpreadsheetId,
  castInt,
  sanitizeString,
  getSpellcastingAbilityToSave,
  injectSpellcastingAbility,
  getNextId,
  findRowIndexById,
  getSheetIds,
  buildCascadeDeleteRequests,
} from './shared';

// Re-export everything from shared to preserve full public API compatibility
export * from './shared';
export * from './encounterLogs';
export * from './npcs';
export * from './characters';

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

export async function addEncounterCombatantDB(
  encounterId: string,
  playerId: string | null,
  npcId: string | null,
  quantity: number
): Promise<EncounterCombatant[]>;
export async function addEncounterCombatantDB(
  spreadsheetId: string | undefined,
  encounterId: string,
  playerId: string | null,
  npcId: string | null,
  quantity: number
): Promise<EncounterCombatant[]>;
export async function addEncounterCombatantDB(
  arg1: any,
  arg2: any,
  arg3?: any,
  arg4?: any,
  arg5?: any
) {
  let spreadsheetId: string | undefined;
  let encounterId: string;
  let playerId: string | null;
  let npcId: string | null;
  let quantity: number;

  if (arg5 === undefined) {
    spreadsheetId = undefined;
    encounterId = arg1;
    playerId = arg2;
    npcId = arg3;
    quantity = arg4;
  } else {
    spreadsheetId = arg1;
    encounterId = arg2;
    playerId = arg3;
    npcId = arg4;
    quantity = arg5;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const startIdVal = await getNextId(resolvedId, 'Encounter_Combatants');
    const created: EncounterCombatant[] = [];
    
    const count = quantity <= 0 ? 1 : quantity;

    for (let i = 0; i < count; i++) {
      const finalId = (startIdVal + i).toString();
      const rowData = [
        finalId,
        encounterId,
        playerId || '',
        npcId || '',
        1,
        0,
        '',
        -1,
        0,
        '',
        0,
      ];

      await appendSheetData(resolvedId, 'Encounter_Combatants!A:K', [rowData]);
      created.push({
        id: finalId,
        encounterId,
        playerId,
        npcId,
        quantity: 1,
        initiative: 0,
        conditionTimers: {},
        npcCurrentHp: -1,
        npcTempHp: 0,
        npcCurrentConditions: '',
        npcTempAcMod: 0,
      });
    }
    return created;
  } catch (err) {
    console.error('[DB] addEncounterCombatantDB failed:', err);
    throw err;
  }
}

export async function updateEncounterCombatantQuantityDB(ecId: string, newQty: number): Promise<void>;
export async function updateEncounterCombatantQuantityDB(spreadsheetId: string | undefined, ecId: string, newQty: number): Promise<void>;
export async function updateEncounterCombatantQuantityDB(
  arg1: any,
  arg2: any,
  arg3?: any
) {
  let spreadsheetId: string | undefined;
  let ecId: string;
  let newQty: number;
  if (arg3 === undefined) {
    spreadsheetId = undefined;
    ecId = arg1;
    newQty = arg2;
  } else {
    spreadsheetId = arg1;
    ecId = arg2;
    newQty = arg3;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const rowIdx = await findRowIndexById(resolvedId, 'Encounter_Combatants', ecId);
    if (rowIdx === null) {
      throw new Error(`Encounter Combatant ${ecId} not found`);
    }
    const a1Row = rowIdx + 1;
    await updateSheetData(resolvedId, `Encounter_Combatants!E${a1Row}`, [[newQty.toString()]]);
  } catch (err) {
    console.error('[DB] updateEncounterCombatantQuantityDB failed:', err);
    throw err;
  }
}

export async function updateInitiativeDB(ecId: string, initiative: number): Promise<void>;
export async function updateInitiativeDB(spreadsheetId: string | undefined, ecId: string, initiative: number): Promise<void>;
export async function updateInitiativeDB(
  arg1: any,
  arg2: any,
  arg3?: any
) {
  let spreadsheetId: string | undefined;
  let ecId: string;
  let initiative: number;
  if (arg3 === undefined) {
    spreadsheetId = undefined;
    ecId = arg1;
    initiative = arg2;
  } else {
    spreadsheetId = arg1;
    ecId = arg2;
    initiative = arg3;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const rowIdx = await findRowIndexById(resolvedId, 'Encounter_Combatants', ecId);
    if (rowIdx === null) {
      throw new Error(`Encounter Combatant ${ecId} not found`);
    }
    const a1Row = rowIdx + 1;
    await updateSheetData(resolvedId, `Encounter_Combatants!F${a1Row}`, [[initiative.toString()]]);
  } catch (err) {
    console.error('[DB] updateInitiativeDB failed:', err);
    throw err;
  }
}

export async function updateConditionTimersDB(ecId: string, timers: Record<string, number>): Promise<void>;
export async function updateConditionTimersDB(spreadsheetId: string | undefined, ecId: string, timers: Record<string, number>): Promise<void>;
export async function updateConditionTimersDB(
  arg1: any,
  arg2: any,
  arg3?: any
) {
  let spreadsheetId: string | undefined;
  let ecId: string;
  let timers: Record<string, number>;
  if (arg3 === undefined) {
    spreadsheetId = undefined;
    ecId = arg1;
    timers = arg2;
  } else {
    spreadsheetId = arg1;
    ecId = arg2;
    timers = arg3;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const rowIdx = await findRowIndexById(resolvedId, 'Encounter_Combatants', ecId);
    if (rowIdx === null) {
      throw new Error(`Encounter Combatant ${ecId} not found`);
    }
    const a1Row = rowIdx + 1;
    const jsonStr = JSON.stringify(timers);
    await updateSheetData(resolvedId, `Encounter_Combatants!G${a1Row}`, [[jsonStr]]);
  } catch (err) {
    console.error('[DB] updateConditionTimersDB failed:', err);
    throw err;
  }
}

export async function updateNpcInstanceHpDB(ecId: string, currentHp: number, tempHp: number): Promise<void>;
export async function updateNpcInstanceHpDB(spreadsheetId: string | undefined, ecId: string, currentHp: number, tempHp: number): Promise<void>;
export async function updateNpcInstanceHpDB(
  arg1: any,
  arg2: any,
  arg3: any,
  arg4?: any
) {
  let spreadsheetId: string | undefined;
  let ecId: string;
  let currentHp: number;
  let tempHp: number;
  if (arg4 === undefined) {
    spreadsheetId = undefined;
    ecId = arg1;
    currentHp = arg2;
    tempHp = arg3;
  } else {
    spreadsheetId = arg1;
    ecId = arg2;
    currentHp = arg3;
    tempHp = arg4;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const rowIdx = await findRowIndexById(resolvedId, 'Encounter_Combatants', ecId);
    if (rowIdx === null) {
      throw new Error(`Encounter Combatant ${ecId} not found`);
    }
    const a1Row = rowIdx + 1;
    await updateSheetData(resolvedId, `Encounter_Combatants!H${a1Row}:I${a1Row}`, [
      [currentHp.toString(), tempHp.toString()],
    ]);
  } catch (err) {
    console.error('[DB] updateNpcInstanceHpDB failed:', err);
    throw err;
  }
}

export async function updateNpcInstanceConditionsDB(ecId: string, conditions: string): Promise<void>;
export async function updateNpcInstanceConditionsDB(spreadsheetId: string | undefined, ecId: string, conditions: string): Promise<void>;
export async function updateNpcInstanceConditionsDB(
  arg1: any,
  arg2: any,
  arg3?: any
) {
  let spreadsheetId: string | undefined;
  let ecId: string;
  let conditions: string;
  if (arg3 === undefined) {
    spreadsheetId = undefined;
    ecId = arg1;
    conditions = arg2;
  } else {
    spreadsheetId = arg1;
    ecId = arg2;
    conditions = arg3;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const rowIdx = await findRowIndexById(resolvedId, 'Encounter_Combatants', ecId);
    if (rowIdx === null) {
      throw new Error(`Encounter Combatant ${ecId} not found`);
    }
    const a1Row = rowIdx + 1;
    await updateSheetData(resolvedId, `Encounter_Combatants!J${a1Row}`, [
      [conditions],
    ]);
  } catch (err) {
    console.error('[DB] updateNpcInstanceConditionsDB failed:', err);
    throw err;
  }
}

export async function updateNpcInstanceAcModDB(ecId: string, acMod: number): Promise<void>;
export async function updateNpcInstanceAcModDB(spreadsheetId: string | undefined, ecId: string, acMod: number): Promise<void>;
export async function updateNpcInstanceAcModDB(
  arg1: any,
  arg2: any,
  arg3?: any
) {
  let spreadsheetId: string | undefined;
  let ecId: string;
  let acMod: number;
  if (arg3 === undefined) {
    spreadsheetId = undefined;
    ecId = arg1;
    acMod = arg2;
  } else {
    spreadsheetId = arg1;
    ecId = arg2;
    acMod = arg3;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const rowIdx = await findRowIndexById(resolvedId, 'Encounter_Combatants', ecId);
    if (rowIdx === null) {
      throw new Error(`Encounter Combatant ${ecId} not found`);
    }

    const a1Row = rowIdx + 1;
    await updateSheetData(resolvedId, `Encounter_Combatants!K${a1Row}`, [
      [acMod.toString()],
    ]);
  } catch (err) {
    console.error('[DB] updateNpcInstanceAcModDB failed:', err);
    throw err;
  }
}

export async function deleteEncounterCombatantDB(ecId: string): Promise<void>;
export async function deleteEncounterCombatantDB(spreadsheetId: string | undefined, ecId: string): Promise<void>;
export async function deleteEncounterCombatantDB(
  arg1: any,
  arg2?: any
) {
  let spreadsheetId: string | undefined;
  let ecId: string;
  if (arg2 === undefined) {
    spreadsheetId = undefined;
    ecId = arg1;
  } else {
    spreadsheetId = arg1;
    ecId = arg2;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const ids = await getSheetIds(resolvedId);
    const rowIdx = await findRowIndexById(resolvedId, 'Encounter_Combatants', ecId);
    if (rowIdx === null) return;

    await batchUpdateSpreadsheet(resolvedId, [
      {
        deleteDimension: {
          range: {
            sheetId: ids['Encounter_Combatants'],
            dimension: 'ROWS',
            startIndex: rowIdx,
            endIndex: rowIdx + 1,
          },
        },
      },
    ]);
  } catch (err) {
    console.error('[DB] deleteEncounterCombatantDB failed:', err);
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


