import React from 'react';
import { buildConditionSummary, CONDITION_OPTIONS, EFFECT_OPTIONS } from '../../lib/conditions';
import { Combatant } from '../../types';

export interface CombatantCardBadgesProps {
  conditions: string;
  combatant: Combatant;
}

export function CombatantCardBadges({
  conditions,
  combatant,
}: CombatantCardBadgesProps) {
  const conditionList = (conditions || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const mechanicalSummary = buildConditionSummary(conditionList);

  const isSpeedZero = mechanicalSummary.speedLocked;
  const isIncapacitated = mechanicalSummary.actionsBlocked;
  const isCritVulnerable = mechanicalSummary.critVulnerable;
  
  const hasMechanicalBadges =
    isSpeedZero ||
    isIncapacitated ||
    mechanicalSummary.finalOutgoing !== null ||
    mechanicalSummary.finalIncoming !== null ||
    isCritVulnerable ||
    mechanicalSummary.speedHalved ||
    mechanicalSummary.hpMaxHalved;

  const conditionOptionsLower = CONDITION_OPTIONS.map(o => o.toLowerCase());
  const effectOptionsLower = EFFECT_OPTIONS.map(o => o.toLowerCase());

  const hasActiveConditions = conditionList.some(chip => conditionOptionsLower.includes(chip));
  const hasActiveEffects = conditionList.some(chip => effectOptionsLower.includes(chip));

  if (!hasMechanicalBadges && !hasActiveConditions && !hasActiveEffects) {
    return null;
  }

  return (
    <>
      {hasMechanicalBadges && (
        <div className="flex flex-wrap items-center gap-1">
          {isSpeedZero && <span className="bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-[2px] rounded-full font-sans text-[9px] font-bold uppercase tracking-wide">SPD 0</span>}
          {mechanicalSummary.speedHalved && !isSpeedZero && <span className="bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-[2px] rounded-full font-sans text-[9px] font-bold uppercase tracking-wide">SPD ½</span>}
          {mechanicalSummary.hpMaxHalved && <span className="bg-pink-100 text-pink-700 border border-pink-200 px-1.5 py-[2px] rounded-full font-sans text-[9px] font-bold uppercase tracking-wide">HP ½</span>}
          {isIncapacitated && <span className="bg-orange-100 text-orange-700 border border-orange-200 px-1.5 py-[2px] rounded-full font-sans text-[9px] font-bold uppercase tracking-wide">NO ACT</span>}
          {mechanicalSummary.finalOutgoing === 'disadvantage' && <span className="bg-yellow-100 text-yellow-700 border border-yellow-200 px-1.5 py-[2px] rounded-full font-sans text-[9px] font-bold uppercase tracking-wide">DISADV</span>}
          {mechanicalSummary.finalOutgoing === 'advantage' && <span className="bg-green-100 text-green-700 border border-green-200 px-1.5 py-[2px] rounded-full font-sans text-[9px] font-bold uppercase tracking-wide">ADVAN</span>}
          {mechanicalSummary.finalOutgoing === 'normal' && <span className="bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-[2px] rounded-full font-sans text-[9px] font-bold uppercase tracking-wide">CANCELLED</span>}
          {mechanicalSummary.finalIncoming === 'advantage' && <div className="w-2 h-2 rounded-full bg-purple-500" title="Attacks against this creature have advantage" />}
          {isCritVulnerable && <span className="bg-red-100 text-red-700 border border-red-200 px-1.5 py-[2px] rounded-full font-sans text-[9px] font-bold uppercase tracking-wide">AUTO CRIT</span>}
        </div>
      )}
      {(hasActiveConditions || hasActiveEffects) && (
        <div className="flex gap-1 items-center">
          {hasActiveConditions && <div className="w-2 h-2 rounded-full bg-red-500" title="Active conditions" />}
          {hasActiveEffects && <div className="w-2 h-2 rounded-full bg-blue-500" title="Active effects" />}
        </div>
      )}
    </>
  );
}
