import React from 'react';
import { buildConditionSummary, CONDITION_OPTIONS, EFFECT_OPTIONS } from '../../lib/conditions';
import { Combatant } from '../../types';
import { Badge } from '../ui/Badge';

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
          {isSpeedZero && <Badge color="slate" size="compact">SPD 0</Badge>}
          {mechanicalSummary.speedHalved && !isSpeedZero && <Badge color="slate" size="compact">SPD ½</Badge>}
          {mechanicalSummary.hpMaxHalved && <Badge color="pink" size="compact">HP ½</Badge>}
          {isIncapacitated && <Badge color="orange" size="compact">NO ACT</Badge>}
          {mechanicalSummary.finalOutgoing === 'disadvantage' && <Badge color="yellow" size="compact">DISADV</Badge>}
          {mechanicalSummary.finalOutgoing === 'advantage' && <Badge color="green" size="compact">ADVAN</Badge>}
          {mechanicalSummary.finalOutgoing === 'normal' && <Badge color="gray" size="compact">CANCELLED</Badge>}
          {mechanicalSummary.finalIncoming === 'advantage' && <div className="w-2 h-2 rounded-full bg-purple-500" title="Attacks against this creature have advantage" />}
          {isCritVulnerable && <Badge color="red" size="compact">AUTO CRIT</Badge>}
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
