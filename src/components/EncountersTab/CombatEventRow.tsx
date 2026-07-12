import React from 'react';
import { Flag } from 'lucide-react';
import { CombatEvent, ACTION_TYPE_LABELS } from '../../lib/combatLog';

export function CombatEventRow({ event }: { event: CombatEvent }) {
  let actor = event.actorName || 'Unknown';
  if (actor === 'environment') actor = 'Environment';
  if (actor === 'lair-action') actor = 'Lair Action';
  if (actor === 'unknown') actor = 'Unknown';

  const target = event.targetName || 'Unknown';
  const hpBefore = event.hpBefore ?? 0;
  const hpAfter = event.hpAfter ?? 0;
  const val = event.value ?? 0;
  const condition = event.condition || 'condition';

  let text = '';
  let rowStyle = 'flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg ';
  let icon: React.ReactNode = null;

  switch (event.type) {
    case 'damage': {
      const typeStr = event.damageType ? `${event.damageType} ` : '';
      
      if (event.actionType && event.actionType !== 'attack') {
        const label = ACTION_TYPE_LABELS[event.actionType] || event.actionType;
        
        if (event.actionType === 'lair-action' || event.actionType === 'environmental' || actor === 'Environment' || actor === 'Lair Action' || actor === 'Unknown') {
          const displayLabel = (actor === 'Environment' || actor === 'Lair Action' || actor === 'Unknown') ? actor : label;
          text = `${displayLabel}: ${val} ${typeStr}damage to ${target} (${hpBefore} -> ${hpAfter} HP)`;
        } else {
          text = `${actor} used ${label}: dealt ${val} ${typeStr}damage to ${target} (${hpBefore} -> ${hpAfter} HP)`;
        }
      } else {
        if (actor === 'Environment' || actor === 'Lair Action' || actor === 'Unknown') {
          text = `${actor}: ${val} ${typeStr}damage to ${target} (${hpBefore} -> ${hpAfter} HP)`;
        } else {
          text = `${actor} dealt ${val} ${typeStr}damage to ${target} (${hpBefore} -> ${hpAfter} HP)`;
        }
      }
      
      rowStyle += 'bg-red-50 text-red-600 border border-red-100';
      icon = <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />;
      break;
    }
    case 'healing':
      if (actor === 'Environment' || actor === 'Lair Action' || actor === 'Unknown') {
        text = `${actor}: healed ${target} for ${val} HP (${hpBefore} -> ${hpAfter} HP)`;
      } else {
        text = `${actor} healed ${target} for ${val} HP (${hpBefore} -> ${hpAfter} HP)`;
      }
      rowStyle += 'bg-green-50 text-green-700 border border-green-100';
      icon = <span className="w-1.5 h-1.5 rounded-full bg-green-700 shrink-0" />;
      break;
    case 'condition-applied':
      text = `${actor} applied ${condition} to ${target}`;
      rowStyle += 'text-[#2563eb] bg-[#f9f8ff] border border-[#c0d4ff]';
      icon = <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] shrink-0" />;
      break;
    case 'condition-removed':
      text = `${condition} removed from ${target}`;
      rowStyle += 'text-[#2563eb]/90 bg-[#f9f8ff]/80 border border-[#c0d4ff]/50';
      icon = <span className="w-1.5 h-1.5 rounded-full bg-[#567eff] shrink-0" />;
      break;
    case 'combatant-defeated':
      text = `${target} was defeated`;
      rowStyle += 'bg-[#f9f8ff] text-[#0f172a] border border-[#e2e8f0] font-bold';
      icon = <span className="w-1.5 h-1.5 rounded-full bg-[#0f172a] shrink-0" />;
      break;
    case 'manual-adjustment':
      text = `${target}: HP adjusted ${hpBefore} -> ${hpAfter} (manual correction)`;
      rowStyle += 'bg-[#f9f8ff] text-[#8d8db9] border border-[#e2e8f0]';
      icon = <Flag className="w-3.5 h-3.5 text-[#8d8db9] shrink-0" />;
      break;
    case 'resource-changed': {
      const rName = event.resourceName || 'Resource';
      const rBefore = event.resourceBefore ?? 0;
      const rAfter = event.resourceAfter ?? 0;
      if (rAfter > rBefore) {
        text = `${target}: ${rName} ${rBefore} -> ${rAfter} (restored)`;
      } else {
        text = `${target}: ${rName} ${rBefore} -> ${rAfter}`;
      }
      rowStyle += 'bg-[#f9f8ff] text-[#8d8db9] border border-[#e2e8f0]';
      icon = <Flag className="w-3.5 h-3.5 text-[#8d8db9] shrink-0" />;
      break;
    }
    case 'death-save': {
      const outcome = event.condition === 'success' ? 'Success' : 'Failure';
      const rName = event.resourceName || 'Death Saves';
      const rBefore = event.resourceBefore ?? 0;
      const rAfter = event.resourceAfter ?? 0;
      text = `${target} rolled a death saving throw: ${outcome} (${rName}: ${rBefore} -> ${rAfter})`;
      rowStyle += 'bg-[#f9f8ff] text-[#8d8db9] border border-[#e2e8f0]';
      icon = <Flag className="w-3.5 h-3.5 text-[#8d8db9] shrink-0" />;
      break;
    }
    default:
      return null;
  }

  return (
    <div className={rowStyle}>
      {icon}
      <span className="font-medium">{text}</span>
    </div>
  );
}
