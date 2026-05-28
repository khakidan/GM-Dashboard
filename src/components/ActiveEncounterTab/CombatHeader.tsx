import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, RefreshCcw, Zap } from 'lucide-react';
import { Encounter } from '../../types';
import { cn } from '../../lib/utils';

interface CombatHeaderProps {
  encounter?: Encounter;
  round: number;
  isMultiTargetMode: boolean;
  onOpenTools: () => void;
  onRollNpcInit: () => void;
  onResetCombat: () => void;
  onNextTurn: () => void;
  onToggleMultiTargetMode: () => void;
  onBack: () => void;
}

export function CombatHeader({
  encounter,
  round,
  isMultiTargetMode,
  onOpenTools,
  onRollNpcInit,
  onResetCombat,
  onNextTurn,
  onToggleMultiTargetMode,
  onBack
}: CombatHeaderProps) {
  return (
    <div className="p-6 bg-[#fdfaf5] border-b border-[#e5e1d8] flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-[10px] text-[#5a5a40] uppercase font-sans font-bold hover:underline tracking-widest">&larr; Back to Encounters</button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#c5b358] font-serif">{encounter ? encounter.name : 'Running Combat'}</h2>
            {encounter && (
              <div className="text-xs text-[#5a5a40] font-sans italic opacity-70">
                {encounter.location} &bull; {encounter.difficultyName}
              </div>
            )}
          </div>
          <div className="bg-white border border-[#e5e1d8] px-3 py-1 rounded-full text-[10px] text-[#5a5a40] uppercase font-sans tracking-wider font-bold">
            Round {round}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap ml-auto">
          <button
            onClick={onToggleMultiTargetMode}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 text-xs font-sans font-bold uppercase rounded-full transition-all mr-2",
              isMultiTargetMode 
                ? "bg-amber-400 text-amber-950 border border-amber-500 shadow-sm" 
                : "bg-white border border-[#e5e1d8] hover:bg-[#f5f5f0] text-[#5a5a40]"
            )}
          >
            <Zap className={cn("w-3 h-3", isMultiTargetMode ? "fill-current" : "")} />
            Multi-Target
          </button>

          <button
            onClick={onOpenTools}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-sans font-bold uppercase bg-white border border-[#e5e1d8] hover:bg-[#f5f5f0] text-[#5a5a40] rounded-full transition-colors mr-2"
          >
            Tools <span className="text-[9px] bg-stone-100 px-1 py-0.5 rounded border border-stone-200">T</span>
          </button>
          <Link
            to="/player-view"
            target="_blank"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-sans font-bold uppercase bg-[#5a5a40] hover:bg-[#3f3f37] text-white rounded-full transition-colors mr-2"
          >
            <Eye className="w-3 h-3" /> Broadcast
          </Link>
          <button
            onClick={onRollNpcInit}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-sans font-bold uppercase bg-white border border-[#e5e1d8] hover:bg-[#f5f5f0] text-[#5a5a40] rounded-full transition-colors"
            title="Roll 1d20 for all NPCs"
          >
            Roll NPC Init <span className="text-[9px] bg-stone-100 px-1 py-0.5 rounded border border-stone-200">R</span>
          </button>
          <button
            onClick={onResetCombat}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-sans font-bold uppercase bg-white border border-[#e5e1d8] hover:bg-[#f5f5f0] text-[#5a5a40] rounded-full transition-colors"
          >
            <RefreshCcw className="w-3 h-3" /> Reset
          </button>
          <button
            onClick={onNextTurn}
            className="flex items-center gap-2 px-4 py-2 text-xs font-sans font-bold uppercase bg-[#c5b358] hover:bg-[#b0a04f] text-[#2c2c26] rounded-full transition-colors ml-2 shadow-sm"
          >
            Next Turn <span className="text-[9px] bg-amber-600/20 px-1 py-0.5 rounded border border-amber-600/30">N</span>
          </button>
        </div>
      </div>
    </div>
  );
}
