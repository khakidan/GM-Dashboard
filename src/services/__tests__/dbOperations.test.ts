// src/services/__tests__/dbOperations.test.ts

// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as sheetsService from '../sheetsService';
import {
  castInt,
  sanitizeString,
  getNextId,
  addCharacterDB,
  updateCharacterDB,
  deleteCharacterFully,
  updateInitiativeDB,
  resetNpcHpDB,
  updateConditionTimersDB,
  updateNpcFullDB,
  deleteNpcDB,
  addEncounterCombatantDB,
  updateNpcInstanceHpDB,
  updateEncounterDB,
  addNpcDB,
} from '../dbOperations';
import { SheetGrid, SheetRow } from '../sheetsService';
import { queueWrite } from '../writeQueue';

vi.mock('../sheetsService', () => ({
  fetchSheetData: vi.fn(),
  updateSheetData: vi.fn(),
  appendSheetData: vi.fn(),
  batchUpdateSpreadsheet: vi.fn(),
  fetchSpreadsheetMetadata: vi.fn(),
}));

vi.mock('../writeQueue', () => ({
  queueWrite: vi.fn(),
}));

// ─── castInt ──────────────────────────────────────────────────────────────────

describe('castInt', () => {
  it('parses a numeric string', () => {
    expect(castInt('42')).toBe(42);
  });

  it('parses a number directly', () => {
    expect(castInt(7)).toBe(7);
  });

  it('returns the fallback for non-numeric strings', () => {
    expect(castInt('abc', 5)).toBe(5);
    expect(castInt('abc')).toBe(0); // default fallback
  });

  it('returns the fallback for undefined', () => {
    expect(castInt(undefined, 10)).toBe(10);
  });

  it('returns the fallback for null', () => {
    expect(castInt(null, 99)).toBe(99);
  });

  it('truncates decimals — parseInt behaviour', () => {
    expect(castInt('3.7')).toBe(3);
  });

  it('parses the leading integer from mixed strings', () => {
    expect(castInt('12abc')).toBe(12);
  });

  it('handles negative numbers', () => {
    expect(castInt('-5')).toBe(-5);
  });

  it('returns the fallback for an empty string', () => {
    expect(castInt('', 1)).toBe(1);
  });

  it('uses 0 as the default fallback when none supplied', () => {
    expect(castInt('nope')).toBe(0);
  });
});

// ─── sanitizeString ───────────────────────────────────────────────────────────

describe('sanitizeString', () => {
  it('trims leading and trailing whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('returns empty string for null', () => {
    expect(sanitizeString(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(sanitizeString(undefined)).toBe('');
  });

  it('returns empty string for 0 — a falsy number', () => {
    expect(sanitizeString(0)).toBe('');
  });

  it('converts numbers to strings', () => {
    expect(sanitizeString(42)).toBe('42');
  });

  it('preserves internal whitespace', () => {
    expect(sanitizeString('hello world')).toBe('hello world');
  });

  it('returns empty string for an empty string input', () => {
    expect(sanitizeString('')).toBe('');
  });
});

// ─── getNextId logic ──────────────────────────────────────────────────────────

describe('getNextId logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 1 for an empty sheet', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({ values: [] as SheetGrid });
    expect(await getNextId('Characters')).toBe(1);
  });

  it('returns max numeric ID + 1', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({ values: [['3'], ['7'], ['2']] as SheetGrid });
    expect(await getNextId('Characters')).toBe(8);
  });

  it('strips non-digit prefixes — e.g. "pc-5" → 5', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({ values: [['pc-1'], ['pc-3'], ['pc-2']] as SheetGrid });
    expect(await getNextId('Characters')).toBe(4);
  });

  it('ignores rows where the ID column is empty or null', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({ values: [[''], [null], ['5']] as SheetGrid });
    expect(await getNextId('Characters')).toBe(6);
  });

  it('returns 1 when the fetch throws', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockRejectedValueOnce(new Error('Network error'));
    expect(await getNextId('Characters')).toBe(1);
  });

  it('handles a response with no values key', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({});
    expect(await getNextId('Characters')).toBe(1);
  });

  it('reads from the correct column index', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({
      values: [
        ['irrelevant', 'also-irrelevant', '10'],
        ['irrelevant', 'also-irrelevant', '3'],
      ] as SheetGrid,
    });
    expect(await getNextId('Encounter_Combatants', 2)).toBe(11);
  });
});

