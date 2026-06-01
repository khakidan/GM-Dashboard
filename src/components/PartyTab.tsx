import React from 'react';
import { Coffee, Loader2, AlertCircle, Users } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import { useParty } from './PartyTab/hooks/useParty';
import { CharacterCard } from './PartyTab/CharacterCard';
import { LevelUpDialog } from './PartyTab/LevelUpDialog';
import { NewPlayerDialog } from './PartyTab/NewPlayerDialog';
import { cn } from '../lib/utils';

export function PartyTab() {
  const { state: appState, updateState } = useAppState();
  const {
    state,
    syncingId,
    isResting,
    isAddingPlayer,
    globalError,
    expandedIds,
    toggleExpand,
    handleCreateCharacter,
    handleLongRest,
    handleDeletePlayer,
    handleUpdate,
    levelUpCharacter,
    setLevelUpCharacter,
    handleLevelUpConfirm,
  } = useParty();

  const [isNewPlayerDialogOpen, setIsNewPlayerDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (appState.openDialog === 'newPlayer') {
      setIsNewPlayerDialogOpen(true);
      updateState(prev => ({ ...prev, openDialog: null }));
    }
  }, [appState.openDialog, updateState]);

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
            onClick={() => setIsNewPlayerDialogOpen(true)}
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
            onClick={() => setIsNewPlayerDialogOpen(true)}
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
              onLevelUpClick={() => setLevelUpCharacter(char)}
            />
          ))}
        </div>
      )}
      {levelUpCharacter && (
        <LevelUpDialog
          character={levelUpCharacter}
          isOpen={levelUpCharacter !== null}
          onClose={() => setLevelUpCharacter(null)}
          onConfirm={handleLevelUpConfirm}
        />
      )}
      <NewPlayerDialog
        isOpen={isNewPlayerDialogOpen}
        onClose={() => setIsNewPlayerDialogOpen(false)}
        onConfirm={(data) => {
          handleCreateCharacter(data);
          setIsNewPlayerDialogOpen(false);
        }}
      />
    </div>
  );
}
