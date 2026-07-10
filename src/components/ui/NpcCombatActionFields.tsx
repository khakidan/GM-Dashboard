import React from 'react';
import { DebouncedTextarea } from './DebouncedTextarea';

export interface NpcCombatActionFieldsProps {
  name: string;
  onNameChange: (name: string) => void;
  namePlaceholder: string;
  secondaryField: React.ReactNode;
  attackBonus: number | undefined;
  onAttackBonusChange: (val: number | undefined) => void;
  damage: string | undefined;
  onDamageChange: (val: string | undefined) => void;
  damagePlaceholder?: string;
  saveDC: number | undefined;
  onSaveDCChange: (val: number | undefined) => void;
  saveType: string | undefined;
  onSaveTypeChange: (val: string | undefined) => void;
  range?: React.ReactNode;
  description: string;
  onDescriptionChange: (description: string) => void;
  descriptionRows: number;
}

export function NpcCombatActionFields({
  name,
  onNameChange,
  namePlaceholder,
  secondaryField,
  attackBonus,
  onAttackBonusChange,
  damage,
  onDamageChange,
  damagePlaceholder = '2d8+5 fire',
  saveDC,
  onSaveDCChange,
  saveType,
  onSaveTypeChange,
  range,
  description,
  onDescriptionChange,
  descriptionRows,
}: NpcCombatActionFieldsProps) {
  const inputClass = "w-full bg-white border border-[#e2e8f0] rounded-xl outline-none transition-all font-serif italic text-sm py-1 px-2 focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]";

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <input
            type="text"
            value={name}
            onChange={e => onNameChange(e.target.value)}
            className={inputClass}
            placeholder={namePlaceholder}
          />
        </div>
        <div>
          {secondaryField}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Atk</label>
          <input
            type="number"
            value={attackBonus !== undefined ? attackBonus : ''}
            onChange={e => {
              const val = e.target.value;
              onAttackBonusChange(val !== '' ? parseInt(val) : undefined);
            }}
            className={inputClass}
            placeholder="+N"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Dmg</label>
          <input
            type="text"
            value={damage || ''}
            onChange={e => onDamageChange(e.target.value || undefined)}
            className={inputClass}
            placeholder={damagePlaceholder}
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">DC</label>
          <input
            type="number"
            value={saveDC !== undefined ? saveDC : ''}
            onChange={e => {
              const val = e.target.value;
              onSaveDCChange(val !== '' ? parseInt(val) : undefined);
            }}
            className={inputClass}
            placeholder="DC"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Save</label>
          <input
            type="text"
            value={saveType || ''}
            onChange={e => onSaveTypeChange(e.target.value || undefined)}
            className={inputClass}
            placeholder="Con"
          />
        </div>
      </div>

      {range && (
        <div>
          {range}
        </div>
      )}

      <div>
        <DebouncedTextarea
          value={description}
          onChange={onDescriptionChange}
          placeholder="Description"
          rows={descriptionRows}
          className="py-1 px-2 text-sm"
        />
      </div>
    </div>
  );
}
