import React from 'react';
import { Zap, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Combatant } from '../../types';
import { ToggleBadge } from '../ui/ToggleBadge';

interface CombatantCompactIndicatorsProps {
  type: 'pc' | 'npc';
  c: Combatant;
  onUpdateCombatant: (updates: Partial<Combatant>) => void;
  onMarkSpent?: (abilityName: string) => void;
}

export const CombatantCompactIndicators = ({
  type,
  c,
  onUpdateCombatant,
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
              ? "bg-[#f9f8ff] border-amber-300 text-[#567eff]"
              : c.legendaryActions.remaining > 0
              ? "bg-[#f9f8ff] border-amber-200 text-[#2563eb]"
              : "bg-gray-100 border-gray-200 text-gray-400"
          )}
        >
          <Zap className="w-3 h-3 fill-current" />
          <div className="flex items-center gap-1 ml-0.5">
            {Array.from({ length: c.legendaryActions.max }).map((_, i) => {
              const isFilled = i < c.legendaryActions!.remaining;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newValue = isFilled ? i : i + 1;
                    onUpdateCombatant({
                      legendaryActions: {
                        ...c.legendaryActions!,
                        remaining: newValue,
                      },
                    });
                  }}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all focus:outline-none cursor-pointer",
                    isFilled ? "bg-current" : "bg-current/25 hover:bg-current/40"
                  )}
                  aria-label={`Legendary Action ${i + 1}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Legendary Resistances */}
      {c.legendaryResistances && (
        <div 
          data-testid="legendary-resistances-indicator"
          className={cn(
            "inline-flex items-center gap-1 px-1.5 py-[2px] rounded-full border select-none shrink-0",
            c.legendaryResistances.remaining === c.legendaryResistances.max
              ? "bg-blue-50 border-blue-300 text-blue-700"
              : c.legendaryResistances.remaining > 0
              ? "bg-blue-50 border-blue-200 text-blue-500"
              : "bg-gray-100 border-gray-200 text-gray-400"
          )}
        >
          <Shield className="w-3 h-3" />
          <div className="flex items-center gap-1 ml-0.5">
            {Array.from({ length: c.legendaryResistances.max }).map((_, i) => {
              const isFilled = i < c.legendaryResistances!.remaining;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newValue = isFilled ? i : i + 1;
                    onUpdateCombatant({
                      legendaryResistances: {
                        ...c.legendaryResistances!,
                        remaining: newValue,
                      },
                    });
                  }}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all focus:outline-none cursor-pointer",
                    isFilled ? "bg-current" : "bg-current/25 hover:bg-current/40"
                  )}
                  aria-label={`Legendary Resistance ${i + 1}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Recharge Abilities */}
      {c.rechargeAbilities && c.rechargeAbilities.map((ability) => {
        const truncated = ability.name.length <= 12 ? ability.name : ability.name.slice(0, 12) + '...';
        return (
          <ToggleBadge
            key={ability.name}
            data-testid={`recharge-indicator-${ability.name.toLowerCase().replace(/\s+/g, '-')}`}
            active={ability.isCharged}
            activeColor="emerald"
            inactiveColor="red"
            size="compact"
            onClick={(e) => {
              e.stopPropagation();
              if (ability.isCharged && onMarkSpent) {
                onMarkSpent(ability.name);
              }
            }}
            disabled={!ability.isCharged}
            className="gap-1 font-sans text-[9px] tracking-wide"
          >
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", ability.isCharged ? "bg-emerald-500" : "bg-red-400")} />
            <span>{truncated}</span>
          </ToggleBadge>
        );
      })}
    </div>
  );
};
