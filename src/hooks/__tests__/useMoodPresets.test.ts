import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMoodPresets } from '../useMoodPresets';
import { STORAGE_KEYS } from '../../lib/constants';

describe('useMoodPresets', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('assignTrackToMood assigns a track to the correct mood', () => {
    const { result } = renderHook(() => useMoodPresets());

    act(() => {
      result.current.assignTrackToMood('file-1', 'sweet');
    });

    expect(result.current.assignments.sweet).toContain('file-1');
  });

  it('Assigning a track to a new mood removes it from its previous mood', () => {
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

    act(() => {
      result.current.assignTrackToMood('file-1', 'tense');
    });

    expect(result.current.getMoodForTrack('file-1')).toBe('tense');
    expect(result.current.getMoodForTrack('file-2')).toBeNull();
  });

  it('activateMood with an assigned track calls playAmbient with the first fileId for that mood', () => {
    const { result } = renderHook(() => useMoodPresets());
    const playAmbientMock = vi.fn();

    act(() => {
      result.current.assignTrackToMood('file-abc', 'adventuring');
    });

    act(() => {
      result.current.activateMood('adventuring', playAmbientMock);
    });

    expect(playAmbientMock).toHaveBeenCalledWith('file-abc');
    expect(result.current.activeMood).toBe('adventuring');
  });

  it('activateMood with no tracks assigned does not call playAmbient', () => {
    const { result } = renderHook(() => useMoodPresets());
    const playAmbientMock = vi.fn();

    act(() => {
      result.current.activateMood('scary', playAmbientMock);
    });

    expect(playAmbientMock).not.toHaveBeenCalled();
    expect(result.current.activeMood).toBeNull();
  });

  it('Assignments persist to localStorage under STORAGE_KEYS.moodPresets', () => {
    const { result } = renderHook(() => useMoodPresets());

    act(() => {
      result.current.assignTrackToMood('file-123', 'sweet');
    });

    const storedValue = localStorage.getItem(STORAGE_KEYS.moodPresets);
    expect(storedValue).not.toBeNull();
    const parsed = JSON.parse(storedValue!);
    expect(parsed.sweet).toContain('file-123');
  });

  it('On mount, assignments are loaded from localStorage', () => {
    const saved = {
      sweet: ['file-saved'],
      adventuring: [],
      tense: [],
      scary: [],
      combat: [],
    };
    localStorage.setItem(STORAGE_KEYS.moodPresets, JSON.stringify(saved));

    const { result } = renderHook(() => useMoodPresets());
    expect(result.current.assignments.sweet).toContain('file-saved');
  });
});
