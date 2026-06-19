import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTabState } from '../useTabState';

describe('useTabState', () => {
  it('should initialize with party tab', () => {
    const { result } = renderHook(() => useTabState(null));
    expect(result.current.activeTab).toBe('party');
  });

  it('should update tab on handleTabChange', () => {
    const { result } = renderHook(() => useTabState(null));
    act(() => {
      result.current.handleTabChange('encounters');
    });
    expect(result.current.activeTab).toBe('encounters');
  });
});
