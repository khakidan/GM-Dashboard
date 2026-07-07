import React from 'react';
import { Coffee, Loader2, AlertCircle, Users, Plus, Moon, Heart } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import { useParty } from './PartyTab/hooks/useParty';
import { CharacterCard } from './PartyTab/CharacterCard';
import { LevelUpDialog } from './PartyTab/LevelUpDialog';
import { NewPlayerDialog } from './PartyTab/NewPlayerDialog';
import { LongRestDialog } from './PartyTab/LongRestDialog';
import { ShortRestDialog } from './PartyTab/ShortRestDialog';
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
    handleShortRest,
    handleDeletePlayer,
    handleUpdate,
    levelUpCharacter,
    setLevelUpCharacter,
    handleLevelUpConfirm,
  } = useParty();

  const [isNewPlayerDialogOpen, setIsNewPlayerDialogOpen] = React.useState(false);
  const [isLongRestOpen, setIsLongRestOpen] = React.useState(false);
  const [isShortRestOpen, setIsShortRestOpen] = React.useState(false);

  React.useEffect(() => {
    if (appState.openDialog === 'newPlayer') {
      setIsNewPlayerDialogOpen(true);
      updateState(prev => ({ ...prev, openDialog: null }));
    } else if (appState.openDialog === 'shortRest') {
      setIsShortRestOpen(true);
      updateState(prev => ({ ...prev, openDialog: null }));
    } else if (appState.openDialog === 'longRest') {
      setIsLongRestOpen(true);
      updateState(prev => ({ ...prev, openDialog: null }));
    }
  }, [appState.openDialog, updateState]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] overflow-hidden flex-1 flex flex-col w-full">
      {/* Page Header */}
      <div className="bg-[#ffffff] border-b border-[#e2e8f0] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Party Roster</h1>
            <p className="text-sm text-[#8d8db9] mt-0.5">Manage your players characters. Any edits here instantly sync back to Google Sheets.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsLongRestOpen(true)}
              disabled={isResting || state.characters.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e2e8f0] hover:border-[#2563eb] text-[#8d8db9] hover:text-[#0f172a] text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm disabled:opacity-50"
              id="party-long-rest-btn"
            >
              {isResting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Coffee className="w-3.5 h-3.5 text-[#2563eb]" />}
              Long Rest
            </button>
            <button
              onClick={() => setIsShortRestOpen(true)}
              disabled={isResting || state.characters.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e2e8f0] hover:border-[#2563eb] text-[#8d8db9] hover:text-[#0f172a] text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm disabled:opacity-50"
              id="party-short-rest-btn"
            >
              <Coffee className="w-3.5 h-3.5 text-[#2563eb]" />
              Short Rest
            </button>
            <button
              onClick={() => setIsNewPlayerDialogOpen(true)}
              disabled={isAddingPlayer}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#2563eb] hover:bg-[#567eff] focus:ring-1 focus:ring-[#2563eb] outline-none text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              id="add-player-btn"
            >
              {isAddingPlayer ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding...</> : <><Plus className="w-4 h-4" /> Player</>}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white w-full p-6 overflow-y-auto">
        {globalError && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-800 text-sm mb-4">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{globalError}</p>
          </div>
        )}

        {state.characters.length === 0 ? (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl py-16 px-6 text-center shadow-sm flex flex-col items-center">
          <Users className="w-12 h-12 text-[#8d8db9] opacity-20 mb-4" />
          <h3 className="text-lg font-serif font-bold text-[#0f172a] mb-2">No characters found</h3>
          <p className="text-sm text-[#8d8db9] max-w-sm mx-auto mb-6">
            Your party roster is empty. Add players to track their health, conditions, and active status during encounters.
          </p>
          <button
            onClick={() => setIsNewPlayerDialogOpen(true)}
            disabled={isAddingPlayer}
            className="flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-[#567eff] text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563eb] shadow-sm disabled:opacity-50"
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
      {isLongRestOpen && (
        <LongRestDialog
          isOpen={isLongRestOpen}
          characters={state.characters}
          onClose={() => setIsLongRestOpen(false)}
          onConfirm={async (selectedIds) => {
            setIsLongRestOpen(false);
            await handleLongRest(selectedIds);
          }}
        />
      )}
      {isShortRestOpen && (
        <ShortRestDialog
          isOpen={isShortRestOpen}
          characters={state.characters}
          onClose={() => setIsShortRestOpen(false)}
          onConfirm={async (results) => {
            setIsShortRestOpen(false);
            await handleShortRest(results);
          }}
        />
      )}
      </div>
    </div>
  );
}