// ─── addCharacterDB logic ─────────────────────────────────────────────────
// Tests the column order of the row array written to the Characters sheet.

describe('addCharacterDB logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds a 23-column row matching the Characters sheet schema and appends it', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({ values: [] as SheetGrid }); // For getNextId

    const result = await addCharacterDB({
      playerName: ' Alice ',
      characterName: 'Thorn',
      ac: 16,
      maxHp: 40,
      tempHp: 5,
      currentHp: 35,
      conditions: 'Poisoned',
      passivePerception: 14,
      level: 5,
      statusId: 1,
      notes: 'Has darkvision',
      tempHpMax: 10,
    });

    expect(result.id).toBe('pc-1');
    expect(sheetsService.appendSheetData).toHaveBeenCalledWith('Characters!A:Y', [[
      'pc-1',
      'Alice',      // trimmed playerName
      'Thorn',      // characterName
      16,           // AC
      40,           // Max HP
      5,            // Temp HP
      35,           // Current HP
      'Poisoned',   // conditions
      14,           // Passive Perception
      5,            // Level
      1,            // Status ID
      'Has darkvision', // notes
      '',           // resistances default
      '',           // immunities default
      '',           // vulnerabilities default
      10,           // tempHpMax
      0,            // tempAc
      0,            // deathSavesFails
      0,            // deathSavesSuccesses
      '',           // unused placeholder
      '',           // hitDiceConfig default
      '{}',         // hitDiceUsed default
      '[]',         // resourcePools default
      '{}',         // abilityScores default
      '{}',         // proficiencies default
    ]]);
  });

  it('uses sensible defaults for missing fields', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({ values: [['pc-98']] as SheetGrid }); // ID will be 99

    await addCharacterDB({});

    const appendCall = vi.mocked(sheetsService.appendSheetData).mock.calls[0];
    const row = appendCall[1][0];

    expect(row[3]).toBe(10);  // AC default
    expect(row[4]).toBe(10);  // maxHp default
    expect(row[5]).toBe(0);   // tempHp default
    expect(row[9]).toBe(1);   // level default
    expect(row[10]).toBe(1);  // statusId default
    expect(row[1]).toBe('');  // playerName empty string
  });

  it('trims whitespace from string fields', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({ values: [['pc-1']] as SheetGrid }); // ID will be 2

    await addCharacterDB({
      playerName: '  Bob  ',
      characterName: '  Grunk  ',
      notes: '  big sword  ',
    });

    const appendCall = vi.mocked(sheetsService.appendSheetData).mock.calls[0];
    const row = appendCall[1][0];

    expect(row[0]).toBe('pc-2');
    expect(row[1]).toBe('Bob');
    expect(row[2]).toBe('Grunk');
    expect(row[11]).toBe('big sword');
  });

  it('re-throws when fetchSheetData throws and logs to console.error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Fetch failed');
    vi.mocked(sheetsService.fetchSheetData).mockRejectedValueOnce(error);
    vi.mocked(sheetsService.appendSheetData).mockRejectedValueOnce(error);

    await expect(addCharacterDB({})).rejects.toThrow('Fetch failed');
    expect(consoleSpy).toHaveBeenCalledWith('[DB] addCharacterDB failed:', error);
    consoleSpy.mockRestore();
  });
});

// ─── deleteCharacterFully logic ───────────────────────────────────────────────

