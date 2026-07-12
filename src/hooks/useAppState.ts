import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { AppState } from '../types';
import { useDashboardStore } from './dashboardStore';

/**
 * useAppState is now a thin wrapper around the Zustand store.
 * The public API is identical to the previous implementation —
 * all existing hooks and components continue to work without any changes.
 *
 * - state: the current AppState (reactive — components re-render when it changes)
 * - updateState: applies an update to the store. Accepts either a function (prev => next) or a partial state object.
 * - getSnapshot: returns the current state synchronously without subscribing.
 */
export function getSnapshot(): AppState {
  return useDashboardStore.getState().getSnapshot();
}

export function useAppState() {
  // Subscribes this component to the full store.
  // Any state change triggers a re-render.
  const state = useDashboardStore(
    useShallow((s): AppState => ({
      characters: s.characters,
      npcs: s.npcs,
      encounters: s.encounters,
      encounterCombatants: s.encounterCombatants,
      conditions: s.conditions,
      spells: s.spells,
      statuses: s.statuses,
      difficulties: s.difficulties,
      campaignName: s.campaignName,
      hasInitialSynced: s.hasInitialSynced,
      openDialog: s.openDialog,
      combatState: s.combatState,
    }))
  );

  const updateState = useCallback(
    (updater: ((prev: AppState) => AppState) | Partial<AppState>) => {
      useDashboardStore.getState().updateState(updater);
    },
    []
  );

  const getSnapshot = useCallback((): AppState => {
    return useDashboardStore.getState().getSnapshot();
  }, []);

  return { state, updateState, getSnapshot };
}

// Re-export the raw store for cases where a hook or utility needs access
// to the store outside of a React component.
export { useDashboardStore };
