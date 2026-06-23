import { Character, Encounter, Combatant, NPC, EncounterCombatant } from '../types';

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
              rechargeAbilities: 
                npcTemplate.rechargeAbilities?.length
                ? npcTemplate.rechargeAbilities.map(a => ({
                    name: a.name,
                    rechargeOn: a.rechargeOn,
                    isCharged: true,
                  }))
                : undefined,
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
      });
    });
  }

  return combatants;
}
