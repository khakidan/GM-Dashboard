import React from 'react';
import { buildConditionSummary } from '../../lib/conditions';
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
  const isConcentrating = conditionList.includes('concentrating');
  const isDexDis = mechanicalSummary.dexSaveDisadvantage;
  const isSaveDis = mechanicalSummary.allSaveDisadvantage;
  
  const hasMechanicalBadges =
    isSpeedZero ||
    isIncapacitated ||
    mechanicalSummary.finalOutgoing !== null ||
    mechanicalSummary.finalIncoming !== null ||
    isCritVulnerable ||
    isConcentrating ||
    mechanicalSummary.speedHalved ||
    mechanicalSummary.hpMaxHalved ||
    isDexDis ||
    isSaveDis;

  if (!hasMechanicalBadges) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {isSpeedZero && <Badge color="slate" size="default" className="text-sm">SPD 0</Badge>}
      {mechanicalSummary.speedHalved && !isSpeedZero && <Badge color="slate" size="default" className="text-sm">SPD ½</Badge>}
      {mechanicalSummary.hpMaxHalved && <Badge color="pink" size="default" className="text-sm">HP ½</Badge>}
      {isIncapacitated && <Badge color="orange" size="default" className="text-sm">NO ACT</Badge>}
      {isIncapacitated && <Badge color="orange" size="default" className="text-sm">NO REACT</Badge>}
      {mechanicalSummary.finalOutgoing === 'disadvantage' && <Badge color="yellow" size="default" className="text-sm">DISADV</Badge>}
      {mechanicalSummary.finalOutgoing === 'advantage' && <Badge color="green" size="default" className="text-sm">ADVAN</Badge>}
      {mechanicalSummary.finalOutgoing === 'normal' && <Badge color="gray" size="default" className="text-sm">CANCELLED</Badge>}
      {mechanicalSummary.finalIncoming === 'advantage' && <Badge color="purple" size="default" className="text-sm">VULNERABLE</Badge>}
      {mechanicalSummary.finalIncoming === 'disadvantage' && <Badge color="blue" size="default" className="text-sm">HARD TO HIT</Badge>}
      {mechanicalSummary.finalIncoming === 'normal' && <Badge color="gray" size="default" className="text-sm">CANCELLED</Badge>}
      {isDexDis && !isSaveDis && <Badge color="yellow" size="default" className="text-sm">DEX DIS</Badge>}
      {isSaveDis && <Badge color="yellow" size="default" className="text-sm">SAVE DIS</Badge>}
      {isCritVulnerable && <Badge color="red" size="default" className="text-sm">AUTO CRIT</Badge>}
      {isConcentrating && <Badge color="purple" size="default" className="text-sm">CON</Badge>}
    </div>
  );
}

