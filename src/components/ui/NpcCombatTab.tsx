import React from 'react';
import { Shield, Heart } from 'lucide-react';
import { cn } from '../../lib/utils';
import { IrvSection } from './IrvSection';
import { DebouncedTextarea } from './DebouncedTextarea';
import type { NpcFormData } from './NpcFormFields';

interface NpcCombatTabProps {
  data: NpcFormData;
  handleChange: <K extends keyof NpcFormData>(key: K, value: NpcFormData[K]) => void;
  labelClass: string;
  inputClass: string;
  compact?: boolean;
}

export function NpcCombatTab({
  data,
  handleChange,
  labelClass,
  inputClass,
  compact = false,
}: NpcCombatTabProps) {
  return (
    <div className={cn("space-y-4", compact && "space-y-2")}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="new-npc-ac" className={labelClass}>
            AC <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Shield className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-[#8d8db9] opacity-50", compact ? "w-3 h-3" : "w-4 h-4")} />
            <input
              id="new-npc-ac"
              type="number"
              min="0"
              required
              value={data.ac}
              onFocus={(e) => e.target.select()}
              onChange={e => handleChange('ac', parseInt(e.target.value) || 0)}
              className={cn(inputClass, compact ? "pl-8" : "pl-10")}
            />
          </div>
        </div>
        <div>
          <label htmlFor="new-npc-maxhp" className={labelClass}>
            Max HP <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Heart className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-red-400", compact ? "w-3 h-3" : "w-4 h-4")} />
            <input
              id="new-npc-maxhp"
              type="number"
              min="1"
              required
              value={data.maxHp}
              onFocus={(e) => e.target.select()}
              onChange={e => handleChange('maxHp', parseInt(e.target.value) || 0)}
              className={cn(inputClass, compact ? "pl-8" : "pl-10 font-bold")}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="npc-legendary-actions-field" className={labelClass}>Legendary Actions</label>
          <input
            id="npc-legendary-actions-field"
            type="number"
            min="0"
            max="10"
            value={data.legendaryActions}
            onChange={e => handleChange('legendaryActions', parseInt(e.target.value) || 0)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="npc-legendary-resistances-field" className={labelClass}>Legendary Resistances</label>
          <input
            id="npc-legendary-resistances-field"
            type="number"
            min="0"
            max="10"
            value={data.legendaryResistances}
            onChange={e => handleChange('legendaryResistances', parseInt(e.target.value) || 0)}
            className={inputClass}
          />
        </div>
      </div>

      <IrvSection
        resistances={data.resistances}
        immunities={data.immunities}
        vulnerabilities={data.vulnerabilities}
        onUpdate={updates => {
          Object.entries(updates).forEach(([key, val]) => {
            handleChange(key as keyof NpcFormData, val);
          });
        }}
        labels={{
          resistances: 'Resistances',
          immunities: 'Immunities',
          vulnerabilities: 'Vulnerabilities',
        }}
        placeholders={{
          resistances: 'e.g. fire',
          immunities: 'e.g. poison',
          vulnerabilities: 'e.g. cold',
        }}
        gap="gap-4"
        compact={compact}
      />

      <div>
        <label htmlFor="new-npc-notes" className={labelClass}>Notes</label>
        <DebouncedTextarea
          id="new-npc-notes"
          value={data.notes}
          onChange={v => handleChange('notes', v)}
          className={inputClass}
          placeholder="e.g. Tactics, behavior, etc."
          rows={3}
        />
      </div>
    </div>
  );
}
