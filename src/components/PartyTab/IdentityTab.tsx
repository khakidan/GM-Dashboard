import React from 'react';
import { LabeledField } from '../ui/LabeledField';

interface IdentityTabProps {
  playerName: string;
  characterName: string;
  characterClass: string;
  level: number;
  statusId: number;
  statuses: Record<string, string>;
  onChange: (key: string, value: any) => void;
}

export function IdentityTab({
  playerName,
  characterName,
  characterClass,
  level,
  statusId,
  statuses,
  onChange,
}: IdentityTabProps) {
  return (
    <div className="space-y-4">
      <LabeledField label="Player Name" htmlFor="player-name" size="default">
        <input
          id="player-name"
          type="text"
          value={playerName}
          onChange={e => onChange('playerName', e.target.value)}
          placeholder="e.g. Sarah"
          required
          className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-stone-400 shadow-sm"
        />
      </LabeledField>
      <LabeledField label="Character Name" htmlFor="character-name" size="default">
        <input
          id="character-name"
          type="text"
          value={characterName}
          onChange={e => onChange('characterName', e.target.value)}
          placeholder="e.g. Drogar"
          required
          className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-stone-400 shadow-sm"
        />
      </LabeledField>
      <LabeledField label="Class" htmlFor="char-class" size="default">
        <input
          id="char-class"
          type="text"
          value={characterClass}
          onChange={e => onChange('class', e.target.value)}
          placeholder="e.g. Barbarian, Monk, Vitalist"
          className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-stone-400 shadow-sm"
        />
        <p className="text-xs text-stone-500 mt-1">
          Used to suggest starting resources on the Resources tab
        </p>
      </LabeledField>
      <div className="grid grid-cols-2 gap-4">
        <LabeledField label="Level" htmlFor="char-level" size="default">
          <input
            id="char-level"
            type="number"
            min="1"
            max="20"
            value={level}
            onChange={e => onChange('level', parseInt(e.target.value) || 1)}
            className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all shadow-sm"
          />
        </LabeledField>
        <LabeledField label="Status" htmlFor="char-status" size="default">
          <select
            id="char-status"
            value={statusId}
            onChange={e => onChange('statusId', parseInt(e.target.value))}
            className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all appearance-none cursor-pointer shadow-sm"
          >
            {Object.entries(statuses)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([id, label]) => (
                <option key={id} value={Number(id)}>
                  {label}
                </option>
              ))}
          </select>
        </LabeledField>
      </div>
    </div>
  );
}
