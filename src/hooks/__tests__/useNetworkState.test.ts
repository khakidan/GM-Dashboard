import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNetworkState } from '../useNetworkState';

describe('useNetworkState', () => {
  it('should return initial online state', () => {
    const { result } = renderHook(() => useNetworkState());
    expect(result.current).toBe(true);
  });
});