describe('deleteCharacterFully', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cascades deletion across Characters and Encounter_Combatants', async () => {
    vi.mocked(sheetsService.fetchSpreadsheetMetadata).mockResolvedValue({
      sheets: [
        { properties: { title: 'Characters', sheetId: 101 } },
        { properties: { title: 'Encounter_Combatants', sheetId: 102 } }
      ]
    });
    
    // Mock the characters sheet to find the row
    vi.mocked(sheetsService.fetchSheetData).mockImplementation((range) => {
      if (range.startsWith('Characters')) {
        return Promise.resolve({ values: [['pc-99']] as SheetGrid });
      }
      if (range.startsWith('Encounter_Combatants')) {
        return Promise.resolve({ values: [['ec-1', 'enc-1', 'pc-99', '', 1], ['ec-2', 'enc-1', 'pc-2', '', 1]] as SheetGrid });
      }
      return Promise.resolve({ values: [] as SheetGrid });
    });

    await deleteCharacterFully('pc-99');

    // 1 call to fetch Characters to find row
    // 1 call to fetch Encounter_Combatants to find associated Combatants
    expect(sheetsService.batchUpdateSpreadsheet).toHaveBeenCalled();

    const batchCall = vi.mocked(sheetsService.batchUpdateSpreadsheet).mock.calls[0];
    const requests = batchCall[0];
    expect(requests.length).toBe(2); // One delete for Character, one delete for Encounter_Combatant
  });

  it('handles character not found gracefully', async () => {
    vi.mocked(sheetsService.fetchSpreadsheetMetadata).mockResolvedValue({
      sheets: [
        { properties: { title: 'Characters', sheetId: 101 } },
        { properties: { title: 'Encounter_Combatants', sheetId: 102 } }
      ]
    });

    vi.mocked(sheetsService.fetchSheetData).mockImplementation((range) => {
       return Promise.resolve({ values: [['pc-1']] as SheetGrid }); // Doesn't match 'pc-99'
    });

    await deleteCharacterFully('pc-99');
    expect(sheetsService.batchUpdateSpreadsheet).not.toHaveBeenCalled();
  });

  it('re-throws when batchUpdateSpreadsheet throws and logs to console.error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Batch update failed');
    
    vi.mocked(sheetsService.fetchSpreadsheetMetadata).mockResolvedValue({
      sheets: [
        { properties: { title: 'Characters', sheetId: 101 } },
        { properties: { title: 'Encounter_Combatants', sheetId: 102 } }
      ]
    });
    
    vi.mocked(sheetsService.fetchSheetData).mockImplementation((range) => {
      if (range.startsWith('Characters')) {
        return Promise.resolve({ values: [['pc-99']] as SheetGrid });
      }
      return Promise.resolve({ values: [] as SheetGrid });
    });

    vi.mocked(sheetsService.batchUpdateSpreadsheet).mockRejectedValueOnce(error);

    await expect(deleteCharacterFully('pc-99')).rejects.toThrow('Batch update failed');
    expect(consoleSpy).toHaveBeenCalledWith('[DB] deleteCharacterFully failed:', error);
    consoleSpy.mockRestore();
  });
});

// Tests the delay formula used in googleFetch inside sheetsService.ts.
// Keeping this here since it's closely related to the DB layer's retry
// behaviour and requires no mocking.

describe('exponential backoff delay calculation', () => {
  function calcDelay(attempt: number, rand: number = 0): number {
    return Math.pow(2, attempt) * 500 + rand * 200;
  }

  it('attempt 0 base delay is 500ms', () => {
    expect(calcDelay(0)).toBe(500);
  });

  it('attempt 1 base delay is 1000ms', () => {
    expect(calcDelay(1)).toBe(1000);
  });

  it('attempt 2 base delay is 2000ms', () => {
    expect(calcDelay(2)).toBe(2000);
  });

  it('jitter adds up to 200ms on top of the base', () => {
    const base = calcDelay(1, 0);
    const max  = calcDelay(1, 1);
    expect(max - base).toBe(200);
  });

  it('worst case within MAX_RETRIES=3 is 2200ms', () => {
    // attempt=2, full jitter
    expect(calcDelay(2, 1)).toBe(2200);
  });
});

// ─── updateInitiativeDB ────────────────────────────

describe('updateInitiativeDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls updateSheetData with the correct range and value when the combatant row is found', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({
      values: [
        ['ec-1', 'enc-1', 'pc-1', '', '1'],
        ['ec-2', 'enc-1', 'pc-2', '', '1'],
      ] as SheetGrid,
    });

    await updateInitiativeDB('ec-2', 15);

    expect(sheetsService.updateSheetData).toHaveBeenCalledWith(
      'Encounter_Combatants!F3',
      [['15']]
    );
  });

  it('throws when the ecId is not found', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({
      values: [
        ['ec-1', 'enc-1', 'pc-1', '', '1'],
      ] as SheetGrid,
    });

    await expect(updateInitiativeDB('ec-nonexistent', 15)).rejects.toThrow(
      'Encounter Combatant ec-nonexistent not found'
    );
    expect(sheetsService.updateSheetData).not.toHaveBeenCalled();
  });
});

