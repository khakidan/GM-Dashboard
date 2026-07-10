import { useCallback, createElement } from 'react';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { useDashboardStore } from '../../../hooks/dashboardStore';
import { updateEncounterStateDB } from '../../../services/dbOperations';
import { getNextActiveTurnIndex, getExpiredConditions } from '../../../lib/combatLogic';
import { buildConditionSummary, CONCENTRATION_EFFECTS } from '../../../lib/conditions';
import { toast } from 'sonner';
import { useDeathSaves } from '../../../hooks/useDeathSaves';
import { Combatant } from '../../../types';

export function useCombatTurn(updateCombatant: (id: string, updates: Partial<Combatant>) => void) {
  const { updateState } = useAppState();
  const { getDeathSaveReminder, recordDeathSave } = useDeathSaves();

  const nextTurn = useCallback(() => {
    const currentState = getSnapshot();
    let nextRound = currentState.combatState.round;
    const combatants = currentState.combatState.combatants;
    if (combatants.length === 0) return;

    const state = useDashboardStore.getState();
    if (!(state.combatState as any).combatStarted) {
      // First Next Turn click — finalize
      // initiative order now
      const currentCombatants =
        state.combatState.combatants

      const finalInitiativeOrder =
        [...currentCombatants]
          .sort((a, b) =>
            (b.initiative ?? 0) -
            (a.initiative ?? 0))
          .map(c => ({
            combatantId: c.id,
            name: c.name,
            initiative: c.initiative ?? 0,
            type: (c.type === 'pc' 
              ? 'pc' : 'npc') as
                'pc' | 'npc',
          }))

      // Update the log's initiative order
      // with the now-finalized values
      if (state.activeCombatLog) {
        useDashboardStore.setState(prev => ({
          ...prev,
          activeCombatLog: prev.activeCombatLog
            ? {
                ...prev.activeCombatLog,
                initiativeOrder:
                  finalInitiativeOrder,
              }
            : null,
        }))
      }

      state.setCombatStarted(true)

      // FIX 1A: Sort the live combatants and set first turn
      const sortedCombatants = [...currentCombatants].sort((a, b) => 
        (b.initiative ?? 0) - (a.initiative ?? 0)
      );
      const firstActiveId = sortedCombatants.length > 0 ? sortedCombatants[0].id : null;

      updateState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          combatants: sortedCombatants,
          activeTurnId: firstActiveId,
          combatStarted: true,
          actionContext: { sourceOverride: null, actionType: 'attack' }
        }
      }));

      if (firstActiveId) {
        updateEncounterStateDB(currentState.combatState.activeEncounterId ?? '', currentState.combatState.round, firstActiveId).catch(err => {
          console.warn("Failed to write initial sorted turn state to sheet", err);
        });
      }

      return; // Return early - first click establishes order
    }

    const currentIndex = combatants.findIndex(
      c => c.id === currentState.combatState.activeTurnId
    );

    const nextActiveId = getNextActiveTurnIndex(combatants, currentState.combatState.activeTurnId);

    // If a full loop finds no valid combatant, set activeTurnId to null
    if (nextActiveId === null) {
      updateState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          activeTurnId: null,
        }
      }));
      updateEncounterStateDB(currentState.combatState.activeEncounterId ?? '', nextRound, '').catch(err => {
        console.warn("Failed to clear turn state in sheet", err);
      });
      return;
    }

    const nextIndex = combatants.findIndex(c => c.id === nextActiveId);

    if (currentIndex !== -1 && nextIndex <= currentIndex) {
      nextRound += 1;
    }

    if (currentIndex !== -1 && nextIndex <= currentIndex) {
      const { advanceCombatLogRound,
        addCombatEvent, activeCombatLog }
        = useDashboardStore.getState()
      advanceCombatLogRound()
      addCombatEvent({
        round: activeCombatLog
          ? activeCombatLog.currentRound + 1
          : 1,
        type: 'round-start',
        actorId: null,
        actorName: null,
        targetId: null,
        targetName: null,
        isManualAdjustment: false,
      })
    }

    updateState(prev => {
      if (prev.combatState.combatants.length === 0) return prev;
      const nextCombatants = prev.combatState.combatants.map(c => {
        if (c.id === nextActiveId) {
          const updated = { ...c, reactionUsed: false };
          if (updated.legendaryActions) {
            updated.legendaryActions = {
              ...updated.legendaryActions,
              remaining: updated.legendaryActions.max
            };
          }
          return updated;
        }
        return c;
      });
      return {
        ...prev,
        combatState: {
          ...prev.combatState,
          activeTurnId: nextActiveId,
          round: nextRound,
          combatants: nextCombatants,
          actionContext: { sourceOverride: null, actionType: 'attack' },
        },
      };
    });

    updateEncounterStateDB(currentState.combatState.activeEncounterId ?? '', nextRound, nextActiveId).catch(err => {
      console.warn("Failed to write updated turn state to sheet", err);
    });

    const newlyActiveCombatant = combatants[nextIndex];

    if (newlyActiveCombatant && newlyActiveCombatant.legendaryActions) {
      toast(`${newlyActiveCombatant.name} regains all legendary actions.`);
    }

    if (newlyActiveCombatant) {
      const activeConditionsList = newlyActiveCombatant.conditions
        ?.split(',')
        .map(s => s.trim())
        .filter(Boolean) || [];

      const deathSaveInfo = getDeathSaveReminder(newlyActiveCombatant);

      if (deathSaveInfo) {
        const { fails, successes, combatantId: cId, name: cName } = deathSaveInfo;
        const toastId = `death-save-${cId}`;

        toast(
          createElement('div', { className: 'flex flex-col gap-1.5', id: `ds-prompt-${cId}` }, [
            createElement('div', { key: 'title', className: 'font-semibold text-sm text-neutral-900' }, `${cName} is unconscious — Death Saving Throw`),
            createElement('div', { key: 'status', className: 'text-xs text-neutral-500' }, `Fails: ${fails}/3  Successes: ${successes}/3.`),
            createElement('div', { key: 'actions', className: 'flex gap-2 mt-1' }, [
              createElement('button', {
                key: 'succ',
                id: `ds-success-${cId}`,
                onClick: () => {
                  recordDeathSave(cId, 'success');
                  toast.dismiss(toastId);
                },
                className: 'px-2.5 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 cursor-pointer pointer-events-auto'
              }, 'Success'),
              createElement('button', {
                key: 'fail',
                id: `ds-fail-${cId}`,
                onClick: () => {
                  recordDeathSave(cId, 'failure');
                  toast.dismiss(toastId);
                },
                className: 'px-2.5 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 cursor-pointer pointer-events-auto'
              }, 'Failure')
            ])
          ]),
          {
            duration: 15000,
            id: toastId,
          }
        );
      } else if (activeConditionsList.length > 0) {
        const summary = buildConditionSummary(activeConditionsList);
        if (summary.lines.length > 0) {
          toast(`${newlyActiveCombatant.name}'s turn`, {
            description: summary.lines.join('\n'),
            duration: 7000,
          });
        }
      }

      // Check for expired conditions
      const expired = getExpiredConditions(combatants, nextRound);
      expired.forEach(({ combatantId, combatantName, conditionName }) => {
        const isConcentration = CONCENTRATION_EFFECTS.has(conditionName.toLowerCase());
        const message = isConcentration
          ? `${conditionName} concentration on ${combatantName} has ended`
          : `${conditionName} on ${combatantName} has ended`;

        toast(message, {
          action: {
            label: "Remove",
            onClick: () => {
              const snapshot = getSnapshot();
              const target = snapshot.combatState.combatants.find(c => c.id === combatantId);
              if (!target) return;

              const nextConds = (target.conditions || '').split(',')
                .map(s => s.trim())
                .filter(s => s.toLowerCase() !== conditionName.toLowerCase() && s !== '');
                
              const conEffectsArray = Array.from(CONCENTRATION_EFFECTS);
              const hasOtherCon = nextConds.some(s => conEffectsArray.includes(s.toLowerCase()));
              
              let finalConds = nextConds;
              if (!hasOtherCon) {
                finalConds = nextConds.filter(s => s.toLowerCase() !== 'concentrating');
              }

              const nextTimers = { ...(target.conditionTimers || {}) };
              delete nextTimers[conditionName];

              updateCombatant(combatantId, {
                conditions: finalConds.join(', '),
                conditionTimers: nextTimers,
              });
            },
          },
        });
      });
    }
  }, [updateState, getDeathSaveReminder, recordDeathSave, updateCombatant]);

  return {
    nextTurn,
  };
}
