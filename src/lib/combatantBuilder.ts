import { Character, Encounter, Combatant, NPC, EncounterCombatant } from '../types';

/**
 * Parses "Recharge X" style strings into a rechargeOn number (4, 5, or 6) or null.
 */
export function parseRechargeOn(
  text: string | undefined
): number | null {
  if (text === undefined || text === null || text === '') return null;
  const normalized = text.toLowerCase().trim();

  // Format 1: "Recharge 5-6", "Recharge 5",
  //           "recharge 5-6", "recharge 5–6"
  const rechargeMatch = normalized.match(
    /recharge\s+([456])/
  );
  if (rechargeMatch) {
    return parseInt(rechargeMatch[1], 10);
  }

  // Format 2: bare range or number that starts
  // with 4, 5, or 6 — "5-6", "5-", "6", "4-6"
  // Must start with the digit (not part of a
  // larger number like "16" or "6d8")
  const bareMatch = normalized.match(
    /^([456])(?:-\d*)?$/
  );
  if (bareMatch) {
    return parseInt(bareMatch[1], 10);
  }

  return null;
}

/**
 * Shared logic to build a single NPC combatant object from a template and overrides.
 */
export function buildSingleNpcCombatant(
  npcTemplate: NPC,
  options: {
    id: string;
    encounterCombatantId: string;
    name: string;
    npcId: string;
    initiative?: number;
    currentHp?: number;
    tempHp?: number;
    conditions?: string;
    tempAcModifier?: number;
    conditionTimers?: Record<string, number>;
  }
): Combatant {
  return {
    id: options.id,
    encounterCombatantId: options.encounterCombatantId,
    name: options.name,
    type: 'npc',
    initiative: options.initiative ?? 0,
    ac: npcTemplate.ac,
    maxHp: npcTemplate.maxHp,
    currentHp: options.currentHp !== undefined ? options.currentHp : npcTemplate.currentHp,
    tempHp: options.tempHp !== undefined ? options.tempHp : (npcTemplate.tempHp ?? 0),
    conditions: options.conditions !== undefined ? options.conditions : (npcTemplate.conditions || ''),
    notes: npcTemplate.notes,
    passivePerception: 10,
    resistances: npcTemplate.resistances,
    immunities: npcTemplate.immunities,
    vulnerabilities: npcTemplate.vulnerabilities,
    conditionTimers: options.conditionTimers || {},
    tempAcModifier: options.tempAcModifier || 0,
    reactionUsed: false,
    npcId: options.npcId,
    legendaryActions: 
      npcTemplate.legendaryActions && npcTemplate.legendaryActions > 0
      ? { 
          max: npcTemplate.legendaryActions, 
          remaining: npcTemplate.legendaryActions 
        }
      : undefined,
    legendaryResistances: 
      npcTemplate.legendaryResistances && npcTemplate.legendaryResistances > 0
      ? { 
          max: npcTemplate.legendaryResistances, 
          remaining: npcTemplate.legendaryResistances 
        }
      : undefined,
    rechargeAbilities: (() => {
      const derived: Array<{
        name: string;
        rechargeOn: number;
        isCharged: boolean;
      }> = [];
      try {
        const parsedActions = JSON.parse(
          npcTemplate.actions || '[]'
        ) as Array<{ name: string; recharge?: string }>;
        for (const action of parsedActions) {
          const rechargeOn = parseRechargeOn(action.recharge);
          if (rechargeOn !== null) {
            derived.push({
              name: action.name,
              rechargeOn,
              isCharged: true,
            });
          }
        }
      } catch {}
      return derived.length > 0 ? derived : undefined;
    })(),
    abilityScores: npcTemplate.abilityScores,
    proficiencies: npcTemplate.proficiencies,
    speed: npcTemplate.speed,
    senses: npcTemplate.senses,
    languages: npcTemplate.languages,
    challengeRating: npcTemplate.challengeRating,
    traits: npcTemplate.traits,
    actions: npcTemplate.actions,
    reactions: npcTemplate.reactions,
    legendaryActionsList: npcTemplate.legendaryActionsList,
  };
}

