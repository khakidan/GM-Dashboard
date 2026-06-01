import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Eye, Zap, ZapOff, Lock, Ban, TrendingDown, Target, AlertTriangle, ShieldOff, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { parseDiceNotation, rollDice } from '../../lib/diceRoller';
import { Combatant, DamageType } from '../../types';
import { getHealthStatus, effectiveMaxHp, effectiveAc } from '../../lib/combatLogic';
import { CONDITION_MECHANICS, buildConditionSummary } from '../../lib/conditionDefinitions';
import { DAMAGE_TYPE_OPTIONS, CONDITION_OPTIONS, EFFECT_OPTIONS } from '../../lib/irvOptions';
import { IrvMultiSelect } from '../ui/IrvMultiSelect';
import { ConditionChips } from '../ui/ConditionChips';

const AnimatedHpDisplay = ({
  value,
  maxHp,
  isActive,
  colorClass,
  className,
}: {
  value: number;
  maxHp: number;
  isActive: boolean;
  colorClass: string;
  className?: string;
}) => {
  const [prevHp, setPrevHp] = useState(value);
  const [animateState, setAnimateState] = useState<'idle' | 'heal' | 'damage'>('idle');

  useEffect(() => {
    let animationTimeout: NodeJS.Timeout;
    if (value > prevHp) {
      setAnimateState('heal');
    } else if (value < prevHp) {
      setAnimateState('damage');
    }

    setPrevHp(value);

    animationTimeout = setTimeout(() => setAnimateState('idle'), 500);
    return () => clearTimeout(animationTimeout);
  }, [value, prevHp]);

  return (
    <motion.div
      animate={
        animateState === 'heal'
          ? { scale: [1, 1.2, 1], backgroundColor: ['transparent', '#86efac', 'transparent'] }
          : animateState === 'damage'
          ? { scale: [1, 0.9, 1], backgroundColor: ['transparent', '#fca5a5', 'transparent'], x: [0, -4, 4, -4, 4, 0] }
          : {}
      }
      transition={{ duration: 0.4 }}
      className={cn('rounded-md relative inline-block p-1', className)}
    >
      <div className={cn('min-w-8 text-center font-sans font-bold block', colorClass)}>
        {value}
      </div>
    </motion.div>
  );
};

