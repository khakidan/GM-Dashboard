// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useSheetSync } from '../useSheetSync';
import { useAppState, getSnapshot } from '../useAppState';

import * as writeQueue from '../../services/writeQueue';
import * as sheetsService from '../../services/sheetsService';

import { updateEncounterStateDB, clearEncounterStateDB } from '../../services/dbOperations';
import { buildCombatantsFromState } from '../useSheetSync';

vi.mock('../../services/writeQueue', () => ({
  clearRetryQueue: vi.fn(),
  queueWrite: vi.fn(),
  flushQueue: vi.fn(),
  getQueueSize: vi.fn(),
  retryPersistedWrites: vi.fn(),
}));

vi.mock('../../services/sheetsService', () => ({
  fetchSheetData: vi.fn(),
  initializeDatabaseSchema: vi.fn(),
  getSpreadsheetId: vi.fn().mockReturnValue('mock-id'),
}));

vi.mock('../../services/dbOperations', () => ({
  updateEncounterStateDB: vi.fn().mockResolvedValue(undefined),
  clearEncounterStateDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn(),
}));

describe('useSheetSync', () => {
  const setIsGoogleConnected = vi.fn();

  it('startEncounter constructs PC combatants with the latest conditions from the sheet snapshot', async () => {
    const mockCharacter = {
      id: 'char-1',
      characterName: 'Thorin',
      isActive: true,
      ac: 18,
      maxHp: 50,
      currentHp: 45,
      tempHp: 0,
      conditions: 'poisoned',
      notes: 'Some notes',
      passivePerception: 12,
      sheetRowIndex: 2,
    };

    const mockEncounter = {
      id: 'enc-1',
      name: 'Forest Ambush',
    };

    // Mock useAppState BEFORE rendering the hook
    let updateStateCalledWith: any;
    vi.mocked(useAppState).mockReturnValue({
      state: {
        encounters: [mockEncounter],
        characters: [mockCharacter],
        encounterCombatants: [],
      },
      updateState: (fn: any) => { 
        if (typeof fn === 'function') {
          updateStateCalledWith = fn({}); 
        } else {
          updateStateCalledWith = fn;
        }
      }
    } as any);

    // Snapshot with updated conditions (representing a change between render and function call)
    vi.mocked(getSnapshot).mockReturnValue({
      encounters: [mockEncounter],
      characters: [{ ...mockCharacter, conditions: 'poisoned, restrained' }],
      encounterCombatants: [],
    } as any);

    const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected }));

    await act(async () => {
      await result.current.startEncounter('enc-1');
    });

    const pcCombatant = updateStateCalledWith.combatState.combatants[0];
    expect(pcCombatant.name).toBe('Thorin');
    // It should pick up the LATEST conditions from getSnapshot, not the initial stale ones from the closure
    expect(pcCombatant.conditions).toBe('poisoned, restrained');
  });

  it('startEncounter handles linked Combatants with PCs carrying conditions, resistances, immunities, vulnerabilities, initiative', async () => {
    const mockCharacter = {
      id: 'char-1',
      characterName: 'Maeve',
      isActive: true,
      ac: 15,
      maxHp: 50,
      currentHp: 50,
      tempHp: 0,
      conditions: 'restrained',
      notes: 'Notes',
      passivePerception: 14,
      resistances: 'fire',
      immunities: 'poison',
      vulnerabilities: 'cold',
      tempHpMax: 0,
    };

    const mockEncounter = { id: 'enc-1', name: 'Boss Fight' };
    const mockEncounterCombatant = {
      id: 'ec-1',
      encounterId: 'enc-1',
      playerId: 'char-1',
      initiative: 17,
    };

    let updateStateCalledWith: any;
    vi.mocked(useAppState).mockReturnValue({
      state: {
        encounters: [mockEncounter],
        characters: [mockCharacter],
        encounterCombatants: [mockEncounterCombatant],
        npcs: [],
      },
      updateState: (fn: any) => { 
        updateStateCalledWith = fn({}); 
      }
    } as any);

    vi.mocked(getSnapshot).mockReturnValue({
      encounters: [mockEncounter],
      characters: [mockCharacter],
      encounterCombatants: [mockEncounterCombatant],
      npcs: [],
    } as any);

    const onActiveTabChange = vi.fn();
    const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected, onActiveTabChange }));

    await act(async () => {
      await result.current.startEncounter('enc-1');
    });

    expect(updateStateCalledWith.combatState.activeEncounterId).toBe('enc-1');
    const pcCombatant = updateStateCalledWith.combatState.combatants[0];
    expect(pcCombatant.name).toBe('Maeve');
    expect(pcCombatant.initiative).toBe(17);
    expect(pcCombatant.conditions).toBe('restrained');
    expect(pcCombatant.resistances).toBe('fire');
    expect(pcCombatant.immunities).toBe('poison');
    expect(pcCombatant.vulnerabilities).toBe('cold');
    expect(onActiveTabChange).toHaveBeenCalledWith('combat');
  });

  it('startEncounter targets NPC templates and creates multiple instances with unique IDs when quantity > 1', async () => {
    const mockEncounter = { id: 'enc-1', name: 'Goblin Patrol' };
    const mockNpcTemplate = {
      id: 'npc-1',
      name: 'Goblin',
      ac: 12,
      maxHp: 7,
      currentHp: 7,
      tempHp: 0,
      conditions: 'none',
      notes: 'Bow specialist',
      resistances: '',
      immunities: '',
      vulnerabilities: '',
    };
    const mockEncounterCombatant = {
      id: 'ec-npc',
      encounterId: 'enc-1',
      npcId: 'npc-1',
      quantity: 3,
      initiative: 12,
    };

    let updateStateCalledWith: any;
    vi.mocked(useAppState).mockReturnValue({
      state: {
        encounters: [mockEncounter],
        characters: [],
        encounterCombatants: [mockEncounterCombatant],
        npcs: [mockNpcTemplate],
      },
      updateState: (fn: any) => { 
        updateStateCalledWith = fn({}); 
      }
    } as any);

    vi.mocked(getSnapshot).mockReturnValue({
      encounters: [mockEncounter],
      characters: [],
      encounterCombatants: [mockEncounterCombatant],
      npcs: [mockNpcTemplate],
    } as any);

    const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected }));

    await act(async () => {
      await result.current.startEncounter('enc-1');
    });

    const combatants = updateStateCalledWith.combatState.combatants;
    expect(combatants).toHaveLength(3);

    expect(combatants[0].name).toBe('Goblin 1');
    expect(combatants[1].name).toBe('Goblin 2');
    expect(combatants[2].name).toBe('Goblin 3');

    expect(combatants[0].initiative).toBe(12);
    expect(combatants[1].initiative).toBe(12);
    expect(combatants[2].initiative).toBe(12);

    // Guarantee unique IDs
    const ids = combatants.map((c: any) => c.id);
    const uniqueIds = Array.from(new Set(ids));
    expect(uniqueIds).toHaveLength(3);
  });

  it('startEncounter uses npcCurrentConditions from the EC row if available, falling back to NPC template conditions', async () => {
    let updateStateCalledWith: any;
    vi.mocked(useAppState).mockReturnValue({
      state: {} as any,
      updateState: (args: any) => {
        updateStateCalledWith = typeof args === 'function' ? args({ combatState: {} }) : args;
      } 
    } as any);

    vi.mocked(getSnapshot).mockReturnValue({
      encounters: [{ id: 'enc-1', name: 'Goblin Patrol' }],
      npcs: [
        { id: 'npc-1', name: 'Goblin', conditions: 'prone' },
        { id: 'npc-2', name: 'Hobgoblin', conditions: 'invisible' }
      ],
      encounterCombatants: [
        { id: 'ec-1', encounterId: 'enc-1', npcId: 'npc-1', quantity: 1, npcCurrentConditions: 'stunned' },
        { id: 'ec-2', encounterId: 'enc-1', npcId: 'npc-2', quantity: 1, npcCurrentConditions: '' }
      ],
      characters: [],
    } as any);

    const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected: vi.fn() }));
    await act(async () => {
      await result.current.startEncounter('enc-1');
    });

    const combatants = updateStateCalledWith.combatState.combatants;
    expect(combatants).toHaveLength(2);
    
    // Goblin has per-instance conditions overwritten
    expect(combatants[0].conditions).toBe('stunned');
    
    // Hobgoblin falls back to template's condition because EC row is empty
    expect(combatants[1].conditions).toBe('invisible');
  });

  it('startEncounter falls back to all active characters when no linkedCombatants are found', async () => {
    const mockActivePC = { id: 'char-1', characterName: 'Maeve', isActive: true, ac: 15, maxHp: 50, currentHp: 50 };
    const mockInactivePC = { id: 'char-2', characterName: 'Ylva', isActive: false, ac: 12, maxHp: 40, currentHp: 40 };
    const mockEncounter = { id: 'enc-1', name: 'Standby Danger' };

    let updateStateCalledWith: any;
    vi.mocked(useAppState).mockReturnValue({
      state: {
        encounters: [mockEncounter],
        characters: [mockActivePC, mockInactivePC],
        encounterCombatants: [],
        npcs: [],
      },
      updateState: (fn: any) => { 
        updateStateCalledWith = fn({}); 
      }
    } as any);

    vi.mocked(getSnapshot).mockReturnValue({
      encounters: [mockEncounter],
      characters: [mockActivePC, mockInactivePC],
      encounterCombatants: [],
      npcs: [],
    } as any);

    const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected }));

    await act(async () => {
      await result.current.startEncounter('enc-1');
    });

    const combatants = updateStateCalledWith.combatState.combatants;
    expect(combatants).toHaveLength(1);
    expect(combatants[0].name).toBe('Maeve'); // only mockActivePC
    expect(combatants[0].initiative).toBe(0); // fallback initiative
  });

  it('clearRetryQueue is called before the first sheet read begins', async () => {
    let updateStateCalledWith: any;
    vi.mocked(useAppState).mockReturnValue({
      state: { hasInitialSynced: false },
      updateState: (fn: any) => { updateStateCalledWith = fn({}); }
    } as any);

    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    vi.mocked(sheetsService.initializeDatabaseSchema).mockResolvedValue(undefined);

    const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected }));

    await act(async () => {
      await result.current.handleSyncWithSheets(false);
    });

    expect(writeQueue.clearRetryQueue).toHaveBeenCalled();
  });

  it('hasInitialSynced is set to true after a successful sync of all sheets', async () => {
    let updateStateCalledWith: any;
    vi.mocked(useAppState).mockReturnValue({
      state: { hasInitialSynced: false },
      updateState: (fn: any) => { 
        updateStateCalledWith = typeof fn === 'function' ? fn({}) : fn; 
      }
    } as any);

    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['1', 'data']] });
    vi.mocked(sheetsService.initializeDatabaseSchema).mockResolvedValue(undefined);

    const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected }));

    await act(async () => {
      await result.current.handleSyncWithSheets(false);
    });

    expect(updateStateCalledWith.hasInitialSynced).toBe(true);
  });

  it('hasInitialSynced is NOT set to true if the sync returns an auth error', async () => {
    let updateStateCalledWith: any = null;
    vi.mocked(useAppState).mockReturnValue({
      state: { hasInitialSynced: false },
      updateState: (fn: any) => { updateStateCalledWith = typeof fn === 'function' ? fn({}) : fn; }
    } as any);

    vi.mocked(sheetsService.initializeDatabaseSchema).mockRejectedValue(new Error('UNAUTHENTICATED'));

    const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected }));

    await act(async () => {
      await result.current.handleSyncWithSheets(false);
    });

    expect(updateStateCalledWith).toBeNull();
  });

  it('hasInitialSynced is NOT set to true if the sync returns an empty result', async () => {
    let updateStateCalledWith: any = null;
    vi.mocked(useAppState).mockReturnValue({
      state: { hasInitialSynced: false },
      updateState: (fn: any) => { updateStateCalledWith = typeof fn === 'function' ? fn({}) : fn; }
    } as any);

    // Mock empty result throwing an error, or just failing to fetch.
    // The prompt expects it not to set hasInitialSynced. If fetchSheetData throws, it won't be set.
    vi.mocked(sheetsService.initializeDatabaseSchema).mockResolvedValue(undefined);
    vi.mocked(sheetsService.fetchSheetData).mockRejectedValue(new Error('Empty result from Google API'));

    const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected }));

    await act(async () => {
      await result.current.handleSyncWithSheets(false);
    });

    expect(updateStateCalledWith).toBeNull();
  });

  it('clearEncounter sets activeEncounterId to null and routes active tab back to encounters', async () => {
    let updateStateCalledWith: any;
    vi.mocked(useAppState).mockReturnValue({
      state: {
        combatState: { activeEncounterId: 'enc-1' },
      },
      updateState: (fn: any) => { 
        updateStateCalledWith = fn({ combatState: { activeEncounterId: 'enc-1' } }); 
      }
    } as any);
    
    vi.mocked(getSnapshot).mockReturnValue({
      combatState: { activeEncounterId: 'enc-1' }
    } as any);

    const onActiveTabChange = vi.fn();
    const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected, onActiveTabChange }));

    act(() => {
      result.current.clearEncounter();
    });

    expect(updateStateCalledWith.combatState.activeEncounterId).toBeNull();
    expect(onActiveTabChange).toHaveBeenCalledWith('encounters');
  });

  it('When startEncounter is called, updateEncounterStateDB is called with encounterId, round 1, and the ID of the first combatant in initiative order', async () => {
    const mockCharacter = {
      id: 'char-1',
      characterName: 'Thorin',
      isActive: true,
      ac: 18,
      maxHp: 50,
      currentHp: 45,
    };
    const mockCharacter2 = {
      id: 'char-2',
      characterName: 'Bilbo',
      isActive: true,
      ac: 14,
      maxHp: 20,
      currentHp: 20,
    };

    const mockEncounter = {
      id: 'enc-1',
      name: 'Forest Ambush',
    };
    
    const mockEncounterCombatants = [
      { id: 'ec-1', encounterId: 'enc-1', playerId: 'char-1', initiative: 10 },
      { id: 'ec-2', encounterId: 'enc-1', playerId: 'char-2', initiative: 20 },
    ];

    vi.mocked(getSnapshot).mockReturnValue({
      encounters: [mockEncounter],
      characters: [mockCharacter, mockCharacter2],
      encounterCombatants: mockEncounterCombatants,
    } as any);
    
    vi.mocked(useAppState).mockReturnValue({
      state: {},
      updateState: vi.fn(),
    } as any);

    const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected }));

    await act(async () => {
      await result.current.startEncounter('enc-1');
    });

    // Sorted descending by initiative, so char-2 (initiative 20) is first
    expect(updateEncounterStateDB).toHaveBeenCalledWith('enc-1', 1, 'combat-pc-char-2');
  });
  
  it('When clearEncounter is called, clearEncounterStateDB is called with the active encounter ID', async () => {
    vi.mocked(getSnapshot).mockReturnValue({
      combatState: { activeEncounterId: 'enc-1' }
    } as any);
    vi.mocked(useAppState).mockReturnValue({
      state: {},
      updateState: vi.fn(),
    } as any);

    const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected }));

    act(() => {
      result.current.clearEncounter();
    });

    expect(clearEncounterStateDB).toHaveBeenCalledWith('enc-1');
  });

  describe('Auto-Resume tests', () => {
    it('After initial sync, if an encounter has currentRound > 0, combatState.activeEncounterId is set to that encounter id and round matches currentRound', async () => {
      let updateStateCalledWith: any;
      vi.mocked(useAppState).mockReturnValue({
        state: { hasInitialSynced: false },
        updateState: (fn: any) => { 
          updateStateCalledWith = typeof fn === 'function' ? fn({ combatState: {} }) : fn; 
        }
      } as any);

      // Encounters
      vi.mocked(sheetsService.fetchSheetData).mockImplementation((range: string) => {
        if (range.startsWith('Encounters')) {
          return Promise.resolve({ values: [['enc-1', 'Ambush', 'Tavern', '1', 'Hard', '3', 'combat-pc-char-1']] });
        }
        if (range.startsWith('Encounter_Combatants')) { // Note: 'enc-1', length > 0
          return Promise.resolve({ values: [['ec-1', 'enc-1', 'char-1', '', '1', '10', '', '', '', '', '']] });
        }
        if (range.startsWith('Characters')) {
          return Promise.resolve({ values: [['char-1', 'Player', 'Thorin', '15', '50', '', '50', '', '', '', '', '', '', '', '', '', '', '', '']] });
        }
        return Promise.resolve({ values: [] });
      });

      vi.mocked(sheetsService.initializeDatabaseSchema).mockResolvedValue(undefined);

      const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected }));

      await act(async () => {
        await result.current.handleSyncWithSheets(false);
      });

      expect(updateStateCalledWith.combatState.activeEncounterId).toBe('enc-1');
      expect(updateStateCalledWith.combatState.round).toBe(3);
      expect(updateStateCalledWith.combatState.combatants.length).toBeGreaterThan(0);
    });

    it('After initial sync, if no encounter has currentRound > 0, combatState.activeEncounterId remains null', async () => {
      let updateStateCalledWith: any;
      vi.mocked(useAppState).mockReturnValue({
        state: { hasInitialSynced: false },
        updateState: (fn: any) => { 
          updateStateCalledWith = typeof fn === 'function' ? fn({ combatState: { activeEncounterId: null } }) : fn; 
        }
      } as any);

      vi.mocked(sheetsService.fetchSheetData).mockImplementation((range: string) => {
        if (range.startsWith('Encounters')) {
          return Promise.resolve({ values: [['enc-1', 'Ambush', 'Tavern', '1', 'Hard', '', '']] }); // round = ''
        }
        return Promise.resolve({ values: [] });
      });

      const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected }));

      await act(async () => {
        await result.current.handleSyncWithSheets(false);
      });

      expect(updateStateCalledWith.combatState.activeEncounterId).toBeNull();
    });

    it('buildCombatantsFromState returns an empty array when no matching encounterCombatants exist for the encounter', () => {
      const encounter = { id: 'enc-1' };
      const res = buildCombatantsFromState(encounter as any, [], [], []);
      expect(res).toEqual([]);
    });
  });
});
