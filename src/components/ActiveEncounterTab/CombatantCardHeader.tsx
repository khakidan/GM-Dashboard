import React from 'react';
import { ChevronDown, Zap, ZapOff, Skull, HeartCrack, ShieldCheck } from 'lucide-react';
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
import { Badge } from '../ui/Badge';
import { ToggleBadge } from '../ui/ToggleBadge';
import { CardHeaderChevron } from '../ui/CardHeaderChevron';
import { parseAbilityScores, parseProficiencies, proficiencyBonusFromLevel, calculateModifier } from '../../lib/abilityScores';
import { getEffectiveSpellcastingAbility, calculateSpellSaveDC, calculateSpellAttackBonus } from '../../lib/spellcasting';

const healthStatusMap: Record<string, 'emerald' | 'green' | 'yellow' | 'red' | 'gray'> = {
  Full: 'emerald',
  Defeated: 'red',
  Healthy: 'green',
  Injured: 'yellow',
  Bloodied: 'red',
};

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
  const isPcDead = type === 'pc' && ((c.deathSavesFails || 0) >= 3 || c.statusId === 3) && !c.isStable;

  // Spellcasting stats computation for Row 1
  let spellcastingStatsElement: React.ReactNode = null;
  if (type === 'pc' && pcCharacter) {
    const parsedScores = parseAbilityScores(pcCharacter.abilityScores);
    const parsedProfs = parseProficiencies(pcCharacter.proficiencies);
    const profBonus = proficiencyBonusFromLevel(pcCharacter.level ?? 1);
    const effectiveAbility = getEffectiveSpellcastingAbility(pcCharacter.class, parsedProfs.spellcastingAbility);

    if (effectiveAbility !== null) {
      const mod = calculateModifier(parsedScores[effectiveAbility]);
      const dc = calculateSpellSaveDC(mod, profBonus);
      const atk = calculateSpellAttackBonus(mod, profBonus);
      const formattedAtk = atk >= 0 ? `+${atk}` : `\u2212${Math.abs(atk)}`;

      spellcastingStatsElement = (
        <span className="text-sm text-[#8d8db9] whitespace-nowrap">
          DC <span className="font-bold text-[#0f172a]">{dc}</span> · Atk <span className="font-bold text-[#0f172a]">{formattedAtk}</span>
        </span>
      );
    }
  }

  return (
    <div className="flex flex-col">
      <div 
        className={cn("p-4 flex flex-col gap-2 w-full", isSelectable && "cursor-pointer")}
        onClick={(e) => {
          if (isSelectable) {
            onToggleSelect?.(c.id);
          }
        }}
        data-testid="collapsed-card-row"
      >
        {/* ROW 1: VITALS */}
        <div className="flex flex-row items-center justify-between w-full gap-3">
          {/* Left side */}
          <div data-testid="left-container" className="flex-1 flex flex-row items-center justify-start gap-4 overflow-hidden animate-none min-w-0">
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

            {/* 3. Name block */}
            <div className="min-w-0 flex items-center gap-2">
              <h3 className={cn(
                'text-lg font-bold font-serif truncate flex items-center gap-2', 
                type === 'npc' 
                  ? (c.currentHp <= 0 ? 'text-[#8d8db9]' : 'text-red-800') 
                  : (isPcDead ? 'text-[#8d8db9]' : 'text-[#0f172a]')
              )}>
                {name}
                {type === 'npc' && c.currentHp <= 0 && (
                  <Skull className="w-4 h-4 text-[#8d8db9] shrink-0" />
                )}
                {type === 'pc' && c.isStable && (
                  <HeartCrack className="w-4 h-4 text-[#8d8db9] shrink-0" />
                )}
                {isPcDead && (
                  <Skull className="w-4 h-4 text-[#8d8db9] shrink-0" />
                )}
              </h3>
              <DeathSaveTrackerDisplay
                deathSavesFails={c.deathSavesFails || 0}
                deathSavesSuccesses={c.deathSavesSuccesses || 0}
                isUnconscious={c.conditions?.toLowerCase().includes('unconscious') || false}
                type={type}
                isStable={c.isStable}
                cId={c.id}
              />
            </div>
          </div>

          {/* Right side */}
          <div data-testid="right-container" className="flex flex-row items-center justify-end gap-3 shrink-0">
            {spellcastingStatsElement}

            {/* AC Badge */}
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

            {/* AnimatedHpDisplay (current HP) */}
            <div 
              className="flex items-center shrink-0"
              onClick={e => e.stopPropagation()}
            >
              <AnimatedHpDisplay
                value={c.currentHp}
                maxHp={maxHpCeiling}
                isActive={isActiveTurn}
                colorClass={c.currentHp <= maxHpCeiling / 2 ? (c.currentHp <= 0 ? 'text-red-700' : 'text-[#567eff]') : 'text-[#0f172a]'}
                className="p-0 font-sans text-2xl font-bold"
              />
            </div>

            {/* CombatantHealthControls */}
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

            {/* Chevron/expand button */}
            <CardHeaderChevron isExpanded={isExpanded} onToggleExpand={onToggleExpand} label="combatant card" stopPropagation />
          </div>
        </div>

        {/* ROW 2: STATUS */}
        <div className="flex flex-row flex-wrap items-center justify-between w-full border-t border-[#e2e8f0] pt-2 mt-2 text-xs gap-2">
          {/* Left side */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Reaction toggle pill */}
            {!isPcDead && (
              <div className="shrink-0 flex items-center" onClick={(e) => e.stopPropagation()}>
                <ToggleBadge
                  id={`reaction-toggle-${c.id}`}
                  active={!c.reactionUsed}
                  activeColor="emerald"
                  inactiveColor="gray"
                  onClick={() => onUpdateCombatant({ reactionUsed: !c.reactionUsed })}
                  disabled={isSyncing}
                  className={cn(
                    "text-sm whitespace-nowrap h-6 gap-1",
                    c.reactionUsed && "line-through opacity-70"
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
                </ToggleBadge>
              </div>
            )}

            {!isPcDead && (
              <CombatantCompactResourceRow
                c={c}
                isSyncing={isSyncing}
                onUpdateResourcePools={onUpdateResourcePools}
                character={pcCharacter}
              />
            )}

            {/* CombatantCompactIndicators */}
            {!isPcDead && (
              <CombatantCompactIndicators
                type={type}
                c={c}
                onUpdateCombatant={onUpdateCombatant}
                onMarkSpent={onMarkSpent}
              />
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {/* CombatantCardBadges */}
            {!isPcDead && (
              <CombatantCardBadges conditions={c.conditions || ''} combatant={c} />
            )}

            {/* Health-status label */}
            {(c.currentHp < maxHpCeiling && c.currentHp > 0) && (() => {
              const hs = getHealthStatus(c.currentHp, maxHpCeiling);
              return (
                <Badge
                  color={healthStatusMap[hs.label] || 'gray'}
                  size="default"
                  className="bg-white/50 shrink-0 border-current text-sm"
                >
                  {hs.label}
                </Badge>
              );
            })()}

            {/* Unconscious/Stable/Defeated label for PCs */}
            {type === 'pc' && c.currentHp <= 0 && (() => {
              let label = 'Unconscious';
              let color: 'blue' | 'red' | 'orange' = 'orange';
              let icon = <HeartCrack className="w-3 h-3" />;

              if (c.isStable) {
                label = 'Stable';
                color = 'blue';
                icon = <ShieldCheck className="w-3 h-3" />;
              } else if ((c.deathSavesFails || 0) >= 3) {
                label = 'Dead';
                color = 'red';
                icon = <Skull className="w-3 h-3" />;
              }

              return (
                <Badge
                  color={color}
                  size="default"
                  className="bg-white/50 shrink-0 border-current text-sm flex items-center gap-1"
                >
                  {icon}
                  {label}
                </Badge>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