const InitiativeInput = ({
  value,
  onSave,
  disabled,
}: {
  value: number;
  onSave: (val: number) => void;
  disabled?: boolean;
}) => {
  const [localValue, setLocalValue] = useState<string>(value.toString());

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setLocalValue('');
  };

  const handleBlur = () => {
    const num = parseInt(localValue);
    if (!isNaN(num)) {
      onSave(num);
    } else {
      setLocalValue(value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const num = parseInt(localValue);
      if (!isNaN(num)) {
        onSave(num);
      }
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="number"
      value={localValue}
      onFocus={handleFocus}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className="w-14 h-8 bg-[#faf9f6]/50 border border-[#e5e1d8] rounded text-center font-bold text-[#c5b358] outline-none text-sm focus:border-[#c5b358] focus:bg-white disabled:opacity-50"
    />
  );
};

export interface CombatantCardProps {
  key?: React.Key;
  c: Combatant;
  isActive: boolean;
  isExpanded: boolean;
  isSyncing: boolean;
  isSelectable?: boolean;
  isSelected?: boolean;
  damageInput: string;
  healInput: string;
  currentRound: number;
  onDamageInputChange: (val: string) => void;
  onHealInputChange: (val: string) => void;
  onHealthSubmit: (isDamage: boolean, damageType?: DamageType | null) => void;
  onToggleExpand: () => void;
  onToggleSelect?: (id: string) => void;
  onUpdateCombatant: (updates: Partial<Combatant>) => void;
  onRemoveCombatant: () => void | Promise<void>;
  onConcentrationPrompt?: (effectName: string, targetName: string) => void;
  hpMode?: 'damage' | 'heal';
}

const ReadOnlyIrvDisplay = ({ label, items, theme }: { label: string, items: string, theme: 'resistances' | 'immunities' | 'vulnerabilities' }) => {
  const arr = items ? items.split(',').map(s => s.trim()).filter(Boolean) : [];
  
  let chipClass = 'bg-[#f5f5f0] text-[#5a5a40] border-[#e5e1d8]';
  if (theme === 'resistances') chipClass = 'bg-amber-50 text-amber-700 border-amber-200';
  if (theme === 'immunities') chipClass = 'bg-red-50 text-red-700 border-red-200';
  if (theme === 'vulnerabilities') chipClass = 'bg-blue-50 text-blue-700 border-blue-200';

  return (
    <div>
      <span className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5">{label}</span>
      {arr.length === 0 ? (
        <span className="text-xl text-[#5a5a40] opacity-30">—</span>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {arr.map(chip => (
            <span
              key={chip}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-bold font-sans capitalize border',
                chipClass
              )}
            >
              {chip}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export function CombatantCard({
  c,
  isActive,
  isExpanded,
  isSyncing,
  isSelectable,
  isSelected,
  damageInput,
  healInput,
  currentRound,
  onDamageInputChange,
  onHealInputChange,
  onHealthSubmit,
  onToggleExpand,
  onToggleSelect,
  onUpdateCombatant,
  onRemoveCombatant,
  onConcentrationPrompt,
  hpMode = 'damage'
}: CombatantCardProps) {
  const maxHpCeiling = effectiveMaxHp(c.maxHp, c.tempHpMax);
  const [selectedDamageType, setSelectedDamageType] = useState<DamageType | null>(null);
  const [recentRechargeRolls, setRecentRechargeRolls] = useState<Record<string, number>>({});

  const handleRechargeRoll = (abilityName: string, rechargeOn: number) => {
    const rollRes = rollDice(parseDiceNotation('1d6'));
    const d6Value = rollRes.total;
    
    // Animate rolled number briefly
    setRecentRechargeRolls(prev => ({ ...prev, [abilityName]: d6Value }));
    setTimeout(() => {
      setRecentRechargeRolls(prev => {
        const copy = { ...prev };
        delete copy[abilityName];
        return copy;
      });
    }, 2000);

    const isSuccess = d6Value >= rechargeOn;
    
    // Show toast
    if (isSuccess) {
      toast.success(`${abilityName} recharged! (rolled ${d6Value})`);
    } else {
      toast(`${abilityName} did not recharge (rolled ${d6Value})`, {
        style: { backgroundColor: '#f3f4f6', color: '#1f2937', border: '1px solid #e5e7eb' }
      });
    }

    // Update State
    const updatedAbilities = (c.rechargeAbilities || []).map(a => {
      if (a.name === abilityName) {
        return { ...a, isCharged: isSuccess };
      }
      return a;
    });

    onUpdateCombatant({ rechargeAbilities: updatedAbilities });
  };

  const handleMarkSpent = (abilityName: string) => {
    const updatedAbilities = (c.rechargeAbilities || []).map(a => {
      if (a.name === abilityName) {
        return { ...a, isCharged: false };
      }
      return a;
    });

    onUpdateCombatant({ rechargeAbilities: updatedAbilities });
  };

  const handleSpendResistance = () => {
    if (!c.legendaryResistances) return;
    const current = c.legendaryResistances.remaining;
    const next = Math.max(0, current - 1);
    onUpdateCombatant({
      legendaryResistances: {
        ...c.legendaryResistances,
        remaining: next
      }
    });
  };

  const handleRestoreResistances = () => {
    if (!c.legendaryResistances) return;
    onUpdateCombatant({
      legendaryResistances: {
        ...c.legendaryResistances,
        remaining: c.legendaryResistances.max
      }
    });
  };

  const handleSpendAction = () => {
    if (!c.legendaryActions) return;
    const current = c.legendaryActions.remaining;
    const next = Math.max(0, current - 1);
    onUpdateCombatant({
      legendaryActions: {
        ...c.legendaryActions,
        remaining: next
      }
    });
  };

  const handleRestoreActions = () => {
    if (!c.legendaryActions) return;
    onUpdateCombatant({
      legendaryActions: {
        ...c.legendaryActions,
        remaining: c.legendaryActions.max
      }
    });
  };

  const conditionList = (c.conditions || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const mechanicalSummary = buildConditionSummary(conditionList);

  const isSpeedZero = mechanicalSummary.speedLocked;
  const isIncapacitated = mechanicalSummary.actionsBlocked;
  const isCritVulnerable = mechanicalSummary.critVulnerable;
  const hasMechanicalBadges =
    isSpeedZero ||
    isIncapacitated ||
    mechanicalSummary.finalOutgoing !== null ||
    mechanicalSummary.finalIncoming !== null ||
    isCritVulnerable ||
    mechanicalSummary.speedHalved ||
    mechanicalSummary.hpMaxHalved;

  const conditionOptionsLower = CONDITION_OPTIONS.map(o => o.toLowerCase());
  const effectOptionsLower = EFFECT_OPTIONS.map(o => o.toLowerCase());

  const hasActiveConditions = conditionList.some(chip => conditionOptionsLower.includes(chip));
  const hasActiveEffects = conditionList.some(chip => effectOptionsLower.includes(chip));

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

      {/* Widget Header */}
      <div 
        className={cn("p-4 flex items-center justify-between gap-3", isSelectable && "cursor-pointer")}
        onClick={(e) => {
          if (isSelectable) {
            onToggleSelect?.(c.id);
          }
        }}
      >
        {/* OUTER ROW CONTAINER */}
        <div data-testid="collapsed-card-row" className="flex flex-row items-center w-full gap-0">
          
          {/* LEFT CONTAINER */}
          <div data-testid="left-container" className="flex-1 flex flex-row items-center justify-start gap-4 overflow-hidden">
            {/* 1. Selection checkbox (if in selection mode) */}
            {isSelectable && (
              <div onClick={e => e.stopPropagation()} className="flex items-center shrink-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect?.(c.id)}
                  className="w-5 h-5 rounded border-[#c5b358] text-[#c5b358] focus:ring-[#c5b358] cursor-pointer"
                />
              </div>
            )}

            {/* 2. Initiative bubble (the INIT circle) */}
            <div 
              className="flex flex-col items-center shrink-0"
              onClick={e => e.stopPropagation()}
            >
              <span className="text-[10px] font-bold uppercase text-[#5a5a40] opacity-60 leading-none mb-1">Init</span>
              <InitiativeInput
                value={c.initiative}
                onSave={val => onUpdateCombatant({ initiative: val })}
                disabled={isSyncing}
              />
            </div>

            {/* 3. Combatant name and AC badge */}
            <div className="min-w-0 flex flex-wrap items-center gap-2">
              <h3 className={cn('text-lg font-bold font-serif truncate', c.type === 'npc' ? 'text-red-800' : 'text-[#2c2c26]')}>
                {c.name}
              </h3>
              {c.conditions?.toLowerCase().includes('concentrating') && (
                <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded border bg-purple-100 text-purple-700 border-purple-200">
                  CON
                </span>
              )}
              {c.type === 'pc' && c.conditions?.toLowerCase().includes('unconscious') && (c.deathSavesSuccesses || 0) < 3 && !c.isStable && (
                <div 
                  className="flex flex-col gap-0.5 bg-rose-50/70 border border-rose-100 rounded-lg px-2.5 py-1 text-xs select-none" 
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-[#5a5a40] font-bold text-[10px] uppercase w-12">Fails:</span>
                    <div className="flex gap-1" id={`death-fails-${c.id}`}>
                      {[1, 2, 3].map(slot => {
                        const isFailed = (c.deathSavesFails || 0) >= slot;
                        return (
                          <span key={slot} className="flex items-center justify-center">
                            {isFailed ? (
                              <span className="text-red-500 text-sm leading-none" title="Death Save Failure">●</span>
                            ) : (
                              <span className="text-gray-300 text-sm leading-none">○</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-[#5a5a40] font-bold text-[10px] uppercase w-12">Success:</span>
                    <div className="flex gap-1" id={`death-successes-${c.id}`}>
                      {[1, 2, 3].map(slot => {
                        const isSuccess = (c.deathSavesSuccesses || 0) >= slot;
                        return (
                          <span key={slot} className="flex items-center justify-center">
                            {isSuccess ? (
                              <span className="text-green-500 text-sm leading-none" title="Death Save Success">♥</span>
                            ) : (
                              <span className="text-gray-300 text-sm leading-none">○</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              {c.currentHp < maxHpCeiling && c.currentHp > 0 && (
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full border border-current bg-white/50 shrink-0",
                  getHealthStatus(c.currentHp, maxHpCeiling).color
                )}>
                  {getHealthStatus(c.currentHp, maxHpCeiling).label}
                </span>
              )}
              {(() => {
                const baseAc = c.ac;
                const acMod = c.tempAcModifier || 0;
                const effAc = effectiveAc(baseAc, acMod);
                if (acMod === 0) {
                  return <span className="text-sm font-bold text-[#b0a04f] whitespace-nowrap">(AC {baseAc})</span>;
                }
                const sign = acMod > 0 ? '+' : '';
                return <span className="text-sm font-bold text-amber-600 whitespace-nowrap">(AC {effAc} ({sign}{acMod}))</span>;
              })()}
              {hasMechanicalBadges && (
                <div className="flex flex-wrap items-center gap-1">
                  {isSpeedZero && <span className="bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-[2px] rounded-full font-sans text-[9px] font-bold uppercase tracking-wide">SPD 0</span>}
                  {mechanicalSummary.speedHalved && !isSpeedZero && <span className="bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-[2px] rounded-full font-sans text-[9px] font-bold uppercase tracking-wide">SPD ½</span>}
                  {mechanicalSummary.hpMaxHalved && <span className="bg-pink-100 text-pink-700 border border-pink-200 px-1.5 py-[2px] rounded-full font-sans text-[9px] font-bold uppercase tracking-wide">HP ½</span>}
                  {isIncapacitated && <span className="bg-orange-100 text-orange-700 border border-orange-200 px-1.5 py-[2px] rounded-full font-sans text-[9px] font-bold uppercase tracking-wide">NO ACT</span>}
                  {mechanicalSummary.finalOutgoing === 'disadvantage' && <span className="bg-yellow-100 text-yellow-700 border border-yellow-200 px-1.5 py-[2px] rounded-full font-sans text-[9px] font-bold uppercase tracking-wide">DISADV</span>}
                  {mechanicalSummary.finalOutgoing === 'advantage' && <span className="bg-green-100 text-green-700 border border-green-200 px-1.5 py-[2px] rounded-full font-sans text-[9px] font-bold uppercase tracking-wide">ADVAN</span>}
                  {mechanicalSummary.finalOutgoing === 'normal' && <span className="bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-[2px] rounded-full font-sans text-[9px] font-bold uppercase tracking-wide">CANCELLED</span>}
                  {mechanicalSummary.finalIncoming === 'advantage' && <span className="bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-[2px] rounded-full font-sans text-[9px] font-bold uppercase tracking-wide">VULN</span>}
                  {isCritVulnerable && <span className="bg-red-100 text-red-700 border border-red-200 px-1.5 py-[2px] rounded-full font-sans text-[9px] font-bold uppercase tracking-wide">AUTO CRIT</span>}
                </div>
              )}
              {(hasActiveConditions || hasActiveEffects) && (
                <div className="flex gap-1 items-center">
                  {hasActiveConditions && <div className="w-2 h-2 rounded-full bg-red-500" title="Active conditions" />}
                  {hasActiveEffects && <div className="w-2 h-2 rounded-full bg-blue-500" title="Active effects" />}
                </div>
              )}
            </div>

            {/* 4. Reaction toggle pill */}
            <div className="shrink-0 flex items-center pr-2" onClick={(e) => e.stopPropagation()}>
              <button
                id={`reaction-toggle-${c.id}`}
                onClick={() => onUpdateCombatant({ reactionUsed: !c.reactionUsed })}
                disabled={isSyncing}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border font-sans cursor-pointer transition-all select-none whitespace-nowrap h-6",
                  c.reactionUsed
                    ? "bg-gray-100 border-gray-300 text-gray-400 line-through opacity-70"
                    : "bg-emerald-50 border-emerald-300 text-emerald-700"
                )}
              >
                {c.reactionUsed ? (
                  <>
                    <ZapOff className="w-3 h-3" />
                    <span>REACTION USED</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3 fill-current" />
                    <span>REACTION</span>
                  </>
                )}
              </button>
            </div>

            {/* Compact indicators for recharge abilities and legendary resources (NPC only) */}
            {c.type === 'npc' && (c.legendaryActions || c.legendaryResistances || (c.rechargeAbilities && c.rechargeAbilities.length > 0)) && (
              <div data-testid="compact-indicators" className="flex flex-row flex-wrap items-center gap-1 font-sans text-[9px] font-bold uppercase tracking-wide">
                {/* Legendary Actions */}
                {c.legendaryActions && (
                  <div 
                    data-testid="legendary-actions-indicator"
                    className={cn(
                      "inline-flex items-center gap-1 px-1.5 py-[2px] rounded-full border select-none shrink-0",
                      c.legendaryActions.remaining === c.legendaryActions.max
                        ? "bg-amber-50 border-amber-300 text-amber-700 font-sans font-bold text-[9px] uppercase tracking-wide"
                        : c.legendaryActions.remaining > 0
                        ? "bg-amber-50 border-amber-200 text-amber-500 font-sans font-bold text-[9px] uppercase tracking-wide"
                        : "bg-gray-100 border-gray-200 text-gray-400 font-sans font-bold text-[9px] uppercase tracking-wide"
                    )}
                  >
                    <Zap className="w-3 h-3 fill-current" />
                    <span>{c.legendaryActions.remaining}/{c.legendaryActions.max}</span>
                  </div>
                )}

                {/* Legendary Resistances */}
                {c.legendaryResistances && (
                  <div 
                    data-testid="legendary-resistances-indicator"
                    className={cn(
                      "inline-flex items-center gap-1 px-1.5 py-[2px] rounded-full border select-none shrink-0",
                      c.legendaryResistances.remaining === c.legendaryResistances.max
                        ? "bg-blue-50 border-blue-300 text-blue-700 font-sans font-bold text-[9px] uppercase tracking-wide"
                        : c.legendaryResistances.remaining > 0
                        ? "bg-blue-50 border-blue-200 text-blue-500 font-sans font-bold text-[9px] uppercase tracking-wide"
                        : "bg-gray-100 border-gray-200 text-gray-400 font-sans font-bold text-[9px] uppercase tracking-wide"
                    )}
                  >
                    <Shield className="w-3 h-3" />
                    <span>{c.legendaryResistances.remaining}/{c.legendaryResistances.max}</span>
                  </div>
                )}

                {/* Recharge Abilities */}
                {c.rechargeAbilities && c.rechargeAbilities.map((ability) => {
                  const truncated = ability.name.length <= 12 ? ability.name : ability.name.slice(0, 12) + '...';
                  return (
                    <button
                      key={ability.name}
                      data-testid={`recharge-indicator-${ability.name.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (ability.isCharged) {
                          handleMarkSpent(ability.name);
                        }
                      }}
                      className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-[2px] rounded-full border select-none shrink-0 font-sans font-bold text-[9px] uppercase tracking-wide transition-all outline-none focus:outline-none",
                        ability.isCharged
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 cursor-pointer hover:bg-emerald-100"
                          : "bg-red-50 border-red-200 text-red-700 cursor-default"
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", ability.isCharged ? "bg-emerald-500" : "bg-red-400")} />
                      <span>{truncated}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 5. Current HP value */}
            <div 
              className="flex items-center gap-3 border-l border-[#f5f5f0] pl-4 shrink-0"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col items-center">
                <AnimatedHpDisplay
                  value={c.currentHp}
                  maxHp={maxHpCeiling}
                  isActive={isActive}
                  colorClass={c.currentHp <= maxHpCeiling / 2 ? (c.currentHp <= 0 ? 'text-red-700' : 'text-[#c5b358]') : 'text-[#2c2c26]'}
                  className="p-0"
                />
              </div>
            </div>

          </div>

          {/* RIGHT CONTAINER */}
          <div data-testid="right-container" className="shrink-0 flex flex-row items-center justify-end gap-3 flex-nowrap pl-2">
            
            {/* 1, 2, 3, 4, 5: Damage and Heal Inputs / Buttons wrapped in their structured wrappers */}
            <div className="min-w-0 flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <div className="flex flex-nowrap items-center gap-2 ml-auto" id={`hp-controls-${c.id}`}>
                {/* Damage Row & Inputs */}
                <div 
                  className={cn(
                    "flex items-center gap-1 p-1 rounded-lg transition-all",
                    hpMode === 'damage' ? "bg-red-50 border border-red-200/80 shadow-sm" : "opacity-75 hover:opacity-100"
                  )}
                >
                  <input
                    id={`damage-input-${c.id}`}
                    type="number"
                    value={damageInput}
                    onChange={e => onDamageInputChange(e.target.value)}
                    placeholder="0"
                    disabled={isSyncing}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onHealthSubmit(true, selectedDamageType || null);
                        setSelectedDamageType(null);
                      }
                    }}
                    className={cn(
                      'w-18 h-8 bg-[#faf9f6]/50 border border-[#e5e1d8] rounded px-1 text-center outline-none focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] font-sans text-base font-bold disabled:opacity-50',
                      isActive && 'bg-white border-[#c5b358]/50'
                    )}
                  />
                  <select
                    id={`damage-type-select-${c.id}`}
                    value={selectedDamageType || ''}
                    onChange={e => setSelectedDamageType((e.target.value as DamageType) || null)}
                    disabled={isSyncing}
                    className="w-28 h-8 bg-[#faf9f6]/80 border border-[#e5e1d8] rounded px-1 text-xs font-bold text-[#5a5a40] outline-none cursor-pointer focus:border-[#c5b358] appearance-auto"
                  >
                    <option value="">Damage Type</option>
                    {DAMAGE_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      onHealthSubmit(true, selectedDamageType || null);
                      setSelectedDamageType(null);
                    }}
                    disabled={isSyncing}
                    className="px-2 h-8 leading-none bg-red-55 text-red-700 hover:bg-red-100 border border-red-100 rounded-md text-xs font-bold uppercase disabled:opacity-50 cursor-pointer"
                    title="Damage"
                  >
                    DMG
                  </button>
                </div>
                
                <div className="border-l border-[#f5f5f0]">&nbsp;</div>
                
                {/* Heal Row & Inputs */}
                <div 
                  className={cn(
                    "flex items-center gap-1 p-1 rounded-lg transition-all",
                    hpMode === 'heal' ? "bg-emerald-50 border border-emerald-200/80 shadow-sm" : "opacity-75 hover:opacity-100"
                  )}
                >
                  <input
                    id={`heal-input-${c.id}`}
                    type="number"
                    value={healInput}
                    onChange={e => onHealInputChange(e.target.value)}
                    placeholder="0"
                    disabled={isSyncing}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onHealthSubmit(false, null);
                      }
                    }}
                    className={cn(
                      'w-18 h-8 bg-[#faf9f6]/50 border border-[#e5e1d8] rounded px-1 text-center outline-none focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] font-sans text-base font-bold disabled:opacity-50',
                      isActive && 'bg-white border-[#c5b358]/50'
                    )}
                  />
                  <button
                    onClick={() => onHealthSubmit(false, null)}
                    disabled={isSyncing}
                    className="px-2 h-8 leading-none bg-green-50 text-green-700 hover:bg-green-100 border border-green-100 rounded-md text-xs font-bold uppercase disabled:opacity-50 cursor-pointer"
                    title="Heal"
                  >
                    HEAL
                  </button>
                </div>
              </div>
            </div>

            {/* 6. Player view eye icon (if present) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="p-2 text-[#5a5a40] opacity-40 hover:opacity-100 hover:bg-[#f5f5f0] rounded transition-all shrink-0 cursor-pointer"
            >
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                <Eye className="w-5 h-5" />
              </motion.div>
            </button>

          </div>
        </div>
      </div>

      {/* Expanded View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-[#f5f5f0] space-y-5">
              {c.notes && (
                <p className="text-sm text-[#5a5a40] opacity-60 italic">{c.notes}</p>
              )}

              <div id={`combatant-stat-grid-${c.id}`} className="flex gap-4">
                {/* Left column: IRV */}
                <div className="w-[60%] space-y-4 bg-[#faf9f6]/30 p-4 rounded-xl border border-[#e5e1d8]">
                  <ReadOnlyIrvDisplay label="Resistances" items={c.resistances || ''} theme="resistances" />
                  <ReadOnlyIrvDisplay label="Immunities" items={c.immunities || ''} theme="immunities" />
                  <ReadOnlyIrvDisplay label="Vulnerabilities" items={c.vulnerabilities || ''} theme="vulnerabilities" />
                </div>
                {/* Right column: HP stats */}
                <div className="w-[40%] flex flex-col gap-3">
                  <div className="bg-[#faf9f6] p-3 rounded-xl border border-[#e5e1d8] text-center flex-1 flex flex-col justify-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#5a5a40] block mb-1">Temp HP</span>
                    <input
                      type="number"
                      value={c.tempHp || ''}
                      onChange={e => onUpdateCombatant({ tempHp: e.target.value ? parseInt(e.target.value) : 0 })}
                      placeholder="0"
                      disabled={isSyncing}
                      className="w-full bg-transparent text-center font-bold text-blue-600 outline-none text-base disabled:opacity-50"
                    />
                  </div>
                  <div className="bg-[#faf9f6] p-3 rounded-xl border border-[#e5e1d8] text-center flex-1 flex flex-col justify-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#5a5a40] block mb-1">Max HP</span>
                    {c.tempHpMax && c.tempHpMax > 0 ? (
                      <span 
                        className="font-bold text-base text-amber-600 cursor-help" 
                        title={`Temp max (original: ${c.maxHp})`}
                      >
                        {c.tempHpMax}
                      </span>
                    ) : (
                      <span className="font-bold text-base text-[#5a5a40]">{c.maxHp}</span>
                    )}
                  </div>
                </div>
              </div>

              {(mechanicalSummary.lines.length > 0 || mechanicalSummary.speedHalved || mechanicalSummary.hpMaxHalved) && (
                <div className="bg-[#faf9f6]/30 p-4 rounded-xl border border-[#e5e1d8]">
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-3">Combat Mechanics</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                    {mechanicalSummary.speedLocked && (
                      <div className="flex items-start gap-2">
                        <Lock className="w-4 h-4 mt-0.5 text-slate-700 shrink-0" />
                        <div className="min-w-0 font-sans text-sm font-bold text-slate-700">
                          Speed: Locked <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.speedLocked.join(', ')})</span>
                        </div>
                      </div>
                    )}
                    {mechanicalSummary.speedHalved && !isSpeedZero && (
                      <div className="flex items-start gap-2">
                        <Lock className="w-4 h-4 mt-0.5 text-slate-600 shrink-0" />
                        <div className="min-w-0 font-sans text-sm font-bold text-slate-600">
                          Speed: Halved <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.speedHalved.join(', ')})</span>
                        </div>
                      </div>
                    )}
                    {mechanicalSummary.hpMaxHalved && (
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 text-pink-700 shrink-0" />
                        <div className="min-w-0 font-sans text-sm font-bold text-pink-700">
                          Max HP: Halved <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.hpMaxHalved.join(', ')})</span>
                        </div>
                      </div>
                    )}
                    {mechanicalSummary.actionsBlocked && (
                      <div className="flex items-start gap-2">
                        <Ban className="w-4 h-4 mt-0.5 text-orange-700 shrink-0" />
                        <div className="min-w-0 font-sans text-sm font-bold text-orange-700">
                          Actions: Blocked <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.actionsBlocked.join(', ')})</span>
                        </div>
                      </div>
                    )}
                    {mechanicalSummary.finalOutgoing === 'disadvantage' && (
                      <div className="flex items-start gap-2">
                        <TrendingDown className="w-4 h-4 mt-0.5 text-yellow-700 shrink-0" />
                        <div className="min-w-0 font-sans text-sm font-bold text-yellow-700">
                          Attacks: Disadvantage <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.outgoingDisadvantage.join(', ')})</span>
                        </div>
                      </div>
                    )}
                    {mechanicalSummary.finalOutgoing === 'advantage' && (
                      <div className="flex items-start gap-2">
                        <Zap className="w-4 h-4 mt-0.5 text-green-700 shrink-0" />
                        <div className="min-w-0 font-sans text-sm font-bold text-green-700">
                          Attacks: Advantage <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.outgoingAdvantage.join(', ')})</span>
                        </div>
                      </div>
                    )}
                    {mechanicalSummary.finalOutgoing === 'normal' && (
                      <div className="flex items-start gap-2">
                        <TrendingDown className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
                        <div className="min-w-0 font-sans text-sm font-bold text-gray-500">
                          Attacks: Normal (Cancelled) <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.outgoingAdvantage.join(', ')} vs {mechanicalSummary.sources.outgoingDisadvantage.join(', ')})</span>
                        </div>
                      </div>
                    )}
                    {mechanicalSummary.finalIncoming === 'advantage' && (
                      <div className="flex items-start gap-2">
                        <Target className="w-4 h-4 mt-0.5 text-purple-700 shrink-0" />
                        <div className="min-w-0 font-sans text-sm font-bold text-purple-700">
                          Incoming: Advantage <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.incomingAdvantage.join(', ')})</span>
                        </div>
                      </div>
                    )}
                    {mechanicalSummary.finalIncoming === 'disadvantage' && (
                      <div className="flex items-start gap-2">
                        <Target className="w-4 h-4 mt-0.5 text-blue-700 shrink-0" />
                        <div className="min-w-0 font-sans text-sm font-bold text-blue-700">
                          Incoming: Disadvantage <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.incomingDisadvantage.join(', ')})</span>
                        </div>
                      </div>
                    )}
                    {mechanicalSummary.finalIncoming === 'normal' && (
                      <div className="flex items-start gap-2">
                        <Target className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
                        <div className="min-w-0 font-sans text-sm font-bold text-gray-500">
                          Incoming: Normal (Cancelled) <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.incomingAdvantage.join(', ')} vs {mechanicalSummary.sources.incomingDisadvantage.join(', ')})</span>
                        </div>
                      </div>
                    )}
                    {mechanicalSummary.critVulnerable && (
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 text-red-700 shrink-0" />
                        <div className="min-w-0 font-sans text-sm font-bold text-red-700">
                          Melee hits: Auto-crit <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.critVulnerable.join(', ')})</span>
                        </div>
                      </div>
                    )}
                    {mechanicalSummary.autoFailStr && (
                      <div className="flex items-start gap-2">
                        <ShieldOff className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
                        <div className="min-w-0 font-sans text-sm font-bold text-red-600">
                          STR saves: Auto-fail <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.autoFailStr.join(', ')})</span>
                        </div>
                      </div>
                    )}
                    {mechanicalSummary.autoFailDex && (
                      <div className="flex items-start gap-2">
                        <ShieldOff className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
                        <div className="min-w-0 font-sans text-sm font-bold text-red-600">
                          DEX saves: Auto-fail <span className="font-normal opacity-60 text-xs ml-1">({mechanicalSummary.sources.autoFailDex.join(', ')})</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recharge Abilities Section */}
              {c.type === 'npc' && c.rechargeAbilities && c.rechargeAbilities.length > 0 && (
                <div className="bg-[#faf9f6]/30 p-4 rounded-xl border border-[#e5e1d8] space-y-3" id={`recharge-abilities-sec-${c.id}`}>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40]">Recharge Abilities</label>
                  <div className="space-y-2.5">
                    {c.rechargeAbilities.map((ability) => {
                      const thresholdText = ability.rechargeOn === 6 ? '6' : `${ability.rechargeOn}-6`;
                      const isCharged = ability.isCharged;
                      const rolledNum = recentRechargeRolls[ability.name];

                      return (
                        <div
                          key={ability.name}
                          id={`recharge-row-${ability.name.toLowerCase().replace(/\s+/g, '-')}-${c.id}`}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#faf9f6] border border-[#e5e1d8]/60"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-serif text-sm font-bold truncate text-[#2c2c26]">
                              {ability.name}
                            </span>
                            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-[#c5b358] border border-[#c5b358]/30">
                              ⚡ Recharge {thresholdText}
                            </span>
                            <AnimatePresence>
                              {rolledNum !== undefined && (
                                <motion.span
                                  initial={{ scale: 0.3, opacity: 0, rotate: -15 }}
                                  animate={{ scale: [1.3, 1], opacity: 1, rotate: 0 }}
                                  exit={{ opacity: 0, scale: 0.5 }}
                                  transition={{ type: 'spring', stiffness: 200 }}
                                  className="font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-xs shadow-sm flex items-center gap-1"
                                >
                                  🎲 Rolled: {rolledNum}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isCharged ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">
                                READY
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                                SPENT
                              </span>
                            )}

                            {isCharged ? (
                              <button
                                id={`btn-mark-spent-${ability.name.toLowerCase().replace(/\s+/g, '-')}-${c.id}`}
                                onClick={() => handleMarkSpent(ability.name)}
                                disabled={isSyncing}
                                className="px-2 py-1 text-xs font-bold border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded transition-all cursor-pointer"
                              >
                                Mark Spent
                              </button>
                            ) : (
                              <button
                                id={`btn-roll-recharge-${ability.name.toLowerCase().replace(/\s+/g, '-')}-${c.id}`}
                                onClick={() => handleRechargeRoll(ability.name, ability.rechargeOn)}
                                disabled={isSyncing}
                                className="px-2 py-1 text-xs font-bold border border-[#c5b358] text-[#c5b358] bg-white hover:bg-[#faf9f6]/85 rounded transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                              >
                                🎲 Roll Recharge
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Legendary Resistances Section */}
              {c.type === 'npc' && c.legendaryResistances && (
                <div className="bg-[#faf9f6]/30 p-4 rounded-xl border border-[#e5e1d8] space-y-3" id={`legendary-resistances-sec-${c.id}`}>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40]">Legendary Resistances</label>
                    <button
                      id={`btn-restore-resistances-${c.id}`}
                      onClick={handleRestoreResistances}
                      disabled={isSyncing}
                      className="px-2 py-1 text-[10px] font-bold border border-[#c5b358] text-[#c5b358] bg-white hover:bg-[#faf9f6]/85 rounded transition-all cursor-pointer shadow-sm"
                    >
                      Restore All
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5 bg-[#faf9f6] p-2.5 rounded-lg border border-[#e5e1d8]/60">
                    <div className="flex items-center gap-2" id={`resistances-pips-container-${c.id}`}>
                      {Array.from({ length: c.legendaryResistances.max }).map((_, idx) => {
                        const isFilled = idx < c.legendaryResistances.remaining;
                        return (
                          <button
                            key={idx}
                            id={`btn-resistance-pip-${idx}-${c.id}`}
                            onClick={() => isFilled && handleSpendResistance()}
                            disabled={isSyncing || !isFilled}
                            className={cn(
                              "transition-transform duration-100 focus:outline-none",
                              isFilled ? "cursor-pointer hover:scale-110" : "cursor-default"
                            )}
                          >
                            <Shield
                              className={cn(
                                "w-5 h-5 transition-colors",
                                isFilled ? "fill-[#c5b358] text-[#c5b358]" : "text-stone-300"
                              )}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-[10px] font-bold text-stone-500 font-sans" id={`resistances-status-text-${c.id}`}>
                      {c.legendaryResistances.remaining} / {c.legendaryResistances.max} remaining
                    </span>
                  </div>
                </div>
              )}

              {/* Legendary Actions Section */}
              {c.type === 'npc' && c.legendaryActions && (
                <div className="bg-[#faf9f6]/30 p-4 rounded-xl border border-[#e5e1d8] space-y-3" id={`legendary-actions-sec-${c.id}`}>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40]">Legendary Actions</label>
                    <button
                      id={`btn-restore-actions-${c.id}`}
                      onClick={handleRestoreActions}
                      disabled={isSyncing}
                      className="px-2 py-1 text-[10px] font-bold border border-[#c5b358] text-[#c5b358] bg-white hover:bg-[#faf9f6]/85 rounded transition-all cursor-pointer shadow-sm"
                    >
                      Restore All
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5 bg-[#faf9f6] p-2.5 rounded-lg border border-[#e5e1d8]/60">
                    <div className="flex items-center gap-2" id={`actions-pips-container-${c.id}`}>
                      {Array.from({ length: c.legendaryActions.max }).map((_, idx) => {
                        const isFilled = idx < c.legendaryActions.remaining;
                        return (
                          <button
                            key={idx}
                            id={`btn-action-pip-${idx}-${c.id}`}
                            onClick={() => isFilled && handleSpendAction()}
                            disabled={isSyncing || !isFilled}
                            className={cn(
                              "transition-transform duration-100 focus:outline-none",
                              isFilled ? "cursor-pointer hover:scale-110" : "cursor-default"
                            )}
                          >
                            <Zap
                              className={cn(
                                "w-5 h-5 transition-colors",
                                isFilled ? "fill-amber-400 text-amber-500" : "text-stone-300"
                              )}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-[10px] font-bold text-stone-500 font-sans" id={`actions-status-text-${c.id}`}>
                      {c.legendaryActions.remaining} / {c.legendaryActions.max} remaining
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-2">Conditions</label>
                <ConditionChips
                  value={c.conditions || ''}
                  onChange={val => onUpdateCombatant({ conditions: val })}
                  immunities={c.immunities || ''}
                  disabled={isSyncing}
                  onAddWithTimer={(condName, rounds) => {
                    const expiresAtRound = currentRound + rounds;
                    const currentConditions = c.conditions || '';
                    let currentCondList = currentConditions.split(',').map(s => s.trim()).filter(Boolean);

                    const isExhaustion = /^exhaustion \d$/i.test(condName);
                    if (isExhaustion) {
                      currentCondList = currentCondList.filter(x => !/^exhaustion \d$/i.test(x.trim()));
                    }

                    const currentCondListLower = currentCondList.map(s => s.toLowerCase());
                    let newConditions = currentConditions;
                    if (!currentCondListLower.includes(condName.toLowerCase())) {
                      newConditions = [...currentCondList, condName].join(', ');
                    } else {
                      newConditions = currentCondList.join(', ');
                    }

                    const newTimers = { ...(c.conditionTimers || {}) };
                    if (isExhaustion) {
                      Object.keys(newTimers).forEach(key => {
                        if (/^exhaustion \d$/i.test(key)) {
                           delete newTimers[key];
                        }
                      });
                    }
                    newTimers[condName] = expiresAtRound;

                    onUpdateCombatant({
                      conditions: newConditions,
                      conditionTimers: newTimers,
                    });
                  }}
                  currentRound={currentRound}
                  onConcentrationEffectAdded={(effectName) => {
                    if (onConcentrationPrompt) {
                      onConcentrationPrompt(effectName, c.name);
                    }
                  }}
                />
              </div>

              {/* Display active condition timers as pill badges */}
              {c.conditionTimers && Object.keys(c.conditionTimers).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2" id={`condition-timers-list-${c.id}`}>
                  {Object.entries(c.conditionTimers).map(([condName, expiresAt]) => (
                    <span
                      key={condName}
                      className="inline-flex items-center gap-2 bg-[#faf9f6]/80 border border-[#e5e1d8] hover:border-[#c5b358] text-[#5a5a40] text-xs font-bold px-3 py-1 rounded-full transition-colors"
                    >
                      <span>{condName} ends round {expiresAt}</span>
                      <button
                        onClick={() => {
                          const newTimers = { ...(c.conditionTimers || {}) };
                          delete newTimers[condName];
                          onUpdateCombatant({
                            conditionTimers: newTimers,
                          });
                        }}
                        className="hover:text-red-600 transition-colors cursor-pointer text-xs leading-none ml-1 font-black"
                        title="Remove timer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-[#f5f5f0]">
                <span className="text-xs text-[#5a5a40] opacity-40 font-mono tracking-tighter">{c.id.split('-').pop()}</span>
                <button
                  onClick={onRemoveCombatant}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 rounded-full transition-all border border-transparent hover:border-red-100"
                >
                  <Trash2 className="w-4 h-4" /> Remove Combatant
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
