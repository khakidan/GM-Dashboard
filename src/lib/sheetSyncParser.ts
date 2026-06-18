import { z } from 'zod';
import { NPC, Character, Encounter, EncounterCombatant } from '../types';
import {
  CharacterRowSchema,
  NpcRowSchema,
  EncounterRowSchema,
  EncounterCombatantRowSchema,
  StatusRowSchema,
  DifficultyRowSchema,
} from './sheetSchemas';
import {
  mapCharacterRowToCharacter,
  mapNpcRowToNpc,
  mapEncounterRowToEncounter,
  mapEncounterCombatantRowToEC,
} from './sheetAdapters';

type SheetRow = (string | number | null | undefined)[];
type SheetData = SheetRow[];

export function parseStatuses(values: SheetData): Record<string, string> {
  const statuses: Record<string, string> = {};
  values.forEach((row, i) => {
    const result = StatusRowSchema.safeParse(row);
    if (result.success) {
      const [id, name] = result.data;
      statuses[id.toString()] = name;
    } else {
      console.warn('[Sync] Status row', i, 'failed validation:', result.error.issues);
    }
  });
  return statuses;
}

export function parseDifficulties(values: SheetData): Record<string, string> {
  const difficulties: Record<string, string> = {};
  values.forEach((row, i) => {
    const result = DifficultyRowSchema.safeParse(row);
    if (result.success) {
      const [id, name] = result.data;
      difficulties[id.toString()] = name;
    } else {
      console.warn('[Sync] Difficulty_Level row', i, 'failed validation:', result.error.issues);
    }
  });
  return difficulties;
}

export function parseNPCs(values: SheetData): NPC[] {
  return values
    .map((row, i) => {
      const result = NpcRowSchema.safeParse(row);
      if (!result.success) {
        console.warn('[Sync] NPCs row', i, 'failed validation:', result.error.issues);
        return null;
      }
      return mapNpcRowToNpc(result.data, i);
    })
    .filter((npc): npc is NPC => npc !== null);
}

export function parseEncounters(values: SheetData, difficulties: Record<string, string>): Encounter[] {
  return values
    .map((row, i) => {
      const result = EncounterRowSchema.safeParse(row);
      if (!result.success) {
        console.warn('[Sync] Encounters row', i, 'failed validation:', result.error.issues);
        return null;
      }
      return mapEncounterRowToEncounter(result.data, i + 1, difficulties);
    })
    .filter((enc): enc is Encounter => enc !== null);
}

export function parseEncounterCombatants(values: SheetData): EncounterCombatant[] {
  return values
    .map((row, i) => {
      const result = EncounterCombatantRowSchema.safeParse(row);
      if (!result.success) {
        console.warn('[Sync] Encounter_Combatants row', i, 'failed validation:', result.error.issues);
        return null;
      }
      return mapEncounterCombatantRowToEC(result.data, i + 1);
    })
    .filter((ec): ec is EncounterCombatant => ec !== null);
}

export function parseCharacters(values: SheetData, statuses: Record<string, string>): Character[] {
  return values
    .map((row, i) => {
      const result = CharacterRowSchema.safeParse(row);
      if (!result.success) {
        console.warn('[Sync] Characters row', i, 'failed validation:', result.error.issues);
        return null;
      }
      return mapCharacterRowToCharacter(result.data, i + 2, statuses);
    })
    .filter((char): char is Character => char !== null);
}
