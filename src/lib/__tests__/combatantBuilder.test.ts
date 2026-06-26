import { describe, it, expect } from 'vitest';
import { buildCombatantsFromState, parseRechargeOn, buildSingleNpcCombatant } from '../combatantBuilder';
import { Encounter, EncounterCombatant, Character, NPC } from '../../types';

describe('parseRechargeOn', () => {
  it('correctly parses valid recharge strings', () => {
    expect(parseRechargeOn('Recharge 5-6')).toBe(5);
    expect(parseRechargeOn('Recharge 6')).toBe(6);
    expect(parseRechargeOn('recharge 4')).toBe(4);
    expect(parseRechargeOn('  Recharge 5  ')).toBe(5);

    // Bare range formats
    expect(parseRechargeOn('5-6')).toBe(5);
    expect(parseRechargeOn('5-')).toBe(5);
    expect(parseRechargeOn('5')).toBe(5);
    expect(parseRechargeOn('6')).toBe(6);
    expect(parseRechargeOn('4-6')).toBe(4);
  });

  it('returns null for invalid or missing recharge values', () => {
    expect(parseRechargeOn(undefined)).toBeNull();
    expect(parseRechargeOn('')).toBeNull();
    expect(parseRechargeOn('Bite')).toBeNull();
    expect(parseRechargeOn('Recharge 3')).toBeNull();
    expect(parseRechargeOn('Recharge 7')).toBeNull();
    expect(parseRechargeOn('Recharge')).toBeNull();

    // Should still return null
    expect(parseRechargeOn('6d8')).toBeNull();
    expect(parseRechargeOn('DC 16')).toBeNull();
    expect(parseRechargeOn('1/Day')).toBeNull();
    expect(parseRechargeOn('16')).toBeNull();
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

  it('Does NOT build NPC combatants with legacy Column N rechargeAbilities (Column N is ignored)', () => {
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

    expect(res[0].rechargeAbilities).toBeUndefined();
  });

  it('NPC recharge derives from actions JSON, not from col N legacy field', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const npcs: Partial<NPC>[] = [{
      id: 'npc-1',
      name: 'Dragon',
      actions: JSON.stringify([
        {
          name: 'Cinderfall',
          description: 'A devastating attack',
          recharge: '5-'
        },
        {
          name: 'Bite',
          description: 'A basic attack',
          recharge: ''
        }
      ]),
      rechargeAbilities: [
        { name: 'OldLegacyAbility', rechargeOn: 6 }
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

    const combatant = res[0];
    expect(combatant.rechargeAbilities).toHaveLength(1);
    expect(combatant.rechargeAbilities[0].name).toBe('Cinderfall');
    expect(combatant.rechargeAbilities[0].rechargeOn).toBe(5);
    expect(combatant.rechargeAbilities[0].isCharged).toBe(true);
    expect(combatant.rechargeAbilities.some(ra => ra.name === 'OldLegacyAbility')).toBe(false);
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

  it('builds combatants from NPC templates with legendaryResistances', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const npcs: Partial<NPC>[] = [{
      id: 'npc-1',
      name: 'Beholder',
      legendaryResistances: 2
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

    expect(res[0].legendaryResistances).toEqual({ max: 2, remaining: 2 });
  });

  it('NPC with rechargeAbilities defined in col N creates combatant with isCharged: true when actions JSON also has recharge', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const npcs: Partial<NPC>[] = [{
      id: 'npc-1',
      name: 'Dragon',
      actions: JSON.stringify([{
        name: 'Fire Breath',
        description: 'Exhales fire',
        recharge: '5-6'
      }]),
      rechargeAbilities: [
        { name: 'FireBreath_Legacy', rechargeOn: 5 }
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

    const combatant = res[0];
    expect(combatant.rechargeAbilities).toHaveLength(1);
    expect(combatant.rechargeAbilities[0].name).toBe('Fire Breath');
    expect(combatant.rechargeAbilities[0].isCharged).toBe(true);
    expect(combatant.rechargeAbilities.some(ra => ra.name === 'FireBreath_Legacy')).toBe(false);
  });

  it('derives rechargeAbilities from actions recharge field, ignoring Column N entirely', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const npcs: Partial<NPC>[] = [{
      id: 'npc-1',
      name: 'Dragon',
      actions: JSON.stringify([{
        name: 'Multiattack',
        description: 'Three attacks',
        recharge: ''
      }, {
        name: 'Tail Swipe',
        description: 'Recharge ability',
        recharge: 'Recharge 5-6'
      }]),
      rechargeAbilities: []
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

    const combatant = res[0];
    expect(combatant.rechargeAbilities).toHaveLength(1);
    expect(combatant.rechargeAbilities[0].name).toBe('Tail Swipe');
    expect(combatant.rechargeAbilities[0].rechargeOn).toBe(5);
    expect(combatant.rechargeAbilities[0].isCharged).toBe(true);
  });

  it('legendaryActions of 0 or undefined does NOT set legendaryActions on combatant', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const npcs: Partial<NPC>[] = [
      { id: 'npc-1', name: 'Orc', legendaryActions: 0 },
      { id: 'npc-2', name: 'Goblin', legendaryActions: undefined }
    ];
    const ec: Partial<EncounterCombatant>[] = [
      { id: 'ec-1', encounterId: 'enc-1', npcId: 'npc-1', quantity: 1 },
      { id: 'ec-2', encounterId: 'enc-1', npcId: 'npc-2', quantity: 1 }
    ];

    const res = buildCombatantsFromState(
      encounter as Encounter,
      ec as EncounterCombatant[],
      [],
      npcs as NPC[]
    );

    expect(res[0].legendaryActions).toBeUndefined();
    expect(res[1].legendaryActions).toBeUndefined();
  });

  it('buildCombatantsFromState handles NPCs with no recharge actions correctly', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const npcs: Partial<NPC>[] = [{
      id: 'npc-1',
      name: 'Commoner',
      actions: JSON.stringify([{ name: 'Club', description: 'Melee attack' }])
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

    expect(res[0].rechargeAbilities).toBeUndefined();
  });
});

describe('parseRechargeOn additional coverage', () => {
  it('handles "5-" correctly', () => {
    expect(parseRechargeOn('5-')).toBe(5);
  });
});

describe('buildSingleNpcCombatant', () => {
  const baseNpc: NPC = {
    id: 'npc-1',
    name: 'Test Dragon',
    ac: 18,
    maxHp: 200,
    currentHp: 200,
    tempHp: 0,
    conditions: '',
    notes: '',
    resistances: 'fire',
    immunities: '',
    vulnerabilities: 'cold',
    legendaryActions: 3,
    legendaryResistances: 2,
    rechargeAbilities: [],
    abilityScores: '{"STR":26}',
    proficiencies: '{}',
    speed: '40 ft.',
    senses: 'darkvision 120 ft.',
    languages: 'Draconic',
    challengeRating: '20',
    traits: '[]',
    actions: JSON.stringify([{
      name: 'Fire Breath',
      description: 'Exhales fire',
      recharge: '5-6'
    }, {
      name: 'Bite',
      description: 'Melee attack',
      recharge: ''
    }]),
    reactions: '[]',
    legendaryActionsList: '[]',
    spellcastingAbility: 'INT',
  };

  const baseOptions = {
    id: 'combat-npc-1',
    encounterCombatantId: 'ec-1',
    name: 'Test Dragon',
    npcId: 'npc-1',
  };

  it('returns a combatant with correct basic fields from npc template', () => {
    const combatant = buildSingleNpcCombatant(
      baseNpc, baseOptions
    );
    expect(combatant.id).toBe('combat-npc-1');
    expect(combatant.type).toBe('npc');
    expect(combatant.ac).toBe(18);
    expect(combatant.maxHp).toBe(200);
    expect(combatant.resistances).toBe('fire');
    expect(combatant.vulnerabilities).toBe('cold');
    expect(combatant.reactionUsed).toBe(false);
  });

  it('initializes legendaryActions correctly when legendaryActions > 0', () => {
    const combatant = buildSingleNpcCombatant(
      baseNpc, baseOptions
    );
    expect(combatant.legendaryActions).toEqual({
      max: 3, remaining: 3
    });
  });

  it('sets legendaryActions to undefined when legendaryActions is 0', () => {
    const npc = { ...baseNpc, legendaryActions: 0 };
    const combatant = buildSingleNpcCombatant(
      npc, baseOptions
    );
    expect(combatant.legendaryActions).toBeUndefined();
  });

  it('initializes legendaryResistances correctly when legendaryResistances > 0', () => {
    const combatant = buildSingleNpcCombatant(
      baseNpc, baseOptions
    );
    expect(combatant.legendaryResistances).toEqual({ max: 2, remaining: 2 });
  });

  it('derives rechargeAbilities from actions JSON — only actions with valid recharge values are included', () => {
    const combatant = buildSingleNpcCombatant(
      baseNpc, baseOptions
    );
    expect(combatant.rechargeAbilities).toHaveLength(1);
    expect(combatant.rechargeAbilities![0].name).toBe('Fire Breath');
    expect(combatant.rechargeAbilities![0].rechargeOn).toBe(5);
    expect(combatant.rechargeAbilities![0].isCharged).toBe(true);
  });

  it('sets rechargeAbilities to undefined when no actions have a valid recharge', () => {
    const npc = {
      ...baseNpc,
      actions: JSON.stringify([{
        name: 'Bite',
        description: 'Attack',
        recharge: ''
      }])
    };
    const combatant = buildSingleNpcCombatant(
      npc, baseOptions
    );
    expect(combatant.rechargeAbilities).toBeUndefined();
  });

  it('uses the name from options not from npcTemplate (supports " 2", " 3" suffixes)', () => {
    const opts = {
      ...baseOptions,
      name: 'Test Dragon 2'
    };
    const combatant = buildSingleNpcCombatant(
      baseNpc, opts
    );
    expect(combatant.name).toBe('Test Dragon 2');
  });

  it('accepts overrides for HP, conditions, and initiative', () => {
    const opts = {
      ...baseOptions,
      currentHp: 50,
      tempHp: 10,
      conditions: 'Stunned',
      initiative: 15,
      tempAcModifier: 2,
    };
    const combatant = buildSingleNpcCombatant(
      baseNpc, opts
    );
    expect(combatant.currentHp).toBe(50);
    expect(combatant.tempHp).toBe(10);
    expect(combatant.conditions).toBe('Stunned');
    expect(combatant.initiative).toBe(15);
    expect(combatant.tempAcModifier).toBe(2);
  });
});
