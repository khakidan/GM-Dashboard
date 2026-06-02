// src/hooks/useSheetSync.ts

import { useState } from 'react';
import { z } from 'zod';
import { useAppState, getSnapshot } from './useAppState';
import {
  fetchSheetData,
  initializeDatabaseSchema,
  getSpreadsheetId,
} from '../services/sheetsService';
import { clearRetryQueue } from '../services/writeQueue';
import { Character, Encounter, Combatant, NPC, EncounterCombatant } from '../types';
import {
  CharacterRowSchema,
  NpcRowSchema,
  EncounterRowSchema,
  EncounterCombatantRowSchema,
  StatusRowSchema,
  DifficultyRowSchema,
} from '../lib/sheetSchemas';
import {
  mapCharacterRowToCharacter,
  mapNpcRowToNpc,
  mapEncounterRowToEncounter,
  mapEncounterCombatantRowToEC,
} from '../lib/sheetAdapters';
import { buildCombatantsFromState } from '../lib/combatantBuilder';

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
    const sid = getSpreadsheetId();
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
      await initializeDatabaseSchema();
      addLog('Authentication valid. Schema verified.');

      // 1. Fetch Statuses
      addLog('Step 2: Fetching status definitions...');
      const statusRes = await fetchSheetData('Status!A2:B');
      const parsedStatuses = (statusRes.values || [])
        .map((row, i) => {
          const result = StatusRowSchema.safeParse(row);
          if (!result.success) {
            console.warn('[Sync] Status row', i, 'failed validation:',
              result.error.issues);
            return null;
          }
          return result.data;
        })
        .filter((item): item is z.infer<typeof StatusRowSchema> => item !== null);

      const statuses: Record<string, string> = {};
      parsedStatuses.forEach(([id, name]) => {
        statuses[id.toString()] = name;
      });
      addLog(`Status types loaded: ${Object.keys(statuses).length}`);

      // 2. Fetch Difficulties
      addLog('Step 3: Fetching difficulty levels...');
      const diffRes = await fetchSheetData('Difficulty_Level!A2:B');
      const parsedDifficulties = (diffRes.values || [])
        .map((row, i) => {
          const result = DifficultyRowSchema.safeParse(row);
          if (!result.success) {
            console.warn('[Sync] Difficulty_Level row', i, 'failed validation:',
              result.error.issues);
            return null;
          }
          return result.data;
        })
        .filter((item): item is z.infer<typeof DifficultyRowSchema> => item !== null);

      const difficulties: Record<string, string> = {};
      parsedDifficulties.forEach(([id, name]) => {
        difficulties[id.toString()] = name;
      });
      addLog(`Difficulty settings loaded: ${Object.keys(difficulties).length}`);

      // 3. Fetch NPCs
      addLog('Step 4: Loading NPC library...');
      const npcRes = await fetchSheetData('NPCs!A2:N');
      const parsedNPCs: NPC[] = (npcRes.values || [])
        .map((row, i) => {
          const result = NpcRowSchema.safeParse(row);
          if (!result.success) {
            console.warn('[Sync] NPCs row', i, 'failed validation:',
              result.error.issues);
            return null;
          }
          return mapNpcRowToNpc(result.data, i);
        })
        .filter((npc): npc is NPC => npc !== null);
      addLog(`NPC entries loaded: ${parsedNPCs.length}`);

      // 4. Fetch Characters
      addLog('Step 5: Fetching character roster...');
      const charactersResponse = await fetchSheetData('Characters!A2:S');
      const characterRows = charactersResponse.values || [];
      addLog(`Character rows found: ${characterRows.length}`);

      // 5. Fetch Encounters
      addLog('Step 6: Loading encounter log...');
      const encountersResponse = await fetchSheetData('Encounters!A2:G');
      const encounterRows = encountersResponse.values || [];
      addLog(`Encounters found: ${encounterRows.length}`);

      const parsedEncounters: Encounter[] = (encounterRows || [])
        .map((row, i) => {
          const result = EncounterRowSchema.safeParse(row);
          if (!result.success) {
            console.warn('[Sync] Encounters row', i, 'failed validation:',
              result.error.issues);
            return null;
          }
          return mapEncounterRowToEncounter(result.data, i + 1, difficulties);
        })
        .filter((enc): enc is Encounter => enc !== null);

      // 6. Fetch Encounter Combatants
      addLog('Step 7: Synching active combatants...');
      let parsedEncounterCombatants: EncounterCombatant[] = [];
      try {
        const ecResponse = await fetchSheetData('Encounter_Combatants!A2:K');
        const ecRows = ecResponse.values || [];
        parsedEncounterCombatants = (ecRows || [])
          .map((row, i) => {
            const result = EncounterCombatantRowSchema.safeParse(row);
            if (!result.success) {
              console.warn('[Sync] Encounter_Combatants row', i, 'failed validation:',
                result.error.issues);
              return null;
            }
            return mapEncounterCombatantRowToEC(result.data, i + 1);
          })
          .filter((ec): ec is EncounterCombatant => ec !== null);
        addLog(`Combatant links loaded: ${parsedEncounterCombatants.length}`);
      } catch (err) {
        addLog('Relational combatant data skipped.');
      }

      updateState(prev => {
        const parsedCharacters: Character[] = (characterRows || [])
          .map((row, i) => {
            const result = CharacterRowSchema.safeParse(row);
            if (!result.success) {
              console.warn('[Sync] Characters row', i, 'failed validation:',
                result.error.issues);
              return null;
            }
            return mapCharacterRowToCharacter(result.data, i + 2, statuses);
          })
          .filter((char): char is Character => char !== null);

        return {
          ...prev,
          hasInitialSynced: true,
          characters: parsedCharacters,
          encounters: parsedEncounters,
          npcs: parsedNPCs,
          encounterCombatants: parsedEncounterCombatants,
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
