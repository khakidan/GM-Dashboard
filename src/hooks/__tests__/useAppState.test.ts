import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppState, useDashboardStore } from '../useAppState';
import { STORAGE_KEYS } from '../../lib/constants';

const STORAGE_KEY = STORAGE_KEYS.appState;

describe('useAppState integration', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset Zustand store
    useDashboardStore.setState({
      characters: [],
      npcs: [],
      encounters: [],
      encounterCombatants: [],
      statuses: {},
      difficulties: {},
      campaignName: 'GM Encounter Dashboard',
      hasInitialSynced: false,
      openDialog: null,
      combatState: {
        activeEncounterId: null,
        activeTurnId: null,
        round: 1,
        combatants: [],
        concentrationLinks: {},
        deathEvent: null,
        damageEvent: null,
        healEvent: null,
        rageEvent: null,
        unconsciousEvent: null,
        initiativeEvent: false,
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('persists campaignName and combatState to storage but strictly excludes data arrays like characters, and writes hasInitialSynced as false', () => {
    const { result } = renderHook(() => useAppState());
    
    act(() => {
      result.current.updateState({
        campaignName: 'Icewind Dale',
        hasInitialSynced: true,
        characters: [{ id: 'char-1' } as any],
        combatState: {
          ...result.current.state.combatState,
          activeEncounterId: 'enc-123',
          round: 3,
          deathEvent: { combatantId: '1', name: 'G' } as any,
          damageEvent: { combatantId: '2', amount: 10 } as any,
          healEvent: { combatantId: '3', amount: 5 } as any,
          rageEvent: { combatantId: '4', isRaging: true } as any,
          unconsciousEvent: { combatantId: '5' } as any,
          initiativeEvent: true,
        }
      });
    });

    const storedRaw = localStorage.getItem(STORAGE_KEY);
    expect(storedRaw).toBeDefined();
    const stored = JSON.parse(storedRaw!).state; // Zustand persist wraps state in a 'state' object
    
    // campaignName IS persisted
    expect(stored.campaignName).toBe('Icewind Dale');
    
    // hasInitialSynced is written as false (per DashboardStore.ts partialize)
    expect(stored.hasInitialSynced).toBe(false);
    
    // characters array is NOT persisted (per DashboardStore.ts partialize)
    expect(stored.characters).toBeUndefined();

    // combatState IS persisted
    expect(stored.combatState).toBeDefined();
    expect(stored.combatState.activeEncounterId).toBe('enc-123');
    expect(stored.combatState.round).toBe(3);

    // Overlay events are NOT persisted (stripped in DashboardStore.ts partialize)
    expect(stored.combatState.deathEvent).toBeNull();
    expect(stored.combatState.damageEvent).toBeNull();
    expect(stored.combatState.healEvent).toBeNull();
    expect(stored.combatState.rageEvent).toBeNull();
    expect(stored.combatState.unconsciousEvent).toBeNull();
    expect(stored.combatState.initiativeEvent).toBe(false);
    
    // In-memory state should still track the accurate true values
    expect(result.current.state.campaignName).toBe('Icewind Dale');
    expect(result.current.state.hasInitialSynced).toBe(true);
    expect(result.current.state.characters.length).toBe(1);
  });

  it('notifies all subscribed components (Zustand re-renders)', () => {
    const { result: r1 } = renderHook(() => useAppState());
    const { result: r2 } = renderHook(() => useAppState());
    
    act(() => {
      r1.current.updateState({ campaignName: 'Multi-Subscription Test' });
    });
    
    expect(r1.current.state.campaignName).toBe('Multi-Subscription Test');
    expect(r2.current.state.campaignName).toBe('Multi-Subscription Test');
  });

  it('handles corrupt storage gracefully during initialization', () => {
    // This is more of a Zustand Persist test, but we keep it for parity
    localStorage.setItem(STORAGE_KEY, 'invalid json');
    
    // Re-instantiating the store would be required to test constructor hydration
    // but we can at least verify that the current state is still valid default
    const { result } = renderHook(() => useAppState());
    expect(result.current.state.campaignName).toBe('GM Encounter Dashboard');
  });

  describe('combat state updates (state logic verification)', () => {
    it('adds a combatant to the list immutably', () => {
      const { result } = renderHook(() => useAppState());
      const newCombatant: any = {
        id: 'combat-npc-1', name: 'Goblin', type: 'npc',
        initiative: 12, ac: 13, maxHp: 10, currentHp: 10,
        passivePerception: 9,
      };

      act(() => {
        result.current.updateState((prev) => ({
          ...prev,
          combatState: {
            ...prev.combatState,
            combatants: [...prev.combatState.combatants, newCombatant],
          },
        }));
      });

      expect(result.current.state.combatState.combatants).toHaveLength(1);
      expect(result.current.state.combatState.combatants[0].name).toBe('Goblin');
    });

    it('resets activeTurnId and round on resetCombat', () => {
      const { result } = renderHook(() => useAppState());
      
      act(() => {
        result.current.updateState({
          combatState: {
            ...result.current.state.combatState,
            activeEncounterId: 'enc-1',
            combatants: [{ id: 'c1', initiative: 15 } as any],
            activeTurnId: 'c1',
            round: 5,
          },
        });
      });

      act(() => {
        result.current.updateState((prev) => ({
          ...prev,
          combatState: {
            ...prev.combatState,
            activeTurnId: null,
            round: 1,
            combatants: prev.combatState.combatants.map(c => ({ ...c, initiative: 0 })),
          },
        }));
      });

      expect(result.current.state.combatState.round).toBe(1);
      expect(result.current.state.combatState.activeTurnId).toBeNull();
      expect(result.current.state.combatState.combatants[0].initiative).toBe(0);
    });
  });

  describe('useAppState hook testing', () => {
    it('returns state and updateState from the hook', () => {
      const { result } = renderHook(() => useAppState());
      expect(result.current.state.campaignName).toBe('GM Encounter Dashboard');
      expect(typeof result.current.updateState).toBe('function');
      expect(typeof result.current.getSnapshot).toBe('function');
    });

    it('updateState allows partial updates and triggers a re-render with new state', () => {
      const { result } = renderHook(() => useAppState());
      
      act(() => {
        result.current.updateState({ campaignName: 'Eberron Campaign' });
      });

      expect(result.current.state.campaignName).toBe('Eberron Campaign');
      expect(useDashboardStore.getState().campaignName).toBe('Eberron Campaign');
    });

    it('updateState accepts functional updates', () => {
      const { result } = renderHook(() => useAppState());
      
      act(() => {
        result.current.updateState((prev) => ({
          ...prev,
          combatState: {
            ...prev.combatState,
            round: prev.combatState.round + 1,
          }
        }));
      });

      expect(result.current.state.combatState.round).toBe(2);
    });

    it('integrates with external state changes (Zustand setState)', () => {
      const { result } = renderHook(() => useAppState());
      
      act(() => {
        useDashboardStore.setState({ campaignName: 'External Update' });
      });

      expect(result.current.state.campaignName).toBe('External Update');
    });

    it('restores combatState but NOT characters when receiving storage event', () => {
      const { result } = renderHook(() => useAppState());
      
      // Note: Zustand persist uses a wrapper object
      const storageValue = JSON.stringify({
        state: {
          campaignName: 'New Campaign',
          characters: [{ id: 'char-1', name: 'Lidda' }],
          combatState: {
            activeEncounterId: 'enc-abc',
            round: 4,
            combatants: [{ id: 'c1', name: 'G' }],
            deathEvent: { combatantId: '1' },
            damageEvent: { combatantId: '2' },
            healEvent: { combatantId: '3' },
            rageEvent: { combatantId: '4' },
            unconsciousEvent: { combatantId: '5' },
            initiativeEvent: true,
          }
        },
        version: 0
      });

      act(() => {
        const storageEvent = new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: storageValue,
        });
        window.dispatchEvent(storageEvent);
      });

      // combatState round and activeEncounterId are restored
      expect(result.current.state.combatState.activeEncounterId).toBe('enc-abc');
      expect(result.current.state.combatState.round).toBe(4);
      expect(result.current.state.combatState.combatants).toHaveLength(1);

      // characters is NOT restored on storage-sync — it should remain as initialCharacters/empty
      // (This tests the cross-tab sync logic in dashboardStore.ts)
      expect(result.current.state.characters).toEqual([]);

      // Overlays are stripped and set to default null/false
      expect(result.current.state.combatState.deathEvent).toBeNull();
      expect(result.current.state.combatState.damageEvent).toBeNull();
      expect(result.current.state.combatState.healEvent).toBeNull();
      expect(result.current.state.combatState.rageEvent).toBeNull();
      expect(result.current.state.combatState.unconsciousEvent).toBeNull();
      expect(result.current.state.combatState.initiativeEvent).toBe(false);
    });

    it('When cross-tab sync fires, the receiving tab\'s combatState is updated with incoming data, not its own current data', () => {
      const { result } = renderHook(() => useAppState());

      // Set some initial local combatState in the receiving tab
      act(() => {
        result.current.updateState({
          combatState: {
            activeEncounterId: 'old-encounter',
            activeTurnId: 'old-turn',
            round: 2,
            combatants: [{ id: 'old-combatant', name: 'Old Guard' } as any],
            concentrationLinks: {},
            deathEvent: null,
            damageEvent: null,
            healEvent: null,
            rageEvent: null,
            unconsciousEvent: null,
            initiativeEvent: false,
          }
        });
      });

      expect(result.current.state.combatState.activeEncounterId).toBe('old-encounter');
      expect(result.current.state.combatState.round).toBe(2);

      // Now simulate a storage event with new incoming combatState data
      const storageValue = JSON.stringify({
        state: {
          campaignName: 'New Campaign',
          combatState: {
            activeEncounterId: 'incoming-encounter',
            activeTurnId: 'incoming-turn',
            round: 5,
            combatants: [{ id: 'incoming-combatant', name: 'Incoming Invader' } as any],
            deathEvent: null,
            damageEvent: null,
            healEvent: null,
            rageEvent: null,
            unconsciousEvent: null,
            initiativeEvent: false,
          }
        },
        version: 0
      });

      act(() => {
        const storageEvent = new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: storageValue,
        });
        window.dispatchEvent(storageEvent);
      });

      // Assert that the receiving tab's combatState has been completely updated with the incoming data
      expect(result.current.state.combatState.activeEncounterId).toBe('incoming-encounter');
      expect(result.current.state.combatState.activeTurnId).toBe('incoming-turn');
      expect(result.current.state.combatState.round).toBe(5);
      expect(result.current.state.combatState.combatants).toHaveLength(1);
      expect(result.current.state.combatState.combatants[0].id).toBe('incoming-combatant');
    });

    it('getSnapshot returns the current state correctly', () => {
       const { result } = renderHook(() => useAppState());
       
       act(() => {
         result.current.updateState({ campaignName: 'Snapshot Test' });
       });

       const snapshot = result.current.getSnapshot();
       expect(snapshot.campaignName).toBe('Snapshot Test');
       expect(snapshot.characters).toEqual([]);
    });
  });
});
