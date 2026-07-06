// src/services/dbOperations/encounterCombatants.ts

import { EncounterCombatant } from '../../types';
import {
  resolveSpreadsheetId,
  getNextId,
  appendSheetData,
  findRowIndexById,
  updateSheetData,
  getSheetIds,
  batchUpdateSpreadsheet,
} from './shared';

export async function addEncounterCombatantDB(
  encounterId: string,
  playerId: string | null,
  npcId: string | null,
  quantity: number,
  legendaryActionsMax?: number,
  legendaryResistancesMax?: number
): Promise<EncounterCombatant[]>;
export async function addEncounterCombatantDB(
  spreadsheetId: string | undefined,
  encounterId: string,
  playerId: string | null,
  npcId: string | null,
  quantity: number,
  legendaryActionsMax?: number,
  legendaryResistancesMax?: number
): Promise<EncounterCombatant[]>;
export async function addEncounterCombatantDB(
  arg1: any,
  arg2: any,
  arg3?: any,
  arg4?: any,
  arg5?: any,
  arg6?: any,
  arg7?: any
) {
  let spreadsheetId: string | undefined;
  let encounterId: string;
  let playerId: string | null;
  let npcId: string | null;
  let quantity: number;
  let legendaryActionsMax = 0;
  let legendaryResistancesMax = 0;

  if (typeof arg4 === 'number') {
    spreadsheetId = undefined;
    encounterId = arg1;
    playerId = arg2;
    npcId = arg3;
    quantity = arg4;
    legendaryActionsMax = arg5 ?? 0;
    legendaryResistancesMax = arg6 ?? 0;
  } else {
    spreadsheetId = arg1;
    encounterId = arg2;
    playerId = arg3;
    npcId = arg4;
    quantity = arg5;
    legendaryActionsMax = arg6 ?? 0;
    legendaryResistancesMax = arg7 ?? 0;
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
        legendaryActionsMax,
        legendaryResistancesMax,
        '{}',
      ];

      await appendSheetData(resolvedId, 'Encounter_Combatants!A:N', [rowData]);
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
        npcLegendaryActionsRemaining: legendaryActionsMax,
        npcLegendaryResistancesRemaining: legendaryResistancesMax,
        npcRechargeState: '{}',
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
): Promise<void> {
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

export async function updateNpcInstanceLegendaryDB(ecId: string, legendaryActionsRemaining: number, legendaryResistancesRemaining: number): Promise<void>;
export async function updateNpcInstanceLegendaryDB(spreadsheetId: string | undefined, ecId: string, legendaryActionsRemaining: number, legendaryResistancesRemaining: number): Promise<void>;
export async function updateNpcInstanceLegendaryDB(
  arg1: any,
  arg2: any,
  arg3: any,
  arg4?: any
) {
  let spreadsheetId: string | undefined;
  let ecId: string;
  let legendaryActionsRemaining: number;
  let legendaryResistancesRemaining: number;

  if (arg4 === undefined) {
    spreadsheetId = undefined;
    ecId = arg1;
    legendaryActionsRemaining = arg2;
    legendaryResistancesRemaining = arg3;
  } else {
    spreadsheetId = arg1;
    ecId = arg2;
    legendaryActionsRemaining = arg3;
    legendaryResistancesRemaining = arg4;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const rowIdx = await findRowIndexById(resolvedId, 'Encounter_Combatants', ecId);
    if (rowIdx === null) {
      throw new Error(`Encounter Combatant ${ecId} not found`);
    }
    const a1Row = rowIdx + 1;
    await updateSheetData(resolvedId, `Encounter_Combatants!L${a1Row}:M${a1Row}`, [
      [legendaryActionsRemaining.toString(), legendaryResistancesRemaining.toString()],
    ]);
  } catch (err) {
    console.error('[DB] updateNpcInstanceLegendaryDB failed:', err);
    throw err;
  }
}

export async function updateNpcInstanceRechargeDB(ecId: string, rechargeState: Record<string, boolean>): Promise<void>;
export async function updateNpcInstanceRechargeDB(spreadsheetId: string | undefined, ecId: string, rechargeState: Record<string, boolean>): Promise<void>;
export async function updateNpcInstanceRechargeDB(
  arg1: any,
  arg2: any,
  arg3?: any
) {
  let spreadsheetId: string | undefined;
  let ecId: string;
  let rechargeState: Record<string, boolean>;

  if (arg3 === undefined) {
    spreadsheetId = undefined;
    ecId = arg1;
    rechargeState = arg2;
  } else {
    spreadsheetId = arg1;
    ecId = arg2;
    rechargeState = arg3;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const rowIdx = await findRowIndexById(resolvedId, 'Encounter_Combatants', ecId);
    if (rowIdx === null) {
      throw new Error(`Encounter Combatant ${ecId} not found`);
    }
    const a1Row = rowIdx + 1;
    const jsonStr = JSON.stringify(rechargeState);
    await updateSheetData(resolvedId, `Encounter_Combatants!N${a1Row}`, [
      [jsonStr],
    ]);
  } catch (err) {
    console.error('[DB] updateNpcInstanceRechargeDB failed:', err);
    throw err;
  }
}
