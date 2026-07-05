import React, { useState, useEffect } from 'react';
import { Encounter, EncounterCombatant } from '../../types';
import { Swords, MapPin, Skull, Trash2, Loader2, AlertCircle, ChevronDown, ScrollText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { DebouncedInput } from '../ui/DebouncedInput';
import { EncounterLogModal } from './EncounterLogModal';

export interface EncounterCardProps {
  enc: Encounter;
  isCompleted: boolean;
  isDeleting: boolean;
  encounterCombatants: EncounterCombatant[];
  difficulties: Record<string, string>;
  onDelete: (enc: Encounter) => void;
  onStart: (enc: Encounter) => void;
  onSyncRequested: () => Promise<void>;
  onUpdate: (
    encounterId: string,
    name: string,
    location: string,
    difficultyId: number
  ) => Promise<void>;
}

export const EncounterCard: React.FC<EncounterCardProps> = ({ 
  enc, 
  isCompleted,
  isDeleting,
  encounterCombatants,
  difficulties,
  onDelete, 
  onStart, 
  onSyncRequested,
  onUpdate
}) => {
  const [name, setName] = useState(enc.name || '');
  const [location, setLocation] = useState(enc.location || '');
  const [difficultyId, setDifficultyId] = useState(enc.difficultyId);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  useEffect(() => {
    setName(enc.name || '');
    setLocation(enc.location || '');
    setDifficultyId(enc.difficultyId);
  }, [enc]);

  const handleUpdate = async (newDifficultyId?: number) => {
    const trimmedName = name.trim();
    const trimmedLocation = location.trim();
    const activeDifficultyId = newDifficultyId ?? difficultyId;
    
    // Validate empty required fields
    if (!trimmedName) {
      setName(enc.name || '-');
      return;
    }

    if (
      trimmedName === enc.name && 
      trimmedLocation === enc.location && 
      activeDifficultyId === enc.difficultyId
    ) return;
    
    setIsUpdating(true);
    setErrorStatus(null);
    
    try {
      await onUpdate(enc.id, trimmedName, trimmedLocation, activeDifficultyId);
      onSyncRequested().catch(console.error);
    } catch (err: unknown) {
      console.error("Failed to update encounter", err);
      setName(enc.name);
      setLocation(enc.location);
      setDifficultyId(enc.difficultyId);
      
      const isUnauthenticated = err instanceof Error && err.message === "UNAUTHENTICATED";
      if (isUnauthenticated) {
        toast.error('Session expired — please sign in again.', {
          description: 'Your Google session timed out. Use the Connect & Sync button to reconnect.',
          duration: 8000,
        });
      } else {
        setErrorStatus("Failed to sync changes.");
        setTimeout(() => setErrorStatus(null), 3000);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const npcCount = encounterCombatants
    .filter(ec => ec.encounterId === enc.id && ec.npcId)
    .reduce((sum, current) => sum + current.quantity, 0);

  return (
    <div className={cn(
      "bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden group transition-all hover:shadow-md",
      (isUpdating || isDeleting) && "opacity-75 pointer-events-none",
      isCompleted && "bg-[#f9f8ff] border-[#e2e8f0]"
    )}>
      <div className="p-4 flex flex-col md:flex-row items-stretch md:items-center gap-4 px-6">
        {/* Name Field */}
        <div className="flex-[2] min-w-0">
          <div className="text-[10px] uppercase text-[#8d8db9] font-bold tracking-widest mb-1 md:hidden">Encounter Name</div>
          <DebouncedInput 
            type="text"
            value={name}
            onChange={(v) => setName(v as string)}
            onBlur={() => handleUpdate()}
            disabled={isUpdating || isDeleting}
            placeholder="Encounter Name"
            className="text-base font-bold text-[#0f172a] font-serif bg-transparent border-none focus:ring-0 w-full p-0 truncate disabled:opacity-50"
          />
        </div>

        {/* Location Field */}
        <div className="flex-1 min-w-0 border-t border-[#e2e8f0] pt-4 md:pt-0 md:border-t-0 md:border-l md:pl-4">
          <div className="text-[10px] uppercase text-[#8d8db9] font-bold tracking-widest mb-1 md:hidden">Location</div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#2563eb] shrink-0" />
            <DebouncedInput 
              type="text"
              value={location}
              onChange={(v) => setLocation(v as string)}
              onBlur={() => handleUpdate()}
              disabled={isUpdating || isDeleting}
              placeholder="No Location"
              className="text-xs text-[#8d8db9] font-bold uppercase tracking-widest bg-transparent border-none focus:ring-0 p-0 w-full truncate placeholder:text-gray-300 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Difficulty Select */}
        <div className="w-full md:w-36 border-t border-[#e2e8f0] pt-4 md:pt-0 md:border-t-0 md:border-l md:pl-4">
          <div className="text-[10px] uppercase text-[#8d8db9] font-bold tracking-widest mb-1 md:hidden">Difficulty</div>
          <select 
            value={difficultyId}
            onChange={e => {
              const val = parseInt(e.target.value);
              setDifficultyId(val);
              handleUpdate(val);
            }}
            disabled={isUpdating || isDeleting}
            className={cn(
              "w-full text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border transition-all outline-none cursor-pointer appearance-none text-center",
              difficultyId === 4 ? "bg-purple-50 text-purple-700 border-purple-200" :
              difficultyId === 3 ? "bg-red-50 text-red-700 border-red-200" :
              difficultyId === 2 ? "bg-orange-50 text-orange-700 border-orange-200" :
              "bg-green-50 text-green-700 border-green-200"
            )}
          >
            {Object.entries(difficulties).map(([id, nm]) => (
              <option key={id} value={id}>{nm}</option>
            ))}
          </select>
        </div>

        {/* NPC Count */}
        <div className="flex items-center gap-2 border-t border-[#e2e8f0] pt-4 md:pt-0 md:border-t-0 md:border-l md:pl-4 px-2">
          <div className="text-[10px] uppercase text-[#8d8db9] font-bold tracking-widest md:hidden">NPCs:</div>
          <Skull className="w-4 h-4 text-[#2563eb]" />
          <span className="text-sm font-bold text-[#0f172a]">{npcCount}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 border-t border-[#e2e8f0] pt-4 md:pt-0 md:border-t-0 md:border-l md:pl-4">
          <button 
            onClick={() => setIsLogModalOpen(true)}
            disabled={isDeleting || isUpdating}
            className="flex-1 md:flex-none p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-30 cursor-pointer"
            title="View Past Encounter Logs"
          >
            <ScrollText className="w-5 h-5" />
            <span className="md:hidden text-[10px] font-bold uppercase tracking-widest">Logs</span>
          </button>
          <button 
            onClick={() => onStart(enc)}
            disabled={isDeleting || isUpdating || isCompleted}
            className={cn(
              "flex-1 md:flex-none p-2.5 bg-[#2563eb]/10 hover:bg-[#2563eb]/20 text-[#2563eb] rounded-xl transition-all flex items-center justify-center gap-2",
              (isDeleting || isUpdating || isCompleted) && "opacity-30 cursor-not-allowed"
            )}
            title={isCompleted ? "This encounter has already been completed" : "View / Run Encounter"}
          >
            <Swords className="w-5 h-5" />
            <span className="md:hidden text-[10px] font-bold uppercase tracking-widest">Run</span>
          </button>
          <button 
            onClick={() => onDelete(enc)}
            disabled={isDeleting || isUpdating}
            className="flex-1 md:flex-none p-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-30"
            title="Delete Encounter"
          >
            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
            <span className="md:hidden text-[10px] font-bold uppercase tracking-widest">Delete</span>
          </button>
        </div>

        {errorStatus && (
          <div className="absolute top-0 right-0 p-1" title={errorStatus}>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>

      <EncounterLogModal
        encounterId={enc.id}
        encounterName={name}
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
      />
    </div>
  );
};
