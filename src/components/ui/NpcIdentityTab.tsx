import React from 'react';
import { cn } from '../../lib/utils';
import { DebouncedInput } from './DebouncedInput';
import type { NpcFormData } from './NpcFormFields';

function CrInput({
  value,
  onChange,
  className,
  placeholder,
  id,
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  id?: string;
}) {
  const [local, setLocal] = React.useState(value);

  React.useEffect(() => {
    setLocal(value);
  }, [value]);

  const commit = () => {
    if (local !== value) onChange(local);
  };

  return (
    <input
      type="text"
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        }
      }}
      className={className}
      placeholder={placeholder}
      id={id}
    />
  );
}

interface NpcIdentityTabProps {
  data: NpcFormData;
  handleChange: <K extends keyof NpcFormData>(key: K, value: NpcFormData[K]) => void;
  labelClass: string;
  inputClass: string;
  compact?: boolean;
}

export function NpcIdentityTab({
  data,
  handleChange,
  labelClass,
  inputClass,
  compact = false,
}: NpcIdentityTabProps) {
  return (
    <div className={cn("space-y-4", compact && "space-y-2")}>
      <div>
        <label htmlFor="new-npc-name" className={labelClass}>
          NPC Name <span className="text-red-500">*</span>
        </label>
        <input
          id="new-npc-name"
          type="text"
          required
          value={data.name}
          onChange={e => handleChange('name', e.target.value)}
          placeholder="e.g. Ancient Red Dragon"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="new-npc-cr" className={labelClass}>
          CR
        </label>
        <CrInput
          id="new-npc-cr"
          value={data.challengeRating}
          onChange={val => handleChange('challengeRating', val)}
          className={inputClass}
          placeholder="e.g. 1/4"
        />
      </div>
      <div>
        <label htmlFor="new-npc-speed" className={labelClass}>Speed</label>
        <DebouncedInput
          id="new-npc-speed"
          value={data.speed}
          onChange={v => handleChange('speed', v)}
          className={inputClass}
          placeholder="e.g. 30 ft., fly 60 ft."
        />
      </div>
      <div>
        <label htmlFor="new-npc-senses" className={labelClass}>Senses</label>
        <DebouncedInput
          id="new-npc-senses"
          value={data.senses}
          onChange={v => handleChange('senses', v)}
          className={inputClass}
          placeholder="e.g. darkvision 120 ft., passive Perception 12"
        />
      </div>
      <div>
        <label htmlFor="new-npc-languages" className={labelClass}>Languages</label>
        <DebouncedInput
          id="new-npc-languages"
          value={data.languages}
          onChange={v => handleChange('languages', v)}
          className={inputClass}
          placeholder="e.g. Common, Draconic"
        />
      </div>
    </div>
  );
}
