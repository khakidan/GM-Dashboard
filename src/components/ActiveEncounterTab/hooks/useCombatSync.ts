import { useState } from 'react';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { updateSheetData } from '../../../services/sheetsService';
import { updateCharacterDB, updateNpcDB, deleteEncounterCombatantDB, updateEncounterCombatantQuantityDB, updateInitiativeDB, updateConditionTimersDB } from '../../../services/dbOperations';
import { Combatant } from '../../../types';

export function useCombatSync() {
  const { state, updateState } = useAppState();
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleError = (err: any, fallbackMsg: string) => {
    const _e = typeof err !== 'undefined' ? err : null;
    if (_e && ((_e as any).message === 'UNAUTHENTICATED' || (_e as any).error === 'UNAUTHENTICATED')) {
      alert('Your session has expired. Please sign in again.');
      window.location.reload();
    } else {
      setGlobalError(fallbackMsg);
      setTimeout(() => setGlobalError(null), 5000);
    }
  };

  const removeCombatant = async (id: string) => {
    const latestSnapshot = getSnapshot();
    const combatant = latestSnapshot.combatState.combatants.find(c => c.id === id);
    const previousState = latestSnapshot;

    updateState(prev => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        combatants: prev.combatState.combatants.filter(c => c.id !== id),
        activeTurnId: prev.combatState.activeTurnId === id ? null : prev.combatState.activeTurnId,
      },
    }));

    if (combatant?.encounterCombatantId) {
      try {
        const ec = state.encounterCombatants.find(e => e.id === combatant.encounterCombatantId);
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
              encounterCombatants: prev.encounterCombatants.filter(item => item.id !== ec.id),
            }));
          }
        }
      } catch (err) {
        console.warn('Failed to remove combatant from sheet', err);
        updateState(previousState);
        handleError(err, 'Failed to remove combatant—retrying...');
      }
    }
  };

  const updateCombatant = (id: string, updates: Partial<Combatant>) => {
    const previousState = getSnapshot();

    const currentCombatant = previousState.combatState.combatants.find(c => c.id === id);
    if (!currentCombatant) return;
    const targetCombatant = { ...currentCombatant, ...updates };

    updateState(prev => {
      let nextCombatants = prev.combatState.combatants.map(c =>
        c.id === id ? { ...c, ...updates } : c
      );

      if (updates.initiative !== undefined) {
        nextCombatants = [...nextCombatants].sort((a, b) => b.initiative - a.initiative);
      }

      return {
        ...prev,
        characters: prev.characters.map(c => {
          if (targetCombatant.characterId === c.id) {
            return {
              ...c,
              ...(updates.currentHp !== undefined ? { currentHp: updates.currentHp } : {}),
              ...(updates.tempHp !== undefined ? { tempHp: updates.tempHp } : {}),
              ...(updates.conditions !== undefined ? { conditions: updates.conditions } : {}),
            };
          }
          return c;
        }),
        encounterCombatants: prev.encounterCombatants.map(item => {
          if (targetCombatant.encounterCombatantId === item.id && updates.conditionTimers !== undefined) {
            return { ...item, conditionTimers: JSON.stringify(updates.conditionTimers) };
          }
          return item;
        }),
        combatState: { ...prev.combatState, combatants: nextCombatants },
      };
    });

    setSyncingIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    const handleSyncError = (e: any) => {
      console.warn('Sync failed', e);
      updateState(previousState);
      handleError(e, 'Failed to sync update—retrying...');
      setSyncingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    };

    const syncDb = async () => {
      if (updates.initiative !== undefined && targetCombatant.encounterCombatantId) {
        await updateInitiativeDB(targetCombatant.encounterCombatantId, updates.initiative);
      }

      if (updates.conditionTimers !== undefined && targetCombatant.encounterCombatantId) {
        await updateConditionTimersDB(targetCombatant.encounterCombatantId, updates.conditionTimers);
      }

      if (targetCombatant.type === 'pc' && targetCombatant.characterId) {
        const latestSnapshot = getSnapshot();
        const char = latestSnapshot.characters.find(c => c.id === targetCombatant.characterId);
        if (char) {
          await updateCharacterDB(
            {
              currentHp: targetCombatant.currentHp,
              tempHp: targetCombatant.tempHp,
              conditions: targetCombatant.conditions,
            },
            char
          );
        }
      } else if (targetCombatant.type === 'npc') {
        const latestSnapshot = getSnapshot();
        const ec = latestSnapshot.encounterCombatants.find(
          e => e.id === targetCombatant.encounterCombatantId
        );
        if (ec && ec.npcId) {
          await updateNpcDB(
            ec.npcId,
            targetCombatant.currentHp,
            targetCombatant.tempHp || 0,
            targetCombatant.conditions || ''
          );
        }
      }

      setSyncingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    };

    syncDb().catch(handleSyncError);
  };

  return {
    syncingIds,
    globalError,
    setGlobalError,
    handleError,
    removeCombatant,
    updateCombatant
  };
}