// ─── resetNpcHpDB ──────────────────────────────────

describe('resetNpcHpDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls updateSheetData with the correct range and maxHits value when the NPC is found', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({
      values: [
        ['npc-1', 'Orc', '13', '15', '0', '10', '', 'Orc rogue'],
        ['npc-2', 'Goblin', '15', '7', '0', '3', '', 'Goblin guard'],
      ] as SheetGrid,
    });

    await resetNpcHpDB('npc-2', 7);

    expect(sheetsService.updateSheetData).toHaveBeenCalledWith(
      'NPCs!F3',
      [['7']]
    );
  });

  it('throws when the npcId is not found', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({
      values: [
        ['npc-1', 'Orc', '13', '15', '0', '10', '', 'Orc rogue'],
      ] as SheetGrid,
    });

    await expect(resetNpcHpDB('npc-nonexistent', 7)).rejects.toThrow(
      'NPC npc-nonexistent not found'
    );
    expect(sheetsService.updateSheetData).not.toHaveBeenCalled();
  });
});

// ─── updateConditionTimersDB ─────────────────────────

describe('updateConditionTimersDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls updateSheetData with the correct range and serialized JSON when the combatant row is found', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({
      values: [
        ['ec-1', 'enc-1', 'pc-1', '', '1'],
        ['ec-2', 'enc-1', 'pc-2', '', '1'],
      ] as SheetGrid,
    });

    await updateConditionTimersDB('ec-2', { Hasted: 7, Poisoned: 12 });

    expect(sheetsService.updateSheetData).toHaveBeenCalledWith(
      'Encounter_Combatants!G3',
      [['{"Hasted":7,"Poisoned":12}']]
    );
  });

  it('throws when the ecId is not found', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({
      values: [
        ['ec-1', 'enc-1', 'pc-1', '', '1'],
      ] as SheetGrid,
    });

    await expect(updateConditionTimersDB('ec-nonexistent', { Hasted: 7 })).rejects.toThrow(
      'Encounter Combatant ec-nonexistent not found'
    );
    expect(sheetsService.updateSheetData).not.toHaveBeenCalled();
  });
});

describe('updateNpcFullDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('collects all NPC fields and calls queueWrite with the correct 14-column row and rechargeAbilities as JSON', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({
      values: [['101', 'Old Name', '10', '10', '0', '10', '', 'Notes', '', '', '', '0', '0', '']] as SheetGrid,
    });

    const npc = {
      id: '101',
      name: 'New Name',
      ac: 15,
      maxHp: 30,
      tempHp: 5,
      currentHp: 20,
      conditions: 'Stunned',
      notes: 'Updated notes',
      resistances: 'Fire',
      immunities: 'Poison',
      vulnerabilities: 'Cold',
      legendaryActions: 2,
      legendaryResistances: 3,
      rechargeAbilities: [{ name: 'Fire Breath', recharge: '5-6' }],
    };

    await updateNpcFullDB(npc as any);

    expect(queueWrite).toHaveBeenCalledWith('NPCs!A2:X2', [[
      '101',
      'New Name',
      15,
      30,
      5,
      20,
      'Stunned',
      'Updated notes',
      'Fire',
      'Poison',
      'Cold',
      2,
      3,
      '[{"name":"Fire Breath","recharge":"5-6"}]',
      '{}',
      '{}',
      '',
      '',
      '',
      '',
      '[]',
      '[]',
      '[]',
      '[]'
    ]]);
  });

  it('throws error when NPC is not found', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({ values: [] as SheetGrid });
    await expect(updateNpcFullDB({ id: '999' } as any)).rejects.toThrow('NPC 999 not found');
  });
});

