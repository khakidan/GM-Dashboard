import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Eye, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Combatant, DamageType } from '../../types';

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
      className="w-12 h-6 bg-[#faf9f6]/50 border border-[#e5e1d8] rounded text-center font-bold text-[#c5b358] outline-none text-[10px] focus:border-[#c5b358] focus:bg-white disabled:opacity-50"
    />
  );
};

export interface CombatantCardProps {
  key?: React.Key;
  c: Combatant;
  isActive: boolean;
  isExpanded: boolean;
  isSyncing: boolean;
  healthInput: string;
  currentRound: number;
  onHealthInputChange: (val: string) => void;
  onHealthSubmit: (isDamage: boolean, damageType?: DamageType | null) => void;
  onToggleExpand: () => void;
  onUpdateCombatant: (updates: Partial<Combatant>) => void;
  onRemoveCombatant: () => void | Promise<void>;
}

export function CombatantCard({
  c,
  isActive,
  isExpanded,
  isSyncing,
  healthInput,
  currentRound,
  onHealthInputChange,
  onHealthSubmit,
  onToggleExpand,
  onUpdateCombatant,
  onRemoveCombatant
}: CombatantCardProps) {
  const [selectedDamageType, setSelectedDamageType] = useState<DamageType | null>(null);
  const [timerConditionName, setTimerConditionName] = useState('');
  const [timerRounds, setTimerRounds] = useState('');
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative bg-white border-2 rounded-2xl transition-all h-fit',
        isActive ? 'border-[#c5b358] shadow-md z-10' : 'border-[#e5e1d8] hover:border-[#c5b358]/40',
        c.currentHp <= 0 ? 'opacity-60 grayscale-[0.5]' : ''
      )}
    >
      {isActive && (
        <div className="absolute -top-3 left-6 bg-[#c5b358] text-[#2c2c26] text-[7px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm z-20 flex items-center gap-1">
          <Zap className="w-2 h-2 fill-current" /> Active
        </div>
      )}

      {/* Widget Header */}
      <div className="p-3 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div className="flex flex-col items-center shrink-0">
            <span className="text-[6px] font-bold uppercase text-[#5a5a40] opacity-60 leading-none mb-0.5">Init</span>
            <InitiativeInput
              value={c.initiative}
              onSave={val => onUpdateCombatant({ initiative: val })}
              disabled={isSyncing}
            />
          </div>
          <div className="min-w-0 flex items-center gap-2">
            <h3 className={cn('text-base font-bold font-serif truncate', c.type === 'npc' ? 'text-red-800' : 'text-[#2c2c26]')}>
              {c.name}
            </h3>
            <span className="text-[10px] font-bold text-[#b0a04f] whitespace-nowrap">(AC {c.ac})</span>
            {c.conditions && c.conditions.split(',').filter(Boolean).length > 0 && (
              <div className="flex -space-x-1">
                {c.conditions.split(',').map((cond, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-red-500 border border-white shadow-sm" title={cond.trim()} />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-l border-[#f5f5f0] pl-3">
            <div className="flex flex-col items-center">
              <AnimatedHpDisplay
                value={c.currentHp}
                maxHp={c.maxHp}
                isActive={isActive}
                colorClass={c.currentHp <= c.maxHp / 2 ? (c.currentHp <= 0 ? 'text-red-700' : 'text-[#c5b358]') : 'text-[#2c2c26]'}
                className="p-0"
              />
            </div>

            <div className="flex items-center gap-1.5 ml-2" id={`hp-controls-${c.id}`}>
              <input
                type="number"
                value={healthInput}
                onChange={e => onHealthInputChange(e.target.value)}
                placeholder="0"
                disabled={isSyncing}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (selectedDamageType === null) {
                      onHealthSubmit(true);
                    } else {
                      onHealthSubmit(true, selectedDamageType);
                    }
                    setSelectedDamageType(null);
                  }
                }}
                className={cn(
                  'w-14 bg-[#faf9f6]/50 border border-[#e5e1d8] rounded px-1 py-1 text-center outline-none focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] font-sans text-xs font-bold disabled:opacity-50',
                  isActive && 'bg-white border-[#c5b358]/50'
                )}
              />

              <select
                id={`damage-type-select-${c.id}`}
                value={selectedDamageType || ''}
                onChange={e => setSelectedDamageType((e.target.value as DamageType) || null)}
                disabled={isSyncing}
                className="w-16 bg-[#faf9f6] border border-[#e5e1d8] rounded px-0.5 py-0.5 text-[8px] font-bold text-[#5a5a40] outline-none cursor-pointer focus:border-[#c5b358]"
              >
                <option value="">— type —</option>
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

              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => onHealthSubmit(false)}
                  disabled={isSyncing}
                  className="px-1.5 py-0.5 leading-none bg-green-50 text-green-700 hover:bg-green-100 border border-green-100 rounded-[4px] text-[7px] font-bold uppercase disabled:opacity-50"
                >
                  H
                </button>
                <button
                  onClick={() => {
                    if (selectedDamageType === null) {
                      onHealthSubmit(true);
                    } else {
                      onHealthSubmit(true, selectedDamageType);
                    }
                    setSelectedDamageType(null);
                  }}
                  disabled={isSyncing}
                  className="px-1.5 py-0.5 leading-none bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 rounded-[4px] text-[7px] font-bold uppercase disabled:opacity-50"
                >
                  D
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onToggleExpand}
          className="p-1.5 text-[#5a5a40] opacity-40 hover:opacity-100 hover:bg-[#f5f5f0] rounded transition-all shrink-0"
        >
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
            <Eye className="w-4 h-4" />
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
            <div className="px-4 pb-4 pt-2 border-t border-[#f5f5f0] space-y-4">
              {c.notes && (
                <p className="text-[10px] text-[#5a5a40] opacity-60 italic">{c.notes}</p>
              )}

              {((c.resistances && c.resistances.trim()) ||
                (c.immunities && c.immunities.trim()) ||
                (c.vulnerabilities && c.vulnerabilities.trim())) && (
                <div id={`combatant-defenses-${c.id}`} className="text-[10px] space-y-1 bg-[#faf9f6] p-2 rounded-xl border border-[#e5e1d8]">
                  <div className="flex justify-between items-center gap-1">
                    <span className="font-bold text-[#5a5a40]">Resistances:</span>
                    <span className="font-medium text-amber-600 truncate max-w-[170px]" title={c.resistances}>
                      {c.resistances || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-1">
                    <span className="font-bold text-[#5a5a40]">Immunities:</span>
                    <span className="font-medium text-red-600 truncate max-w-[170px]" title={c.immunities}>
                      {c.immunities || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-1">
                    <span className="font-bold text-[#5a5a40]">Vulnerabilities:</span>
                    <span className="font-medium text-blue-600 truncate max-w-[170px]" title={c.vulnerabilities}>
                      {c.vulnerabilities || '—'}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#faf9f6] p-2 rounded-xl border border-[#e5e1d8] text-center">
                  <span className="text-[7px] font-bold uppercase tracking-tighter text-[#5a5a40] block mb-1">Temp HP</span>
                  <input
                    type="number"
                    value={c.tempHp || ''}
                    onChange={e => onUpdateCombatant({ tempHp: e.target.value ? parseInt(e.target.value) : 0 })}
                    placeholder="0"
                    disabled={isSyncing}
                    className="w-full bg-transparent text-center font-bold text-blue-600 outline-none text-sm disabled:opacity-50"
                  />
                </div>
                <div className="bg-[#faf9f6] p-2 rounded-xl border border-[#e5e1d8] text-center">
                  <span className="text-[7px] font-bold uppercase tracking-tighter text-[#5a5a40] block mb-1">Max HP</span>
                  <span className="font-bold text-sm text-[#5a5a40]">{c.maxHp}</span>
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">Conditions</label>
                <input
                  type="text"
                  value={c.conditions || ''}
                  onChange={e => onUpdateCombatant({ conditions: e.target.value })}
                  placeholder="e.g. Paralyzed"
                  disabled={isSyncing}
                  className="w-full bg-[#faf9f6] border border-[#e5e1d8] rounded-xl px-2 py-1.5 text-xs italic outline-none focus:bg-white focus:border-[#c5b358] transition-all disabled:opacity-50"
                />
              </div>

              {/* Set Timer Section */}
              <div className="space-y-2 mt-2">
                <span className="block text-[8px] font-bold uppercase tracking-widest text-[#5a5a40]">Set Timer</span>
                <div className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    placeholder="Condition name"
                    value={timerConditionName}
                    onChange={e => setTimerConditionName(e.target.value)}
                    disabled={isSyncing}
                    id={`timer-cond-name-${c.id}`}
                    className="flex-1 bg-[#faf9f6] border border-[#e5e1d8] rounded-xl px-2.5 py-1 text-xs outline-none focus:bg-white focus:border-[#c5b358]"
                  />
                  <input
                    type="number"
                    placeholder="Rounds"
                    value={timerRounds}
                    onChange={e => setTimerRounds(e.target.value)}
                    disabled={isSyncing}
                    id={`timer-rounds-${c.id}`}
                    className="w-16 bg-[#faf9f6]/50 border border-[#e5e1d8] rounded-xl px-2 py-1 text-center text-xs outline-none focus:bg-white focus:border-[#c5b358]"
                  />
                  <button
                    onClick={() => {
                      const condName = timerConditionName.trim();
                      const rounds = parseInt(timerRounds);
                      if (!condName || isNaN(rounds) || rounds <= 0) return;

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

                      setTimerConditionName('');
                      setTimerRounds('');
                    }}
                    disabled={isSyncing || !timerConditionName.trim() || !timerRounds}
                    id={`add-timer-btn-${c.id}`}
                    className="px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest bg-[#c5b358] text-white hover:bg-[#b09e4b] rounded-full transition-all disabled:opacity-50"
                  >
                    + Add
                  </button>
                </div>

                {/* Display active condition timers as pill badges */}
                {c.conditionTimers && Object.keys(c.conditionTimers).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5" id={`condition-timers-list-${c.id}`}>
                    {Object.entries(c.conditionTimers).map(([condName, expiresAt]) => (
                      <span
                        key={condName}
                        className="inline-flex items-center gap-1 bg-[#faf9f6]/80 border border-[#e5e1d8] hover:border-[#c5b358] text-[#5a5a40] text-[8px] font-bold px-2 py-0.5 rounded-full transition-colors"
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
                          className="hover:text-red-600 transition-colors cursor-pointer text-[10px] leading-none ml-1"
                          title="Remove timer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[#f5f5f0]">
                <span className="text-[8px] text-[#5a5a40] opacity-40 font-mono">{c.id.split('-').pop()}</span>
                <button
                  onClick={onRemoveCombatant}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 rounded-full transition-all border border-transparent hover:border-red-100"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
