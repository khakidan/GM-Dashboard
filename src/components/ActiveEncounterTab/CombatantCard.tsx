import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { parseDiceNotation, rollDice } from '../../lib/diceRoller';
import { Combatant, DamageType } from '../../types';
import { CombatantCardHeader } from './CombatantCardHeader';
import { CombatantCardExpanded } from './CombatantCardExpanded';
import { useCombatantCard } from './hooks/useCombatantCard';

export interface CombatantCardProps {
  c: Combatant;
  isExpanded: boolean;
  damageInput: string;
  healInput: string;
  currentRound: number;
  hpMode?: 'damage' | 'heal';
  onDamageInputChange: (val: string) => void;
  onHealInputChange: (val: string) => void;
  onHealthSubmit: (isDamage: boolean, damageType?: DamageType | null) => void;
  onToggleExpand: () => void;
  onToggleSelect?: (id: string) => void;
  onUpdateCombatant: (updates: Partial<Combatant>) => void;
  onRemoveCombatant: () => void | Promise<void>;
  onConcentrationPrompt?: (effectName: string, targetName: string) => void;
  isActive?: boolean;
  isSyncing?: boolean;
  isSelectable?: boolean;
  isSelected?: boolean;
}

export function CombatantCard({
  c, isExpanded, damageInput, healInput,
  currentRound, onDamageInputChange, onHealInputChange, onHealthSubmit, onToggleExpand,
  onToggleSelect, onUpdateCombatant, onRemoveCombatant, onConcentrationPrompt, hpMode = 'damage',
}: CombatantCardProps) {
  const [recentRechargeRolls, setRecentRechargeRolls] = useState<Record<string, number>>({});
  const { isActiveTurn: isActive, isSelected, isSelectable, isSyncing } = useCombatantCard(c.id);

  const handleRechargeRoll = (abilityName: string, rechargeOn: number) => {
    const rolledNum = rollDice(parseDiceNotation('1d6')).total;
    setRecentRechargeRolls(prev => ({ ...prev, [abilityName]: rolledNum }));
    setTimeout(() => setRecentRechargeRolls(prev => { const cp = { ...prev }; delete cp[abilityName]; return cp; }), 2000);

    const isSuccess = rolledNum >= rechargeOn;
    if (isSuccess) {
      toast.success(`${abilityName} recharged! (rolled ${rolledNum})`);
    } else {
      toast(`${abilityName} did not recharge (rolled ${rolledNum})`, {
        style: { backgroundColor: '#f3f4f6', color: '#1f2937', border: '1px solid #e5e7eb' }
      });
    }
    onUpdateCombatant({ rechargeAbilities: (c.rechargeAbilities || []).map(a => a.name === abilityName ? { ...a, isCharged: isSuccess } : a) });
  };

  const handleMarkSpent = (abilityName: string) => onUpdateCombatant({ rechargeAbilities: (c.rechargeAbilities || []).map(a => a.name === abilityName ? { ...a, isCharged: false } : a) });
  const handleSpendResistance = () => c.legendaryResistances && onUpdateCombatant({ legendaryResistances: { ...c.legendaryResistances, remaining: Math.max(0, c.legendaryResistances.remaining - 1) } });
  const handleRestoreResistances = () => c.legendaryResistances && onUpdateCombatant({ legendaryResistances: { ...c.legendaryResistances, remaining: c.legendaryResistances.max } });
  const handleSpendAction = () => c.legendaryActions && onUpdateCombatant({ legendaryActions: { ...c.legendaryActions, remaining: Math.max(0, c.legendaryActions.remaining - 1) } });
  const handleRestoreActions = () => c.legendaryActions && onUpdateCombatant({ legendaryActions: { ...c.legendaryActions, remaining: c.legendaryActions.max } });

  return (
    <motion.div
      id={`combatant-card-${c.id}`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative bg-white border-2 rounded-2xl transition-all h-fit',
        isSelected ? 'border-[#c5b358] shadow-[0_0_15px_rgba(197,179,88,0.2)] border-l-[6px] border-l-amber-500' : (isActive ? 'border-[#c5b358] shadow-md z-10' : 'border-[#e5e1d8] hover:border-[#c5b358]/40'),
        c.currentHp <= 0 ? 'opacity-60 grayscale-[0.5]' : ''
      )}
    >
      {isActive && !isSelectable && (
        <div className="absolute -top-3 left-6 bg-[#c5b358] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm z-20 flex items-center gap-1">
          <Zap className="w-3 h-3 fill-current" /> Active
        </div>
      )}

      <CombatantCardHeader
        c={c}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        damageInput={damageInput}
        healInput={healInput}
        onDamageInputChange={onDamageInputChange}
        onHealInputChange={onHealInputChange}
        onHealthSubmit={onHealthSubmit}
        onUpdateCombatant={onUpdateCombatant}
        onToggleSelect={onToggleSelect}
        onMarkSpent={handleMarkSpent}
        hpMode={hpMode}
      />

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CombatantCardExpanded
              c={c} isSyncing={isSyncing} currentRound={currentRound} onUpdateCombatant={onUpdateCombatant}
              onRemoveCombatant={onRemoveCombatant} onConcentrationPrompt={onConcentrationPrompt}
              recentRechargeRolls={recentRechargeRolls} onMarkSpent={handleMarkSpent} onRollRecharge={handleRechargeRoll}
              onSpendAction={handleSpendAction} onSpendResistance={handleSpendResistance}
              onRestoreActions={handleRestoreActions} onRestoreResistances={handleRestoreResistances}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
