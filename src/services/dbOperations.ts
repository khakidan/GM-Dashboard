// src/services/dbOperations.ts

import * as sheetsService from './sheetsService';
import { SheetGrid, BatchRequest, SheetMetadataEntry } from './sheetsService';
import * as writeQueue from './writeQueue';
import { Character, Encounter, NPC, EncounterCombatant } from '../types';
import { STORAGE_KEYS } from '../lib/constants';
import { serializeSpellcastingAbility } from '../lib/spellcasting';
import { parseProficiencies } from '../lib/abilityScores';

// Local proxy wrappers to protect backward compatibility for test spies
function queueWrite(spreadsheetId: string | undefined, range: string, values: any) {
  if (spreadsheetId) {
    writeQueue.queueWrite(spreadsheetId, range, values);
  } else {
    writeQueue.queueWrite(range, values);
  }
}

async function fetchSheetData(spreadsheetId: string | undefined, range: string) {
  if (spreadsheetId) return sheetsService.fetchSheetData(spreadsheetId, range);
  return sheetsService.fetchSheetData(range);
}
async function updateSheetData(spreadsheetId: string | undefined, range: string, values: SheetGrid) {
  if (spreadsheetId) return sheetsService.updateSheetData(spreadsheetId, range, values);
  return sheetsService.updateSheetData(range, values);
}
async function appendSheetData(spreadsheetId: string | undefined, range: string, values: SheetGrid) {
  if (spreadsheetId) return sheetsService.appendSheetData(spreadsheetId, range, values);
  return sheetsService.appendSheetData(range, values);
}
async function deleteSheetRow(spreadsheetId: string | undefined, sheetId: number, rowIndex: number) {
  if (spreadsheetId) return sheetsService.deleteSheetRow(spreadsheetId, sheetId, rowIndex);
  return sheetsService.deleteSheetRow(sheetId, rowIndex);
}
async function fetchSpreadsheetMetadata(spreadsheetId: string | undefined) {
  if (spreadsheetId) return sheetsService.fetchSpreadsheetMetadata(spreadsheetId);
  return sheetsService.fetchSpreadsheetMetadata();
}
async function batchUpdateSpreadsheet(spreadsheetId: string | undefined, requests: BatchRequest[]) {
  if (spreadsheetId) return sheetsService.batchUpdateSpreadsheet(spreadsheetId, requests);
  return sheetsService.batchUpdateSpreadsheet(requests);
}

