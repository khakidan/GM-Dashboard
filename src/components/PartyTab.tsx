import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { Character } from '../types';
import { Shield, Eye, Heart, Coffee, Loader2, X, AlertCircle, Users, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { addCharacterDB, updateCharacterDB, deleteCharacterFully } from '../services/dbOperations';
import { motion, AnimatePresence } from 'motion/react';

export function PartyTab() {
  const { state, updateState } = useAppState();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isResting, setIsResting] = useState(false);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddPlayer = async () => {
    setIsAddingPlayer(true);
    setGlobalError(null);
    const previousState = state;
    
    // We create a temporary character strictly for optimistic UI
    const tempId = `pc-temp-${Date.now()}`;
    const newChar: Character = {
      id: tempId,
      playerName: "New Player",
      characterName: "New Character",
      ac: 10,
      maxHp: 10,
      currentHp: 10,
      tempHp: 0,
      conditions: "",
      passivePerception: 10,
      level: 1,
      statusId: 1,
      statusName: 'Active',
      notes: '',
      isActive: true,
    };

    updateState(prev => ({
      ...prev,
      characters: [...prev.characters, newChar]
    }));

    try {
      const savedChar = await addCharacterDB(newChar);
      // Replace temp with real
      updateState(prev => ({
        ...prev,
        characters: prev.characters.map(c => c.id === tempId ? { ...savedChar } : c) as Character[]
      }));
    } catch(err: any) {
      console.warn(err);
      updateState(previousState);
      if (err?.message === "UNAUTHENTICATED" || err?.error === "UNAUTHENTICATED") {
        alert("Your session has expired. Please sign in again.");
        window.location.reload();
      } else {
        setGlobalError("Failed to add player. Please try again.");
      }
    } finally {
      setIsAddingPlayer(false);
    }
  };

  const handleLongRest = async () => {
    if (!confirm("Are you sure you want the party to take a long rest? This will reset all Current HP to Max HP and clear all Temp HP.")) return;
    
    setIsResting(true);
    setGlobalError(null);
    
    const previousState = state;
    // 1. Update local state optimistically
    updateState(prev => ({
      ...prev,
      characters: prev.characters.map(c => 
        c.isActive ? { ...c, currentHp: c.maxHp, tempHp: 0 } : c
      )
    }));

    try {
      // It's best to rely on dbOperations update loop for safety
      const activePCs = state.characters.filter(c => c.isActive);
      
      const updatePromises = activePCs.map(char => {
        return updateCharacterDB({ currentHp: char.maxHp, tempHp: 0 }, char);
      });

      await Promise.all(updatePromises);
    } catch (err: any) {
      console.error("Long rest failed", err);
      // 2. Rollback
      updateState(previousState);
      if (err?.message === "UNAUTHENTICATED" || err?.error === "UNAUTHENTICATED") {
        alert("Your session has expired. Please sign in again.");
        window.location.reload();
      } else {
        setGlobalError("Failed to complete long rest synchronisation.");
      }
    } finally {
      setIsResting(false);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    const char = state.characters.find(c => c.id === id);
    if (!char) return;

    if (!confirm(`Are you sure you want to delete ${char.characterName}?`)) return;

    setGlobalError(null);
    const previousState = state;
    
    updateState(prev => ({
      ...prev,
      characters: prev.characters.filter(c => c.id !== id)
    }));

    try {
      await deleteCharacterFully(id);
    } catch(err: any) {
      console.warn("Failed to delete character", err);
      updateState(previousState);
      
      if (err?.message === "UNAUTHENTICATED" || err?.error === "UNAUTHENTICATED") {
        alert("Your session has expired. Please sign in again.");
        window.location.reload();
      } else {
        setGlobalError(`Failed to delete "${char.characterName}". Please try again.`);
      }
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Character>) => {
    const previousState = state;
    // Deep validation on updates
    const sanitizedUpdates = { ...updates };
    if (typeof sanitizedUpdates.characterName === 'string') sanitizedUpdates.characterName = sanitizedUpdates.characterName.trim();
    if (typeof sanitizedUpdates.playerName === 'string') sanitizedUpdates.playerName = sanitizedUpdates.playerName.trim();
    
    // Fallbacks for numbers
    if (sanitizedUpdates.ac !== undefined) sanitizedUpdates.ac = Math.max(0, parseInt(sanitizedUpdates.ac as any) || 0);
    if (sanitizedUpdates.maxHp !== undefined) sanitizedUpdates.maxHp = Math.max(1, parseInt(sanitizedUpdates.maxHp as any) || 1);
    if (sanitizedUpdates.currentHp !== undefined) sanitizedUpdates.currentHp = Math.max(0, parseInt(sanitizedUpdates.currentHp as any) || 0);
    if (sanitizedUpdates.tempHp !== undefined) sanitizedUpdates.tempHp = Math.max(0, parseInt(sanitizedUpdates.tempHp as any) || 0);
    if (sanitizedUpdates.level !== undefined) sanitizedUpdates.level = Math.max(1, parseInt(sanitizedUpdates.level as any) || 1);
    if (sanitizedUpdates.passivePerception !== undefined) sanitizedUpdates.passivePerception = Math.max(0, parseInt(sanitizedUpdates.passivePerception as any) || 0);

    // 1. Update local state immediately (Optimistic Update)
    updateState(prev => ({
      ...prev,
      characters: prev.characters.map(c => 
        c.id === id ? { ...c, ...sanitizedUpdates } : c
      )
    }));

    // 2. Check if we need to sync to sheets (if we updated data that lives in the sheet)
    const isSheetData = Object.keys(sanitizedUpdates).some(k => 
      ['playerName', 'characterName', 'ac', 'maxHp', 'tempHp', 'currentHp', 'conditions', 'passivePerception', 'level', 'statusId', 'notes'].includes(k)
    );

    if (!isSheetData) return;

    const char = state.characters.find(c => c.id === id);
    if (!char) return;
    
    setSyncingId(id);
    try {
      await updateCharacterDB(sanitizedUpdates, char);
    } catch (err: any) {
      console.error("Failed to sync party update to sheets", err);
      // 3. Rollback
      updateState(previousState);
      if (err?.message === "UNAUTHENTICATED" || err?.error === "UNAUTHENTICATED") {
        alert("Your session has expired. Please sign in again.");
        window.location.reload();
      } else {
        setGlobalError(`Failed to update details for "${char.characterName}".`);
      }
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#e5e1d8] shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#2c2c26] font-serif">Party Roster</h2>
          <p className="text-sm text-[#5a5a40] mt-1 font-sans">Manage your players characters. Any edits here instantly sync back to Google Sheets.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleLongRest}
            disabled={isResting || state.characters.length === 0}
            className="flex-1 sm:flex-none items-center justify-center gap-2 bg-[#5a5a40] hover:bg-[#3f3f37] focus:ring-2 focus:ring-offset-2 focus:ring-[#5a5a40] outline-none text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-sm hover:shadow-md disabled:opacity-50 inline-flex"
          >
            {isResting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Coffee className="w-3.5 h-3.5" />}
            Long Rest
          </button>
          <button
            onClick={handleAddPlayer}
            disabled={isAddingPlayer}
            className="flex-1 sm:flex-none items-center justify-center gap-2 bg-[#c5b358] hover:bg-[#b0a04f] focus:ring-2 focus:ring-offset-2 focus:ring-[#c5b358] outline-none text-[#2c2c26] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-sm hover:shadow-md disabled:opacity-50 inline-flex"
          >
            {isAddingPlayer ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding...</> : "+ Player"}
          </button>
        </div>
      </div>

      {globalError && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{globalError}</p>
        </div>
      )}

      {state.characters.length === 0 ? (
        <div className="bg-white border border-[#e5e1d8] rounded-2xl py-16 px-6 text-center shadow-sm flex flex-col items-center">
          <Users className="w-12 h-12 text-[#5a5a40] opacity-20 mb-4" />
          <h3 className="text-lg font-serif font-bold text-[#2c2c26] mb-2">No characters found</h3>
          <p className="text-sm text-[#5a5a40] max-w-sm mx-auto mb-6">
            Your party roster is empty. Add players to track their health, conditions, and active status during encounters.
          </p>
          <button
            onClick={handleAddPlayer}
            disabled={isAddingPlayer}
            className="flex items-center justify-center gap-2 bg-[#c5b358] hover:bg-[#b0a04f] text-[#2c2c26] px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c5b358] shadow-sm disabled:opacity-50"
          >
             {isAddingPlayer ? "Adding Player..." : "+ Add First Player"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {state.characters.map(char => (
            <CharacterCard 
              key={char.id} 
              character={char} 
              isSyncing={syncingId === char.id}
              isExpanded={expandedIds.has(char.id)}
              onToggleExpand={() => toggleExpand(char.id)}
              onUpdate={(updates) => handleUpdate(char.id, updates)}
              onDelete={() => handleDeletePlayer(char.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CharacterCardProps {
  character: Character; 
  isSyncing: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<Character>) => void;
  onDelete: () => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ 
  character, 
  isSyncing,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete
}) => {
  return (
    <div className={cn(
      "bg-white rounded-2xl border overflow-hidden flex flex-col relative group transition-all",
      isExpanded ? "border-[#c5b358]/40" : "border-[#e5e1d8] hover:border-[#c5b358]/20",
      isSyncing ? "border-[#c5b358] shadow-[0_0_15px_rgba(197,179,88,0.3)] shadow-[#c5b358]/20" : "shadow-sm hover:shadow-md"
    )}>
      {isSyncing && (
        <div className="absolute top-2 right-10 z-20 flex items-center gap-1 bg-[#c5b358] text-[#2c2c26] text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin"/> Syncing
        </div>
      )}
      
      {/* Header Area - Always Visible */}
      <div className="p-3 flex items-center justify-between gap-3 px-4">
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
          <div className="flex items-center gap-2 min-w-0">
             <DebouncedInput 
                value={character.characterName}
                onChange={(v) => onUpdate({ characterName: v as string })}
                className="text-base font-bold text-[#2c2c26] font-serif bg-transparent border border-transparent rounded hover:bg-[#fdfaf5] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none px-2 py-0.5 -ml-2 transition-all placeholder:text-gray-300 disabled:opacity-50 w-auto max-w-[140px] truncate"
                placeholder="Name"
                disabled={isSyncing}
              />
              <div className="hidden sm:block text-[#e5e1d8] shrink-0">|</div>
              <DebouncedInput 
                value={character.playerName}
                onChange={(v) => onUpdate({ playerName: v as string })}
                className="text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold opacity-60 bg-transparent border border-transparent rounded hover:bg-[#fdfaf5] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none px-2 py-0.5 -ml-2 transition-all placeholder:text-gray-300 disabled:opacity-50 w-auto max-w-[90px] truncate"
                placeholder="Player"
                disabled={isSyncing}
              />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative shrink-0 flex items-center">
              <select
                value={character.statusId}
                onChange={(e) => {
                  const id = parseInt(e.target.value);
                  let statusName = "Unknown";
                  if (id === 1) statusName = "Active";
                  if (id === 2) statusName = "Absent";
                  if (id === 3) statusName = "Dead";
                  onUpdate({ statusId: id, statusName });
                }}
                disabled={isSyncing}
                className={cn(
                  "text-[8px] uppercase tracking-widest font-bold pl-1.5 pr-4 py-0.5 rounded-full border transition-colors outline-none cursor-pointer appearance-none disabled:opacity-50",
                  character.statusId === 1 ? "bg-green-50 text-green-700 border-green-100" : 
                  character.statusId === 3 ? "bg-red-50 text-red-700 border-red-100" :
                  "bg-gray-50 text-gray-500 border-gray-100"
                )}
              >
                <option value={1}>Active</option>
                <option value={2}>Absent</option>
                <option value={3}>Dead</option>
              </select>
              <div className="absolute right-1 pointer-events-none text-[6px] font-bold opacity-40">▼</div>
            </div>

            {!isExpanded && (
              <div className="flex items-center gap-3 pl-3 border-l border-[#f5f5f0] whitespace-nowrap">
                {character.conditions && (
                  <div className="hidden lg:flex items-center gap-1.5 px-3 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded-full text-[14px] font-bold italic max-w-[220px] truncate">
                    {character.conditions}
                  </div>
                )}
                <div className="flex items-center gap-1 text-[14px] font-bold text-[#5a5a40] opacity-60">
                  <Eye className="w-3.5 h-3.5" />
                  {character.passivePerception}
                </div>
                <div className="flex items-center gap-1 text-[14px] font-bold text-[#c5b358]">
                  <Heart className="w-3.5 h-3.5" />
                  {character.currentHp}
                </div>
                <div className="flex items-center gap-1 text-[14px] font-bold text-[#5a5a40]">
                  <Shield className="w-3.5 h-3.5 opacity-50" />
                  {character.ac}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 border-l border-[#f5f5f0] pl-2">
          <button 
            onClick={onToggleExpand}
            className="p-1.5 text-[#5a5a40] opacity-30 hover:opacity-100 hover:bg-[#f5f5f0] rounded-full transition-all"
          >
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[#f5f5f0]"
          >
            <div className="p-5 flex flex-col font-sans gap-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-[#fdfaf5] border border-[#e5e1d8] rounded-xl shadow-sm">
                   <div className="text-[7px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">HP</div>
                   <DebouncedInput 
                    type="number"
                    value={character.currentHp === undefined ? '' : character.currentHp}
                    onChange={(v) => onUpdate({ currentHp: parseInt(v as string) || 0 })}
                    className="text-base font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] rounded transition-all disabled:opacity-50"
                    disabled={isSyncing}
                  />
                </div>
                <div className="text-center p-2 bg-[#fdfaf5] border border-[#e5e1d8] rounded-xl shadow-sm">
                   <div className="text-[7px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">Temp</div>
                   <DebouncedInput 
                    type="number"
                    value={character.tempHp === undefined ? '' : character.tempHp}
                    onChange={(v) => onUpdate({ tempHp: parseInt(v as string) || 0 })}
                    className="text-base font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] rounded transition-all disabled:opacity-50"
                    disabled={isSyncing}
                  />
                </div>
                <div className="text-center p-2 bg-[#fdfaf5] border border-[#e5e1d8] rounded-xl shadow-sm group/lvl">
                   <div className="text-[7px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">Level</div>
                   <DebouncedInput 
                    type="number"
                    value={character.level || ''}
                    onChange={(v) => onUpdate({ level: parseInt(v as string) || 1 })}
                    placeholder="1"
                    className="text-base font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent rounded hover:bg-white focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-colors disabled:opacity-50"
                    disabled={isSyncing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-[#faf9f6] p-3 rounded-xl border border-[#e5e1d8]">
                <div className="text-center">
                  <Shield className="w-3 h-3 mx-auto text-[#5a5a40] mb-1 opacity-70" />
                  <DebouncedInput 
                    type="number"
                    value={character.ac || ''}
                    onChange={(v) => onUpdate({ ac: parseInt(v as string) || 0 })}
                    className="text-sm font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] rounded transition-all disabled:opacity-50"
                    disabled={isSyncing}
                  />
                  <div className="text-[7px] font-bold uppercase tracking-widest text-[#5a5a40]">AC</div>
                </div>
                <div className="text-center">
                  <Heart className="w-3 h-3 mx-auto text-[#5a5a40] mb-1 opacity-70" />
                  <DebouncedInput 
                    type="number"
                    value={character.maxHp || ''}
                    onChange={(v) => onUpdate({ maxHp: parseInt(v as string) || 1 })}
                    className="text-sm font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] rounded transition-all disabled:opacity-50"
                    disabled={isSyncing}
                  />
                  <div className="text-[7px] font-bold uppercase tracking-widest text-[#5a5a40]">Max HP</div>
                </div>
                <div className="text-center">
                  <Eye className="w-3 h-3 mx-auto text-[#5a5a40] mb-1 opacity-70" />
                  <DebouncedInput 
                    type="number"
                    value={character.passivePerception === undefined ? '' : character.passivePerception}
                    onChange={(v) => onUpdate({ passivePerception: parseInt(v as string) || 0 })}
                    className="text-sm font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] rounded transition-all disabled:opacity-50"
                    disabled={isSyncing}
                  />
                  <div className="text-[7px] font-bold uppercase tracking-widest text-[#5a5a40]">Percept</div>
                </div>
              </div>

              <div>
                <div className="text-[8px] uppercase text-[#5a5a40] font-bold tracking-widest mb-1 px-1">Conditions</div>
                <DebouncedInput 
                  type="text"
                  value={character.conditions}
                  onChange={(v) => onUpdate({ conditions: v as string })}
                  placeholder="Conditions..."
                  className="w-full text-xs text-[#2c2c26] bg-[#fdfaf5] p-2 rounded-lg border border-[#e5e1d8] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all placeholder:text-[#cccbcb] disabled:opacity-50"
                  disabled={isSyncing}
                />
              </div>

              <div>
                <div className="text-[8px] uppercase text-[#5a5a40] font-bold tracking-widest mb-1 px-1">Notes</div>
                <DebouncedTextarea 
                  value={character.notes}
                  onChange={(v) => onUpdate({ notes: v })}
                  placeholder="Notes..."
                  className="w-full text-xs text-[#2c2c26] bg-[#fdfaf5] p-2 rounded-lg italic resize-none border border-[#e5e1d8] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all h-20 placeholder:text-[#cccbcb] disabled:opacity-50"
                  disabled={isSyncing}
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={onDelete}
                  disabled={isSyncing}
                  className="w-full py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-red-100 transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-3 h-3" />
                  Delete Player
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function DebouncedInput({ value, onChange, ...props }: any) {
  const [localValue, setLocalValue] = useState(value);
  
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const commit = () => {
    if (localValue !== value) onChange(localValue);
  };

  return <input value={localValue} onChange={e => setLocalValue(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()} {...props} />;
}

function DebouncedTextarea({ value, onChange, ...props }: any) {
  const [localValue, setLocalValue] = useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const commit = () => {
    if (localValue !== value) onChange(localValue);
  };

  return <textarea value={localValue} onChange={e => setLocalValue(e.target.value)} onBlur={commit} {...props} />;
}
