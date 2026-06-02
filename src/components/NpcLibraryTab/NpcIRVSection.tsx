import React from 'react';
import { IrvMultiSelect } from '../ui/IrvMultiSelect';

export interface NpcIRVSectionProps {
  resistances: string;
  immunities: string;
  vulnerabilities: string;
  onUpdate: (updates: { resistances?: string; immunities?: string; vulnerabilities?: string }) => void;
}

export const NpcIRVSection: React.FC<NpcIRVSectionProps> = ({
  resistances,
  immunities,
  vulnerabilities,
  onUpdate,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <IrvMultiSelect
        label="Resists"
        value={resistances || ''}
        onChange={(v) => onUpdate({ resistances: v })}
        placeholder="None"
      />
      <IrvMultiSelect
        label="Immune"
        value={immunities || ''}
        onChange={(v) => onUpdate({ immunities: v })}
        placeholder="None"
      />
      <IrvMultiSelect
        label="Vuln"
        value={vulnerabilities || ''}
        onChange={(v) => onUpdate({ vulnerabilities: v })}
        placeholder="None"
      />
    </div>
  );
};
