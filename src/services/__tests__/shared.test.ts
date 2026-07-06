// src/services/__tests__/shared.test.ts

import { describe, it, expect, vi } from 'vitest';
import { SHEET_RANGES } from '../../lib/constants';
import { NpcRowSchema, CharacterRowSchema } from '../../lib/sheetSchemas';

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
  it("SHEET_RANGES.npcs covers 22 columns (A:V) matching NpcRowSchema", () => {
    expect(SHEET_RANGES.npcs).toMatch(/:V$/);
    const row = [
      '1', 'A', '10', '10', '', '', '', '', '0', '0', '[]', '{}', '{}', '', '', '', '', '[]', '[]', '[]', '[]', ''
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
