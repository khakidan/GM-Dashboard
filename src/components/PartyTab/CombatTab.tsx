import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { IrvSection } from '../ui/IrvSection';
import { LabeledField } from '../ui/LabeledField';

interface CombatTabProps {
  ac: number;
  maxHp: number;
  hitDiceConfig: string;
  resistances: string;
  immunities: string;
  vulnerabilities: string;
  notes: string;
  isHitDiceValid: boolean;
  onChange: (key: string, value: any) => void;
}

export function CombatTab({
  ac,
  maxHp,
  hitDiceConfig,
  resistances,
  immunities,
  vulnerabilities,
  notes,
  isHitDiceValid,
  onChange,
}: CombatTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <LabeledField label="Armor Class" htmlFor="combat-ac" size="default">
          <input
            id="combat-ac"
            type="number"
            min="1"
            max="30"
            value={ac}
            onChange={e => onChange('ac', parseInt(e.target.value) || 10)}
            className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all shadow-sm"
          />
        </LabeledField>
        <LabeledField label="Max HP" htmlFor="combat-max-hp" size="default">
          <input
            id="combat-max-hp"
            type="number"
            min="1"
            value={maxHp}
            onChange={e => onChange('maxHp', parseInt(e.target.value) || 1)}
            className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all shadow-sm"
          />
        </LabeledField>
      </div>

      <LabeledField label="Hit Dice" htmlFor="combat-hit-dice" size="default">
        <input
          id="combat-hit-dice"
          type="text"
          value={hitDiceConfig}
          onChange={e => onChange('hitDiceConfig', e.target.value)}
          placeholder="e.g. 5d10 or 4d8+1d6"
          className={cn(
            "w-full bg-white border rounded-lg px-4 py-2 text-sm text-stone-800 outline-none transition-all placeholder:text-stone-400 shadow-sm",
            isHitDiceValid 
              ? "border-stone-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400" 
              : "border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500"
          )}
        />
        {!isHitDiceValid && (
          <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            <span>Invalid format. Must be like 2d6 or 1d8+2d6.</span>
          </div>
        )}
        <p className="text-xs text-stone-500 mt-1">
          Auto-suggested from class. Format: [count]d[size] (e.g. 5d10)
        </p>
      </LabeledField>

      <LabeledField label="RESISTANCES / IMMUNITIES / VULNERABILITIES" size="default">
        <IrvSection
          resistances={resistances}
          immunities={immunities}
          vulnerabilities={vulnerabilities}
          onUpdate={updates => {
            Object.entries(updates).forEach(([key, val]) => {
              onChange(key, val);
            });
          }}
          labels={{
            resistances: 'Resists',
            immunities: 'Immune',
            vulnerabilities: 'Vuln',
          }}
          placeholders={{
            resistances: 'Search and add...',
            immunities: 'Search and add...',
            vulnerabilities: 'Search and add...',
          }}
          gap="gap-3"
          compact
        />
      </LabeledField>

      <LabeledField label="Notes" htmlFor="combat-notes" size="default">
        <textarea
          id="combat-notes"
          value={notes}
          onChange={e => onChange('notes', e.target.value)}
          placeholder="Special abilities, backstory notes..."
          rows={3}
          className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-stone-400 resize-none shadow-sm"
        />
      </LabeledField>
    </div>
  );
}
