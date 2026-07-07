import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { StatBlock } from '../ui/StatBlock';
import { Tabs } from './Tabs';
import { NpcListEditor } from './NpcListEditor';
import { NpcIdentityTab } from './NpcIdentityTab';
import { NpcCombatTab } from './NpcCombatTab';
import {
  TraitFieldsEditor,
  ActionFieldsEditor,
  ReactionFieldsEditor,
  LegendaryActionFieldsEditor
} from './NpcActionEditors';
import {
  parseAbilityScores,
  parseProficiencies,
  serializeAbilityScores,
  serializeProficiencies,
  DEFAULT_ABILITY_SCORES,
  DEFAULT_PROFICIENCIES,
} from '../../lib/abilityScores';
import { useNpcCrAutomation } from '../../hooks/useNpcCrAutomation';
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
    "block font-bold uppercase tracking-widest text-[#8d8db9] mb-1.5 px-1",
    compact ? "text-[10px]" : "text-xs"
  );
  
  const inputClass = cn(
    "w-full bg-white border border-[#e2e8f0] rounded-xl outline-none transition-all font-serif italic text-sm",
    compact ? "px-2 py-1.5" : "px-4 py-3",
    "focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
  );

  useNpcCrAutomation({
    challengeRating: data.challengeRating,
    proficiencies: data.proficiencies,
    onChange: (updatedProficiencies) => handleChange('proficiencies', updatedProficiencies),
  });

  const [activeTab, setActiveTab] =
    useState<'identity'|'combat'|'abilities'|'statblock'>('identity');

  return (
    <div className="space-y-0">
      <Tabs
        tabs={[
          { id: 'identity', label: 'Identity' },
          { id: 'combat', label: 'Combat' },
          { id: 'abilities', label: 'Abilities' },
          { id: 'statblock', label: 'Stat Block' },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as 'identity' | 'combat' | 'abilities' | 'statblock')}
        className="mb-4"
      />

      {activeTab === 'identity' && (
        <NpcIdentityTab
          data={data}
          handleChange={handleChange}
          labelClass={labelClass}
          inputClass={inputClass}
          compact={compact}
        />
      )}

      {activeTab === 'combat' && (
        <NpcCombatTab
          data={data}
          handleChange={handleChange}
          labelClass={labelClass}
          inputClass={inputClass}
          compact={compact}
        />
      )}

      {activeTab === 'abilities' && (
        <div className={cn("space-y-4", compact && "space-y-2")}>
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
        </div>
      )}

      {activeTab === 'statblock' && (
        <div className={cn("space-y-4", compact && "space-y-2")}>
          <NpcListEditor<NpcTrait>
            title="Traits"
            items={traits}
            emptyItem={{ name: '', description: '' }}
            renderFields={(item, index, onChange) => (
              <TraitFieldsEditor
                item={item}
                index={index}
                onItemChange={onChange}
                compact={compact}
              />
            )}
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
            renderFields={(item, index, onChange) => (
              <ActionFieldsEditor
                item={item}
                index={index}
                onItemChange={onChange}
                compact={compact}
              />
            )}
            onChange={handleActionsChange}
          />

          <NpcListEditor<NpcReaction>
            title="Reactions"
            items={reactions}
            emptyItem={{ name: '', description: '' }}
            renderFields={(item, index, onChange) => (
              <ReactionFieldsEditor
                item={item}
                index={index}
                onItemChange={onChange}
                compact={compact}
              />
            )}
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
            renderFields={(item, index, onChange) => (
              <LegendaryActionFieldsEditor
                item={item}
                index={index}
                onItemChange={onChange}
                compact={compact}
              />
            )}
            onChange={handleLegendaryActionsListChange}
          />
        </div>
      )}
    </div>
  );
}
