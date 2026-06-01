import React, { useState, useEffect } from 'react';
import { useAppState, getSnapshot } from '../../hooks/useAppState';
import { toast } from 'sonner';
import { getExpiredConditions } from '../../lib/combatLogic';
import { Skull, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Combatant, DamageType, EncounterCombatant } from '../../types';
import { addNpcDB, addEncounterCombatantDB, updateInitiativeDB, updateDeathSavesDB, updateEncounterStateDB } from '../../services/dbOperations';
import { CONCENTRATION_EFFECTS } from '../../lib/irvOptions';
import { buildConditionSummary } from '../../lib/conditionDefinitions';
import { playTurnStartSound, playDeathSaveFailSound, playDeathSaveSuccessSound } from '../../lib/audioEngine';

import { CombatHeader } from './CombatHeader';
import { CombatantCard } from './CombatantCard';
import { CombatSidebar } from './CombatSidebar';
import { MultiTargetActionBar } from './MultiTargetActionBar';
import { MultiTargetActionPanel } from './MultiTargetActionPanel';
import { useCombatSync } from './hooks/useCombatSync';
import { useHealthChange } from './hooks/useHealthChange';
import { CasterAttributionDialog } from './CasterAttributionDialog';
import { DiceRoller } from '../DiceRoller';

