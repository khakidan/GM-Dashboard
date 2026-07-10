import React from 'react';
import { DebouncedTextarea } from './DebouncedTextarea';

export interface NpcSimpleFieldEditorProps {
  name: string;
  onNameChange: (name: string) => void;
  namePlaceholder: string;
  description: string;
  onDescriptionChange: (description: string) => void;
}

export function NpcSimpleFieldEditor({
  name,
  onNameChange,
  namePlaceholder,
  description,
  onDescriptionChange,
}: NpcSimpleFieldEditorProps) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={name}
        onChange={e => onNameChange(e.target.value)}
        className="w-full bg-white border border-[#e2e8f0] rounded-xl outline-none transition-all font-serif italic text-sm py-1 px-2 focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
        placeholder={namePlaceholder}
      />
      <DebouncedTextarea
        value={description}
        onChange={onDescriptionChange}
        placeholder="Description"
        rows={2}
        className="py-1 px-2 text-sm"
      />
    </div>
  );
}
