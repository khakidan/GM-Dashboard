import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  AbilityName,
  SkillName,
  AbilityScores,
  Proficiencies,
  ALL_SKILLS,
  SKILL_ABILITY_MAP,
  getSkillBonus,
} from '../../lib/abilityScores';
import { formatBonus, abilitiesInOrder } from './StatBlockScores';
import { IconButton } from './IconButton';

export interface StatBlockSkillsProps {
  abilityScores: AbilityScores;
  skills: Proficiencies['skills'];
  jackOfAllTrades: boolean;
  effectiveProfBonus: number;
  readOnly: boolean;
  onSkillCycle: (skill: SkillName) => void;
  onJackOfAllTradesToggle: () => void;
}

// Skill groupings by ability score
const skillsByAbility: Record<AbilityName, SkillName[]> = {
  STR: ['Athletics'],
  DEX: ['Acrobatics', 'Sleight of Hand', 'Stealth'],
  CON: [],
  INT: ['Arcana', 'History', 'Investigation', 'Nature', 'Religion'],
  WIS: ['Animal Handling', 'Insight', 'Medicine', 'Perception', 'Survival'],
  CHA: ['Deception', 'Intimidation', 'Performance', 'Persuasion'],
};

export const StatBlockSkills: React.FC<StatBlockSkillsProps> = ({
  abilityScores,
  skills,
  jackOfAllTrades,
  effectiveProfBonus,
  readOnly,
  onSkillCycle,
  onJackOfAllTradesToggle,
}) => {
  const [skillsExpanded, setSkillsExpanded] = useState(false);

  const hasProficientSkills = Object.keys(skills).some(
    (s) => skills[s as SkillName] === 'proficient' || skills[s as SkillName] === 'expertise'
  );

  return (
    <div id="skills-section">
      {/* Section header row */}
      <div className="flex items-center justify-between pb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">
          Skills
        </span>
        <IconButton
          icon={skillsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          onClick={() => setSkillsExpanded(!skillsExpanded)}
          id="skills-expand-btn"
          aria-label={skillsExpanded ? "Collapse skills" : "Expand skills"}
        />
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
                skills[skill] === 'proficient' ||
                skills[skill] === 'expertise'
            ).map((skill) => {
              const prof = skills[skill] ?? 'none';
              const score = abilityScores[SKILL_ABILITY_MAP[skill]];
              const bonus = getSkillBonus(score, prof, effectiveProfBonus, jackOfAllTrades);

              return (
                <div key={skill} className="flex items-center gap-1.5 py-0.5" id={`skill-collapsed-${skill.toLowerCase().replace(/\s+/g, '-')}`}>
                   <span className="text-[#2563eb] font-bold">●</span>
                  <span className="text-xs text-stone-800 font-medium">
                    {skill}
                    {prof === 'expertise' && (
                      <span className="text-[10px] text-[#567eff] ml-0.5">
                        (exp)
                      </span>
                    )}
                  </span>
                  <div className="flex-1" />
                  <span className="text-xs font-semibold text-[#2563eb]">
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
                  const prof = skills[skill] ?? 'none';
                  const score = abilityScores[ability];
                  const bonus = getSkillBonus(score, prof, effectiveProfBonus, jackOfAllTrades);

                  // Indicator display
                  const renderIndicator = () => {
                    if (readOnly) {
                      return (
                        <span
                          className={prof !== 'none' ? 'text-[#2563eb]' : 'text-[#8d8db9]'}
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
                        ? 'text-[#8d8db9] hover:text-[#0f172a]'
                        : prof === 'proficient'
                        ? 'text-[#2563eb]'
                        : 'text-[#567eff]';

                    return (
                      <button
                        type="button"
                        onClick={() => onSkillCycle(skill)}
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
                          <span className="text-[10px] text-[#567eff] font-semibold ml-0.5">
                            (exp)
                          </span>
                        )}
                      </span>

                      <div className="flex-1" />

                      <span
                        className={`text-xs font-semibold ${
                          prof !== 'none' ? 'text-[#2563eb]' : 'text-stone-600'
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
                checked={jackOfAllTrades}
                onChange={onJackOfAllTradesToggle}
                className="rounded border-stone-400 text-[#2563eb] focus:ring-[#2563eb]/30 w-4 h-4"
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
  );
};
