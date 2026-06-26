import React, { useEffect } from 'react';
import { Shield, Heart, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { IrvMultiSelect } from '../ui/IrvMultiSelect';
import { StatBlock } from '../ui/StatBlock';
import { DebouncedInput } from './DebouncedInput';
import { NpcListEditor } from './NpcListEditor';
import { DebouncedTextarea } from './DebouncedTextarea';
import {
  parseAbilityScores,
  parseProficiencies,
  serializeAbilityScores,
  serializeProficiencies,
  DEFAULT_ABILITY_SCORES,
  DEFAULT_PROFICIENCIES,
  proficiencyBonusFromCR
} from '../../lib/abilityScores';
import type { NpcTrait, NpcAction, NpcReaction, NpcLegendaryAction } from '../../types';

export interface NpcFormData {
  name: string;
  ac: string | number;
  maxHp: string | number;
  notes: string;
  resistances: string;
  immunities: string;
  vulnerabilities: string;
  legendaryActions: number;
  legendaryResistances: number;
  abilityScores: string;
  proficiencies: string;
  speed: string;
  senses: string;
  languages: string;
  challengeRating: string;
  traits?: string;
  actions?: string;
  reactions?: string;
  legendaryActionsList?: string;
}

export const DEFAULT_NPC_FORM_DATA: NpcFormData = {
  name: '',
  ac: 10,
  maxHp: 10,
  notes: '',
  resistances: '',
  immunities: '',
  vulnerabilities: '',
  legendaryActions: 0,
  legendaryResistances: 0,
  abilityScores: serializeAbilityScores(DEFAULT_ABILITY_SCORES),
  proficiencies: serializeProficiencies(DEFAULT_PROFICIENCIES),
  speed: '',
  senses: '',
  languages: '',
  challengeRating: '',
  traits: '[]',
  actions: '[]',
  reactions: '[]',
  legendaryActionsList: '[]',
};

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

interface NpcFormFieldsProps {
  data: NpcFormData;
  onChange: (data: NpcFormData) => void;
  errors?: Partial<Record<keyof NpcFormData | string, string>>;
  compact?: boolean;
}

export function NpcFormFields({ data, onChange, errors = {}, compact = false }: NpcFormFieldsProps) {
  const handleChange = <K extends keyof NpcFormData>(key: K, value: NpcFormData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const handleTraitsChange = (updated: NpcTrait[]) => {
    onChange({
      ...data,
      traits: JSON.stringify(updated),
    });
  };

  const handleActionsChange = (updated: NpcAction[]) => {
    onChange({
      ...data,
      actions: JSON.stringify(updated),
    });
  };

  const handleReactionsChange = (updated: NpcReaction[]) => {
    onChange({
      ...data,
      reactions: JSON.stringify(updated),
    });
  };

  const handleLegendaryActionsListChange = (updated: NpcLegendaryAction[]) => {
    onChange({
      ...data,
      legendaryActionsList: JSON.stringify(updated),
    });
  };
  
  const parsedAbilityScores = 
    parseAbilityScores(
      data.abilityScores ?? 
      serializeAbilityScores(
        DEFAULT_ABILITY_SCORES));
  const parsedProficiencies = 
    parseProficiencies(
      data.proficiencies ?? 
      serializeProficiencies(
        DEFAULT_PROFICIENCIES));

  const traits = React.useMemo(() => {
    try {
      return JSON.parse(data.traits || '[]') as NpcTrait[];
    } catch {
      return [] as NpcTrait[];
    }
  }, [data.traits]);

  const actions = React.useMemo(() => {
    try {
      return JSON.parse(data.actions || '[]') as NpcAction[];
    } catch {
      return [] as NpcAction[];
    }
  }, [data.actions]);

  const reactions = React.useMemo(() => {
    try {
      return JSON.parse(data.reactions || '[]') as NpcReaction[];
    } catch {
      return [] as NpcReaction[];
    }
  }, [data.reactions]);

  const legendaryActionsList = React.useMemo(() => {
    try {
      return JSON.parse(data.legendaryActionsList || '[]') as NpcLegendaryAction[];
    } catch {
      return [] as NpcLegendaryAction[];
    }
  }, [data.legendaryActionsList]);

  const labelClass = cn(
    "block font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1",
    compact ? "text-[10px]" : "text-xs"
  );
  
  const inputClass = cn(
    "w-full bg-white border border-[#e5e1d8] rounded-xl outline-none transition-all font-serif italic text-sm",
    compact ? "px-2 py-1.5" : "px-4 py-3",
    "focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358]"
  );

  const renderTraitFields = (item: NpcTrait, index: number, onItemChange: (updated: NpcTrait) => void) => (
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

  const renderActionFields = (item: NpcAction, index: number, onItemChange: (updated: NpcAction) => void) => (
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
          <label className="block text-[10px] font-semibold text-[#5a5a40] uppercase px-1">Atk</label>
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
          <label className="block text-[10px] font-semibold text-[#5a5a40] uppercase px-1">Dmg</label>
          <input
            type="text"
            value={item.damage || ''}
            onChange={e => onItemChange({ ...item, damage: e.target.value || undefined })}
            className={cn(inputClass, "py-1 px-2")}
            placeholder="2d8+5 fire"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[#5a5a40] uppercase px-1">DC</label>
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
          <label className="block text-[10px] font-semibold text-[#5a5a40] uppercase px-1">Save</label>
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
        <label className="block text-[10px] font-semibold text-[#5a5a40] uppercase px-1">Range</label>
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

  const renderReactionFields = (item: NpcReaction, index: number, onItemChange: (updated: NpcReaction) => void) => (
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

  const renderLegendaryActionFields = (
    item: NpcLegendaryAction,
    index: number,
    onItemChange: (updated: NpcLegendaryAction) => void
  ) => (
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
          <label className="block text-[10px] font-semibold text-[#5a5a40] uppercase px-1">Cost</label>
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
          <label className="block text-[10px] font-semibold text-[#5a5a40] uppercase px-1">Atk</label>
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
          <label className="block text-[10px] font-semibold text-[#5a5a40] uppercase px-1">Dmg</label>
          <input
            type="text"
            value={item.damage || ''}
            onChange={e => onItemChange({ ...item, damage: e.target.value || undefined })}
            className={cn(inputClass, "py-1 px-2")}
            placeholder="2d8+5"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[#5a5a40] uppercase px-1">DC</label>
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
          <label className="block text-[10px] font-semibold text-[#5a5a40] uppercase px-1">Save</label>
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

  useEffect(() => {
    if (!data.challengeRating) return;
    try {
      const profBonus = proficiencyBonusFromCR(
        data.challengeRating
      );
      const parsed = parseProficiencies(
        data.proficiencies
      );
      if (parsed.proficiencyBonus === profBonus)
        return; // already correct, no update
      const updated = {
        ...parsed,
        proficiencyBonus: profBonus,
      };
      onChange({
        ...data,
        proficiencies: serializeProficiencies(
          updated
        ),
      });
    } catch {
      // silently ignore invalid CR strings
    }
  }, [data.challengeRating]);

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

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="new-npc-ac" className={labelClass}>
            AC <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Shield className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a40] opacity-50", compact ? "w-3 h-3" : "w-4 h-4")} />
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

      <StatBlock
        abilityScores={parsedAbilityScores}
        proficiencies={parsedProficiencies}
        readOnly={false}
        onChange={(scores, profs) => {
          onChange({
            ...data,
            abilityScores: serializeAbilityScores(scores),
            proficiencies: serializeProficiencies(profs),
          });
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <IrvMultiSelect
          label="Resistances"
          value={data.resistances}
          onChange={v => handleChange('resistances', v)}
          placeholder="e.g. fire"
          compact={compact}
        />
        <IrvMultiSelect
          label="Immunities"
          value={data.immunities}
          onChange={v => handleChange('immunities', v)}
          placeholder="e.g. poison"
          compact={compact}
        />
        <IrvMultiSelect
          label="Vulnerabilities"
          value={data.vulnerabilities}
          onChange={v => handleChange('vulnerabilities', v)}
          placeholder="e.g. cold"
          compact={compact}
        />
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

      <NpcListEditor<NpcTrait>
        title="Traits"
        items={traits}
        emptyItem={{ name: '', description: '' }}
        renderFields={renderTraitFields}
        onChange={handleTraitsChange}
      />

      <NpcListEditor<NpcAction>
        title="Actions"
        items={actions}
        emptyItem={{
          name: '',
          description: '',
          attackBonus: undefined,
          damage: undefined,
          saveDC: undefined,
          saveType: undefined,
          range: undefined,
          recharge: undefined,
        }}
        renderFields={renderActionFields}
        onChange={handleActionsChange}
      />

      <NpcListEditor<NpcReaction>
        title="Reactions"
        items={reactions}
        emptyItem={{ name: '', description: '' }}
        renderFields={renderReactionFields}
        onChange={handleReactionsChange}
      />

      <NpcListEditor<NpcLegendaryAction>
        title="Legendary Actions"
        items={legendaryActionsList}
        emptyItem={{
          name: '',
          description: '',
          cost: 1,
          attackBonus: undefined,
          damage: undefined,
          saveDC: undefined,
          saveType: undefined,
        }}
        renderFields={renderLegendaryActionFields}
        onChange={handleLegendaryActionsListChange}
      />
    </div>
  );
}
