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

import { CombatHeader } from './CombatHeader';
import { CombatantCard } from './CombatantCard';
import { CombatSidebar } from './CombatSidebar';
import { MultiTargetActionBar } from './MultiTargetActionBar';
import { useCombatSync } from './hooks/useCombatSync';
import { useHealthChange } from './hooks/useHealthChange';
import { CasterAttributionDialog } from './CasterAttributionDialog';

export function ActiveEncounterTab({ onBack }: { onBack: () => void }) {
  const { state, updateState } = useAppState();
  const encounter = state.encounters.find(e => e.id === state.combatState.activeEncounterId);

  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [concentrationPrompt, setConcentrationPrompt] = useState<{
    effectName: string;
    targetName: string;
  } | null>(null);

  // Keyboard Shortcuts
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

      switch (event.key.toLowerCase()) {
        case 'n':
          nextTurn();
          break;
        case 'r':
          rollInitForNPCs();
          break;
        case 't':
          setIsToolsModalOpen(prev => !prev);
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state]); // Re-attach listener if combat state changes (nextTurn/rollInitForNPCs rely on state)

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
    } else {
      fails += 1;
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
      return {
        ...prev,
        combatState: {
          ...prev.combatState,
          activeTurnId: prev.combatState.combatants[nextIndex].id,
          round: nextRound,
        },
      };
    });
    
    updateEncounterStateDB(state.combatState.activeEncounterId ?? '', nextRound, combatants[nextIndex].id).catch(err => {
      console.warn("Failed to write updated turn state to sheet", err);
    });

    const newlyActiveCombatant = combatants.length > 0 ? combatants[nextIndex] : null;
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
            onOpenTools={() => setIsToolsModalOpen(true)}
            onRollNpcInit={rollInitForNPCs}
            onResetCombat={resetCombat}
            onNextTurn={nextTurn}
            onToggleMultiTargetMode={toggleMultiTargetMode}
            onBack={onBack}
            onCallInitiative={handleCallInitiative}
            initiativeEvent={!!state.combatState.initiativeEvent}
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
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

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

      <CombatSidebar
        isOpen={isToolsModalOpen}
        onClose={() => setIsToolsModalOpen(false)}
        npcs={state.npcs}
        characters={state.characters}
        onAddPreset={handleAddPreset}
        onAddNpc={handleAddNpc}
      />

      <CasterAttributionDialog
        isOpen={!!concentrationPrompt}
        effectName={concentrationPrompt?.effectName || ''}
        targetName={concentrationPrompt?.targetName || ''}
        combatants={state.combatState.combatants}
        onSelect={handleSelectCaster}
        onDismiss={() => setConcentrationPrompt(null)}
      />
    </div>
  );
}
