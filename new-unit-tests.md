# New Unit Tests Summary

## File: src/services/__tests__/dbOperations.test.ts

```typescript
// src/services/__tests__/dbOperations.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as sheetsService from '../sheetsService';
import * as writeQueue from '../writeQueue';
import { SHEET_RANGES } from '../../lib/constants';
import { NpcRowSchema, CharacterRowSchema } from '../../lib/sheetSchemas';
import {
  addNpcDB,
  updateNpcFullDB,
  updateCharacterDB,
  addCharacterDB,
  deleteNpcDB,
  resetNpcHpDB,
} from '../dbOperations';

vi.mock('../sheetsService', () => ({
  fetchSheetData: vi.fn(),
  updateSheetData: vi.fn(),
  appendSheetData: vi.fn(),
  batchUpdateSpreadsheet: vi.fn(),
  fetchSpreadsheetMetadata: vi.fn(),
  getSpreadsheetId: vi.fn().mockReturnValue('mock-spreadsheet-id'),
}));

vi.mock('../writeQueue', () => ({
  queueWrite: vi.fn(),
}));

describe('SHEET_RANGES alignment', () => {
  it("SHEET_RANGES.npcs covers 25 columns (A:Y) matching NpcRowSchema", () => {
    expect(SHEET_RANGES.npcs).toMatch(/:Y$/);
    const row = [
      '1', 'A', '10', '10', '0', '10', '', '', '', '', '',
      '0', '0', '[]', '{}', '{}', '', '', '', '', '[]', '[]', '[]', '[]', '',
    ];
    expect(NpcRowSchema.parse(row)).toBeDefined();
  });

  it("SHEET_RANGES.characters covers 26 columns (A:Z) matching CharacterRowSchema", () => {
    expect(SHEET_RANGES.characters).toMatch(/:Z$/);
    const row = [
      'pc-1', '', 'A', '10', '10', '0', '10', '', '10', '1', '1',
      '', '', '', '', '0', '0', '0', '0', '', '', '{}', '[]', '{}', '{}', '',
    ];
    expect(CharacterRowSchema.parse(row)).toBeDefined();
  });
});

describe('addNpcDB — row array integrity', () => {
  const npcData = {
    name: 'Test Dragon',
    ac: 18,
    maxHp: 200,
    tempHp: 0,
    currentHp: 200,
    conditions: '',
    notes: 'Ancient dragon',
    resistances: 'fire',
    immunities: 'cold',
    vulnerabilities: '',
    legendaryActions: 3,
    legendaryResistances: 3,
    rechargeAbilities: [{ name: 'Fire Breath', rechargeOn: 5 }],
    abilityScores: '{"STR":27}',
    proficiencies: '{"proficiencyBonus":7}',
    speed: '40 ft., fly 80 ft.',
    senses: 'blindsight 60 ft., darkvision 120 ft.',
    languages: 'Common, Draconic',
    challengeRating: '24',
    traits: '[{"name":"Legendary Resistance","description":"3/day"}]',
    actions: '[{"name":"Multiattack","description":"3 attacks","recharge":""}]',
    reactions: '[{"name":"Wing Attack","description":"Reaction"}]',
    legendaryActionsList: '[{"name":"Detect","description":"Perception check","cost":1}]',
    spellcastingAbility: 'INT',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes exactly 25 values to NPCs!A:Y', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    await addNpcDB(npcData as any);
    expect(writeQueue.queueWrite).not.toHaveBeenCalled();
    expect(sheetsService.appendSheetData).toHaveBeenCalledWith(
      'mock-spreadsheet-id',
      'NPCs!A:Y',
      expect.any(Array)
    );
    const appendCall = vi.mocked(sheetsService.appendSheetData).mock.calls[0];
    const row = appendCall[2][0];
    expect(row).toHaveLength(25);
  });

  it('writes new stat block fields at correct indices (16–24)', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    await addNpcDB(npcData as any);
    const appendCall = vi.mocked(sheetsService.appendSheetData).mock.calls[0];
    const row = appendCall[2][0];
    expect(row[16]).toBe('40 ft., fly 80 ft.');
    expect(row[17]).toBe('blindsight 60 ft., darkvision 120 ft.');
    expect(row[18]).toBe('Common, Draconic');
    expect(row[19]).toBe('24');
    expect(row[20]).toContain('Legendary Resistance');
    expect(row[21]).toContain('Multiattack');
    expect(row[22]).toContain('Wing Attack');
    expect(row[23]).toContain('Detect');
    expect(row[24]).toBe('INT');
  });

  it('writes rechargeAbilities as JSON at index 13', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    await addNpcDB(npcData as any);
    const appendCall = vi.mocked(sheetsService.appendSheetData).mock.calls[0];
    const row = appendCall[2][0];
    expect(row[13]).toBe(JSON.stringify([{ name: 'Fire Breath', rechargeOn: 5 }]));
  });

  it('sets currentHp equal to maxHp at creation', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    await addNpcDB(npcData as any);
    const appendCall = vi.mocked(sheetsService.appendSheetData).mock.calls[0];
    const row = appendCall[2][0];
    expect(row[3]).toBe(200);
    expect(row[5]).toBe(200);
  });
});

describe('updateNpcFullDB — row array integrity', () => {
  const npc = {
    id: '101',
    name: 'Test Dragon',
    ac: 18,
    maxHp: 200,
    tempHp: 0,
    currentHp: 200,
    conditions: '',
    notes: 'Ancient dragon',
    resistances: 'fire',
    immunities: 'cold',
    vulnerabilities: '',
    legendaryActions: 3,
    legendaryResistances: 3,
    rechargeAbilities: [{ name: 'Fire Breath', rechargeOn: 5 }],
    abilityScores: '{"STR":27}',
    proficiencies: '{"proficiencyBonus":7}',
    speed: '40 ft., fly 80 ft.',
    senses: 'blindsight 60 ft., darkvision 120 ft.',
    languages: 'Common, Draconic',
    challengeRating: '24',
    traits: '[{"name":"Legendary Resistance","description":"3/day"}]',
    actions: '[{"name":"Multiattack","description":"3 attacks","recharge":""}]',
    reactions: '[{"name":"Wing Attack","description":"Reaction"}]',
    legendaryActionsList: '[{"name":"Detect","description":"Perception check","cost":1}]',
    spellcastingAbility: 'INT',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes spellcastingAbility to index 24 (col Y)', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['101']] });
    await updateNpcFullDB(npc as any);
    expect(writeQueue.queueWrite).toHaveBeenCalled();
    const writeCall = vi.mocked(writeQueue.queueWrite).mock.calls[0];
    const row = writeCall[2][0];
    expect(row[24]).toBe('INT');
  });

  it('writes actions JSON to index 21 (col V)', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['101']] });
    const updatedNpc = { ...npc, actions: '[{"name":"Bite","recharge":"Recharge 5-6"}]' };
    await updateNpcFullDB(updatedNpc as any);
    const writeCall = vi.mocked(writeQueue.queueWrite).mock.calls[0];
    const row = writeCall[2][0];
    expect(row[21]).toBe('[{"name":"Bite","recharge":"Recharge 5-6"}]');
  });

  it('writes to NPCs!A{row}:Y{row}', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({
      values: [['other'], ['other'], ['101']],
    });
    await updateNpcFullDB(npc as any);
    expect(writeQueue.queueWrite).toHaveBeenCalledWith(
      'mock-spreadsheet-id',
      'NPCs!A4:Y4',
      expect.any(Array)
    );
  });

  it('throws when NPC is not found in sheet', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['other']] });
    await expect(updateNpcFullDB(npc as any)).rejects.toThrow(/not found/i);
  });
});

describe('updateCharacterDB — row array integrity', () => {
  const fullState = {
    id: 'char-1',
    playerName: 'Player 1',
    characterName: 'Hero',
    ac: 15,
    maxHp: 50,
    tempHp: 0,
    currentHp: 50,
    conditions: '',
    passivePerception: 12,
    level: 3,
    statusId: 1,
    notes: '',
    resistances: '',
    immunities: '',
    vulnerabilities: '',
    tempHpMax: 0,
    tempAc: 0,
    deathSavesFails: 0,
    deathSavesSuccesses: 0,
    class: 'Paladin',
    hitDiceConfig: '',
    hitDiceUsed: '{}',
    resourcePools: '[]',
    abilityScores: '{}',
    proficiencies: '{}',
    spellcastingAbility: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes spellcastingAbility to index 25 (col Z)', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['char-1']] });
    await updateCharacterDB({ spellcastingAbility: 'WIS' }, fullState as any);
    expect(writeQueue.queueWrite).toHaveBeenCalled();
    const writeCall = vi.mocked(writeQueue.queueWrite).mock.calls[0];
    const row = writeCall[2][0];
    expect(row[25]).toBe('WIS');
  });

  it('writes proficiencies JSON to index 24 (col Y)', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['char-1']] });
    await updateCharacterDB(
      { proficiencies: '{"spellcastingAbility":"WIS","proficiencyBonus":2}' },
      fullState as any
    );
    const writeCall = vi.mocked(writeQueue.queueWrite).mock.calls[0];
    const row = writeCall[2][0];
    expect(row[24]).toContain('spellcastingAbility');
  });

  it('writes to Characters!A{row}:Z{row}', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({
      values: [['other'], ['char-1']],
    });
    await updateCharacterDB({}, fullState as any);
    expect(writeQueue.queueWrite).toHaveBeenCalledWith(
      'mock-spreadsheet-id',
      'Characters!A3:Z3',
      expect.any(Array)
    );
  });

  it('throws when character is not found in sheet', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['other']] });
    await expect(updateCharacterDB({}, fullState as any)).rejects.toThrow();
  });
});

describe('addCharacterDB — row structure', () => {
  it('writes 26 values with spellcastingAbility at index 25', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    await addCharacterDB({
      characterName: 'Mage',
      spellcastingAbility: 'CHA',
    });
    expect(sheetsService.appendSheetData).toHaveBeenCalledWith(
      'mock-spreadsheet-id',
      'Characters!A:Z',
      expect.any(Array)
    );
    const appendCall = vi.mocked(sheetsService.appendSheetData).mock.calls[0];
    const row = appendCall[2][0];
    expect(row).toHaveLength(26);
    expect(row[25]).toBe('CHA');
  });
});

describe('addCharacterDB — row array integrity', () => {
  const charData = {
    playerName: 'Player One',
    characterName: 'Paladin Hero',
    ac: 18,
    maxHp: 50,
    tempHp: 0,
    currentHp: 50,
    conditions: 'Inspired',
    passivePerception: 14,
    level: 5,
    statusId: 1,
    notes: 'A noble hero',
    resistances: 'Radiant',
    immunities: 'Poisoned',
    vulnerabilities: 'Necrotic',
    tempHpMax: 10,
    tempAc: 2,
    deathSavesFails: 1,
    deathSavesSuccesses: 2,
    class: 'Paladin',
    hitDiceConfig: '5d10',
    hitDiceUsed: '{"d10":2}',
    resourcePools: '[{"name":"Lay on Hands","current":25,"max":25}]',
    abilityScores: '{"STR":18,"CHA":16}',
    proficiencies: '{"athletics":true}',
    spellcastingAbility: 'CHA',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes all 26 fields at correct column indices (0–25)', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    await addCharacterDB(charData as any);
    
    expect(sheetsService.appendSheetData).toHaveBeenCalled();
    const row = vi.mocked(sheetsService.appendSheetData).mock.calls[0][2][0];
    
    expect(row).toHaveLength(26);
    expect(row[1]).toBe('Player One'); // playerName
    expect(row[2]).toBe('Paladin Hero'); // characterName
    expect(row[3]).toBe(18); // ac
    expect(row[4]).toBe(50); // maxHp
    expect(row[5]).toBe(0); // tempHp
    expect(row[6]).toBe(50); // currentHp
    expect(row[7]).toBe('Inspired'); // conditions
    expect(row[8]).toBe(14); // passivePerception
    expect(row[9]).toBe(5); // level
    expect(row[10]).toBe(1); // statusId
    expect(row[11]).toBe('A noble hero'); // notes
    expect(row[12]).toBe('Radiant'); // resistances
    expect(row[13]).toBe('Poisoned'); // immunities
    expect(row[14]).toBe('Necrotic'); // vulnerabilities
    expect(row[15]).toBe(10); // tempHpMax
    expect(row[16]).toBe(2); // tempAc
    expect(row[17]).toBe(1); // deathSavesFails
    expect(row[18]).toBe(2); // deathSavesSuccesses
    expect(row[19]).toBe('Paladin'); // class
    expect(row[20]).toBe('5d10'); // hitDiceConfig
    expect(row[21]).toBe('{"d10":2}'); // hitDiceUsed
    expect(row[22]).toBe('[{"name":"Lay on Hands","current":25,"max":25}]'); // resourcePools
    expect(row[23]).toBe('{"STR":18,"CHA":16}'); // abilityScores
    expect(row[24]).toBe('{"athletics":true}'); // proficiencies
    expect(row[25]).toBe('CHA'); // spellcastingAbility
  });
});

describe('deleteNpcDB and resetNpcHpDB', () => {
  it('deleteNpcDB throws when NPC not found', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    await expect(deleteNpcDB('nonexistent')).rejects.toThrow();
  });

  it('resetNpcHpDB updates only HP columns', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['npc-1']] });
    await resetNpcHpDB('npc-1', 100);
    expect(sheetsService.updateSheetData).toHaveBeenCalledWith(
      'mock-spreadsheet-id',
      'NPCs!F2',
      [['100']]
    );
  });
});

describe('NPC spellcastingAbility dual-write', () => {
  it('writes spellcastingAbility in both addNpcDB and updateNpcFullDB', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['npc-1']] });
    const npc = { id: 'npc-1', name: 'Mage', spellcastingAbility: 'WIS' };
    
    // Test update
    await updateNpcFullDB(npc as any);
    expect(writeQueue.queueWrite).toHaveBeenCalled();
    const updateRow = vi.mocked(writeQueue.queueWrite).mock.calls[0][2][0];
    expect(updateRow[24]).toBe('WIS');
    
    // Test add
    vi.clearAllMocks();
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    await addNpcDB(npc as any);
    const appendRow = vi.mocked(sheetsService.appendSheetData).mock.calls[0][2][0];
    expect(appendRow[24]).toBe('WIS');
  });
});

```