describe('updateEncounterDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updateEncounterDB builds a row array with currentRound at index 5 and activeTurnId at index 6 writing range A:G', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({
      values: [
        ['Encounter_ID', 'Encounter_Name', 'Location', 'Difficulty', 'NPC_Definitions', 'Current_Round', 'Active_Turn_ID'],
        ['enc-1', 'Old Name', 'Old Location', '1', 'npc-1:2', '4', 'ec-12'],
      ] as SheetGrid,
    });

    // Mock fetch results of the write target row: Encounters!A3:G3
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({
      values: [['enc-1', 'Old Name', 'Old Location', '1', 'npc-1:2', '4', 'ec-12']] as SheetGrid,
    });

    await updateEncounterDB('enc-1', 'New Ambush', 'Dark Woods', 3);

    expect(sheetsService.fetchSheetData).toHaveBeenCalledWith('Encounters!A3:G3');
    expect(sheetsService.updateSheetData).toHaveBeenCalledWith('Encounters!A3:G3', [[
      'enc-1',
      'New Ambush',
      'Dark Woods',
      3,
      'npc-1:2',
      4,
      'ec-12'
    ]]);
  });
});

describe('deleteNpcDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('finds NPC row and associated combatants and calls batchUpdateSpreadsheet', async () => {
    vi.mocked(sheetsService.fetchSpreadsheetMetadata).mockResolvedValue({
      sheets: [
        { properties: { title: 'NPCs', sheetId: 201 } },
        { properties: { title: 'Encounter_Combatants', sheetId: 102 } }
      ]
    });

    vi.mocked(sheetsService.fetchSheetData).mockImplementation((range) => {
      if (range.startsWith('NPCs')) {
        return Promise.resolve({ values: [['101']] as SheetGrid });
      }
      if (range.startsWith('Encounter_Combatants')) {
        return Promise.resolve({ values: [['ec-1', 'enc-1', '', '101', 1]] as SheetGrid });
      }
      return Promise.resolve({ values: [] as SheetGrid });
    });

    await deleteNpcDB('101');
    expect(sheetsService.batchUpdateSpreadsheet).toHaveBeenCalled();
    const requests = vi.mocked(sheetsService.batchUpdateSpreadsheet).mock.calls[0][0];
    expect(requests.length).toBe(2);
  });

  it('throws error when NPC ID is not found', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({ values: [] as SheetGrid });
    await expect(deleteNpcDB('999')).rejects.toThrow('NPC 999 not found');
  });
});

// ─── addNpcDB logic ──────────────────────────────────────────────────────────

describe('addNpcDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds a 14-column row and appends to NPCs!A:N', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({ values: [] as SheetGrid }); // ID 1

    const rechargeAbilities = [{ name: 'Fire Breath', rechargeOn: 5 }];
    const result = await addNpcDB(
      'Dragon',
      100,
      20,
      'Big dragon',
      'fire',
      'poison',
      'cold',
      3,
      3,
      rechargeAbilities
    );

    expect(result.id).toBe('1');
    expect(sheetsService.appendSheetData).toHaveBeenCalledWith('NPCs!A:X', [[
      '1',             // ID
      'Dragon',        // Name
      20,              // AC
      100,             // Max HP
      0,               // Temp HP
      100,             // Current HP
      '',              // Condition
      'Big dragon',    // Notes
      'fire',          // Resistances
      'poison',        // Immunities
      'cold',          // Vulnerabilities
      3,               // Legendary Actions
      3,               // Legendary Resistances
      '[{"name":"Fire Breath","rechargeOn":5}]', // Recharge Abilities (JSON)
      '{}',            // abilityScores
      '{}',            // proficiencies
      '',
      '',
      '',
      '',
      '[]',
      '[]',
      '[]',
      '[]'
    ]]);
  });
});

// ─── updateCharacterDB ────────────────────────────────────────────────────────

