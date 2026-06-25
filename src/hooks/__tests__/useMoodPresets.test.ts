import { renderHook, act } from '@testing-library/react';
import { useMoodPresets } from '../useMoodPresets';
import { STORAGE_KEYS, campaignKey } from '../../lib/constants';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

describe('useMoodPresets State Transition Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('loads presets and updates mood state on select', () => {
    const saved = {
      sweet: 'track-sweet-1',
      combat: 'track-combat-3',
    };
    localStorage.setItem(campaignKey(STORAGE_KEYS.moodPresets, 'default'), JSON.stringify(saved));

    const { result } = renderHook(() => useMoodPresets());

    // Verify loading presets on init
    expect(result.current.assignments.sweet).toBe('track-sweet-1');
    expect(result.current.assignments.combat).toBe('track-combat-3');
    expect(result.current.activeMood).toBeNull();

    // Verify updates mood state on select (activateMood)
    const mockPlayAmbient = vi.fn();
    act(() => {
      result.current.activateMood('combat', mockPlayAmbient);
    });

    expect(mockPlayAmbient).toHaveBeenCalledWith('track-combat-3');
    expect(result.current.activeMood).toBe('combat');
  });
});
