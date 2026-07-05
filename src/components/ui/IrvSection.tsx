import React from 'react';
import { IrvMultiSelect } from './IrvMultiSelect';

export interface IrvSectionProps {
  resistances: string;
  immunities: string;
  vulnerabilities: string;
  onUpdate: (updates: { resistances?: string; immunities?: string; vulnerabilities?: string }) => void;
  labels: { resistances: string; immunities: string; vulnerabilities: string };
  placeholders: { resistances: string; immunities: string; vulnerabilities: string };
  gap?: string; // defaults to 'gap-4'
  compact?: boolean;
}

export const IrvSection: React.FC<IrvSectionProps> = ({
  resistances,
  immunities,
  vulnerabilities,
  onUpdate,
  labels,
  placeholders,
  gap = 'gap-4',
  compact,
}) => {
  return (
    <div id="irv-section-container" className={`grid grid-cols-1 sm:grid-cols-3 ${gap}`}>
      <IrvMultiSelect
        label={labels.resistances}
        value={resistances || ''}
        onChange={(v) => onUpdate({ resistances: v })}
        placeholder={placeholders.resistances}
        compact={compact}
      />
      <IrvMultiSelect
        label={labels.immunities}
        value={immunities || ''}
        onChange={(v) => onUpdate({ immunities: v })}
        placeholder={placeholders.immunities}
        compact={compact}
      />
      <IrvMultiSelect
        label={labels.vulnerabilities}
        value={vulnerabilities || ''}
        onChange={(v) => onUpdate({ vulnerabilities: v })}
        placeholder={placeholders.vulnerabilities}
        compact={compact}
      />
    </div>
  );
};
