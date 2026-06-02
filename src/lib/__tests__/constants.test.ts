import { describe, it, expect } from 'vitest';
import { 
  OVERLAY_DURATIONS, 
  DEATH_SAVES, 
  RECHARGE_DIE_SIDES,
  STORAGE_KEYS,
  SHEET_RANGES
} from '../constants';

describe('constants', () => {
  it('OVERLAY_DURATIONS.death equals 10000', () => {
    expect(OVERLAY_DURATIONS.death).toBe(10000);
  });

  it('OVERLAY_DURATIONS.damage equals 5000', () => {
    expect(OVERLAY_DURATIONS.damage).toBe(5000);
  });

  it('DEATH_SAVES.failuresForDeath equals 3', () => {
    expect(DEATH_SAVES.failuresForDeath).toBe(3);
  });

  it('DEATH_SAVES.successesForStability equals 3', () => {
    expect(DEATH_SAVES.successesForStability).toBe(3);
  });

  it('RECHARGE_DIE_SIDES equals 6', () => {
    expect(RECHARGE_DIE_SIDES).toBe(6);
  });

  it('All STORAGE_KEYS values are unique strings', () => {
    const values = Object.values(STORAGE_KEYS);
    const uniqueValues = new Set(values);
    expect(values.length).toBe(uniqueValues.size);
  });

  it('All SHEET_RANGES values contain the "!" character', () => {
    const values = Object.values(SHEET_RANGES);
    values.forEach(val => {
      expect(val).toContain('!');
    });
  });
});
