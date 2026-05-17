import React, { useState, useEffect } from 'react';
import { useAppState } from '../hooks/useAppState';
import { Encounter } from '../types';
import { Swords, MapPin, Skull, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { deleteEncounterFully } from '../services/dbOperations';

interface EncounterRowProps {
  enc: Encounter;
  isDeleting: boolean;
  onDelete: (enc: Encounter) => void;
  onStart: (enc: Encounter) => void;
  onSyncRequested: () => Promise<void>;
}

const EncounterRow: React.FC<EncounterRowProps> = ({ 
  enc, 
  isDeleting,
  onDelete, 
  onStart, 
  onSyncRequested 
}) => {
  const { state, updateState } = useAppState();
  const [name, setName] = useState(enc.name || '');
  const [location, setLocation] = useState(enc.location || '');
  const [difficultyId, setDifficultyId] = useState(enc.difficultyId);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    setName(enc.name || '');
    setLocation(enc.location || '');
    setDifficultyId(enc.difficultyId);
  }, [enc]);

  const handleUpdate = async () => {
    const trimmedName = name.trim();
    const trimmedLocation = location.trim();
    
    // Validate empty required fields
    if (!trimmedName || !trimmedLocation) {
      setName(enc.name || '-');
      setLocation(enc.location || '-');
      return;
    }

    if (
      trimmedName === enc.name && 
      trimmedLocation === enc.location && 
      difficultyId === enc.difficultyId
    ) return;
    
    setIsUpdating(true);
    setErrorStatus(null);
    
    const previousState = state;
    updateState(prev => ({
      ...prev,
      encounters: prev.encounters.map(e => 
        e.id === enc.id 
          ? { ...e, name: trimmedName, location: trimmedLocation, difficultyId }
          : e
      )
    }));

    try {
      const { updateEncounterDB } = await import('../services/dbOperations');
      await updateEncounterDB(enc.id, trimmedName, trimmedLocation, difficultyId);
      // Optional: silent sync
      onSyncRequested().catch(console.error);
    } catch (err: any) {
      console.error("Failed to update encounter", err);
      updateState(previousState);
      setName(enc.name);
      setLocation(enc.location);
      setDifficultyId(enc.difficultyId);
      
      if (err?.message === "UNAUTHENTICATED" || err?.error === "UNAUTHENTICATED") {
        alert("Your session has expired. Please sign in again.");
        window.location.reload();
      } else {
        setErrorStatus("Failed to update encounter details.");
        setTimeout(() => setErrorStatus(null), 3000);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const npcCount = state.encounterCombatants
    .filter(ec => ec.encounterId === enc.id && ec.npcId)
    .reduce((sum, current) => sum + current.quantity, 0);

  return (
    <tr className="hover:bg-[#fdfaf5] transition-colors group">
      <td className="py-4 px-4 align-top">
        <input 
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={handleUpdate}
          disabled={isUpdating || isDeleting}
          placeholder="Encounter Name..."
          className="font-bold text-[#2c2c26] font-serif text-base bg-transparent border border-transparent hover:border-[#e5e1d8] focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] focus:bg-white rounded px-2 py-1.5 outline-none w-full transition-all disabled:opacity-50 truncate"
        />
        {errorStatus && (
          <div className="text-red-500 text-xs mt-1 flex items-center gap-1 px-2">
            <AlertCircle className="w-3 h-3" />
            {errorStatus}
          </div>
        )}
      </td>
      <td className="py-4 px-4 w-48 align-top pt-5">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#c5b358] shrink-0" />
          <input 
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            onBlur={handleUpdate}
            disabled={isUpdating || isDeleting}
            placeholder="Location..."
            className="text-sm opacity-80 bg-transparent border border-transparent hover:border-[#e5e1d8] focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] focus:bg-white focus:opacity-100 rounded px-2 py-1 outline-none w-full transition-all disabled:opacity-50 truncate"
          />
        </div>
      </td>
      <td className="py-4 px-4 w-32 align-top pt-5">
        <div className="relative flex items-center">
          <select 
            value={difficultyId}
            onChange={e => setDifficultyId(parseInt(e.target.value))}
            onBlur={handleUpdate}
            disabled={isUpdating || isDeleting}
            className={cn(
              "w-full text-[9px] uppercase tracking-widest font-bold pl-2 pr-6 py-1.5 rounded-full border transition-colors outline-none cursor-pointer appearance-none focus:ring-2 focus:ring-offset-1 focus:ring-[#c5b358]",
              difficultyId === 4 ? "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200" :
              difficultyId === 3 ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" :
              difficultyId === 2 ? "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200" :
              "bg-green-100 text-green-700 border-green-200 hover:bg-green-200",
              (isUpdating || isDeleting) && "opacity-50 cursor-not-allowed"
            )}
          >
            {Object.entries(state.difficulties).map(([id, nm]) => (
              <option key={id} value={id}>{nm}</option>
            ))}
          </select>
          <div className="absolute right-2 pointer-events-none text-[8px] font-bold opacity-60">▼</div>
        </div>
      </td>
      <td className="py-4 px-4 w-32 align-top pt-5 text-center">
        <div className="flex items-center justify-center gap-2 font-bold text-sm opacity-80 text-[#5a5a40]">
          <Skull className="w-4 h-4" />
          {npcCount}
        </div>
      </td>
      <td className="py-4 px-4 align-top pt-5">
        <div className="flex items-center justify-end gap-3">
          <button 
            onClick={() => onDelete(enc)}
            disabled={isDeleting || isUpdating}
            className="text-[#5a5a40] opacity-50 hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-30 p-2 rounded-full flex items-center justify-center w-8 h-8 focus:outline-none focus:ring-2 focus:ring-red-200"
            title="Delete Encounter"
            aria-label="Delete Encounter"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
          
          <button 
            onClick={() => onStart(enc)}
            disabled={isDeleting || isUpdating}
            className="bg-[#c5b358] hover:bg-[#b0a04f] focus:ring-2 focus:ring-offset-1 focus:ring-[#c5b358] text-[#2c2c26] px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all shadow-sm group-hover:shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed outline-none"
          >
            <Swords className="w-3 h-3" />
            View / Run
          </button>
        </div>
      </td>
    </tr>
  );
}

export function EncountersTab({ onSelectEncounter, onSyncRequested }: { onSelectEncounter: (id: string) => void, onSyncRequested: () => Promise<void> }) {
  const { state, updateState } = useAppState();
  const [isAdding, setIsAdding] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleCreateEncounter = async () => {
    setIsAdding(true);
    setGlobalError(null);
    const previousState = state;

    const currentIds = state.encounters.map(e => parseInt(e.id)).filter(n => !isNaN(n));
    const nextIdNum = currentIds.length > 0 ? Math.max(...currentIds) + 1 : 1;
    const optimisticId = nextIdNum.toString();

    const optimisticEncounter: Encounter = {
      id: optimisticId,
      name: `New Encounter ${optimisticId}`,
      location: 'Unknown Location',
      difficultyId: 2,
      difficultyName: 'Medium',
      npcDefinitions: '',
      status: 'planned'
    };

    updateState(prev => ({
      ...prev,
      encounters: [...prev.encounters, optimisticEncounter]
    }));

    try {
      const { addEncounterDB } = await import('../services/dbOperations');
      const realEnc = await addEncounterDB(`New Encounter ${optimisticId}`, 'Unknown Location', 2, 0);

      updateState(prev => ({
        ...prev,
        encounters: prev.encounters.map(e => e.id === optimisticId ? { ...e, id: realEnc.id } : e)
      }));
      
      onSyncRequested().catch(console.error);
    } catch (err: any) {
      console.error("Failed to create encounter", err);
      updateState(previousState);
      
      if (err?.message === "UNAUTHENTICATED" || err?.error === "UNAUTHENTICATED") {
        alert("Your session has expired. Please sign in again.");
        window.location.reload();
      } else {
        setGlobalError("Unable to create a new encounter at this time. Please try again.");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (enc: Encounter) => {
    setIsDeletingId(enc.id);
    setGlobalError(null);
    
    const previousState = state;
    updateState(prev => ({
      ...prev,
      encounters: prev.encounters.filter(e => e.id !== enc.id),
      encounterCombatants: prev.encounterCombatants.filter(ec => ec.encounterId !== enc.id)
    }));

    try {
      await deleteEncounterFully(enc.id);
      onSyncRequested().catch(console.error);
    } catch (err: any) {
      console.error("Failed to delete encounter", err);
      updateState(previousState);
      
      if (err?.message === "UNAUTHENTICATED" || err?.error === "UNAUTHENTICATED") {
        alert("Your session has expired. Please sign in again.");
        window.location.reload();
      } else {
        setGlobalError(`Failed to delete "${enc.name || 'Encounter'}". It might be heavily linked to combatants.`);
      }
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col border border-[#e5e1d8] rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-[#faf9f6] border-b border-[#e5e1d8]">
          <div>
            <h2 className="text-xl font-bold text-[#2c2c26] font-serif">Encounters</h2>
            <p className="text-sm text-[#5a5a40] mt-1 font-sans">Plan and trigger combat scenarios.</p>
          </div>
          <button 
            onClick={handleCreateEncounter}
            disabled={isAdding}
            className="w-full sm:w-auto bg-[#5a5a40] hover:bg-[#3f3f37] focus:ring-2 focus:ring-offset-2 focus:ring-[#5a5a40] text-white px-5 py-2.5 rounded-full text-xs font-bold font-sans uppercase tracking-widest transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-2 outline-none"
          >
            {isAdding ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : "+ New Encounter"}
          </button>
        </div>

        {globalError && (
          <div className="bg-red-50 border-b border-red-100 p-4 flex items-center gap-3 text-red-800 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{globalError}</p>
          </div>
        )}

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left font-sans text-sm table-fixed min-w-[750px]">
            <thead className="bg-white text-[#5a5a40] text-[10px] uppercase tracking-wider font-bold border-b border-[#e5e1d8]">
              <tr>
                <th className="py-4 px-4 w-1/3">Encounter Name</th>
                <th className="py-4 px-4">Location</th>
                <th className="py-4 px-4 w-32">Difficulty</th>
                <th className="py-4 px-4 w-32 text-center">Threats (NPCs)</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f0] bg-white">
              {state.encounters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 px-6 text-center bg-[#faf9f6]">
                    <div className="flex flex-col items-center justify-center text-[#8e8e7a] max-w-sm mx-auto">
                      <Swords className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-base font-serif text-[#2c2c26] mb-1">No upcoming encounters</p>
                      <p className="text-sm">Prepare to ambush your players by creating a new encounter and assigning enemies.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                state.encounters.map(enc => (
                  <EncounterRow 
                    key={enc.id} 
                    enc={enc} 
                    isDeleting={isDeletingId === enc.id}
                    onDelete={handleDelete} 
                    onStart={(e) => onSelectEncounter(e.id)} 
                    onSyncRequested={onSyncRequested} 
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

