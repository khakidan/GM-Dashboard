import React, { useState } from 'react';
import { useAppState } from '../../hooks/useAppState';
import { Skull, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Combatant } from '../../types';
import { addNpcDB, addEncounterCombatantDB } from '../../services/dbOperations';

import { CombatHeader } from './CombatHeader';
import { CombatantCard } from './CombatantCard';
import { CombatSidebar } from './CombatSidebar';
import { useCombatSync } from './hooks/useCombatSync';
import { useHealthChange } from './hooks/useHealthChange';

export function ActiveEncounterTab({ onBack }: { onBack: () => void }) {
  const { state, updateState } = useAppState();
  const encounter = state.encounters.find(e => e.id === state.combatState.activeEncounterId);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const {
    syncingIds,
    globalError,
    handleError,
    removeCombatant,
    updateCombatant
  } = useCombatSync();

  const {
    healthInputs,
    setHealthInputs,
    handleHealthChange
  } = useHealthChange(syncingIds, updateCombatant);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddPreset = async (type: 'pc' | 'npc', selectedPreset: string, presetQuantity: number) => {
    const previousState = state;
    try {
      const nextId = `temp-ec-${Date.now()}`;

      let newCombatants: Combatant[] = [];
      if (type === 'pc') {
        const c = state.characters.find(char => char.id === selectedPreset);
        if (c) {
          newCombatants.push({
            id: `combat-pc-${c.id}`,
            encounterCombatantId: nextId,
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
            sheetColHp: 'G',
            sheetColTempHp: 'F',
            sheetColCondition: 'H',
            hpSheetName: 'Characters',
            hpSheetRowIndex: c.sheetRowIndex,
          });
        }
      } else {
        const npcTemplate = state.npcs.find(n => n.id === selectedPreset);
        if (npcTemplate) {
          for (let i = 0; i < presetQuantity; i++) {
            newCombatants.push({
              id: `combat-npc-${npcTemplate.id}-${i}-${Date.now()}`,
              encounterCombatantId: nextId,
              name: `${npcTemplate.name}${presetQuantity > 1 ? ` ${i + 1}` : ''}`,
              type: 'npc',
              initiative: 0,
              ac: npcTemplate.ac,
              maxHp: npcTemplate.maxHp,
              currentHp: npcTemplate.currentHp,
              tempHp: npcTemplate.tempHp,
              conditions: npcTemplate.conditions,
              notes: npcTemplate.notes,
              passivePerception: 10,
            });
          }
        }
      }

      updateState(prev => ({
        ...prev,
        encounterCombatants: [
          ...prev.encounterCombatants,
          {
            id: nextId,
            encounterId: encounter?.id || '',
            playerId: type === 'pc' ? selectedPreset : null,
            npcId: type === 'npc' ? selectedPreset : null,
            quantity: presetQuantity,
          },
        ],
        combatState: {
          ...prev.combatState,
          combatants: [...prev.combatState.combatants, ...newCombatants],
        },
      }));

      const ecRes = await addEncounterCombatantDB(
        encounter?.id || '',
        type === 'pc' ? selectedPreset : null,
        type === 'npc' ? selectedPreset : null,
        presetQuantity
      );

      updateState(prev => ({
        ...prev,
        encounterCombatants: prev.encounterCombatants.map(ec =>
          ec.id === nextId ? { ...ec, id: ecRes.id } : ec
        ),
        combatState: {
          ...prev.combatState,
          combatants: prev.combatState.combatants.map(c =>
            c.encounterCombatantId === nextId ? { ...c, encounterCombatantId: ecRes.id } : c
          ),
        },
      }));
    } catch (err) {
      console.warn('Sync failed', err);
      updateState(previousState);
      handleError(err, 'Failed to sync updates—retrying...');
    }
  };

  const handleAddNpc = async (npcName: string, npcHp: number | '', npcAc: number | '', npcNotes: string) => {
    const previousState = state;
    try {
      const nextIdStr = `temp-npc-${Date.now()}`;
      const nextEcId = `temp-ec-${Date.now()}`;

      const newNpcCombatant: Combatant = {
        id: `combat-npc-${nextIdStr}-0-${Date.now()}`,
        encounterCombatantId: nextEcId.toString(),
        name: npcName,
        type: 'npc',
        ac: npcAc === '' ? 10 : npcAc,
        maxHp: npcHp as number,
        currentHp: npcHp as number,
        passivePerception: 10,
        initiative: 0,
        notes: npcNotes,
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
          },
        ],
        combatState: {
          ...prev.combatState,
          combatants: [...prev.combatState.combatants, newNpcCombatant].sort(
            (a, b) => b.initiative - a.initiative
          ),
        },
      }));

      const newNpc = await addNpcDB(npcName, npcHp as number, npcAc === '' ? 10 : npcAc, npcNotes);
      const newEc = await addEncounterCombatantDB(encounter?.id || '', null, newNpc.id, 1);

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
    updateState(prev => {
      if (prev.combatState.combatants.length === 0) return prev;

      const currentIndex = prev.combatState.combatants.findIndex(
        c => c.id === prev.combatState.activeTurnId
      );
      const nextIndex =
        currentIndex + 1 >= prev.combatState.combatants.length ? 0 : currentIndex + 1;

      let nextRound = prev.combatState.round;
      if (currentIndex !== -1 && nextIndex === 0) {
        nextRound += 1;
      }

      return {
        ...prev,
        combatState: {
          ...prev.combatState,
          activeTurnId: prev.combatState.combatants[nextIndex].id,
          round: nextRound,
        },
      };
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
  };

  const handleCustomAction = (customActionTargetId: string, actionType: 'poison' | 'haste') => {
    const targetIds =
      customActionTargetId === 'ALL'
        ? state.combatState.combatants.map(c => c.id)
        : customActionTargetId === 'ACTIVE'
        ? ([state.combatState.activeTurnId].filter(id => id !== null) as string[])
        : [customActionTargetId].filter(id => id !== '');

    targetIds.forEach(id => {
      const c = state.combatState.combatants.find(cm => cm.id === id);
      if (c) {
        const current = c.conditions
          ? c.conditions.split(',').map(s => s.trim()).filter(Boolean)
          : [];
        
        if (actionType === 'poison') {
          if (!current.includes('Poisoned')) {
            updateCombatant(id, { conditions: [...current, 'Poisoned'].join(', ') });
          }
          updateCombatant(id, { currentHp: Math.max(0, c.currentHp - 2) });
        } else if (actionType === 'haste') {
          if (!current.includes('Hasted')) {
            updateCombatant(id, { conditions: [...current, 'Hasted'].join(', ') });
          }
        }
      }
    });
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 relative items-start">
      <div className={cn('space-y-6 flex flex-col transition-all duration-300 w-full', isSidebarOpen ? 'xl:w-[calc(100%-384px)]' : 'xl:w-full')}>
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
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onRollNpcInit={rollInitForNPCs}
            onResetCombat={resetCombat}
            onNextTurn={nextTurn}
            onBack={onBack}
          />

          <div className="flex-1 bg-white w-full p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
              {state.combatState.combatants.length === 0 ? (
                <div className="col-span-full py-20 text-center flex flex-col items-center justify-center">
                  <Skull className="w-12 h-12 text-[#5a5a40] opacity-20 mb-4" />
                  <p className="text-lg font-serif font-bold text-[#2c2c26]">No combatants in tracker</p>
                  <p className="text-sm text-[#5a5a40] italic">Add players or NPCs from the sidebar to begin.</p>
                </div>
              ) : (
                state.combatState.combatants.map(c => (
                  <CombatantCard
                    key={c.id}
                    c={c}
                    isActive={c.id === state.combatState.activeTurnId}
                    isExpanded={expandedIds.has(c.id)}
                    isSyncing={syncingIds.has(c.id)}
                    healthInput={healthInputs[c.id] || ''}
                    onHealthInputChange={(val) => setHealthInputs(prev => ({ ...prev, [c.id]: val }))}
                    onHealthSubmit={(isDamage) => handleHealthChange(c.id, c, isDamage)}
                    onToggleExpand={() => toggleExpand(c.id)}
                    onUpdateCombatant={(updates) => updateCombatant(c.id, updates)}
                    onRemoveCombatant={() => removeCombatant(c.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <CombatSidebar
        isSidebarOpen={isSidebarOpen}
        npcs={state.npcs}
        characters={state.characters}
        combatants={state.combatState.combatants}
        activeTurnId={state.combatState.activeTurnId}
        onAddPreset={handleAddPreset}
        onAddNpc={handleAddNpc}
        onCustomAction={handleCustomAction}
      />
    </div>
  );
}
