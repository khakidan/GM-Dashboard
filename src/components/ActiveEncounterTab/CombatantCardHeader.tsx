import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { ChevronDown, Zap, ZapOff, Skull } from 'lucide-react';
import { AnimatedHpDisplay } from './AnimatedHpDisplay';
import { InitiativeInput } from './InitiativeInput';
import { CombatantCompactIndicators } from './CombatantCompactIndicators';
import { cn } from '../../lib/utils';
import { Combatant, DamageType } from '../../types';
import { getHealthStatus, effectiveAc, effectiveMaxHp } from '../../lib/conditions';
import { DAMAGE_TYPE_OPTIONS } from '../../lib/conditions';
import { CombatantCardBadges } from './CombatantCardBadges';
import { DeathSaveTrackerDisplay } from './DeathSaveTrackerDisplay';
import { useCombatantCard } from './hooks/useCombatantCard';
import { useAppState } from '../../hooks/useAppState';
import { parseResourcePools, spendResourcePip, recoverResourcePip, serializeResourcePools, ResourcePool } from '../../lib/resourcePools';


export interface CombatantCardHeaderProps {
  c: Combatant;
  isExpanded: boolean;
  onToggleExpand: () => void;
  damageInput: string;
  healInput: string;
  onDamageInputChange: (val: string) => void;
  onHealInputChange: (val: string) => void;
  onHealthSubmit: (isDamage: boolean, damageType?: DamageType | null) => void;
  onUpdateCombatant: (updates: Partial<Combatant>) => void;
  onToggleSelect?: (id: string) => void;
  onMarkSpent?: (abilityName: string) => void;
  hpMode?: 'damage' | 'heal';
  selectionCheckbox?: React.ReactNode;
  onUpdateResourcePools?: (combatant: Combatant, pools: ResourcePool[]) => void;
}

