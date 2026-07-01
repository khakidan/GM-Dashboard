import { buildConditionSummary, CONDITION_MECHANICS, CONCENTRATION_EFFECTS } from '../../../lib/conditions';
import { OVERLAY_CLEAR_BUFFER_MS } from '../../../lib/constants';
import { OVERLAY_DURATIONS } from '../../../lib/constants';
import { useState, useCallback, createElement } from 'react';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { useDashboardStore } from '../../../hooks/dashboardStore';
import { updateSheetData, getSpreadsheetId } from '../../../services/sheetsService';
import { updateCharacterDB, deleteEncounterCombatantDB, updateEncounterCombatantQuantityDB, updateInitiativeDB, updateConditionTimersDB, updateNpcInstanceHpDB, updateNpcInstanceConditionsDB, updateNpcInstanceAcModDB, updateEncounterStateDB, appendEncounterLog } from '../../../services/dbOperations';
import { Combatant } from '../../../types';
import { generateTranscript } from '../../../lib/combatLog';
import { toast } from 'sonner';
import { useDeathEvent, useDamageEvent, useHealEvent, useUnconsciousEvent, useRageEvent, useInitiativeEvent } from '../../../hooks/useOverlayEvents';
import { getExpiredConditions } from '../../../lib/combatLogic';
import { useDeathSaves } from '../../../hooks/useDeathSaves';
import { calculateModifier, parseAbilityScores } from '../../../lib/abilityScores';

