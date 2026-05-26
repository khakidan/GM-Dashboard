import React from 'react';
import { Coffee, Loader2, AlertCircle, Users } from 'lucide-react';
import { useParty } from './PartyTab/hooks/useParty';
import { CharacterCard } from './PartyTab/CharacterCard';
import { LevelUpDialog } from './PartyTab/LevelUpDialog';
import { cn } from '../lib/utils';

export function PartyTab() {
  const {
    state,
    syncingId,
    isResting,
    isAddingPlayer,
    globalError,
    expandedIds,
    toggleExpand,
    handleAddPlayer,
    handleLongRest,
    handleDeletePlayer,
    handleUpdate,
    handleResetNpcHp,
    levelUpCharacter,
    setLevelUpCharacter,
    handleLevelUpConfirm,
  } = useParty();

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
              onLevelUpClick={() => setLevelUpCharacter(char)}
            />
          ))}
        </div>
      )}

      {/* NPC Section */}
      <div id="npc-library-section" className="bg-white p-6 rounded-2xl border border-[#e5e1d8] shadow-sm space-y-4">
        <div>
          <h2 id="npc-library-title" className="text-xl font-bold text-[#2c2c26] font-serif">NPC Library</h2>
          <p className="text-sm text-[#5a5a40] mt-1 font-sans">
            Reference NPCs loaded from your library. Reset their HP back to maximum here.
          </p>
        </div>

        {state.npcs.length === 0 ? (
          <p className="text-sm text-[#5a5a40] italic">No NPCs loaded in library.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.npcs.map(npc => {
              const needsReset = npc.currentHp < npc.maxHp;
              return (
                <div 
                  key={npc.id} 
                  id={`npc-card-${npc.id}`}
                  className={cn(
                    "p-4 bg-white border rounded-xl flex items-center justify-between gap-4 transition-all hover:shadow-sm",
                    syncingId === npc.id ? "border-[#c5b358]" : "border-[#e5e1d8]"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#2c2c26] font-serif truncate">{npc.name}</span>
                      <span className="text-[10px] text-[#5a5a40] font-bold whitespace-nowrap">(AC {npc.ac})</span>
                    </div>
                    <div className="text-[11px] text-[#5a5a40] mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <span>HP: <strong className={npc.currentHp <= 0 ? "text-red-600" : "text-[#2c2c26]"}>{npc.currentHp}</strong>/{npc.maxHp}</span>
                      {npc.conditions && (
                        <span className="inline-block px-1.5 py-0.2 bg-red-50 text-red-700 border border-red-100 rounded text-[9px] font-bold">
                          {npc.conditions}
                        </span>
                      )}
                    </div>
                  </div>
                  {needsReset && (
                    <button
                      id={`btn-reset-hp-${npc.id}`}
                      onClick={() => handleResetNpcHp(npc.id, npc.maxHp)}
                      disabled={syncingId === npc.id}
                      className="px-3 py-1.5 bg-[#c5b358]/10 hover:bg-[#c5b358]/20 text-[#2c2c26] border border-[#c5b358]/25 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap disabled:opacity-50"
                    >
                      Reset HP
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {levelUpCharacter && (
        <LevelUpDialog
          character={levelUpCharacter}
          isOpen={levelUpCharacter !== null}
          onClose={() => setLevelUpCharacter(null)}
          onConfirm={handleLevelUpConfirm}
        />
      )}
    </div>
  );
}
