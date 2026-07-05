// src/services/__tests__/characters.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as sheetsService from '../sheetsService';
import * as writeQueue from '../writeQueue';
import {
  updateCharacterDB,
  addCharacterDB,
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
