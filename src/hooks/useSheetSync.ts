// src/hooks/useSheetSync.ts

import { useState } from 'react';
import { z } from 'zod';
import { useAppState } from './useAppState';
import {
  fetchSheetData,
  initializeDatabaseSchema,
  getSpreadsheetId,
} from '../services/sheetsService';
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
    console.log(msg);
    setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleSyncWithSheets = async (isManual = true) => {
    const sid = getSpreadsheetId();
    if (isManual) {
      setSyncLogs([]);
      setIsSyncing(true);
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
      const npcRes = await fetchSheetData('NPCs!A2:K');
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
      const charactersResponse = await fetchSheetData('Characters!A2:O');
      const characterRows = charactersResponse.values || [];
      addLog(`Character rows found: ${characterRows.length}`);

      // 5. Fetch Encounters
      addLog('Step 6: Loading encounter log...');
      const encountersResponse = await fetchSheetData('Encounters!A2:E');
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
        const ecResponse = await fetchSheetData('Encounter_Combatants!A2:G');
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
          characters: parsedCharacters.length > 0 ? parsedCharacters : prev.characters,
          encounters: parsedEncounters.length > 0 ? parsedEncounters : prev.encounters,
          npcs: parsedNPCs.length > 0 ? parsedNPCs : prev.npcs,
          encounterCombatants: parsedEncounterCombatants.length > 0 ? parsedEncounterCombatants : prev.encounterCombatants,
          statuses,
          difficulties,
        };
      });

      setLastSyncTime(new Date());
      setIsGoogleConnected(true);
      addLog('Sync successful. Campaign data is now local.');

    } catch (err: unknown) {
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

      if (isManual) setSyncError(message);
    } finally {
      if (!isManual) setIsSyncing(false);
      if (isManual && !syncError) {
        setTimeout(() => setIsSyncing(false), 800);
      }
    }
  };

  const startEncounter = async (id: string) => {
    const encounter = state.encounters.find(e => e.id === id);
    if (!encounter) return;

    const combatants: Combatant[] = [];
    const linkedCombatants = state.encounterCombatants.filter(ec => ec.encounterId === id);

    if (linkedCombatants.length > 0) {
      linkedCombatants.forEach(ec => {
        let parsedTimers: Record<string, number> = {};
        if (ec.conditionTimers) {
          try {
            parsedTimers = typeof ec.conditionTimers === 'string'
              ? JSON.parse(ec.conditionTimers)
              : ec.conditionTimers;
          } catch (e) {
            console.warn('Failed to parse conditionTimers JSON:', ec.conditionTimers, e);
          }
        }

        if (ec.playerId) {
          const c = state.characters.find(char => char.id === ec.playerId);
          if (c) {
            combatants.push({
              id: `combat-pc-${c.id}`,
              encounterCombatantId: ec.id,
              characterId: c.id,
              name: c.characterName,
              type: 'pc',
              initiative: ec.initiative || 0,
              ac: c.ac,
              maxHp: c.maxHp,
              currentHp: c.currentHp,
              tempHp: c.tempHp,
              conditions: c.conditions,
              notes: c.notes,
              passivePerception: c.passivePerception,
              sheetColHp: 'G',
              sheetColTempHp: 'F',
              sheetColCondition: 'H',
              hpSheetName: 'Characters',
              hpSheetRowIndex: c.sheetRowIndex,
              resistances: c.resistances || '',
              immunities: c.immunities || '',
              vulnerabilities: c.vulnerabilities || '',
              conditionTimers: parsedTimers,
            });
          }
        } else if (ec.npcId) {
          const npcTemplate = state.npcs.find(n => n.id === ec.npcId);
          if (npcTemplate) {
            for (let i = 0; i < ec.quantity; i++) {
              combatants.push({
                id: `combat-npc-${npcTemplate.id}-${i}-${Date.now()}`,
                encounterCombatantId: ec.id,
                name: `${npcTemplate.name}${ec.quantity > 1 ? ` ${i + 1}` : ''}`,
                type: 'npc',
                initiative: ec.initiative || 0,
                ac: npcTemplate.ac,
                maxHp: npcTemplate.maxHp,
                currentHp: npcTemplate.currentHp,
                tempHp: npcTemplate.tempHp,
                conditions: npcTemplate.conditions,
                notes: npcTemplate.notes,
                passivePerception: 10,
                resistances: npcTemplate.resistances,
                immunities: npcTemplate.immunities,
                vulnerabilities: npcTemplate.vulnerabilities,
                conditionTimers: parsedTimers,
              });
            }
          }
        }
      });
    } else {
      // Fallback: add all active characters
      const activePcs = state.characters.filter(c => c.isActive);
      activePcs.forEach(c => {
        combatants.push({
          id: `combat-pc-${c.id}`,
          characterId: c.id,
          name: c.characterName,
          type: 'pc',
          initiative: 0,
          ac: c.ac,
          maxHp: c.maxHp,
          currentHp: c.currentHp,
          tempHp: c.tempHp,
          conditions: c.conditions,
          notes: c.notes,
          passivePerception: c.passivePerception,
          sheetColHp: 'G',
          sheetColTempHp: 'F',
          sheetColCondition: 'H',
          hpSheetName: 'Characters',
          hpSheetRowIndex: c.sheetRowIndex,
          resistances: c.resistances || '',
          immunities: c.immunities || '',
          vulnerabilities: c.vulnerabilities || '',
          conditionTimers: {},
        });
      });
    }

    updateState(prev => ({
      ...prev,
      combatState: {
        activeEncounterId: encounter.id,
        combatants,
        activeTurnId: null,
        round: 1,
      },
    }));

    onActiveTabChange?.('combat');
  };

  const clearEncounter = () => {
    updateState(prev => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        activeEncounterId: null,
      },
    }));
    onActiveTabChange?.('encounters');
  };

  return {
    handleSyncWithSheets,
    startEncounter,
    clearEncounter,
    isSyncing,
    setIsSyncing,
    syncError,
    setSyncError,
    syncLogs,
    lastSyncTime,
    addLog,
  };
}
