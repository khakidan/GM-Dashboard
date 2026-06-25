import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useParty } from '../hooks/useParty';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { updateCharacterDB } from '../../../services/dbOperations';

vi.mock('../../../services/dbOperations', () => ({
  updateCharacterDB: vi.fn(),
}));

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn()
}));

describe('useParty - REST and Recovery', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('handleLongRest resets all resource pools that restore on long rest', async () => {
    const updateStateSpy = vi.fn();
    const mockState = { characters: [{ 
      id: 'char-1', 
      resourcePools: JSON.stringify([{ name: 'Rage', current: 0, max: 3, reset: 'long' }]) 
    }] };

    vi.mocked(useAppState).mockReturnValue({
      state: mockState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue(mockState as any);

    const { result } = renderHook(() => useParty());
    
    await act(async () => {
      await result.current.handleLongRest(['char-1']);
    });

    const stateUpdater = updateStateSpy.mock.calls[0][0];
    const nextState = stateUpdater(mockState);
    const updatedPools = JSON.parse(nextState.characters[0].resourcePools);
    expect(updatedPools[0].current).toBe(3);
  });

  it('handleShortRest resets only pools that restore on short rest', async () => {
    const updateStateSpy = vi.fn();
    const mockState = { characters: [{ 
      id: 'char-1', 
      resourcePools: JSON.stringify([
        { name: 'Ki', current: 0, max: 3, reset: 'short' },
        { name: 'Rage', current: 0, max: 3, reset: 'long' }
      ]) 
    }] };

    vi.mocked(useAppState).mockReturnValue({
      state: mockState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue(mockState as any);

    const { result } = renderHook(() => useParty());
    
    await act(async () => {
      await result.current.handleShortRest([{ characterId: 'char-1', hpToAdd: 0, newHitDiceUsed: '{}' }]);
    });

    const stateUpdater = updateStateSpy.mock.calls[0][0];
    const nextState = stateUpdater(mockState);
    const updatedPools = JSON.parse(nextState.characters[0].resourcePools);
    
    expect(updatedPools[0].current).toBe(3); // Ki reset
    expect(updatedPools[1].current).toBe(0); // Rage not reset
  });

  it('handleLongRest resets hit dice used to empty', async () => {
    const updateStateSpy = vi.fn();
    const mockState = { characters: [{ 
      id: 'char-1', 
      hitDiceConfig: '1d10',
      hitDiceUsed: '{"d10":1}'
    }] };

    vi.mocked(useAppState).mockReturnValue({
      state: mockState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue(mockState as any);

    const { result } = renderHook(() => useParty());
    
    await act(async () => {
      await result.current.handleLongRest(['char-1']);
    });

    const stateUpdater = updateStateSpy.mock.calls[0][0];
    const nextState = stateUpdater(mockState);
    expect(nextState.characters[0].hitDiceUsed).toBe('{"d10":0}');
  });
});
