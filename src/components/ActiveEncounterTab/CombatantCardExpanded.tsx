import React from 'react';
import { Trash2, Lock, Ban, TrendingDown, Target, AlertTriangle, ShieldOff } from 'lucide-react';
import { buildConditionSummary, CONDITION_OPTIONS, EFFECT_OPTIONS } from '../../lib/conditions';
import { useAppState } from '../../hooks/useAppState';
import { updateCharacterDB } from '../../services/dbOperations';
import { getResourceForEffect, parseResourcePools, spendResourcePip, serializeResourcePools } from '../../lib/resourcePools';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Combatant } from '../../types';
import { ConditionChips } from '../ui/ConditionChips';
import { CombatantRechargeTracker, RechargeAbility } from './CombatantRechargeTracker';
import { CombatantLegendaryTracker } from './CombatantLegendaryTracker';
import { ResourcePoolsSection } from '../PartyTab/ResourcePoolsSection';
import { StatBlock } from '../ui/StatBlock';
import { parseAbilityScores, parseProficiencies } from '../../lib/abilityScores';

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

export interface CombatantCardExpandedProps {
  c: Combatant;
  isSyncing: boolean;
  currentRound: number;
  onUpdateCombatant: (updates: Partial<Combatant>) => void;
  onRemoveCombatant: () => void | Promise<void>;
  onConcentrationPrompt?: (effectName: string, targetName: string) => void;
  recentRechargeRolls?: Record<string, number>;
  onMarkSpent: (abilityName: string) => void;
  onRollRecharge: (abilityName: string, rechargeOn: number) => void;
  onSpendAction: () => void;
  onSpendResistance: () => void;
  onRestoreActions: () => void;
  onRestoreResistances: () => void;
}

export function CombatantCardExpanded({
  c,
  isSyncing,
  currentRound,
  onUpdateCombatant,
  onRemoveCombatant,
  onConcentrationPrompt,
  recentRechargeRolls = {},
  onMarkSpent,
  onRollRecharge,
  onSpendAction,
  onSpendResistance,
  onRestoreActions,
  onRestoreResistances,
}: CombatantCardExpandedProps) {
  const conditionList = (c.conditions || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const mechanicalSummary = buildConditionSummary(conditionList);
  const isSpeedZero = mechanicalSummary.speedLocked;
  const { updateState, getSnapshot } = useAppState();
  const { characters, npcs } = getSnapshot();
  const pcCharacter = c.type === 'pc' && c.characterId ? characters.find(char => char.id === c.characterId) : undefined;
  const npcModel = c.type === 'npc' ? npcs.find(n => c.id.startsWith(`combat-npc-${n.id}-`)) : undefined;

  return (
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
          <div className="bg-[#faf9f6]/80 p-3 rounded-xl border border-[#e5e1d8] text-center flex-1 flex flex-col justify-center">
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
          <div className="bg-[#faf9f6]/80 p-3 rounded-xl border border-[#e5e1d8] text-center flex-1 flex flex-col justify-center">
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
                <TrendingDown className="w-4 h-4 mt-0.5 text-green-700 shrink-0 rotate-180" />
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

      {/* NPCs sub-components */}
      {c.type === 'npc' && (
        <>
          <CombatantRechargeTracker
            rechargeAbilities={c.rechargeAbilities}
            onMarkSpent={onMarkSpent}
            onRollRecharge={onRollRecharge}
            combatantId={c.id}
            recentRechargeRolls={recentRechargeRolls}
            isSyncing={isSyncing}
          />
          <CombatantLegendaryTracker
            legendaryActions={c.legendaryActions}
            legendaryResistances={c.legendaryResistances}
            onSpendAction={onSpendAction}
            onSpendResistance={onSpendResistance}
            onRestoreActions={onRestoreActions}
            onRestoreResistances={onRestoreResistances}
            combatantId={c.id}
            isSyncing={isSyncing}
          />
        </>
      )}

      {/* PCs sub-components */}
      {c.type === 'pc' && (() => {
        const charId = c.characterId;
        if (!charId) return null;
        const char = getSnapshot().characters.find(charItem => charItem.id === charId);
        if (!char) return null;

        return (
          <ResourcePoolsSection
            character={char}
            isSyncing={isSyncing}
            onUpdate={async (updates) => {
              // 1. Optimistic local state update in Zustand
              updateState((prev) => ({
                ...prev,
                characters: prev.characters.map((charItem) =>
                  charItem.id === charId ? { ...charItem, ...updates } : charItem
                ),
              }));
              // 2. Call updateCharacterDB with the changed fields
              try {
                await updateCharacterDB(updates, char);
              } catch (err) {
                console.error("Failed to update character resource pools: ", err);
                toast.error(`Failed to sync resource update for ${char.characterName}`);
              }
            }}
          />
        );
      })()}

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
          onConditionAdded={async (label) => {
            if (c.type !== 'pc') return;
            const charId = c.characterId;
            if (!charId) return;

            const resourceName = getResourceForEffect(label);
            if (!resourceName) return;

            const latestState = getSnapshot();
            const char = latestState.characters.find(charItem => charItem.id === charId);
            if (!char) return;

            const pools = parseResourcePools(char.resourcePools || '');
            const matchedPool = pools.find(
              (p) => p.name.toLowerCase() === resourceName.toLowerCase()
            );

            if (!matchedPool) return;

            if (matchedPool.current > 0) {
              const updatedPools = spendResourcePip(pools, resourceName, 1);
              const serialized = serializeResourcePools(updatedPools);

              // 1. Optimistic local state update in Zustand
              updateState((prev) => ({
                ...prev,
                characters: prev.characters.map((charItem) =>
                  charItem.id === charId ? { ...charItem, resourcePools: serialized } : charItem
                ),
              }));

              // 2. Call updateCharacterDB with the changed fields
              try {
                await updateCharacterDB({ resourcePools: serialized }, char);
              } catch (err) {
                console.error("Failed to update character resource pools: ", err);
                toast.error(`Failed to sync resource update for ${char.characterName}`);
              }
            } else {
              toast.warning(`${matchedPool.name} is already depleted.`);
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

      {pcCharacter && (
        <StatBlock
          abilityScores={parseAbilityScores(pcCharacter.abilityScores)}
          proficiencies={parseProficiencies(pcCharacter.proficiencies)}
          characterLevel={pcCharacter.level}
          readOnly={true}
        />
      )}

      {npcModel && (
        <StatBlock
          abilityScores={parseAbilityScores(npcModel.abilityScores)}
          proficiencies={parseProficiencies(npcModel.proficiencies)}
          readOnly={true}
        />
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
  );
}
