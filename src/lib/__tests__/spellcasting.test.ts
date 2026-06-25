import { describe, it, expect } from 'vitest';
import {
  getAutoSpellcastingAbility,
  getEffectiveSpellcastingAbility,
  calculateSpellSaveDC,
  calculateSpellAttackBonus,
  parseSpellcastingAbility,
} from '../spellcasting';

describe('getAutoSpellcastingAbility', () => {
  it('returns int for Wizard', () => {
    expect(getAutoSpellcastingAbility('Wizard')).toBe('INT');
  });

  it('returns wis for Cleric', () => {
    expect(getAutoSpellcastingAbility('Cleric')).toBe('WIS');
  });

  it('returns cha for Warlock', () => {
    expect(getAutoSpellcastingAbility('Warlock')).toBe('CHA');
  });

  it('returns cha for Bard', () => {
    expect(getAutoSpellcastingAbility('Bard')).toBe('CHA');
  });

  it('returns cha for Paladin', () => {
    expect(getAutoSpellcastingAbility('Paladin')).toBe('CHA');
  });

  it('returns wis for Druid', () => {
    expect(getAutoSpellcastingAbility('Druid')).toBe('WIS');
  });

  it('returns wis for Ranger', () => {
    expect(getAutoSpellcastingAbility('Ranger')).toBe('WIS');
  });

  it('returns null for Barbarian', () => {
    expect(getAutoSpellcastingAbility('Barbarian')).toBeNull();
  });

  it('returns null for Fighter', () => {
    expect(getAutoSpellcastingAbility('Fighter')).toBeNull();
  });

  it('returns null for Monk', () => {
    expect(getAutoSpellcastingAbility('Monk')).toBeNull();
  });

  it('returns null for Rogue', () => {
    expect(getAutoSpellcastingAbility('Rogue')).toBeNull();
  });

  it('returns null for unknown class string', () => {
    expect(getAutoSpellcastingAbility('Vitalist')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getAutoSpellcastingAbility('')).toBeNull();
  });
});

describe('getEffectiveSpellcastingAbility', () => {
  it('returns the override when override is a string (int)', () => {
    expect(getEffectiveSpellcastingAbility('Fighter', 'INT')).toBe('INT');
  });

  it('returns the override when override is a string (wis)', () => {
    expect(getEffectiveSpellcastingAbility('Cleric', 'WIS')).toBe('WIS');
  });

  it('returns null when override is explicitly null, even for a known caster class (Wizard)', () => {
    expect(getEffectiveSpellcastingAbility('Wizard', null)).toBeNull();
  });

  it('auto-derives int when override is undefined and class is Wizard', () => {
    expect(getEffectiveSpellcastingAbility('Wizard', undefined)).toBe('INT');
  });

  it('auto-derives wis when override is undefined and class is Cleric', () => {
    expect(getEffectiveSpellcastingAbility('Cleric', undefined)).toBe('WIS');
  });

  it('returns null when override is undefined and class is Barbarian', () => {
    expect(getEffectiveSpellcastingAbility('Barbarian', undefined)).toBeNull();
  });

  it('returns null when override is undefined and class is undefined', () => {
    expect(getEffectiveSpellcastingAbility(undefined, undefined)).toBeNull();
  });
});

describe('calculateSpellSaveDC', () => {
  it('returns 13 for mod 3, prof 2', () => {
    expect(calculateSpellSaveDC(3, 2)).toBe(13);
  });

  it('returns 17 for mod 5, prof 4', () => {
    expect(calculateSpellSaveDC(5, 4)).toBe(17);
  });

  it('returns 9 for mod -1, prof 2', () => {
    expect(calculateSpellSaveDC(-1, 2)).toBe(9);
  });

  it('returns 8 for mod 0, prof 0', () => {
    expect(calculateSpellSaveDC(0, 0)).toBe(8);
  });
});

describe('calculateSpellAttackBonus', () => {
  it('returns 5 for mod 3, prof 2', () => {
    expect(calculateSpellAttackBonus(3, 2)).toBe(5);
  });

  it('returns 9 for mod 5, prof 4', () => {
    expect(calculateSpellAttackBonus(5, 4)).toBe(9);
  });

  it('returns 1 for mod -1, prof 2', () => {
    expect(calculateSpellAttackBonus(-1, 2)).toBe(1);
  });

  it('returns 0 for mod 0, prof 0', () => {
    expect(calculateSpellAttackBonus(0, 0)).toBe(0);
  });
});

describe('parseSpellcastingAbility', () => {
  it('returns null when passed null (explicit non-caster override)', () => {
    expect(parseSpellcastingAbility(null)).toBe(null);
  });

  it('returns undefined when passed undefined', () => {
    expect(parseSpellcastingAbility(undefined)).toBe(undefined);
  });

  it('returns null when passed the string "none"', () => {
    expect(parseSpellcastingAbility("none")).toBe(null);
  });

  it('returns INT when passed "INT"', () => {
    expect(parseSpellcastingAbility("INT")).toBe("INT");
  });
});
