import { DAMAGE_TYPE_OPTIONS } from '../../lib/conditions';
import React, { useState } from 'react';
import { DamageType } from '../../types';
import { Shield, Heart, Plus, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
;

interface MultiTargetActionBarProps {
  selectedCount: number;
  onApplyDamage: (amount: number, type: DamageType | null) => void;
  onApplyHealing: (amount: number) => void;
  onApplyCondition: (condition: string) => void;
  onClearSelection: () => void;
}

export const MultiTargetActionBar: React.FC<MultiTargetActionBarProps> = ({
  selectedCount,
  onApplyDamage,
  onApplyHealing,
  onApplyCondition,
  onClearSelection
}) => {
  const [damageAmount, setDamageAmount] = useState<string>('');
  const [damageType, setDamageType] = useState<DamageType | null>(null);
  const [healAmount, setHealAmount] = useState<string>('');
  const [conditionName, setConditionName] = useState<string>('');

  if (selectedCount === 0) return null;

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 h-full w-full max-w-xs sm:max-w-sm z-50 bg-[#2c2c26]/98 backdrop-blur-xl text-white shadow-[-16px_0_32px_rgba(0,0,0,0.5)] border-l border-white/10 p-5 flex flex-col"
    >
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center border border-amber-400/20 text-amber-400">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="text-2xl font-bold font-serif tracking-tight pr-1 marigold-text">{selectedCount}</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">Targets</span>
          </div>
        </div>
        <button
          onClick={onClearSelection}
          className="group p-2 transition-all bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl shrink-0"
          title="Clear selection and exit"
        >
          <X className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* Drawer Content - Scrollable */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1 -mr-1">
        {/* Damage Section */}
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3 flex flex-col">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Shield className="w-3 h-3 text-red-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Damage</span>
          </div>
          <div id="multiSelectSideBar" className="flex gap-2">
            <input
              type="number"
              value={damageAmount}
              onChange={(e) => setDamageAmount(e.target.value)}
              placeholder="Amt"
              className="w-16 h-9 bg-white/10 border border-white/10 rounded-xl px-2.5 text-sm font-bold text-center outline-none focus:bg-white/15 focus:border-red-500/50 transition-all placeholder:text-white/20"
            />
            <select
              value={damageType || ''}
              onChange={(e) => setDamageType((e.target.value as DamageType) || null)}
              className="flex-1 h-9 bg-[#2c2c26] border border-white/10 rounded-xl px-3 text-[10px] font-bold outline-none cursor-pointer focus:bg-white/15 focus:border-red-500/50 appearance-none transition-all"
            >
              <option value="" className="bg-[#2c2c26]">Type</option>
              {DAMAGE_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type} className="bg-[#2c2c26]">
                  {type}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              const amt = parseInt(damageAmount);
              if (!isNaN(amt)) {
                onApplyDamage(amt, damageType);
                setDamageAmount('');
              }
            }}
            disabled={!damageAmount}
            className="w-full h-9 bg-red-600 hover:bg-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center shadow-lg shadow-red-900/40 active:scale-95 cursor-pointer"
          >
            Apply Damage
          </button>
        </div>

        {/* Heal Section */}
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3 flex flex-col">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Heart className="w-3 h-3 text-green-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Healing</span>
          </div>
          <input
            type="number"
            value={healAmount}
            onChange={(e) => setHealAmount(e.target.value)}
            placeholder="Amount"
            className="w-full h-9 bg-white/10 border border-white/10 rounded-xl px-4 text-sm font-bold outline-none focus:bg-white/15 focus:border-green-500/50 transition-all placeholder:text-white/20"
          />
          <button
            onClick={() => {
              const amt = parseInt(healAmount);
              if (!isNaN(amt)) {
                onApplyHealing(amt);
                setHealAmount('');
              }
            }}
            disabled={!healAmount}
            className="w-full h-9 bg-green-600 hover:bg-green-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:grayscale shadow-lg shadow-green-900/40 active:scale-95 cursor-pointer"
          >
            Apply Healing
          </button>
        </div>

        {/* Condition Section */}
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3 flex flex-col">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Plus className="w-3 h-3 text-amber-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Condition</span>
          </div>
          <input
            type="text"
            value={conditionName}
            onChange={(e) => setConditionName(e.target.value)}
            placeholder="e.g. Paralyzed"
            className="w-full h-9 bg-white/10 border border-white/10 rounded-xl px-4 text-sm italic outline-none focus:bg-white/15 focus:border-amber-500/50 transition-all placeholder:text-white/20"
          />
          <button
            onClick={() => {
              if (conditionName.trim()) {
                onApplyCondition(conditionName.trim());
                setConditionName('');
              }
            }}
            disabled={!conditionName.trim()}
            className="w-full h-9 bg-amber-600 hover:bg-amber-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:grayscale shadow-lg shadow-amber-900/40 active:scale-95 cursor-pointer"
          >
            Add Condition
          </button>
        </div>
      </div>
    </motion.div>
  );
};
