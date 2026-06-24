import { describe, it, expect } from 'vitest';
import { ResourcePool } from '../resourcePools';
import {
  getAutoScaledMax,
  getResourcePoolSuggestions,
  ResourcePoolSuggestion
} from '../resourcePoolScaling';

describe('resourcePoolScaling', () => {
  const ragePool: ResourcePool = {
    name: 'Rage', max: 2, current: 2, reset: 'long'
  };
  const kiPool: ResourcePool = {
    name: 'Ki Points', max: 2, current: 2, reset: 'short'
  };
  const customPool: ResourcePool = {
    name: 'Portent Dice', max: 2, current: 2, reset: 'long'
  };

  describe('getAutoScaledMax', () => {
    it('returns 2 for Rage at level 1', () => {
      expect(getAutoScaledMax('Rage', 1)).toBe(2);
    });

    it('returns 3 for Rage at level 3', () => {
      expect(getAutoScaledMax('Rage', 3)).toBe(3);
    });

    it('returns 99 for Rage at level 20', () => {
      expect(getAutoScaledMax('Rage', 20)).toBe(99);
    });

    it('returns 2 for Ki Points at level 2', () => {
      expect(getAutoScaledMax('Ki Points', 2)).toBe(2);
    });

    it('returns 10 for Ki Points at level 10', () => {
      expect(getAutoScaledMax('Ki Points', 10)).toBe(10);
    });

    it('returns 5 for Sorcery Points at level 5', () => {
      expect(getAutoScaledMax('Sorcery Points', 5)).toBe(5);
    });

    it('handles case-insensitivity (RAGE)', () => {
      expect(getAutoScaledMax('RAGE', 6)).toBe(4);
    });

    it('trims whitespace ( ki points )', () => {
      expect(getAutoScaledMax(' ki points ', 4)).toBe(4);
    });

    it('returns null for Portent Dice', () => {
      expect(getAutoScaledMax('Portent Dice', 5)).toBeNull();
    });

    it('clamps level below 1 to 1', () => {
      expect(getAutoScaledMax('Rage', 0)).toBe(2);
    });

    it('clamps level above 20 to 20', () => {
      expect(getAutoScaledMax('Rage', 25)).toBe(99);
    });
  });

  describe('getResourcePoolSuggestions', () => {
    describe('Existing pool scaling', () => {
      it('scales Barbarian Rage pool when going from L1 to L3', () => {
        const results = getResourcePoolSuggestions('Barbarian', 3, [ragePool]);
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({
          name: 'Rage',
          suggestedMax: 3,
          currentMax: 2,
          reset: 'long',
          isAutoDerived: true,
          isNew: false
        });
      });

      it('scales Barbarian Rage pool when going from L5 to L6', () => {
        const currentRageL5 = { ...ragePool, max: 3, current: 3 };
        const results = getResourcePoolSuggestions('Barbarian', 6, [currentRageL5]);
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({
          name: 'Rage',
          suggestedMax: 4,
          currentMax: 3,
          reset: 'long',
          isAutoDerived: true,
          isNew: false
        });
      });

      it('keeps Wizard customPool unchanged when going L4 to L5', () => {
        const results = getResourcePoolSuggestions('Wizard', 5, [customPool]);
        expect(results).toContainEqual({
          name: 'Portent Dice',
          suggestedMax: 2,
          currentMax: 2,
          reset: 'long',
          isAutoDerived: false,
          isNew: false
        });
      });
    });

    describe('New pool suggestions', () => {
      it('suggests Ki Points for Monk L1 to L2 when currently empty', () => {
        const results = getResourcePoolSuggestions('Monk', 2, []);
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({
          name: 'Ki Points',
          suggestedMax: 2,
          currentMax: undefined,
          reset: 'short',
          isAutoDerived: true,
          isNew: true
        });
      });

      it('does not suggest Ki Points at L1 (since Ki Points L1 = 0)', () => {
        const results = getResourcePoolSuggestions('Monk', 1, []);
        expect(results).toHaveLength(0);
      });

      it('suggests Sorcery Points and Spell Slots for Sorcerer L1 to L2 when currently empty', () => {
        const results = getResourcePoolSuggestions('Sorcerer', 2, []);
        expect(results).toHaveLength(2);
        expect(results).toContainEqual({
          name: 'Sorcery Points',
          suggestedMax: 2,
          currentMax: undefined,
          reset: 'long',
          isAutoDerived: true,
          isNew: true
        });
        expect(results).toContainEqual({
          name: 'Spell Slots',
          suggestedMax: 4,
          currentMax: undefined,
          reset: 'long',
          isAutoDerived: false,
          isNew: true
        });
      });

      it('does not suggest already existing pool (Barbarian L5 to L6)', () => {
        const results = getResourcePoolSuggestions('Barbarian', 6, [ragePool]);
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Rage');
        expect(results[0].isNew).toBe(false);
      });
    });

    describe('Sort order', () => {
      it('returns existing pools first in their original order, followed by new suggested pools', () => {
        const results = getResourcePoolSuggestions('Monk', 5, [kiPool, customPool]);
        expect(results).toHaveLength(2);
        expect(results[0].name).toBe('Ki Points');
        expect(results[0].isNew).toBe(false);
        expect(results[1].name).toBe('Portent Dice');
        expect(results[1].isNew).toBe(false);
      });
    });

    describe('Unknown class', () => {
      it('returns suggestions for existing pools only for unknown class', () => {
        const results = getResourcePoolSuggestions('Vitalist', 5, [customPool]);
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({
          name: 'Portent Dice',
          suggestedMax: 2,
          currentMax: 2,
          reset: 'long',
          isAutoDerived: false,
          isNew: false
        });
      });
    });

    describe('Edge cases', () => {
      it('suggests Rage for Barbarian at level 1 as new pool', () => {
        const results = getResourcePoolSuggestions('Barbarian', 1, []);
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({
          name: 'Rage',
          suggestedMax: 2,
          currentMax: undefined,
          reset: 'long',
          isAutoDerived: true,
          isNew: true
        });
      });

      it('does not suggest Ki Points for Monk at level 1', () => {
        const results = getResourcePoolSuggestions('Monk', 1, []);
        expect(results).toHaveLength(0);
      });
    });
  });
});