function resolveSpreadsheetId(spreadsheetId: string | undefined): string {
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
    return localStorage.getItem(STORAGE_KEYS.activeCampaignSpreadsheetId) ||
           localStorage.getItem(STORAGE_KEYS.spreadsheetId) ||
           getSpId ||
           import.meta.env.VITE_SPREADSHEET_ID || '';
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

function getSpellcastingAbilityToSave(
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

function injectSpellcastingAbility(profJson: string, ability: string): string {
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

async function findRowIndexById(
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

async function getSheetIds(spreadsheetId: string | undefined): Promise<Record<string, number>> {
  const resolvedId = resolveSpreadsheetId(spreadsheetId);
  const metadata = await fetchSpreadsheetMetadata(resolvedId);
  const res: Record<string, number> = {};
  metadata.sheets.forEach((s: SheetMetadataEntry) => {
    res[s.properties.title] = s.properties.sheetId;
  });
  return res;
}

// ✅ Shared helper — consolidates the duplicated logic from deleteCharacterFully
// and deleteEncounterFully. Both functions delete one row from a primary sheet
// and then cascade-delete matching rows from Encounter_Combatants.
async function buildCascadeDeleteRequests(
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

export async function deleteCharacterFully(playerId: string): Promise<void>;
export async function deleteCharacterFully(spreadsheetId: string | undefined, playerId: string): Promise<void>;
export async function deleteCharacterFully(
  arg1: string | undefined,
  arg2?: string
): Promise<void> {
  let spreadsheetId: string | undefined;
  let playerId: string;
  if (arg2 === undefined) {
    spreadsheetId = undefined;
    playerId = arg1 as string;
  } else {
    spreadsheetId = arg1;
    playerId = arg2;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const ids = await getSheetIds(resolvedId);
    // Player_ID is column index 2 in Encounter_Combatants
    const requests = await buildCascadeDeleteRequests(resolvedId, 'Characters', playerId, 2, ids);
    if (requests && requests.length > 0) {
      await batchUpdateSpreadsheet(resolvedId, requests);
    }
  } catch (err) {
    console.error('[DB] deleteCharacterFully failed:', err);
    throw err;
  }
}

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
    const requests = await buildCascadeDeleteRequests(resolvedId, 'Encounters', encounterId, 1, ids);
    if (requests && requests.length > 0) {
      await batchUpdateSpreadsheet(resolvedId, requests);
    }
  } catch (err) {
    console.error('[DB] deleteEncounterFully failed:', err);
    throw err;
  }
}

export async function addCharacterDB(character: Partial<Character>): Promise<Partial<Character> & { id: string }>;
export async function addCharacterDB(spreadsheetId: string | undefined, character: Partial<Character>): Promise<Partial<Character> & { id: string }>;
export async function addCharacterDB(
  arg1: string | undefined | Partial<Character>,
  arg2?: Partial<Character>
) {
  let spreadsheetId: string | undefined;
  let character: Partial<Character>;
  if (arg2 === undefined && typeof arg1 === 'object' && arg1 !== null) {
    spreadsheetId = undefined;
    character = arg1 as Partial<Character>;
  } else {
    spreadsheetId = arg1 as string | undefined;
    character = arg2 as Partial<Character>;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const nextIdVal = await getNextId(resolvedId, 'Characters');
    const finalId = `pc-${nextIdVal}`;

    const rowData = [
      finalId,
      sanitizeString(character.playerName),
      sanitizeString(character.characterName),
      castInt(character.ac, 10),
      castInt(character.maxHp, 10),
      castInt(character.tempHp, 0),
      castInt(character.currentHp, 10),
      sanitizeString(character.conditions),
      castInt(character.passivePerception, 10),
      castInt(character.level, 1),
      castInt(character.statusId, 1),
      sanitizeString(character.notes),
      sanitizeString(character.resistances || ''),
      sanitizeString(character.immunities || ''),
      sanitizeString(character.vulnerabilities || ''),
      castInt(character.tempHpMax, 0),
      castInt(character.tempAc, 0),
      castInt(character.deathSavesFails, 0),
      castInt(character.deathSavesSuccesses, 0),
      sanitizeString(character.class || ''), // [19] class name
      sanitizeString(character.hitDiceConfig || ''),
      sanitizeString(character.hitDiceUsed || '{}'),
      sanitizeString(character.resourcePools || '[]'),
      sanitizeString(character.abilityScores || '{}'),
      injectSpellcastingAbility(
        sanitizeString(character.proficiencies || '{}'),
        getSpellcastingAbilityToSave(character, {})
      ),
      getSpellcastingAbilityToSave(character, {}),
    ];

    await appendSheetData(resolvedId, 'Characters!A:Z', [rowData]);
    return {
      ...character,
      id: finalId,
      class: character.class ?? '',
      tempHpMax: character.tempHpMax ?? 0,
      tempAc: character.tempAc ?? 0,
      deathSavesFails: character.deathSavesFails ?? 0,
      deathSavesSuccesses: character.deathSavesSuccesses ?? 0,
      hitDiceConfig: character.hitDiceConfig ?? '',
      hitDiceUsed: character.hitDiceUsed ?? '{}',
      resourcePools: character.resourcePools ?? '[]',
      abilityScores: character.abilityScores ?? '{}',
      proficiencies: character.proficiencies ?? '{}',
      spellcastingAbility: character.spellcastingAbility ?? getSpellcastingAbilityToSave(character, {}),
    };
  } catch (err) {
    console.error('[DB] addCharacterDB failed:', err);
    throw err;
  }
}

export async function updateCharacterDB(character: Partial<Character>, fullState: Character): Promise<void>;
export async function updateCharacterDB(spreadsheetId: string | undefined, character: Partial<Character>, fullState: Character): Promise<void>;
export async function updateCharacterDB(
  arg1: any,
  arg2: any,
  arg3?: any
): Promise<void> {
  let spreadsheetId: string | undefined;
  let character: Partial<Character>;
  let fullState: Character;
  if (arg3 === undefined) {
    spreadsheetId = undefined;
    character = arg1;
    fullState = arg2;
  } else {
    spreadsheetId = arg1;
    character = arg2;
    fullState = arg3;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const charRowIdx = await findRowIndexById(resolvedId, 'Characters', fullState.id);
    if (charRowIdx === null) {
      throw new Error('Character not found');
    }

    const rowData = [
      fullState.id,
      sanitizeString(character.playerName ?? fullState.playerName),
      sanitizeString(character.characterName ?? fullState.characterName),
      castInt(character.ac ?? fullState.ac),
      castInt(character.maxHp ?? fullState.maxHp),
      castInt(character.tempHp ?? fullState.tempHp, 0),
      castInt(character.currentHp ?? fullState.currentHp),
      sanitizeString(character.conditions ?? fullState.conditions),
      castInt(character.passivePerception ?? fullState.passivePerception),
      castInt(character.level ?? fullState.level),
      castInt(character.statusId ?? fullState.statusId),
      sanitizeString(character.notes ?? fullState.notes),
      sanitizeString(character.resistances ?? fullState.resistances ?? ''),
      sanitizeString(character.immunities ?? fullState.immunities ?? ''),
      sanitizeString(character.vulnerabilities ?? fullState.vulnerabilities ?? ''),
      castInt(character.tempHpMax ?? fullState.tempHpMax, 0),
      castInt(character.tempAc ?? fullState.tempAc, 0),
      castInt(character.deathSavesFails ?? fullState.deathSavesFails, 0),
      castInt(character.deathSavesSuccesses ?? fullState.deathSavesSuccesses, 0),
      sanitizeString(character.class ?? fullState.class ?? ''), // [19] class
      sanitizeString(character.hitDiceConfig ?? fullState.hitDiceConfig ?? ''),
      sanitizeString(character.hitDiceUsed ?? fullState.hitDiceUsed ?? '{}'),
      sanitizeString(character.resourcePools ?? fullState.resourcePools ?? '[]'),
      sanitizeString(character.abilityScores ?? fullState.abilityScores ?? '{}'),
      injectSpellcastingAbility(
        sanitizeString(character.proficiencies ?? fullState.proficiencies ?? '{}'),
        getSpellcastingAbilityToSave(character, fullState)
      ),
      getSpellcastingAbilityToSave(character, fullState),
    ];

    const a1Row = charRowIdx + 1;
    queueWrite(resolvedId, `Characters!A${a1Row}:Z${a1Row}`, [rowData]);
  } catch (err) {
    console.error('[DB] updateCharacterDB failed:', err);
    throw err;
  }
}

export async function addNpcDB(
  npcData: Omit<NPC, 'id' | 'sheetRowIndex'>
): Promise<NPC>;
export async function addNpcDB(
  spreadsheetId: string | undefined,
  npcData: Omit<NPC, 'id' | 'sheetRowIndex'>
): Promise<NPC>;
export async function addNpcDB(
  arg1: any,
  arg2?: any
): Promise<NPC> {
  let spreadsheetId: string | undefined;
  let npcData: Omit<NPC, 'id' | 'sheetRowIndex'>;

  if (arg2 === undefined) {
    spreadsheetId = undefined;
    npcData = arg1;
  } else {
    spreadsheetId = arg1;
    npcData = arg2;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const nextIdVal = await getNextId(resolvedId, 'NPCs');
    const finalId = nextIdVal.toString();

    const rowData = [
      finalId,
      sanitizeString(npcData.name),
      castInt(npcData.ac, 10),
      castInt(npcData.maxHp, 1),
      0,                  // Temp HP
      castInt(npcData.maxHp, 1),  // Current HP
      '',                 // Condition
      sanitizeString(npcData.notes),
      sanitizeString(npcData.resistances ?? ''),
      sanitizeString(npcData.immunities ?? ''),
      sanitizeString(npcData.vulnerabilities ?? ''),
      castInt(npcData.legendaryActions ?? 0, 0),
      castInt(npcData.legendaryResistances ?? 0, 0),
      JSON.stringify(npcData.rechargeAbilities ?? []),
      sanitizeString(npcData.abilityScores ?? '{}'),
      injectSpellcastingAbility(
        sanitizeString(npcData.proficiencies ?? '{}'),
        getSpellcastingAbilityToSave(npcData, npcData)
      ),
      sanitizeString(npcData.speed ?? ''),
      sanitizeString(npcData.senses ?? ''),
      sanitizeString(npcData.languages ?? ''),
      sanitizeString(npcData.challengeRating ?? ''),
      sanitizeString(npcData.traits ?? '[]'),
      sanitizeString(npcData.actions ?? '[]'),
      sanitizeString(npcData.reactions ?? '[]'),
      sanitizeString(npcData.legendaryActionsList ?? '[]'),
      getSpellcastingAbilityToSave(npcData, npcData),
    ];

    await appendSheetData(resolvedId, 'NPCs!A:Y', [rowData]);
    return {
      id: finalId,
      name: npcData.name,
      ac: npcData.ac,
      maxHp: npcData.maxHp,
      tempHp: 0,
      currentHp: npcData.maxHp,
      conditions: '',
      notes: npcData.notes,
      resistances: npcData.resistances ?? '',
      immunities: npcData.immunities ?? '',
      vulnerabilities: npcData.vulnerabilities ?? '',
      legendaryActions: npcData.legendaryActions ?? 0,
      legendaryResistances: npcData.legendaryResistances ?? 0,
      rechargeAbilities: npcData.rechargeAbilities ?? [],
      abilityScores: npcData.abilityScores ?? '{}',
      proficiencies: npcData.proficiencies ?? '{}',
      speed: npcData.speed ?? '',
      senses: npcData.senses ?? '',
      languages: npcData.languages ?? '',
      challengeRating: npcData.challengeRating ?? '',
      traits: npcData.traits ?? '[]',
      actions: npcData.actions ?? '[]',
      reactions: npcData.reactions ?? '[]',
      legendaryActionsList: npcData.legendaryActionsList ?? '[]',
      spellcastingAbility: npcData.spellcastingAbility ?? '',
    };
  } catch (err) {
    console.error('[DB] addNpcDB failed:', err);
    throw err;
  }
}

export async function updateNpcFullDB(npc: NPC): Promise<void>;
export async function updateNpcFullDB(spreadsheetId: string | undefined, npc: NPC): Promise<void>;
export async function updateNpcFullDB(
  arg1: any,
  arg2?: any
) {
  let spreadsheetId: string | undefined;
  let npc: NPC;
  if (arg2 === undefined) {
    spreadsheetId = undefined;
    npc = arg1;
  } else {
    spreadsheetId = arg1;
    npc = arg2;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const rowIdx = await findRowIndexById(resolvedId, 'NPCs', npc.id);
    if (rowIdx === null) {
      throw new Error(`NPC ${npc.id} not found`);
    }
    const a1Row = rowIdx + 1;
    const rowData = [
      npc.id,
      sanitizeString(npc.name),
      castInt(npc.ac, 10),
      castInt(npc.maxHp, 1),
      castInt(npc.tempHp, 0),
      castInt(npc.currentHp, 1),
      sanitizeString(npc.conditions),
      sanitizeString(npc.notes),
      sanitizeString(npc.resistances || ''),
      sanitizeString(npc.immunities || ''),
      sanitizeString(npc.vulnerabilities || ''),
      castInt(npc.legendaryActions ?? 0, 0),
      castInt(npc.legendaryResistances ?? 0, 0),
      JSON.stringify(npc.rechargeAbilities ?? []),
      sanitizeString(npc.abilityScores || '{}'),
      injectSpellcastingAbility(
        sanitizeString(npc.proficiencies || '{}'),
        getSpellcastingAbilityToSave(npc, npc)
      ),
      npc.speed ?? '',
      npc.senses ?? '',
      npc.languages ?? '',
      npc.challengeRating ?? '',
      npc.traits ?? '[]',
      npc.actions ?? '[]',
      npc.reactions ?? '[]',
      npc.legendaryActionsList ?? '[]',
      getSpellcastingAbilityToSave(npc, npc),
    ];

    queueWrite(resolvedId, `NPCs!A${a1Row}:Y${a1Row}`, [rowData]);
  } catch (err) {
    console.error('[DB] updateNpcFullDB failed:', err);
    throw err;
  }
}

export async function deleteNpcDB(npcId: string): Promise<void>;
export async function deleteNpcDB(spreadsheetId: string | undefined, npcId: string): Promise<void>;
export async function deleteNpcDB(
  arg1: any,
  arg2?: any
) {
  let spreadsheetId: string | undefined;
  let npcId: string;
  if (arg2 === undefined) {
    spreadsheetId = undefined;
    npcId = arg1;
  } else {
    spreadsheetId = arg1;
    npcId = arg2;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const ids = await getSheetIds(resolvedId);
    const rowIdx = await findRowIndexById(resolvedId, 'NPCs', npcId);
    if (rowIdx === null) {
      throw new Error(`NPC ${npcId} not found`);
    }

    const requests = await buildCascadeDeleteRequests(resolvedId, 'NPCs', npcId, 3, ids);
    if (requests && requests.length > 0) {
      await batchUpdateSpreadsheet(resolvedId, requests);
    }
  } catch (err) {
    console.error('[DB] deleteNpcDB failed:', err);
    throw err;
  }
}

export async function resetNpcHpDB(npcId: string, maxHp: number): Promise<void>;
export async function resetNpcHpDB(spreadsheetId: string | undefined, npcId: string, maxHp: number): Promise<void>;
export async function resetNpcHpDB(
  arg1: any,
  arg2: any,
  arg3?: any
) {
  let spreadsheetId: string | undefined;
  let npcId: string;
  let maxHp: number;
  if (arg3 === undefined) {
    spreadsheetId = undefined;
    npcId = arg1;
    maxHp = arg2;
  } else {
    spreadsheetId = arg1;
    npcId = arg2;
    maxHp = arg3;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const rowIdx = await findRowIndexById(resolvedId, 'NPCs', npcId);
    if (rowIdx === null) {
      throw new Error(`NPC ${npcId} not found`);
    }
    const a1Row = rowIdx + 1;
    await updateSheetData(resolvedId, `NPCs!F${a1Row}`, [[maxHp.toString()]]);
  } catch (err) {
    console.error('[DB] resetNpcHpDB failed:', err);
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

export async function updateDeathSavesDB(characterId: string, fails: number, successes: number): Promise<void>;
export async function updateDeathSavesDB(spreadsheetId: string | undefined, characterId: string, fails: number, successes: number): Promise<void>;
export async function updateDeathSavesDB(
  arg1: any,
  arg2: any,
  arg3: any,
  arg4?: any
): Promise<void> {
  let spreadsheetId: string | undefined;
  let characterId: string;
  let fails: number;
  let successes: number;
  if (arg4 === undefined) {
    spreadsheetId = undefined;
    characterId = arg1;
    fails = arg2;
    successes = arg3;
  } else {
    spreadsheetId = arg1;
    characterId = arg2;
    fails = arg3;
    successes = arg4;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const rowIdx = await findRowIndexById(resolvedId, 'Characters', characterId);
    if (rowIdx === null) {
      throw new Error(`Character ${characterId} not found`);
    }

    const a1Row = rowIdx + 1;
    await updateSheetData(resolvedId, `Characters!R${a1Row}:S${a1Row}`, [
      [fails.toString(), successes.toString()],
    ]);
  } catch (err) {
    console.error('[DB] updateDeathSavesDB failed:', err);
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

export async function appendEncounterLog(
  spreadsheetId: string,
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
): Promise<void> {
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

export async function readEncounterLogs(spreadsheetId: string): Promise<any[][]> {
  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const data = await fetchSheetData(resolvedId, 'EncounterLogs!A2:J');
    return data.values || [];
  } catch (err) {
    console.error('[DB] readEncounterLogs failed:', err);
    throw err;
  }
}
