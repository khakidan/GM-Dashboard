import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { useDashboardStore } from '../../../hooks/dashboardStore';
import { useHealthChange } from './useHealthChange';
import { Combatant, DamageType } from '../../../types';
import { toast } from 'sonner';
import { 
  deleteEncounterCombatantDB, 
  updateEncounterCombatantQuantityDB
} from '../../../services/dbOperations';
import { useCombatantMutations } from './useCombatantMutations';

interface UseBatchActionsProps {
  selectedIds: Set<string>;
  combatants: Combatant[];
  onSuccess?: () => void;
}

export function useBatchActions({ selectedIds, combatants, onSuccess }: UseBatchActionsProps) {
  const { updateState } = useAppState();
  const { updateCombatant } = useCombatantMutations();

  const { handleHealthChange, fireDamageEvent, fireHealEvent, fireUnconsciousEvent } = useHealthChange(new Set(), updateCombatant);

  const handleApplyMultiDamage = async (amount: number, type: DamageType | null) => {
    const selectedList = combatants.filter(c => selectedIds.has(c.id));
    if (selectedList.length === 0) return;

    const affectedNames = selectedList.map(c => c.name);
    const previousState = getSnapshot();
    const newlyUnconsciousPCs: string[] = [];
    try {
      const { addCombatEvent, activeCombatLog, combatState } =
        useDashboardStore.getState()

      for (const c of selectedList) {
        const hpBefore = c.currentHp;
        const isPc = c.type === 'pc';
        await handleHealthChange(c.id, c, true, type, amount, false, true); // pass skipOverlay=true

        // Find the updated state
        const latestState = getSnapshot();
        const updatedCombatant = latestState.combatState.combatants.find(x => x.id === c.id);
        const hpAfter = updatedCombatant?.currentHp ?? hpBefore;

        if (isPc && hpBefore > 0 && hpAfter === 0) {
          newlyUnconsciousPCs.push(c.name);
        }
      }
      
      // Fire ONE overlay event with all names
      fireDamageEvent({
        combatantNames: affectedNames,
        damageAmount: amount,
        damageType: type || undefined,
      });

      // Fire unconscious events for newly unconscious PCs
      if (newlyUnconsciousPCs.length > 0) {
        fireUnconsciousEvent({ characterName: newlyUnconsciousPCs[0] });
        if (newlyUnconsciousPCs.length > 1) {
          console.warn(
            `Multiple PCs fell unconscious simultaneously (${newlyUnconsciousPCs.join(', ')}). ` +
            `The overlay event was fired only for ${newlyUnconsciousPCs[0]} due to overlay limits.`
          );
        }
      }

      toast.success(`Damage applied to ${selectedList.length} targets`);
    } catch (err) {
      toast.error('Failed to apply multi-damage', {
        description: err instanceof Error ? err.message : 'Database error',
      });
    }
  };

  const handleApplyMultiHealing = async (amount: number) => {
    const selectedList = combatants.filter(c => selectedIds.has(c.id));
    if (selectedList.length === 0) return;

    const affectedNames = selectedList.map(c => c.name);
    const previousState = getSnapshot();
    try {
      const { addCombatEvent, activeCombatLog, combatState } =
        useDashboardStore.getState()

      for (const c of selectedList) {
        await handleHealthChange(c.id, c, false, null, amount, false, true); // pass skipOverlay=true
      }
      
      // Fire ONE healEvent after the loop with all names
      fireHealEvent({
        combatantNames: affectedNames,
        healAmount: amount
      });

      toast.success(`Healing applied to ${selectedList.length} targets`);
    } catch (err) {
      toast.error('Failed to apply multi-healing', {
        description: err instanceof Error ? err.message : 'Database error',
      });
    }
  };

  const handleApplyMultiCondition = async (condition: string) => {
    const selectedList = combatants.filter(c => selectedIds.has(c.id));
    if (selectedList.length === 0) return;

    const previousState = getSnapshot();
    try {
      const { addCombatEvent, activeCombatLog, combatState } =
        useDashboardStore.getState()

      for (const c of selectedList) {
        const currentConditions = c.conditions || '';
        const list = currentConditions.split(',').map(s => s.trim()).filter(Boolean);
        if (!list.includes(condition)) {
          const next = [...list, condition].join(', ');
          await updateCombatant(c.id, { conditions: next });
        }
      }
      toast.success(`${condition} applied to ${selectedList.length} targets`);
    } catch (err) {
      toast.error('Failed to apply multi-condition', {
        description: err instanceof Error ? err.message : 'Database error',
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    const previousState = getSnapshot();
    const idsToDelete = Array.from(selectedIds);
    const activeId = previousState.combatState.activeTurnId;

    let nextActiveId = activeId;
    if (activeId && selectedIds.has(activeId)) {
      const currentIndex = combatants.findIndex(c => c.id === activeId);
      let nextIndex = (currentIndex + 1) % combatants.length;
      let found = false;
      let attempts = 0;
      while (attempts < combatants.length) {
        if (!selectedIds.has(combatants[nextIndex].id)) {
          found = true;
          break;
        }
        nextIndex = (nextIndex + 1) % combatants.length;
        attempts++;
      }
      nextActiveId = found ? combatants[nextIndex].id : null;
    }

    // Optimistic delete
    updateState(prev => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        combatants: prev.combatState.combatants.filter(c => !selectedIds.has(c.id)),
        activeTurnId: nextActiveId,
      },
    }));

    try {
      for (const id of idsToDelete) {
        const targetCombatant = previousState.combatState.combatants.find(c => c.id === id);
        if (targetCombatant && targetCombatant.encounterCombatantId) {
          const ec = previousState.encounterCombatants.find(e => e.id === targetCombatant.encounterCombatantId);
          if (ec) {
            if (ec.quantity > 1) {
              const newQty = ec.quantity - 1;
              await updateEncounterCombatantQuantityDB(ec.id, newQty);
              updateState(prev => ({
                ...prev,
                encounterCombatants: prev.encounterCombatants.map(item =>
                  item.id === ec.id ? { ...item, quantity: newQty } : item
                ),
              }));
            } else {
              await deleteEncounterCombatantDB(ec.id);
              updateState(prev => ({
                ...prev,
                encounterCombatants: prev.encounterCombatants.filter(
                  ecItem => ecItem.id !== targetCombatant.encounterCombatantId
                ),
              }));
            }
          }
        }
      }
      if (onSuccess) {
        onSuccess();
      }
      toast.success(`${idsToDelete.length} combatants removed.`);
    } catch (error) {
      updateState(prev => ({
        ...prev,
        encounterCombatants: previousState.encounterCombatants,
        combatState: {
          ...prev.combatState,
          combatants: previousState.combatState.combatants,
          activeTurnId: previousState.combatState.activeTurnId,
        }
      }));
      toast.error('Failed to remove combatants. Please try again.', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  };

  return {
    handleApplyMultiDamage,
    handleApplyMultiHealing,
    handleApplyMultiCondition,
    handleDeleteSelected,
  };
}