export function useCombatSync() {
  const { state, updateState } = useAppState();
  
  const syncingIds = new Set(state.combatState.syncingIds || []);
  const setSyncingIds = (action: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    updateState(pState => {
      const currentSet = new Set(pState.combatState.syncingIds || []);
      const nextSet = typeof action === 'function' ? action(currentSet) : action;
      return {
        ...pState,
        combatState: {
          ...pState.combatState,
          syncingIds: Array.from(nextSet),
        }
      };
    });
  };

  const [globalError, setGlobalError] = useState<string | null>(null);

  const { fire: fireDeathEvent } = useDeathEvent();
  const { fire: fireDamageEvent } = useDamageEvent();
  const { fire: fireHealEvent } = useHealEvent();
  const { fire: fireUnconsciousEvent } = useUnconsciousEvent();
  const { fire: fireRageEvent } = useRageEvent();
  const { fire: fireInitiativeEvent } = useInitiativeEvent();

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

  const removeCombatant = async (id: string) => {
    const latestSnapshot = getSnapshot();
    const targetCombatant = latestSnapshot.combatState.combatants.find(c => c.id === id);
    const previousState = latestSnapshot;

    if (!targetCombatant) return;

    updateState(prev => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        combatants: prev.combatState.combatants.filter(c => c.id !== id),
        activeTurnId: prev.combatState.activeTurnId === id ? null : prev.combatState.activeTurnId,
      },
    }));

    if (targetCombatant.encounterCombatantId) {
      try {
        const ec = state.encounterCombatants.find(e => e.id === targetCombatant.encounterCombatantId);
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
      } catch (error) {
      // 4a. Roll back to snapshot on failure
      updateState(() => previousState);
      
      // 4b. Show error toast
      toast.error('Failed to save changes. Please try again.', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
      
      // 4c. Log for debugging
      console.error('[DB Error]', error);
      
      // 4d. Re-throw so callers can handle if needed
      throw error;
    }
    }
  };

  const updateCombatant = async (id: string, updates: Partial<Combatant>) => {
    // 1. Capture snapshot BEFORE optimistic update
    const snapshot = getSnapshot();

    const currentCombatant = snapshot.combatState.combatants.find(c => c.id === id);
    if (!currentCombatant) return;

    if (updates.conditions !== undefined) {
      const newConditionSet = new Set(
        (updates.conditions || '').split(',')
          .map(s => s.trim().toLowerCase())
          .filter(Boolean)
      );

      if (currentCombatant.conditionTimers) {
        const cleanedTimers = Object.fromEntries(
          Object.entries(currentCombatant.conditionTimers)
            .filter(([key]) => newConditionSet.has(key.toLowerCase()))
        );

        if (Object.keys(cleanedTimers).length !== Object.keys(currentCombatant.conditionTimers).length) {
          updates = { ...updates, conditionTimers: cleanedTimers };
        }
      }

      const condList = Array.from(newConditionSet);
      const newAcMod = condList.reduce((sum, cond) => {
        const mod = CONDITION_MECHANICS[cond]?.tempAcModifier ?? 0;
        return sum + mod;
      }, 0);
      
      if (newAcMod !== (currentCombatant.tempAcModifier || 0)) {
        updates = { ...updates, tempAcModifier: newAcMod };
      }

      if (currentCombatant.type === 'pc') {
        const conditionSummary = buildConditionSummary(condList);
        
        const expectsHpMaxHalved = conditionSummary.hpMaxHalved;
        const currentHpMaxHalved = currentCombatant.tempHpMax && currentCombatant.tempHpMax > 0;
        
        if (expectsHpMaxHalved && !currentHpMaxHalved) {
          const newTempHpMax = Math.floor(currentCombatant.maxHp / 2);
          updates = { ...updates, tempHpMax: newTempHpMax };
          
          const currentHpVal = updates.currentHp !== undefined ? updates.currentHp : currentCombatant.currentHp;
          if (currentHpVal > newTempHpMax) {
            updates.currentHp = newTempHpMax;
          }
          
          toast.warning(`${currentCombatant.name}'s Max HP is halved from exhaustion!`, {
            description: `Effective Max HP is now ${newTempHpMax}`,
          });
        } else if (!expectsHpMaxHalved && currentHpMaxHalved) {
          updates = { ...updates, tempHpMax: 0 };
          toast.success(`${currentCombatant.name}'s Max HP restriction is lifted.`);
        }
      }

      const hadRaging = (currentCombatant.conditions || '')
        .toLowerCase()
        .split(',')
        .map(s => s.trim())
        .includes('raging');

      const nowHasRaging = (updates.conditions || '')
        .toLowerCase()
        .split(',')
        .map(s => s.trim())
        .includes('raging');

      if (!hadRaging && nowHasRaging && currentCombatant.type === 'pc') {
        fireRageEvent({ characterName: currentCombatant.name });
      }
    }

    const targetCombatant = { ...currentCombatant, ...updates };

    // 2. Apply optimistic update immediately
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
              ...(updates.tempHpMax !== undefined ? { tempHpMax: updates.tempHpMax } : {}),
              ...(updates.tempAcModifier !== undefined ? { tempAc: updates.tempAcModifier } : {}),
              ...(updates.statusId !== undefined ? { statusId: updates.statusId } : {}),
              ...(updates.deathSavesFails !== undefined ? { deathSavesFails: updates.deathSavesFails } : {}),
              ...(updates.deathSavesSuccesses !== undefined ? { deathSavesSuccesses: updates.deathSavesSuccesses } : {}),
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

    setSyncingIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    // 3. Attempt the DB write
    try {
      if (updates.initiative !== undefined && targetCombatant.encounterCombatantId) {
        await updateInitiativeDB(targetCombatant.encounterCombatantId, updates.initiative);
      }

      if (updates.conditionTimers !== undefined && targetCombatant.encounterCombatantId) {
        await updateConditionTimersDB(targetCombatant.encounterCombatantId, updates.conditionTimers);
      }

      if (targetCombatant.type === 'pc' && targetCombatant.characterId) {
        const char = snapshot.characters.find(c => c.id === targetCombatant.characterId);
        if (char) {
          await updateCharacterDB(
            {
              currentHp: targetCombatant.currentHp,
              tempHp: targetCombatant.tempHp,
              conditions: targetCombatant.conditions,
              tempHpMax: targetCombatant.tempHpMax,
              tempAc: targetCombatant.tempAcModifier,
              statusId: targetCombatant.statusId,
              deathSavesFails: targetCombatant.deathSavesFails,
              deathSavesSuccesses: targetCombatant.deathSavesSuccesses,
            },
            char
          );
        }
      } else if (targetCombatant.type === 'npc') {
        if (targetCombatant.encounterCombatantId && (updates.currentHp !== undefined || updates.tempHp !== undefined)) {
          await updateNpcInstanceHpDB(
            targetCombatant.encounterCombatantId,
            targetCombatant.currentHp,
            targetCombatant.tempHp || 0
          );
        }
        if (targetCombatant.encounterCombatantId && updates.conditions !== undefined) {
          await updateNpcInstanceConditionsDB(
            targetCombatant.encounterCombatantId,
            updates.conditions
          );
        }
        if (targetCombatant.encounterCombatantId && updates.tempAcModifier !== undefined) {
          await updateNpcInstanceAcModDB(
            targetCombatant.encounterCombatantId,
            updates.tempAcModifier
          );
        }
      }

      setSyncingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      updateState(() => snapshot);
      toast.error('Failed to save changes. Please try again.');
      setSyncingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      throw error;
    }

    if (updates.conditions !== undefined) {
      const { addCombatEvent,
        activeCombatLog, combatState } =
        useDashboardStore.getState()

      if (activeCombatLog) {
        const activeTurnCombatant =
          combatState.combatants.find(
            x => x.id ===
              combatState.activeTurnId)

        // Find the current combatant
        // to compare old vs new conditions
        const currentCombatant =
          combatState.combatants.find(
            x => x.id === id)

        const oldConditions = (
          currentCombatant?.conditions || ''
        ).split(',')
          .map(s => s.trim())
          .filter(Boolean)

        const newConditions =
          updates.conditions.split(',')
            .map(s => s.trim())
            .filter(Boolean)

        // Log newly added conditions
        newConditions
          .filter(c =>
            !oldConditions.includes(c))
          .forEach(condition => {
            addCombatEvent({
              round:
                activeCombatLog.currentRound,
              type: 'condition-applied',
              actorId:
                activeTurnCombatant?.id
                ?? null,
              actorName:
                activeTurnCombatant?.name
                ?? null,
              targetId: id,
              targetName:
                currentCombatant?.name
                ?? null,
              condition,
              isManualAdjustment: false,
            })
          })

        // Log removed conditions
        oldConditions
          .filter(c =>
            !newConditions.includes(c))
          .forEach(condition => {
            addCombatEvent({
              round:
                activeCombatLog.currentRound,
              type: 'condition-removed',
              actorId:
                activeTurnCombatant?.id
                ?? null,
              actorName:
                activeTurnCombatant?.name
                ?? null,
              targetId: id,
              targetName:
                currentCombatant?.name
                ?? null,
              condition,
              isManualAdjustment: false,
            })
          })
      }
    }
  };

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

        const total = Math.max(1, d20Roll + dexMod);
        
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
      ).catch(err =>
        console.error(
          '[CombatLog] Failed to write log:',
          err
        )
      )
    }

    clearCombatLog()
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
    )

    addCombatEvent({
      round: 1,
      type: 'combat-start',
      actorId: null,
      actorName: null,
      targetId: null,
      targetName: null,
      isManualAdjustment: false,
    })
  }, [fireInitiativeEvent]);

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
    }

    const currentIndex = combatants.findIndex(
      c => c.id === currentState.combatState.activeTurnId
    );
    const nextIndex =
      currentIndex + 1 >= combatants.length ? 0 : currentIndex + 1;

    if (currentIndex !== -1 && nextIndex === 0) {
      nextRound += 1;
    }

    if (currentIndex !== -1 && nextIndex === 0) {
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

    const nextActiveId = combatants[nextIndex].id;

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
    handleCallInitiative,
    nextTurn,
    handleConcentrationPrompt,
    handleSelectCaster,
    concentrationPrompt,
    setConcentrationPrompt
  };
}
