import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RECHARGE_THRESHOLDS } from '../../lib/constants';

export interface RechargeAbility {
  name: string;
  rechargeOn: number;
  isCharged: boolean;
}

export interface CombatantRechargeTrackerProps {
  rechargeAbilities?: RechargeAbility[];
  onMarkSpent: (abilityName: string) => void;
  onRollRecharge: (abilityName: string, rechargeOn: number) => void;
  combatantId: string;
  recentRechargeRolls?: Record<string, number>;
  isSyncing?: boolean;
}

export function CombatantRechargeTracker({
  rechargeAbilities,
  onMarkSpent,
  onRollRecharge,
  combatantId,
  recentRechargeRolls = {},
  isSyncing = false,
}: CombatantRechargeTrackerProps) {
  if (!rechargeAbilities || rechargeAbilities.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#f9f8ff]/30 p-4 rounded-xl border border-[#e2e8f0] space-y-3" id={`recharge-abilities-sec-${combatantId}`}>
      <label className="block text-xs font-bold uppercase tracking-widest text-[#8d8db9]">Recharge Abilities</label>
      <div className="space-y-2.5">
        {rechargeAbilities.map((ability) => {
          const thresholdText = ability.rechargeOn === RECHARGE_THRESHOLDS.onSix ? '6' : `${ability.rechargeOn}-6`;
          const isCharged = ability.isCharged;
          const rolledNum = recentRechargeRolls[ability.name];

          return (
            <div
              key={ability.name}
              id={`recharge-row-${ability.name.toLowerCase().replace(/\s+/g, '-')}-${combatantId}`}
              className="flex items-center justify-between p-2 rounded-lg bg-[#f9f8ff] border border-[#e2e8f0]/60"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-serif text-sm font-bold truncate text-[#0f172a]">
                  {ability.name}
                </span>
                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f9f8ff] text-[#2563eb] border border-[#c0d4ff]">
                  ⚡ Recharge {thresholdText}
                </span>
                <AnimatePresence>
                  {rolledNum !== undefined && (
                    <motion.span
                      initial={{ scale: 0.3, opacity: 0, rotate: -15 }}
                      animate={{ scale: [1.3, 1], opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-xs shadow-sm flex items-center gap-1"
                    >
                      🎲 Rolled: {rolledNum}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isCharged ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">
                    READY
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                    SPENT
                  </span>
                )}

                {isCharged ? (
                  <button
                    id={`btn-mark-spent-${ability.name.toLowerCase().replace(/\s+/g, '-')}-${combatantId}`}
                    onClick={() => onMarkSpent(ability.name)}
                    disabled={isSyncing}
                    className="px-2 py-1 text-xs font-bold border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded transition-all cursor-pointer"
                  >
                    Mark Spent
                  </button>
                ) : (
                  <button
                    id={`btn-roll-recharge-${ability.name.toLowerCase().replace(/\s+/g, '-')}-${combatantId}`}
                    onClick={() => onRollRecharge(ability.name, ability.rechargeOn)}
                    disabled={isSyncing}
                    className="px-2 py-1 text-xs font-bold border border-[#2563eb] text-[#2563eb] bg-white hover:bg-[#f9f8ff]/85 rounded transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    🎲 Roll Recharge
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
