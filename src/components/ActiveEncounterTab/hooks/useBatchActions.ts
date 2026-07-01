import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { useDashboardStore } from '../../../hooks/dashboardStore';
import { useHealthChange } from './useHealthChange';
import { Combatant, DamageType } from '../../../types';
import { toast } from 'sonner';
import { 
  deleteEncounterCombatantDB, 
  updateEncounterCombatantQuantityDB,
  updateCharacterDB,
  updateNpcInstanceHpDB,
  updateNpcInstanceConditionsDB
} from '../../../services/dbOperations';

interface UseBatchActionsProps {
  selectedIds: Set<string>;
  combatants: Combatant[];
  onSuccess?: () => void;
}

export function useBatchActions({ selectedIds, combatants, onSuccess }: UseBatchActionsProps) {
  const { updateState } = useAppState();

  const updateCombatant = async (id: string, updates: Partial<Combatant>) => {
    const previousState = getSnapshot();
    const currentCombatant = previousState.combatState.combatants.find(c => c.id === id);
    if (!currentCombatant) return;

    const targetCombatant = { ...currentCombatant, ...updates };

    // Optimistic state update
    updateState(prev => {
      const nextCombatants = prev.combatState.combatants.map(c =>
        c.id === id ? { ...c, ...updates } : c
      );
      return {
        ...prev,
        characters: prev.characters.map(c => {
          if (targetCombatant.characterId === c.id) {
            return {
              ...c,
              ...(updates.currentHp !== undefined ? { currentHp: updates.currentHp } : {}),
              ...(updates.tempHp !== undefined ? { tempHp: updates.tempHp } : {}),
              ...(updates.conditions !== undefined ? { conditions: updates.conditions } : {}),
              ...(updates.tempHpMax !== undefined ? { tempHpMax: updates.tempHpMax } : {}),
              ...(updates.tempAcModifier !== undefined ? { tempAc: updates.tempAcModifier } : {}),
              ...(updates.statusId !== undefined ? { statusId: updates.statusId } : {}),
            };
          }
          return c;
        }),
        encounterCombatants: prev.encounterCombatants.map(item => {
          if (targetCombatant.encounterCombatantId === item.id) {
            return {
              ...item,
              ...(updates.conditionTimers !== undefined ? { conditionTimers: updates.conditionTimers } : {}),
              ...(updates.currentHp !== undefined && targetCombatant.type === 'npc' ? { npcCurrentHp: updates.currentHp } : {}),
              ...(updates.tempHp !== undefined && targetCombatant.type === 'npc' ? { npcTempHp: updates.tempHp } : {}),
              ...(updates.conditions !== undefined && targetCombatant.type === 'npc' ? { npcCurrentConditions: updates.conditions } : {}),
              ...(updates.tempAcModifier !== undefined && targetCombatant.type === 'npc' ? { npcTempAcMod: updates.tempAcModifier } : {}),
            };
          }
          return item;
        }),
        combatState: { ...prev.combatState, combatants: nextCombatants },
      };
    });

    try {
      if (targetCombatant.type === 'pc' && targetCombatant.characterId) {
        const char = previousState.characters.find(c => c.id === targetCombatant.characterId);
        if (char) {
          await updateCharacterDB(
            {
              currentHp: targetCombatant.currentHp,
              tempHp: targetCombatant.tempHp,
              conditions: targetCombatant.conditions,
              tempHpMax: targetCombatant.tempHpMax,
              statusId: targetCombatant.statusId,
              tempAc: targetCombatant.tempAcModifier,
              deathSavesFails: targetCombatant.deathSavesFails,
              deathSavesSuccesses: targetCombatant.deathSavesSuccesses,
            },
            char
          );
        }
      } else if (targetCombatant.type === 'npc' && targetCombatant.encounterCombatantId) {
        if (updates.currentHp !== undefined || updates.tempHp !== undefined) {
          await updateNpcInstanceHpDB(
            targetCombatant.encounterCombatantId,
            targetCombatant.currentHp,
            targetCombatant.tempHp || 0
          );
        }
        if (updates.conditions !== undefined) {
          await updateNpcInstanceConditionsDB(
            targetCombatant.encounterCombatantId,
            targetCombatant.conditions || ''
          );
        }
      }
    } catch (error) {
      updateState(() => previousState);
      toast.error('Failed to update combatant. Changes rolled back.', {
        description: error instanceof Error ? error.message : 'Database error',
      });
      throw error;
    }
  };

  const { handleHealthChange, fireDamageEvent, fireHealEvent } = useHealthChange(new Set(), updateCombatant);

  const handleApplyMultiDamage = async (amount: number, type: DamageType | null) => {
    const selectedList = combatants.filter(c => selectedIds.has(c.id));
    if (selectedList.length === 0) return;

    const affectedNames = selectedList.map(c => c.name);
    const previousState = getSnapshot();
    try {
      const { addCombatEvent, activeCombatLog, combatState } =
        useDashboardStore.getState()

      for (const c of selectedList) {
        const hpBefore = c.currentHp;
        handleHealthChange(c.id, c, true, type, amount, false, true); // pass skipOverlay=true

        // Find the updated state
        const latestState = getSnapshot();
        const updatedCombatant = latestState.combatState.combatants.find(x => x.id === c.id);
        const hpAfter = updatedCombatant?.currentHp ?? hpBefore;

        if (activeCombatLog) {
          const { actionContext } = combatState;
          const sourceId = actionContext.sourceOverride ?? combatState.activeTurnId;
          const sourceName = actionContext.sourceOverride
            ? (combatState.combatants.find(c => c.id === actionContext.sourceOverride)?.name ?? actionContext.sourceOverride)
            : (combatState.combatants.find(x => x.id === combatState.activeTurnId)?.name ?? null);

          const hpDelta = hpAfter - hpBefore;
          const isManual = combatState.activeTurnId === null && actionContext.sourceOverride === null;

          addCombatEvent({
            round: activeCombatLog.currentRound,
            type: 'damage',
            actorId: isManual ? null : sourceId,
            actorName: isManual ? null : sourceName,
            actionType: actionContext.actionType,
            targetId: c.id,
            targetName: c.name,
            value: Math.abs(hpDelta),
            damageType: type ?? undefined,
            hpBefore,
            hpAfter,
            isManualAdjustment: isManual,
          });

          if (hpAfter <= 0) {
            addCombatEvent({
              round: activeCombatLog.currentRound,
              type: 'combatant-defeated',
              actorId: isManual ? null : sourceId,
              actorName: isManual ? null : sourceName,
              actionType: actionContext.actionType,
              targetId: c.id,
              targetName: c.name,
              isManualAdjustment: false,
            });
          }
        }
      }
      
      // Fire ONE overlay event with all names
      fireDamageEvent({
        combatantNames: affectedNames,
        damageAmount: amount,
        damageType: type || undefined,
      });

      toast.success(`Damage applied to ${selectedList.length} targets`);
    } catch (err) {
      updateState(() => previousState);
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
        const hpBefore = c.currentHp;
        handleHealthChange(c.id, c, false, null, amount, false, true); // pass skipOverlay=true

        // Find the updated state
        const latestState = getSnapshot();
        const updatedCombatant = latestState.combatState.combatants.find(x => x.id === c.id);
        const hpAfter = updatedCombatant?.currentHp ?? hpBefore;

        if (activeCombatLog) {
          const { actionContext } = combatState;
          const sourceId = actionContext.sourceOverride ?? combatState.activeTurnId;
          const sourceName = actionContext.sourceOverride
            ? (combatState.combatants.find(c => c.id === actionContext.sourceOverride)?.name ?? actionContext.sourceOverride)
            : (combatState.combatants.find(x => x.id === combatState.activeTurnId)?.name ?? null);

          const hpDelta = hpAfter - hpBefore;
          const isManual = combatState.activeTurnId === null && actionContext.sourceOverride === null;

          addCombatEvent({
            round: activeCombatLog.currentRound,
            type: 'healing',
            actorId: isManual ? null : sourceId,
            actorName: isManual ? null : sourceName,
            actionType: actionContext.actionType,
            targetId: c.id,
            targetName: c.name,
            value: Math.abs(hpDelta),
            hpBefore,
            hpAfter,
            isManualAdjustment: isManual,
          });
        }
      }
      
      // Fire ONE healEvent after the loop with all names
      fireHealEvent({
        combatantNames: affectedNames,
        healAmount: amount
      });

      toast.success(`Healing applied to ${selectedList.length} targets`);
    } catch (err) {
      updateState(() => previousState);
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

          if (activeCombatLog) {
            const activeTurnCombatant = combatState.combatants.find(
              x => x.id === combatState.activeTurnId
            );

            addCombatEvent({
              round: activeCombatLog.currentRound,
              type: 'condition-applied',
              actorId: activeTurnCombatant?.id ?? null,
              actorName: activeTurnCombatant?.name ?? null,
              targetId: c.id,
              targetName: c.name,
              condition,
              isManualAdjustment: false,
            });
          }
        }
      }
      toast.success(`${condition} applied to ${selectedList.length} targets`);
    } catch (err) {
      updateState(() => previousState);
      toast.error('Failed to apply multi-condition', {
        description: err instanceof Error ? err.message : 'Database error',
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    const count = selectedIds.size;
    const confirm = window.confirm(`Remove ${count} combatants from this encounter? This cannot be undone.`);
    if (!confirm) return;

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
      toast.success(`${count} combatants removed.`);
    } catch (error) {
      updateState(() => previousState);
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