## File: src/lib/__tests__/combatantBuilder.test.ts

```typescript
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

```

## File: src/components/PartyTab/__tests__/usePartyRest.test.ts

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useParty } from '../hooks/useParty';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import * as sheetsService from '../../../services/sheetsService';
import { queueWrite } from '../../../services/writeQueue';

vi.mock('../../../services/sheetsService', () => ({
  fetchSheetData: vi.fn(),
  updateSheetData: vi.fn(),
  appendSheetData: vi.fn(),
  batchUpdateSpreadsheet: vi.fn(),
  fetchSpreadsheetMetadata: vi.fn(),
  getSpreadsheetId: vi.fn().mockReturnValue('mock-spreadsheet-id'),
}));

vi.mock('../../../services/writeQueue', () => ({
  queueWrite: vi.fn(),
}));

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn()
}));

describe('useParty - REST and Recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for findRowIndexById inside dbOperations
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['char-1'], ['pc-1'], ['pc-2'], ['pc-3'], ['pc-rest-write-1'], ['pc-longrest-write-1']] });
  });
  afterEach(() => vi.restoreAllMocks());

  it('handleLongRest resets all resource pools that restore on long rest', async () => {
    const updateStateSpy = vi.fn();
    const mockState = { characters: [{ 
      id: 'char-1', 
      resourcePools: JSON.stringify([{ name: 'Rage', current: 0, max: 3, reset: 'long' }]) 
    }] };

    vi.mocked(useAppState).mockReturnValue({
      state: mockState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue(mockState as any);

    const { result } = renderHook(() => useParty());
    
    await act(async () => {
      await result.current.handleLongRest(['char-1']);
    });

    const stateUpdater = updateStateSpy.mock.calls[0][0];
    const nextState = stateUpdater(mockState);
    const updatedPools = JSON.parse(nextState.characters[0].resourcePools);
    expect(updatedPools[0].current).toBe(3);
  });

  it('handleShortRest resets only pools that restore on short rest', async () => {
    const updateStateSpy = vi.fn();
    const mockState = { characters: [{ 
      id: 'char-1', 
      resourcePools: JSON.stringify([
        { name: 'Ki', current: 0, max: 3, reset: 'short' },
        { name: 'Rage', current: 0, max: 3, reset: 'long' }
      ]) 
    }] };

    vi.mocked(useAppState).mockReturnValue({
      state: mockState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue(mockState as any);

    const { result } = renderHook(() => useParty());
    
    await act(async () => {
      await result.current.handleShortRest([{ characterId: 'char-1', hpToAdd: 0, newHitDiceUsed: '{}' }]);
    });

    const stateUpdater = updateStateSpy.mock.calls[0][0];
    const nextState = stateUpdater(mockState);
    const updatedPools = JSON.parse(nextState.characters[0].resourcePools);
    
    expect(updatedPools[0].current).toBe(3); // Ki reset
    expect(updatedPools[1].current).toBe(0); // Rage not reset
  });

  it('handleLongRest resets hit dice used to empty', async () => {
    const updateStateSpy = vi.fn();
    const mockState = { characters: [{ 
      id: 'char-1', 
      hitDiceConfig: '1d10',
      hitDiceUsed: '{"d10":1}'
    }] };

    vi.mocked(useAppState).mockReturnValue({
      state: mockState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue(mockState as any);

    const { result } = renderHook(() => useParty());
    
    await act(async () => {
      await result.current.handleLongRest(['char-1']);
    });

    const stateUpdater = updateStateSpy.mock.calls[0][0];
    const nextState = stateUpdater(mockState);
    expect(nextState.characters[0].hitDiceUsed).toBe('{"d10":0}');
  });

  describe('Rest Selection and Pool Logic', () => {
    it('Short rest applies ONLY to selected PCs', async () => {
      const updateStateSpy = vi.fn();
      const char1 = { id: 'pc-1', currentHp: 10, maxHp: 20, resourcePools: JSON.stringify([{ name: 'Rage', current: 3, max: 5, reset: 'short' }]) };
      const char2 = { id: 'pc-2', currentHp: 10, maxHp: 20, resourcePools: JSON.stringify([{ name: 'Ki Points', current: 1, max: 10, reset: 'short' }]) };
      const char3 = { id: 'pc-3', currentHp: 10, maxHp: 20, resourcePools: JSON.stringify([{ name: 'Spell Slots', current: 0, max: 8, reset: 'short' }]) };
      
      const mockState = { characters: [char1, char2, char3] };

      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());

      await act(async () => {
        await result.current.handleShortRest([
          { characterId: 'pc-1', hpToAdd: 0, newHitDiceUsed: '{}' },
          { characterId: 'pc-3', hpToAdd: 0, newHitDiceUsed: '{}' }
        ]);
      });

      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);

      const updatedPc1 = nextState.characters.find((c: any) => c.id === 'pc-1');
      const updatedPc2 = nextState.characters.find((c: any) => c.id === 'pc-2');
      const updatedPc3 = nextState.characters.find((c: any) => c.id === 'pc-3');

      expect(JSON.parse(updatedPc1.resourcePools)[0].current).toBe(5);
      expect(JSON.parse(updatedPc3.resourcePools)[0].current).toBe(8);
      // pc-2 was not in the results array, so it should NOT be changed by the map in useParty.ts
      expect(updatedPc2.resourcePools).toBe(char2.resourcePools);
    });

    it('Short rest does not restore long-rest pools', async () => {
      const updateStateSpy = vi.fn();
      const char = { 
        id: 'pc-1', 
        currentHp: 10,
        maxHp: 20,
        resourcePools: JSON.stringify([
          { name: 'Rage', current: 2, max: 5, reset: 'short' },
          { name: 'Superiority Dice', current: 1, max: 4, reset: 'long' }
        ]) 
      };
      const mockState = { characters: [char] };

      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());

      await act(async () => {
        await result.current.handleShortRest([{ characterId: 'pc-1', hpToAdd: 0, newHitDiceUsed: '{}' }]);
      });

      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);
      const pools = JSON.parse(nextState.characters[0].resourcePools);
      
      expect(pools.find((p: any) => p.name === 'Rage').current).toBe(5);
      expect(pools.find((p: any) => p.name === 'Superiority Dice').current).toBe(1);
    });

    it('Long rest applies ONLY to selected PCs', async () => {
      const updateStateSpy = vi.fn();
      const char1 = { 
        id: 'pc-1', 
        maxHp: 50, 
        currentHp: 10,
        resourcePools: JSON.stringify([{ name: 'Rage', current: 0, max: 5, reset: 'short' }])
      };
      const char2 = { 
        id: 'pc-2', 
        maxHp: 40, 
        currentHp: 8,
        resourcePools: JSON.stringify([{ name: 'Spell Slots', current: 0, max: 10, reset: 'long' }])
      };
      const mockState = { characters: [char1, char2] };

      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());

      await act(async () => {
        await result.current.handleLongRest(['pc-1']);
      });

      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);
      
      const updatedPc1 = nextState.characters.find((c: any) => c.id === 'pc-1');
      const updatedPc2 = nextState.characters.find((c: any) => c.id === 'pc-2');

      expect(updatedPc1.currentHp).toBe(50);
      expect(JSON.parse(updatedPc1.resourcePools)[0].current).toBe(5);
      
      expect(updatedPc2.currentHp).toBe(8);
      expect(JSON.parse(updatedPc2.resourcePools)[0].current).toBe(0);
    });

    it('Long rest restores currentHp to maxHp', async () => {
      const updateStateSpy = vi.fn();
      const char = { id: 'pc-1', currentHp: 15, maxHp: 100 };
      const mockState = { characters: [char] };

      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());

      await act(async () => {
        await result.current.handleLongRest(['pc-1']);
      });

      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);
      expect(nextState.characters[0].currentHp).toBe(100);
    });
  });

  describe('Workflows - Database Integrity', () => {
    it('short rest writes resourcePools at index 22 for selected PC', async () => {
      const char = { 
        id: 'pc-rest-write-1', 
        currentHp: 10, 
        maxHp: 20, 
        resourcePools: JSON.stringify([{ name: 'Rage', current: 2, max: 5, reset: 'short' }]) 
      };
      const mockState = { characters: [char] };
      vi.mocked(useAppState).mockReturnValue({ state: mockState as any, updateState: vi.fn(), getSnapshot: vi.fn() } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleShortRest([{ characterId: 'pc-rest-write-1', hpToAdd: 0, newHitDiceUsed: '{}' }]);
      });

      expect(queueWrite).toHaveBeenCalled();
      const calls = vi.mocked(queueWrite).mock.calls;
      const writtenRow = calls[0][2][0];
      const pools = JSON.parse(writtenRow[22]);
      expect(pools[0].name).toBe('Rage');
      expect(pools[0].current).toBe(5);
      expect(calls[0][1]).toContain('Characters!');
    });

    it('short rest does NOT call DB for unselected PCs', async () => {
      const pc1 = { id: 'pc-1', currentHp: 10, maxHp: 20, resourcePools: JSON.stringify([{ name: 'Rage', current: 2, max: 5, reset: 'short' }]) };
      const pc2 = { id: 'pc-2', currentHp: 10, maxHp: 20, resourcePools: JSON.stringify([{ name: 'Ki', current: 3, max: 10, reset: 'short' }]) };
      const mockState = { characters: [pc1, pc2] };
      vi.mocked(useAppState).mockReturnValue({ state: mockState as any, updateState: vi.fn(), getSnapshot: vi.fn() } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleShortRest([{ characterId: 'pc-1', hpToAdd: 0, newHitDiceUsed: '{}' }]);
      });

      expect(queueWrite).toHaveBeenCalledTimes(1);
      const writtenRow = vi.mocked(queueWrite).mock.calls[0][2][0];
      expect(writtenRow[0]).toBe('pc-1');
    });

    it('long rest writes currentHp, hitDiceUsed, and resourcePools to sheet at correct indices', async () => {
      const char = { 
        id: 'pc-longrest-write-1', 
        currentHp: 20, 
        maxHp: 80,
        level: 10,
        hitDiceConfig: '10d10',
        hitDiceUsed: '{"d10":5}',
        resourcePools: JSON.stringify([{ name: 'Spell Slots', current: 0, max: 8, reset: 'long' }]) 
      };
      const mockState = { characters: [char] };
      vi.mocked(useAppState).mockReturnValue({ state: mockState as any, updateState: vi.fn(), getSnapshot: vi.fn() } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleLongRest(['pc-longrest-write-1']);
      });

      expect(queueWrite).toHaveBeenCalled();
      const writtenRow = vi.mocked(queueWrite).mock.calls[0][2][0];
      
      expect(writtenRow[6]).toBe(80); // currentHp
      expect(JSON.parse(writtenRow[21])).toEqual({ d10: 0 }); // hitDiceUsed reset (recovers 5 of 5)
      const pools = JSON.parse(writtenRow[22]);
      expect(pools[0].name).toBe('Spell Slots');
      expect(pools[0].current).toBe(8);
    });

    it('long rest does NOT call DB for unselected PCs', async () => {
      const pc1 = { id: 'pc-1', currentHp: 10, maxHp: 60 };
      const pc2 = { id: 'pc-2', currentHp: 5, maxHp: 40 };
      const mockState = { characters: [pc1, pc2] };
      vi.mocked(useAppState).mockReturnValue({ state: mockState as any, updateState: vi.fn(), getSnapshot: vi.fn() } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleLongRest(['pc-1']);
      });

      expect(queueWrite).toHaveBeenCalledTimes(1);
      const writtenRow = vi.mocked(queueWrite).mock.calls[0][2][0];
      expect(writtenRow[0]).toBe('pc-1');
    });
  });
});

