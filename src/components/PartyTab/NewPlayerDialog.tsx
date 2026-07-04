import React, { useEffect, useState, useRef } from 'react';
import { X, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Character } from '../../types';
import { cn } from '../../lib/utils';
import { useFormState } from '../../hooks/useFormState';
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
import {
  ResourcePool,
  serializeResourcePools,
} from '../../lib/resourcePools';
import { ResourcePoolManager } from '../ui/ResourcePoolManager';
import { usePlayerFormAutomation } from '../../hooks/usePlayerFormAutomation';

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
  const isHitDiceValid = formData.hitDiceConfig.trim() === '' || /^\d+d\d+(\+\d+d\d+)*$/.test(formData.hitDiceConfig.trim());
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
      statusName: formData.statusId === 1 ? 'Active' : formData.statusId === 2 ? 'Inactive' : 'Deceased',
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#ffffff] w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl border border-[#e2e8f0] flex flex-col mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-stone-900 rounded-t-xl transition-colors">
              <div className="flex items-center gap-3">
                <UserPlus className="w-5 h-5 text-[#2563eb]" />
                <h2 className="text-lg font-bold text-stone-100">Add Character</h2>
              </div>
              <button
                onClick={onClose}
                className="text-stone-400 hover:text-stone-200 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-stone-200 bg-stone-50/50 px-6 flex items-center overflow-x-auto no-scrollbar">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "px-4 py-3 text-sm transition-colors relative whitespace-nowrap",
                      isActive ? "text-[#2563eb] border-b-2 border-[#2563eb] font-medium" : "text-stone-500 hover:text-stone-700"
                    )}
                  >
                    {tab.label}
                    {!tab.optional && (
                      <span className="text-[10px] text-[#2563eb] ml-1.5">(required)</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Form Content Area */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col min-h-0">
              <div className="flex-1 px-6 py-5">
                {activeTab === 'identity' && (
                  <IdentityTab
                    playerName={formData.playerName}
                    characterName={formData.characterName}
                    characterClass={formData.class}
                    level={formData.level}
                    statusId={formData.statusId}
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

              {/* Footer */}
              <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  {activeTab !== 'identity' && (
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="text-sm text-stone-500 hover:text-stone-700 px-2 py-1 transition-colors"
                    >
                      ← Previous
                    </button>
                  )}
                  {activeTab !== 'resources' && (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="text-sm text-stone-500 hover:text-stone-700 px-2 py-1 transition-colors"
                    >
                      Next →
                    </button>
                  )}
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-[#e2e8f0] hover:bg-[#d4cfc1] text-[#0f172a] text-sm font-medium px-4 py-2 rounded-xl mr-3 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid}
                    className="bg-[#2563eb] hover:bg-[#567eff] text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 flex items-center justify-center shadow-lg"
                  >
                    Add Character
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
