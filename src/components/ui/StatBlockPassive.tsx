import React, { useState } from 'react';
import { AbilityScores, Proficiencies, getPassiveScore } from '../../lib/abilityScores';

export interface StatBlockPassiveProps {
  abilityScores: AbilityScores;
  proficiencies: Proficiencies;
  effectiveProfBonus: number;
  readOnly: boolean;
  onPassiveBonusChange: (key: 'perception' | 'insight' | 'investigation', value: string) => void;
}

export const StatBlockPassive: React.FC<StatBlockPassiveProps> = ({
  abilityScores,
  proficiencies,
  effectiveProfBonus,
  readOnly,
  onPassiveBonusChange,
}) => {
  const [passiveBonusExpanded, setPassiveBonusExpanded] = useState(false);

  // Effective proficiencies configuration with unified prof bonus
  const effectiveProfsObj = {
    ...proficiencies,
    proficiencyBonus: effectiveProfBonus,
  };

  const passivePerception = getPassiveScore(abilityScores, effectiveProfsObj, 'perception');
  const passiveInsight = getPassiveScore(abilityScores, effectiveProfsObj, 'insight');
  const passiveInvestigation = getPassiveScore(abilityScores, effectiveProfsObj, 'investigation');

  return (
    <div className="py-1 border-t border-b border-stone-700/50 space-y-1.5" id="passive-scores-section">
      <div className="text-sm text-stone-700 font-medium leading-relaxed" id="passive-scores-text">
        Passive Perception: <span className="font-semibold text-stone-900">{passivePerception}</span>
        <span className="text-stone-500 px-1.5">·</span>
        Passive Insight: <span className="font-semibold text-stone-900">{passiveInsight}</span>
        <span className="text-stone-500 px-1.5">·</span>
        Passive Investigation: <span className="font-semibold text-stone-900">{passiveInvestigation}</span>
      </div>

      {!readOnly && (
        <div>
          <button
            type="button"
            onClick={() => setPassiveBonusExpanded(!passiveBonusExpanded)}
            className="text-[10px] text-[#2563eb]/80 hover:underline cursor-pointer block text-left"
            id="toggle-passive-modifiers-btn"
          >
            {passiveBonusExpanded ? '− Hide passive bonuses' : '± Feat/item bonuses'}
          </button>

          {passiveBonusExpanded && (
            <div className="grid grid-cols-3 gap-2 mt-1.5 p-2 bg-stone-800/40 border border-stone-700/50 rounded" id="passive-bonuses-inputs">
              <div>
                <label className="text-[10px] text-white font-bold block mb-0.5">Perception</label>
                <input
                  type="number"
                  min="-10"
                  max="10"
                  value={proficiencies.passiveBonuses?.perception ?? 0}
                  onChange={(e) => onPassiveBonusChange('perception', e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full text-xs bg-stone-800 border border-stone-600 rounded text-stone-200 text-center py-0.5 outline-none focus:border-[#2563eb]"
                  id="passive-bonus-perception-input"
                />
              </div>
              <div>
                <label className="text-[10px] text-white font-bold block mb-0.5">Insight</label>
                <input
                  type="number"
                  min="-10"
                  max="10"
                  value={proficiencies.passiveBonuses?.insight ?? 0}
                  onChange={(e) => onPassiveBonusChange('insight', e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full text-xs bg-stone-800 border border-stone-600 rounded text-stone-200 text-center py-0.5 outline-none focus:border-[#2563eb]"
                  id="passive-bonus-insight-input"
                />
              </div>
              <div>
                <label className="text-[10px] text-white font-bold block mb-0.5">Investigation</label>
                <input
                  type="number"
                  min="-10"
                  max="10"
                  value={proficiencies.passiveBonuses?.investigation ?? 0}
                  onChange={(e) => onPassiveBonusChange('investigation', e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full text-xs bg-stone-800 border border-stone-600 rounded text-stone-200 text-center py-0.5 outline-none focus:border-[#2563eb]"
                  id="passive-bonus-investigation-input"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
