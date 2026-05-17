import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { Character } from '../types';
import { Shield, Eye, Heart, Coffee, Loader2, X, AlertCircle, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { addCharacterDB, updateCharacterDB, deleteCharacterFully } from '../services/dbOperations';

export function PartyTab() {
  const { state, updateState } = useAppState();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isResting, setIsResting] = useState(false);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
          {state.characters.map(char => (
            <CharacterCard 
              key={char.id} 
              character={char} 
              isSyncing={syncingId === char.id}
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
  onUpdate: (updates: Partial<Character>) => void;
  onDelete: () => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ 
  character, 
  isSyncing,
  onUpdate,
  onDelete
}) => {
  return (
    <div className={cn(
      "bg-white rounded-2xl border overflow-hidden flex flex-col relative group transition-all",
      isSyncing ? "border-[#c5b358] shadow-[0_0_15px_rgba(197,179,88,0.3)] shadow-[#c5b358]/20" : "border-[#e5e1d8] hover:shadow-md shadow-sm hover:border-[#c5b358]/40"
    )}>
      {isSyncing && (
        <div className="absolute top-2 right-10 z-20 flex items-center gap-1 bg-[#c5b358] text-[#2c2c26] text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin"/> Syncing
        </div>
      )}
      
      <button 
        onClick={onDelete}
        disabled={isSyncing}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 absolute top-2 right-2 z-20 flex items-center justify-center bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 focus:text-red-600 w-7 h-7 rounded-full shadow-sm border border-[#e5e1d8] transition-all focus:outline-none focus:ring-2 focus:ring-red-200 disabled:opacity-0"
        title="Delete Player"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="p-5 flex-1 flex flex-col font-sans">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 mr-2 flex flex-col gap-1">
            <div className="flex flex-col gap-1 mb-1">
              <DebouncedInput 
                value={character.characterName}
                onChange={(v) => onUpdate({ characterName: v as string })}
                className="text-xl leading-none font-bold text-[#2c2c26] font-serif bg-transparent border border-transparent rounded hover:bg-[#f5f5f0] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none w-full px-2 py-1 -ml-2 transition-colors placeholder:text-gray-300 disabled:opacity-50"
                placeholder="Character Name"
                disabled={isSyncing}
              />
              <div className="flex items-center gap-2">
                <DebouncedInput 
                  value={character.playerName}
                  onChange={(v) => onUpdate({ playerName: v as string })}
                  className="text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold opacity-80 bg-transparent border border-transparent rounded hover:bg-[#f5f5f0] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none px-2 py-1 -ml-2 transition-colors w-1/2 min-w-[100px] placeholder:text-gray-300 disabled:opacity-50"
                  placeholder="Player Name"
                  disabled={isSyncing}
                />
                
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
                      "text-[9px] uppercase tracking-widest font-bold pl-2 pr-5 py-1 rounded-full border transition-colors outline-none cursor-pointer appearance-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50",
                      character.statusId === 1 ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200 focus:ring-green-300" : 
                      character.statusId === 3 ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-200 focus:ring-red-300" :
                      "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 focus:ring-gray-300"
                    )}
                  >
                    <option value={1}>Active</option>
                    <option value={2}>Absent</option>
                    <option value={3}>Dead</option>
                  </select>
                  <div className="absolute right-1.5 pointer-events-none text-[7px] font-bold opacity-60">▼</div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#fdfaf5] px-2 py-1.5 rounded-lg text-center flex flex-col items-center w-14 shrink-0 border border-[#e5e1d8] overflow-hidden mt-1 group-hover:border-[#c5b358]/30 transition-colors">
            <div className="text-[9px] text-[#5a5a40] font-bold uppercase tracking-widest mb-0.5">Lvl</div>
            <DebouncedInput 
              type="number"
              value={character.level || ''}
              onChange={(v) => onUpdate({ level: parseInt(v as string) || 1 })}
              placeholder="1"
              className="font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent rounded hover:bg-white focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-colors disabled:opacity-50"
              disabled={isSyncing}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center group/stat relative hover:bg-white rounded-xl transition-colors p-2 bg-[#fdfaf5] border border-[#e5e1d8] shadow-sm">
             <div className="text-[9px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">Current HP</div>
             <DebouncedInput 
              type="number"
              value={character.currentHp === undefined ? '' : character.currentHp}
              onChange={(v) => onUpdate({ currentHp: parseInt(v as string) || 0 })}
              placeholder="0"
              className="text-xl font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] rounded transition-all disabled:opacity-50"
              disabled={isSyncing}
            />
          </div>
          <div className="text-center group/stat relative hover:bg-white rounded-xl transition-colors p-2 bg-[#fdfaf5] border border-[#e5e1d8] shadow-sm">
             <div className="text-[9px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">Temp HP</div>
             <DebouncedInput 
              type="number"
              value={character.tempHp === undefined ? '' : character.tempHp}
              onChange={(v) => onUpdate({ tempHp: parseInt(v as string) || 0 })}
              placeholder="0"
              className="text-xl font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] rounded transition-all disabled:opacity-50"
              disabled={isSyncing}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6 bg-[#fdfaf5] p-3 rounded-xl border border-[#e5e1d8] shadow-sm">
          <div className="text-center relative hover:bg-white rounded-lg transition-colors overflow-hidden p-1 border border-transparent hover:border-[#e5e1d8]">
            <Shield className="w-4 h-4 mx-auto text-[#5a5a40] mb-1 opacity-70" />
            <DebouncedInput 
              type="number"
              value={character.ac || ''}
              onChange={(v) => onUpdate({ ac: parseInt(v as string) || 0 })}
              placeholder="10"
              className="text-lg font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] rounded transition-all disabled:opacity-50"
              disabled={isSyncing}
            />
            <div className="text-[8px] font-bold uppercase tracking-widest text-[#5a5a40]">AC</div>
          </div>
          <div className="text-center relative hover:bg-white rounded-lg transition-colors overflow-hidden p-1 border border-transparent hover:border-[#e5e1d8]">
            <Heart className="w-4 h-4 mx-auto text-[#5a5a40] mb-1 opacity-70" />
            <DebouncedInput 
              type="number"
              value={character.maxHp || ''}
              onChange={(v) => onUpdate({ maxHp: parseInt(v as string) || 1 })}
              placeholder="1"
              className="text-lg font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] rounded transition-all disabled:opacity-50"
              disabled={isSyncing}
            />
            <div className="text-[8px] font-bold uppercase tracking-widest text-[#5a5a40]">Max HP</div>
          </div>
          <div className="text-center relative hover:bg-white rounded-lg transition-colors overflow-hidden p-1 border border-transparent hover:border-[#e5e1d8]">
            <Eye className="w-4 h-4 mx-auto text-[#5a5a40] mb-1 opacity-70" />
            <DebouncedInput 
              type="number"
              value={character.passivePerception === undefined ? '' : character.passivePerception}
              onChange={(v) => onUpdate({ passivePerception: parseInt(v as string) || 0 })}
              placeholder="10"
              className="text-lg font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] rounded transition-all disabled:opacity-50"
              disabled={isSyncing}
            />
            <div className="text-[8px] font-bold uppercase tracking-widest text-[#5a5a40]">Percept</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-[10px] uppercase text-[#5a5a40] font-bold tracking-widest mb-1.5 px-1">Current Conditions</div>
          <DebouncedInput 
            type="text"
            value={character.conditions}
            onChange={(v) => onUpdate({ conditions: v as string })}
            placeholder="e.g. Poisoned, Frightened..."
            className="w-full text-sm text-[#2c2c26] bg-[#fdfaf5] p-3 rounded-xl border border-[#e5e1d8] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all placeholder:text-[#cccbcb] shadow-inner disabled:opacity-50"
            disabled={isSyncing}
          />
        </div>

        <div className="mt-auto">
          <div className="text-[10px] uppercase text-[#5a5a40] font-bold tracking-widest mb-1.5 px-1">Notes & Traits</div>
          <DebouncedTextarea 
            value={character.notes}
            onChange={(v) => onUpdate({ notes: v })}
            placeholder="Add specific character notes, resistances, traits..."
            className="w-full text-sm text-[#2c2c26] bg-[#fdfaf5] p-3 rounded-xl italic resize-none border border-[#e5e1d8] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all h-24 placeholder:text-[#cccbcb] shadow-inner disabled:opacity-50"
            disabled={isSyncing}
          />
        </div>
      </div>
    </div>
  );
}

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