```

## File: src/components/PartyTab/__tests__/usePartyCharacterCrud.test.ts

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useParty } from '../hooks/useParty';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { deleteCharacterFully, addCharacterDB, updateCharacterDB } from '../../../services/dbOperations';

vi.mock('../../../services/dbOperations', () => ({
  deleteCharacterFully: vi.fn().mockResolvedValue(undefined),
  addCharacterDB: vi.fn(),
  updateCharacterDB: vi.fn(),
}));

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn()
}));

describe('useParty - Character CRUD', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('handleUpdate writes changed fields to the database', async () => {
    const mockChar = { id: 'char-1', characterName: 'Testo' };
    vi.mocked(useAppState).mockReturnValue({
      state: { characters: [mockChar] } as any,
      updateState: vi.fn(),
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue({ characters: [mockChar] } as any);

    const { result } = renderHook(() => useParty());
    
    await act(async () => {
      await result.current.handleUpdate('char-1', { maxHp: 50 });
    });

    expect(updateCharacterDB).toHaveBeenCalledWith(expect.objectContaining({ maxHp: 50 }), expect.objectContaining({ id: 'char-1' }));
  });

  it('handleUpdate rolls back state when the DB write fails', async () => {
    const updateStateSpy = vi.fn();
    const mockState = { characters: [{ id: 'char-1', maxHp: 20 }] };

    vi.mocked(useAppState).mockReturnValue({
      state: mockState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue(mockState as any);
    vi.mocked(updateCharacterDB).mockRejectedValue(new Error('Fail'));

    const { result } = renderHook(() => useParty());
    
    await act(async () => {
      await result.current.handleUpdate('char-1', { maxHp: 50 });
    });

    // One optimistic update, one rollback
    expect(updateStateSpy).toHaveBeenCalledTimes(2);
  });

  it('handleDelete removes the character from store state and calls deleteCharacterDB', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    const updateStateSpy = vi.fn();
    const mockState = { characters: [{ id: 'char-1' }] };

    vi.mocked(useAppState).mockReturnValue({
      state: mockState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue(mockState as any);

    const { result } = renderHook(() => useParty());
    
    await act(async () => {
      await result.current.handleDeletePlayer('char-1');
    });

    expect(deleteCharacterFully).toHaveBeenCalled();
    expect(updateStateSpy).toHaveBeenCalledTimes(1); // optimistic update
  });

  describe('Level Up Flow', () => {
    it('handleUpdate includes level-up fields', async () => {
      const mockChar = { 
        id: 'pc-1', 
        characterName: 'Barbarian', 
        class: 'Barbarian', 
        level: 4, 
        maxHp: 44,
        resourcePools: JSON.stringify([{ name: 'Rage', current: 3, max: 3, reset: 'short' }])
      };
      vi.mocked(useAppState).mockReturnValue({
        state: { characters: [mockChar] } as any,
        updateState: vi.fn(),
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue({ characters: [mockChar] } as any);

      const { result } = renderHook(() => useParty());

      const levelUpData = {
        level: 5,
        maxHp: 54,
        currentHp: 54,
        hitDiceConfig: '5d12',
        resourcePools: JSON.stringify([{ name: 'Rage', current: 3, max: 3, reset: 'short' }]),
        proficiencies: '{}'
      };

      await act(async () => {
        await result.current.handleUpdate('pc-1', levelUpData);
      });

      expect(updateCharacterDB).toHaveBeenCalledWith(
        expect.objectContaining({
          ...levelUpData,
          passivePerception: 10,
          proficiencies: expect.stringContaining('"proficiencyBonus":3')
        }),
        expect.objectContaining({ id: 'pc-1' })
      );
    });
  });
});

```

