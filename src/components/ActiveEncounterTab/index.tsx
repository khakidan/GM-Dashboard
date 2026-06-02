import { CONCENTRATION_EFFECTS, buildConditionSummary } from '../../lib/conditions';
import { OVERLAY_CLEAR_BUFFER_MS } from '../../lib/constants';
import { OVERLAY_DURATIONS } from '../../lib/constants';
import React, { useState, useEffect } from 'react';
import { useAppState, getSnapshot } from '../../hooks/useAppState';
import { toast } from 'sonner';
import { getExpiredConditions } from '../../lib/combatLogic';
import { Skull, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Combatant, DamageType, EncounterCombatant } from '../../types';
import { addNpcDB, addEncounterCombatantDB, updateInitiativeDB, updateDeathSavesDB, updateEncounterStateDB } from '../../services/dbOperations';
;
;
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
import { useInitiativeEvent } from '../../hooks/useOverlayEvents';
import { useDeathSaves } from '../../hooks/useDeathSaves';

export function ActiveEncounterTab({ onBack }: { onBack: () => void }) {
  const { state, updateState } = useAppState();
  const encounter = state.encounters.find(e => e.id === state.combatState.activeEncounterId);

  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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
    fireDeathEvent,
    rollInitForNPCs,
    resetCombat,
    handleCallInitiative,
    nextTurn,
    handleConcentrationPrompt,
    handleSelectCaster,
    concentrationPrompt,
    setConcentrationPrompt
  } = useCombatSync();

  const {
    damageInputs,
    setDamageInputs,
    healInputs,
    setHealInputs,
    handleHealthChange
  } = useHealthChange(syncingIds, updateCombatant);

  const { recordDeathSave, getDeathSaveReminder } = useDeathSaves();

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
    } catch (error: any) {
      // 4a. Roll back to snapshot on failure
      updateState(() => {
        const snap = getSnapshot();
        return snap;
      });
      
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
    } catch (error: any) {
      // 4a. Roll back to snapshot on failure
      updateState(() => {
        const snap = getSnapshot();
        return snap;
      });
      
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
