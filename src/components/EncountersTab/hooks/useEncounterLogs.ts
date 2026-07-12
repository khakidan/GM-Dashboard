import { useState, useCallback } from 'react';
import { readEncounterLogs, deleteEncounterLog } from '../../../services/dbOperations';
import { getSpreadsheetId, resolveActiveSpreadsheetId } from '../../../services/sheetsService';
import { STORAGE_KEYS } from '../../../lib/constants';
import { EncounterLog } from '../../../lib/combatLog';
import { parseEncounterLogs } from '../../../lib/sheetAdapters';

export function useEncounterLogs() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogsForEncounter = useCallback(async (encounterId: string): Promise<EncounterLog[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const spreadsheetId = resolveActiveSpreadsheetId();

      if (!spreadsheetId) {
        throw new Error('No campaign spreadsheet ID found.');
      }

      const rawRows = await readEncounterLogs(spreadsheetId);
      const allLogs = parseEncounterLogs(rawRows);
      
      // Filter for logs matching the given encounterId, sorted most recent first by date
      const filtered = allLogs
        .filter(log => log.encounterId === encounterId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return filtered;
    } catch (err: any) {
      console.error('[useEncounterLogs] fetchLogsForEncounter failed:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to fetch encounter logs.';
      setError(errMsg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteLog = async (logId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const spreadsheetId = resolveActiveSpreadsheetId();

      if (!spreadsheetId) {
        throw new Error('No campaign spreadsheet ID found.');
      }

      await deleteEncounterLog(spreadsheetId, logId);
      return true;
    } catch (err: any) {
      console.error('[useEncounterLogs] deleteLog failed:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to delete encounter log.';
      setError(errMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchLogsForEncounter,
    deleteLog,
    isLoading,
    error,
  };
}
