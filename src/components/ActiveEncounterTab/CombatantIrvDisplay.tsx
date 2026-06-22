import React from 'react';
import { cn } from '../../lib/utils';

interface ReadOnlyIrvDisplayProps {
  label: string;
  items: string;
  theme: 'resistances' | 'immunities' | 'vulnerabilities';
}

const ReadOnlyIrvDisplay = ({ label, items, theme }: ReadOnlyIrvDisplayProps) => {
  const arr = items ? items.split(',').map(s => s.trim()).filter(Boolean) : [];
  
  let chipClass = 'bg-[#f5f5f0] text-[#5a5a40] border-[#e5e1d8]';
  if (theme === 'resistances') chipClass = 'bg-amber-50 text-amber-700 border-amber-200';
  if (theme === 'immunities') chipClass = 'bg-red-50 text-red-700 border-red-200';
  if (theme === 'vulnerabilities') chipClass = 'bg-blue-50 text-blue-700 border-blue-200';

  return (
    <div>
      <span className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5">{label}</span>
      {arr.length === 0 ? (
        <span className="text-xl text-[#5a5a40] opacity-30">—</span>
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
    <div className="w-[60%] space-y-4 bg-[#faf9f6]/30 p-4 rounded-xl border border-[#e5e1d8]">
      <ReadOnlyIrvDisplay label="Resistances" items={resistances} theme="resistances" />
      <ReadOnlyIrvDisplay label="Immunities" items={immunities} theme="immunities" />
      <ReadOnlyIrvDisplay label="Vulnerabilities" items={vulnerabilities} theme="vulnerabilities" />
    </div>
  );
}
