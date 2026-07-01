import { useState } from 'react';
import { readEncounterLogs } from '../../../services/dbOperations';
import { getSpreadsheetId } from '../../../services/sheetsService';
import { STORAGE_KEYS } from '../../../lib/constants';
import { EncounterLog } from '../../../lib/combatLog';
import { parseEncounterLogs } from '../../../lib/sheetAdapters';

export function useEncounterLogs() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogsForEncounter = async (encounterId: string): Promise<EncounterLog[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const spreadsheetId = localStorage.getItem(STORAGE_KEYS.activeCampaignSpreadsheetId) ||
                            localStorage.getItem(STORAGE_KEYS.spreadsheetId) ||
                            getSpreadsheetId() ||
                            import.meta.env.VITE_SPREADSHEET_ID || '';

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
  };

  return {
    fetchLogsForEncounter,
    isLoading,
    error,
  };
}