/**
 * Pure data transformation to build Combatant objects from state templates.
 */
export function buildCombatantsFromState(
  encounter: Encounter,
  encounterCombatants: EncounterCombatant[],
  characters: Character[],
  npcs: NPC[]
): Combatant[] {
  const combatants: Combatant[] = [];
  const linkedCombatants = encounterCombatants.filter(ec => ec.encounterId === encounter.id);

  if (linkedCombatants.length > 0) {
    linkedCombatants.forEach(ec => {
      const parsedTimers: Record<string, number> = ec.conditionTimers || {};

      if (ec.playerId) {
        const c = characters.find(char => char.id === ec.playerId);
        if (c) {
          combatants.push({
            id: `combat-pc-${c.id}`,
            encounterCombatantId: ec.id,
            characterId: c.id,
            name: c.characterName,
            type: 'pc',
            initiative: ec.initiative || 0,
            ac: c.ac,
            maxHp: c.maxHp,
            currentHp: c.currentHp,
            tempHp: c.tempHp,
            conditions: c.conditions,
            notes: c.notes,
            passivePerception: c.passivePerception,
            resistances: c.resistances || '',
            immunities: c.immunities || '',
            vulnerabilities: c.vulnerabilities || '',
            conditionTimers: parsedTimers,
            tempHpMax: c.tempHpMax,
            tempAcModifier: c.tempAc || 0,
            deathSavesFails: c.deathSavesFails || 0,
            deathSavesSuccesses: c.deathSavesSuccesses || 0,
            reactionUsed: false,
            level: c.level,
            class: c.class,
            abilityScores: c.abilityScores,
            proficiencies: c.proficiencies,
          });
        }
      } else if (ec.npcId) {
        const npcTemplate = npcs.find(n => n.id === ec.npcId);
        if (npcTemplate) {
          for (let i = 0; i < ec.quantity; i++) {
            const combatantId = `combat-npc-${npcTemplate.id}-${i}-${Date.now()}`;
            const combatant = buildSingleNpcCombatant(
              npcTemplate,
              {
                id: combatantId,
                encounterCombatantId: ec.id,
                name: `${npcTemplate.name}${ec.quantity > 1 ? ` ${i + 1}` : ''}`,
                npcId: npcTemplate.id,
                initiative: ec.initiative || 0,
                currentHp: ec.npcCurrentHp !== undefined && ec.npcCurrentHp >= 0 
                  ? ec.npcCurrentHp 
                  : npcTemplate.maxHp,
                tempHp: ec.npcTempHp ?? 0,
                conditions: ec.npcCurrentConditions?.trim() ? ec.npcCurrentConditions : (npcTemplate.conditions || ''),
                conditionTimers: parsedTimers,
                tempAcModifier: ec.npcTempAcMod || 0,
              }
            );
            combatants.push(combatant);
          }
        }
      }
    });
  } else {
    // Fallback: add all active characters
    const activePcs = characters.filter(c => c.isActive);
    activePcs.forEach(c => {
      combatants.push({
        id: `combat-pc-${c.id}`,
        characterId: c.id,
        name: c.characterName,
        type: 'pc',
        initiative: 0,
        ac: c.ac,
        maxHp: c.maxHp,
        currentHp: c.currentHp,
        tempHp: c.tempHp,
        conditions: c.conditions,
        notes: c.notes,
        passivePerception: c.passivePerception,
        resistances: c.resistances || '',
        immunities: c.immunities || '',
        vulnerabilities: c.vulnerabilities || '',
        conditionTimers: {},
        tempHpMax: c.tempHpMax,
        tempAcModifier: c.tempAc || 0,
        deathSavesFails: c.deathSavesFails || 0,
        deathSavesSuccesses: c.deathSavesSuccesses || 0,
        reactionUsed: false,
        level: c.level,
        class: c.class,
        abilityScores: c.abilityScores,
        proficiencies: c.proficiencies,
      });
    });
  }

  return combatants;
}
