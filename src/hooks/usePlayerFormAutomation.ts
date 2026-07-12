import { useEffect, MutableRefObject } from 'react';
import { suggestHitDiceConfig, parseClassString } from '../lib/hitDice';
import {
  calculateModifier,
  proficiencyBonusFromLevel,
  parseProficiencies,
  serializeProficiencies,
} from '../lib/abilityScores';
import { getResourcePoolSuggestions } from '../lib/resourcePoolScaling';
import { CLASS_SAVING_THROW_MAP } from '../lib/spellcasting';
import { ResourcePool } from '../lib/resourcePools';

interface UsePlayerFormAutomationProps {
  activeTab: string;
  formData: {
    class: string;
    level: number | string;
    hitDiceConfig: string;
    abilityScores: any;
    proficiencies: any;
    resourcePools: ResourcePool[];
  };
  handleChange: (key: string, value: any) => void;
  poolsCustomized: MutableRefObject<boolean>;
}

export function usePlayerFormAutomation({
  activeTab,
  formData,
  handleChange,
  poolsCustomized,
}: UsePlayerFormAutomationProps) {
  // Auto-suggest hit dice
  useEffect(() => {
    if (activeTab === 'combat' && !formData.hitDiceConfig && formData.class && formData.level) {
      const level = typeof formData.level === 'number' ? formData.level : (parseInt(String(formData.level), 10) || 1);
      const suggestion = suggestHitDiceConfig(formData.class, level);
      if (suggestion) {
        handleChange('hitDiceConfig', suggestion);
      }
    }
  }, [activeTab, formData.class, formData.level, formData.hitDiceConfig, handleChange]);

  // Auto-suggest resource pools
  useEffect(() => {
    if (!poolsCustomized.current && formData.class) {
      const level = typeof formData.level === 'number' ? formData.level : (parseInt(formData.level, 10) || 1);
      const suggestions = getResourcePoolSuggestions(
        formData.class,
        level,
        []
      );
      if (suggestions.length > 0) {
        handleChange('resourcePools',
          suggestions.map(s => ({
            name: s.name,
            current: s.suggestedMax,
            max: s.suggestedMax,
            reset: s.reset,
          }))
        );
      }
    }
  }, [formData.class, formData.level, handleChange, poolsCustomized]);

  // Update Bardic Inspiration based on CHA modifier
  useEffect(() => {
    const isBard = parseClassString(formData.class || '').some(c => c.toLowerCase().trim().startsWith('bard'));
    if (!isBard) return;
    if (poolsCustomized.current) return;

    const chaScore = typeof formData.abilityScores?.CHA === 'number'
      ? formData.abilityScores.CHA
      : (parseInt(String(formData.abilityScores?.CHA), 10) || 10);

    const chaMod = Math.max(1, calculateModifier(chaScore));

    const currentPools = Array.isArray(formData.resourcePools)
      ? formData.resourcePools
      : [];

    const hasBI = currentPools.some(p => p.name === 'Bardic Inspiration');
    if (!hasBI) return;

    const updatedPools = currentPools.map(p =>
      p.name === 'Bardic Inspiration'
        ? { ...p, current: chaMod, max: chaMod }
        : p
    );

    handleChange('resourcePools', updatedPools);
  }, [formData.class, formData.abilityScores?.CHA, handleChange, poolsCustomized]);

  // Keep proficiency bonus in sync with character level
  useEffect(() => {
    const level = typeof formData.level === 'number'
      ? formData.level
      : (parseInt(String(formData.level), 10) || 1);
    const correctProfBonus = proficiencyBonusFromLevel(level);

    const currentProfBonus = formData.proficiencies?.proficiencyBonus ?? 0;

    if (currentProfBonus === correctProfBonus) return;

    try {
      const parsed = parseProficiencies(
        serializeProficiencies(formData.proficiencies)
      );
      parsed.proficiencyBonus = correctProfBonus;
      handleChange('proficiencies', parsed);
    } catch {
      // silently ignore
    }
  }, [formData.level, handleChange]);

  // Auto-assign saving throws on class change
  useEffect(() => {
    if (!formData.class) return;

    const autoThrows = CLASS_SAVING_THROW_MAP[formData.class] ?? [];

    // Preserve any existing saving throws the GM manually added, then add the class-derived ones
    const existing = formData.proficiencies?.savingThrows ?? [];

    // Merge: start with auto throws, then add any manual ones not already included.
    // This ensures class throws are always present while preserving GM customizations.
    const merged = [
      ...autoThrows,
      ...existing.filter(t => !autoThrows.includes(t)),
    ];

    // Only update if the saving throws actually changed to avoid loops
    const same = merged.length === existing.length && merged.every(t => existing.includes(t));
    if (same) return;

    handleChange('proficiencies', {
      ...formData.proficiencies,
      savingThrows: merged,
    });
  }, [formData.class, handleChange]);
}
