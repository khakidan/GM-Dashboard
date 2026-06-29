import React from 'react';

export interface NpcLegendarySectionProps {
  legendaryActions?: number;
  legendaryResistances?: number;
  onUpdate: (updates: { legendaryActions?: number; legendaryResistances?: number }) => void;
  isSyncing?: boolean;
}

export const NpcLegendarySection: React.FC<NpcLegendarySectionProps> = ({
  legendaryActions,
  legendaryResistances = 0,
  onUpdate,
  isSyncing = false,
}) => {
  // Gracefully fall back to 0 if undefined
  const displayActions = legendaryActions ?? 0;

  return (
    <div className="border-t border-[#e2e8f0] pt-4" data-testid="npc-legendary-section">
      <div className="text-[10px] uppercase text-[#8d8db9] font-bold tracking-widest mb-2 px-1">Legendary</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="legendary-actions-input" className="text-[10px] uppercase text-[#8d8db9]/70 font-semibold tracking-wide mb-1 block px-1">
            Legendary Actions
          </label>
          <input
            id="legendary-actions-input"
            data-testid="legendary-actions-input"
            type="number"
            min={0}
            max={10}
            step={1}
            value={displayActions}
            disabled={isSyncing}
            onChange={(e) => onUpdate({ legendaryActions: parseInt(e.target.value, 10) || 0 })}
            className="w-full text-xs text-[#0f172a] bg-[#ffffff] p-3 rounded-lg border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all"
          />
        </div>
        <div>
          <label htmlFor="legendary-resistances-input" className="text-[10px] uppercase text-[#8d8db9]/70 font-semibold tracking-wide mb-1 block px-1">
            Legendary Resistances
          </label>
          <input
            id="legendary-resistances-input"
            data-testid="legendary-resistances-input"
            type="number"
            min={0}
            max={10}
            step={1}
            value={legendaryResistances}
            disabled={isSyncing}
            onChange={(e) => onUpdate({ legendaryResistances: parseInt(e.target.value, 10) || 0 })}
            className="w-full text-xs text-[#0f172a] bg-[#ffffff] p-3 rounded-lg border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all"
          />
        </div>
      </div>
    </div>
  );
};
