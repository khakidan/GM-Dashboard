import { describe, it, expect } from 'vitest';
import { ResourcePool } from '../resourcePools';
import {
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

  describe('pool scaling behaviors via getResourcePoolSuggestions', () => {
    it('Rage max at level 20 is 99 (unlimited sentinel)', () => {
      const suggestions = getResourcePoolSuggestions('Barbarian', 20, []);
      const rage = suggestions.find(s => s.name.toLowerCase() === 'rage');
      expect(rage?.suggestedMax).toBe(99);
    });

    it('Ki Points max at level 10 is 10', () => {
      const suggestions = getResourcePoolSuggestions('Monk', 10, []);
      const ki = suggestions.find(s => s.name.toLowerCase() === 'ki points');
      expect(ki?.suggestedMax).toBe(10);
    });

    it('Sorcery Points max at level 5 is 5', () => {
      const suggestions = getResourcePoolSuggestions('Sorcerer', 5, []);
      const sp = suggestions.find(s => s.name.toLowerCase() === 'sorcery points');
      expect(sp?.suggestedMax).toBe(5);
    });

    it('Wild Shape max at level 20 is 99 (unlimited sentinel)', () => {
      const suggestions = getResourcePoolSuggestions('Druid', 20, []);
      const ws = suggestions.find(s => s.name.toLowerCase() === 'wild shape');
      expect(ws?.suggestedMax).toBe(99);
    });

    it('matches existing pool names case-insensitively', () => {
      const currentPools: ResourcePool[] = [{
        name: 'RAGE',
        current: 2,
        max: 2,
        reset: 'long',
      }];
      const suggestions = getResourcePoolSuggestions('Barbarian', 6, currentPools);
      const rage = suggestions.find(s => s.name === 'RAGE');
      expect(rage?.suggestedMax).toBe(4);
    });

    it('matches existing pool names with surrounding whitespace', () => {
      const currentPools: ResourcePool[] = [{
        name: ' ki points ',
        current: 2,
        max: 2,
        reset: 'long',
      }];
      const suggestions = getResourcePoolSuggestions('Monk', 4, currentPools);
      const ki = suggestions.find(s => s.name === ' ki points ');
      expect(ki?.suggestedMax).toBe(4);
    });

    it('does not auto-scale unknown pool names like Portent Dice', () => {
      const currentPools: ResourcePool[] = [{
        name: 'Portent Dice',
        current: 3,
        max: 3,
        reset: 'long',
      }];
      const suggestions = getResourcePoolSuggestions('Barbarian', 5, currentPools);
      const portent = suggestions.find(s => s.name === 'Portent Dice');
      expect(portent?.isAutoDerived).toBe(false);
    });

    it('clamps level 0 to level 1 values', () => {
      const suggestions = getResourcePoolSuggestions('Barbarian', 0, []);
      const rage = suggestions.find(s => s.name.toLowerCase() === 'rage');
      // Level 1 Rage = 2; if clamping works, level 0 also gives 2
      expect(rage?.suggestedMax).toBe(2);
    });

    it('clamps level 25 to level 20 values', () => {
      const suggestions = getResourcePoolSuggestions('Barbarian', 25, []);
      const rage = suggestions.find(s => s.name.toLowerCase() === 'rage');
      // Level 20 Rage = 99; if clamping works, level 25 also gives 99
      expect(rage?.suggestedMax).toBe(99);
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
          suggestedMax: 2,
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
