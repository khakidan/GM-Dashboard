import { z } from 'zod';
import {
  CharacterRowSchema,
  NpcRowSchema,
  EncounterRowSchema,
  EncounterCombatantRowSchema
} from './sheetSchemas';
import { Character, NPC, Encounter, EncounterCombatant } from '../types';
import { DEFAULT_ABILITY_SCORES, DEFAULT_PROFICIENCIES, parseProficiencies } from './abilityScores';
import { parseSpellcastingAbility } from './spellcasting';
import { EncounterLog } from './combatLog';

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
    abilityScores,
    proficiencies,
    spellcastingAbility,
  ] = data;

  let syncedProficiencies = proficiencies ?? JSON.stringify(DEFAULT_PROFICIENCIES);
  if (spellcastingAbility) {
    try {
      const parsedProfs = parseProficiencies(syncedProficiencies);
      const parsedSpellcasting = parseSpellcastingAbility(spellcastingAbility);
      if (parsedSpellcasting !== undefined) {
        parsedProfs.spellcastingAbility = parsedSpellcasting;
        syncedProficiencies = JSON.stringify(parsedProfs);
      }
    } catch {}
  }

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
    statusName: statusId != null ? (statuses[statusId.toString()] || 'Unknown') : 'Unknown',
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
    abilityScores: abilityScores ?? JSON.stringify(DEFAULT_ABILITY_SCORES),
    proficiencies: syncedProficiencies,
    spellcastingAbility: spellcastingAbility ?? '',
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
    notes,
    resistances,
    immunities,
    vulnerabilities,
    legendaryActions,
    legendaryResistances,
    rechargeAbilities,
    abilityScores,
    proficiencies,
    speed,
    senses,
    languages,
    challengeRating,
    traits,
    actions,
    reactions,
    legendaryActionsList,
    spellcastingAbility,
  ] = data;

  let syncedProficiencies = proficiencies ?? JSON.stringify(DEFAULT_PROFICIENCIES);
  if (spellcastingAbility) {
    try {
      const parsedProfs = parseProficiencies(syncedProficiencies);
      const parsedSpellcasting = parseSpellcastingAbility(spellcastingAbility);
      if (parsedSpellcasting !== undefined) {
        parsedProfs.spellcastingAbility = parsedSpellcasting;
        syncedProficiencies = JSON.stringify(parsedProfs);
      }
    } catch {}
  }

  return {
    id,
    name,
    ac,
    maxHp,
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
    abilityScores: abilityScores ?? JSON.stringify(DEFAULT_ABILITY_SCORES),
    proficiencies: syncedProficiencies,
    speed: speed ?? '',
    senses: senses ?? '',
    languages: languages ?? '',
    challengeRating: challengeRating ?? '',
    traits: traits ?? '[]',
    actions: actions ?? '[]',
    reactions: reactions ?? '[]',
    legendaryActionsList: legendaryActionsList ?? '[]',
    spellcastingAbility: spellcastingAbility ?? '',
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
    difficultyName: difficultyId != null ? (difficulties[difficultyId.toString()] || 'Unknown') : 'Unknown',
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
  const [
    id,
    encounterId,
    playerId,
    npcId,
    quantity,
    initiative,
    conditionTimers,
    npcCurrentHp,
    npcTempHp,
    npcCurrentConditions,
    npcTempAcMod,
    npcLegendaryActionsRemaining,
    npcLegendaryResistancesRemaining,
    npcRechargeState
  ] = data;

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
    npcLegendaryActionsRemaining: npcLegendaryActionsRemaining ?? 0,
    npcLegendaryResistancesRemaining: npcLegendaryResistancesRemaining ?? 0,
    npcRechargeState: npcRechargeState || '{}',
  };
}

export function parseEncounterLogRow(row: any[]): EncounterLog | null {
  if (!row || row.length < 10) return null;

  const id = row[0];
  const encounterId = row[1];
  const encounterName = row[2];
  const location = row[3] || '';
  const date = row[4];
  const durationRoundsRaw = row[5];
  const outcomeRaw = row[6];
  const partySnapshotRaw = row[7];
  const eventsRaw = row[8];
  const transcript = row[9] || '';

  if (!id || !encounterId || !encounterName || !date) {
    return null;
  }

  const durationRounds = Number(durationRoundsRaw);
  if (isNaN(durationRounds)) {
    return null;
  }

  const validOutcomes = ['Victory', 'Defeat', 'Abandoned', 'Incomplete'];
  const outcome = validOutcomes.includes(outcomeRaw) ? (outcomeRaw as EncounterLog['outcome']) : 'Incomplete';

  let partySnapshot = [];
  if (partySnapshotRaw) {
    try {
      partySnapshot = JSON.parse(partySnapshotRaw);
    } catch (e) {
      return null;
    }
  }

  let events = [];
  if (eventsRaw) {
    try {
      events = JSON.parse(eventsRaw);
    } catch (e) {
      return null;
    }
  }

  return {
    id: String(id),
    encounterId: String(encounterId),
    encounterName: String(encounterName),
    location: String(location),
    date: String(date),
    durationRounds,
    outcome,
    partySnapshot,
    events,
    transcript: String(transcript),
  };
}

export function parseEncounterLogs(rows: any[][]): EncounterLog[] {
  if (!rows) return [];
  return rows.map(row => parseEncounterLogRow(row)).filter((log): log is EncounterLog => log !== null);
}
