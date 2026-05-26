import React, { useState, useEffect } from 'react';
import { useAppState } from '../hooks/useAppState';
import { Encounter } from '../types';
import { Swords, MapPin, Skull, Trash2, Loader2, AlertCircle, Eye, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { deleteEncounterFully } from '../services/dbOperations';
import { motion, AnimatePresence } from 'motion/react';
import { DebouncedInput } from './ui/DebouncedInput';

interface EncounterCardProps {
  enc: Encounter;
  isDeleting: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: (enc: Encounter) => void;
  onStart: (enc: Encounter) => void;
  onSyncRequested: () => Promise<void>;
}

const EncounterCard: React.FC<EncounterCardProps> = ({ 
  enc, 
  isDeleting,
  isExpanded,
  onToggleExpand,
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
        setErrorStatus("Failed to sync changes.");
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
    <div className={cn(
      "bg-white rounded-2xl border border-[#e5e1d8] overflow-hidden flex flex-col group transition-all hover:shadow-md",
      isExpanded ? "border-[#c5b358]/40" : "hover:border-[#c5b358]/20",
      (isUpdating || isDeleting) && "opacity-75 pointer-events-none"
    )}>
      {/* Header Area - Always Visible */}
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <DebouncedInput 
              type="text"
              value={name}
              onChange={(v) => setName(v as string)}
              onBlur={handleUpdate}
              disabled={isUpdating || isDeleting}
              placeholder="Encounter Name"
              className="text-base font-bold text-[#2c2c26] font-serif bg-transparent border border-transparent rounded-lg hover:bg-[#fdfaf5] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none w-full px-2 py-0.5 -ml-2 transition-all placeholder:text-gray-300 disabled:opacity-50"
            />
          </div>
          
          <div className="flex items-center gap-2 pr-2 border-r border-[#f5f5f0]">
             {!isExpanded && (
               <div className="hidden md:flex items-center gap-1.5 px-3 border-r border-[#f5f5f0] whitespace-nowrap">
                 <MapPin className="w-3.5 h-3.5 text-[#c5b358] opacity-70" />
                 <span className="text-[14px] font-bold text-[#5a5a40] opacity-60 uppercase tracking-widest truncate max-w-[200px]">{location}</span>
               </div>
             )}
             <div className={cn(
               "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border",
               difficultyId === 4 ? "bg-purple-100 text-purple-700 border-purple-200" :
               difficultyId === 3 ? "bg-red-100 text-red-700 border-red-200" :
               difficultyId === 2 ? "bg-orange-100 text-orange-700 border-orange-200" :
               "bg-green-100 text-green-700 border-green-200"
             )}>
               {state.difficulties[difficultyId]}
             </div>
             <div className="flex items-center gap-1 text-[10px] font-bold text-[#c5b358]">
               <Skull className="w-3 h-3" />
               {npcCount}
             </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => onStart(enc)}
            className="p-1.5 text-[#c5b358] hover:bg-[#c5b358]/10 rounded-full transition-all"
            title="View Encounter"
          >
            <Swords className="w-4 h-4" />
          </button>
          <button 
            onClick={onToggleExpand}
            className="p-1.5 text-[#5a5a40] opacity-40 hover:opacity-100 hover:bg-[#f5f5f0] rounded-full transition-all"
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
            <div className="p-5 flex flex-col gap-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-[#c5b358] shrink-0" />
                    <DebouncedInput 
                      type="text"
                      value={location}
                      onChange={(v) => setLocation(v as string)}
                      onBlur={handleUpdate}
                      disabled={isUpdating || isDeleting}
                      placeholder="Location"
                      className="text-xs text-[#5a5a40] opacity-80 uppercase tracking-wider font-bold bg-transparent border border-transparent rounded hover:bg-[#fdfaf5] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none px-2 py-0.5 -ml-2 transition-all w-full placeholder:text-gray-300 disabled:opacity-50"
                    />
                  </div>
                </div>
                
                <button 
                  onClick={() => onDelete(enc)}
                  disabled={isDeleting || isUpdating}
                  className="flex items-center justify-center bg-transparent hover:bg-red-50 text-gray-400 hover:text-red-600 w-8 h-8 rounded-full border border-transparent hover:border-red-100 transition-all focus:outline-none focus:ring-2 focus:ring-red-200"
                  title="Delete Encounter"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>

              {errorStatus && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-[10px] p-2 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <p className="font-bold uppercase tracking-tight">{errorStatus}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#fdfaf5] border border-[#e5e1d8] rounded-xl p-3 flex flex-col items-center">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-[#5a5a40] mb-2">Difficulty</div>
                  <div className="relative w-full">
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
                        "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                      )}
                    >
                      {Object.entries(state.difficulties).map(([id, nm]) => (
                        <option key={id} value={id}>{nm}</option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] font-bold opacity-60">▼</div>
                  </div>
                </div>
                <div className="bg-[#fdfaf5] border border-[#e5e1d8] rounded-xl p-3 flex flex-col items-center justify-center">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">NPCs</div>
                  <div className="flex items-center gap-2 font-bold text-lg text-[#2c2c26]">
                    <Skull className="w-4 h-4 text-[#c5b358]" />
                    {npcCount}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => onStart(enc)}
                  disabled={isDeleting || isUpdating}
                  className="w-full bg-[#c5b358] hover:bg-[#b0a04f] text-[#2c2c26] py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Swords className="w-3.5 h-3.5" />
                  View / Run Encounter
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function EncountersTab({ onSelectEncounter, onSyncRequested }: { onSelectEncounter: (id: string) => void, onSyncRequested: () => Promise<void> }) {
  const { state, updateState } = useAppState();
  const [isAdding, setIsAdding] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#e5e1d8] shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#2c2c26] font-serif">Encounters Library</h2>
          <p className="text-sm text-[#5a5a40] mt-1 font-sans">Manage your campaign encounters. Tap to view details or trigger dynamic combat.</p>
        </div>
        <button 
          onClick={handleCreateEncounter}
          disabled={isAdding}
          className="w-full sm:w-auto bg-[#c5b358] hover:bg-[#b0a04f] focus:ring-2 focus:ring-offset-2 focus:ring-[#c5b358] text-[#2c2c26] px-6 py-2.5 rounded-full text-xs font-bold font-sans uppercase tracking-widest transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 outline-none"
        >
          {isAdding ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : "+ New Encounter"}
        </button>
      </div>

      {globalError && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-800 text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{globalError}</p>
        </div>
      )}

      {state.encounters.length === 0 ? (
        <div className="bg-white border border-[#e5e1d8] rounded-2xl py-20 px-6 text-center shadow-sm flex flex-col items-center">
          <Swords className="w-12 h-12 text-[#5a5a40] opacity-20 mb-4" />
          <h3 className="text-lg font-serif font-bold text-[#2c2c26] mb-2">No encounters found</h3>
          <p className="text-sm text-[#5a5a40] max-w-sm mx-auto mb-8">
            Your encounter library is empty. Start by creating a new scenario for your players to overcome.
          </p>
          <button 
            onClick={handleCreateEncounter}
            disabled={isAdding}
            className="bg-[#c5b358] hover:bg-[#b0a04f] text-[#2c2c26] px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-md active:scale-95"
          >
            Create Your First Encounter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {state.encounters.map(enc => (
            <EncounterCard 
              key={enc.id} 
              enc={enc} 
              isDeleting={isDeletingId === enc.id}
              isExpanded={expandedIds.has(enc.id)}
              onToggleExpand={() => toggleExpand(enc.id)}
              onDelete={handleDelete} 
              onStart={(e) => onSelectEncounter(e.id)} 
              onSyncRequested={onSyncRequested} 
            />
          ))}
        </div>
      )}
    </div>
  );
}


