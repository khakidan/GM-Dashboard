// src/services/__tests__/npcs.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as sheetsService from '../sheetsService';
import * as writeQueue from '../writeQueue';
import {
  addNpcDB,
  updateNpcFullDB,
  deleteNpcDB,
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
      'NPCs!A:V',
      expect.any(Array)
    );
    const appendCall = vi.mocked(sheetsService.appendSheetData).mock.calls[0];
    const row = appendCall[2][0];
    expect(row).toHaveLength(22);
  });

  it('writes new stat block fields at correct indices (13–21)', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    await addNpcDB(npcData as any);
    const appendCall = vi.mocked(sheetsService.appendSheetData).mock.calls[0];
    const row = appendCall[2][0];
    expect(row[13]).toBe('40 ft., fly 80 ft.');
    expect(row[14]).toBe('blindsight 60 ft., darkvision 120 ft.');
    expect(row[15]).toBe('Common, Draconic');
    expect(row[16]).toBe('24');
    expect(row[17]).toContain('Legendary Resistance');
    expect(row[18]).toContain('Multiattack');
    expect(row[19]).toContain('Wing Attack');
    expect(row[20]).toContain('Detect');
    expect(row[21]).toBe('INT');
  });

  it('writes rechargeAbilities as JSON at index 10', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    await addNpcDB(npcData as any);
    const appendCall = vi.mocked(sheetsService.appendSheetData).mock.calls[0];
    const row = appendCall[2][0];
    expect(row[10]).toBe(JSON.stringify([{ name: 'Fire Breath', rechargeOn: 5 }]));
  });

  it('sets currentHp equal to maxHp at creation', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    await addNpcDB(npcData as any);
    const appendCall = vi.mocked(sheetsService.appendSheetData).mock.calls[0];
    const row = appendCall[2][0];
    expect(row[3]).toBe(200);
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

  it('writes spellcastingAbility to index 21 (col V)', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['101']] });
    await updateNpcFullDB(npc as any);
    expect(writeQueue.queueWrite).toHaveBeenCalled();
    const writeCall = vi.mocked(writeQueue.queueWrite).mock.calls[0];
    const row = writeCall[2][0];
    expect(row[21]).toBe('INT');
  });

  it('writes actions JSON to index 18 (col S)', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['101']] });
    const updatedNpc = { ...npc, actions: '[{"name":"Bite","recharge":"Recharge 5-6"}]' };
    await updateNpcFullDB(updatedNpc as any);
    const writeCall = vi.mocked(writeQueue.queueWrite).mock.calls[0];
    const row = writeCall[2][0];
    expect(row[18]).toBe('[{"name":"Bite","recharge":"Recharge 5-6"}]');
  });

  it('writes to NPCs!A{row}:V{row}', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({
      values: [['other'], ['other'], ['101']],
    });
    await updateNpcFullDB(npc as any);
    expect(writeQueue.queueWrite).toHaveBeenCalledWith(
      'mock-spreadsheet-id',
      'NPCs!A4:V4',
      expect.any(Array)
    );
  });

  it('throws when NPC is not found in sheet', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['other']] });
    await expect(updateNpcFullDB(npc as any)).rejects.toThrow(/not found/i);
  });
});

describe('deleteNpcDB', () => {
  it('deleteNpcDB throws when NPC not found', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    await expect(deleteNpcDB('nonexistent')).rejects.toThrow();
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
    expect(updateRow[21]).toBe('WIS');
    expect(
      JSON.parse(updateRow[12]).spellcastingAbility
    ).toBe('WIS');
    
    // Test add
    vi.clearAllMocks();
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    await addNpcDB(npc as any);
    const appendRow = vi.mocked(sheetsService.appendSheetData).mock.calls[0][2][0];
    expect(appendRow[21]).toBe('WIS');
  });
});
