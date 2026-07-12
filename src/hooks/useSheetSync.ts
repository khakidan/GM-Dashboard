// src/hooks/useSheetSync.ts

import { useState } from 'react';
import { useAppState } from './useAppState';
import {
  fetchSheetData,
  getSpreadsheetId,
  resolveActiveSpreadsheetId,
} from '../services/sheetsService';
import { clearRetryQueue } from '../services/writeQueue';
import { Character, Encounter, NPC, EncounterCombatant, Condition, Spell } from '../types';
import { STORAGE_KEYS, SHEET_RANGES } from '../lib/constants';
import {
  parseStatuses,
  parseDifficulties,
  parseNPCs,
  parseEncounters,
  parseEncounterCombatants,
  parseCharacters,
  parseConditions,
  parseSpells,
} from '../lib/sheetSyncParser';

interface UseSheetSyncProps {
  setIsGoogleConnected: (val: boolean) => void;
  onActiveTabChange?: (tab: 'party' | 'encounters' | 'npc-library' | 'combat') => void;
}

export function useSheetSync({ setIsGoogleConnected, onActiveTabChange }: UseSheetSyncProps) {
  const { state, updateState } = useAppState();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleSyncWithSheets = async (isManual = true) => {
    let hadError = false;
    const sid = resolveActiveSpreadsheetId();

    if (isManual) {
      setSyncLogs([]);
      setIsSyncing(true);
    }
    
    if (!state.hasInitialSynced) {
      clearRetryQueue();
    }

    addLog(`Sync process started for: ${sid}`);
    setSyncError(null);

    try {
      addLog('Step 1: Validating authentication...');

      // 1. Fetch Statuses
      addLog('Step 2: Fetching status definitions...');
      const statusRes = await fetchSheetData(sid, 'Status!A2:B');
      const statuses = parseStatuses(statusRes.values || []);
      addLog(`Status types loaded: ${Object.keys(statuses).length}`);

      // 2. Fetch Difficulties
      addLog('Step 3: Fetching difficulty levels...');
      const diffRes = await fetchSheetData(sid, 'Difficulty_Level!A2:B');
      const difficulties = parseDifficulties(diffRes.values || []);
      addLog(`Difficulty settings loaded: ${Object.keys(difficulties).length}`);

      // 3. Fetch NPCs
      addLog('Step 4: Loading NPC library...');
      const npcRes = await fetchSheetData(sid, SHEET_RANGES.npcs);
      const parsedNPCs = parseNPCs(npcRes.values || []);
      addLog(`NPC entries loaded: ${parsedNPCs.length}`);

      // 4. Fetch Characters
      addLog('Step 5: Fetching character roster...');
      const charactersResponse = await fetchSheetData(sid, SHEET_RANGES.characters);
      const characterRows = charactersResponse.values || [];
      addLog(`Character rows found: ${characterRows.length}`);

      // 5. Fetch Encounters
      addLog('Step 6: Loading encounter log...');
      const encountersResponse = await fetchSheetData(sid, 'Encounters!A2:G');
      const parsedEncounters = parseEncounters(encountersResponse.values || [], difficulties);
      addLog(`Encounters found: ${parsedEncounters.length}`);

      // 6. Fetch Encounter Combatants
      addLog('Step 7: Synching active combatants...');
      let parsedEncounterCombatants: EncounterCombatant[] = [];
      try {
        const ecResponse = await fetchSheetData(sid, SHEET_RANGES.encounterCombatants);
        parsedEncounterCombatants = parseEncounterCombatants(ecResponse.values || []);
        addLog(`Combatant links loaded: ${parsedEncounterCombatants.length}`);
      } catch (err) {
        addLog('Relational combatant data skipped.');
      }

      // 7. Fetch Conditions
      addLog('Step 8: Loading conditions reference...');
      let parsedConditions: Condition[] = [];
      try {
        const condRes = await fetchSheetData(sid, 'Conditions!A2:C');
        parsedConditions = parseConditions(condRes.values || []);
        addLog(`Conditions loaded: ${parsedConditions.length}`);
      } catch (err) {
        addLog('Conditions reference data skipped (sheet may not exist yet).');
      }

      // 8. Fetch Spells
      addLog('Step 9: Loading spells reference...');
      let parsedSpells: Spell[] = [];
      try {
        const spellRes = await fetchSheetData(sid, 'Spells!A2:N');
        parsedSpells = parseSpells(spellRes.values || []);
        addLog(`Spells loaded: ${parsedSpells.length}`);
      } catch (err) {
        addLog('Spells reference data skipped (sheet may not exist yet).');
      }

      updateState(prev => {
        const parsedCharacters = parseCharacters(characterRows, statuses);
        return {
          ...prev,
          hasInitialSynced: true,
          characters: parsedCharacters,
          encounters: parsedEncounters,
          npcs: parsedNPCs,
          encounterCombatants: parsedEncounterCombatants,
          conditions: parsedConditions,
          spells: parsedSpells,
          statuses,
          difficulties,
        };
      });

      setLastSyncTime(new Date());
      setIsGoogleConnected(true);
      addLog('Sync successful. Campaign data is now local.');

    } catch (err: unknown) {
      hadError = true;
      console.error('[GMDashboard] Sync failed:', err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred';

      if (message === 'UNAUTHENTICATED') {
        addLog('ERROR: Login Session Expired.');
        setIsGoogleConnected(false);
        setSyncError('Your login session has expired. Please sign in with Google again.');
      } else {
        addLog(`ERROR: ${message}`);
        setSyncError(message);
      }
    } finally {
      if (!isManual) setIsSyncing(false);
      if (isManual && !hadError) {
        setTimeout(() => setIsSyncing(false), 800);
      }
    }
  };

  return {
    handleSyncWithSheets,
    isSyncing,
    setIsSyncing,
    syncError,
    setSyncError,
    syncLogs,
    lastSyncTime,
    addLog,
  };
}
