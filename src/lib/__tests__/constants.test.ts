import { describe, it, expect } from 'vitest';
import { 
  OVERLAY_DURATIONS, 
  DEATH_SAVES, 
  RECHARGE_DIE_SIDES,
  STORAGE_KEYS,
  SHEET_RANGES,
  TIMERS,
  campaignKey
} from '../constants';

describe('constants', () => {
  it('campaignKey computes names correctly', () => {
    expect(campaignKey('gm_mood_presets', 'abc')).toBe('gm_mood_presets_abc');
    expect(campaignKey('gm_mood_presets', '')).toBe('gm_mood_presets_');
  });

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

  it('TIMERS.audioPreviewMs equals 3000', () => {
    expect(TIMERS.audioPreviewMs).toBe(3000);
  });

  it('All TIMERS values are positive numbers', () => {
    const values = Object.values(TIMERS);
    values.forEach(val => {
      expect(val).toBeGreaterThan(0);
      expect(typeof val).toBe('number');
    });
  });

  it('STORAGE_KEYS.instructionsDismissed equals "gm_instructions_dismissed"', () => {
    expect(STORAGE_KEYS.instructionsDismissed).toBe('gm_instructions_dismissed');
  });

  it('SHEET_RANGES.characters ends in Z', () => {
    expect(SHEET_RANGES.characters).toMatch(/:Z$/);
  });

  it('SHEET_RANGES.npcs ends in V', () => {
    expect(SHEET_RANGES.npcs).toMatch(/:V$/);
  });
});
