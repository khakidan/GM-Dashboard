import { buildConditionSummary, CONCENTRATION_EFFECTS } from '../../../lib/conditions';
import { useState, useCallback, createElement } from 'react';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { useDashboardStore } from '../../../hooks/dashboardStore';
import { updateEncounterStateDB } from '../../../services/dbOperations';
import { useCombatantMutations } from './useCombatantMutations';
import { useCombatLifecycle } from './useCombatLifecycle';
import { toast } from 'sonner';
import { useDeathEvent, useDamageEvent, useHealEvent, useUnconsciousEvent, useRageEvent } from '../../../hooks/useOverlayEvents';
import { getExpiredConditions, getNextActiveTurnIndex } from '../../../lib/combatLogic';
import { useDeathSaves } from '../../../hooks/useDeathSaves';

export function useCombatSync() {
  const { state, updateState } = useAppState();
  
  const { syncingIds, updateCombatant, removeCombatant } = useCombatantMutations();
  const { rollInitForNPCs, resetCombat, cancelCombat, handleCallInitiative } = useCombatLifecycle();

  const [globalError, setGlobalError] = useState<string | null>(null);

  const { fire: fireDeathEvent } = useDeathEvent();
  const { fire: fireDamageEvent } = useDamageEvent();
  const { fire: fireHealEvent } = useHealEvent();
  const { fire: fireUnconsciousEvent } = useUnconsciousEvent();
  const { fire: fireRageEvent } = useRageEvent();

  const { getDeathSaveReminder, recordDeathSave } = useDeathSaves();

  const [concentrationPrompt, setConcentrationPrompt] = useState<{
    effectName: string;
    targetName: string;
  } | null>(null);

  const handleError = (err: any, fallbackMsg: string) => {
    const _e = typeof err !== 'undefined' ? err : null;
    if (_e && ((_e as any).message === 'UNAUTHENTICATED' || (_e as any).error === 'UNAUTHENTICATED')) {
      toast.error('Session expired — please sign in again.', {
        description: 'Your Google session timed out. Use the Connect & Sync button to reconnect.',
        duration: 8000,
      });
    } else {
      setGlobalError(fallbackMsg);
      setTimeout(() => setGlobalError(null), 5000);
    }
  };

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
          combatStarted: true
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

  const handleConcentrationPrompt = useCallback((effectName: string, targetName: string) => {
    toast('Concentration required', {
      description: `${effectName} requires concentration. Select the caster to apply the Concentrating condition.`,
      duration: 10000,
      action: {
        label: 'Select caster',
        onClick: () => setConcentrationPrompt({ effectName, targetName })
      }
    });
  }, []);

  const handleSelectCaster = useCallback((casterId: string) => {
    if (!concentrationPrompt) return;
    const { effectName } = concentrationPrompt;

    const currentState = getSnapshot();
    const caster = currentState.combatState.combatants.find(c => c.id === casterId);
    if (!caster) return;

    const lowerConditions = (caster.conditions || '').toLowerCase();
    const isCasterConcentrating = lowerConditions.split(',').map(s => s.trim().toLowerCase()).includes('concentrating');

    const executeCasterUpdate = () => {
      const conEffectsArray = Array.from(CONCENTRATION_EFFECTS);
      const currentCasterConds = (caster.conditions || '').split(',').map(s => s.trim()).filter(Boolean);
      
      const nextCasterConds = currentCasterConds.filter(cName => {
        const lowerC = cName.toLowerCase();
        return lowerC !== 'concentrating' && !conEffectsArray.includes(lowerC);
      });
      
      nextCasterConds.push('concentrating');
      
      const nextTimers = { ...(caster.conditionTimers || {}) };
      Object.keys(nextTimers).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'concentrating' || conEffectsArray.includes(lowerKey)) {
          delete nextTimers[key];
        }
      });

      updateCombatant(casterId, {
        conditions: nextCasterConds.join(', '),
        conditionTimers: nextTimers,
      });

      setConcentrationPrompt(null);
    };

    if (isCasterConcentrating) {
      if (window.confirm(`${caster.name} is already concentrating. End previous and start new?`)) {
        executeCasterUpdate();
      }
    } else {
      executeCasterUpdate();
    }
  }, [concentrationPrompt, updateCombatant]);

  return {
    syncingIds,
    globalError,
    setGlobalError,
    handleError,
    removeCombatant,
    updateCombatant,
    fireDeathEvent,
    fireDamageEvent,
    fireHealEvent,
    fireUnconsciousEvent,
    fireRageEvent,
    rollInitForNPCs,
    resetCombat,
    cancelCombat,
    handleCallInitiative,
    nextTurn,
    handleConcentrationPrompt,
    handleSelectCaster,
    concentrationPrompt,
    setConcentrationPrompt
  };
}
