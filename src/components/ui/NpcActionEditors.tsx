import React from 'react';
import { cn } from '../../lib/utils';
import { DebouncedTextarea } from './DebouncedTextarea';
import type { NpcTrait, NpcAction, NpcReaction, NpcLegendaryAction } from '../../types';

interface BaseEditorProps {
  index: number;
  compact?: boolean;
}

export function TraitFieldsEditor({
  item,
  index,
  onItemChange,
  compact = false,
}: BaseEditorProps & {
  item: NpcTrait;
  onItemChange: (updated: NpcTrait) => void;
}) {
  const inputClass = cn(
    "w-full bg-white border border-[#e2e8f0] rounded-xl outline-none transition-all font-serif italic text-sm",
    compact ? "px-2 py-1.5" : "px-4 py-3",
    "focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
  );

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={item.name}
        onChange={e => onItemChange({ ...item, name: e.target.value })}
        className={cn(inputClass, "py-1 px-2")}
        placeholder="Trait name"
      />
      <DebouncedTextarea
        value={item.description}
        onChange={v => onItemChange({ ...item, description: v })}
        placeholder="Description"
        rows={2}
        className="py-1 px-2 text-sm"
      />
    </div>
  );
}

export function ActionFieldsEditor({
  item,
  index,
  onItemChange,
  compact = false,
}: BaseEditorProps & {
  item: NpcAction;
  onItemChange: (updated: NpcAction) => void;
}) {
  const inputClass = cn(
    "w-full bg-white border border-[#e2e8f0] rounded-xl outline-none transition-all font-serif italic text-sm",
    compact ? "px-2 py-1.5" : "px-4 py-3",
    "focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
  );

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <input
            type="text"
            value={item.name}
            onChange={e => onItemChange({ ...item, name: e.target.value })}
            className={cn(inputClass, "py-1 px-2")}
            placeholder="Action name (e.g. Bite)"
          />
        </div>
        <div>
          <input
            type="text"
            value={item.recharge || ''}
            onChange={e => onItemChange({ ...item, recharge: e.target.value || undefined })}
            className={cn(inputClass, "py-1 px-2")}
            placeholder="e.g. Recharge 5–6"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Atk</label>
          <input
            type="number"
            value={item.attackBonus !== undefined ? item.attackBonus : ''}
            onChange={e => {
              const val = e.target.value;
              onItemChange({ ...item, attackBonus: val !== '' ? parseInt(val) : undefined });
            }}
            className={cn(inputClass, "py-1 px-2")}
            placeholder="+N"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Dmg</label>
          <input
            type="text"
            value={item.damage || ''}
            onChange={e => onItemChange({ ...item, damage: e.target.value || undefined })}
            className={cn(inputClass, "py-1 px-2")}
            placeholder="2d8+5 fire"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">DC</label>
          <input
            type="number"
            value={item.saveDC !== undefined ? item.saveDC : ''}
            onChange={e => {
              const val = e.target.value;
              onItemChange({ ...item, saveDC: val !== '' ? parseInt(val) : undefined });
            }}
            className={cn(inputClass, "py-1 px-2")}
            placeholder="DC"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Save</label>
          <input
            type="text"
            value={item.saveType || ''}
            onChange={e => onItemChange({ ...item, saveType: e.target.value || undefined })}
            className={cn(inputClass, "py-1 px-2")}
            placeholder="Con"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Range</label>
        <input
          type="text"
          value={item.range || ''}
          onChange={e => onItemChange({ ...item, range: e.target.value || undefined })}
          className={cn(inputClass, "py-1 px-2")}
          placeholder="reach 10 ft. / 30 ft. cone"
        />
      </div>

      <div>
        <DebouncedTextarea
          value={item.description}
          onChange={v => onItemChange({ ...item, description: v })}
          placeholder="Full action description"
          rows={3}
          className="py-1 px-2 text-sm"
        />
      </div>
    </div>
  );
}

export function ReactionFieldsEditor({
  item,
  index,
  onItemChange,
  compact = false,
}: BaseEditorProps & {
  item: NpcReaction;
  onItemChange: (updated: NpcReaction) => void;
}) {
  const inputClass = cn(
    "w-full bg-white border border-[#e2e8f0] rounded-xl outline-none transition-all font-serif italic text-sm",
    compact ? "px-2 py-1.5" : "px-4 py-3",
    "focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
  );

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={item.name}
        onChange={e => onItemChange({ ...item, name: e.target.value })}
        className={cn(inputClass, "py-1 px-2")}
        placeholder="Reaction name"
      />
      <DebouncedTextarea
        value={item.description}
        onChange={v => onItemChange({ ...item, description: v })}
        placeholder="Description"
        rows={2}
        className="py-1 px-2 text-sm"
      />
    </div>
  );
}

export function LegendaryActionFieldsEditor({
  item,
  index,
  onItemChange,
  compact = false,
}: BaseEditorProps & {
  item: NpcLegendaryAction;
  onItemChange: (updated: NpcLegendaryAction) => void;
}) {
  const inputClass = cn(
    "w-full bg-white border border-[#e2e8f0] rounded-xl outline-none transition-all font-serif italic text-sm",
    compact ? "px-2 py-1.5" : "px-4 py-3",
    "focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
  );

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <input
            type="text"
            value={item.name}
            onChange={e => onItemChange({ ...item, name: e.target.value })}
            className={cn(inputClass, "py-1 px-2")}
            placeholder="Action name"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Cost</label>
          <input
            type="number"
            min="1"
            max="3"
            value={item.cost !== undefined ? item.cost : 1}
            onChange={e => onItemChange({ ...item, cost: parseInt(e.target.value) || 1 })}
            className={cn(inputClass, "py-1 px-2")}
            placeholder="Cost (1-3)"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Atk</label>
          <input
            type="number"
            value={item.attackBonus !== undefined ? item.attackBonus : ''}
            onChange={e => {
              const val = e.target.value;
              onItemChange({ ...item, attackBonus: val !== '' ? parseInt(val) : undefined });
            }}
            className={cn(inputClass, "py-1 px-2")}
            placeholder="+N"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Dmg</label>
          <input
            type="text"
            value={item.damage || ''}
            onChange={e => onItemChange({ ...item, damage: e.target.value || undefined })}
            className={cn(inputClass, "py-1 px-2")}
            placeholder="2d8+5"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">DC</label>
          <input
            type="number"
            value={item.saveDC !== undefined ? item.saveDC : ''}
            onChange={e => {
              const val = e.target.value;
              onItemChange({ ...item, saveDC: val !== '' ? parseInt(val) : undefined });
            }}
            className={cn(inputClass, "py-1 px-2")}
            placeholder="DC"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Save</label>
          <input
            type="text"
            value={item.saveType || ''}
            onChange={e => onItemChange({ ...item, saveType: e.target.value || undefined })}
            className={cn(inputClass, "py-1 px-2")}
            placeholder="Con"
          />
        </div>
      </div>

      <div>
        <DebouncedTextarea
          value={item.description}
          onChange={v => onItemChange({ ...item, description: v })}
          placeholder="Description"
          rows={2}
          className="py-1 px-2 text-sm"
        />
      </div>
    </div>
  );
}
