import { z } from 'zod';
import {
  CharacterRowSchema,
  NpcRowSchema,
  EncounterRowSchema,
  EncounterCombatantRowSchema
} from './sheetSchemas';
import { Character, NPC, Encounter, EncounterCombatant } from '../types';

export type CharacterRowData = z.infer<typeof CharacterRowSchema>;
export type NpcRowData = z.infer<typeof NpcRowSchema>;
export type EncounterRowData = z.infer<typeof EncounterRowSchema>;
export type ECRowData = z.infer<typeof EncounterCombatantRowSchema>;

export function mapCharacterRowToCharacter(
  data: CharacterRowData,
  rowIndex: number,
  statuses: Record<string, string>
): Character {
  const [
    id,
    playerName,
    characterName,
    ac,
    maxHp,
    tempHp,
    currentHp,
    conditions,
    passivePerception,
    level,
    statusId,
    notes,
    resistances,
    immunities,
    vulnerabilities,
    tempHpMax,
    tempAc,
    deathSavesFails,
    deathSavesSuccesses,
    classStr,
    hitDiceConfig,
    hitDiceUsed,
    resourcePools,
  ] = data;

  return {
    id,
    playerName,
    characterName,
    ac,
    maxHp,
    tempHp,
    currentHp,
    conditions,
    passivePerception,
    level,
    statusId,
    statusName: statuses[statusId.toString()] || 'Unknown',
    notes,
    isActive: statusId === 1,
    sheetRowIndex: rowIndex,
    resistances: resistances || '',
    immunities: immunities || '',
    vulnerabilities: vulnerabilities || '',
    class: classStr || '',
    tempHpMax: tempHpMax ?? 0,
    tempAc: tempAc ?? 0,
    deathSavesFails: deathSavesFails ?? 0,
    deathSavesSuccesses: deathSavesSuccesses ?? 0,
    hitDiceConfig: hitDiceConfig ?? '',
    hitDiceUsed: hitDiceUsed ?? '{}',
    resourcePools: resourcePools ?? '[]',
  };
}

export function mapNpcRowToNpc(
  data: NpcRowData,
  rowIndex: number
): NPC {
  const [
    id,
    name,
    ac,
    maxHp,
    tempHp,
    currentHp,
    conditions,
    notes,
    resistances,
    immunities,
    vulnerabilities,
    legendaryActions,
    legendaryResistances,
    rechargeAbilities,
  ] = data;

  return {
    id,
    name,
    ac,
    maxHp,
    tempHp,
    currentHp,
    conditions,
    notes,
    resistances: resistances || '',
    immunities: immunities || '',
    vulnerabilities: vulnerabilities || '',
    legendaryActions: legendaryActions ?? 0,
    legendaryResistances: legendaryResistances ?? 0,
    rechargeAbilities: (() => {
      try {
        return rechargeAbilities ? JSON.parse(rechargeAbilities) : [];
      } catch {
        return [];
      }
    })(),
  };
}

export function mapEncounterRowToEncounter(
  data: EncounterRowData,
  rowIndex: number,
  difficulties: Record<string, string>
): Encounter {
  const [id, name, location, difficultyId, npcDefinitions, currentRound, activeTurnId] = data;

  return {
    id,
    name,
    location,
    difficultyId,
    difficultyName: difficulties[difficultyId.toString()] || 'Unknown',
    npcDefinitions,
    status: 'planned',
    sheetRowIndex: rowIndex,
    currentRound: currentRound ?? 0,
    activeTurnId: activeTurnId ?? '',
  };
}

export function mapEncounterCombatantRowToEC(
  data: ECRowData,
  rowIndex: number
): EncounterCombatant {
  const [id, encounterId, playerId, npcId, quantity, initiative, conditionTimers, npcCurrentHp, npcTempHp, npcCurrentConditions, npcTempAcMod] = data;

  let parsedTimers: Record<string, number> = {};
  if (conditionTimers) {
    try {
      parsedTimers = JSON.parse(conditionTimers);
    } catch (e) {
      parsedTimers = {};
    }
  }

  return {
    id,
    encounterId,
    playerId,
    npcId,
    quantity,
    initiative: initiative || 0,
    conditionTimers: parsedTimers,
    sheetRowIndex: rowIndex,
    npcCurrentHp: npcCurrentHp !== undefined ? npcCurrentHp : -1,
    npcTempHp: npcTempHp !== undefined ? npcTempHp : 0,
    npcCurrentConditions,
    npcTempAcMod: npcTempAcMod ?? 0,
  };
}
