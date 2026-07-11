import { describe, it, expect } from 'vitest';
import {
  parseResourcePools,
  serializeResourcePools,
  spendResourcePip,
  recoverResourcePip,
  resetResourcesOnShortRest,
  resetResourcesOnLongRest,
  addResourcePool,
  removeResourcePool,
  updateResourcePool,
  ResourcePool,
  getResourceForEffect,
  EFFECT_RESOURCE_MAP,
} from '../resourcePools';

describe('ResourcePools pure utilities', () => {
  const mockPools: ResourcePool[] = [
    { name: 'Rage', current: 1, max: 3, reset: 'long' },
    { name: 'Ki', current: 2, max: 4, reset: 'short' },
    { name: 'Spell Slots', current: 0, max: 2, reset: 'long' },
  ];

  describe('parseResourcePools', () => {
    it('parses valid JSON arrays correctly', () => {
      const json = JSON.stringify(mockPools);
      expect(parseResourcePools(json)).toEqual(mockPools);
    });

    it('returns empty array for invalid inputs', () => {
      expect(parseResourcePools('')).toEqual([]);
      expect(parseResourcePools('   ')).toEqual([]);
      expect(parseResourcePools('invalid')).toEqual([]);
      expect(parseResourcePools('{}')).toEqual([]);
    });
  });

  describe('serializeResourcePools', () => {
    it('serializes array to JSOn string', () => {
      const res = serializeResourcePools(mockPools);
      expect(JSON.parse(res)).toEqual(mockPools);
    });

    it('serializes empty array correctly', () => {
      expect(serializeResourcePools([])).toBe('[]');
    });
  });

  describe('spendResourcePip', () => {
    it('spends correct count case insensitively', () => {
      const updated = spendResourcePip(mockPools, 'rage', 1);
      expect(updated[0].current).toBe(0);
      expect(updated[1].current).toBe(2); // Ki unchanged
    });

    it('clamps to 0 if count exceeds remaining', () => {
      const updated = spendResourcePip(mockPools, 'Ki', 5);
      expect(updated[1].current).toBe(0);
    });

    it('unmatched pools are unaffected', () => {
      const updated = spendResourcePip(mockPools, 'Wild Shape', 1);
      expect(updated).toEqual(mockPools);
    });
  });

  describe('recoverResourcePip', () => {
    it('recovers resource uses case insensitively', () => {
      const updated = recoverResourcePip(mockPools, 'Ki', 1);
      expect(updated[1].current).toBe(3);
    });

    it('clamps to max uses', () => {
      const updated = recoverResourcePip(mockPools, 'rage', 5);
      expect(updated[0].current).toBe(3);
    });
  });

  describe('resetResourcesOnShortRest', () => {
    it('resets only short-rest resource pools to max', () => {
      const updated = resetResourcesOnShortRest(mockPools);
      expect(updated[0].current).toBe(1); // Rage (long) unchanged
      expect(updated[1].current).toBe(4); // Ki (short) reset to max
      expect(updated[2].current).toBe(0); // Spell Slots (long) unchanged
    });
  });

  describe('resetResourcesOnLongRest', () => {
    it('resets all pools to max regardless of reset type', () => {
      const updated = resetResourcesOnLongRest(mockPools);
      expect(updated[0].current).toBe(3);
      expect(updated[1].current).toBe(4);
      expect(updated[2].current).toBe(2);
    });
  });

  describe('addResourcePool', () => {
    it('adds fresh resource pool with current set to max', () => {
      const updated = addResourcePool(mockPools, { name: 'Grit', max: 5, reset: 'short' });
      expect(updated).toHaveLength(4);
      expect(updated[3]).toEqual({
        name: 'Grit',
        max: 5,
        current: 5,
        reset: 'short',
      });
    });

    it('ignores if pool with same case-insensitive name already exists', () => {
      const updated = addResourcePool(mockPools, { name: 'RAGE', max: 10, reset: 'short' });
      expect(updated).toEqual(mockPools);
    });
  });

  describe('removeResourcePool', () => {
    it('removes pool by case-insensitive name', () => {
      const updated = removeResourcePool(mockPools, 'kI');
      expect(updated).toHaveLength(2);
      expect(updated.find(p => p.name === 'Ki')).toBeUndefined();
    });
  });

  describe('updateResourcePool', () => {
    it('updates properties of matched case-insensitive pool', () => {
      const updated = updateResourcePool(mockPools, 'rage', {
        name: 'Frenzy Rage',
        reset: 'short',
      });
      expect(updated[0].name).toBe('Frenzy Rage');
      expect(updated[0].reset).toBe('short');
      expect(updated[0].max).toBe(3);
    });

    it('clamps current if new max decreases below current', () => {
      const updated = updateResourcePool(mockPools, 'ki', { max: 1 });
      expect(updated[1].max).toBe(1);
      expect(updated[1].current).toBe(1); // clamped from 2
    });
  });

  describe('getResourceForEffect & EFFECT_RESOURCE_MAP', () => {
    it('getResourceForEffect returns correct mapping', () => {
      expect(getResourceForEffect('raging')).toBe('rage');
      expect(getResourceForEffect('RAGING')).toBe('rage');
      expect(getResourceForEffect('wild shaped')).toBe('wild shape');
      expect(getResourceForEffect('concentrating')).toBeNull();
      expect(getResourceForEffect('blinded')).toBeNull();
      expect(getResourceForEffect('sneak attack (used)')).toBeNull();
    });

    it('EFFECT_RESOURCE_MAP has exactly 2 entries', () => {
      expect(Object.keys(EFFECT_RESOURCE_MAP)).toHaveLength(2);
    });
  });
});
