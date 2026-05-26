import React from 'react';
import { useNpcLibrary } from './NpcLibraryTab/hooks/useNpcLibrary';
import { BookOpen, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export function NpcLibraryTab() {
  const {
    state,
    syncingId,
    globalError,
    handleResetNpcHp,
  } = useNpcLibrary();

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#e5e1d8] shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#2c2c26] font-serif">NPC Library</h2>
          <p className="text-sm text-[#5a5a40] mt-1 font-sans">
            Reference NPCs loaded from your campaign sheets. Directly inspect stats and health status.
          </p>
        </div>
      </div>

      {globalError && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{globalError}</p>
        </div>
      )}

      {/* NPC Section */}
      <div id="npc-library-section" className="bg-white p-6 rounded-2xl border border-[#e5e1d8] shadow-sm space-y-4">
        <div>
          <h3 id="npc-library-title" className="text-lg font-bold text-[#2c2c26] font-serif flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#c5b358]" />
            Library Content
          </h3>
          <p className="text-xs text-[#5a5a40] mt-0.5 font-sans">
            Reset their HP back to maximum. Any modifications are queued to Google Sheets.
          </p>
        </div>

        {state.npcs.length === 0 ? (
          <div className="py-12 text-center text-[#5a5a40] italic flex flex-col items-center justify-center border border-dashed border-[#e5e1d8] rounded-xl bg-gray-50/50">
            <BookOpen className="w-10 h-10 text-gray-300 mb-2" />
            <span>No NPCs loaded in library. Ensure your sheet is connection-synced.</span>
          </div>
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
    </div>
  );
}
