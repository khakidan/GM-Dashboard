import React from 'react';
import { toast } from 'sonner';
import { ConditionChips } from '../ui/ConditionChips';

export interface CharacterResourceSectionProps {
  conditions: string;
  concentrationLinks?: Record<string, string[]>;
  onConditionsChange: (conditions: string) => void;
  combatantId?: string;
  immunities?: string;
  onConditionAdded?: (label: string) => void;
  characterId: string;
  onUpdateCharacter: (id: string, updates: any) => void;
}

export const CharacterResourceSection: React.FC<CharacterResourceSectionProps> = ({
  conditions,
  concentrationLinks,
  onConditionsChange,
  combatantId,
  immunities = '',
  onConditionAdded,
  characterId,
  onUpdateCharacter,
}) => {
  return (
    <div>
      <div className="text-[10px] uppercase text-[#8d8db9] font-bold tracking-widest mb-2 px-1">Conditions</div>
      <ConditionChips
        value={conditions || ''}
        onChange={onConditionsChange}
        immunities={immunities}
        onConcentrationEffectAdded={(effectName) => {
          toast(`Concentration effect ${effectName} added. Be sure to mark the concentrating character manually if they are in the active encounter.`, {
            duration: 6000
          });
        }}
        onConditionAdded={onConditionAdded}
        onExhaustionDeath={() => {
          onUpdateCharacter(characterId, { statusId: 3 });
        }}
      />
      {combatantId && concentrationLinks && concentrationLinks[combatantId] && concentrationLinks[combatantId].length > 0 && (
        <div className="text-xs text-purple-700 font-sans font-semibold flex items-center gap-1.5 bg-purple-50/50 px-3 py-1.5 rounded-lg border border-purple-100 max-w-fit mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          <span>Concentrating on: {concentrationLinks[combatantId].join(', ')}</span>
        </div>
      )}
    </div>
  );
};
