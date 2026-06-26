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

    describe('returns a non-empty array for every known class', () => {
      const knownClasses = Object.keys(CLASS_RESOURCE_SUGGESTIONS);
      knownClasses.forEach(className => {
        it(`for ${className}`, () => {
          const suggestions = getClassResourceSuggestions(className);
          expect(suggestions.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('CLASS_RESOURCE_SUGGESTIONS', () => {
    it('has exactly 13 entries', () => {
      expect(Object.keys(CLASS_RESOURCE_SUGGESTIONS)).toHaveLength(13);
    });

    it('every pool has name, current, max, and reset defined', () => {
      Object.values(CLASS_RESOURCE_SUGGESTIONS).forEach(pools => {
        pools.forEach(pool => {
          expect(pool.name).toBeDefined();
          expect(pool.current).toBeDefined();
          expect(pool.max).toBeDefined();
          expect(pool.reset).toBeDefined();
        });
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
