import React from 'react';
import { Shield, Heart, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { IrvMultiSelect } from '../ui/IrvMultiSelect';

export interface RechargeAbility {
  id: string;
  name: string;
  rechargeOn: number;
}

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
  rechargeAbilities: RechargeAbility[];
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
  rechargeAbilities: [],
};

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

  const handleAddRecharge = () => {
    handleChange('rechargeAbilities', [
      ...data.rechargeAbilities,
      { id: Date.now().toString(), name: '', rechargeOn: 5 },
    ]);
  };

  const handleRemoveRecharge = (id: string) => {
    handleChange('rechargeAbilities', data.rechargeAbilities.filter(r => r.id !== id));
  };

  const handleRechargeChange = (id: string, field: keyof RechargeAbility, value: any) => {
    handleChange('rechargeAbilities', data.rechargeAbilities.map(r => r.id === id ? { ...r, [field]: value } : r));
  };
  
  const labelClass = cn(
    "block font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1",
    compact ? "text-[10px]" : "text-xs"
  );
  
  const inputClass = cn(
    "w-full bg-white border border-[#e5e1d8] rounded-xl outline-none transition-all font-serif italic text-sm",
    compact ? "px-2 py-1.5" : "px-4 py-3",
    "focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358]"
  );

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

      <div className="grid grid-cols-2 gap-4">
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
      </div>

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

      <div>
        <label className={labelClass}>Recharge Abilities</label>
        <div className="space-y-2">
          {data.rechargeAbilities.map(r => (
            <div key={r.id} className="space-y-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={r.name}
                  onChange={e => handleRechargeChange(r.id, 'name', e.target.value)}
                  className={cn(inputClass, "flex-1", errors[r.id] && "border-red-500")}
                  placeholder="Ability name"
                />
                <select 
                  value={r.rechargeOn}
                  onChange={e => handleRechargeChange(r.id, 'rechargeOn', parseInt(e.target.value))}
                  className="bg-white border border-[#e5e1d8] rounded-xl px-2 py-1 text-sm outline-none focus:border-[#c5b358]"
                >
                  <option value={2}>2-6</option>
                  <option value={3}>3-6</option>
                  <option value={4}>4-6</option>
                  <option value={5}>5-6</option>
                  <option value={6}>6</option>
                </select>
                <button type="button" aria-label="Remove ability" onClick={() => handleRemoveRecharge(r.id)} className="text-red-400 hover:text-red-600 p-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {errors[r.id] && (
                <p className="text-xs text-red-500 px-1">{errors[r.id]}</p>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAddRecharge} className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#c5b358] hover:text-[#b0a04f]">
            <Plus className="w-3 h-3" /> Add Recharge Ability
          </button>
        </div>
      </div>
    </div>
  );
}
