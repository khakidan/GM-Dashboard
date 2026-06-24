import React from 'react';
import { NpcAction, NpcLegendaryAction } from '../../types';

export function formatActionMeta(action: NpcAction | NpcLegendaryAction): string {
  const parts: string[] = [];

  // Attack / Damage part
  if (action.attackBonus !== undefined && typeof action.attackBonus === 'number' && !isNaN(action.attackBonus)) {
    parts.push(`${action.attackBonus >= 0 ? '+' : ''}${action.attackBonus} to hit`);
  }
  if (action.damage && action.damage.trim() !== '') {
    parts.push(action.damage.trim());
  }

  // Save part
  if (action.saveDC !== undefined && typeof action.saveDC === 'number' && !isNaN(action.saveDC)) {
    const saveTypeStr = action.saveType && action.saveType.trim() !== '' ? ` ${action.saveType.trim()}` : '';
    parts.push(`DC ${action.saveDC}${saveTypeStr} save`);
  } else if (action.saveType && action.saveType.trim() !== '') {
    parts.push(`${action.saveType.trim()} save`);
  }

  // Let's join the core mechanical parts with ' | '
  const coreStr = parts.join(' | ');

  // Now recharge and range
  const finalParts: string[] = [];
  
  // Check if recharge property exists on action
  if ('recharge' in action && action.recharge && action.recharge.trim() !== '') {
    finalParts.push(action.recharge.trim());
  }
  
  if (coreStr !== '') {
    finalParts.push(coreStr);
  }
  
  if ('range' in action && action.range && action.range.trim() !== '') {
    finalParts.push(action.range.trim());
  }

  return finalParts.join(' | ');
}

export interface NpcStatBlockSectionProps {
  title: string;
  items: Array<{
    name: string;
    description: string;
    meta?: string;
  }>;
}

export const NpcStatBlockSection: React.FC<NpcStatBlockSectionProps> = ({ title, items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#5a5a40] border-b border-[#e5e1d8] pb-1 mb-2">
        {title}
      </h4>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="leading-snug">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-semibold text-[#2c2c26] italic">
                {item.name}
              </span>
              {item.meta && (
                <span className="text-xs text-[#5a5a40] font-medium">
                  {item.meta}
                </span>
              )}
            </div>
            <p className="text-sm text-[#2c2c26] leading-snug whitespace-pre-wrap mt-0.5">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
