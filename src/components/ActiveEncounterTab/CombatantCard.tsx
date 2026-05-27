import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Eye, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Combatant, DamageType } from '../../types';
import { getHealthStatus } from '../../lib/combatLogic';
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
    if (value > prevHp) {
      setAnimateState('heal');
    } else if (value < prevHp) {
      setAnimateState('damage');
    }

    setPrevHp(value);

    const t = setTimeout(() => setAnimateState('idle'), 500);
    return () => clearTimeout(t);
  }, [value]);

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
  onRemoveCombatant
}: CombatantCardProps) {
  const [selectedDamageType, setSelectedDamageType] = useState<DamageType | null>(null);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative bg-white border-2 rounded-2xl transition-all h-fit',
        isSelected ? 'border-[#c5b358] shadow-[0_0_15px_rgba(197,179,88,0.2)]' : (isActive ? 'border-[#c5b358] shadow-md z-10' : 'border-[#e5e1d8] hover:border-[#c5b358]/40'),
        c.currentHp <= 0 ? 'opacity-60 grayscale-[0.5]' : ''
      )}
    >
      {isActive && !isSelectable && (
        <div className="absolute -top-3 left-6 bg-[#c5b358] text-[#2c2c26] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm z-20 flex items-center gap-1">
          <Zap className="w-3 h-3 fill-current" /> Active
        </div>
      )}

      {isSelectable && (
        <div className="absolute top-3 left-3 z-30">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect?.(c.id)}
            className="w-5 h-5 rounded border-[#c5b358] text-[#c5b358] focus:ring-[#c5b358] cursor-pointer"
          />
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
        <div className={cn("flex-1 min-w-0 flex items-center gap-3", isSelectable && "pl-8")}>
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
          <div className="min-w-0 flex items-center gap-2">
            <h3 className={cn('text-lg font-bold font-serif truncate', c.type === 'npc' ? 'text-red-800' : 'text-[#2c2c26]')}>
              {c.name}
            </h3>
            {c.currentHp < c.maxHp && c.currentHp > 0 && (
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full border border-current bg-white/50 shrink-0",
                getHealthStatus(c.currentHp, c.maxHp).color
              )}>
                {getHealthStatus(c.currentHp, c.maxHp).label}
              </span>
            )}
            <span className="text-sm font-bold text-[#b0a04f] whitespace-nowrap">(AC {c.ac})</span>
            {c.conditions && c.conditions.split(',').filter(Boolean).length > 0 && (
              <div className="flex -space-x-1">
                {c.conditions.split(',').map((cond, i) => (
                  <div key={i} className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white shadow-sm" title={cond.trim()} />
                ))}
              </div>
            )}
          </div>

          <div 
            className="flex items-center gap-3 border-l border-[#f5f5f0] pl-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center">
              <AnimatedHpDisplay
                value={c.currentHp}
                maxHp={c.maxHp}
                isActive={isActive}
                colorClass={c.currentHp <= c.maxHp / 2 ? (c.currentHp <= 0 ? 'text-red-700' : 'text-[#c5b358]') : 'text-[#2c2c26]'}
                className="p-0"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 ml-2" id={`hp-controls-${c.id}`}>
              {/* Damage Row */}
              <div className="flex items-center gap-1">
                <input
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
                    'w-12 h-8 bg-[#faf9f6]/50 border border-[#e5e1d8] rounded px-1 text-center outline-none focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] font-sans text-base font-bold disabled:opacity-50',
                    isActive && 'bg-white border-[#c5b358]/50'
                  )}
                />
                <select
                  id={`damage-type-select-${c.id}`}
                  value={selectedDamageType || ''}
                  onChange={e => setSelectedDamageType((e.target.value as DamageType) || null)}
                  disabled={isSyncing}
                  className="w-24 h-8 bg-[#faf9f6] border border-[#e5e1d8] rounded px-1 text-xs font-bold text-[#5a5a40] outline-none cursor-pointer focus:border-[#c5b358] appearance-auto"
                >
                  <option value="">Damage Type</option>
                  <option value="acid">acid</option>
                  <option value="bludgeoning">bludgeoning</option>
                  <option value="bludgeoning (nonmagical)">bludgeoning (nonmagical)</option>
                  <option value="cold">cold</option>
                  <option value="fire">fire</option>
                  <option value="force">force</option>
                  <option value="lightning">lightning</option>
                  <option value="necrotic">necrotic</option>
                  <option value="piercing">piercing</option>
                  <option value="piercing (nonmagical)">piercing (nonmagical)</option>
                  <option value="poison">poison</option>
                  <option value="psychic">psychic</option>
                  <option value="radiant">radiant</option>
                  <option value="slashing">slashing</option>
                  <option value="slashing (nonmagical)">slashing (nonmagical)</option>
                  <option value="thunder">thunder</option>
                </select>
                <button
                  onClick={() => {
                    onHealthSubmit(true, selectedDamageType || null);
                    setSelectedDamageType(null);
                  }}
                  disabled={isSyncing}
                  className="px-2 h-8 leading-none bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 rounded-md text-xs font-bold uppercase disabled:opacity-50"
                  title="Damage"
                >
                  DMG
                </button>
              </div>
              <div className="border-l border-[#f5f5f0]">&nbsp;</div>
              {/* Heal Row */}
              <div className="flex items-center gap-1">
                <input
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
                    'w-12 h-8 bg-[#faf9f6]/50 border border-[#e5e1d8] rounded px-1 text-center outline-none focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] font-sans text-base font-bold disabled:opacity-50',
                    isActive && 'bg-white border-[#c5b358]/50'
                  )}
                />
                <button
                  onClick={() => onHealthSubmit(false, null)}
                  disabled={isSyncing}
                  className="px-2 h-8 leading-none bg-green-50 text-green-700 hover:bg-green-100 border border-green-100 rounded-md text-xs font-bold uppercase disabled:opacity-50"
                  title="Heal"
                >
                  HEAL
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="p-2 text-[#5a5a40] opacity-40 hover:opacity-100 hover:bg-[#f5f5f0] rounded transition-all shrink-0"
        >
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
            <Eye className="w-5 h-5" />
          </motion.div>
        </button>
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
                    <span className="font-bold text-base text-[#5a5a40]">{c.maxHp}</span>
                  </div>
                </div>
              </div>

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
                    const currentCondList = currentConditions.split(',').map(s => s.trim().toLowerCase());
                    let newConditions = currentConditions;
                    if (!currentCondList.includes(condName.toLowerCase())) {
                      newConditions = currentConditions
                        ? `${currentConditions}, ${condName}`
                        : condName;
                    }

                    const newTimers = { ...(c.conditionTimers || {}) };
                    newTimers[condName] = expiresAtRound;

                    onUpdateCombatant({
                      conditions: newConditions,
                      conditionTimers: newTimers,
                    });
                  }}
                  currentRound={currentRound}
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
