import React from 'react';
import { NPC, NpcTrait, NpcAction, NpcReaction, NpcLegendaryAction } from '../../types';
import { Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CardShell } from '../ui/CardShell';
import { DebouncedInput } from '../ui/DebouncedInput';
import { CardNumberInput } from '../ui/CardNumberInput';
import { DebouncedTextarea } from '../ui/DebouncedTextarea';
import { NpcListEditor } from '../ui/NpcListEditor';
import { Button } from '../ui/Button';
import { StatTile } from '../ui/StatTile';
import { ExpandableContent } from '../ui/ExpandableContent';
import { LabeledField } from '../ui/LabeledField';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { NpcSimpleFieldEditor } from '../ui/NpcSimpleFieldEditor';
import { NpcCombatActionFields } from '../ui/NpcCombatActionFields';

// Modular Sub-components
import { NpcCardHeader } from './NpcCardHeader';
import { IrvSection } from '../ui/IrvSection';
import { NpcLegendarySection } from './NpcLegendarySection';
import { StatBlock } from '../ui/StatBlock';
import { SpellcastingStatsRow } from '../ui/SpellcastingStatsRow';
import { serializeSpellcastingAbility } from '../../lib/spellcasting';
import { parseAbilityScores, parseProficiencies, serializeAbilityScores, serializeProficiencies, proficiencyBonusFromCR } from '../../lib/abilityScores';

export interface NpcCardProps {
  npc: NPC;
  isSyncing: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<NPC>) => void;
  onDelete: () => void;
}

