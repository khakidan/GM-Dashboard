// src/components/ActiveEncounterTab.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';
import { Combatant, Encounter } from '../types';
import { Shield, Plus, Trash2, RefreshCcw, Eye, Info, Skull, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { updateSheetData, appendSheetData, fetchSpreadsheetMetadata, deleteSheetRow } from '../services/sheetsService';
import {
  addNpcDB,
  addEncounterCombatantDB,
  updateEncounterCombatantQuantityDB,
  deleteEncounterCombatantDB,
  updateCharacterDB,
  updateNpcDB,
} from '../services/dbOperations';
import { applyHealthChange } from '../lib/combatLogic';
import { motion, AnimatePresence } from 'motion/react';

// ─── AnimatedHpDisplay ───────────────────────────────────────────────────────

const AnimatedHpDisplay = ({
  value,
  maxHp,
  isActive,
  colorClass,
  className,
}: {
  value: number;
  maxHp: number;
  isActive: boolean;
  colorClass: string;
  className?: string;
}) => {
  const [prevHp, setPrevHp] = useState(value);
  const [animateState, setAnimateState] = useState<'idle' | 'heal' | 'damage'>('idle');

  useEffect(() => {
    // ✅ FIX: Determine animation direction first, then always update prevHp.
    // Previously setPrevHp was only called in the else branch, meaning after
    // any heal or damage the "previous" value stayed stale forever and a
    // second identical change would never animate.
    if (value > prevHp) {
      setAnimateState('heal');
    } else if (value < prevHp) {
      setAnimateState('damage');
    }

    setPrevHp(value); // always track the latest value

    const t = setTimeout(() => setAnimateState('idle'), 500);
    return () => clearTimeout(t);
  }, [value]); // ✅ prevHp removed from deps — we only care when the external value changes

  return (
    <motion.div
      animate={
        animateState === 'heal'
          ? { scale: [1, 1.2, 1], backgroundColor: ['transparent', '#86efac', 'transparent'] }
          : animateState === 'damage'
          ? { scale: [1, 0.9, 1], backgroundColor: ['transparent', '#fca5a5', 'transparent'], x: [0, -4, 4, -4, 4, 0] }
          : {}
      }
      transition={{ duration: 0.4 }}
      className={cn('rounded-md relative inline-block p-1', className)}
    >
      <div className={cn('min-w-8 text-center font-sans font-bold block', colorClass)}>
        {value}
      </div>
    </motion.div>
  );
};

// ─── InitiativeInput ─────────────────────────────────────────────────────────

const InitiativeInput = ({
  value,
  onSave,
  disabled,
}: {
  value: number;
  onSave: (val: number) => void;
  disabled?: boolean;
}) => {
  const [localValue, setLocalValue] = useState<string>(value.toString());

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setLocalValue('');
  };

  const handleBlur = () => {
    const num = parseInt(localValue);
    if (!isNaN(num)) {
      onSave(num);
    } else {
      setLocalValue(value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const num = parseInt(localValue);
      if (!isNaN(num)) {
        onSave(num);
      }
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="number"
      value={localValue}
      onFocus={handleFocus}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className="w-12 h-6 bg-[#faf9f6]/50 border border-[#e5e1d8] rounded text-center font-bold text-[#c5b358] outline-none text-[10px] focus:border-[#c5b358] focus:bg-white disabled:opacity-50"
    />
  );
};

// ─── ActiveEncounterTab ───────────────────────────────────────────────────────

export function ActiveEncounterTab({ onBack }: { onBack: () => void }) {
  const { state, updateState } = useAppState();

  const encounter = state.encounters.find(e => e.id === state.combatState.activeEncounterId);

  const [isAddingNpc, setIsAddingNpc] = useState(false);
  const [npcName, setNpcName] = useState('');
  const [npcHp, setNpcHp] = useState<number | ''>('');
  const [npcAc, setNpcAc] = useState<number | ''>('');
  const [npcNotes, setNpcNotes] = useState('');

  const [healthInputs, setHealthInputs] = useState<Record<string, string>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

  // ✅ Renamed to handleHealthChange to avoid clashing with the imported pure
  // function. The pure applyHealthChange from combatLogic.ts now does the math.
  const handleHealthChange = (id: string, c: Combatant, isDamage: boolean) => {
    if (syncingIds.has(id)) return;
    const val = parseInt(healthInputs[id]);
    if (!isNaN(val)) {
      const { newCurrentHp, newTempHp } = applyHealthChange(
        c.currentHp,
        c.tempHp || 0,
        c.maxHp,
        val,
        isDamage
      );
      updateCombatant(id, { currentHp: newCurrentHp, tempHp: newTempHp });
    }
    setHealthInputs(prev => ({ ...prev, [id]: '' }));
  };

  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [presetType, setPresetType] = useState<'pc' | 'npc'>('npc');
  const [presetQuantity, setPresetQuantity] = useState<number>(1);
  const [isAddingPreset, setIsAddingPreset] = useState(false);

  const [customActionTargetId, setCustomActionTargetId] = useState<string>('');

  const handleAddPreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPreset) return;

    setIsAddingPreset(true);
    const previousState = state;
    try {
      const nextId = `temp-ec-${Date.now()}`;

      let newCombatants: Combatant[] = [];
      if (presetType === 'pc') {
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
            playerId: presetType === 'pc' ? selectedPreset : null,
            npcId: presetType === 'npc' ? selectedPreset : null,
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
        presetType === 'pc' ? selectedPreset : null,
        presetType === 'npc' ? selectedPreset : null,
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

      setSelectedPreset('');
      setPresetQuantity(1);
    } catch (err) {
      console.warn('Sync failed', err);
      updateState(previousState);
      handleError(err, 'Failed to sync updates—retrying...');
    } finally {
      setIsAddingPreset(false);
    }
  };

  const addNpc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!npcName || npcHp === '') return;

    setIsAddingNpc(true);
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
        maxHp: npcHp,
        currentHp: npcHp,
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
            maxHp: npcHp,
            tempHp: 0,
            currentHp: npcHp,
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

      setNpcName('');
      setNpcHp('');
      setNpcAc('');
      setNpcNotes('');

      const newNpc = await addNpcDB(npcName, npcHp, npcAc === '' ? 10 : npcAc, npcNotes);
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
    } finally {
      setIsAddingNpc(false);
    }
  };

  const removeCombatant = async (id: string) => {
    const combatant = state.combatState.combatants.find(c => c.id === id);
    const previousState = state;

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
    const previousState = state;

    // ✅ FIX: Derive the updated combatant BEFORE calling updateState.
    // The old code captured targetCombatant via a side-effect inside the
    // updater function. In React StrictMode the updater can run twice,
    // which would trigger duplicate DB writes. Deriving it here is pure
    // and safe.
    const currentCombatant = state.combatState.combatants.find(c => c.id === id);
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
      if (
        updates.initiative !== undefined &&
        targetCombatant.sheetName &&
        targetCombatant.sheetRowIndex &&
        targetCombatant.sheetColInit
      ) {
        await updateSheetData(
          `${targetCombatant.sheetName}!${targetCombatant.sheetColInit}${targetCombatant.sheetRowIndex}`,
          [[updates.initiative]]
        );
      }

      if (targetCombatant.type === 'pc' && targetCombatant.characterId) {
        const char = state.characters.find(c => c.id === targetCombatant.characterId);
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
        const ec = state.encounterCombatants.find(
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

  return (
    <div className="flex flex-col xl:flex-row gap-8 relative items-start">
      {/* Main Combat Tracker Area */}
      <div className={cn('space-y-6 flex flex-col transition-all duration-300 w-full', isSidebarOpen ? 'xl:w-[calc(100%-384px)]' : 'xl:w-full')}>

        {globalError && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-800 text-sm shadow-sm transition-all absolute top-2 right-2 z-50">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{globalError}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-[#e5e1d8] overflow-hidden text-sm md:text-base flex-1 flex flex-col w-full">

          <div className="p-6 bg-[#fdfaf5] border-b border-[#e5e1d8] flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <button onClick={onBack} className="text-[10px] text-[#5a5a40] uppercase font-sans font-bold hover:underline tracking-widest">&larr; Back to Encounters</button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#c5b358] font-serif">{encounter ? encounter.name : 'Running Combat'}</h2>
                  {encounter && (
                    <div className="text-xs text-[#5a5a40] font-sans italic opacity-70">
                      {encounter.location} &bull; {encounter.difficultyName}
                    </div>
                  )}
                </div>
                <div className="bg-white border border-[#e5e1d8] px-3 py-1 rounded-full text-[10px] text-[#5a5a40] uppercase font-sans tracking-wider font-bold">
                  Round {state.combatState.round}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap ml-auto">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-sans font-bold uppercase bg-white border border-[#e5e1d8] hover:bg-[#f5f5f0] text-[#5a5a40] rounded-full transition-colors mr-2"
                >
                  {isSidebarOpen ? 'Hide Tools' : 'Show Tools'}
                </button>
                <Link
                  to="/player-view"
                  target="_blank"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-sans font-bold uppercase bg-[#5a5a40] hover:bg-[#3f3f37] text-white rounded-full transition-colors mr-2"
                >
                  <Eye className="w-3 h-3" /> Broadcast
                </Link>
                <button
                  onClick={rollInitForNPCs}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-sans font-bold uppercase bg-white border border-[#e5e1d8] hover:bg-[#f5f5f0] text-[#5a5a40] rounded-full transition-colors"
                  title="Roll 1d20 for all NPCs"
                >
                  Roll NPC Init
                </button>
                <button
                  onClick={resetCombat}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-sans font-bold uppercase bg-white border border-[#e5e1d8] hover:bg-[#f5f5f0] text-[#5a5a40] rounded-full transition-colors"
                >
                  <RefreshCcw className="w-3 h-3" /> Reset
                </button>
                <button
                  onClick={nextTurn}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-sans font-bold uppercase bg-[#c5b358] hover:bg-[#b0a04f] text-[#2c2c26] rounded-full transition-colors ml-2 shadow-sm"
                >
                  Next Turn
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white w-full p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
              {state.combatState.combatants.length === 0 ? (
                <div className="col-span-full py-20 text-center flex flex-col items-center justify-center">
                  <Skull className="w-12 h-12 text-[#5a5a40] opacity-20 mb-4" />
                  <p className="text-lg font-serif font-bold text-[#2c2c26]">No combatants in tracker</p>
                  <p className="text-sm text-[#5a5a40] italic">Add players or NPCs from the sidebar to begin.</p>
                </div>
              ) : (
                state.combatState.combatants.map(c => {
                  const isActive = c.id === state.combatState.activeTurnId;
                  const isExpanded = expandedIds.has(c.id);
                  const isSyncing = syncingIds.has(c.id);

                  return (
                    <motion.div
                      layout
                      key={c.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'relative bg-white border-2 rounded-2xl transition-all h-fit',
                        isActive ? 'border-[#c5b358] shadow-md z-10' : 'border-[#e5e1d8] hover:border-[#c5b358]/40',
                        c.currentHp <= 0 ? 'opacity-60 grayscale-[0.5]' : ''
                      )}
                    >
                      {isActive && (
                        <div className="absolute -top-3 left-6 bg-[#c5b358] text-[#2c2c26] text-[7px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm z-20 flex items-center gap-1">
                          <Zap className="w-2 h-2 fill-current" /> Active
                        </div>
                      )}

                      {/* Widget Header */}
                      <div className="p-3 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <div className="flex flex-col items-center shrink-0">
                            <span className="text-[6px] font-bold uppercase text-[#5a5a40] opacity-60 leading-none mb-0.5">Init</span>
                            <InitiativeInput
                              value={c.initiative}
                              onSave={val => updateCombatant(c.id, { initiative: val })}
                              disabled={isSyncing}
                            />
                          </div>
                          <div className="min-w-0 flex items-center gap-2">
                            <h3 className={cn('text-base font-bold font-serif truncate', c.type === 'npc' ? 'text-red-800' : 'text-[#2c2c26]')}>
                              {c.name}
                            </h3>
                            <span className="text-[10px] font-bold text-[#b0a04f] whitespace-nowrap">(AC {c.ac})</span>
                            {c.conditions && c.conditions.split(',').filter(Boolean).length > 0 && (
                              <div className="flex -space-x-1">
                                {c.conditions.split(',').map((cond, i) => (
                                  <div key={i} className="w-2 h-2 rounded-full bg-red-500 border border-white shadow-sm" title={cond.trim()} />
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 border-l border-[#f5f5f0] pl-3">
                            <div className="flex flex-col items-center">
                              <AnimatedHpDisplay
                                value={c.currentHp}
                                maxHp={c.maxHp}
                                isActive={isActive}
                                colorClass={c.currentHp <= c.maxHp / 2 ? (c.currentHp <= 0 ? 'text-red-700' : 'text-[#c5b358]') : 'text-[#2c2c26]'}
                                className="p-0"
                              />
                            </div>

                            <div className="flex items-center gap-1.5 ml-2">
                              <input
                                type="number"
                                value={healthInputs[c.id] || ''}
                                onChange={e => setHealthInputs(prev => ({ ...prev, [c.id]: e.target.value }))}
                                placeholder="0"
                                disabled={isSyncing}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleHealthChange(c.id, c, true);
                                  }
                                }}
                                className={cn(
                                  'w-14 bg-[#faf9f6] border border-[#e5e1d8] rounded px-1 py-1 text-center outline-none focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] font-sans text-xs font-bold disabled:opacity-50',
                                  isActive && 'bg-white border-[#c5b358]/50'
                                )}
                              />
                              <div className="flex flex-col gap-0.5">
                                <button
                                  onClick={() => handleHealthChange(c.id, c, false)}
                                  disabled={isSyncing}
                                  className="px-1.5 py-0.5 leading-none bg-green-50 text-green-700 hover:bg-green-100 border border-green-100 rounded-[4px] text-[7px] font-bold uppercase disabled:opacity-50"
                                >
                                  H
                                </button>
                                <button
                                  onClick={() => handleHealthChange(c.id, c, true)}
                                  disabled={isSyncing}
                                  className="px-1.5 py-0.5 leading-none bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 rounded-[4px] text-[7px] font-bold uppercase disabled:opacity-50"
                                >
                                  D
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleExpand(c.id)}
                          className="p-1.5 text-[#5a5a40] opacity-40 hover:opacity-100 hover:bg-[#f5f5f0] rounded transition-all shrink-0"
                        >
                          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                            <Eye className="w-4 h-4" />
                          </motion.div>
                        </button>
                      </div>

                      {/* Expanded View */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-2 border-t border-[#f5f5f0] space-y-4">
                              {c.notes && (
                                <p className="text-[10px] text-[#5a5a40] opacity-60 italic">{c.notes}</p>
                              )}
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-[#faf9f6] p-2 rounded-xl border border-[#e5e1d8] text-center">
                                  <span className="text-[7px] font-bold uppercase tracking-tighter text-[#5a5a40] block mb-1">Temp HP</span>
                                  <input
                                    type="number"
                                    value={c.tempHp || ''}
                                    onChange={e => updateCombatant(c.id, { tempHp: e.target.value ? parseInt(e.target.value) : 0 })}
                                    placeholder="0"
                                    disabled={isSyncing}
                                    className="w-full bg-transparent text-center font-bold text-blue-600 outline-none text-sm disabled:opacity-50"
                                  />
                                </div>
                                <div className="bg-[#faf9f6] p-2 rounded-xl border border-[#e5e1d8] text-center">
                                  <span className="text-[7px] font-bold uppercase tracking-tighter text-[#5a5a40] block mb-1">Max HP</span>
                                  <span className="font-bold text-sm text-[#5a5a40]">{c.maxHp}</span>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[8px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">Conditions</label>
                                <input
                                  type="text"
                                  value={c.conditions || ''}
                                  onChange={e => updateCombatant(c.id, { conditions: e.target.value })}
                                  placeholder="e.g. Paralyzed"
                                  disabled={isSyncing}
                                  className="w-full bg-[#faf9f6] border border-[#e5e1d8] rounded-xl px-2 py-1.5 text-xs italic outline-none focus:bg-white focus:border-[#c5b358] transition-all disabled:opacity-50"
                                />
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t border-[#f5f5f0]">
                                <span className="text-[8px] text-[#5a5a40] opacity-40 font-mono">{c.id.split('-').pop()}</span>
                                <button
                                  onClick={() => removeCombatant(c.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 rounded-full transition-all border border-transparent hover:border-red-100"
                                >
                                  <Trash2 className="w-3 h-3" /> Remove
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={cn(
        'space-y-6 transition-all duration-300 overflow-hidden w-full',
        isSidebarOpen ? 'xl:w-[384px] opacity-100' : 'xl:w-0 opacity-0 h-0 hidden xl:flex'
      )}>

        <div className="bg-white rounded-2xl border border-[#e5e1d8] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-[#2c2c26] font-serif">Add from Library</h2>
          </div>
          <form onSubmit={handleAddPreset} className="space-y-4 font-sans">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => { setPresetType('npc'); setSelectedPreset(''); }}
                className={cn('text-xs py-2 font-bold uppercase rounded-lg border', presetType === 'npc' ? 'bg-[#5a5a40] text-white border-[#5a5a40]' : 'bg-[#f5f5f0] text-[#5a5a40] border-[#e5e1d8]')}
              >
                NPC
              </button>
              <button
                type="button"
                onClick={() => { setPresetType('pc'); setSelectedPreset(''); }}
                className={cn('text-xs py-2 font-bold uppercase rounded-lg border', presetType === 'pc' ? 'bg-[#5a5a40] text-white border-[#5a5a40]' : 'bg-[#f5f5f0] text-[#5a5a40] border-[#e5e1d8]')}
              >
                Player
              </button>
            </div>

            <div>
              <label className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1">Select {presetType.toUpperCase()}</label>
              <select
                value={selectedPreset}
                onChange={e => setSelectedPreset(e.target.value)}
                required
                className="w-full bg-[#fdfaf5] border border-transparent rounded-md px-3 py-2 text-[#2c2c26] text-sm focus:bg-white focus:border-[#e5e1d8] focus:ring-2 focus:ring-[#e5e1d8] outline-none transition-all"
              >
                <option value="">Select...</option>
                {presetType === 'npc'
                  ? state.npcs.map(n => <option key={n.id} value={n.id}>{n.name}</option>)
                  : state.characters.filter(c => c.isActive).map(c => (
                      <option key={c.id} value={c.id}>{c.characterName} ({c.playerName})</option>
                    ))
                }
              </select>
            </div>

            {presetType === 'npc' && (
              <div>
                <label className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1">Quantity</label>
                <input
                  type="number"
                  value={presetQuantity}
                  onChange={e => setPresetQuantity(parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-full bg-[#fdfaf5] border border-transparent rounded-md px-3 py-2 text-[#2c2c26] text-sm focus:bg-white focus:border-[#e5e1d8] focus:ring-2 focus:ring-[#e5e1d8] outline-none transition-all"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isAddingPreset}
              className="w-full bg-[#c5b358] hover:bg-[#b0a04f] text-[#2c2c26] font-bold text-[10px] uppercase tracking-widest py-3 rounded-full transition-colors mt-2 disabled:opacity-50"
            >
              {isAddingPreset ? 'Adding...' : '+ Add to Encounter'}
            </button>
          </form>
        </div>

        {/* Add Custom NPC Form */}
        <div className="bg-white rounded-2xl border border-[#e5e1d8] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-[#2c2c26] font-serif">Add New NPC Combatant</h2>
          </div>
          <form onSubmit={addNpc} className="space-y-4 font-sans">
            <div>
              <label className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1">Name</label>
              <input
                type="text"
                value={npcName}
                onChange={e => setNpcName(e.target.value)}
                placeholder="e.g. Goblin Archer"
                required
                className="w-full bg-[#fdfaf5] border border-transparent rounded-md px-3 py-2 text-[#2c2c26] text-sm focus:bg-white focus:border-[#e5e1d8] focus:ring-2 focus:ring-[#e5e1d8] outline-none transition-all placeholder:text-[#5a5a40]/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1">HP</label>
                <input
                  type="number"
                  value={npcHp}
                  onChange={e => setNpcHp(e.target.value ? parseInt(e.target.value) : '')}
                  required
                  min={1}
                  className="w-full bg-[#fdfaf5] border border-transparent rounded-md px-3 py-2 text-[#2c2c26] text-sm focus:bg-white focus:border-[#e5e1d8] focus:ring-2 focus:ring-[#e5e1d8] outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1">AC</label>
                <input
                  type="number"
                  value={npcAc}
                  onChange={e => setNpcAc(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="10"
                  className="w-full bg-[#fdfaf5] border border-transparent rounded-md px-3 py-2 text-[#2c2c26] text-sm focus:bg-white focus:border-[#e5e1d8] focus:ring-2 focus:ring-[#e5e1d8] outline-none transition-all placeholder:text-[#5a5a40]/40"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1">Special Characteristics</label>
              <input
                type="text"
                value={npcNotes}
                onChange={e => setNpcNotes(e.target.value)}
                className="w-full bg-[#fdfaf5] border border-transparent rounded-md px-3 py-2 text-[#2c2c26] text-sm focus:bg-white focus:border-[#e5e1d8] focus:ring-2 focus:ring-[#e5e1d8] outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isAddingNpc}
              className="w-full bg-[#5a5a40] hover:bg-[#3f3f37] text-white font-bold text-[10px] uppercase tracking-widest py-3 rounded-full transition-colors mt-2 disabled:opacity-50"
            >
              {isAddingNpc ? 'Adding...' : '+ Add to Combat'}
            </button>
          </form>
        </div>

        {/* Custom Actions Form */}
        <div className="bg-white rounded-2xl border border-[#e5e1d8] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-[#2c2c26] font-serif">Custom Actions</h2>
          </div>
          <div className="space-y-4 font-sans">
            <div>
              <label className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1">Target Combatant</label>
              <select
                value={customActionTargetId}
                onChange={e => setCustomActionTargetId(e.target.value)}
                className="w-full bg-[#fdfaf5] border border-transparent rounded-md px-3 py-2 text-[#2c2c26] text-sm focus:bg-white focus:border-[#e5e1d8] focus:ring-2 focus:ring-[#e5e1d8] outline-none transition-all"
              >
                <option value="">Select Target...</option>
                <option value="ALL">All Combatants</option>
                <option value="ACTIVE">Active Turn</option>
                <optgroup label="Combatants">
                  {state.combatState.combatants.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
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
                      if (!current.includes('Poisoned')) {
                        updateCombatant(id, { conditions: [...current, 'Poisoned'].join(', ') });
                      }
                      updateCombatant(id, { currentHp: Math.max(0, c.currentHp - 2) });
                    }
                  });
                }}
                className="w-full bg-red-100 hover:bg-red-200 text-red-800 border border-red-200 font-bold text-[10px] uppercase tracking-widest py-2 rounded-lg transition-colors"
              >
                Poison (-2 HP)
              </button>
              <button
                onClick={() => {
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
                      if (!current.includes('Hasted')) {
                        updateCombatant(id, { conditions: [...current, 'Hasted'].join(', ') });
                      }
                    }
                  });
                }}
                className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200 font-bold text-[10px] uppercase tracking-widest py-2 rounded-lg transition-colors"
              >
                Grant Haste
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── DebouncedInput ───────────────────────────────────────────────────────────

// ✅ Properly typed — was previously `any` which hid type errors at every call site
interface DebouncedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string | number;
  onChange: (value: string) => void;
}

function DebouncedInput({ value, onChange, ...props }: DebouncedInputProps) {
  const [localValue, setLocalValue] = useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const commit = () => {
    if (localValue !== value) onChange(String(localValue));
  };

  return (
    <input
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
      onBlur={commit}
      onKeyDown={e => e.key === 'Enter' && commit()}
      {...props}
    />
  );
}

// ─── DebouncedTextarea ────────────────────────────────────────────────────────

// ✅ Properly typed — was previously `any`
interface DebouncedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (value: string) => void;
}

function DebouncedTextarea({ value, onChange, ...props }: DebouncedTextareaProps) {
  const [localValue, setLocalValue] = useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const commit = () => {
    if (localValue !== value) onChange(localValue);
  };

  return (
    <textarea
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
      onBlur={commit}
      {...props}
    />
  );
}