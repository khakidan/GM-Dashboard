import React from 'react';
import { abilitiesInOrder, AbilityName, AbilityScores, calculateModifier } from '../../lib/abilityScores';
import { StatTile } from './StatTile';
import { formatBonus } from '../../lib/stringUtils';
export { formatBonus };
export { abilitiesInOrder } from '../../lib/abilityScores';

function AbilityScoreInput({
  value,
  onChange,
  id,
}: {
  value: number;
  onChange: (val: number) => void;
  id?: string;
}) {
  const [local, setLocal] = React.useState(String(value));

  React.useEffect(() => {
    setLocal(String(value));
  }, [value]);

  const commit = () => {
    const parsed = parseInt(local, 10);
    if (!isNaN(parsed)) {
      onChange(Math.max(1, Math.min(30, parsed)));
    } else {
      setLocal(String(value));
    }
  };

  return (
    <input
      type="number"
      min="1"
      max="30"
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        }
      }}
      onFocus={e => e.target.select()}
      className="bg-transparent border border-transparent rounded text-[#0f172a] text-2xl font-bold text-center w-full focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/30 focus:outline-none"
      id={id}
    />
  );
}

function ProficiencyOverrideInput({
  value,
  onUpdate,
  placeholder,
  id,
  className,
}: {
  value: number | undefined;
  onUpdate: (val: number | undefined) => void;
  placeholder: number;
  id?: string;
  className?: string;
}) {
  const [local, setLocal] = React.useState(value !== undefined ? String(value) : '');

  React.useEffect(() => {
    setLocal(value !== undefined ? String(value) : '');
  }, [value]);

  const commit = () => {
    const parsed = parseInt(local, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 20) {
      onUpdate(parsed);
    } else {
      setLocal(value !== undefined ? String(value) : '');
    }
  };

  return (
    <input
      type="number"
      min="0"
      max="20"
      placeholder={String(placeholder)}
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        }
      }}
      onFocus={e => e.target.select()}
      className={className || "w-12 text-[10px] bg-white border border-[#e2e8f0] rounded text-[#0f172a] text-center py-0.5 mt-0.5 outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/30"}
      id={id}
    />
  );
}

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
            <StatTile
              key={ability}
              label={ability}
              modifier={modifier}
              size="compact"
              id={`ability-box-${ability.toLowerCase()}`}
              className="min-w-[52px] flex-1"
            >
              <div className="my-1.5 flex justify-center items-center h-8 w-full">
                {readOnly ? (
                  <span className="text-2xl font-bold text-[#0f172a]">
                    {score}
                  </span>
                ) : (
                  <AbilityScoreInput
                    value={score}
                    onChange={(val) => onAbilityChange(ability, String(val))}
                    id={`ability-score-${ability.toLowerCase()}`}
                  />
                )}
              </div>
            </StatTile>
          );
        })}
      </div>

      {/* SECTION B — Proficiency Bonus Row */}
      <div className="flex items-center justify-between py-1.5 border-b border-[#e2e8f0]" id="proficiency-bonus-row">
        <div>
          <span className="text-xs text-[#8d8db9] font-medium block">Proficiency Bonus</span>
          {characterLevel && !readOnly && (
            <span className="text-[10px] text-[#8d8db9] block mt-0.5">
              Override
            </span>
          )}
        </div>

        <div className="flex flex-col items-end">
          {characterLevel ? (
            <>
              <span className="text-sm font-medium text-[#0f172a]" id="proficiency-bonus-display">
                {formatBonus(effectiveProfBonus)}
              </span>
              {!readOnly && (
                <ProficiencyOverrideInput
                  value={proficiencyBonusOverride === 0 ? undefined : proficiencyBonusOverride}
                  onUpdate={onProfBonusOverrideChange}
                  placeholder={0}
                  id="proficiency-bonus-override"
                />
              )}
            </>
          ) : (
            <>
              {readOnly ? (
                <span className="text-sm font-medium text-[#0f172a]" id="proficiency-bonus-display">
                  {formatBonus(effectiveProfBonus)}
                </span>
              ) : (
                <ProficiencyOverrideInput
                  value={proficiencyBonusOverride}
                  onUpdate={onProfBonusOverrideChange}
                  placeholder={2}
                  id="proficiency-bonus-input"
                  className="w-12 text-sm bg-white border border-[#e2e8f0] rounded text-[#0f172a] text-center py-0.5 outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/30"
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};