export const NpcCard: React.FC<NpcCardProps> = ({
  npc, isSyncing, isExpanded, onToggleExpand, onUpdate, onDelete
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const parsedProfs = parseProficiencies(npc.proficiencies || '');
  const parsedScores = parseAbilityScores(npc.abilityScores || '');

  const traits = React.useMemo(() => {
    try {
      return JSON.parse(npc.traits || '[]') as NpcTrait[];
    } catch {
      return [] as NpcTrait[];
    }
  }, [npc.traits]);

  const actions = React.useMemo(() => {
    try {
      return JSON.parse(npc.actions || '[]') as NpcAction[];
    } catch {
      return [] as NpcAction[];
    }
  }, [npc.actions]);

  const reactions = React.useMemo(() => {
    try {
      return JSON.parse(npc.reactions || '[]') as NpcReaction[];
    } catch {
      return [] as NpcReaction[];
    }
  }, [npc.reactions]);

  const legendaryActions = React.useMemo(() => {
    try {
      return JSON.parse(npc.legendaryActionsList || '[]') as NpcLegendaryAction[];
    } catch {
      return [] as NpcLegendaryAction[];
    }
  }, [npc.legendaryActionsList]);

  const renderTraitFields = (item: NpcTrait, index: number, onItemChange: (updated: NpcTrait) => void) => (
    <NpcSimpleFieldEditor
      name={item.name}
      onNameChange={name => onItemChange({ ...item, name })}
      namePlaceholder="Trait name"
      description={item.description}
      onDescriptionChange={description => onItemChange({ ...item, description })}
    />
  );

  const renderActionFields = (item: NpcAction, index: number, onItemChange: (updated: NpcAction) => void) => (
    <NpcCombatActionFields
      name={item.name}
      onNameChange={name => onItemChange({ ...item, name })}
      namePlaceholder="Action name (e.g. Bite)"
      secondaryField={
        <input
          type="text"
          value={item.recharge || ''}
          onChange={e => onItemChange({ ...item, recharge: e.target.value || undefined })}
          className="w-full bg-white border border-[#e2e8f0] rounded-xl outline-none transition-all font-serif italic text-sm py-1 px-2 focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
          placeholder="e.g. Recharge 5–6"
        />
      }
      attackBonus={item.attackBonus}
      onAttackBonusChange={val => onItemChange({ ...item, attackBonus: val })}
      damage={item.damage}
      onDamageChange={val => onItemChange({ ...item, damage: val })}
      damagePlaceholder="2d8+5 fire"
      saveDC={item.saveDC}
      onSaveDCChange={val => onItemChange({ ...item, saveDC: val })}
      saveType={item.saveType}
      onSaveTypeChange={val => onItemChange({ ...item, saveType: val })}
      range={
        <div>
          <label className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Range</label>
          <input
            type="text"
            value={item.range || ''}
            onChange={e => onItemChange({ ...item, range: e.target.value || undefined })}
            className="w-full bg-white border border-[#e2e8f0] rounded-xl outline-none transition-all font-serif italic text-sm py-1 px-2 focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
            placeholder="reach 10 ft. / 30 ft. cone"
          />
        </div>
      }
      description={item.description}
      onDescriptionChange={description => onItemChange({ ...item, description })}
      descriptionRows={3}
    />
  );

  const renderReactionFields = (item: NpcReaction, index: number, onItemChange: (updated: NpcReaction) => void) => (
    <NpcSimpleFieldEditor
      name={item.name}
      onNameChange={name => onItemChange({ ...item, name })}
      namePlaceholder="Reaction name"
      description={item.description}
      onDescriptionChange={description => onItemChange({ ...item, description })}
    />
  );

  const renderLegendaryActionFields = (
    item: NpcLegendaryAction,
    index: number,
    onItemChange: (updated: NpcLegendaryAction) => void
  ) => (
    <NpcCombatActionFields
      name={item.name}
      onNameChange={name => onItemChange({ ...item, name })}
      namePlaceholder="Action name"
      secondaryField={
        <div>
          <label className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Cost</label>
          <input
            type="number"
            min="1"
            max="3"
            value={item.cost !== undefined ? item.cost : 1}
            onChange={e => onItemChange({ ...item, cost: parseInt(e.target.value) || 1 })}
            className="w-full bg-white border border-[#e2e8f0] rounded-xl outline-none transition-all font-serif italic text-sm py-1 px-2 focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
            placeholder="Cost (1-3)"
          />
        </div>
      }
      attackBonus={item.attackBonus}
      onAttackBonusChange={val => onItemChange({ ...item, attackBonus: val })}
      damage={item.damage}
      onDamageChange={val => onItemChange({ ...item, damage: val })}
      damagePlaceholder="2d8+5"
      saveDC={item.saveDC}
      onSaveDCChange={val => onItemChange({ ...item, saveDC: val })}
      saveType={item.saveType}
      onSaveTypeChange={val => onItemChange({ ...item, saveType: val })}
      description={item.description}
      onDescriptionChange={description => onItemChange({ ...item, description })}
      descriptionRows={2}
    />
  );

  return (
    <CardShell
      syncing={isSyncing}
      className={cn(
        "flex flex-col relative group",
        isExpanded ? "border-[#2563eb]/40" : "hover:border-[#2563eb]/20"
      )}
    >

      <NpcCardHeader
        name={npc.name} ac={npc.ac} maxHp={npc.maxHp}
        isExpanded={isExpanded} onToggleExpand={onToggleExpand} isSyncing={isSyncing}
        onUpdateName={(val) => onUpdate({ name: val })}
      />

      {!isExpanded && (
        <div className="px-6 pb-3 -mt-1" id={`spellcasting-stats-container-${npc.id}`}>
          <SpellcastingStatsRow
            abilityScores={parsedScores}
            profBonus={proficiencyBonusFromCR(npc.challengeRating)}
            className={undefined}
            overrideAbility={parsedProfs.spellcastingAbility}
          />
        </div>
      )}

      <ExpandableContent isExpanded={isExpanded}>
        <div className="p-6 flex flex-col gap-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="AC">
              <CardNumberInput
                value={npc.ac}
                onChange={v => onUpdate({ ac: v })}
                fallback={0}
                min={0}
                className="text-lg font-bold text-[#0f172a] w-full text-center bg-transparent border-none focus:ring-0 p-0 disabled:opacity-50"
                disabled={isSyncing}
              />
            </StatTile>
            <StatTile label="Max HP">
              <CardNumberInput
                value={npc.maxHp}
                onChange={v => onUpdate({ maxHp: v })}
                fallback={1}
                min={1}
                className="text-lg font-bold text-[#0f172a] w-full text-center bg-transparent border-none focus:ring-0 p-0 disabled:opacity-50"
                disabled={isSyncing}
              />
            </StatTile>
            <StatTile label="CR" className="col-span-2 sm:col-span-1">
              <DebouncedInput
                type="text"
                value={npc.challengeRating || ''}
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                onChange={(v) => onUpdate({ challengeRating: v as string })}
                className="text-lg font-bold text-[#0f172a] w-full text-center bg-transparent border-none focus:ring-0 p-0 disabled:opacity-50"
                placeholder="—"
                disabled={isSyncing}
              />
            </StatTile>
          </div>

          <StatBlock
            abilityScores={parsedScores}
            proficiencies={parsedProfs}
            readOnly={false}
            onChange={(scores, profs) => {
              onUpdate({
                abilityScores: serializeAbilityScores(scores),
                proficiencies: serializeProficiencies(profs),
              });
            }}
          />

          <SpellcastingStatsRow
            abilityScores={parsedScores}
            profBonus={proficiencyBonusFromCR(npc.challengeRating)}
            className={undefined}
            overrideAbility={parsedProfs.spellcastingAbility}
            onOverrideChange={(ability) => {
              const updated = { ...parsedProfs };
              if (ability === undefined) {
                delete updated.spellcastingAbility;
              } else {
                updated.spellcastingAbility = ability;
              }
              onUpdate({
                proficiencies: serializeProficiencies(updated),
                spellcastingAbility: serializeSpellcastingAbility(ability),
              });
            }}
          />

          <LabeledField label="Speed">
            <DebouncedInput type="text" value={npc.speed || ''} onChange={(v) => onUpdate({ speed: v as string })} placeholder="e.g. 30 ft., fly 60 ft." className="w-full text-xs text-[#0f172a] bg-[#ffffff] p-3 rounded-lg border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#cccbcb] disabled:opacity-50" disabled={isSyncing} />
          </LabeledField>

          <LabeledField label="Senses">
            <DebouncedInput type="text" value={npc.senses || ''} onChange={(v) => onUpdate({ senses: v as string })} placeholder="e.g. darkvision 60 ft." className="w-full text-xs text-[#0f172a] bg-[#ffffff] p-3 rounded-lg border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#cccbcb] disabled:opacity-50" disabled={isSyncing} />
          </LabeledField>

          <LabeledField label="Languages">
            <DebouncedInput type="text" value={npc.languages || ''} onChange={(v) => onUpdate({ languages: v as string })} placeholder="e.g. Common" className="w-full text-xs text-[#0f172a] bg-[#ffffff] p-3 rounded-lg border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#cccbcb] disabled:opacity-50" disabled={isSyncing} />
          </LabeledField>

          <IrvSection
            resistances={npc.resistances || ''}
            immunities={npc.immunities || ''}
            vulnerabilities={npc.vulnerabilities || ''}
            onUpdate={onUpdate}
            labels={{
              resistances: 'Resists',
              immunities: 'Immune',
              vulnerabilities: 'Vuln',
            }}
            placeholders={{
              resistances: 'None',
              immunities: 'None',
              vulnerabilities: 'None',
            }}
            gap="gap-3"
          />

          <LabeledField label="Notes">
            <DebouncedTextarea value={npc.notes || ''} onChange={(v) => onUpdate({ notes: v as string })} placeholder="Special abilities or description..." rows={3} className="w-full text-xs text-[#0f172a] bg-[#ffffff] p-3 rounded-lg border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all resize-none placeholder:text-[#cccbcb] disabled:opacity-50 leading-relaxed font-sans" disabled={isSyncing} />
          </LabeledField>

          <div className="space-y-4 pt-4 border-t border-[#e2e8f0]/40">
            <NpcListEditor<NpcTrait>
              title="Traits"
              items={traits}
              emptyItem={{ name: '', description: '' }}
              renderFields={renderTraitFields}
              onChange={(updated) =>
                onUpdate({ traits: JSON.stringify(updated) })
              }
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-[#e2e8f0]/40">
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
              onChange={(updated) =>
                onUpdate({ actions: JSON.stringify(updated) })
              }
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-[#e2e8f0]/40">
            <NpcListEditor<NpcReaction>
              title="Reactions"
              items={reactions}
              emptyItem={{ name: '', description: '' }}
              renderFields={renderReactionFields}
              onChange={(updated) =>
                onUpdate({ reactions: JSON.stringify(updated) })
              }
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-[#e2e8f0]/40">
            <NpcLegendarySection legendaryActions={npc.legendaryActions} legendaryResistances={npc.legendaryResistances} isSyncing={isSyncing} onUpdate={onUpdate} />
            <NpcListEditor<NpcLegendaryAction>
              title="Legendary Actions"
              items={legendaryActions}
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
              onChange={(updated) =>
                onUpdate({
                  legendaryActionsList: JSON.stringify(updated)
                })
              }
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-[#e2e8f0]/40">
            <Button intent="destructive" size="large" onClick={() => setIsConfirmOpen(true)} disabled={isSyncing} className="flex items-center justify-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete NPC
            </Button>
          </div>
        </div>
      </ExpandableContent>

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        title="Delete NPC?"
        description={`This will permanently remove ${npc.name} from your NPC library. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={onDelete}
        onClose={() => setIsConfirmOpen(false)}
      />
    </CardShell>
  );
};
