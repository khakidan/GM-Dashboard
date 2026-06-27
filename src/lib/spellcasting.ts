import { calculateModifier, proficiencyBonusFromLevel, AbilityName } from './abilityScores';

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

export const CLASS_SAVING_THROW_MAP: Record<string, AbilityName[]> = {
  'Barbarian': ['STR', 'CON'],
  'Bard':      ['DEX', 'CHA'],
  'Cleric':    ['WIS', 'CHA'],
  'Druid':     ['INT', 'WIS'],
  'Fighter':   ['STR', 'CON'],
  'Monk':      ['STR', 'DEX'],
  'Paladin':   ['WIS', 'CHA'],
  'Ranger':    ['STR', 'DEX'],
  'Rogue':     ['DEX', 'INT'],
  'Sorcerer':  ['CON', 'CHA'],
  'Warlock':   ['WIS', 'CHA'],
  'Wizard':    ['INT', 'WIS'],
  'Artificer': ['CON', 'INT'],
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

export function parseSpellcastingAbility(val: string | null | undefined): SpellcastingAbility | undefined {
  if (val === null) return null;
  if (val === undefined) return undefined;
  const normalized = val.trim().toLowerCase();
  if (normalized === '' || normalized === 'auto') return undefined;
  if (normalized === 'none') return null;
  const uppercase = normalized.toUpperCase();
  if (['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].includes(uppercase)) {
    return uppercase as SpellcastingAbility;
  }
  return undefined;
}

export function serializeSpellcastingAbility(ability: SpellcastingAbility | undefined): string {
  if (ability === undefined) return '';
  if (ability === null) return 'none';
  return ability;
}
