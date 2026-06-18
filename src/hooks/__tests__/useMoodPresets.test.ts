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
    expect(result.current.assignments.sweet).toBeNull();
    expect(result.current.assignments.combat).toBeNull();
    expect(result.current.activeMood).toBeNull();
  });

  it('loads saved assignments from localStorage on construction', () => {
    const saved = {
      sweet: 'track-sweet-1',
      adventuring: 'track-adv',
      tense: null,
      scary: null,
      combat: 'track-combat-3'
    };
    localStorage.setItem(STORAGE_KEYS.moodPresets, JSON.stringify(saved));

    const { result } = renderHook(() => useMoodPresets());
    expect(result.current.assignments.sweet).toBe('track-sweet-1');
    expect(result.current.assignments.combat).toBe('track-combat-3');
  });

  it('migrates old array assignments from localStorage', () => {
    const saved = {
      sweet: ['track-sweet-1', 'track-sweet-2'],
      combat: []
    };
    localStorage.setItem(STORAGE_KEYS.moodPresets, JSON.stringify(saved));

    const { result } = renderHook(() => useMoodPresets());
    expect(result.current.assignments.sweet).toBe('track-sweet-1');
    expect(result.current.assignments.combat).toBeNull();
  });

  it('assignTrackToMood assigns a track to the correct mood and persists it', () => {
    const { result } = renderHook(() => useMoodPresets());
    
    act(() => {
      result.current.assignTrackToMood('file-1', 'sweet');
    });

    expect(result.current.assignments.sweet).toBe('file-1');
    
    // Check persistence
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.moodPresets) || '{}');
    expect(saved.sweet).toBe('file-1');
  });

  it('assigning a track to a mood that already has one replaces the old track', () => {
    const { result } = renderHook(() => useMoodPresets());

    act(() => {
      result.current.assignTrackToMood('file-1', 'sweet');
    });
    expect(result.current.assignments.sweet).toBe('file-1');

    act(() => {
      result.current.assignTrackToMood('file-2', 'sweet');
    });
    expect(result.current.assignments.sweet).toBe('file-2');
  });

  it('assigning a track to a new mood removes it from its previous mood', () => {
    const { result } = renderHook(() => useMoodPresets());

    act(() => {
      result.current.assignTrackToMood('file-1', 'sweet');
    });
    expect(result.current.assignments.sweet).toBe('file-1');

    act(() => {
      result.current.assignTrackToMood('file-1', 'combat');
    });
    expect(result.current.assignments.sweet).toBeNull();
    expect(result.current.assignments.combat).toBe('file-1');
  });

  it('unassignTrack removes the track from its current mood', () => {
    const { result } = renderHook(() => useMoodPresets());

    act(() => {
      result.current.assignTrackToMood('file-1', 'scary');
    });
    expect(result.current.assignments.scary).toBe('file-1');

    act(() => {
      result.current.unassignTrack('file-1');
    });
    expect(result.current.assignments.scary).toBeNull();
  });

  it('getMoodForTrack returns the correct mood or null', () => {
    const { result } = renderHook(() => useMoodPresets());

    expect(result.current.getMoodForTrack('file-1')).toBeNull();

    act(() => {
      result.current.assignTrackToMood('file-1', 'tense');
    });
    expect(result.current.getMoodForTrack('file-1')).toBe('tense');
  });

  it('activateMood with an assigned track calls playAmbient with the assigned fileId', () => {
    const playAmbient = vi.fn();
    const { result } = renderHook(() => useMoodPresets());

    act(() => {
      result.current.assignTrackToMood('file-1', 'combat');
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

  it('resetAllMoods sets all five moods to null', () => {
    const { result } = renderHook(() => useMoodPresets());

    act(() => {
      result.current.assignTrackToMood('file-1', 'sweet');
      result.current.assignTrackToMood('file-2', 'combat');
    });

    expect(result.current.assignments.sweet).toBe('file-1');

    act(() => {
      result.current.activateMood('combat', vi.fn());
    });
    expect(result.current.activeMood).toBe('combat');

    act(() => {
      result.current.resetAllMoods();
    });

    expect(result.current.assignments.sweet).toBeNull();
    expect(result.current.assignments.combat).toBeNull();
    expect(result.current.activeMood).toBeNull();
  });
});

