import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, RefreshCcw, Zap, Swords, HelpCircle } from 'lucide-react';
import { Encounter, DamageType } from '../../types';
import { cn } from '../../lib/utils';
import { MultiTargetActionPanel } from './MultiTargetActionPanel';

interface CombatHeaderProps {
  encounter?: Encounter;
  round: number;
  isMultiTargetMode: boolean;
  selectedCount: number;
  onOpenTools: () => void;
  onRollNpcInit: () => void;
  onResetCombat: () => void;
  onNextTurn: () => void;
  onToggleMultiTargetMode: () => void;
  onDeleteSelected: () => void;
  onCancelSelection: () => void;
  onBack: () => void;
  onCallInitiative: () => void;
  initiativeEvent: boolean;
  onOpenCheatSheet?: () => void;
  onApplyDamage?: (amount: number, type: DamageType | null) => void;
  onApplyHealing?: (amount: number) => void;
  onApplyCondition?: (condition: string) => void;
}

export function CombatHeader({
  encounter,
  round,
  isMultiTargetMode,
  selectedCount,
  onOpenTools,
  onRollNpcInit,
  onResetCombat,
  onNextTurn,
  onToggleMultiTargetMode,
  onDeleteSelected,
  onCancelSelection,
  onBack,
  onCallInitiative,
  initiativeEvent,
  onOpenCheatSheet,
  onApplyDamage,
  onApplyHealing,
  onApplyCondition,
}: CombatHeaderProps) {
  return (
    <div className="bg-[#fdfaf5] border-b border-[#e5e1d8] flex flex-col w-full">
      <div className="p-6 flex flex-col gap-4">
        {/* Row 1: Title and Round Information on the left, Back button on the right */}
        <div className="flex flex-row items-start justify-between w-full">
          {/* LEFT SIDE */}
          <div className="flex-1">
            <div className="flex items-center gap-4 flex-wrap h-8">
              <h2 className="text-xl font-bold text-[#c5b358] font-serif">{encounter ? encounter.name : 'Running Combat'}</h2>
              <div className="bg-white border border-[#e5e1d8] px-3 py-1 rounded-full text-[10px] text-[#5a5a40] uppercase font-sans tracking-wider font-bold">
                Round {round}
              </div>
            </div>
            {encounter && (
              <div className="text-xs text-[#5a5a40] font-sans italic opacity-70 mt-1">
                {encounter.location} &bull; {encounter.difficultyName}
              </div>
            )}
          </div>

          {/* RIGHT SIDE */}
          <div className="flex-shrink-0 self-start h-8 flex items-center">
            <button 
              onClick={onBack} 
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0 select-none outline-none focus:outline-none"
            >
              &larr; Back to Encounters
            </button>
          </div>
        </div>

        {/* Row 2: Buttons row */}
        <div className="flex flex-row items-center flex-wrap gap-2 justify-center w-full">
          {/* SELECT BUTTON */}
          <button
            onClick={onToggleMultiTargetMode}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 text-xs font-sans font-bold uppercase rounded-full transition-all cursor-pointer",
              isMultiTargetMode 
                ? "bg-amber-400 text-amber-950 border border-amber-500 shadow-sm" 
                : "bg-white border border-[#e5e1d8] hover:bg-[#f5f5f0] text-[#5a5a40]"
            )}
          >
            <Zap className={cn("w-3 h-3", isMultiTargetMode ? "fill-current" : "")} />
            <span>Select</span>
            <span className={cn(
              "text-[9px] px-1 py-0.5 rounded border font-mono",
              isMultiTargetMode 
                ? "bg-amber-500/20 border-amber-600/30" 
                : "bg-stone-100 border-stone-200"
            )}>S</span>
          </button>

          {/* TOOLS BUTTON */}
          <button
            onClick={onOpenTools}
            className="text-xs font-medium px-2 py-1 border border-gray-300 text-gray-500 rounded hover:text-gray-700 hover:border-gray-400 bg-transparent flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Tools</span>
            <span className="text-[9px] bg-stone-100 px-1 py-0.5 rounded border border-gray-200 font-mono">T</span>
          </button>

          {/* BROADCAST LINK BUTTON */}
          <Link
            to="/player-view"
            target="_blank"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-sans font-bold uppercase bg-[#5a5a40] hover:bg-[#3f3f37] text-white rounded-full transition-colors"
          >
            <Eye className="w-3 h-3" />
            <span>Broadcast</span>
            <span className="text-[9px] bg-white/20 px-1 py-0.5 rounded border border-white/20 font-mono">B</span>
          </Link>

          {/* CALL FOR INITIATIVE BUTTON */}
          <button
            onClick={onCallInitiative}
            disabled={initiativeEvent}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-sans font-bold uppercase bg-amber-50/50 border border-amber-500 text-amber-600 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-all font-bold cursor-pointer"
            title="Trigger full-screen cinematic initiative call for all players"
          >
            <Swords className="w-3 h-3" />
            <span>Call for Initiative</span>
            <span className="text-[9px] bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20 font-mono">C</span>
          </button>

          {/* ROLL NPC INIT BUTTON */}
          <button
            onClick={onRollNpcInit}
            className="text-xs font-medium px-2 py-1 border border-gray-300 text-gray-500 rounded hover:text-gray-700 hover:border-gray-400 bg-transparent flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Roll 1d20 for all NPCs"
          >
            <span>Roll NPC Init</span>
            <span className="text-[9px] bg-stone-100 px-1 py-0.5 rounded border border-gray-200 font-mono">R</span>
          </button>

          {/* RESET BUTTON */}
          <button
            onClick={onResetCombat}
            className="text-xs font-medium px-2 py-1 border border-gray-300 text-gray-500 rounded hover:text-gray-700 hover:border-gray-400 bg-transparent flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>

          {/* NEXT TURN BUTTON */}
          <button
            onClick={onNextTurn}
            className="flex items-center gap-2 px-4 py-2 text-xs font-sans font-bold uppercase bg-[#c5b358] hover:bg-[#b0a04f] text-[#2c2c26] rounded-full transition-colors shadow-sm cursor-pointer"
          >
            <span>Next Turn</span>
            <span className="text-[9px] bg-amber-600/20 px-1 py-0.5 rounded border border-amber-600/30 font-mono">N</span>
          </button>
        </div>
      </div>

      {isMultiTargetMode && (
        <MultiTargetActionPanel
          selectedCount={selectedCount}
          onApplyDamage={onApplyDamage || (() => {})}
          onApplyHealing={onApplyHealing || (() => {})}
          onApplyCondition={onApplyCondition || (() => {})}
          onDeleteSelected={onDeleteSelected}
          onCancelSelection={onCancelSelection}
        />
      )}
    </div>
  );
}
