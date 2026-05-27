import React, { useState } from 'react';
import { Swords, Loader2, AlertCircle, Plus } from 'lucide-react';
import { useEncounters } from './EncountersTab/hooks/useEncounters';
import { EncounterCard } from './EncountersTab/EncounterCard';
import { NewEncounterDialog } from './EncountersTab/NewEncounterDialog';
import { DifficultyLevel } from '../types';

export function EncountersTab({ 
  onSelectEncounter, 
  onSyncRequested 
}: { 
  onSelectEncounter: (id: string) => void;
  onSyncRequested: () => Promise<void>; 
}) {
  const {
    state,
    isAdding,
    isDeletingId,
    globalError,
    handleCreateEncounter,
    handleDelete,
  } = useEncounters({ onSelectEncounter, onSyncRequested });

  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

  const difficulties: DifficultyLevel[] = Object.entries(state.difficulties).map(([id, name]) => ({
    id: parseInt(id),
    name: name as string
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#e5e1d8] shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#2c2c26] font-serif">Encounters Library</h2>
          <p className="text-sm text-[#5a5a40] mt-1 font-sans">Manage your campaign encounters. Tap to view details or trigger dynamic combat.</p>
        </div>
        <button 
          onClick={() => setIsNewDialogOpen(true)}
          disabled={isAdding}
          className="w-full sm:w-auto bg-[#c5b358] hover:bg-[#b0a04f] focus:ring-2 focus:ring-offset-2 focus:ring-[#c5b358] text-[#2c2c26] px-8 py-3 rounded-full text-sm font-bold font-sans uppercase tracking-widest transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-3 outline-none active:scale-95 disabled:opacity-50"
        >
          {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-4 h-4" />}
          New Encounter
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
            onClick={() => setIsNewDialogOpen(true)}
            disabled={isAdding}
            className="bg-[#c5b358] hover:bg-[#b0a04f] text-[#2c2c26] px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest transition-all shadow-md active:scale-95"
          >
            Create Your First Encounter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {state.encounters.map(enc => (
            <EncounterCard 
              key={enc.id} 
              enc={enc} 
              isDeleting={isDeletingId === enc.id}
              onDelete={handleDelete} 
              onStart={(e) => onSelectEncounter(e.id)} 
              onSyncRequested={onSyncRequested} 
            />
          ))}
        </div>
      )}

      <NewEncounterDialog
        isOpen={isNewDialogOpen}
        onClose={() => setIsNewDialogOpen(false)}
        onConfirm={(data) => {
          handleCreateEncounter(data);
          setIsNewDialogOpen(false);
        }}
        difficulties={difficulties}
      />
    </div>
  );
}
