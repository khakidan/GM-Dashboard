import React from 'react';
import { cn } from '../../lib/utils';

interface ReadOnlyIrvDisplayProps {
  label: string;
  items: string;
  theme: 'resistances' | 'immunities' | 'vulnerabilities';
}

const ReadOnlyIrvDisplay = ({ label, items, theme }: ReadOnlyIrvDisplayProps) => {
  const arr = items ? items.split(',').map(s => s.trim()).filter(Boolean) : [];
  
  let chipClass = 'bg-[#e2e8f0] text-[#8d8db9] border-[#e2e8f0]';
  if (theme === 'resistances') chipClass = 'bg-[#f9f8ff] text-[#567eff] border-amber-200';
  if (theme === 'immunities') chipClass = 'bg-red-50 text-red-700 border-red-200';
  if (theme === 'vulnerabilities') chipClass = 'bg-blue-50 text-blue-700 border-blue-200';

  return (
    <div>
      <span className="block text-xs font-bold uppercase tracking-widest text-[#8d8db9] mb-1.5">{label}</span>
      {arr.length === 0 ? (
        <span className="text-xl text-[#8d8db9] opacity-30">—</span>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {arr.map(chip => (
            <span
              key={chip}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-bold font-sans capitalize border',
                chipClass
              )}
            >
              {chip}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export interface CombatantIrvDisplayProps {
  resistances: string;
  immunities: string;
  vulnerabilities: string;
}

export function CombatantIrvDisplay({ resistances, immunities, vulnerabilities }: CombatantIrvDisplayProps) {
  return (
    <div className="w-[60%] space-y-4 bg-[#f9f8ff]/30 p-4 rounded-xl border border-[#e2e8f0]">
      <ReadOnlyIrvDisplay label="Resistances" items={resistances} theme="resistances" />
      <ReadOnlyIrvDisplay label="Immunities" items={immunities} theme="immunities" />
      <ReadOnlyIrvDisplay label="Vulnerabilities" items={vulnerabilities} theme="vulnerabilities" />
    </div>
  );
}
