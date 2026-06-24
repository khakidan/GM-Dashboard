import { describe, it, expect } from 'vitest';
import { buildCombatantsFromState, parseRechargeOn } from '../combatantBuilder';
import { Encounter, EncounterCombatant, Character, NPC } from '../../types';

describe('parseRechargeOn', () => {
  it('correctly parses valid recharge strings', () => {
    expect(parseRechargeOn('Recharge 5-6')).toBe(5);
    expect(parseRechargeOn('Recharge 6')).toBe(6);
    expect(parseRechargeOn('recharge 4')).toBe(4);
    expect(parseRechargeOn('  Recharge 5  ')).toBe(5);
  });

  it('returns null for invalid or missing recharge values', () => {
    expect(parseRechargeOn(undefined)).toBeNull();
    expect(parseRechargeOn('')).toBeNull();
    expect(parseRechargeOn('Bite')).toBeNull();
    expect(parseRechargeOn('Recharge 3')).toBeNull();
    expect(parseRechargeOn('Recharge 7')).toBeNull();
    expect(parseRechargeOn('Recharge')).toBeNull();
  });
});

describe('buildCombatantsFromState', () => {
  it('Returns empty array when no encounterCombatants match the encounter', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const res = buildCombatantsFromState(encounter as Encounter, [], [], []);
    expect(res).toEqual([]);
  });

  it('Correctly builds PC combatants carrying conditions, resistances, and AC from the character template', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const characters: Partial<Character>[] = [{
      id: 'pc-1',
      characterName: 'Alandra',
      ac: 16,
      maxHp: 30,
      currentHp: 25,
      tempHp: 5,
      conditions: 'Exhausted',
      resistances: 'Fire',
      immunities: 'Poison',
      vulnerabilities: 'Cold',
      passivePerception: 14,
      notes: 'Test notes'
    }];
    const ec: Partial<EncounterCombatant>[] = [{
      id: 'ec-1',
      encounterId: 'enc-1',
      playerId: 'pc-1',
      initiative: 15
    }];

    const res = buildCombatantsFromState(
      encounter as Encounter,
      ec as EncounterCombatant[],
      characters as Character[],
      []
    );

    expect(res).toHaveLength(1);
    const c = res[0];
    expect(c.name).toBe('Alandra');
    expect(c.initiative).toBe(15);
    expect(c.ac).toBe(16);
    expect(c.conditions).toBe('Exhausted');
    expect(c.resistances).toBe('Fire');
    expect(c.type).toBe('pc');
  });

  it('Correctly builds NPC combatants initialising legendaryActions from the NPC template', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const npcs: Partial<NPC>[] = [{
      id: 'npc-1',
      name: 'Dragon',
      ac: 18,
      maxHp: 200,
      legendaryActions: 3
    }];
    const ec: Partial<EncounterCombatant>[] = [{
      id: 'ec-1',
      encounterId: 'enc-1',
      npcId: 'npc-1',
      quantity: 1,
      initiative: 12
    }];

    const res = buildCombatantsFromState(
      encounter as Encounter,
      ec as EncounterCombatant[],
      [],
      npcs as NPC[]
    );

    expect(res).toHaveLength(1);
    expect(res[0].legendaryActions).toEqual({ max: 3, remaining: 3 });
  });

  it('Correctly builds NPC combatants with rechargeAbilities all set to isCharged: true', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const npcs: Partial<NPC>[] = [{
      id: 'npc-1',
      name: 'Beholder',
      rechargeAbilities: [
        { name: 'Eye Ray', rechargeOn: 5 }
      ]
    }];
    const ec: Partial<EncounterCombatant>[] = [{
      id: 'ec-1',
      encounterId: 'enc-1',
      npcId: 'npc-1',
      quantity: 1
    }];

    const res = buildCombatantsFromState(
      encounter as Encounter,
      ec as EncounterCombatant[],
      [],
      npcs as NPC[]
    );

    expect(res[0].rechargeAbilities).toHaveLength(1);
    expect(res[0].rechargeAbilities?.[0].isCharged).toBe(true);
  });

  it('correctly auto-derives rechargeAbilities from actions and defaults isCharged: true', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const npcs: Partial<NPC>[] = [{
      id: 'npc-1',
      name: 'Beholder',
      actions: JSON.stringify([
        { name: 'Eye Ray', recharge: 'Recharge 5-6' },
        { name: 'Bite', recharge: undefined }
      ])
    }];
    const ec: Partial<EncounterCombatant>[] = [{
      id: 'ec-1',
      encounterId: 'enc-1',
      npcId: 'npc-1',
      quantity: 1
    }];

    const res = buildCombatantsFromState(
      encounter as Encounter,
      ec as EncounterCombatant[],
      [],
      npcs as NPC[]
    );

    expect(res[0].rechargeAbilities).toHaveLength(1);
    expect(res[0].rechargeAbilities?.[0].name).toBe('Eye Ray');
    expect(res[0].rechargeAbilities?.[0].rechargeOn).toBe(5);
    expect(res[0].rechargeAbilities?.[0].isCharged).toBe(true);
  });

  it('Handles quantity > 1 by creating multiple independent combatant objects', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const npcs: Partial<NPC>[] = [{
      id: 'npc-1',
      name: 'Goblin',
      maxHp: 7
    }];
    const ec: Partial<EncounterCombatant>[] = [{
      id: 'ec-1',
      encounterId: 'enc-1',
      npcId: 'npc-1',
      quantity: 3
    }];

    const res = buildCombatantsFromState(
      encounter as Encounter,
      ec as EncounterCombatant[],
      [],
      npcs as NPC[]
    );

    expect(res).toHaveLength(3);
    expect(res[0].name).toBe('Goblin 1');
    expect(res[1].name).toBe('Goblin 2');
    expect(res[2].name).toBe('Goblin 3');
    expect(res[0].id).not.toBe(res[1].id);
  });
});
