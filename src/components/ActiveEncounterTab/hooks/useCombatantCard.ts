import { useAppState } from '../../../hooks/useAppState';

export function useCombatantCard(combatantId: string) {
  const { state, updateState } = useAppState();

  const combatState = state?.combatState;
  const isActiveTurn = combatState?.activeTurnId === combatantId;
  const isSelected = (combatState?.selectedIds || []).includes(combatantId);
  const isSelectable = !!combatState?.isSelectionMode;
  const isSyncing = (combatState?.syncingIds || []).includes(combatantId);
  const isExpanded = (combatState?.expandedIds || []).includes(combatantId);

  // Derive concentrationLinks correctly filtered for this combatantId
  const concentrationLinks = (combatState?.concentrationLinks || {})[combatantId] || [];

  const toggleExpand = () => {
    updateState(prev => {
      const expanded = new Set(prev.combatState.expandedIds || []);
      if (expanded.has(combatantId)) {
        expanded.delete(combatantId);
      } else {
        expanded.add(combatantId);
      }
      return {
        ...prev,
        combatState: {
          ...prev.combatState,
          expandedIds: Array.from(expanded),
        }
      };
    });
  };

  const toggleSelection = () => {
    updateState(prev => {
      const selected = new Set(prev.combatState.selectedIds || []);
      if (selected.has(combatantId)) {
        selected.delete(combatantId);
      } else {
        selected.add(combatantId);
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

  return {
    isActiveTurn,
    isSelected,
    isSelectable,
    isSyncing,
    isExpanded,
    concentrationLinks,
    toggleExpand,
    toggleSelection,
  };
}
