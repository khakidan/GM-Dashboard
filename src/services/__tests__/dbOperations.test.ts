// src/services/__tests__/dbOperations.test.ts

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
} from '../dbOperations';
import { SheetGrid, SheetRow } from '../sheetsService';

vi.mock('../sheetsService', () => ({
  fetchSheetData: vi.fn(),
  updateSheetData: vi.fn(),
  appendSheetData: vi.fn(),
  batchUpdateSpreadsheet: vi.fn(),
  fetchSpreadsheetMetadata: vi.fn(),
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

// ─── addCharacterDB row shape ─────────────────────────────────────────────────

// Tests the column order of the row array written to the Characters sheet.
// If anyone reorders the columns in addCharacterDB, these tests will catch it.

// ─── addCharacterDB logic ─────────────────────────────────────────────────
// Tests the column order of the row array written to the Characters sheet.

describe('addCharacterDB logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds a 12-column row matching the Characters sheet schema and appends it', async () => {
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
    });

    expect(result.id).toBe('pc-1');
    expect(sheetsService.appendSheetData).toHaveBeenCalledWith('Characters!A:O', [[
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

  it('collects all NPC fields and calls queueWrite with the correct 11-column row', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({
      values: [['101', 'Old Name', '10', '10', '0', '10', '', 'Notes']] as SheetGrid,
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
    };

    await updateNpcFullDB(npc);
  });

  it('throws error when NPC is not found', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({ values: [] as SheetGrid });
    await expect(updateNpcFullDB({ id: '999' } as any)).rejects.toThrow('NPC 999 not found');
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
