import { describe, it, expect } from 'vitest';
import { CLASS_RESOURCE_SUGGESTIONS, getClassResourceSuggestions } from '../classResources';

describe('classResources', () => {
  describe('getClassResourceSuggestions', () => {
    it('returns an array containing a pool named Rage for Barbarian', () => {
      const suggestions = getClassResourceSuggestions('Barbarian');
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].name).toBe('Rage');
    });

    it('returns the same result for lowercase barbarian', () => {
      const suggestions = getClassResourceSuggestions('barbarian');
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].name).toBe('Rage');
    });

    it('returns a pool named Ki Points for MONK', () => {
      const suggestions = getClassResourceSuggestions('MONK');
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].name).toBe('Ki Points');
    });

    it('returns two pools for Artificer', () => {
      const suggestions = getClassResourceSuggestions('Artificer');
      expect(suggestions).toHaveLength(2);
      expect(suggestions.some(p => p.name === 'Infused Items')).toBe(true);
      expect(suggestions.some(p => p.name === 'Spell Slots')).toBe(true);
    });

    it('returns [] for unknown class', () => {
      const suggestions = getClassResourceSuggestions('Vitalist');
      expect(suggestions).toEqual([]);
    });

    it('returns [] for empty string', () => {
      const suggestions = getClassResourceSuggestions('');
      expect(suggestions).toEqual([]);
    });

    it('returns [] for null-like input', () => {
      expect(getClassResourceSuggestions(null as any)).toEqual([]);
      expect(getClassResourceSuggestions(undefined as any)).toEqual([]);
    });

    it('returns deep copies so mutations do not affect template data', () => {
      const suggestions = getClassResourceSuggestions('Bard');
      expect(suggestions[0].max).toBe(3);
      suggestions[0].max = 99; // Mutate local copy

      const secondCall = getClassResourceSuggestions('Bard');
      expect(secondCall[0].max).toBe(3); // Original should remain unchanged
    });

  it('returns the correct pool names for each class', () => {
    expect(getClassResourceSuggestions('Barbarian').map(p => p.name))
      .toEqual(['Rage']);

    expect(getClassResourceSuggestions('Bard').map(p => p.name))
      .toEqual(['Bardic Inspiration']);

    expect(getClassResourceSuggestions('Cleric').map(p => p.name))
      .toEqual(['Channel Divinity', 'Spell Slots']);

    expect(getClassResourceSuggestions('Druid').map(p => p.name))
      .toEqual(['Wild Shape', 'Spell Slots']);

    expect(getClassResourceSuggestions('Fighter').map(p => p.name))
      .toEqual(['Action Surge', 'Second Wind']);

    expect(getClassResourceSuggestions('Monk').map(p => p.name))
      .toEqual(['Ki Points']);

    expect(getClassResourceSuggestions('Paladin').map(p => p.name))
      .toEqual(['Channel Divinity', 'Lay on Hands']);

    expect(getClassResourceSuggestions('Ranger')).toEqual([]);

    expect(getClassResourceSuggestions('Sorcerer').map(p => p.name))
      .toEqual(['Sorcery Points', 'Spell Slots']);

    expect(getClassResourceSuggestions('Rogue').map(p => p.name))
      .toEqual(['Sneak Attack (d6)']);

    expect(getClassResourceSuggestions('Warlock').map(p => p.name))
      .toEqual(['Warlock Spell Slots']);

    expect(getClassResourceSuggestions('Wizard').map(p => p.name))
      .toEqual(['Spell Slots']);

    expect(getClassResourceSuggestions('Artificer').map(p => p.name))
      .toEqual(['Infused Items', 'Spell Slots']);
  });
  });

  describe('CLASS_RESOURCE_SUGGESTIONS', () => {
    it('has exactly 13 entries', () => {
      expect(Object.keys(CLASS_RESOURCE_SUGGESTIONS)).toHaveLength(13);
    });

  it('every pool has correct name, current, max, and reset values', () => {
    // Barbarian — long rest pool
    const barbPools = getClassResourceSuggestions('Barbarian');
    expect(barbPools[0]).toEqual({
      name: 'Rage',
      current: 2,
      max: 2,
      reset: 'long',
    });

    // Warlock — short rest pool
    const warlockPools = getClassResourceSuggestions('Warlock');
    expect(warlockPools[0]).toEqual({
      name: 'Warlock Spell Slots',
      current: 1,
      max: 1,
      reset: 'short',
    });

    // Rogue — informational pool
    const roguePools = getClassResourceSuggestions('Rogue');
    expect(roguePools[0]).toEqual({
      name: 'Sneak Attack (d6)',
      current: 1,
      max: 1,
      reset: 'long',
    });
  });

    it('every reset value is short, long, or none', () => {
      Object.values(CLASS_RESOURCE_SUGGESTIONS).forEach(pools => {
        pools.forEach(pool => {
          expect(['short', 'long', 'none']).toContain(pool.reset);
        });
      });
    });
  });
});
