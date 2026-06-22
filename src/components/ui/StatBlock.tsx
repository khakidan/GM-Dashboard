import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  AbilityName,
  SkillName,
  SkillProficiency,
  AbilityScores,
  Proficiencies,
  ALL_SKILLS,
  SKILL_ABILITY_MAP,
  calculateModifier,
  proficiencyBonusFromLevel,
  getSavingThrowBonus,
  getSkillBonus,
  getPassiveScore,
} from '../../lib/abilityScores';

export interface StatBlockProps {
  abilityScores: AbilityScores;
  proficiencies: Proficiencies;
  characterLevel?: number;
  readOnly?: boolean;
  onChange?: (scores: AbilityScores, profs: Proficiencies) => void;
}

export const StatBlock: React.FC<StatBlockProps> = ({
  abilityScores,
  proficiencies,
  characterLevel,
  readOnly = false,
  onChange,
}) => {
  const [skillsExpanded, setSkillsExpanded] = useState(false);
  const [passiveBonusExpanded, setPassiveBonusExpanded] = useState(false);

  // Formatting helper for modifier and bonus values
  const formatBonus = (val: number): string => {
    if (val > 0) return `+${val}`;
    if (val < 0) return `\u2212${Math.abs(val)}`; // True minus sign \u2212
    return '0';
  };

  // Determine the effective proficiency bonus
  const effectiveProfBonus = characterLevel
    ? (proficiencies.proficiencyBonus > 0 ? proficiencies.proficiencyBonus : proficiencyBonusFromLevel(characterLevel))
    : proficiencies.proficiencyBonus;

  // Handle ability score edits
  const handleAbilityChange = (ability: AbilityName, valueStr: string) => {
    if (readOnly || !onChange) return;
    const score = parseInt(valueStr, 10);
    // Allow typing temporarily, but keep it as a valid integer fallback
    const clampedScore = isNaN(score) ? 10 : Math.max(1, Math.min(30, score));
    const updatedScores = {
      ...abilityScores,
      [ability]: clampedScore,
    };
    onChange(updatedScores, proficiencies);
  };

  // Handle saving throw toggle
  const handleSavingThrowToggle = (ability: AbilityName) => {
    if (readOnly || !onChange) return;
    const isProf = proficiencies.savingThrows.includes(ability);
    const updatedSaves = isProf
      ? proficiencies.savingThrows.filter((a) => a !== ability)
      : [...proficiencies.savingThrows, ability];
    onChange(abilityScores, {
      ...proficiencies,
      savingThrows: updatedSaves,
    });
  };

  // Handle skill cycle: none -> proficient -> expertise -> none
  const handleSkillCycle = (skill: SkillName) => {
    if (readOnly || !onChange) return;
    const currentProf = proficiencies.skills[skill] ?? 'none';
    let nextProf: SkillProficiency = 'none';

    if (currentProf === 'none') nextProf = 'proficient';
    else if (currentProf === 'proficient') nextProf = 'expertise';
    else nextProf = 'none';

    const updatedSkills = { ...proficiencies.skills };
    if (nextProf === 'none') {
      delete updatedSkills[skill];
    } else {
      updatedSkills[skill] = nextProf;
    }

    onChange(abilityScores, {
      ...proficiencies,
      skills: updatedSkills,
    });
  };

  // Handle Jack of All Trades toggle
  const handleJackOfAllTradesToggle = () => {
    if (readOnly || !onChange) return;
    onChange(abilityScores, {
      ...proficiencies,
      jackOfAllTrades: !proficiencies.jackOfAllTrades,
    });
  };

  // Handle passive score bonus edits
  const handlePassiveBonusChange = (
    key: 'perception' | 'insight' | 'investigation',
    valueStr: string
  ) => {
    if (readOnly || !onChange) return;
    const val = parseInt(valueStr, 10);
    const bonus = isNaN(val) ? 0 : Math.max(-10, Math.min(10, val));
    onChange(abilityScores, {
      ...proficiencies,
      passiveBonuses: {
        ...proficiencies.passiveBonuses,
        [key]: bonus,
      },
    });
  };

  // Effective proficiencies configuration with unified prof bonus
  const effectiveProfsObj = {
    ...proficiencies,
    proficiencyBonus: effectiveProfBonus,
  };

  const passivePerception = getPassiveScore(abilityScores, effectiveProfsObj, 'perception');
  const passiveInsight = getPassiveScore(abilityScores, effectiveProfsObj, 'insight');
  const passiveInvestigation = getPassiveScore(abilityScores, effectiveProfsObj, 'investigation');

  // Skill groupings by ability score
  const skillsByAbility: Record<AbilityName, SkillName[]> = {
    STR: ['Athletics'],
    DEX: ['Acrobatics', 'Sleight of Hand', 'Stealth'],
    CON: [],
    INT: ['Arcana', 'History', 'Investigation', 'Nature', 'Religion'],
    WIS: ['Animal Handling', 'Insight', 'Medicine', 'Perception', 'Survival'],
    CHA: ['Deception', 'Intimidation', 'Performance', 'Persuasion'],
  };

  const abilitiesInOrder: AbilityName[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

  // Check if character has any skill proficiencies
  const hasProficientSkills = Object.keys(proficiencies.skills).some(
    (s) => proficiencies.skills[s as SkillName] === 'proficient' || proficiencies.skills[s as SkillName] === 'expertise'
  );

  return (
    <div className="space-y-3 text-stone-800 font-sans" id="statblock-container">
      {/* SECTION A — Ability Scores Grid */}
      <div className="flex flex-wrap gap-2 justify-center" id="ability-scores-grid">
        {abilitiesInOrder.map((ability) => {
          const score = abilityScores[ability];
          const modifier = calculateModifier(score);

          return (
            <div
              key={ability}
              className="bg-stone-800 border border-stone-600 rounded-lg p-2 text-center min-w-[52px] flex-1 flex flex-col justify-between"
              id={`ability-box-${ability.toLowerCase()}`}
            >
              {/* Row 1 — Label */}
              <div className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                {ability}
              </div>

              {/* Row 2 — Score */}
              <div className="my-1.5 flex justify-center items-center h-8">
                {readOnly ? (
                  <span className="text-2xl font-bold text-stone-100">
                    {score}
                  </span>
                ) : (
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={score}
                    onChange={(e) => handleAbilityChange(ability, e.target.value)}
                    className="appearance-none bg-transparent text-center border-none focus:outline-none focus:ring-0 w-full text-2xl font-bold text-stone-100 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    id={`ability-score-${ability.toLowerCase()}`}
                  />
                )}
              </div>

              {/* Row 3 — Modifier */}
              <div
                className={`text-sm font-medium ${
                  modifier > 0
                    ? 'text-amber-400'
                    : modifier === 0
                    ? 'text-stone-400'
                    : 'text-red-400'
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
      <div className="flex items-center justify-between py-1.5 border-b border-stone-700" id="proficiency-bonus-row">
        <div>
          <span className="text-xs text-stone-600 font-medium block">Proficiency Bonus</span>
          {characterLevel && !readOnly && (
            <span className="text-[10px] text-stone-500 block mt-0.5">
              Override
            </span>
          )}
        </div>

        <div className="flex flex-col items-end">
          {characterLevel ? (
            <>
              <span className="text-sm font-semibold text-stone-800" id="proficiency-bonus-display">
                {formatBonus(effectiveProfBonus)}
              </span>
              {!readOnly && (
                <input
                  type="number"
                  min="0"
                  max="10"
                  placeholder="calc"
                  value={proficiencies.proficiencyBonus === 0 ? '' : proficiencies.proficiencyBonus}
                  onChange={(e) => {
                    if (!onChange) return;
                    const val = parseInt(e.target.value, 10);
                    onChange(abilityScores, {
                      ...proficiencies,
                      proficiencyBonus: isNaN(val) ? 0 : val,
                    });
                  }}
                  className="w-12 text-[10px] bg-stone-800 border border-stone-600 rounded text-stone-300 text-center py-0.5 mt-0.5 outline-none focus:border-amber-500"
                  id="proficiency-bonus-override"
                />
              )}
            </>
          ) : (
            <>
              {readOnly ? (
                <span className="text-sm font-semibold text-stone-800" id="proficiency-bonus-display">
                  {formatBonus(proficiencies.proficiencyBonus)}
                </span>
              ) : (
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={proficiencies.proficiencyBonus}
                  onChange={(e) => {
                    if (!onChange) return;
                    const val = parseInt(e.target.value, 10);
                    onChange(abilityScores, {
                      ...proficiencies,
                      proficiencyBonus: isNaN(val) ? 2 : val,
                    });
                  }}
                  className="w-12 text-sm bg-stone-800 border border-stone-600 rounded text-stone-200 text-center py-0.5 outline-none focus:border-amber-500"
                  id="proficiency-bonus-input"
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* SECTION C — Saving Throws */}
      <div id="saving-throws-section">
        <div className="text-xs font-semibold uppercase tracking-wide text-stone-600 mb-1.5">
          Saving Throws
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {/* Column 1: STR, DEX, CON. Column 2: INT, WIS, CHA.
              Interleaving order for grid wrapping:
              STR, INT, DEX, WIS, CON, CHA */}
          {[
            { ability: 'STR' as AbilityName, column: 1 },
            { ability: 'INT' as AbilityName, column: 2 },
            { ability: 'DEX' as AbilityName, column: 1 },
            { ability: 'WIS' as AbilityName, column: 2 },
            { ability: 'CON' as AbilityName, column: 1 },
            { ability: 'CHA' as AbilityName, column: 2 },
          ].map(({ ability }) => {
            const isProficient = proficiencies.savingThrows.includes(ability);
            const score = abilityScores[ability];
            const bonus = getSavingThrowBonus(score, isProficient, effectiveProfBonus);

            const rowContent = (
              <div className="flex items-center gap-1.5 w-full">
                {/* Indicator */}
                <span
                  className={isProficient ? 'text-amber-500' : 'text-stone-400'}
                  id={`saving-throw-indicator-${ability.toLowerCase()}`}
                >
                  {isProficient ? '●' : '○'}
                </span>
                {/* Label */}
                <span className="text-xs text-stone-700 font-medium w-8" id={`saving-throw-label-${ability.toLowerCase()}`}>
                  {ability}
                </span>
                {/* Spacer */}
                <div className="flex-grow" />
                {/* Bonus */}
                <span
                  className={`text-xs font-semibold ${isProficient ? 'text-amber-600' : 'text-stone-700'}`}
                  id={`saving-throw-bonus-${ability.toLowerCase()}`}
                >
                  {formatBonus(bonus)}
                </span>
              </div>
            );

            if (readOnly) {
              return (
                <div
                  key={ability}
                  className="flex items-center py-0.5"
                  id={`saving-throw-row-${ability.toLowerCase()}`}
                >
                  {rowContent}
                </div>
              );
            }

            return (
              <button
                type="button"
                key={ability}
                onClick={() => handleSavingThrowToggle(ability)}
                className="flex items-center text-left py-0.5 hover:bg-stone-700/30 rounded px-1 -mx-1 w-full transition-colors outline-none cursor-pointer"
                id={`saving-throw-btn-${ability.toLowerCase()}`}
              >
                {rowContent}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION D — Passive Scores */}
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
              className="text-[10px] text-amber-500/80 hover:underline cursor-pointer block text-left"
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
                    onChange={(e) => handlePassiveBonusChange('perception', e.target.value)}
                    className="w-full text-xs bg-stone-800 border border-stone-600 rounded text-stone-200 text-center py-0.5 outline-none focus:border-amber-500"
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
                    onChange={(e) => handlePassiveBonusChange('insight', e.target.value)}
                    className="w-full text-xs bg-stone-800 border border-stone-600 rounded text-stone-200 text-center py-0.5 outline-none focus:border-amber-500"
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
                    onChange={(e) => handlePassiveBonusChange('investigation', e.target.value)}
                    className="w-full text-xs bg-stone-800 border border-stone-600 rounded text-stone-200 text-center py-0.5 outline-none focus:border-amber-500"
                    id="passive-bonus-investigation-input"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION E — Skills */}
      <div id="skills-section">
        {/* Section header row */}
        <div className="flex items-center justify-between pb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">
            Skills
          </span>
          <button
            type="button"
            onClick={() => setSkillsExpanded(!skillsExpanded)}
            className="text-stone-500 hover:text-stone-700 p-0.5 transition-colors outline-none cursor-pointer"
            id="skills-expand-btn"
          >
            {skillsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* COLLAPSED View */}
        {!skillsExpanded && (
          <div className="space-y-1" id="skills-collapsed-list">
            {!hasProficientSkills ? (
              <div className="text-xs text-stone-500 italic" id="no-skills-msg">
                No skill proficiencies
              </div>
            ) : (
              ALL_SKILLS.filter(
                (skill) =>
                  proficiencies.skills[skill] === 'proficient' ||
                  proficiencies.skills[skill] === 'expertise'
              ).map((skill) => {
                const prof = proficiencies.skills[skill] ?? 'none';
                const score = abilityScores[SKILL_ABILITY_MAP[skill]];
                const bonus = getSkillBonus(
                  score,
                  prof,
                  effectiveProfBonus,
                  proficiencies.jackOfAllTrades
                );

                return (
                  <div key={skill} className="flex items-center gap-1.5 py-0.5" id={`skill-collapsed-${skill.toLowerCase().replace(/\s+/g, '-')}`}>
                     <span className="text-amber-500 font-bold">●</span>
                    <span className="text-xs text-stone-800 font-medium">
                      {skill}
                      {prof === 'expertise' && (
                        <span className="text-[10px] text-amber-700 ml-0.5">
                          (exp)
                        </span>
                      )}
                    </span>
                    <div className="flex-1" />
                    <span className="text-xs font-semibold text-amber-600">
                      {formatBonus(bonus)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* EXPANDED View */}
        {skillsExpanded && (
          <div className="space-y-3" id="skills-expanded-grouped">
            {abilitiesInOrder
              .filter((ability) => skillsByAbility[ability].length > 0)
              .map((ability) => (
                <div key={ability} className="space-y-0.5" id={`skill-group-${ability.toLowerCase()}`}>
                  <div className="text-[10px] uppercase text-stone-600 mt-1 mb-0.5 font-semibold">
                    {ability} Skills
                  </div>

                  {skillsByAbility[ability].map((skill) => {
                    const prof = proficiencies.skills[skill] ?? 'none';
                    const score = abilityScores[ability];
                    const bonus = getSkillBonus(
                      score,
                      prof,
                      effectiveProfBonus,
                      proficiencies.jackOfAllTrades
                    );

                    // Indicator display
                    const renderIndicator = () => {
                      if (readOnly) {
                        return (
                          <span
                            className={prof !== 'none' ? 'text-amber-500' : 'text-stone-400'}
                            id={`skill-expanded-indicator-${skill.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {prof !== 'none' ? '●' : '○'}
                          </span>
                        );
                      }

                      // 3-state cycle button
                      const cycleIndicator = prof === 'none' ? '○' : prof === 'proficient' ? '●' : '★';
                      const cycleClass =
                        prof === 'none'
                          ? 'text-stone-400 hover:text-stone-700'
                          : prof === 'proficient'
                          ? 'text-amber-500'
                          : 'text-amber-600';

                      return (
                        <button
                          type="button"
                          onClick={() => handleSkillCycle(skill)}
                          className={`${cycleClass} font-bold text-center px-0.5 select-none hover:bg-stone-100 rounded transition-colors w-5 h-5 flex items-center justify-center outline-none cursor-pointer`}
                          id={`skill-cycle-btn-${skill.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {cycleIndicator}
                        </button>
                      );
                    };

                    return (
                      <div
                        key={skill}
                        className="flex items-center gap-1.5 py-0.5 pl-0.5 -ml-0.5 rounded"
                        id={`skill-row-${skill.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {renderIndicator()}

                        <span
                          className={`text-xs ${
                            prof !== 'none' ? 'text-stone-800 font-semibold' : 'text-stone-600'
                          }`}
                          id={`skill-label-${skill.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {skill}
                          {prof === 'expertise' && (
                            <span className="text-[10px] text-amber-700 font-semibold ml-0.5">
                              (exp)
                            </span>
                          )}
                        </span>

                        <div className="flex-1" />

                        <span
                          className={`text-xs font-semibold ${
                            prof !== 'none' ? 'text-amber-600' : 'text-stone-600'
                          }`}
                          id={`skill-bonus-${skill.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {formatBonus(bonus)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}

            {/* Jack of All Trades Checkbox (edit mode only) */}
            {!readOnly && (
              <div className="flex items-center gap-1.5 pt-1.5 border-t border-stone-200" id="jack-of-trades-row">
                <input
                  type="checkbox"
                  id="jack-of-all-trades-chk"
                  checked={proficiencies.jackOfAllTrades}
                  onChange={handleJackOfAllTradesToggle}
                  className="rounded border-stone-400 text-amber-500 focus:ring-amber-500/50 bg-stone-800"
                />
                <label
                  htmlFor="jack-of-all-trades-chk"
                  className="text-xs text-stone-600 select-none cursor-pointer font-medium"
                >
                  Jack of All Trades (½ proficiency to non-proficient skills)
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
