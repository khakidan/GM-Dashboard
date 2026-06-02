import React from 'react';

export interface RechargeAbility {
  name: string;
  rechargeOn: number;
}

export interface NpcRechargeSectionProps {
  rechargeAbilities?: RechargeAbility[];
  onAddAbility: (ability: RechargeAbility) => void;
  onRemoveAbility: (idx: number) => void;
  isSyncing?: boolean;
}

export const NpcRechargeSection: React.FC<NpcRechargeSectionProps> = ({
  rechargeAbilities = [],
  onAddAbility,
  onRemoveAbility,
  isSyncing = false,
}) => {
  const [newAbilityName, setNewAbilityName] = React.useState('');
  const [newAbilityRechargeOn, setNewAbilityRechargeOn] = React.useState(6);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAbilityName.trim()) return;
    onAddAbility({
      name: newAbilityName.trim(),
      rechargeOn: newAbilityRechargeOn,
    });
    setNewAbilityName('');
    setNewAbilityRechargeOn(6);
  };

  return (
    <div className="border-t border-[#f5f5f0] pt-4" data-testid="npc-recharge-section">
      <div className="text-[10px] uppercase text-[#5a5a40] font-bold tracking-widest mb-2 px-1">
        Recharge Abilities
      </div>

      {/* List Existing Abilities */}
      <div className="space-y-2 mb-3" data-testid="recharge-abilities-list">
        {rechargeAbilities.length === 0 ? (
          <div className="text-xs text-[#5a5a40]/60 italic p-2 bg-[#fdfaf5] rounded-lg border border-dashed border-[#e5e1d8] text-center">
            No recharge abilities — add one below
          </div>
        ) : (
          rechargeAbilities.map((ability, idx) => {
            const rechargeText = ability.rechargeOn === 6 ? '6' : `${ability.rechargeOn}-6`;
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-[#fdfaf5] rounded-lg border border-[#e5e1d8] text-xs"
                data-testid={`ability-item-${idx}`}
              >
                <span className="font-semibold text-[#2c2c26] capitalize">{ability.name}</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-sans font-bold text-[10px]">
                    Recharge {rechargeText}
                  </span>
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={() => onRemoveAbility(idx)}
                    className="p-1 hover:bg-red-50 text-red-600 rounded transition-all disabled:opacity-50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add New Ability Row */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="e.g. Fire Breath"
          value={newAbilityName}
          disabled={isSyncing}
          onChange={(e) => setNewAbilityName(e.target.value)}
          className="flex-1 text-xs text-[#2c2c26] bg-[#fdfaf5] p-2.5 rounded-lg border border-[#e5e1d8] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all"
        />
        <select
          value={newAbilityRechargeOn}
          disabled={isSyncing}
          onChange={(e) => setNewAbilityRechargeOn(parseInt(e.target.value, 10))}
          className="text-xs text-[#2c2c26] bg-[#fdfaf5] p-2.5 rounded-lg border border-[#e5e1d8] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all shrink-0"
        >
          <option value={6}>6</option>
          <option value={5}>5-6</option>
          <option value={4}>4-6</option>
        </select>
        <button
          type="button"
          disabled={isSyncing || !newAbilityName.trim()}
          onClick={handleSubmit}
          className="px-3 py-2.5 bg-[#c5b358]/10 text-xs font-bold uppercase tracking-widest text-[#2c2c26] hover:bg-[#c5b358]/20 border border-[#c5b358]/20 rounded-lg transition-all shrink-0 disabled:opacity-50"
        >
          + Add
        </button>
      </div>
    </div>
  );
};
