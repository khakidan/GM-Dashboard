import { useAppState } from '../../../hooks/useAppState';

export function useSelectionMode() {
  const { state, updateState } = useAppState();

  const selectedIds = new Set(state.combatState.selectedIds || []);
  const isSelectionMode = !!state.combatState.isSelectionMode;

  const toggleSelection = (id: string) => {
    updateState(prev => {
      const selected = new Set(prev.combatState.selectedIds || []);
      if (selected.has(id)) {
        selected.delete(id);
      } else {
        selected.add(id);
      }
      return {
        ...prev,
        combatState: {
          ...prev.combatState,
          selectedIds: Array.from(selected),
        }
      };
    });
  };

  const selectAll = (allIds: string[]) => {
    updateState(prev => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        selectedIds: allIds,
      }
    }));
  };

  const clearSelection = () => {
    updateState(prev => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        selectedIds: [],
      }
    }));
  };

  const enterSelectionMode = () => {
    updateState(prev => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        isSelectionMode: true,
      }
    }));
  };

  const exitSelectionMode = () => {
    updateState(prev => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        isSelectionMode: false,
        selectedIds: [],
      }
    }));
  };

  return {
    selectedIds,
    isSelectionMode,
    toggleSelection,
    selectAll,
    clearSelection,
    enterSelectionMode,
    exitSelectionMode,
  };
}
