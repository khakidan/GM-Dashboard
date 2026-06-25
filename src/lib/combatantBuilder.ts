import { Character, Encounter, Combatant, NPC, EncounterCombatant } from '../types';

/**
 * Parses "Recharge X" style strings into a rechargeOn number (4, 5, or 6) or null.
 */
export function parseRechargeOn(
  text: string | undefined
): number | null {
  if (text === undefined || text === null || text === '') return null;
  const normalized = text.toLowerCase().trim();
  if (!normalized.startsWith('recharge')) return null;

  const match = normalized.match(/recharge\s+(\d+)/i);
  if (!match) return null;

  const val = parseInt(match[1], 10);
  if (val === 4 || val === 5 || val === 6) {
    return val;
  }
  return null;
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
            combatants.push({
              id: `combat-npc-${npcTemplate.id}-${i}-${Date.now()}`,
              encounterCombatantId: ec.id,
              npcId: npcTemplate.id,
              name: `${npcTemplate.name}${ec.quantity > 1 ? ` ${i + 1}` : ''}`,
              type: 'npc',
              initiative: ec.initiative || 0,
              ac: npcTemplate.ac,
              maxHp: npcTemplate.maxHp,
              currentHp: ec.npcCurrentHp !== undefined && ec.npcCurrentHp >= 0 
                ? ec.npcCurrentHp 
                : npcTemplate.maxHp,
              tempHp: ec.npcTempHp ?? 0,
              conditions: ec.npcCurrentConditions?.trim() ? ec.npcCurrentConditions : (npcTemplate.conditions || ''),
              notes: npcTemplate.notes,
              passivePerception: 10,
              resistances: npcTemplate.resistances,
              immunities: npcTemplate.immunities,
              vulnerabilities: npcTemplate.vulnerabilities,
              conditionTimers: parsedTimers,
              tempAcModifier: ec.npcTempAcMod || 0,
              reactionUsed: false,
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
            });
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
