import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { parseDiceNotation, rollDice } from '../../lib/diceRoller';
import { Combatant, DamageType, Character, NPC } from '../../types';
import { CombatantCardHeader } from './CombatantCardHeader';
import { CombatantCardExpanded } from './CombatantCardExpanded';
import { useCombatantCard } from './hooks/useCombatantCard';
import { useCombatantExpanded } from './hooks/useCombatantExpanded';
import { ResourcePool, serializeResourcePools } from '../../lib/resourcePools';
import { CardShell } from '../ui/CardShell';
import { NpcReferencePanel } from './NpcReferencePanel';
import { ExpandableContent } from '../ui/ExpandableContent';

export interface CombatantCardProps {
  c: Combatant;
  isExpanded: boolean;
  damageInput: string;
  healInput: string;
  currentRound: number;
  combatStarted: boolean;
  hpMode?: 'damage' | 'heal';
  onDamageInputChange: (val: string) => void;
  onHealInputChange: (val: string) => void;
  onHealthSubmit: (isDamage: boolean, damageType?: DamageType | null) => void;
  onToggleExpand: () => void;
  onToggleSelect?: (id: string) => void;
  onUpdateCombatant: (updates: Partial<Combatant>) => void;
  onRemoveCombatant: () => void | Promise<void>;
  onConcentrationPrompt?: (effectName: string, targetName: string) => void;
  pcCharacter?: Character;
  npcModel?: NPC;
}

export function CombatantCard({
  c, isExpanded, damageInput, healInput,
  currentRound, combatStarted, onDamageInputChange, onHealInputChange, onHealthSubmit, onToggleExpand,
  onToggleSelect, onUpdateCombatant, onRemoveCombatant, onConcentrationPrompt, hpMode = 'damage',
  pcCharacter, npcModel,
}: CombatantCardProps) {
  const [recentRechargeRolls, setRecentRechargeRolls] = useState<Record<string, number>>({});
  const { isActiveTurn: _isActiveTurn, isSelected, isSelectable, isSyncing } = useCombatantCard(c.id);
  const isActive = _isActiveTurn && !!combatStarted;
  const { handleResourcePoolUpdate } = useCombatantExpanded(c);

  const handleUpdateResourcePools = (combatant: Combatant, updatedPools: ResourcePool[]) => {
    const serialized = serializeResourcePools(updatedPools);
    handleResourcePoolUpdate({ resourcePools: serialized });
  };

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
    <CardShell
      id={`combatant-card-${c.id}`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      highlight={isSelected ? 'selected' : (isActive && !isSelectable ? 'active-turn' : null)}
      cornerBadge={isActive && !isSelectable ? (
        <div className="bg-[#2563eb] text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
          <Zap className="w-3 h-3 fill-current" /> Active
        </div>
      ) : undefined}
      className={cn(
        'h-fit',
        c.type === 'npc' && c.currentHp <= 0 
          ? 'bg-[#f9f8ff] opacity-60 grayscale-[0.5]' 
          : (c.currentHp <= 0 ? 'opacity-60 grayscale-[0.5]' : '')
      )}
    >

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
        onUpdateResourcePools={handleUpdateResourcePools}
        pcCharacter={pcCharacter}
      />

      {c.type === 'npc' && (
        <div className="px-6 pb-3">
          <NpcReferencePanel combatant={c} />
        </div>
      )}

      <ExpandableContent isExpanded={isExpanded}>
        <CombatantCardExpanded
          c={c} isSyncing={isSyncing} currentRound={currentRound} onUpdateCombatant={onUpdateCombatant}
          onRemoveCombatant={onRemoveCombatant} onConcentrationPrompt={onConcentrationPrompt}
          recentRechargeRolls={recentRechargeRolls} onMarkSpent={handleMarkSpent} onRollRecharge={handleRechargeRoll}
          onSpendAction={handleSpendAction} onSpendResistance={handleSpendResistance}
          onRestoreActions={handleRestoreActions} onRestoreResistances={handleRestoreResistances}
          pcCharacter={pcCharacter} npcModel={npcModel}
        />
      </ExpandableContent>
    </CardShell>
  );
}
