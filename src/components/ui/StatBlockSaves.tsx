import React from 'react';
import { AbilityName, AbilityScores, getSavingThrowBonus } from '../../lib/abilityScores';
import { formatBonus } from './StatBlockScores';

export interface StatBlockSavesProps {
  abilityScores: AbilityScores;
  savingThrows: AbilityName[];
  effectiveProfBonus: number;
  readOnly: boolean;
  onToggle: (ability: AbilityName) => void;
}

export const StatBlockSaves: React.FC<StatBlockSavesProps> = ({
  abilityScores,
  savingThrows,
  effectiveProfBonus,
  readOnly,
  onToggle,
}) => {
  return (
    <div id="saving-throws-section">
      <div className="text-xs font-semibold uppercase tracking-wide text-stone-600 mb-1.5">
        Saving Throws
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {/* Column 1: STR, DEX, CON. Column 2: INT, WIS, CHA.
            Interleaving order for grid wrapping:
            STR, INT, DEX, WIS, CON, CHA */}
        {[
          { ability: 'STR' as AbilityName },
          { ability: 'INT' as AbilityName },
          { ability: 'DEX' as AbilityName },
          { ability: 'WIS' as AbilityName },
          { ability: 'CON' as AbilityName },
          { ability: 'CHA' as AbilityName },
        ].map(({ ability }) => {
          const isProficient = savingThrows.includes(ability);
          const score = abilityScores[ability];
          const bonus = getSavingThrowBonus(score, isProficient, effectiveProfBonus);

          const rowContent = (
            <div className="flex items-center gap-1.5 w-full">
              {/* Indicator */}
              <span
                className={isProficient ? 'text-[#2563eb]' : 'text-[#8d8db9]'}
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
                className={`text-xs font-semibold ${isProficient ? 'text-[#2563eb]' : 'text-[#0f172a]'}`}
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
              onClick={() => onToggle(ability)}
              className="flex items-center text-left py-0.5 hover:bg-stone-700/30 rounded px-1 -mx-1 w-full transition-colors outline-none cursor-pointer"
              id={`saving-throw-btn-${ability.toLowerCase()}`}
            >
              {rowContent}
            </button>
          );
        })}
      </div>
    </div>
  );
};
