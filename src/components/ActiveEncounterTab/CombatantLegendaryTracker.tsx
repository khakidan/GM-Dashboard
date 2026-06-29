import React from 'react';
import { Shield, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CombatantLegendaryTrackerProps {
  legendaryActions?: { max: number; remaining: number };
  legendaryResistances?: { max: number; remaining: number };
  onSpendAction: () => void;
  onSpendResistance: () => void;
  onRestoreActions: () => void;
  onRestoreResistances: () => void;
  combatantId: string;
  isSyncing?: boolean;
}

export function CombatantLegendaryTracker({
  legendaryActions,
  legendaryResistances,
  onSpendAction,
  onSpendResistance,
  onRestoreActions,
  onRestoreResistances,
  combatantId,
  isSyncing = false,
}: CombatantLegendaryTrackerProps) {
  if (!legendaryActions && !legendaryResistances) {
    return null;
  }

  return (
    <>
      {/* Legendary Resistances Section */}
      {legendaryResistances && (
        <div className="bg-[#f9f8ff]/30 p-4 rounded-xl border border-[#e2e8f0] space-y-3" id={`legendary-resistances-sec-${combatantId}`}>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-widest text-[#8d8db9]">Legendary Resistances</label>
            <button
              id={`btn-restore-resistances-${combatantId}`}
              onClick={onRestoreResistances}
              disabled={isSyncing}
              className="px-2 py-1 text-[10px] font-bold border border-[#2563eb] text-[#2563eb] bg-white hover:bg-[#f9f8ff]/85 rounded transition-all cursor-pointer shadow-sm"
            >
              Restore All
            </button>
          </div>
          <div className="flex flex-col gap-1.5 bg-[#f9f8ff] p-2.5 rounded-lg border border-[#e2e8f0]/60">
            <div className="flex items-center gap-2" id={`resistances-pips-container-${combatantId}`}>
              {Array.from({ length: legendaryResistances.max }).map((_, idx) => {
                const isFilled = idx < legendaryResistances.remaining;
                return (
                  <button
                    key={idx}
                    id={`btn-resistance-pip-${idx}-${combatantId}`}
                    onClick={() => isFilled && onSpendResistance()}
                    disabled={isSyncing || !isFilled}
                    className={cn(
                      "transition-transform duration-100 focus:outline-none",
                      isFilled ? "cursor-pointer hover:scale-110" : "cursor-default"
                    )}
                  >
                    <Shield
                      className={cn(
                        "w-5 h-5 transition-colors",
                        isFilled ? "fill-[#2563eb] text-[#2563eb]" : "text-stone-300"
                      )}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-[10px] font-bold text-stone-500 font-sans" id={`resistances-status-text-${combatantId}`}>
              {legendaryResistances.remaining} / {legendaryResistances.max} remaining
            </span>
          </div>
        </div>
      )}

      {/* Legendary Actions Section */}
      {legendaryActions && (
        <div className="bg-[#f9f8ff]/30 p-4 rounded-xl border border-[#e2e8f0] space-y-3" id={`legendary-actions-sec-${combatantId}`}>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-widest text-[#8d8db9]">Legendary Actions</label>
            <button
              id={`btn-restore-actions-${combatantId}`}
              onClick={onRestoreActions}
              disabled={isSyncing}
              className="px-2 py-1 text-[10px] font-bold border border-[#2563eb] text-[#2563eb] bg-white hover:bg-[#f9f8ff]/85 rounded transition-all cursor-pointer shadow-sm"
            >
              Restore All
            </button>
          </div>
          <div className="flex flex-col gap-1.5 bg-[#f9f8ff] p-2.5 rounded-lg border border-[#e2e8f0]/60">
            <div className="flex items-center gap-2" id={`actions-pips-container-${combatantId}`}>
              {Array.from({ length: legendaryActions.max }).map((_, idx) => {
                const isFilled = idx < legendaryActions.remaining;
                return (
                  <button
                    key={idx}
                    id={`btn-action-pip-${idx}-${combatantId}`}
                    onClick={() => isFilled && onSpendAction()}
                    disabled={isSyncing || !isFilled}
                    className={cn(
                      "transition-transform duration-100 focus:outline-none",
                      isFilled ? "cursor-pointer hover:scale-110" : "cursor-default"
                    )}
                  >
                    <Zap
                      className={cn(
                        "w-5 h-5 transition-colors",
                        isFilled ? "fill-[#2563eb] text-[#2563eb]" : "text-stone-300"
                      )}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-[10px] font-bold text-stone-500 font-sans" id={`actions-status-text-${combatantId}`}>
              {legendaryActions.remaining} / {legendaryActions.max} remaining
            </span>
          </div>
        </div>
      )}
    </>
  );
}
