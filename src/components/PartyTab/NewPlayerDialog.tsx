import React, { useEffect, useState, useRef } from 'react';
import { UserPlus } from 'lucide-react';
import { Character } from '../../types';
import { cn } from '../../lib/utils';
import { useFormState } from '../../hooks/useFormState';
import { useAppState } from '../../hooks/useAppState';
import { StatBlock } from '../ui/StatBlock';
import { IdentityTab } from './IdentityTab';
import { CombatTab } from './CombatTab';
import {
  DEFAULT_ABILITY_SCORES, 
  DEFAULT_PROFICIENCIES, 
  serializeAbilityScores, 
  serializeProficiencies,
  getPassiveScore,
  proficiencyBonusFromLevel,
} from '../../lib/abilityScores';
import { DEFAULT_STATUSES } from '../../lib/constants';
import {
  ResourcePool,
  serializeResourcePools,
} from '../../lib/resourcePools';
import { parseHitDiceConfig } from '../../lib/hitDice';
import { ResourcePoolManager } from '../ui/ResourcePoolManager';
import { usePlayerFormAutomation } from '../../hooks/usePlayerFormAutomation';
import { DialogShell } from '../ui/DialogShell';
import { Button } from '../ui/Button';
import { Tabs } from '../ui/Tabs';

interface NewPlayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (character: Omit<Character, 'id' | 'sheetRowIndex'>) => void;
}

type TabId = 'identity' | 'combat' | 'abilities' | 'resources';

const TABS: { id: TabId; label: string; optional?: boolean }[] = [
  { id: 'identity', label: 'Identity' },
  { id: 'combat', label: 'Combat Stats', optional: true },
  { id: 'abilities', label: 'Abilities', optional: true },
  { id: 'resources', label: 'Resources', optional: true },
];

