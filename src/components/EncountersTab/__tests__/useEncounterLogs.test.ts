import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEncounterLogs } from '../hooks/useEncounterLogs';
import { readEncounterLogs, deleteEncounterLog } from '../../../services/dbOperations';
import { resolveActiveSpreadsheetId } from '../../../services/sheetsService';

vi.mock('../../../services/dbOperations', () => ({
  readEncounterLogs: vi.fn(),
  deleteEncounterLog: vi.fn(),
}));

vi.mock('../../../services/sheetsService', () => ({
  getSpreadsheetId: vi.fn(),
  resolveActiveSpreadsheetId: vi.fn(),
}));

describe('useEncounterLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveActiveSpreadsheetId).mockReturnValue('mock-spreadsheet-id');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchLogsForEncounter', () => {
    it('calls readEncounterLogs with the resolved spreadsheetId and returns logs filtered to the given encounterId, sorted most recent first by date', async () => {
      const mockLogs = [
        ['log-1', 'enc-1', 'Encounter 1', 'Location 1', '2023-01-01T10:00:00Z', 5, 'Victory', '[]', '[]', 'transcript 1'],
        ['log-2', 'enc-1', 'Encounter 1', 'Location 1', '2023-01-01T12:00:00Z', 3, 'Defeat', '[]', '[]', 'transcript 2'],
        ['log-3', 'enc-2', 'Encounter 2', 'Location 2', '2023-01-01T11:00:00Z', 4, 'Victory', '[]', '[]', 'transcript 3'],
      ];

      vi.mocked(readEncounterLogs).mockResolvedValue(mockLogs);

      const { result } = renderHook(() => useEncounterLogs());

      let logs;
      await act(async () => {
        logs = await result.current.fetchLogsForEncounter('enc-1');
      });

      expect(resolveActiveSpreadsheetId).toHaveBeenCalled();
      expect(readEncounterLogs).toHaveBeenCalledWith('mock-spreadsheet-id');
      
      expect(logs).toHaveLength(2);
      // @ts-ignore
      expect(logs[0].id).toBe('log-2'); // Most recent first
      // @ts-ignore
      expect(logs[1].id).toBe('log-1');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('returns empty array and sets error state when readEncounterLogs throws', async () => {
      vi.mocked(readEncounterLogs).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useEncounterLogs());

      let logs;
      await act(async () => {
        logs = await result.current.fetchLogsForEncounter('enc-1');
      });

      expect(logs).toHaveLength(0);
      expect(result.current.error).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('deleteLog', () => {
    it('calls deleteEncounterLog with the resolved spreadsheetId and logId, returns true on success', async () => {
      vi.mocked(deleteEncounterLog).mockResolvedValue(undefined);

      const { result } = renderHook(() => useEncounterLogs());

      let success;
      await act(async () => {
        success = await result.current.deleteLog('log-1');
      });

      expect(deleteEncounterLog).toHaveBeenCalledWith('mock-spreadsheet-id', 'log-1');
      expect(success).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('returns false and sets error state when deleteEncounterLog throws', async () => {
      vi.mocked(deleteEncounterLog).mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useEncounterLogs());

      let success;
      await act(async () => {
        success = await result.current.deleteLog('log-1');
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Delete failed');
      expect(result.current.isLoading).toBe(false);
    });
  });
});
