import { calculateModifier, proficiencyBonusFromLevel } from './abilityScores';

export type SpellcastingAbility = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA' | null;

export const SPELLCASTING_ABILITY_MAP: Record<string, SpellcastingAbility> = {
  Barbarian: null,
  Bard: 'CHA',
  Cleric: 'WIS',
  Druid: 'WIS',
  Fighter: null,
  Monk: null,
  Paladin: 'CHA',
  Ranger: 'WIS',
  Rogue: null,
  Sorcerer: 'CHA',
  Warlock: 'CHA',
  Wizard: 'INT',
  Artificer: 'INT',
};

export function getAutoSpellcastingAbility(className: string): SpellcastingAbility {
  return SPELLCASTING_ABILITY_MAP[className] ?? null;
}

export function getEffectiveSpellcastingAbility(
  className: string | undefined,
  override: SpellcastingAbility | undefined
): SpellcastingAbility {
  if (override !== undefined) {
    return override;
  }
  return getAutoSpellcastingAbility(className ?? '');
}

export function calculateSpellSaveDC(abilityMod: number, profBonus: number): number {
  return 8 + abilityMod + profBonus;
}

export function calculateSpellAttackBonus(abilityMod: number, profBonus: number): number {
  return abilityMod + profBonus;
}
