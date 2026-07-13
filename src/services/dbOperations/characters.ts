// src/services/dbOperations/characters.ts

import { Character } from '../../types';
import {
  queueWriteResolved,
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

export async function deleteCharacterFully(playerId: string): Promise<void>;
export async function deleteCharacterFully(spreadsheetId: string | undefined, playerId: string): Promise<void>;
export async function deleteCharacterFully(
  arg1: string | undefined | null,
  arg2?: string
): Promise<void> {
  let spreadsheetId: string | undefined;
  let playerId: string;
  if (arg2 === undefined) {
    spreadsheetId = undefined;
    playerId = arg1 as string;
  } else {
    spreadsheetId = arg1 || undefined;
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

    const finalSpellcastingAbility = getSpellcastingAbilityToSave(character, {});
    const finalProficiencies = injectSpellcastingAbility(
      sanitizeString(character.proficiencies || '{}'),
      finalSpellcastingAbility
    );

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
      finalProficiencies,
      finalSpellcastingAbility,
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
      proficiencies: finalProficiencies,
      spellcastingAbility: character.spellcastingAbility ?? finalSpellcastingAbility,
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
    queueWriteResolved(resolvedId, `Characters!A${a1Row}:Z${a1Row}`, [rowData]);
  } catch (err) {
    console.error('[DB] updateCharacterDB failed:', err);
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
