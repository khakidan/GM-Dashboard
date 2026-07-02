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
  deleteEncounterLog,
} from '../dbOperations';

vi.mock('../sheetsService', () => ({
  fetchSheetData: vi.fn(),
  updateSheetData: vi.fn(),
  appendSheetData: vi.fn(),
  batchUpdateSpreadsheet: vi.fn(),
  fetchSpreadsheetMetadata: vi.fn(),
  getSpreadsheetId: vi.fn().mockReturnValue('mock-spreadsheet-id'),
  resolveActiveSpreadsheetId: vi.fn().mockReturnValue('mock-spreadsheet-id'),
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
    expect(row[24]).toBe('{"athletics":true,"spellcastingAbility":"CHA"}'); // proficiencies
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
    expect(
      JSON.parse(updateRow[15]).spellcastingAbility
    ).toBe('WIS');
    
    // Test add
    vi.clearAllMocks();
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    await addNpcDB(npc as any);
    const appendRow = vi.mocked(sheetsService.appendSheetData).mock.calls[0][2][0];
    expect(appendRow[24]).toBe('WIS');
  });
});

import { deleteEncounterLog } from '../dbOperations';

describe('deleteEncounterLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when log not found', async () => {
    vi.mocked(sheetsService.fetchSpreadsheetMetadata).mockResolvedValue({
      sheets: [{ properties: { title: 'EncounterLogs', sheetId: 999 } }],
    } as any);
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    
    await expect(deleteEncounterLog('log-nonexistent')).rejects.toThrow('Encounter log log-nonexistent not found');
  });

  it('resolves correct sheetId and deletes the row', async () => {
    // 1. Mock fetchSpreadsheetMetadata to return EncounterLogs with sheetId 999
    // alongside another sheet to prove it picks the correct one
    vi.mocked(sheetsService.fetchSpreadsheetMetadata).mockResolvedValue({
      sheets: [
        { properties: { title: 'Characters', sheetId: 101 } },
        { properties: { title: 'EncounterLogs', sheetId: 999 } },
      ],
    } as any);

    // 2. Mock fetchSheetData so the log is found at row index 0 (which translates to startIndex 1)
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({
      values: [['log-123', 'encounter-abc', 'Goblin Ambush']],
    });

    // 3. Call deleteEncounterLog
    await deleteEncounterLog('log-123');

    // 4. Assert batchUpdateSpreadsheet is called with the exact sheetId 999
    expect(sheetsService.batchUpdateSpreadsheet).toHaveBeenCalled();
    const batchUpdateCall = vi.mocked(sheetsService.batchUpdateSpreadsheet).mock.calls[0];
    const requests = batchUpdateCall[1];
    
    expect(requests).toHaveLength(1);
    expect(requests[0].deleteDimension?.range?.sheetId).toBe(999);
    expect(requests[0].deleteDimension?.range?.startIndex).toBe(1);
    expect(requests[0].deleteDimension?.range?.endIndex).toBe(2);
  });
});
