import React from 'react';
import { Trash2 } from 'lucide-react';
import { buildConditionSummary } from '../../lib/conditions';
import { useAppState } from '../../hooks/useAppState';
import { Combatant } from '../../types';
import { ConditionChips } from '../ui/ConditionChips';
import { CombatantRechargeTracker } from './CombatantRechargeTracker';
import { CombatantLegendaryTracker } from './CombatantLegendaryTracker';
import { ResourcePoolsSection } from '../PartyTab/ResourcePoolsSection';
import { StatBlock } from '../ui/StatBlock';
import { parseAbilityScores, parseProficiencies } from '../../lib/abilityScores';
import { useCombatantExpanded } from './hooks/useCombatantExpanded';
import { CombatMechanicsSummary } from './CombatMechanicsSummary';
import { CombatantIrvDisplay } from './CombatantIrvDisplay';

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
  const { getSnapshot } = useAppState();
  const { characters, npcs } = getSnapshot();
  const pcCharacter = c.type === 'pc' && c.characterId ? characters.find(char => char.id === c.characterId) : undefined;
  const npcModel = c.type === 'npc' ? npcs.find(n => c.id.startsWith(`combat-npc-${n.id}-`)) : undefined;

  const {
    handleResourcePoolUpdate,
    handleConditionAdded,
    handleConditionWithTimer
  } = useCombatantExpanded(c);

  return (
    <div className="px-6 pb-6 pt-2 border-t border-[#e5e1d8] bg-white space-y-5">
      {c.notes && (
        <p className="text-sm text-[#5a5a40] opacity-60 italic">{c.notes}</p>
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
          resistances={c.resistances || ''}
          immunities={c.immunities || ''}
          vulnerabilities={c.vulnerabilities || ''}
        />

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
        <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-2">Conditions</label>
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
  );
}
