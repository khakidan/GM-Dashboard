import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeathSaves } from '../useDeathSaves';
import { useAppState, getSnapshot } from '../useAppState';
import { updateDeathSavesDB, updateCharacterDB } from '../../services/dbOperations';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('../useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn(),
}));

vi.mock('../useOverlayEvents', () => ({
  useDeathEvent: () => ({ fire: vi.fn() }),
  useUnconsciousEvent: () => ({ fire: vi.fn() }),
}));

vi.mock('../../services/dbOperations', () => ({
  updateDeathSavesDB: vi.fn(),
  updateCharacterDB: vi.fn(),
}));

vi.mock('../../lib/audioEngine', () => ({
  playDeathSaveFailSound: vi.fn(),
  playDeathSaveSuccessSound: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

describe('useDeathSaves', () => {
  const mockUpdateState = vi.fn();
  const mockState = {
    characters: [
      { id: 'char1', characterName: 'Test PC', deathSavesFails: 0, deathSavesSuccesses: 0, isActive: true, conditions: 'Unconscious' }
    ],
    combatState: {
      combatants: [
        { id: 'c1', name: 'Test PC', type: 'pc', characterId: 'char1', deathSavesFails: 0, deathSavesSuccesses: 0, conditions: 'Unconscious' }
      ]
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppState as any).mockReturnValue({
      updateState: mockUpdateState,
      state: mockState
    });
    (getSnapshot as any).mockReturnValue(mockState);
  });

  it('records a successful death save', async () => {
    const { result } = renderHook(() => useDeathSaves());
    
    await act(async () => {
      await result.current.recordDeathSave('c1', 'success');
    });

    expect(mockUpdateState).toHaveBeenCalled();
    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 0, 1);
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('Death save recorded'));
  });

  it('records a failed death save', async () => {
    const { result } = renderHook(() => useDeathSaves());
    
    await act(async () => {
      await result.current.recordDeathSave('c1', 'failure');
    });

    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 1, 0);
  });

  it('handles critical success (2 successes)', async () => {
    const { result } = renderHook(() => useDeathSaves());
    
    await act(async () => {
      await result.current.recordDeathSave('c1', 'success', true);
    });

    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 0, 2);
  });

  it('applies damage to unconscious PC as a failed death save', async () => {
    const { result } = renderHook(() => useDeathSaves());
    
    await act(async () => {
      await result.current.applyDamageToUnconscious('c1');
    });

    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 1, 0);
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('death save failed automatically'));
  });

  it('detects when PC becomes stable (3 successes)', async () => {
    const stableState = {
      ...mockState,
      combatState: {
        combatants: [{ ...mockState.combatState.combatants[0], deathSavesSuccesses: 2 }]
      }
    };
    (getSnapshot as any).mockReturnValue(stableState);

    const { result } = renderHook(() => useDeathSaves());
    
    await act(async () => {
      await result.current.recordDeathSave('c1', 'success');
    });

    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 0, 3);
    // The checkDeathSaveOutcome logic happens after updateDeathSavesDB
    // It should eventually call updateDeathSavesDB(..., 0, 0) to clear them
    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 0, 0);
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('is stable'));
  });

  it('detects when PC dies (3 failures)', async () => {
    const dyingState = {
      ...mockState,
      combatState: {
        combatants: [{ ...mockState.combatState.combatants[0], deathSavesFails: 2 }]
      }
    };
    (getSnapshot as any).mockReturnValue(dyingState);

    const { result } = renderHook(() => useDeathSaves());
    
    await act(async () => {
      await result.current.recordDeathSave('c1', 'failure');
    });

    expect(updateCharacterDB).toHaveBeenCalledWith(
      expect.objectContaining({ statusId: 3 }),
      expect.anything()
    );
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('has died'));
  });

  it('When recordDeathSave records the third failure, characters statusId updates to 3 (Deceased) and isActive to false in state', async () => {
    const dyingState = {
      ...mockState,
      combatState: {
        combatants: [{ ...mockState.combatState.combatants[0], deathSavesFails: 2 }]
      }
    };
    (getSnapshot as any).mockReturnValue(dyingState);

    const { result } = renderHook(() => useDeathSaves());
    
    await act(async () => {
      await result.current.recordDeathSave('c1', 'failure');
    });

    expect(mockUpdateState).toHaveBeenCalled();
    const updater = mockUpdateState.mock.calls.find(call => {
      const fn = call[0];
      if (typeof fn !== 'function') return false;
      const res = fn(mockState);
      const updatedChar = res.characters.find((c: any) => c.id === 'char1');
      return updatedChar && updatedChar.statusId === 3;
    })?.[0];

    expect(updater).toBeDefined();
    const resultState = updater(mockState);
    const deadChar = resultState.characters.find((c: any) => c.id === 'char1');
    expect(deadChar.statusId).toBe(3);
    expect(deadChar.isActive).toBe(false);
    expect(deadChar.deathSavesFails).toBe(3);
  });

  it('returns a reminder for unconscious PCs needing saves', () => {
    const { result } = renderHook(() => useDeathSaves());
    
    const reminder = result.current.getDeathSaveReminder(mockState.combatState.combatants[0] as any);
    expect(reminder).not.toBeNull();
    expect(reminder?.name).toBe('Test PC');
  });

  it('does not return a reminder for already stable PCs', () => {
    const { result } = renderHook(() => useDeathSaves());
    const stablePc = { ...mockState.combatState.combatants[0], isStable: true };
    
    const reminder = result.current.getDeathSaveReminder(stablePc as any);
    expect(reminder).toBeNull();
  });
});