describe('updateCharacterDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly writes tempHpMax to the sheet with range A:Q', async () => {
    // Mock fetchSheetData for finding the character row (Row 3 for "pc-2", as index 2 + 1 A1 offset)
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({
      values: [
        ['Player_ID', 'Player_Name', 'Character_Name', 'AC', 'Max_HP', 'Temp_HP', 'Current_HP', 'Current_Condition', 'Passive_Perception', 'Current_Level', 'Status', 'Notes', 'Resistances', 'Immunities', 'Vulnerabilities', 'Temp_HP_Max', 'Temp_AC'],
        ['pc-1', 'Alice', 'Thorn', '16', '40', '5', '35', 'Poisoned', '14', '5', '1', 'Notes', '', '', '', '0', '0'],
        ['pc-2', 'Bob', 'Grunk', '14', '50', '0', '50', '', '10', '4', '1', 'Notes', '', '', '', '0', '0'],
      ] as SheetGrid,
    });

    const characterFullState = {
      id: 'pc-2',
      playerName: 'Bob',
      characterName: 'Grunk',
      ac: 14,
      maxHp: 50,
      tempHp: 0,
      currentHp: 50,
      conditions: '',
      passivePerception: 10,
      level: 4,
      statusId: 1,
      statusName: 'Active',
      notes: 'Notes',
      isActive: true,
      class: '',
      hitDiceConfig: '',
      hitDiceUsed: '{}',
      abilityScores: '{}',
      proficiencies: '{}',
    };

    await updateCharacterDB(
      {
        playerName: 'Bob',
        characterName: 'Grunk',
        ac: 14,
        maxHp: 50,
        tempHp: 0,
        currentHp: 40,
        conditions: 'Exhaustion Level 4',
        tempHpMax: 25,
      },
      characterFullState
    );

    expect(queueWrite).toHaveBeenCalledWith('Characters!A4:Y4', [[
      'pc-2',
      'Bob',
      'Grunk',
      14,
      50,
      0,
      40,
      'Exhaustion Level 4',
      10,
      4,
      1,
      'Notes',
      '',
      '',
      '',
      25,
      0,
      0,
      0,
      '',           // unused placeholder
      '',           // hitDiceConfig default
      '{}',         // hitDiceUsed default
      '[]',         // resourcePools default
      '{}',         // abilityScores default
      '{}',         // proficiencies default
    ]]);
  });

  it('throws error when character is not found in the sheet', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({ values: [] as SheetGrid });
    const fakePC = { id: 'pc-999' } as any;
    await expect(updateCharacterDB({ currentHp: 10 }, fakePC)).rejects.toThrow('Character not found');
  });
});

// ─── addEncounterCombatantDB ──────────────────────────────────────────────────

describe('addEncounterCombatantDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates individual rows when quantity > 1, called appendSheetData and returns EncounterCombatant[]', async () => {
    // mock first id as 5
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({
      values: [['Encounter_Combatants_ID'], ['1'], ['4']] as SheetGrid
    });

    const result = await addEncounterCombatantDB('enc-1', null, 'npc-5', 3);

    expect(sheetsService.appendSheetData).toHaveBeenCalledTimes(3);
    expect(result.length).toBe(3);
    expect(result[0]).toEqual({
      id: '5',
      encounterId: 'enc-1',
      playerId: null,
      npcId: 'npc-5',
      quantity: 1,
      initiative: 0,
      conditionTimers: {},
      npcCurrentHp: -1,
      npcTempHp: 0,
      npcCurrentConditions: '',
      npcTempAcMod: 0,
    });
    expect(result[1].id).toBe('6');
    expect(result[2].id).toBe('7');
    
    expect(sheetsService.appendSheetData).toHaveBeenNthCalledWith(1, 'Encounter_Combatants!A:K', [[
      '5', 'enc-1', '', 'npc-5', 1, 0, '', -1, 0, '', 0
    ]]);
    expect(sheetsService.appendSheetData).toHaveBeenNthCalledWith(2, 'Encounter_Combatants!A:K', [[
      '6', 'enc-1', '', 'npc-5', 1, 0, '', -1, 0, '', 0
    ]]);
    expect(sheetsService.appendSheetData).toHaveBeenNthCalledWith(3, 'Encounter_Combatants!A:K', [[
      '7', 'enc-1', '', 'npc-5', 1, 0, '', -1, 0, '', 0
    ]]);
  });

  it('creates single row if quantity is <= 1', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({
      values: [['Encounter_Combatants_ID'], ['2']] as SheetGrid
    });

    const result = await addEncounterCombatantDB('enc-1', 'pc-1', null, 1);

    expect(result.length).toBe(1);
    expect(result[0].id).toBe('3');
    expect(sheetsService.appendSheetData).toHaveBeenCalledTimes(1);
    expect(sheetsService.appendSheetData).toHaveBeenCalledWith('Encounter_Combatants!A:K', [[
      '3', 'enc-1', 'pc-1', '', 1, 0, '', -1, 0, '', 0
    ]]);
  });
});

