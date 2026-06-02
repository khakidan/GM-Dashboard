import React from 'react';
import { IrvMultiSelect } from '../ui/IrvMultiSelect';

export interface CharacterIRVSectionProps {
  resistances: string;
  immunities: string;
  vulnerabilities: string;
  onUpdate: (updates: { resistances?: string; immunities?: string; vulnerabilities?: string }) => void;
}

export const CharacterIRVSection: React.FC<CharacterIRVSectionProps> = ({
  resistances,
  immunities,
  vulnerabilities,
  onUpdate,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <IrvMultiSelect
        label="Resistances"
        value={resistances || ''}
        onChange={(v) => onUpdate({ resistances: v })}
        placeholder="e.g. fire"
      />
      <IrvMultiSelect
        label="Immunities"
        value={immunities || ''}
        onChange={(v) => onUpdate({ immunities: v })}
        placeholder="e.g. poison"
      />
      <IrvMultiSelect
        label="Vulnerabilities"
        value={vulnerabilities || ''}
        onChange={(v) => onUpdate({ vulnerabilities: v })}
        placeholder="e.g. cold"
      />
    </div>
  );
};
