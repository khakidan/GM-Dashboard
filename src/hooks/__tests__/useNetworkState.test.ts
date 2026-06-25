import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkState } from '../useNetworkState';

describe('useNetworkState Tests', () => {
  it('isOnline updates when browser triggers online/offline events', () => {
    const { result } = renderHook(() => useNetworkState());
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });
});
