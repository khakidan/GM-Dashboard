import { useCallback } from 'react';
import { useAppState, getSnapshot } from './useAppState';
import { useDashboardStore } from './dashboardStore';
import { useDeathEvent, useUnconsciousEvent } from './useCombatOverlayEvents';
import { updateDeathSavesDB, updateCharacterDB } from '../services/dbOperations';
import { toast } from 'sonner';
import { Combatant } from '../types';

export function useDeathSaves() {
  const { updateState } = useAppState();
  const { fire: fireDeathEvent } = useDeathEvent();
  const { fire: fireUnconsciousEvent } = useUnconsciousEvent();

  const checkDeathSaveOutcome = useCallback(
    async (combatantId: string, fails: number, successes: number, combatant: Combatant) => {
      if (!combatant.characterId) {
        console.warn(
          '[useDeathSaves] combatant has no ' +
          'characterId — skipping death save ' +
          'operation', 
          combatant.id
        );
        return;
      }

      if (fails >= 3) {
        // PC has died!
        const conditionsList = (combatant.conditions || '').split(',').map(s => s.trim()).filter(Boolean);
        const updatedConditions = conditionsList.filter(cond => cond.toLowerCase() !== 'unconscious').join(', ');
        
        updateState(prev => ({
          ...prev,
          characters: prev.characters.map(c => 
            c.id === combatant.characterId 
              ? { 
                  ...c, 
                  deathSavesFails: fails, 
                  deathSavesSuccesses: successes, 
                  conditions: updatedConditions, 
                  statusId: 3, 
                  isActive: false 
                } 
              : c
          ),
          combatState: {
            ...prev.combatState,
            combatants: prev.combatState.combatants.map(c => 
              c.id === combatantId 
                ? { 
                    ...c, 
                    deathSavesFails: fails, 
                    deathSavesSuccesses: successes, 
                    conditions: updatedConditions, 
                    statusId: 3,
                    isStable: false
                  } 
                : c
            )
          }
        }));

        const currentSnapshot = getSnapshot();
        const fullChar = currentSnapshot.characters.find(c => c.id === combatant.characterId);
        if (fullChar) {
          await updateCharacterDB({
            statusId: 3,
            conditions: updatedConditions,
            deathSavesFails: fails,
            deathSavesSuccesses: successes
          }, fullChar);
        } else {
          throw new Error(`Character ${combatant.characterId} not found in state`);
        }

        const { addCombatEvent, activeCombatLog } = useDashboardStore.getState();
        if (activeCombatLog) {
          addCombatEvent({
            round: activeCombatLog.currentRound,
            type: 'combatant-defeated',
            actorId: null,
            actorName: null,
            targetId: combatantId,
            targetName: combatant.name,
            isManualAdjustment: false,
          });
        }

        fireDeathEvent({ characterName: combatant.name });
        toast(`${combatant.name} has died. Update their status on the Party Roster.`);
        return 'deceased';
      } else if (successes >= 3) {
        // PC is stable!
        updateState(prev => ({
          ...prev,
          characters: prev.characters.map(c => 
            c.id === combatant.characterId 
              ? { ...c, deathSavesFails: fails, deathSavesSuccesses: successes } 
              : c
          ),
          combatState: {
            ...prev.combatState,
            combatants: prev.combatState.combatants.map(c => 
              c.id === combatantId 
                ? { ...c, deathSavesFails: fails, deathSavesSuccesses: successes, isStable: true } 
                : c
            )
          }
        }));

        await updateDeathSavesDB(combatant.characterId, fails, successes);
        toast(`${combatant.name} is stable — no further death saves required until they take damage again.`);
        return 'stable';
      }
      return 'ongoing';
    },
    [updateState, fireDeathEvent]
  );

  const recordDeathSave = useCallback(
    async (combatantId: string, result: 'success' | 'failure', isCritical = false) => {
      const currentState = getSnapshot();
      const combatant = currentState.combatState.combatants.find(c => c.id === combatantId);
      if (!combatant || combatant.type !== 'pc') return;

      if (!combatant.characterId) {
        console.warn(
          '[useDeathSaves] combatant has no ' +
          'characterId — skipping death save ' +
          'operation', 
          combatant.id
        );
        return;
      }

      let fails = combatant.deathSavesFails || 0;
      let successes = combatant.deathSavesSuccesses || 0;

      if (result === 'success') {
        successes += (isCritical ? 2 : 1);
      } else {
        fails += (isCritical ? 2 : 1);
      }

      // Optimistic update
      updateState(prev => ({
        ...prev,
        characters: prev.characters.map(c => 
          c.id === combatant.characterId ? { ...c, deathSavesFails: fails, deathSavesSuccesses: successes } : c
        ),
        combatState: {
          ...prev.combatState,
          combatants: prev.combatState.combatants.map(c => 
            c.id === combatantId ? { ...c, deathSavesFails: fails, deathSavesSuccesses: successes, isStable: false } : c
          )
        }
      }));

      const { addCombatEvent, activeCombatLog } = useDashboardStore.getState();
      if (activeCombatLog) {
        addCombatEvent({
          round: activeCombatLog.currentRound,
          type: 'death-save',
          actorId: null,
          actorName: null,
          targetId: combatantId,
          targetName: combatant.name,
          condition: result,
          resourceName: result === 'success' ? 'Death Save Successes' : 'Death Save Failures',
          resourceBefore: result === 'success' ? successes - (isCritical ? 2 : 1) : fails - (isCritical ? 2 : 1),
          resourceAfter: result === 'success' ? successes : fails,
          resourceMax: 3,
          isManualAdjustment: false,
        });
      }

      try {
        await updateDeathSavesDB(combatant.characterId, fails, successes);
        const outcome = await checkDeathSaveOutcome(combatantId, fails, successes, combatant);
        if (outcome === 'ongoing') {
          toast(`Death save recorded for ${combatant.name}: ${result === 'success' ? 'Success' : 'Failure'}. (${successes}/3 Successes, ${fails}/3 Fails)`);
        }
      } catch (error) {
        console.error('[DeathSaves] Failed to record death save', error);
        toast.error('Failed to update death saves.');
        // Rollback
        updateState(() => currentState);
      }
    },
    [updateState, checkDeathSaveOutcome]
  );

  const applyDamageToUnconscious = useCallback(
    async (combatantId: string, isCritical = false) => {
      const currentState = getSnapshot();
      const combatant = currentState.combatState.combatants.find(c => c.id === combatantId);
      if (!combatant || combatant.type !== 'pc') return;

      if (!combatant.characterId) {
        console.warn(
          '[useDeathSaves] combatant has no ' +
          'characterId — skipping death save ' +
          'operation', 
          combatant.id
        );
        return;
      }

      const failsGain = isCritical ? 2 : 1;
      const currentFails = combatant.isStable ? 0 : (combatant.deathSavesFails || 0);
      const newFails = currentFails + failsGain;
      const successes = combatant.isStable ? 0 : (combatant.deathSavesSuccesses || 0);

      toast(`${combatant.name} is unconscious and took damage — death save failed automatically`);

      // Optimistic update
      updateState(prev => ({
        ...prev,
        characters: prev.characters.map(c => 
          c.id === combatant.characterId ? { ...c, deathSavesFails: newFails, deathSavesSuccesses: successes } : c
        ),
        combatState: {
          ...prev.combatState,
          combatants: prev.combatState.combatants.map(c => 
            c.id === combatantId ? { ...c, deathSavesFails: newFails, deathSavesSuccesses: successes, isStable: false } : c
          )
        }
      }));

      const { addCombatEvent, activeCombatLog } = useDashboardStore.getState();
      if (activeCombatLog) {
        addCombatEvent({
          round: activeCombatLog.currentRound,
          type: 'death-save',
          actorId: null,
          actorName: null,
          targetId: combatantId,
          targetName: combatant.name,
          condition: 'failure',
          resourceName: 'Death Save Failures',
          resourceBefore: currentFails,
          resourceAfter: newFails,
          resourceMax: 3,
          isManualAdjustment: false,
        });
      }

      try {
        await updateDeathSavesDB(combatant.characterId, newFails, successes);
        await checkDeathSaveOutcome(combatantId, newFails, successes, combatant);
      } catch (error) {
        console.error('[DeathSaves] Failed to apply damage to unconscious', error);
        toast.error('Failed to update death saves.');
        updateState(() => currentState);
      }
    },
    [updateState, checkDeathSaveOutcome]
  );

  const getDeathSaveReminder = useCallback((combatant: Combatant) => {
    const activeConditionsList = (combatant.conditions || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const isPcUnconscious = combatant.type === 'pc' && 
      activeConditionsList.some(cond => cond.toLowerCase() === 'unconscious');

    if (isPcUnconscious && !combatant.isStable && (combatant.deathSavesSuccesses || 0) < 3) {
      return {
        combatantId: combatant.id,
        name: combatant.name,
        fails: combatant.deathSavesFails || 0,
        successes: combatant.deathSavesSuccesses || 0
      };
    }
    return null;
  }, []);

  return {
    recordDeathSave,
    applyDamageToUnconscious,
    getDeathSaveReminder,
    fireUnconsciousEvent
  };
}
