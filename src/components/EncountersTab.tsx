import React, { useState, useEffect } from 'react';
import { useAppState } from '../hooks/useAppState';
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
  const { state: appState, updateState } = useAppState();
  const {
    state,
    isAdding,
    isDeletingId,
    globalError,
    handleCreateEncounter,
    handleDelete,
    handleUpdateEncounter,
  } = useEncounters({ onSelectEncounter, onSyncRequested });

  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

  useEffect(() => {
    if (appState.openDialog === 'newEncounter') {
      setIsNewDialogOpen(true);
      updateState(prev => ({ ...prev, openDialog: null }));
    }
  }, [appState.openDialog, updateState]);

  const difficulties: DifficultyLevel[] = Object.entries(state.difficulties).map(([id, name]) => ({
    id: parseInt(id),
    name: name as string
  }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] overflow-hidden flex-1 flex flex-col w-full">
      {/* Page Header */}
      <div className="bg-[#ffffff] border-b border-[#e2e8f0] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Encounters</h1>
            <p className="text-sm text-[#8d8db9] mt-0.5">Manage your campaign encounters. Tap to view details or trigger dynamic combat.</p>
          </div>
          <button 
            onClick={() => setIsNewDialogOpen(true)}
            disabled={isAdding}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#2563eb] hover:bg-[#567eff] text-[#0f172a] text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-lg flex-shrink-0"
            id="new-encounter-btn"
          >
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            New Encounter
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white w-full p-6 overflow-y-auto">
        {globalError && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-800 text-sm shadow-sm mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{globalError}</p>
          </div>
        )}

        {state.encounters.length === 0 ? (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl py-20 px-6 text-center shadow-sm flex flex-col items-center">
          <Swords className="w-12 h-12 text-[#8d8db9] opacity-20 mb-4" />
          <h3 className="text-lg font-serif font-bold text-[#0f172a] mb-2">No encounters found</h3>
          <p className="text-sm text-[#8d8db9] max-w-sm mx-auto mb-8">
            Your encounter library is empty. Start by creating a new scenario for your players to overcome.
          </p>
          <button 
            onClick={() => setIsNewDialogOpen(true)}
            disabled={isAdding}
            className="bg-[#2563eb] hover:bg-[#567eff] text-[#0f172a] px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest transition-all shadow-md active:scale-95"
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
              onUpdate={handleUpdateEncounter}
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
    </div>
  );
}
