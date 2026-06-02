import { renderHook, act } from '@testing-library/react';
import { useOverlayEvent } from '../useOverlayEvent';
import { useAppState } from '../useAppState';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OVERLAY_DURATIONS, OVERLAY_CLEAR_BUFFER_MS } from '../../lib/constants';

// Mock useAppState
vi.mock('../useAppState', () => ({
  useAppState: vi.fn(),
}));

describe('useOverlayEvent', () => {
  const mockUpdateState = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    (useAppState as any).mockReturnValue({
      updateState: mockUpdateState,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fire() sets the correct eventKey in combatState with the provided payload', () => {
    const { result } = renderHook(() => 
      useOverlayEvent<{ characterName: string }>('deathEvent', 1000, null)
    );

    act(() => {
      result.current.fire({ characterName: 'Boromir' });
    });

    expect(mockUpdateState).toHaveBeenCalled();
    const updater = mockUpdateState.mock.calls[0][0];
    const prevState = { combatState: { deathEvent: null } };
    const newState = updater(prevState);
    expect(newState.combatState.deathEvent).toEqual({ characterName: 'Boromir' });
  });

  it('after fire(), a timeout is scheduled with the correct duration', () => {
    const durationMs = 1000;
    const { result } = renderHook(() => 
      useOverlayEvent<{ characterName: string }>('deathEvent', durationMs, null)
    );

    const spy = vi.spyOn(window, 'setTimeout');

    act(() => {
      result.current.fire({ characterName: 'Boromir' });
    });

    expect(spy).toHaveBeenCalledWith(expect.any(Function), durationMs + OVERLAY_CLEAR_BUFFER_MS);
  });

  it('when the timeout fires, the eventKey is set to clearValue', () => {
    const durationMs = 1000;
    const { result } = renderHook(() => 
      useOverlayEvent<{ characterName: string }>('deathEvent', durationMs, null)
    );

    act(() => {
      result.current.fire({ characterName: 'Boromir' });
    });

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(durationMs + OVERLAY_CLEAR_BUFFER_MS);
    });

    // Should have called updateState twice: once to fire, once to clear
    expect(mockUpdateState).toHaveBeenCalledTimes(2);
    const clearUpdater = mockUpdateState.mock.calls[1][0];
    const prevState = { combatState: { deathEvent: { characterName: 'Boromir' } } };
    const newState = clearUpdater(prevState);
    expect(newState.combatState.deathEvent).toBeNull();
  });

  it('clear() immediately sets the eventKey to clearValue without waiting for timeout', () => {
    const { result } = renderHook(() => 
      useOverlayEvent<{ characterName: string }>('deathEvent', 1000, null)
    );

    act(() => {
      result.current.clear();
    });

    expect(mockUpdateState).toHaveBeenCalledTimes(1);
    const clearUpdater = mockUpdateState.mock.calls[0][0];
    const prevState = { combatState: { deathEvent: { characterName: 'Boromir' } } };
    const newState = clearUpdater(prevState);
    expect(newState.combatState.deathEvent).toBeNull();
  });

  it('calling fire() twice before timeout fires handles multiple calls', () => {
    const durationMs = 1000;
    const { result } = renderHook(() => 
      useOverlayEvent<{ characterName: string }>('deathEvent', durationMs, null)
    );

    act(() => {
      result.current.fire({ characterName: 'A' });
    });
    
    act(() => {
      result.current.fire({ characterName: 'B' });
    });

    // First call updateState, second call updateState
    expect(mockUpdateState).toHaveBeenCalledTimes(2);
    
    const lastFireUpdater = mockUpdateState.mock.calls[1][0];
    const prevState = { combatState: { deathEvent: { characterName: 'A' } } };
    const newState = lastFireUpdater(prevState);
    expect(newState.combatState.deathEvent).toEqual({ characterName: 'B' });
  });

  it('initiativeEvent clears to false', () => {
    const { result } = renderHook(() => 
      useOverlayEvent<true, false>('initiativeEvent', 1000, false)
    );

    act(() => {
      result.current.fire(true);
    });

    act(() => {
      vi.advanceTimersByTime(1000 + OVERLAY_CLEAR_BUFFER_MS);
    });

    const clearUpdater = mockUpdateState.mock.calls[1][0];
    const prevState = { combatState: { initiativeEvent: true } };
    const newState = clearUpdater(prevState);
    expect(newState.combatState.initiativeEvent).toBe(false);
  });
});
