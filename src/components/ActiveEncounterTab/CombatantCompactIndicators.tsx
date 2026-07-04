import React from 'react';
import { Zap, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Combatant } from '../../types';

interface CombatantCompactIndicatorsProps {
  type: 'pc' | 'npc';
  c: Combatant;
  onMarkSpent?: (abilityName: string) => void;
}

export const CombatantCompactIndicators = ({
  type,
  c,
  onMarkSpent,
}: CombatantCompactIndicatorsProps) => {
  if (type !== 'npc') return null;

  const hasLegendaryResources = c.legendaryActions || c.legendaryResistances;
  const hasRechargeAbilities = c.rechargeAbilities && c.rechargeAbilities.length > 0;

  if (!hasLegendaryResources && !hasRechargeAbilities) return null;

  return (
    <div data-testid="compact-indicators" className="flex flex-row flex-wrap items-center gap-1 font-sans text-[9px] font-bold uppercase tracking-wide">
      {/* Legendary Actions */}
      {c.legendaryActions && (
        <div 
          data-testid="legendary-actions-indicator"
          className={cn(
            "inline-flex items-center gap-1 px-1.5 py-[2px] rounded-full border select-none shrink-0",
            c.legendaryActions.remaining === c.legendaryActions.max
              ? "bg-[#f9f8ff] border-amber-300 text-[#567eff] font-sans font-bold text-[9px] uppercase tracking-wide"
              : c.legendaryActions.remaining > 0
              ? "bg-[#f9f8ff] border-amber-200 text-[#2563eb] font-sans font-bold text-[9px] uppercase tracking-wide"
              : "bg-gray-100 border-gray-200 text-gray-400 font-sans font-bold text-[9px] uppercase tracking-wide"
          )}
        >
          <Zap className="w-3 h-3 fill-current" />
          <span>{c.legendaryActions.remaining}/{c.legendaryActions.max}</span>
        </div>
      )}

      {/* Legendary Resistances */}
      {c.legendaryResistances && (
        <div 
          data-testid="legendary-resistances-indicator"
          className={cn(
            "inline-flex items-center gap-1 px-1.5 py-[2px] rounded-full border select-none shrink-0",
            c.legendaryResistances.remaining === c.legendaryResistances.max
              ? "bg-blue-50 border-blue-300 text-blue-700 font-sans font-bold text-[9px] uppercase tracking-wide"
              : c.legendaryResistances.remaining > 0
              ? "bg-blue-50 border-blue-200 text-blue-500 font-sans font-bold text-[9px] uppercase tracking-wide"
              : "bg-gray-100 border-gray-200 text-gray-400 font-sans font-bold text-[9px] uppercase tracking-wide"
          )}
        >
          <Shield className="w-3 h-3" />
          <span>{c.legendaryResistances.remaining}/{c.legendaryResistances.max}</span>
        </div>
      )}

      {/* Recharge Abilities */}
      {c.rechargeAbilities && c.rechargeAbilities.map((ability) => {
        const truncated = ability.name.length <= 12 ? ability.name : ability.name.slice(0, 12) + '...';
        return (
          <button
            key={ability.name}
            data-testid={`recharge-indicator-${ability.name.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={(e) => {
              e.stopPropagation();
              if (ability.isCharged && onMarkSpent) {
                onMarkSpent(ability.name);
              }
            }}
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-[2px] rounded-full border select-none shrink-0 font-sans font-bold text-[9px] uppercase tracking-wide transition-all outline-none focus:outline-none",
              ability.isCharged
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 cursor-pointer hover:bg-emerald-100"
                : "bg-red-50 border-red-200 text-red-700 cursor-default"
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", ability.isCharged ? "bg-emerald-500" : "bg-red-400")} />
            <span>{truncated}</span>
          </button>
        );
      })}
    </div>
  );
};