## File: src/components/EncountersTab/__tests__/useEncounters.test.ts

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEncounters } from '../hooks/useEncounters';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { addEncounterDB, deleteEncounterFully } from '../../../services/dbOperations';

vi.mock('../../../services/dbOperations', () => ({
  addEncounterDB: vi.fn().mockResolvedValue({ id: 'real-enc-1', name: 'Goblin Ambush', location: 'Woods', difficultyId: 2, status: 'planned', difficultyName: 'Medium' }),
  deleteEncounterFully: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn()
}));

describe('useEncounters', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('handleCreateEncounter adds an encounter to store state and calls the DB', async () => {
    const updateStateSpy = vi.fn();
    vi.mocked(useAppState).mockReturnValue({
      state: { encounters: [], difficulties: { 1: 'Easy', 2: 'Medium' } } as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);

    const { result } = renderHook(() => useEncounters({ onSelectEncounter: vi.fn(), onSyncRequested: vi.fn() }));
    
    await act(async () => {
      await result.current.handleCreateEncounter({ name: 'Goblin Ambush', location: 'Woods', difficultyId: 2 });
    });

    expect(addEncounterDB).toHaveBeenCalled();
    expect(updateStateSpy).toHaveBeenCalled();
  });

  it('handleDeleteEncounter removes the encounter from store state', async () => {
    const mockEnc = { id: 'enc-1', name: 'Goblin Ambush', location: 'Woods' };
    const updateStateSpy = vi.fn();
    vi.mocked(useAppState).mockReturnValue({
      state: { encounters: [mockEnc], encounterCombatants: [] } as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);

    const { result } = renderHook(() => useEncounters({ onSelectEncounter: vi.fn(), onSyncRequested: vi.fn() }));
    
    await act(async () => {
      await result.current.handleDelete(mockEnc as any);
    });

    expect(deleteEncounterFully).toHaveBeenCalled();
    expect(updateStateSpy).toHaveBeenCalled();
  });

  it('handleCreateEncounter writes all required fields and appears in store', async () => {
    const updateStateSpy = vi.fn();
    const initialState = { encounters: [], difficulties: { 3: 'Hard' } };
    vi.mocked(useAppState).mockReturnValue({
      state: initialState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn().mockReturnValue(initialState),
    } as any);

    const { result } = renderHook(() => useEncounters({ onSelectEncounter: vi.fn(), onSyncRequested: vi.fn() }));
    const encounterData = { name: 'Goblin Ambush', location: 'Dark Forest', difficultyId: 3 };

    await act(async () => {
      await result.current.handleCreateEncounter(encounterData);
    });

    expect(addEncounterDB).toHaveBeenCalledWith(
      'Goblin Ambush',
      'Dark Forest',
      3,
      0
    );
    
    // Check optimistic update
    const stateUpdater = updateStateSpy.mock.calls[0][0];
    const nextState = stateUpdater(initialState);
    expect(nextState.encounters.length).toBe(1);
    expect(nextState.encounters[0].name).toBe('Goblin Ambush');
  });

  it('Failed encounter creation rolls back state', async () => {
    const updateStateSpy = vi.fn();
    const initialState = { encounters: [], difficulties: { 1: 'Easy' } };
    vi.mocked(useAppState).mockReturnValue({
      state: initialState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn().mockReturnValue(initialState),
    } as any);

    vi.mocked(addEncounterDB).mockRejectedValue(new Error('Fail'));

    const { result } = renderHook(() => useEncounters({ onSelectEncounter: vi.fn(), onSyncRequested: vi.fn() }));
    
    await act(async () => {
      await result.current.handleCreateEncounter({ name: 'Fail', location: '', difficultyId: 1 });
    });

    // Optimistic update + rollback
    expect(updateStateSpy).toHaveBeenCalledTimes(2);
    expect(updateStateSpy).toHaveBeenLastCalledWith(initialState);
  });
});

```

## File: src/hooks/__tests__/useSheetSync.test.ts

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSheetSync } from '../useSheetSync';
import { useAppState } from '../useAppState';
import * as sheetsService from '../../services/sheetsService';

vi.mock('../../services/writeQueue', () => ({
  clearRetryQueue: vi.fn(),
}));

vi.mock('../../services/sheetsService', () => ({
  fetchSheetData: vi.fn(),
  initializeDatabaseSchema: vi.fn(),
  getSpreadsheetId: vi.fn().mockReturnValue('mock-id'),
}));

vi.mock('../useAppState', () => ({
  useAppState: vi.fn(),
}));

describe('useSheetSync State Transition Tests', () => {
  const setIsGoogleConnected = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pulls all sheet data and populates characters, npcs, and encounters in the store', async () => {
    let updateStateCalledWith: any = null;
    vi.mocked(useAppState).mockReturnValue({
      state: { hasInitialSynced: false },
      updateState: (fn: any) => { 
        updateStateCalledWith = typeof fn === 'function' ? fn({}) : fn; 
      }
    } as any);

    vi.mocked(sheetsService.initializeDatabaseSchema).mockResolvedValue(undefined);
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['1', 'Goblin']] });

    const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected }));

    await act(async () => {
      await result.current.handleSyncWithSheets(false);
    });

    expect(updateStateCalledWith).not.toBeNull();
    expect(updateStateCalledWith.characters).toBeDefined();
    expect(updateStateCalledWith.npcs).toBeDefined();
    expect(updateStateCalledWith.encounters).toBeDefined();
  });

  it('resets hasInitialSynced to true upon successful initial load', async () => {
    let updateStateCalledWith: any = null;
    vi.mocked(useAppState).mockReturnValue({
      state: { hasInitialSynced: false },
      updateState: (fn: any) => { 
        updateStateCalledWith = typeof fn === 'function' ? fn({}) : fn; 
      }
    } as any);

    vi.mocked(sheetsService.initializeDatabaseSchema).mockResolvedValue(undefined);
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['1', 'data']] });

    const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected }));

    await act(async () => {
      await result.current.handleSyncWithSheets(false);
    });

    expect(updateStateCalledWith.hasInitialSynced).toBe(true);
  });

  it('handles API errors by triggering a rollback or setting an error state', async () => {
    let updateStateCalledWith: any = null;
    vi.mocked(useAppState).mockReturnValue({
      state: { hasInitialSynced: false },
      updateState: (fn: any) => { 
        updateStateCalledWith = typeof fn === 'function' ? fn({}) : fn; 
      }
    } as any);

    vi.mocked(sheetsService.initializeDatabaseSchema).mockRejectedValue(new Error('API failure'));

    const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected }));

    await act(async () => {
      await result.current.handleSyncWithSheets(false);
    });

    expect(updateStateCalledWith).toBeNull(); // No state update upon failure
    expect(result.current.syncError).toBe('API failure');
  });
});

```

## File: src/hooks/__tests__/useDeathSaves.test.ts

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeathSaves } from '../useDeathSaves';
import { useAppState, getSnapshot } from '../useAppState';
import { updateDeathSavesDB, updateCharacterDB } from '../../services/dbOperations';
import { toast } from 'sonner';

