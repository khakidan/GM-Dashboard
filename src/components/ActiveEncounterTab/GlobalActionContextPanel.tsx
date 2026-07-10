import React from 'react';
import { ActionType } from '../../lib/combatLog';
import { cn } from '../../lib/utils';
import { Combatant } from '../../types';

export interface GlobalActionContextPanelProps {
  combatStarted: boolean;
  actionContext: { sourceOverride: string | null; actionType: ActionType };
  combatants: Combatant[];
  activeTurnId: string | null;
  setActionContext: (sourceOverride: string | null, actionType: ActionType) => void;
}

export function GlobalActionContextPanel({
  combatStarted,
  actionContext,
  combatants,
  activeTurnId,
  setActionContext,
}: GlobalActionContextPanelProps) {
  if (!combatStarted) return null;

  const activeTurnCombatant = combatants.find(c => c.id === activeTurnId);
  const activeTurnName = activeTurnCombatant?.name || 'Unknown';

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    // If the user selects the active turn combatant (the default), set sourceOverride back to null
    if (val === activeTurnId) {
      setActionContext(null, actionContext.actionType);
    } else {
      setActionContext(val, actionContext.actionType);
    }
  };

  const handleTypeChange = (type: ActionType) => {
    setActionContext(actionContext.sourceOverride, type);
  };

  const actionTypes: { label: string; value: ActionType }[] = [
    { label: 'Attack', value: 'attack' },
    { label: 'Opp. Attack', value: 'opportunity-attack' },
    { label: 'Lair', value: 'lair-action' },
    { label: 'Legendary', value: 'legendary-action' },
    { label: 'Reaction', value: 'reaction' },
    { label: 'Spell', value: 'spell' },
    { label: 'Environment', value: 'environmental' },
    { label: 'Other', value: 'other' },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-2 w-full">
      <div className="flex items-center gap-2">
        <span className="text-[#475569] text-xs font-semibold shrink-0">
          Source:
        </span>
        <select
          value={actionContext.sourceOverride || activeTurnId || 'unknown'}
          onChange={handleSourceChange}
          className="h-7 text-xs font-medium bg-white border border-[#e2e8f0] rounded px-2 outline-none focus:border-[#2563eb]"
        >
          <option value={activeTurnId || 'unknown'}>{activeTurnName} (Active Turn)</option>
          <optgroup label="Combatants">
            {combatants.map(c => {
              if (c.id === activeTurnId) return null;
              return (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              );
            })}
          </optgroup>
          <optgroup label="Other">
            <option value="environment">Environment</option>
            <option value="lair-action">Lair Action</option>
            <option value="unknown">Unknown</option>
          </optgroup>
        </select>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[#475569] text-xs font-semibold shrink-0">
          Type:
        </span>
        <div className="flex flex-wrap items-center gap-1">
          {actionTypes.map(t => {
            const isActive = actionContext.actionType === t.value;
            return (
              <button
                key={t.value}
                onClick={() => handleTypeChange(t.value)}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase transition-colors outline-none",
                  isActive
                    ? "bg-[#2563eb] text-white"
                    : "bg-[#f9f8ff] text-[#8d8db9] hover:bg-[#e2e8f0] hover:text-[#0f172a]"
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
