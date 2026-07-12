import React from 'react';
import { Coffee, Loader2, Users, Plus, Moon, Heart } from 'lucide-react';
import { Callout } from './ui/Callout';
import { EmptyState } from './ui/EmptyState';
import { useAppState } from '../hooks/useAppState';
import { useParty } from './PartyTab/hooks/useParty';
import { CharacterCard } from './PartyTab/CharacterCard';
import { LevelUpDialog } from './PartyTab/LevelUpDialog';
import { NewPlayerDialog } from './PartyTab/NewPlayerDialog';
import { LongRestDialog } from './PartyTab/LongRestDialog';
import { ShortRestDialog } from './PartyTab/ShortRestDialog';
import { cn } from '../lib/utils';
import { DashboardLayout } from './ui/DashboardLayout';
import { DEFAULT_STATUSES } from '../lib/constants';

export function PartyTab() {
  const { state: appState, updateState } = useAppState();
  const statuses = Object.keys(appState.statuses).length > 0 ? appState.statuses : DEFAULT_STATUSES;
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
    <DashboardLayout
      title="Party Roster"
      description="Manage your players characters. Any edits here instantly sync back to Google Sheets."
      actions={
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
      }
    >
      {globalError && (
        <Callout severity="error" className="mb-4">
          <p>{globalError}</p>
        </Callout>
      )}

      {state.characters.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No characters found"
          description="Your party roster is empty. Add players to track their health, conditions, and active status during encounters."
          actionLabel={isAddingPlayer ? "Adding Player..." : "+ Add First Player"}
          onAction={() => setIsNewPlayerDialogOpen(true)}
          actionDisabled={isAddingPlayer}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {state.characters.map(char => (
            <CharacterCard 
              key={char.id} 
              character={char} 
              statuses={statuses}
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
    </DashboardLayout>
  );
}
