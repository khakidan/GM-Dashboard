import React from 'react';
import { Lock, Ban, TrendingDown, Target, AlertTriangle, ShieldOff } from 'lucide-react';

export interface CombatMechanicsSummaryProps {
  mechanicalSummary: {
    lines: string[];
    speedLocked: boolean;
    speedHalved: boolean;
    hpMaxHalved: boolean;
    actionsBlocked: boolean;
    outgoingDisadvantage: boolean;
    incomingAdvantage: boolean;
    critVulnerable: boolean;
    autoFailStr: boolean;
    autoFailDex: boolean;
    finalOutgoing: 'advantage' | 'disadvantage' | 'normal' | null;
    finalIncoming: 'advantage' | 'disadvantage' | 'normal' | null;
    totalAcModifier: number;
    sources: Record<string, string[]>;
  };
}

export function CombatMechanicsSummary({ mechanicalSummary }: CombatMechanicsSummaryProps) {
  const isSpeedZero = mechanicalSummary.speedLocked;

  if (
    mechanicalSummary.lines.length === 0 &&
    !mechanicalSummary.speedHalved &&
    !mechanicalSummary.hpMaxHalved
  ) {
    return null;
  }

  return (
    <div className="bg-[#f9f8ff]/30 p-4 rounded-xl border border-[#e2e8f0]">
      <label className="block text-xs font-bold uppercase tracking-widest text-[#8d8db9] mb-3">Combat Mechanics</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
        {mechanicalSummary.speedLocked && (
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 mt-0.5 text-slate-700 shrink-0" />
            <div className="min-w-0 font-sans text-sm font-bold text-slate-700">
              Speed: Locked <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.speedLocked.join(', ')})</span>
            </div>
          </div>
        )}
        {mechanicalSummary.speedHalved && !isSpeedZero && (
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 mt-0.5 text-slate-600 shrink-0" />
            <div className="min-w-0 font-sans text-sm font-bold text-slate-600">
              Speed: Halved <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.speedHalved.join(', ')})</span>
            </div>
          </div>
        )}
        {mechanicalSummary.hpMaxHalved && (
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-pink-700 shrink-0" />
            <div className="min-w-0 font-sans text-sm font-bold text-pink-700">
              Max HP: Halved <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.hpMaxHalved.join(', ')})</span>
            </div>
          </div>
        )}
        {mechanicalSummary.actionsBlocked && (
          <div className="flex items-start gap-2">
            <Ban className="w-4 h-4 mt-0.5 text-orange-700 shrink-0" />
            <div className="min-w-0 font-sans text-sm font-bold text-orange-700">
              Actions: Blocked <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.actionsBlocked.join(', ')})</span>
            </div>
          </div>
        )}
        {mechanicalSummary.finalOutgoing === 'disadvantage' && (
          <div className="flex items-start gap-2">
            <TrendingDown className="w-4 h-4 mt-0.5 text-yellow-700 shrink-0" />
            <div className="min-w-0 font-sans text-sm font-bold text-yellow-700">
              Attacks: Disadvantage <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.outgoingDisadvantage.join(', ')})</span>
            </div>
          </div>
        )}
        {mechanicalSummary.finalOutgoing === 'advantage' && (
          <div className="flex items-start gap-2">
            <TrendingDown className="w-4 h-4 mt-0.5 text-green-700 shrink-0 rotate-180" />
            <div className="min-w-0 font-sans text-sm font-bold text-green-700">
              Attacks: Advantage <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.outgoingAdvantage.join(', ')})</span>
            </div>
          </div>
        )}
        {mechanicalSummary.finalOutgoing === 'normal' && (
          <div className="flex items-start gap-2">
            <TrendingDown className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
            <div className="min-w-0 font-sans text-sm font-bold text-gray-500">
              Attacks: Normal (Cancelled) <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.outgoingAdvantage.join(', ')} vs {mechanicalSummary.sources.outgoingDisadvantage.join(', ')})</span>
            </div>
          </div>
        )}
        {mechanicalSummary.finalIncoming === 'advantage' && (
          <div className="flex items-start gap-2">
            <Target className="w-4 h-4 mt-0.5 text-purple-700 shrink-0" />
            <div className="min-w-0 font-sans text-sm font-bold text-purple-700">
              Incoming: Advantage <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.incomingAdvantage.join(', ')})</span>
            </div>
          </div>
        )}
        {mechanicalSummary.finalIncoming === 'disadvantage' && (
          <div className="flex items-start gap-2">
            <Target className="w-4 h-4 mt-0.5 text-blue-700 shrink-0" />
            <div className="min-w-0 font-sans text-sm font-bold text-blue-700">
              Incoming: Disadvantage <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.incomingDisadvantage.join(', ')})</span>
            </div>
          </div>
        )}
        {mechanicalSummary.finalIncoming === 'normal' && (
          <div className="flex items-start gap-2">
            <Target className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
            <div className="min-w-0 font-sans text-sm font-bold text-gray-500">
              Incoming: Normal (Cancelled) <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.incomingAdvantage.join(', ')} vs {mechanicalSummary.sources.incomingDisadvantage.join(', ')})</span>
            </div>
          </div>
        )}
        {mechanicalSummary.critVulnerable && (
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-red-700 shrink-0" />
            <div className="min-w-0 font-sans text-sm font-bold text-red-700">
              Melee hits: Auto-crit <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.critVulnerable.join(', ')})</span>
            </div>
          </div>
        )}
        {mechanicalSummary.autoFailStr && (
          <div className="flex items-start gap-2">
            <ShieldOff className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
            <div className="min-w-0 font-sans text-sm font-bold text-red-600">
              STR saves: Auto-fail <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.autoFailStr.join(', ')})</span>
            </div>
          </div>
        )}
        {mechanicalSummary.autoFailDex && (
          <div className="flex items-start gap-2">
            <ShieldOff className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
            <div className="min-w-0 font-sans text-sm font-bold text-red-600">
              DEX saves: Auto-fail <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.autoFailDex.join(', ')})</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
