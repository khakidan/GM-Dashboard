import React from 'react';
import { AbilityName, AbilityScores, calculateModifier } from '../../lib/abilityScores';

// Formatting helper for modifier and bonus values
export const formatBonus = (val: number): string => {
  if (val > 0) return `+${val}`;
  if (val < 0) return `\u2212${Math.abs(val)}`; // True minus sign \u2212
  return '0';
};

export const abilitiesInOrder: AbilityName[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export interface StatBlockScoresProps {
  abilityScores: AbilityScores;
  effectiveProfBonus: number;
  characterLevel?: number;
  proficiencyBonusOverride?: number;
  readOnly: boolean;
  onAbilityChange: (ability: AbilityName, value: string) => void;
  onProfBonusOverrideChange: (value: number | undefined) => void;
}

export const StatBlockScores: React.FC<StatBlockScoresProps> = ({
  abilityScores,
  effectiveProfBonus,
  characterLevel,
  proficiencyBonusOverride = 0,
  readOnly,
  onAbilityChange,
  onProfBonusOverrideChange,
}) => {
  return (
    <>
      {/* SECTION A — Ability Scores Grid */}
      <div className="flex flex-wrap gap-2 justify-center" id="ability-scores-grid">
        {abilitiesInOrder.map((ability) => {
          const score = abilityScores[ability];
          const modifier = calculateModifier(score);

          return (
            <div
              key={ability}
              className="bg-[#f5f1e8] border border-[#e5e1d8] rounded-lg p-2 text-center min-w-[52px] flex-1 flex flex-col justify-between"
              id={`ability-box-${ability.toLowerCase()}`}
            >
              {/* Row 1 — Label */}
              <div className="text-[10px] font-medium uppercase tracking-wider text-[#5a5a40]">
                {ability}
              </div>

              {/* Row 2 — Score */}
              <div className="my-1.5 flex justify-center items-center h-8">
                {readOnly ? (
                  <span className="text-2xl font-bold text-[#2c2c26]">
                    {score}
                  </span>
                ) : (
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={score}
                    onChange={(e) => onAbilityChange(ability, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="bg-white border border-[#e5e1d8] rounded text-[#2c2c26] text-2xl font-bold text-center w-full focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358]/50 focus:outline-none appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    id={`ability-score-${ability.toLowerCase()}`}
                  />
                )}
              </div>

              {/* Row 3 — Modifier */}
              <div
                className={`text-sm font-medium ${
                  modifier > 0
                    ? 'text-[#8a7a20]'
                    : modifier === 0
                    ? 'text-[#5a5a40]'
                    : 'text-red-600'
                }`}
                id={`ability-modifier-${ability.toLowerCase()}`}
              >
                {formatBonus(modifier)}
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION B — Proficiency Bonus Row */}
      <div className="flex items-center justify-between py-1.5 border-b border-[#e5e1d8]" id="proficiency-bonus-row">
        <div>
          <span className="text-xs text-[#5a5a40] font-medium block">Proficiency Bonus</span>
          {characterLevel && !readOnly && (
            <span className="text-[10px] text-[#5a5a40] block mt-0.5">
              Override
            </span>
          )}
        </div>

        <div className="flex flex-col items-end">
          {characterLevel ? (
            <>
              <span className="text-sm font-medium text-[#2c2c26]" id="proficiency-bonus-display">
                {formatBonus(effectiveProfBonus)}
              </span>
              {!readOnly && (
                <input
                  type="number"
                  min="0"
                  max="10"
                  placeholder="calc"
                  value={proficiencyBonusOverride === 0 ? '' : proficiencyBonusOverride}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onProfBonusOverrideChange(isNaN(val) ? 0 : val);
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-12 text-[10px] bg-white border border-[#e5e1d8] rounded text-[#2c2c26] text-center py-0.5 mt-0.5 outline-none focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358]/50"
                  id="proficiency-bonus-override"
                />
              )}
            </>
          ) : (
            <>
              {readOnly ? (
                <span className="text-sm font-medium text-[#2c2c26]" id="proficiency-bonus-display">
                  {formatBonus(effectiveProfBonus)}
                </span>
              ) : (
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={proficiencyBonusOverride}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onProfBonusOverrideChange(isNaN(val) ? 2 : val);
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-12 text-sm bg-white border border-[#e5e1d8] rounded text-[#2c2c26] text-center py-0.5 outline-none focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358]/50"
                  id="proficiency-bonus-input"
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};
