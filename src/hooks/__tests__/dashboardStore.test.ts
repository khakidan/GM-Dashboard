import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDashboardStore } from '../dashboardStore';
import { STORAGE_KEYS } from '../../lib/constants';

describe('useDashboardStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useDashboardStore.setState({
      characters: [],
      npcs: [],
      encounters: [],
      encounterCombatants: [],
      statuses: {},
      difficulties: {},
      campaignName: '',
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
        selectedIds: [],
        isSelectionMode: false,
        syncingIds: [],
        expandedIds: [],
      },
    });
  });

  describe('Storage Event Listener', () => {
    it('is registered on window when the module loads', () => {
      // Since the module is already loaded in the test environment, 
      // we check if dispatching an event actually triggers the store update,
      // which confirms registration.
      // (Testing the actual addEventListener call would require vi.resetModules 
      // and re-importing, which is overkill since functional verification 
      // proves it's there).
      
      const spy = vi.spyOn(useDashboardStore, 'setState');
      const event = new StorageEvent('storage', {
        key: STORAGE_KEYS.appState,
        newValue: JSON.stringify({ state: { campaignName: 'Registered Check' } })
      });
      window.dispatchEvent(event);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('updates combatState when a storage event fires with valid combatState', () => {
      const newCombatState = {
        activeEncounterId: 'enc-123',
        round: 5,
        combatants: [{ id: 'c1', initiative: 10 }],
        deathEvent: { id: 'test' }, // Should be stripped
      };

      const event = new StorageEvent('storage', {
        key: STORAGE_KEYS.appState,
        newValue: JSON.stringify({
          state: {
            combatState: newCombatState,
            campaignName: 'Remote Campaign'
          }
        })
      });

      window.dispatchEvent(event);

      const state = useDashboardStore.getState();
      expect(state.combatState.activeEncounterId).toBe('enc-123');
      expect(state.combatState.round).toBe(5);
      expect(state.campaignName).toBe('Remote Campaign');
      // deathEvent should be stripped to null by the listener
      expect(state.combatState.deathEvent).toBeNull();
    });

    it('ignores storage events with mismatching keys', () => {
      const event = new StorageEvent('storage', {
        key: 'some_other_key',
        newValue: JSON.stringify({ state: { campaignName: 'Should Ignore' } })
      });

      window.dispatchEvent(event);

      expect(useDashboardStore.getState().campaignName).toBe('');
    });

    it('handles invalid JSON gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const event = new StorageEvent('storage', {
        key: STORAGE_KEYS.appState,
        newValue: 'invalid json'
      });

      window.dispatchEvent(event);

      expect(useDashboardStore.getState().campaignName).toBe('');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('handles null newValue (storage clear)', () => {
      const event = new StorageEvent('storage', {
        key: STORAGE_KEYS.appState,
        newValue: null
      });

      // Should not throw or change state in a way that breaks
      window.dispatchEvent(event);
      expect(useDashboardStore.getState().campaignName).toBe('');
    });
  });

  it('initialises with empty characters array', () => {
    const state = useDashboardStore.getState();
    expect(state.characters).toEqual([]);
  });

  it('initialises with hasInitialSynced: false', () => {
    const state = useDashboardStore.getState();
    expect(state.hasInitialSynced).toBe(false);
  });

  it('initialises with null combatState.activeEncounterId', () => {
    const state = useDashboardStore.getState();
    expect(state.combatState.activeEncounterId).toBeNull();
  });

  it('updateState with a function updater applies the transformation correctly', () => {
    useDashboardStore.getState().updateState((prev) => ({
      ...prev,
      campaignName: 'Test Campaign',
    }));
    expect(useDashboardStore.getState().campaignName).toBe('Test Campaign');
  });

  it('updateState with a partial object merges correctly', () => {
    useDashboardStore.getState().updateState({
      campaignName: 'Partial Update',
    });
    expect(useDashboardStore.getState().campaignName).toBe('Partial Update');
  });

  it('getSnapshot returns all AppState fields', () => {
    const snapshot = useDashboardStore.getState().getSnapshot();
    expect(snapshot).toHaveProperty('characters');
    expect(snapshot).toHaveProperty('npcs');
    expect(snapshot).toHaveProperty('encounters');
    expect(snapshot).toHaveProperty('encounterCombatants');
    expect(snapshot).toHaveProperty('statuses');
    expect(snapshot).toHaveProperty('difficulties');
    expect(snapshot).toHaveProperty('campaignName');
    expect(snapshot).toHaveProperty('hasInitialSynced');
    expect(snapshot).toHaveProperty('openDialog');
    expect(snapshot).toHaveProperty('combatState');
  });

  it('getSnapshot does NOT include updateState or getSnapshot methods in its return value', () => {
    const snapshot = useDashboardStore.getState().getSnapshot();
    expect((snapshot as any).updateState).toBeUndefined();
    expect((snapshot as any).getSnapshot).toBeUndefined();
  });

  it('partialize strips deathEvent to null', () => {
    // We have to test the persist config's partialize function directly
    // since it's hard to trigger a real persist cycle in vitest without overhead
    const persistOptions = (useDashboardStore as any).persist.getOptions();
    const partialize = persistOptions.partialize;
    
    const mockState: any = {
      campaignName: 'Test',
      combatState: {
        deathEvent: { id: 'test' },
        initiativeEvent: true,
      }
    };
    
    const partial = partialize(mockState);
    expect(partial.combatState.deathEvent).toBeNull();
  });

  it('partialize strips initiativeEvent to false', () => {
    const persistOptions = (useDashboardStore as any).persist.getOptions();
    const partialize = persistOptions.partialize;
    
    const mockState: any = {
      combatState: {
        initiativeEvent: true,
      }
    };
    
    const partial = partialize(mockState);
    expect(partial.combatState.initiativeEvent).toBe(false);
  });

  it('partialize always sets hasInitialSynced to false regardless of current value', () => {
    const persistOptions = (useDashboardStore as any).persist.getOptions();
    const partialize = persistOptions.partialize;
    
    const mockState: any = {
      hasInitialSynced: true,
    };
    
    const partial = partialize(mockState);
    expect(partial.hasInitialSynced).toBe(false);
  });
});