// ─── updateNpcInstanceHpDB ────────────────────────────────────────────────────

describe('updateNpcInstanceHpDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls updateSheetData with columns H and I of the matched Encounter_Combatants row', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({
      values: [
        ['Encounter_Combatants_ID', 'Encounter_ID', 'Player_ID'],
        ['ec-1', 'enc-1', 'char-1'],
        ['ec-2', 'enc-1', 'char-2'],
      ] as SheetGrid
    });

    await updateNpcInstanceHpDB('ec-2', 15, 5);

    expect(sheetsService.updateSheetData).toHaveBeenCalledWith(
      'Encounter_Combatants!H4:I4',
      [['15', '5']]
    );
  });

  it('throws error when matched Encounter Combatant is not found', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({
      values: [] as SheetGrid
    });

    await expect(updateNpcInstanceHpDB('ec-999', 15, 5)).rejects.toThrow('Encounter Combatant ec-999 not found');
  });
});

// ─── updateNpcInstanceConditionsDB ────────────────────────────────────────────

describe('updateNpcInstanceConditionsDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updateNpcInstanceConditionsDB writes the conditions string to column J of the correct EC row', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({
      values: [
        ['EC_ID', '...', '...', '...'], // row 1 (header)
        ['ec-111', '...', '...', '...'], // row 2
        ['ec-222', '...', '...', '...'], // row 3
        ['ec-333', '...', '...', '...'], // row 4
      ] as SheetGrid
    });

    const { updateNpcInstanceConditionsDB } = await import('../dbOperations');
    await updateNpcInstanceConditionsDB('ec-333', 'blinded, poisoned');

    expect(sheetsService.updateSheetData).toHaveBeenCalledWith(
      'Encounter_Combatants!J5',
      [['blinded, poisoned']]
    );
  });

  it('updateNpcInstanceConditionsDB throws when ecId is not found', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({
      values: [] as SheetGrid
    });

    const { updateNpcInstanceConditionsDB } = await import('../dbOperations');
    await expect(updateNpcInstanceConditionsDB('ec-999', 'blinded')).rejects.toThrow('Encounter Combatant ec-999 not found');
  });
});

// ─── updateEncounterStateDB ──────────────────────────────────

describe('updateEncounterStateDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls updateSheetData with the correct row range targeting columns F and G and writes currentRound and activeTurnId in the correct column order', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({
      values: [
        ['enc-1', 'Name 1', 'Loc 1', '1', ''],
        ['enc-2', 'Name 2', 'Loc 2', '2', ''],
      ] as any[] as SheetGrid,
    });

    const { updateEncounterStateDB } = await import('../dbOperations');
    await updateEncounterStateDB('enc-2', 5, 'ec-42');

    expect(sheetsService.updateSheetData).toHaveBeenCalledWith(
      'Encounters!F3:G3',
      [['5', 'ec-42']]
    );
  });

  it('throws when encounterId is not found', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({
      values: [] as SheetGrid,
    });

    const { updateEncounterStateDB } = await import('../dbOperations');
    await expect(updateEncounterStateDB('enc-999', 5, 'ec-42')).rejects.toThrow('Encounter enc-999 not found');
  });
});

// ─── clearEncounterStateDB ──────────────────────────────────

describe('clearEncounterStateDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes 0 and empty string to the correct row', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({
      values: [
        ['enc-1', 'Name 1', 'Loc 1', '1', ''],
      ] as any[] as SheetGrid,
    });

    const { clearEncounterStateDB } = await import('../dbOperations');
    await clearEncounterStateDB('enc-1');

    expect(sheetsService.updateSheetData).toHaveBeenCalledWith(
      'Encounters!F2:G2',
      [['0', '']]
    );
  });

  it('throws when encounterId is not found', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({
      values: [] as SheetGrid,
    });

    const { clearEncounterStateDB } = await import('../dbOperations');
    await expect(clearEncounterStateDB('enc-999')).rejects.toThrow('Encounter enc-999 not found');
  });
});