export function NewPlayerDialog({ isOpen, onClose, onConfirm }: NewPlayerDialogProps) {
  const { state } = useAppState();
  const statuses = Object.keys(state.statuses).length > 0 ? state.statuses : DEFAULT_STATUSES;

  const [activeTab, setActiveTab] = useState<TabId>('identity');

  const { values: formData, handleChange, reset } = useFormState({
    playerName: '',
    characterName: '',
    class: '',
    level: 1,
    statusId: 1, // Active
    ac: 10,
    maxHp: 10,
    hitDiceConfig: '',
    notes: '',
    resistances: '',
    immunities: '',
    vulnerabilities: '',
    abilityScores: DEFAULT_ABILITY_SCORES,
    proficiencies: DEFAULT_PROFICIENCIES,
    resourcePools: [] as ResourcePool[],
  });

  const poolsCustomized = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      reset();
      setActiveTab('identity');
      poolsCustomized.current = false;
    }
  }, [isOpen, reset]);

  // Handle character form automations via custom hook
  usePlayerFormAutomation({
    activeTab,
    formData,
    handleChange,
    poolsCustomized,
  });

  const isTab1Valid = formData.playerName.trim() !== '' && formData.characterName.trim() !== '';
  const isHitDiceValid = formData.hitDiceConfig.trim() === '' || parseHitDiceConfig(formData.hitDiceConfig).length > 0;
  const isFormValid = isTab1Valid && isHitDiceValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    onConfirm({
      playerName: formData.playerName,
      characterName: formData.characterName,
      level: formData.level,
      class: formData.class,
      statusId: formData.statusId,
      statusName: statuses[String(formData.statusId)] ?? 'Unknown',
      ac: formData.ac,
      maxHp: formData.maxHp,
      currentHp: formData.maxHp, // starts at max
      tempHp: 0,
      tempHpMax: 0,
      conditions: '',
      isActive: formData.statusId === 1,
      passivePerception: getPassiveScore(formData.abilityScores, formData.proficiencies, 'perception'),
      notes: formData.notes,
      resistances: formData.resistances,
      immunities: formData.immunities,
      vulnerabilities: formData.vulnerabilities,
      tempAc: 0,
      deathSavesFails: 0,
      deathSavesSuccesses: 0,
      hitDiceConfig: formData.hitDiceConfig,
      hitDiceUsed: '{}',
      abilityScores: serializeAbilityScores(formData.abilityScores),
      proficiencies: (() => {
        const level = typeof formData.level === 'number'
          ? formData.level
          : (parseInt(String(formData.level), 10) || 1);
        const parsed = {
          ...formData.proficiencies,
          proficiencyBonus: proficiencyBonusFromLevel(level),
        };
        return serializeProficiencies(parsed);
      })(),
      resourcePools: serializeResourcePools(formData.resourcePools),
    });
  };


  const handleNext = () => {
    const currentIndex = TABS.findIndex(t => t.id === activeTab);
    if (currentIndex < TABS.length - 1) setActiveTab(TABS[currentIndex + 1].id);
  };

  const handlePrev = () => {
    const currentIndex = TABS.findIndex(t => t.id === activeTab);
    if (currentIndex > 0) setActiveTab(TABS[currentIndex - 1].id);
  };

  return (
    <DialogShell
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      title="Add Character"
      icon={<UserPlus className="w-5 h-5 text-[#2563eb]" />}
      dismissOnBackdropClick={false}
      subheader={
        <Tabs
          tabs={TABS.map(t => ({
            id: t.id,
            label: (
              <>
                {t.label}
                {!t.optional && (
                  <span className="text-[10px] text-[#2563eb] ml-1.5">(required)</span>
                )}
              </>
            )
          }))}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as TabId)}
          className="border-b border-[#e2e8f0] bg-[#ffffff] px-6 overflow-x-auto no-scrollbar"
        />
      }
      footer={
        <div className="flex items-center justify-between border-[#e2e8f0] bg-[#ffffff]">
          <div className="flex items-center gap-2">
            {activeTab !== 'identity' && (
              <Button
                type="button"
                intent="tertiary"
                onClick={handlePrev}
              >
                ← Previous
              </Button>
            )}
            {activeTab !== 'resources' && (
              <Button
                type="button"
                intent="tertiary"
                onClick={handleNext}
              >
                Next →
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              intent="secondary"
              size="small"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="new-player-form"
              disabled={!isFormValid}
              intent="primary"
              size="small"
              className="flex items-center justify-center"
            >
              Add Character
            </Button>
          </div>
        </div>
      }
    >
      <form 
        id="new-player-form" 
        onSubmit={handleSubmit} 
        className="flex-1 overflow-y-auto flex flex-col min-h-0 max-h-[90vh]"
      >
        <div className="flex-1">
          {activeTab === 'identity' && (
            <IdentityTab
              playerName={formData.playerName}
              characterName={formData.characterName}
              characterClass={formData.class}
              level={formData.level}
              statusId={formData.statusId}
              statuses={statuses}
              onChange={handleChange}
            />
          )}
          {activeTab === 'combat' && (
            <CombatTab
              ac={formData.ac}
              maxHp={formData.maxHp}
              hitDiceConfig={formData.hitDiceConfig}
              resistances={formData.resistances}
              immunities={formData.immunities}
              vulnerabilities={formData.vulnerabilities}
              notes={formData.notes}
              isHitDiceValid={isHitDiceValid}
              onChange={handleChange}
            />
          )}
          {activeTab === 'abilities' && (
            <div>
              <p className="text-xs text-stone-500 italic mb-4">
                Passive Perception, Insight, and Investigation are calculated automatically from these values.
              </p>
              <div className="bg-stone-100 rounded-xl p-3 shadow-inner border border-stone-200">
                <StatBlock
                  abilityScores={formData.abilityScores}
                  proficiencies={formData.proficiencies}
                  characterLevel={formData.level}
                  readOnly={false}
                  onChange={(scores, profs) => {
                    handleChange('abilityScores', scores);
                    handleChange('proficiencies', profs);
                  }}
                />
              </div>
            </div>
          )}
          {activeTab === 'resources' && (
            <ResourcePoolManager
              pools={formData.resourcePools}
              onChange={(pools) => handleChange('resourcePools', pools)}
              characterClass={formData.class}
              onCustomized={() => {
                poolsCustomized.current = true;
              }}
            />
          )}
        </div>
      </form>
    </DialogShell>
  );
}
