import React, { useState } from 'react';
import { DamageType } from '../../types';
import { DAMAGE_TYPE_OPTIONS } from '../../lib/irvOptions';
import { Shield, Heart, PlusCircle, Trash2, X } from 'lucide-react';

interface MultiTargetActionPanelProps {
  selectedCount: number;
  onApplyDamage: (amount: number, type: DamageType | null) => void;
  onApplyHealing: (amount: number) => void;
  onApplyCondition: (condition: string) => void;
  onDeleteSelected: () => void;
  onCancelSelection: () => void;
}

export const MultiTargetActionPanel: React.FC<MultiTargetActionPanelProps> = ({
  selectedCount,
  onApplyDamage,
  onApplyHealing,
  onApplyCondition,
  onDeleteSelected,
  onCancelSelection
}) => {
  const [damageAmount, setDamageAmount] = useState<string>('');
  const [damageType, setDamageType] = useState<DamageType | ''>('');
  const [healAmount, setHealAmount] = useState<string>('');
  const [conditionName, setConditionName] = useState<string>('');

  const isDmgDisabled = selectedCount === 0 || !damageAmount;
  const isHealDisabled = selectedCount === 0 || !healAmount;
  const isCondDisabled = selectedCount === 0 || !conditionName.trim();
  const isGlobalDisabled = selectedCount === 0;

  const handleApplyDamageClick = () => {
    const amt = parseInt(damageAmount);
    if (!isNaN(amt)) {
      onApplyDamage(amt, (damageType as DamageType) || null);
      setDamageAmount('');
    }
  };

  const handleApplyHealingClick = () => {
    const amt = parseInt(healAmount);
    if (!isNaN(amt)) {
      onApplyHealing(amt);
      setHealAmount('');
    }
  };

  const handleApplyConditionClick = () => {
    if (conditionName.trim()) {
      onApplyCondition(conditionName.trim());
      setConditionName('');
    }
  };

  return (
    <div className="w-full bg-[#faf8f5] border-b border-[#e5e1d8] p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200 text-amber-900 text-xl font-bold font-mono">
            {selectedCount}
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-[#2c2c26]">Combatants Selected</h2>
            <p className="text-xs text-[#5a5a40] font-sans italic opacity-85">
              Choose actions for the selected group
            </p>
          </div>
        </div>

        <button
          onClick={onCancelSelection}
          className="flex items-center gap-2 px-4 py-2 text-xs font-sans font-bold uppercase bg-white border border-[#e5e1d8] hover:bg-[#f5f5f0] text-[#5a5a40] rounded-full transition-all cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>

      {/* Grid of Action Sections */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-[#e5e1d8]">
        {/* Damage Section */}
        <div className="bg-white border border-[#e5e1d8] p-3 rounded-xl flex flex-col gap-2 justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-red-700 font-bold uppercase tracking-wider text-[10px]">
              <Shield className="w-3.5 h-3.5" />
              <span>Damage</span>
            </div>
            <div className="flex gap-1.5">
              <input
                type="number"
                value={damageAmount}
                disabled={isGlobalDisabled}
                onChange={(e) => setDamageAmount(e.target.value)}
                placeholder="Amt"
                className="w-16 h-8 bg-stone-50 border border-[#e5e1d8] rounded-lg px-2 text-center text-xs font-bold outline-none focus:border-red-500 disabled:opacity-50"
              />
              <select
                value={damageType}
                disabled={isGlobalDisabled}
                onChange={(e) => setDamageType(e.target.value as DamageType | '')}
                className="flex-1 h-8 bg-stone-50 border border-[#e5e1d8] rounded-lg px-2 text-xs font-serif font-bold cursor-pointer outline-none focus:border-red-500 disabled:opacity-50"
              >
                <option value="">Type</option>
                {DAMAGE_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type} className="bg-white">
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleApplyDamageClick}
            disabled={isDmgDisabled}
            className="w-full h-8 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:hover:bg-red-600 cursor-pointer flex items-center justify-center gap-1"
          >
            Apply Damage
          </button>
        </div>

        {/* Healing Section */}
        <div className="bg-white border border-[#e5e1d8] p-3 rounded-xl flex flex-col gap-2 justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-green-700 font-bold uppercase tracking-wider text-[10px]">
              <Heart className="w-3.5 h-3.5" />
              <span>Healing</span>
            </div>
            <input
              type="number"
              value={healAmount}
              disabled={isGlobalDisabled}
              onChange={(e) => setHealAmount(e.target.value)}
              placeholder="Amount"
              className="w-full h-8 bg-stone-50 border border-[#e5e1d8] rounded-lg px-2 text-xs font-bold outline-none focus:border-green-500 disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleApplyHealingClick}
            disabled={isHealDisabled}
            className="w-full h-8 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:hover:bg-green-600 cursor-pointer flex items-center justify-center gap-1"
          >
            Apply Healing
          </button>
        </div>

        {/* Condition Section */}
        <div className="bg-white border border-[#e5e1d8] p-3 rounded-xl flex flex-col gap-2 justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-amber-700 font-bold uppercase tracking-wider text-[10px]">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Condition</span>
            </div>
            <input
              type="text"
              value={conditionName}
              disabled={isGlobalDisabled}
              onChange={(e) => setConditionName(e.target.value)}
              placeholder="e.g. Paralyzed"
              className="w-full h-8 bg-stone-50 border border-[#e5e1d8] rounded-lg px-2 text-xs outline-none focus:border-amber-500 disabled:opacity-50 italic"
            />
          </div>
          <button
            onClick={handleApplyConditionClick}
            disabled={isCondDisabled}
            className="w-full h-8 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:hover:bg-amber-600 cursor-pointer flex items-center justify-center gap-1"
          >
            Add Condition
          </button>
        </div>

        {/* Deletion Section */}
        <div className="bg-red-50/40 border border-red-200/60 p-3 rounded-xl flex flex-col gap-2 justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-red-900 font-bold uppercase tracking-wider text-[10px]">
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Destructive</span>
            </div>
            <p className="text-[10px] text-red-700 font-sans italic opacity-85 leading-normal">
              Remove combatants from this encounter.
            </p>
          </div>
          <button
            onClick={onDeleteSelected}
            disabled={isGlobalDisabled}
            className="w-full h-8 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:hover:bg-red-100 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1"
          >
            Delete Selected
          </button>
        </div>
      </div>
    </div>
  );
};
