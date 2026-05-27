import React, { useState } from 'react';
import { DamageType } from '../../types';
import { Shield, Heart, Plus, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

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
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-6xl px-6"
    >
      <div className="bg-[#2c2c26]/98 backdrop-blur-xl text-white rounded-[2.5rem] shadow-[0_32px_64px_rgba(0,0,0,0.6)] border border-white/10 p-5 md:p-6 flex flex-col xl:flex-row gap-6 items-center">
        <div className="flex xl:flex-col items-center xl:items-start shrink-0 xl:border-r border-white/10 xl:pr-8 gap-3 xl:gap-1 w-full xl:w-auto pb-4 xl:pb-0 border-b xl:border-b-0">
          <div className="flex items-center gap-2 text-amber-400">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center border border-amber-400/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <span className="text-3xl font-bold font-serif tracking-tight">{selectedCount}</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 whitespace-nowrap ml-1">Targets</span>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {/* Damage Section */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3 flex flex-col">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Shield className="w-3 h-3 text-red-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Damage</span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={damageAmount}
                onChange={(e) => setDamageAmount(e.target.value)}
                placeholder="Amt"
                className="w-20 h-9 bg-white/10 border border-white/10 rounded-xl px-3 text-sm font-bold text-center outline-none focus:bg-white/15 focus:border-red-500/50 transition-all placeholder:text-white/20"
              />
              <select
                value={damageType || ''}
                onChange={(e) => setDamageType((e.target.value as DamageType) || null)}
                className="flex-1 h-9 bg-white/10 border border-white/10 rounded-xl px-3 text-[10px] font-bold outline-none cursor-pointer focus:bg-white/15 focus:border-red-500/50 appearance-none transition-all"
              >
                <option value="" className="bg-[#2c2c26]">Type</option>
                <option value="acid" className="bg-[#2c2c26]">acid</option>
                <option value="bludgeoning" className="bg-[#2c2c26]">bludgeoning</option>
                <option value="bludgeoning (nonmagical)" className="bg-[#2c2c26]">bludgeoning (nonmagical)</option>
                <option value="cold" className="bg-[#2c2c26]">cold</option>
                <option value="fire" className="bg-[#2c2c26]">fire</option>
                <option value="force" className="bg-[#2c2c26]">force</option>
                <option value="lightning" className="bg-[#2c2c26]">lightning</option>
                <option value="necrotic" className="bg-[#2c2c26]">necrotic</option>
                <option value="piercing" className="bg-[#2c2c26]">piercing</option>
                <option value="piercing (nonmagical)" className="bg-[#2c2c26]">piercing (nonmagical)</option>
                <option value="poison" className="bg-[#2c2c26]">poison</option>
                <option value="psychic" className="bg-[#2c2c26]">psychic</option>
                <option value="radiant" className="bg-[#2c2c26]">radiant</option>
                <option value="slashing" className="bg-[#2c2c26]">slashing</option>
                <option value="slashing (nonmagical)" className="bg-[#2c2c26]">slashing (nonmagical)</option>
                <option value="thunder" className="bg-[#2c2c26]">thunder</option>
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
              className="w-full h-9 bg-red-600 hover:bg-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center shadow-lg shadow-red-900/40 active:scale-95"
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
              className="w-full h-9 bg-green-600 hover:bg-green-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:grayscale shadow-lg shadow-green-900/40 active:scale-95"
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
              className="w-full h-9 bg-amber-600 hover:bg-amber-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:grayscale shadow-lg shadow-amber-900/40 active:scale-95"
            >
              Add Condition
            </button>
          </div>
        </div>

        <button
          onClick={onClearSelection}
          className="group p-3 transition-all bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 shrink-0"
          title="Clear selection and exit"
        >
          <X className="w-6 h-6 opacity-40 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </motion.div>
  );
};
