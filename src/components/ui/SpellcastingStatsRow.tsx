import React from 'react';
import { AbilityScores, calculateModifier } from '../../lib/abilityScores';
import {
  SpellcastingAbility,
  getEffectiveSpellcastingAbility,
  calculateSpellSaveDC,
  calculateSpellAttackBonus,
} from '../../lib/spellcasting';

import { formatBonus } from '../../lib/stringUtils';

export interface SpellcastingStatsRowProps {
  abilityScores: AbilityScores;
  profBonus: number;
  className?: string; // D&D class for auto-derive
  overrideAbility?: SpellcastingAbility;
  onOverrideChange?: (ability: SpellcastingAbility | undefined) => void;
}

export const SpellcastingStatsRow: React.FC<SpellcastingStatsRowProps> = ({
  abilityScores,
  profBonus,
  className,
  overrideAbility,
  onOverrideChange,
}) => {
  const effective = getEffectiveSpellcastingAbility(className, overrideAbility);

  const hasOverride = onOverrideChange !== undefined;

  // Case A: Non-caster in read-only context (effective is null, no override handler)
  if (effective === null && !hasOverride) {
    return null;
  }

  // Render the override dropdown
  const renderOverrideDropdown = () => {
    if (!hasOverride) return null;

    let selectedValue: string;
    if (overrideAbility === undefined) {
      selectedValue = 'auto';
    } else if (overrideAbility === null) {
      selectedValue = 'none';
    } else {
      selectedValue = overrideAbility;
    }

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (val === 'auto') {
        onOverrideChange(undefined);
      } else if (val === 'none') {
        onOverrideChange(null);
      } else {
        onOverrideChange(val as SpellcastingAbility);
      }
    };

    return (
      <div className="flex items-center gap-2" id="spellcasting-override-container">
        <label
          htmlFor="spellcasting-override-select"
          className="text-[10px] font-bold uppercase tracking-wider text-[#8d8db9] whitespace-nowrap"
        >
          Spellcasting:
        </label>
        <select
          id="spellcasting-override-select"
          value={selectedValue}
          onChange={handleChange}
          className="text-xs bg-white border border-[#e2e8f0] rounded-md text-[#0f172a] py-1 px-1.5 outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/50"
        >
          <option value="auto">Auto (from class)</option>
          <option value="INT">Intelligence (INT)</option>
          <option value="WIS">Wisdom (WIS)</option>
          <option value="CHA">Charisma (CHA)</option>
          <option value="none">None (not a caster)</option>
        </select>
      </div>
    );
  };

  // Case B: Explicitly null override in an edit context (no stats rendered, only dropdown)
  if (effective === null) {
    return (
      <div className="py-1 border-t border-[#e2e8f0] flex flex-col sm:flex-row sm:items-center justify-between gap-2" id="spellcasting-stats-row">
        {renderOverrideDropdown()}
      </div>
    );
  }

  // Case C: Spellcaster stats are visible
  const score = abilityScores[effective];
  const mod = calculateModifier(score);
  const dc = calculateSpellSaveDC(mod, profBonus);
  const atk = calculateSpellAttackBonus(mod, profBonus);

  return (
    <div
      className="py-1.5 border-t border-b border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3 text-xs"
      id="spellcasting-stats-row"
    >
      {/* Read-only stats block */}
      <div className="flex items-center gap-2 text-xs font-sans text-[#8d8db9]" id="spellcasting-stats-display">
        <span>
          Spell Save DC:{' '}
          <span className="font-mono font-bold text-[#0f172a]">{dc}</span>
        </span>
        <span className="text-[#e2e8f0] px-0.5">·</span>
        <span>
          Spell Atk:{' '}
          <span className="font-mono font-bold text-[#0f172a]">
            {formatBonus(atk)}
          </span>
        </span>
      </div>

      {/* Optional dropdown render on right / inline */}
      {renderOverrideDropdown()}
    </div>
  );
};