vi.mock('../useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn(),
}));

vi.mock('../useOverlayEvents', () => ({
  useDeathEvent: () => ({ fire: vi.fn() }),
  useUnconsciousEvent: () => ({ fire: vi.fn() }),
}));

vi.mock('../../services/dbOperations', () => ({
  updateDeathSavesDB: vi.fn(),
  updateCharacterDB: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

describe('useDeathSaves', () => {
  const mockUpdateState = vi.fn();
  const mockState = {
    characters: [
      { id: 'char1', characterName: 'Test PC', deathSavesFails: 0, deathSavesSuccesses: 0, isActive: true, conditions: 'Unconscious' }
    ],
    combatState: {
      combatants: [
        { id: 'c1', name: 'Test PC', type: 'pc', characterId: 'char1', deathSavesFails: 0, deathSavesSuccesses: 0, conditions: 'Unconscious' }
      ]
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppState as any).mockReturnValue({
      updateState: mockUpdateState,
      state: mockState
    });
    (getSnapshot as any).mockReturnValue(mockState);
  });

  it('recording a failure increments fail count', async () => {
    const { result } = renderHook(() => useDeathSaves());
    await act(async () => {
      await result.current.recordDeathSave('c1', 'failure');
    });
    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 1, 0);
  });

  it('recording a success increments success count', async () => {
    const { result } = renderHook(() => useDeathSaves());
    await act(async () => {
      await result.current.recordDeathSave('c1', 'success');
    });
    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 0, 1);
  });

  it('3 failures triggers character death', async () => {
    const dyingState = {
      ...mockState,
      combatState: {
        combatants: [{ ...mockState.combatState.combatants[0], deathSavesFails: 2 }]
      }
    };
    (getSnapshot as any).mockReturnValue(dyingState);

    const { result } = renderHook(() => useDeathSaves());
    await act(async () => {
      await result.current.recordDeathSave('c1', 'failure');
    });

    expect(updateCharacterDB).toHaveBeenCalledWith(
      expect.objectContaining({ statusId: 3 }),
      expect.anything()
    );
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('has died'));
  });

  it('3 successes triggers character stabilization', async () => {
    const stableState = {
      ...mockState,
      combatState: {
        combatants: [{ ...mockState.combatState.combatants[0], deathSavesSuccesses: 2 }]
      }
    };
    (getSnapshot as any).mockReturnValue(stableState);

    const { result } = renderHook(() => useDeathSaves());
    await act(async () => {
      await result.current.recordDeathSave('c1', 'success');
    });

    expect(toast).toHaveBeenCalledWith(expect.stringContaining('is stable'));
  });

  it('reset clears both fail and success counts', async () => {
    // Under 3 successes, stabilization resets the counts to 0
    const stableState = {
      ...mockState,
      combatState: {
        combatants: [{ ...mockState.combatState.combatants[0], deathSavesSuccesses: 2, deathSavesFails: 1 }]
      }
    };
    (getSnapshot as any).mockReturnValue(stableState);

    const { result } = renderHook(() => useDeathSaves());
    await act(async () => {
      await result.current.recordDeathSave('c1', 'success');
    });

    // Expecting state to be reset (deathSavesFails: 0, deathSavesSuccesses: 0)
    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 0, 0);
  });

  it('a natural 20 on a death save triggers stabilization immediately', async () => {
    // Mock character with 1 success, then critical success (adds 2 successes) to reach 3 successes (stabilization)
    const almostStableState = {
      ...mockState,
      combatState: {
        combatants: [{ ...mockState.combatState.combatants[0], deathSavesSuccesses: 1 }]
      }
    };
    (getSnapshot as any).mockReturnValue(almostStableState);

    const { result } = renderHook(() => useDeathSaves());
    await act(async () => {
      await result.current.recordDeathSave('c1', 'success', true);
    });

    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 0, 3);
    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 0, 0); // Cleared upon stabilization
  });

  it('a natural 1 on a death save counts as 2 failures', async () => {
    const { result } = renderHook(() => useDeathSaves());
    await act(async () => {
      await result.current.recordDeathSave('c1', 'failure', true);
    });

    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 2, 0);
  });
});

```

