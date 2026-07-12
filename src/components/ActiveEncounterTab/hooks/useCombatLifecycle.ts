import { useCallback } from 'react';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { useDashboardStore } from '../../../hooks/dashboardStore';
import { getSpreadsheetId } from '../../../services/sheetsService';
import { updateInitiativeDB, appendEncounterLog } from '../../../services/dbOperations';
import { generateTranscript } from '../../../lib/combatLog';
import { toast } from 'sonner';
import { useInitiativeEvent } from '../../../hooks/useCombatOverlayEvents';
import { calculateModifier, parseAbilityScores } from '../../../lib/abilityScores';

export function useCombatLifecycle() {
  const { updateState } = useAppState();
  const { fire: fireInitiativeEvent } = useInitiativeEvent();

  const rollInitForNPCs = useCallback(() => {
    const snapshot = getSnapshot();
    const { combatState: { combatants }, npcs } = snapshot;

    const nextCombatants = combatants.map(c => {
      if (c.type === 'npc') {
        const d20Roll = Math.floor(Math.random() * 20) + 1;
        let dexMod = 0;
        
        if (c.npcId) {
          const npcTemplate = npcs.find(n => n.id === c.npcId);
          const scores = parseAbilityScores(npcTemplate?.abilityScores ?? '{}');
          dexMod = calculateModifier(scores.DEX);
        }

        const total = d20Roll + dexMod;
        
        // Show notification with breakdown if modifier exists
        if (dexMod !== 0) {
          toast(`Rolled initiative for ${c.name}: ${total} (d20: ${d20Roll} + DEX ${dexMod > 0 ? '+' : ''}${dexMod})`);
        } else {
          toast(`Rolled initiative for ${c.name}: ${total}`);
        }

        // Persist to Google Sheets
        if (c.encounterCombatantId) {
          updateInitiativeDB(c.encounterCombatantId, total).catch(err => {
            console.error(`[Sync] Failed to update initiative for ${c.name}`, err);
          });
        }

        return { ...c, initiative: total };
      }
      return c;
    }).sort((a, b) => b.initiative - a.initiative);

    updateState(prev => ({
      ...prev,
      combatState: { ...prev.combatState, combatants: nextCombatants },
    }));
  }, [updateState]);

  const resetCombat = useCallback(() => {
    const latestSnapshot = getSnapshot();
    updateState(prev => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        activeTurnId: null,
        round: 1,
        combatants: prev.combatState.combatants.map(c => ({ ...c, initiative: 0 })),
        actionContext: { sourceOverride: null, actionType: 'attack' }
      },
    }));

    useDashboardStore.getState().setCombatStarted(false);

    latestSnapshot.combatState.combatants.forEach(c => {
      if (c.encounterCombatantId) {
        updateInitiativeDB(c.encounterCombatantId, 0).catch(err => {
          console.error(`Failed to reset initiative for combatant ${c.id}`, err);
        });
      }
    });

    const {
      activeCombatLog,
      clearCombatLog,
      addCombatEvent,
    } = useDashboardStore.getState()
    
    const currentSpreadsheetId = getSpreadsheetId();

    if (activeCombatLog && currentSpreadsheetId) {
      // Log combat-end event
      addCombatEvent({
        round: activeCombatLog.currentRound,
        type: 'combat-end',
        actorId: null,
        actorName: null,
        targetId: null,
        targetName: null,
        isManualAdjustment: false,
      })

      // Determine outcome
      const finalLog =
        useDashboardStore.getState().activeCombatLog!

      const allNpcsDefeated =
        finalLog.partySnapshot
          .filter(p => p.type === 'npc')
          .every(p =>
            finalLog.events.some(
              e => e.type === 'combatant-defeated'
                && e.targetId === p.id
            )
          )

      const allPcsDefeated =
        finalLog.partySnapshot
          .filter(p => p.type === 'pc')
          .every(p =>
            finalLog.events.some(
              e => e.type === 'combatant-defeated'
                && e.targetId === p.id
            )
          )

      const outcome =
        allNpcsDefeated ? 'Victory'
        : allPcsDefeated ? 'Defeat'
        : 'Incomplete'

      const transcript =
        generateTranscript(finalLog, outcome)

      // Write to sheet (fire and forget —
      // do not await, do not block combat
      // cleanup on a sheet write)
      appendEncounterLog(
        currentSpreadsheetId,
        {
          id: `log_${Date.now()}`,
          encounterId: finalLog.encounterId,
          encounterName: finalLog.encounterName,
          location: finalLog.location,
          date: finalLog.startedAt,
          durationRounds: finalLog.currentRound,
          outcome,
          partySnapshot: JSON.stringify(
            finalLog.partySnapshot),
          events: JSON.stringify(finalLog.events),
          transcript,
        }
      ).catch(err => {
        console.error(
          '[CombatLog] Failed to write log:',
          err
        );
        toast.error('Failed to save the encounter log.', {
          description: err instanceof Error ? err.message : 'Unknown error'
        });
      })
    } else {
      if (!activeCombatLog) {
        toast.warning('No combat log was recorded for this encounter — initiative may not have been called, or the log was cleared unexpectedly.');
      } else if (!currentSpreadsheetId) {
        toast.warning('Encounter ended, but no Google Spreadsheet is configured — the combat log was not saved.');
      }
    }

    clearCombatLog()
  }, [updateState]);

  const cancelCombat = useCallback(() => {
    const latestSnapshot = getSnapshot();
    updateState(prev => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        activeTurnId: null,
        round: 1,
        combatants: prev.combatState.combatants.map(c => ({ ...c, initiative: 0 })),
        actionContext: { sourceOverride: null, actionType: 'attack' }
      },
    }));

    useDashboardStore.getState().setCombatStarted(false);

    latestSnapshot.combatState.combatants.forEach(c => {
      if (c.encounterCombatantId) {
        updateInitiativeDB(c.encounterCombatantId, 0).catch(err => {
          console.error(`Failed to reset initiative for combatant ${c.id}`, err);
        });
      }
    });

    useDashboardStore.getState().clearCombatLog();
  }, [updateState]);

  const handleCallInitiative = useCallback(() => {
    fireInitiativeEvent(true);
    toast('Initiative called!', {
      description: 'Players can see the overlay on the Player View.',
      duration: 3000,
    });

    const latestState = getSnapshot();
    const combatants = latestState.combatState.combatants;
    const encounterId = latestState.combatState.activeEncounterId || '';
    const encounters = latestState.encounters;
    const startingRound = latestState.combatState.round;

    const { initCombatLog, addCombatEvent }
      = useDashboardStore.getState()

    // Build party snapshot from combatants
    // already set up by handleCallInitiative
    const snapshot = combatants.map(c => ({
      id: c.id,
      name: c.name,
      type: (c.type === 'pc' ? 'pc' : 'npc') as 'pc' | 'npc',
      startingHp: c.currentHp,
      maxHp: c.maxHp,
      level: c.level ?? undefined,
      cr: c.challengeRating ?? undefined,
    }))

    // Get encounter name and location from
    // the active encounter in store state
    const activeEncounter = encounters.find(
      e => e.id === encounterId)
    const encounterName =
      activeEncounter?.name ?? 'Unknown'
    const location =
      activeEncounter?.location ?? ''

    initCombatLog(
      encounterId,
      encounterName,
      location,
      snapshot,
      [],
      startingRound,
    )

    addCombatEvent({
      round: startingRound,
      type: 'combat-start',
      actorId: null,
      actorName: null,
      targetId: null,
      targetName: null,
      isManualAdjustment: false,
    })
  }, [fireInitiativeEvent]);

  return {
    rollInitForNPCs,
    resetCombat,
    cancelCombat,
    handleCallInitiative,
  };
}
