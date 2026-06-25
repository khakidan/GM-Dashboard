import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTabState } from '../useTabState';
import { STORAGE_KEYS } from '../../lib/constants';

describe('useTabState State Transition and Persistence Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('activeTab state updates in memory', () => {
    const { result } = renderHook(() => useTabState(null));
    expect(result.current.activeTab).toBe('party');

    act(() => {
      result.current.handleTabChange('encounters');
    });

    expect(result.current.activeTab).toBe('encounters');
  });

  it('activeTab state persists in localStorage', () => {
    const { result } = renderHook(() => useTabState(null));

    act(() => {
      result.current.handleTabChange('npc-library');
    });

    expect(localStorage.getItem(STORAGE_KEYS.lastActiveTab)).toBe('npc-library');
  });
});