export function CombatantCardHeader({
  c,
  isExpanded,
  onToggleExpand,
  damageInput,
  healInput,
  onDamageInputChange,
  onHealInputChange,
  onHealthSubmit,
  onUpdateCombatant,
  onToggleSelect,
  onMarkSpent,
  hpMode,
  selectionCheckbox,
  onUpdateResourcePools,
}: CombatantCardHeaderProps) {
  const { isActiveTurn, isSelected, isSelectable, isSyncing } = useCombatantCard(c.id);
  const { state, updateState } = useAppState();
  const { name, ac, tempAcModifier, initiative, type } = c;

  const [selectedDamageType, setSelectedDamageType] = useState<DamageType | null>(null);
  const maxHpCeiling = effectiveMaxHp(c.maxHp, c.tempHpMax || 0);

  return (
    <div className="flex flex-col">
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
        <div data-testid="left-container" className="flex-1 flex flex-row items-center justify-start gap-4 overflow-hidden animate-none">
          {/* 1. Selection checkbox (if in selection mode) */}
          {selectionCheckbox || (isSelectable && (
            <div onClick={e => e.stopPropagation()} className="flex items-center shrink-0">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect?.(c.id)}
                className="w-5 h-5 rounded border-[#2563eb] text-[#2563eb] focus:ring-[#2563eb] cursor-pointer"
              />
            </div>
          ))}

          {/* 2. Initiative bubble (the INIT circle) */}
          <div 
            className="flex flex-col items-center shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <span className="text-[10px] font-bold uppercase text-[#8d8db9] opacity-60 leading-none mb-1">Init</span>
            <InitiativeInput
              value={initiative}
              onSave={val => onUpdateCombatant({ initiative: val })}
              disabled={isSyncing}
            />
          </div>

          {/* 3. Combatant name and AC badge */}
          <div className="min-w-0 flex flex-wrap items-center gap-2">
            <h3 className={cn(
              'text-lg font-bold font-serif truncate flex items-center gap-2', 
              type === 'npc' 
                ? (c.currentHp <= 0 ? 'text-[#8d8db9]' : 'text-red-800') 
                : 'text-[#0f172a]'
            )}>
              {name}
              {type === 'npc' && c.currentHp <= 0 && (
                <Skull className="w-4 h-4 text-[#8d8db9] shrink-0" />
              )}
            </h3>
            {c.conditions?.toLowerCase().includes('concentrating') && (
              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded border bg-purple-100 text-purple-700 border-purple-200">
                CON
              </span>
            )}
            <DeathSaveTrackerDisplay
              deathSavesFails={c.deathSavesFails || 0}
              deathSavesSuccesses={c.deathSavesSuccesses || 0}
              isUnconscious={c.conditions?.toLowerCase().includes('unconscious') || false}
              type={type}
              isStable={c.isStable}
              cId={c.id}
            />
            {c.currentHp < maxHpCeiling && c.currentHp > 0 && (
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full border border-current bg-white/50 shrink-0",
                getHealthStatus(c.currentHp, maxHpCeiling).color
              )}>
                {getHealthStatus(c.currentHp, maxHpCeiling).label}
              </span>
            )}
            {(() => {
              const baseAc = ac;
              const acMod = tempAcModifier || 0;
              const effAc = effectiveAc(baseAc, acMod);
              if (acMod === 0) {
                return <span className="text-sm font-bold text-[#567eff] whitespace-nowrap">(AC {baseAc})</span>;
              }
              const sign = acMod > 0 ? '+' : '';
              return <span className="text-sm font-bold text-[#2563eb] whitespace-nowrap">(AC {effAc} ({sign}{acMod}))</span>;
            })()}
            <CombatantCardBadges conditions={c.conditions || ''} combatant={c} />
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

          <CombatantCompactIndicators type={type} c={c} onMarkSpent={onMarkSpent} />

          {/* 5. Current HP value */}
          <div 
            className="flex items-center gap-3 border-l border-[#e2e8f0] pl-4 shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center">
              <AnimatedHpDisplay
                value={c.currentHp}
                maxHp={maxHpCeiling}
                isActive={isActiveTurn}
                colorClass={c.currentHp <= maxHpCeiling / 2 ? (c.currentHp <= 0 ? 'text-red-700' : 'text-[#567eff]') : 'text-[#0f172a]'}
                className="p-0"
              />
            </div>
          </div>

        </div>

        {/* RIGHT CONTAINER */}
        <div data-testid="right-container" className="shrink-0 flex flex-row items-center justify-end gap-3 flex-nowrap pl-2 animate-none">
          
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
                    'w-18 h-8 bg-transparent border border-[#e2e8f0] rounded px-1 text-center outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/30 font-sans text-base font-bold disabled:opacity-50',
                    isActiveTurn && 'bg-white border-[#2563eb]/50'
                  )}
                />
                <select
                  id={`damage-type-select-${c.id}`}
                  value={selectedDamageType || ''}
                  onChange={e => {
                    const raw = e.target.value;
                    const isValidDamageType = (v: string): v is DamageType =>
                      (DAMAGE_TYPE_OPTIONS as readonly string[]).includes(v);
                    if (isValidDamageType(raw)) {
                      setSelectedDamageType(raw);
                    } else {
                      setSelectedDamageType(null);
                    }
                  }}
                  disabled={isSyncing}
                  className="w-28 h-8 bg-transparent border border-[#e2e8f0] rounded px-1 text-xs font-bold text-[#8d8db9] outline-none cursor-pointer focus:border-[#2563eb] appearance-auto"
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
              
              <div className="border-l border-[#e2e8f0]">&nbsp;</div>
              
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
                    'w-18 h-8 bg-transparent border border-[#e2e8f0] rounded px-1 text-center outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/30 font-sans text-base font-bold disabled:opacity-50',
                    isActiveTurn && 'bg-white border-[#2563eb]/50'
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
            className="p-2 text-[#8d8db9] opacity-40 hover:opacity-100 hover:bg-[#f9f8ff] rounded transition-all shrink-0 cursor-pointer"
          >
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </button>

        </div>
      </div>
    </div>

    {/* COMPACT RESOURCE ROW */}
    {c.type === 'pc' && (() => {
      const char = state.characters.find(charItem => charItem.id === c.characterId);
      if (!char) return null;
      const pools = parseResourcePools(char.resourcePools || '[]');
      if (pools.length === 0) return null;
      
      return (
        <div 
          onClick={e => e.stopPropagation()}
          className="border-t border-[#e2e8f0] px-4 py-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs select-none bg-[#f9f8ff]/40 rounded-b-2xl"
        >
          {pools.map(pool => (
            <div key={pool.name} className="inline-flex items-center gap-1.5" id={`compact-pool-${pool.name.toLowerCase().replace(/\s+/g, '-')}`}>
              <span className="font-sans font-bold text-[#8d8db9] uppercase tracking-wide text-[10px]">
                {pool.name.length > 10 ? `${pool.name.slice(0, 10)}...` : pool.name}
              </span>
              <button
                onClick={() => {
                  if (pool.current <= 0 || isSyncing) return;
                  const updatedPools = spendResourcePip(pools, pool.name, 1);
                  onUpdateResourcePools?.(c, updatedPools);
                }}
                disabled={pool.current <= 0 || isSyncing}
                className="w-4 h-4 inline-flex items-center justify-center border border-[#e2e8f0] rounded text-[10px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-30 cursor-pointer select-none leading-none"
                title="Spend 1 Use"
                id={`compact-spend-${c.id}-${pool.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                -
              </button>
              <span className="font-mono font-bold text-xs text-[#0f172a]">
                {pool.current}/{pool.max}
              </span>
              <button
                onClick={() => {
                  if (pool.current >= pool.max || isSyncing) return;
                  const updatedPools = recoverResourcePip(pools, pool.name, 1);
                  onUpdateResourcePools?.(c, updatedPools);
                }}
                disabled={pool.current >= pool.max || isSyncing}
                className="w-4 h-4 inline-flex items-center justify-center border border-[#e2e8f0] rounded text-[10px] font-bold text-green-700 hover:bg-green-50 disabled:opacity-30 cursor-pointer select-none leading-none"
                title="Recover 1 Use"
                id={`compact-recover-${c.id}-${pool.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                +
              </button>
            </div>
          ))}
        </div>
      );
    })()}
  </div>
);
}
