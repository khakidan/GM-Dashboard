import React from 'react';
import { Trash2, RotateCcw } from 'lucide-react';
import { buildConditionSummary } from '../../lib/conditions';
import { Combatant, Character, NPC } from '../../types';
import { ConditionChips } from '../ui/ConditionChips';
import { CombatantRechargeTracker } from './CombatantRechargeTracker';
import { CombatantLegendaryTracker } from './CombatantLegendaryTracker';
import { ResourcePoolsSection } from '../ui/ResourcePoolsSection';
import { StatBlock } from '../ui/StatBlock';
import { StatTile } from '../ui/StatTile';
import { parseAbilityScores, parseProficiencies } from '../../lib/abilityScores';
import { getEffectiveResistances } from '../../lib/combatLogic';
import { useCombatantExpanded } from './hooks/useCombatantExpanded';
import { CombatMechanicsSummary } from './CombatMechanicsSummary';
import { CombatantIrvDisplay } from './CombatantIrvDisplay';
import { Button } from '../ui/Button';

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
  pcCharacter?: Character;
  npcModel?: NPC;
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
  pcCharacter,
  npcModel,
}: CombatantCardExpandedProps) {
  const conditionList = (c.conditions || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const mechanicalSummary = buildConditionSummary(conditionList);

  const {
    handleResourcePoolUpdate,
    handleConditionAdded,
    handleConditionWithTimer,
    handleExhaustionDeath,
  } = useCombatantExpanded(c);

  return (
    <div className="px-6 pb-6 pt-2 bg-white space-y-5">
      {c.notes && (
        <p className="text-sm text-[#8d8db9] opacity-60 italic">{c.notes}</p>
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

      <div id={`combatant-stat-grid-${c.id}`} className="flex gap-4">
        <CombatantIrvDisplay
          resistances={getEffectiveResistances(c)}
          immunities={c.immunities || ''}
          vulnerabilities={c.vulnerabilities || ''}
        />

        {/* Right column: HP stats */}
        <div className="w-[40%] flex flex-col gap-3">
          <StatTile label="Temp HP">
            <input
              type="number"
              value={c.tempHp || ''}
              onChange={e => onUpdateCombatant({ tempHp: e.target.value ? parseInt(e.target.value) : 0 })}
              placeholder="0"
              disabled={isSyncing}
              className="w-full bg-transparent text-center font-bold text-blue-600 outline-none text-base disabled:opacity-50"
            />
          </StatTile>
          <StatTile label="Max HP">
            {c.tempHpMax && c.tempHpMax > 0 ? (
              <span 
                className="font-bold text-base text-[#2563eb] cursor-help" 
                title={`Temp max (original: ${c.maxHp})`}
              >
                {c.tempHpMax}
              </span>
            ) : (
              <span className="font-bold text-base text-[#0f172a]">{c.maxHp}</span>
            )}
          </StatTile>
          {c.type === 'npc' && (c.currentHp < c.maxHp || (c.tempHp || 0) > 0) && (
            <button
              onClick={() => onUpdateCombatant({ currentHp: c.maxHp, tempHp: 0 })}
              disabled={isSyncing}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#f9f8ff]/80 hover:bg-white text-[10px] font-bold uppercase tracking-widest text-[#8d8db9] hover:text-[#2563eb] rounded-full border border-[#e2e8f0] hover:border-[#2563eb] transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              Reset HP
            </button>
          )}
        </div>
      </div>

      <CombatMechanicsSummary mechanicalSummary={mechanicalSummary} />

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
      {c.type === 'pc' && pcCharacter && (
        <ResourcePoolsSection
          character={pcCharacter}
          isSyncing={isSyncing}
          onUpdate={handleResourcePoolUpdate}
        />
      )}

      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-[#8d8db9] mb-2">Conditions</label>
        <ConditionChips
          value={c.conditions || ''}
          onChange={val => onUpdateCombatant({ conditions: val })}
          immunities={c.immunities || ''}
          disabled={isSyncing}
          onAddWithTimer={(condName, rounds) => handleConditionWithTimer(condName, rounds, currentRound, onUpdateCombatant)}
          currentRound={currentRound}
          onConcentrationEffectAdded={(effectName) => {
            if (onConcentrationPrompt) {
              onConcentrationPrompt(effectName, c.name);
            }
          }}
          onConditionAdded={handleConditionAdded}
          onExhaustionDeath={handleExhaustionDeath}
        />
      </div>

      {/* Display active condition timers as pill badges */}
      {c.conditionTimers && Object.keys(c.conditionTimers).length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2" id={`condition-timers-list-${c.id}`}>
          {Object.entries(c.conditionTimers).map(([condName, expiresAt]) => (
            <span
              key={condName}
              className="inline-flex items-center gap-2 bg-[#f9f8ff]/80 border border-[#e2e8f0] hover:border-[#2563eb] text-[#8d8db9] text-xs font-bold px-3 py-1 rounded-full transition-colors"
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

      <div className="flex justify-between items-center pt-4 border-t border-[#e2e8f0]">
        <span className="text-xs text-[#8d8db9] opacity-40 font-mono tracking-tighter">{c.id.split('-').pop()}</span>
        <Button intent="destructive" size="small" onClick={onRemoveCombatant} disabled={isSyncing} className="flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Remove Combatant
        </Button>
      </div>
    </div>
  );
}
