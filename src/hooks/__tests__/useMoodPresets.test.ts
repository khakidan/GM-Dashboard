// src/hooks/__tests__/useMoodPresets.test.ts

import { renderHook, act } from '@testing-library/react';
import { useMoodPresets } from '../useMoodPresets';
import { STORAGE_KEYS, MOODS } from '../../lib/constants';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

import { toast } from 'sonner';

describe('useMoodPresets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initially loads empty defaults when localStorage is empty', () => {
    const { result } = renderHook(() => useMoodPresets());
    expect(result.current.assignments.sweet).toEqual([]);
    expect(result.current.assignments.combat).toEqual([]);
    expect(result.current.activeMood).toBeNull();
  });

  it('loads saved assignments from localStorage on construction', () => {
    const saved = {
      sweet: ['track-sweet-1'],
      adventuring: ['track-adv'],
      tense: [],
      scary: [],
      combat: ['track-combat-3']
    };
    localStorage.setItem(STORAGE_KEYS.moodPresets, JSON.stringify(saved));

    const { result } = renderHook(() => useMoodPresets());
    expect(result.current.assignments.sweet).toEqual(['track-sweet-1']);
    expect(result.current.assignments.combat).toEqual(['track-combat-3']);
  });

  it('assignTrackToMood assigns a track to the correct mood and persists it', () => {
    const { result } = renderHook(() => useMoodPresets());
    
    act(() => {
      result.current.assignTrackToMood('file-1', 'sweet');
    });

    expect(result.current.assignments.sweet).toContain('file-1');
    
    // Check persistence
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.moodPresets) || '{}');
    expect(saved.sweet).toContain('file-1');
  });

  it('assigning a track to a new mood removes it from its previous mood', () => {
    const { result } = renderHook(() => useMoodPresets());

    act(() => {
      result.current.assignTrackToMood('file-1', 'sweet');
    });
    expect(result.current.assignments.sweet).toContain('file-1');

    act(() => {
      result.current.assignTrackToMood('file-1', 'combat');
    });
    expect(result.current.assignments.sweet).not.toContain('file-1');
    expect(result.current.assignments.combat).toContain('file-1');
  });

  it('unassignTrack removes the track from its current mood', () => {
    const { result } = renderHook(() => useMoodPresets());

    act(() => {
      result.current.assignTrackToMood('file-1', 'scary');
    });
    expect(result.current.assignments.scary).toContain('file-1');

    act(() => {
      result.current.unassignTrack('file-1');
    });
    expect(result.current.assignments.scary).not.toContain('file-1');
  });

  it('getMoodForTrack returns the correct mood or null', () => {
    const { result } = renderHook(() => useMoodPresets());

    expect(result.current.getMoodForTrack('file-1')).toBeNull();

    act(() => {
      result.current.assignTrackToMood('file-1', 'tense');
    });
    expect(result.current.getMoodForTrack('file-1')).toBe('tense');
  });

  it('activateMood with an assigned track calls playAmbient with the first fileId for that mood', () => {
    const playAmbient = vi.fn();
    const { result } = renderHook(() => useMoodPresets());

    act(() => {
      result.current.assignTrackToMood('file-1', 'combat');
    });
    act(() => {
      result.current.assignTrackToMood('file-2', 'combat');
    });

    act(() => {
      result.current.activateMood('combat', playAmbient);
    });

    expect(playAmbient).toHaveBeenCalledWith('file-1');
    expect(result.current.activeMood).toBe('combat');
  });

  it('activateMood with no tracks assigned does not call playAmbient and displays a toast', () => {
    const playAmbient = vi.fn();
    const { result } = renderHook(() => useMoodPresets());

    act(() => {
      result.current.activateMood('tense', playAmbient);
    });

    expect(playAmbient).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith('No tracks assigned to Tense. Open the Audio Library to assign one.');
  });
});
