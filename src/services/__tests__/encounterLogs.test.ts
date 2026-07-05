// src/services/__tests__/encounterLogs.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as sheetsService from '../sheetsService';
import { deleteEncounterLog } from '../dbOperations';

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