export function ActiveEncounterTab({ onBack }: { onBack: () => void }) {
  const { state, updateState } = useAppState();
  const encounter = state.encounters.find(e => e.id === state.combatState.activeEncounterId);

  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [concentrationPrompt, setConcentrationPrompt] = useState<{
    effectName: string;
    targetName: string;
  } | null>(null);

  const [hpMode, setHpMode] = useState<'damage' | 'heal'>('damage');
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);

  // Keyboard Shortcuts moved lower down for complete variable accessibility

  // Multi-target Selection State
  const [isMultiTargetMode, setIsMultiTargetMode] = useState(false);
  const [selectedCombatantIds, setSelectedCombatantIds] = useState<Set<string>>(new Set());

  const {
    syncingIds,
    globalError,
    handleError,
    removeCombatant,
    updateCombatant,
    fireDeathEvent
  } = useCombatSync();

  const {
    damageInputs,
    setDamageInputs,
    healInputs,
    setHealInputs,
    handleHealthChange
  } = useHealthChange(syncingIds, updateCombatant);

  const handleConcentrationPrompt = (effectName: string, targetName: string) => {
    toast('Concentration required', {
      description: `${effectName} requires concentration. Select the caster to apply the Concentrating condition — or dismiss if already applied.`,
      duration: 10000,
      action: {
        label: 'Select caster',
        onClick: () => {
          setConcentrationPrompt({
            effectName,
            targetName,
          });
        }
      }
    });
  };

  const handleSelectCaster = (casterId: string) => {
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
      const confirmProceed = window.confirm(
        `${caster.name} is already concentrating on another effect. Applying a new concentration spell will end the previous one. Proceed?`
      );
      if (confirmProceed) {
        executeCasterUpdate();
      }
    } else {
      executeCasterUpdate();
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleMultiTargetMode = () => {
    setIsMultiTargetMode(prev => {
      if (prev) {
        setSelectedCombatantIds(new Set());
      }
      return !prev;
    });
  };

  const toggleCombatantSelection = (id: string) => {
    setSelectedCombatantIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const recordDeathSave = async (combatantId: string, result: 'success' | 'fail') => {
    const currentState = getSnapshot();
    const combatant = currentState.combatState.combatants.find(c => c.id === combatantId);
    if (!combatant || combatant.type !== 'pc' || !combatant.characterId) return;

    let fails = combatant.deathSavesFails || 0;
    let successes = combatant.deathSavesSuccesses || 0;

    if (result === 'success') {
      successes += 1;
      playDeathSaveSuccessSound();
    } else {
      fails += 1;
      playDeathSaveFailSound();
    }

    try {
      await updateDeathSavesDB(combatant.characterId, fails, successes);

      if (fails >= 3) {
        const conditionsList = (combatant.conditions || '').split(',').map(s => s.trim()).filter(Boolean);
        const updatedConditions = conditionsList.filter(cond => cond.toLowerCase() !== 'unconscious').join(', ');
        
        updateCombatant(combatantId, {
          deathSavesFails: fails,
          deathSavesSuccesses: successes,
          conditions: updatedConditions,
          statusId: 3, // Deceased
          isStable: false
        });
        fireDeathEvent(combatant.name);
        toast(`${combatant.name} has died. Update their status on the Party Roster.`);
      } else if (successes >= 3) {
        updateCombatant(combatantId, {
          deathSavesFails: 0,
          deathSavesSuccesses: 0,
          isStable: true
        });
        toast(`${combatant.name} is stable — no further death saves required until they take damage again.`);
      } else {
        updateCombatant(combatantId, {
          deathSavesFails: fails,
          deathSavesSuccesses: successes,
          isStable: false
        });
        toast(`Death save recorded for ${combatant.name}: ${result === 'success' ? 'Success' : 'Failure'}. (${successes}/3 Successes, ${fails}/3 Fails)`);
      }
    } catch (err) {
      console.error('Failed to update death saves:', err);
      toast.error(`Failed to record death save for ${combatant.name}`);
    }
  };

  const handleApplyMultiDamage = (amount: number, type: DamageType) => {
    const selectedList = state.combatState.combatants.filter(c => selectedCombatantIds.has(c.id));
    if (selectedList.length === 0) return;

    selectedList.forEach(c => {
      handleHealthChange(c.id, c, true, type, amount);
    });

    toast.success(`Damage applied to ${selectedList.length} targets`);
  };

  const handleApplyMultiHealing = (amount: number) => {
    const selectedList = state.combatState.combatants.filter(c => selectedCombatantIds.has(c.id));
    if (selectedList.length === 0) return;

    selectedList.forEach(c => {
      handleHealthChange(c.id, c, false, null, amount);
    });

    toast.success(`Healing applied to ${selectedList.length} targets`);
  };

  const handleApplyMultiCondition = (condition: string) => {
    const selectedList = state.combatState.combatants.filter(c => selectedCombatantIds.has(c.id));
    if (selectedList.length === 0) return;

    selectedList.forEach(c => {
      const currentConditions = c.conditions || '';
      const list = currentConditions.split(',').map(s => s.trim()).filter(Boolean);
      if (!list.includes(condition)) {
        const next = [...list, condition].join(', ');
        updateCombatant(c.id, { conditions: next });
      }
    });

    toast.success(`${condition} applied to ${selectedList.length} targets`);
  };

  const handleAddPreset = async (type: 'pc' | 'npc', selectedPreset: string, presetQuantity: number) => {
    const previousState = state;
    try {
      const actualQty = type === 'pc' ? 1 : presetQuantity;
      const tempEcIds = Array.from({ length: actualQty }, (_, idx) => `temp-ec-${idx}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

      let newCombatants: Combatant[] = [];
      let newEcObjects: EncounterCombatant[] = [];

      if (type === 'pc') {
        const c = state.characters.find(char => char.id === selectedPreset);
        if (c) {
          newCombatants.push({
            id: `combat-pc-${c.id}`,
            encounterCombatantId: tempEcIds[0],
            characterId: c.id,
            name: c.characterName,
            type: 'pc',
            initiative: 0,
            ac: c.ac,
            maxHp: c.maxHp,
            currentHp: c.currentHp,
            tempHp: c.tempHp,
            conditions: c.conditions,
            notes: c.notes,
            passivePerception: c.passivePerception,
            reactionUsed: false,
          });
          newEcObjects.push({
            id: tempEcIds[0],
            encounterId: encounter?.id || '',
            playerId: selectedPreset,
            npcId: null,
            quantity: 1,
            npcCurrentHp: -1,
            npcTempHp: 0,
          });
        }
      } else {
        const npcTemplate = state.npcs.find(n => n.id === selectedPreset);
        if (npcTemplate) {
          for (let i = 0; i < actualQty; i++) {
            const combatantId = `combat-npc-${npcTemplate.id}-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            newCombatants.push({
              id: combatantId,
              encounterCombatantId: tempEcIds[i],
              name: `${npcTemplate.name}${actualQty > 1 ? ` ${i + 1}` : ''}`,
              type: 'npc',
              initiative: 0,
              ac: npcTemplate.ac,
              maxHp: npcTemplate.maxHp,
              currentHp: npcTemplate.currentHp,
              tempHp: npcTemplate.tempHp,
              conditions: npcTemplate.conditions,
              notes: npcTemplate.notes,
              passivePerception: 10,
              resistances: npcTemplate.resistances,
              immunities: npcTemplate.immunities,
              vulnerabilities: npcTemplate.vulnerabilities,
              reactionUsed: false,
              legendaryActions: 
                npcTemplate.legendaryActions && npcTemplate.legendaryActions > 0
                ? { 
                    max: npcTemplate.legendaryActions, 
                    remaining: npcTemplate.legendaryActions 
                  }
                : undefined,
              legendaryResistances: 
                npcTemplate.legendaryResistances && npcTemplate.legendaryResistances > 0
                ? { 
                    max: npcTemplate.legendaryResistances, 
                    remaining: npcTemplate.legendaryResistances 
                  }
                : undefined,
              rechargeAbilities: 
                npcTemplate.rechargeAbilities?.length
                ? npcTemplate.rechargeAbilities.map(a => ({
                    name: a.name,
                    rechargeOn: a.rechargeOn,
                    isCharged: true,
                  }))
                : undefined,
            });
            newEcObjects.push({
              id: tempEcIds[i],
              encounterId: encounter?.id || '',
              playerId: null,
              npcId: selectedPreset,
              quantity: 1,
              npcCurrentHp: -1,
              npcTempHp: 0,
            });
          }
        }
      }

      updateState(prev => ({
        ...prev,
        encounterCombatants: [
          ...prev.encounterCombatants,
          ...newEcObjects,
        ],
        combatState: {
          ...prev.combatState,
          combatants: [...prev.combatState.combatants, ...newCombatants],
        },
      }));

      const ecResList = await addEncounterCombatantDB(
        encounter?.id || '',
        type === 'pc' ? selectedPreset : null,
        type === 'npc' ? selectedPreset : null,
        presetQuantity
      );

      updateState(prev => {
        const nextCombatants = prev.combatState.combatants.map(c => {
          const tempIdx = tempEcIds.indexOf(c.encounterCombatantId || '');
          if (tempIdx !== -1 && ecResList[tempIdx]) {
            return { ...c, encounterCombatantId: ecResList[tempIdx].id };
          }
          return c;
        });

        const nextEc = prev.encounterCombatants.map(ec => {
          const tempIdx = tempEcIds.indexOf(ec.id);
          if (tempIdx !== -1 && ecResList[tempIdx]) {
            return { 
              ...ec, 
              id: ecResList[tempIdx].id,
              npcCurrentHp: ecResList[tempIdx].npcCurrentHp ?? ec.npcCurrentHp,
              npcTempHp: ecResList[tempIdx].npcTempHp ?? ec.npcTempHp
            };
          }
          return ec;
        });

        return {
          ...prev,
          encounterCombatants: nextEc,
          combatState: {
            ...prev.combatState,
            combatants: nextCombatants,
          }
        };
      });
    } catch (err) {
      console.warn('Sync failed', err);
      updateState(previousState);
      handleError(err, 'Failed to sync updates—retrying...');
    }
  };

  const handleAddNpc = async (
    npcName: string, 
    npcHp: number | '', 
    npcAc: number | '', 
    npcNotes: string,
    resistances: string,
    immunities: string,
    vulnerabilities: string
  ) => {
    const previousState = state;
    try {
      const nextIdStr = `temp-npc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const nextEcId = `temp-ec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const newNpcCombatant: Combatant = {
        id: `combat-npc-${nextIdStr}-0-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        encounterCombatantId: nextEcId.toString(),
        name: npcName,
        type: 'npc',
        ac: npcAc === '' ? 10 : npcAc,
        maxHp: npcHp as number,
        currentHp: npcHp as number,
        passivePerception: 10,
        initiative: 0,
        notes: npcNotes,
        resistances: resistances,
        immunities: immunities,
        vulnerabilities: vulnerabilities,
        reactionUsed: false,
      };

      updateState(prev => ({
        ...prev,
        npcs: [
          ...prev.npcs,
          {
            id: nextIdStr,
            name: npcName,
            ac: npcAc === '' ? 10 : npcAc,
            maxHp: npcHp as number,
            tempHp: 0,
            currentHp: npcHp as number,
            conditions: '',
            notes: npcNotes,
            resistances: resistances,
            immunities: immunities,
            vulnerabilities: vulnerabilities,
          },
        ],
        encounterCombatants: [
          ...prev.encounterCombatants,
          {
            id: nextEcId.toString(),
            encounterId: encounter?.id || '',
            playerId: null,
            npcId: nextIdStr,
            quantity: 1,
            npcCurrentHp: -1,
            npcTempHp: 0,
          },
        ],
        combatState: {
          ...prev.combatState,
          combatants: [...prev.combatState.combatants, newNpcCombatant].sort(
            (a, b) => b.initiative - a.initiative
          ),
        },
      }));

      const newNpc = await addNpcDB(
        npcName, 
        npcHp as number, 
        npcAc === '' ? 10 : npcAc, 
        npcNotes, 
        resistances, 
        immunities, 
        vulnerabilities
      );
      const newEcArray = await addEncounterCombatantDB(encounter?.id || '', null, newNpc.id, 1);
      const newEc = newEcArray[0];

      updateState(prev => ({
        ...prev,
        npcs: prev.npcs.map(n => (n.id === nextIdStr ? { ...n, id: newNpc.id } : n)),
        encounterCombatants: prev.encounterCombatants.map(ec =>
          ec.id === nextEcId ? { ...ec, id: newEc.id, npcId: newNpc.id } : ec
        ),
        combatState: {
          ...prev.combatState,
          combatants: prev.combatState.combatants.map(c =>
            c.id === newNpcCombatant.id ? { ...c, encounterCombatantId: newEc.id } : c
          ),
        },
      }));
    } catch (err) {
      console.error('Sync failed', err);
      updateState(previousState);
      handleError(err, 'Failed to sync updates—retrying...');
    }
  };

  const rollInitForNPCs = () => {
    updateState(prev => {
      const nextCombatants = prev.combatState.combatants
        .map(c => (c.type === 'npc' ? { ...c, initiative: Math.floor(Math.random() * 20) + 1 } : c))
        .sort((a, b) => b.initiative - a.initiative);

      return {
        ...prev,
        combatState: { ...prev.combatState, combatants: nextCombatants },
      };
    });
  };

  const nextTurn = () => {
    let nextRound = state.combatState.round;
    const combatants = state.combatState.combatants;
    if (combatants.length === 0) return;

    const currentIndex = combatants.findIndex(
      c => c.id === state.combatState.activeTurnId
    );
    const nextIndex =
      currentIndex + 1 >= combatants.length ? 0 : currentIndex + 1;

    if (currentIndex !== -1 && nextIndex === 0) {
      nextRound += 1;
    }

    updateState(prev => {
      if (prev.combatState.combatants.length === 0) return prev;
      const nextActiveId = prev.combatState.combatants[nextIndex].id;
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

    playTurnStartSound();
    
    updateEncounterStateDB(state.combatState.activeEncounterId ?? '', nextRound, combatants[nextIndex].id).catch(err => {
      console.warn("Failed to write updated turn state to sheet", err);
    });

    const newlyActiveCombatant = combatants.length > 0 ? combatants[nextIndex] : null;

    if (newlyActiveCombatant && newlyActiveCombatant.legendaryActions) {
      toast.success(`${newlyActiveCombatant.name}'s legendary actions are restored.`);
      toast(`${newlyActiveCombatant.name} regains all legendary actions.`);
    }

    if (newlyActiveCombatant) {
      const activeConditionsList = newlyActiveCombatant.conditions
        ?.split(',')
        .map(s => s.trim())
        .filter(Boolean) || [];

      const isPcUnconscious = newlyActiveCombatant.type === 'pc' && 
        activeConditionsList.some(cond => cond.toLowerCase() === 'unconscious');

      if (isPcUnconscious && !newlyActiveCombatant.isStable && (newlyActiveCombatant.deathSavesSuccesses || 0) < 3) {
        const fails = newlyActiveCombatant.deathSavesFails || 0;
        const successes = newlyActiveCombatant.deathSavesSuccesses || 0;
        const toastId = `death-save-${newlyActiveCombatant.id}`;

        toast(
          <div className="flex flex-col gap-1.5" id={`ds-prompt-${newlyActiveCombatant.id}`}>
            <div className="font-semibold text-sm text-neutral-900">
              {newlyActiveCombatant.name} is unconscious — Death Saving Throw
            </div>
            <div className="text-xs text-neutral-500">
              Fails: {fails}/3  Successes: {successes}/3. Roll a D20. On 10 or higher: success. On 1: two failures.
            </div>
            <div className="flex gap-2 mt-1">
              <button
                id={`ds-success-${newlyActiveCombatant.id}`}
                onClick={() => {
                  recordDeathSave(newlyActiveCombatant.id, 'success');
                  toast.dismiss(toastId);
                }}
                className="px-2.5 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 cursor-pointer pointer-events-auto"
              >
                Success
              </button>
              <button
                id={`ds-fail-${newlyActiveCombatant.id}`}
                onClick={() => {
                  recordDeathSave(newlyActiveCombatant.id, 'fail');
                  toast.dismiss(toastId);
                }}
                className="px-2.5 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 cursor-pointer pointer-events-auto"
              >
                Failure
              </button>
            </div>
          </div>,
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
            const currentState = getSnapshot();
            const target = currentState.combatState.combatants.find(c => c.id === combatantId);
            if (!target) return;

            const conditionsStr = target.conditions || '';
            const nextConditionsList = conditionsStr
              .split(',')
              .map(s => s.trim())
              .filter(s => s.toLowerCase() !== conditionName.toLowerCase() && s !== '');
              
            // Concentration auto-remove logic
            const conEffectsArray = Array.from(CONCENTRATION_EFFECTS);
            const remainingConEffects = nextConditionsList.filter(s => 
              conEffectsArray.includes(s.toLowerCase())
            );
            
            let finalConditionsList = nextConditionsList;
            if (remainingConEffects.length === 0) {
              finalConditionsList = nextConditionsList.filter(s => s.toLowerCase() !== 'concentrating');
            }

            const nextTimers = { ...(target.conditionTimers || {}) };
            delete nextTimers[conditionName];

            updateCombatant(combatantId, {
              conditions: finalConditionsList.join(', '),
              conditionTimers: nextTimers,
            });
          },
        },
      });
    });
  };

  const resetCombat = () => {
    updateState(prev => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        activeTurnId: null,
        round: 1,
        combatants: prev.combatState.combatants.map(c => ({ ...c, initiative: 0 })),
      },
    }));

    // BUG 1 Fix: Sync zeroed initiatives to the sheet
    const latestCombatants = state.combatState.combatants;
    latestCombatants.forEach(c => {
      if (c.encounterCombatantId) {
        updateInitiativeDB(c.encounterCombatantId, 0).catch(err => {
          console.error(`Failed to reset initiative for combatant ${c.id}`, err);
        });
      }
    });
  };

  const handleCallInitiative = () => {
    updateState(prev => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        initiativeEvent: true,
      }
    }));

    setTimeout(() => {
      updateState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          initiativeEvent: false,
        }
      }));
    }, 8500);

    toast('Initiative called!', {
      description: 'Players can see the overlay on the Player View.',
      duration: 3000,
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedCombatantIds.size === 0) return;

    const count = selectedCombatantIds.size;
    const confirm = window.confirm(`Remove ${count} combatants from this encounter? This cannot be undone.`);
    if (!confirm) return;

    const idsToDelete = Array.from(selectedCombatantIds);
    const currentState = getSnapshot();
    const activeId = currentState.combatState.activeTurnId;

    // If active turn is being deleted, advance turn to the first surviving combatant BEFORE deletion
    if (activeId && selectedCombatantIds.has(activeId)) {
      const combatants = currentState.combatState.combatants;
      const currentIndex = combatants.findIndex(c => c.id === activeId);
      
      // Find the next surviving index
      let nextIndex = (currentIndex + 1) % combatants.length;
      let found = false;
      let attempts = 0;
      while (attempts < combatants.length) {
        if (!selectedCombatantIds.has(combatants[nextIndex].id)) {
          found = true;
          break;
        }
        nextIndex = (nextIndex + 1) % combatants.length;
        attempts++;
      }

      if (found) {
        // We simulate a "nextTurn" but jumping to the first survivor
        const nextActiveId = combatants[nextIndex].id;
        updateState(prev => ({
          ...prev,
          combatState: {
            ...prev.combatState,
            activeTurnId: nextActiveId,
          }
        }));
      } else {
        // No survivors!
        updateState(prev => ({
          ...prev,
          combatState: {
            ...prev.combatState,
            activeTurnId: null,
          }
        }));
      }
    }

    // Perform deletions
    for (const id of idsToDelete) {
      await removeCombatant(id);
    }

    setIsMultiTargetMode(false);
    setSelectedCombatantIds(new Set());
    toast.success(`${count} combatants removed.`);
  };

  // Listen for global custom commands from the Command Palette
  useEffect(() => {
    const handleNextTurn = () => {
      nextTurn();
    };
    const handleRollNpcInit = () => {
      rollInitForNPCs();
    };
    const handleCallInit = () => {
      handleCallInitiative();
    };
    const handleOpenTools = () => {
      setIsToolsModalOpen(true);
    };

    window.addEventListener('gm-cmd-next-turn', handleNextTurn);
    window.addEventListener('gm-cmd-roll-npc-init', handleRollNpcInit);
    window.addEventListener('gm-cmd-call-initiative', handleCallInit);
    window.addEventListener('gm-cmd-open-tools', handleOpenTools);

    return () => {
      window.removeEventListener('gm-cmd-next-turn', handleNextTurn);
      window.removeEventListener('gm-cmd-roll-npc-init', handleRollNpcInit);
      window.removeEventListener('gm-cmd-call-initiative', handleCallInit);
      window.removeEventListener('gm-cmd-open-tools', handleOpenTools);
    };
  }, [nextTurn, rollInitForNPCs, handleCallInitiative]);

  // Integrated Keyboard Shortcuts Hook with complete variable accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for modifier keys or if target is an input
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName) ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      const keyLower = event.key.toLowerCase();

      // ? triggers toggle of keyboard shortcuts cheat sheet overlay
      if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
        event.preventDefault();
        setIsCheatSheetOpen(prev => !prev);
        return;
      }

      switch (keyLower) {
        case 'n':
          nextTurn();
          break;
        case 'r':
          rollInitForNPCs();
          break;
        case 't':
          setIsToolsModalOpen(prev => !prev);
          break;
        case 's':
          toggleMultiTargetMode();
          break;
        case 'b':
          if (typeof window !== 'undefined' && window.open) {
            window.open('/#/player-view', '_blank');
          }
          break;
        case 'c':
          if (!state.combatState.initiativeEvent) {
            handleCallInitiative();
          }
          break;
        case 'h':
          setHpMode('heal');
          if (state.combatState.activeTurnId) {
            setTimeout(() => {
              const el = document.getElementById(`heal-input-${state.combatState.activeTurnId}`);
              if (el) {
                (el as HTMLInputElement).focus();
                (el as HTMLInputElement).select();
              }
            }, 50);
          }
          break;
        case 'd':
          setHpMode('damage');
          if (state.combatState.activeTurnId) {
            setTimeout(() => {
              const el = document.getElementById(`damage-input-${state.combatState.activeTurnId}`);
              if (el) {
                (el as HTMLInputElement).focus();
                (el as HTMLInputElement).select();
              }
            }, 50);
          }
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9': {
          const index = parseInt(event.key, 10) - 1;
          const combatantsList = state.combatState.combatants;
          if (combatantsList && index < combatantsList.length) {
            const targetCombatant = combatantsList[index];
            if (targetCombatant) {
              setExpandedIds(prev => {
                const copy = new Set(prev);
                copy.add(targetCombatant.id);
                return copy;
              });
              setTimeout(() => {
                const cardEl = document.getElementById(`combatant-card-${targetCombatant.id}`);
                if (cardEl) {
                  cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
              }, 50);
            }
          }
          break;
        }
        case 'escape': {
          setExpandedIds(new Set());
          setIsToolsModalOpen(false);
          setIsCheatSheetOpen(false);
          break;
        }
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    state.combatState.combatants,
    state.combatState.activeTurnId,
    state.combatState.initiativeEvent,
    hpMode,
    isCheatSheetOpen,
    nextTurn,
    rollInitForNPCs,
    toggleMultiTargetMode,
    handleCallInitiative
  ]);

  return (
    <div className="flex flex-col gap-8 relative items-start">
      <div className={cn('space-y-6 flex flex-col transition-all duration-300 w-full')}>
        {globalError && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-800 text-sm shadow-sm transition-all absolute top-2 right-2 z-50">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{globalError}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-[#e5e1d8] overflow-hidden text-sm md:text-base flex-1 flex flex-col w-full">
          <CombatHeader
            encounter={encounter}
            round={state.combatState.round}
            isMultiTargetMode={isMultiTargetMode}
            selectedCount={selectedCombatantIds.size}
            onOpenTools={() => setIsToolsModalOpen(true)}
            onRollNpcInit={rollInitForNPCs}
            onResetCombat={resetCombat}
            onNextTurn={nextTurn}
            onToggleMultiTargetMode={toggleMultiTargetMode}
            onDeleteSelected={handleDeleteSelected}
            onCancelSelection={() => {
              setSelectedCombatantIds(new Set());
              setIsMultiTargetMode(false);
            }}
            onBack={onBack}
            onCallInitiative={handleCallInitiative}
            initiativeEvent={!!state.combatState.initiativeEvent}
            onOpenCheatSheet={() => setIsCheatSheetOpen(true)}
            onApplyDamage={handleApplyMultiDamage}
            onApplyHealing={handleApplyMultiHealing}
            onApplyCondition={handleApplyMultiCondition}
          />

          <div className="flex-1 bg-white w-full p-6">
            <div className="grid grid-cols-1 gap-4">
              {state.combatState.combatants.length === 0 ? (
                <div className="col-span-full py-20 text-center flex flex-col items-center justify-center">
                  <Skull className="w-12 h-12 text-[#5a5a40] opacity-20 mb-4" />
                  <p className="text-lg font-serif font-bold text-[#2c2c26]">No combatants in tracker</p>
                  <p className="text-sm text-[#5a5a40] italic">Add players or NPCs from the tools menu to begin.</p>
                </div>
              ) : (
                state.combatState.combatants.map(c => (
                  <CombatantCard
                    key={c.id}
                    c={c}
                    isActive={c.id === state.combatState.activeTurnId}
                    isExpanded={expandedIds.has(c.id)}
                    isSyncing={syncingIds.has(c.id)}
                    isSelectable={isMultiTargetMode}
                    isSelected={selectedCombatantIds.has(c.id)}
                    damageInput={damageInputs[c.id] || ''}
                    healInput={healInputs[c.id] || ''}
                    currentRound={state.combatState.round}
                    onDamageInputChange={(val) => setDamageInputs(prev => ({ ...prev, [c.id]: val }))}
                    onHealInputChange={(val) => setHealInputs(prev => ({ ...prev, [c.id]: val }))}
                    onHealthSubmit={(isDamage, damageType) => handleHealthChange(c.id, c, isDamage, damageType)}
                    onToggleExpand={() => toggleExpand(c.id)}
                    onToggleSelect={toggleCombatantSelection}
                    onUpdateCombatant={(updates) => updateCombatant(c.id, updates)}
                    onRemoveCombatant={() => removeCombatant(c.id)}
                    onConcentrationPrompt={handleConcentrationPrompt}
                    hpMode={hpMode}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 
        MultiTargetActionBar commented out; its functionality has moved to the persistent MultiTargetActionPanel banner directly below CombatHeader 
        <MultiTargetActionBar
          selectedCount={selectedCombatantIds.size}
          onApplyDamage={handleApplyMultiDamage}
          onApplyHealing={handleApplyMultiHealing}
          onApplyCondition={handleApplyMultiCondition}
          onClearSelection={() => {
            setSelectedCombatantIds(new Set());
            setIsMultiTargetMode(false);
          }}
        />
      */}

      <CombatSidebar
        isOpen={isToolsModalOpen}
        onClose={() => setIsToolsModalOpen(false)}
        npcs={state.npcs}
        characters={state.characters}
        onAddPreset={handleAddPreset}
        onAddNpc={handleAddNpc}
        combatants={state.combatState.combatants}
        onUpdateCombatant={updateCombatant}
      />

      <CasterAttributionDialog
        isOpen={!!concentrationPrompt}
        effectName={concentrationPrompt?.effectName || ''}
        targetName={concentrationPrompt?.targetName || ''}
        combatants={state.combatState.combatants}
        onSelect={handleSelectCaster}
        onDismiss={() => setConcentrationPrompt(null)}
      />

      {isCheatSheetOpen && (
        <div 
          id="shortcut-cheat-sheet"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsCheatSheetOpen(false)}
        >
          <div 
            className="bg-[#fdfaf5] w-full max-w-lg rounded-2xl shadow-2xl border border-[#e5e1d8] p-6 text-stone-900"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-[#e5e1d8] pb-4 mb-4">
              <span className="p-1.5 bg-[#faf9f6] rounded-lg border border-[#e5e1d8] text-[#c5b358]">
                ❓
              </span>
              <div>
                <h3 className="text-lg font-bold text-[#2c2c26] font-serif uppercase tracking-wider">Keyboard Shortcuts</h3>
                <p className="text-xs text-[#5a5a40]">GM Dashboard quick references</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <h4 className="font-serif font-bold text-sm text-[#c5b358] border-b border-[#f5f5f0] pb-1 uppercase tracking-wider mb-2">Combat</h4>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#faf9f6]/80 border border-[#e5e1d8] px-2 py-0.5 rounded text-[#2c2c26]">N</span>
                    <span className="text-[#5a5a40] text-xs">Next turn</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#faf9f6]/80 border border-[#e5e1d8] px-2 py-0.5 rounded text-[#2c2c26]">R</span>
                    <span className="text-[#5a5a40] text-xs">Roll NPC initiative</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#faf9f6]/80 border border-[#e5e1d8] px-2 py-0.5 rounded text-[#2c2c26]">S</span>
                    <span className="text-[#5a5a40] text-xs">Toggle select mode</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#faf9f6]/80 border border-[#e5e1d8] px-2 py-0.5 rounded text-[#2c2c26]">B</span>
                    <span className="text-[#5a5a40] text-xs">Broadcast player view</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#faf9f6]/80 border border-[#e5e1d8] px-2 py-0.5 rounded text-[#2c2c26]">C</span>
                    <span className="text-[#5a5a40] text-xs">Call for initiative</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#faf9f6]/80 border border-[#e5e1d8] px-2 py-0.5 rounded text-[#2c2c26]">1-9</span>
                    <span className="text-[#5a5a40] text-xs">Select combatant</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#faf9f6]/80 border border-[#e5e1d8] px-2 py-0.5 rounded text-[#2c2c26]">Esc</span>
                    <span className="text-[#5a5a40] text-xs">Deselect all</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-serif font-bold text-sm text-[#c5b358] border-b border-[#f5f5f0] pb-1 uppercase tracking-wider mb-2">Input</h4>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#faf9f6]/80 border border-[#e5e1d8] px-2 py-0.5 rounded text-[#2c2c26]">H</span>
                    <span className="text-[#5a5a40] text-xs">Heal mode</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#faf9f6]/80 border border-[#e5e1d8] px-2 py-0.5 rounded text-[#2c2c26]">D</span>
                    <span className="text-[#5a5a40] text-xs">Damage mode</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#faf9f6]/80 border border-[#e5e1d8] px-2 py-0.5 rounded text-[#2c2c26]">T</span>
                    <span className="text-[#5a5a40] text-xs">Open tools</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#faf9f6]/80 border border-[#e5e1d8] px-2 py-0.5 rounded text-[#2c2c26]">? / Shift+/</span>
                    <span className="text-[#5a5a40] text-xs">Show shortcuts</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#f5f5f0] flex justify-end">
              <button 
                onClick={() => setIsCheatSheetOpen(false)}
                className="px-4 py-1.5 bg-[#faf9f6] border border-[#e5e1d8] hover:border-[#c5b358] text-[#5a5a40] hover:text-[#2c2c26] text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <DiceRoller />
    </div>
  );
}
