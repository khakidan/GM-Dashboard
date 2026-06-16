import { useAppState } from '../../../hooks/useAppState';

export function useCombatantCard(combatantId: string) {
  const { state } = useAppState();

  const combatState = state?.combatState;
  const isActiveTurn = combatState?.activeTurnId === combatantId;
  const isSelected = (combatState?.selectedIds || []).includes(combatantId);
  const isSelectable = !!combatState?.isSelectionMode;
  const isSyncing = (combatState?.syncingIds || []).includes(combatantId);

  // Derive concentrationLinks correctly filtered for this combatantId
  const concentrationLinks = (combatState?.concentrationLinks || {})[combatantId] || [];

  return {
    isActiveTurn,
    isSelected,
    isSelectable,
    isSyncing,
    concentrationLinks,
  };
}
