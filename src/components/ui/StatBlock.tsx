import React from 'react';
import {
  AbilityName,
  SkillName,
  SkillProficiency,
  AbilityScores,
  Proficiencies,
  proficiencyBonusFromLevel,
} from '../../lib/abilityScores';
import { StatBlockScores } from './StatBlockScores';
import { StatBlockSaves } from './StatBlockSaves';
import { StatBlockPassive } from './StatBlockPassive';
import { StatBlockSkills } from './StatBlockSkills';

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
  // Determine the effective proficiency bonus
  const effectiveProfBonus = characterLevel
    ? (proficiencies.proficiencyBonus > 0 ? proficiencies.proficiencyBonus : proficiencyBonusFromLevel(characterLevel))
    : proficiencies.proficiencyBonus;

  const handleAbilityChange = (ability: AbilityName, valueStr: string) => {
    if (readOnly || !onChange) return;
    const score = parseInt(valueStr, 10);
    onChange({ ...abilityScores, [ability]: isNaN(score) ? 10 : Math.max(1, Math.min(30, score)) }, proficiencies);
  };

  const handleProfBonusOverrideChange = (value: number | undefined) => {
    if (readOnly || !onChange) return;
    onChange(abilityScores, { ...proficiencies, proficiencyBonus: value ?? 0 });
  };

  const handleSavingThrowToggle = (ability: AbilityName) => {
    if (readOnly || !onChange) return;
    const isProf = proficiencies.savingThrows.includes(ability);
    onChange(abilityScores, {
      ...proficiencies,
      savingThrows: isProf ? proficiencies.savingThrows.filter((a) => a !== ability) : [...proficiencies.savingThrows, ability],
    });
  };

  const handlePassiveBonusChange = (key: 'perception' | 'insight' | 'investigation', valueStr: string) => {
    if (readOnly || !onChange) return;
    const val = parseInt(valueStr, 10);
    onChange(abilityScores, {
      ...proficiencies,
      passiveBonuses: { ...proficiencies.passiveBonuses, [key]: isNaN(val) ? 0 : Math.max(-10, Math.min(10, val)) },
    });
  };

  const handleSkillCycle = (skill: SkillName) => {
    if (readOnly || !onChange) return;
    const currentProf = proficiencies.skills[skill] ?? 'none';
    const nextProf: SkillProficiency = currentProf === 'none' ? 'proficient' : currentProf === 'proficient' ? 'expertise' : 'none';
    const updatedSkills = { ...proficiencies.skills };
    if (nextProf === 'none') delete updatedSkills[skill];
    else updatedSkills[skill] = nextProf;
    onChange(abilityScores, { ...proficiencies, skills: updatedSkills });
  };

  const handleJackOfAllTradesToggle = () => {
    if (readOnly || !onChange) return;
    onChange(abilityScores, { ...proficiencies, jackOfAllTrades: !proficiencies.jackOfAllTrades });
  };

  return (
    <div className="space-y-3 text-stone-800 font-sans" id="statblock-container">
      <StatBlockScores
        abilityScores={abilityScores}
        effectiveProfBonus={effectiveProfBonus}
        characterLevel={characterLevel}
        proficiencyBonusOverride={proficiencies.proficiencyBonus}
        readOnly={readOnly}
        onAbilityChange={handleAbilityChange}
        onProfBonusOverrideChange={handleProfBonusOverrideChange}
      />
      <StatBlockSaves
        abilityScores={abilityScores}
        savingThrows={proficiencies.savingThrows}
        effectiveProfBonus={effectiveProfBonus}
        readOnly={readOnly}
        onToggle={handleSavingThrowToggle}
      />
      <StatBlockPassive
        abilityScores={abilityScores}
        proficiencies={proficiencies}
        effectiveProfBonus={effectiveProfBonus}
        readOnly={readOnly}
        onPassiveBonusChange={handlePassiveBonusChange}
      />
      <StatBlockSkills
        abilityScores={abilityScores}
        skills={proficiencies.skills}
        jackOfAllTrades={proficiencies.jackOfAllTrades}
        effectiveProfBonus={effectiveProfBonus}
        readOnly={readOnly}
        onSkillCycle={handleSkillCycle}
        onJackOfAllTradesToggle={handleJackOfAllTradesToggle}
      />
    </div>
  );
};

