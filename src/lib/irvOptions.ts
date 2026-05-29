// src/lib/irvOptions.ts

export const DAMAGE_TYPE_OPTIONS: string[] = [
  'bludgeoning', 'bludgeoning (nonmagical)',
  'piercing',    'piercing (nonmagical)',
  'slashing',    'slashing (nonmagical)',
  'acid', 'cold', 'fire', 'force', 'lightning',
  'necrotic', 'poison', 'psychic', 'radiant', 'thunder',
];

export const CONDITION_OPTIONS: string[] = [
  'blinded', 'charmed', 'deafened',
  'exhaustion 1', 'exhaustion 2', 'exhaustion 3',
  'exhaustion 4', 'exhaustion 5', 'exhaustion 6',
  'frightened', 'grappled', 'incapacitated', 'invisible',
  'paralyzed', 'petrified', 'poisoned', 'prone',
  'restrained', 'stunned', 'unconscious',
];

// Active effects — spells, class features, buffs and debuffs.
// These are tracked the same way as conditions but are never
// blocked by immunity checks.
export const EFFECT_OPTIONS: string[] = [
  // Class features
  'raging', 'wild shaped', 'action surge (used)',
  'second wind (used)', 'bardic inspiration (given)',
  // Concentration spells
  'concentrating', 'hasted', 'slowed', 'blessed', 'baned',
  'hexed', "hunter's mark", 'shield of faith',
  'spirit guardians', 'spiritual weapon', 'blurred',
  'polymorphed', 'fly', 'stoneskin', 'firewall',
  // Non-concentration effects
  'fire shield', 'mirror image', 'aid (boosted)',
  'enlarged', 'reduced', 'mage armor',
  'divine smite (used)', 'sneak attack (used)',
];

export const CONCENTRATION_EFFECTS = new Set<string>([
  'hasted', 'slowed', 'blessed', 'baned', 'hexed',
  "hunter's mark", 'shield of faith', 'spirit guardians',
  'blurred', 'polymorphed', 'fly', 'stoneskin',
  'concentrating',
]);

export const IRV_OPTIONS: string[] = [
  ...DAMAGE_TYPE_OPTIONS,
  ...CONDITION_OPTIONS,
];

// Maps official condition names to the immunity string(s) that block them.
// Used by ConditionChips to warn before applying a condition to an immune target.
export const CONDITION_IMMUNITY_MAP: Record<string, string[]> = {
  'blinded':       ['blinded'],
  'charmed':       ['charmed'],
  'deafened':      ['deafened'],
  'exhaustion':    ['exhaustion'],
  'exhaustion 1':  ['exhaustion'],
  'exhaustion 2':  ['exhaustion'],
  'exhaustion 3':  ['exhaustion'],
  'exhaustion 4':  ['exhaustion'],
  'exhaustion 5':  ['exhaustion'],
  'exhaustion 6':  ['exhaustion'],
  'frightened':    ['frightened'],
  'grappled':      ['grappled'],
  'incapacitated': ['incapacitated'],
  'invisible':     ['invisible'],
  'paralyzed':     ['paralyzed'],
  'petrified':     ['petrified'],
  'poisoned':      ['poisoned', 'poison'],
  'prone':         ['prone'],
  'restrained':    ['restrained'],
  'stunned':       ['stunned'],
  'unconscious':   ['unconscious'],
};