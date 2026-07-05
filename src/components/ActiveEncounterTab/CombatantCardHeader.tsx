import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { ChevronDown, Zap, ZapOff, Skull } from 'lucide-react';
import { AnimatedHpDisplay } from './AnimatedHpDisplay';
import { InitiativeInput } from './InitiativeInput';
import { CombatantCompactIndicators } from './CombatantCompactIndicators';
import { CombatantHealthControls } from './CombatantHealthControls';
import { CombatantCompactResourceRow } from './CombatantCompactResourceRow';
import { cn } from '../../lib/utils';
import { Combatant, DamageType, Character } from '../../types';
import { getHealthStatus, effectiveAc, effectiveMaxHp } from '../../lib/conditions';
import { CombatantCardBadges } from './CombatantCardBadges';
import { DeathSaveTrackerDisplay } from './DeathSaveTrackerDisplay';
import { useCombatantCard } from './hooks/useCombatantCard';
import { ResourcePool } from '../../lib/resourcePools';


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
  pcCharacter?: Character;
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
  pcCharacter,
}: CombatantCardHeaderProps) {
  const { isActiveTurn, isSelected, isSelectable, isSyncing } = useCombatantCard(c.id);
  const { name, ac, tempAcModifier, initiative, type } = c;

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
          
          <CombatantHealthControls
            c={c}
            damageInput={damageInput}
            healInput={healInput}
            onDamageInputChange={onDamageInputChange}
            onHealInputChange={onHealInputChange}
            onHealthSubmit={onHealthSubmit}
            isSyncing={isSyncing}
            isActiveTurn={isActiveTurn}
            hpMode={hpMode}
          />

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

    <CombatantCompactResourceRow
      c={c}
      isSyncing={isSyncing}
      onUpdateResourcePools={onUpdateResourcePools}
      character={pcCharacter}
    />
  </div>
);
}
