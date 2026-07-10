import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeathSaves } from '../useDeathSaves';
import { useAppState, getSnapshot } from '../useAppState';
import { updateDeathSavesDB, updateCharacterDB } from '../../services/dbOperations';
import { toast } from 'sonner';

vi.mock('../useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn(),
}));

vi.mock('../useCombatOverlayEvents', () => ({
  useDeathEvent: () => ({ fire: vi.fn() }),
  useUnconsciousEvent: () => ({ fire: vi.fn() }),
}));

vi.mock('../../services/dbOperations', () => ({
  updateDeathSavesDB: vi.fn(),
  updateCharacterDB: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

const mockAddCombatEvent = vi.fn();
const mockActiveCombatLog = {
  currentRound: 1,
};

vi.mock('../dashboardStore', () => ({
  useDashboardStore: {
    getState: () => ({
      addCombatEvent: mockAddCombatEvent,
      activeCombatLog: mockActiveCombatLog,
    }),
  },
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
    mockAddCombatEvent.mockClear();
    (useAppState as any).mockReturnValue({
      updateState: mockUpdateState,
      state: mockState
    });
    (getSnapshot as any).mockReturnValue(mockState);
  });

  it('recording a failure increments fail count', async () => {
    const { result } = renderHook(() => useDeathSaves());
    await act(async () => {
      await result.current.recordDeathSave('c1', 'failure');
    });
    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 1, 0);
  });

  it('recording a success increments success count', async () => {
    const { result } = renderHook(() => useDeathSaves());
    await act(async () => {
      await result.current.recordDeathSave('c1', 'success');
    });
    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 0, 1);
  });

  it('3 failures triggers character death', async () => {
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

  it('3 successes triggers character stabilization', async () => {
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

    expect(toast).toHaveBeenCalledWith(expect.stringContaining('is stable'));
  });

  it('does not clear fail and success counts on stabilization', async () => {
    // Under 3 successes, stabilization keeps the counts
    const stableState = {
      ...mockState,
      combatState: {
        combatants: [{ ...mockState.combatState.combatants[0], deathSavesSuccesses: 2, deathSavesFails: 1 }]
      }
    };
    (getSnapshot as any).mockReturnValue(stableState);

    const { result } = renderHook(() => useDeathSaves());
    await act(async () => {
      await result.current.recordDeathSave('c1', 'success');
    });

    // Expecting state to be preserved (deathSavesFails: 1, deathSavesSuccesses: 3)
    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 1, 3);
  });

  it('a natural 20 on a death save triggers stabilization immediately', async () => {
    // Mock character with 1 success, then critical success (adds 2 successes) to reach 3 successes (stabilization)
    const almostStableState = {
      ...mockState,
      combatState: {
        combatants: [{ ...mockState.combatState.combatants[0], deathSavesSuccesses: 1 }]
      }
    };
    (getSnapshot as any).mockReturnValue(almostStableState);

    const { result } = renderHook(() => useDeathSaves());
    await act(async () => {
      await result.current.recordDeathSave('c1', 'success', true);
    });

    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 0, 3);
  });

  it('a natural 1 on a death save counts as 2 failures', async () => {
    const { result } = renderHook(() => useDeathSaves());
    await act(async () => {
      await result.current.recordDeathSave('c1', 'failure', true);
    });

    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 2, 0);
  });

  it('fires a death-save event on manual roll', async () => {
    const { result } = renderHook(() => useDeathSaves());
    await act(async () => {
      await result.current.recordDeathSave('c1', 'success');
    });

    expect(mockAddCombatEvent).toHaveBeenCalledWith(expect.objectContaining({
      type: 'death-save',
      targetId: 'c1',
      targetName: 'Test PC',
      condition: 'success',
      resourceName: 'Death Save Successes',
      resourceBefore: 0,
      resourceAfter: 1,
    }));
  });

  it('fires a death-save failure event on taking damage while unconscious', async () => {
    const { result } = renderHook(() => useDeathSaves());
    await act(async () => {
      await result.current.applyDamageToUnconscious('c1', false);
    });

    expect(mockAddCombatEvent).toHaveBeenCalledWith(expect.objectContaining({
      type: 'death-save',
      targetId: 'c1',
      targetName: 'Test PC',
      condition: 'failure',
      resourceName: 'Death Save Failures',
      resourceBefore: 0,
      resourceAfter: 1,
    }));
  });

  it('fires combatant-defeated when PC reaches 3 failed saves', async () => {
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

    expect(mockAddCombatEvent).toHaveBeenCalledWith(expect.objectContaining({
      type: 'combatant-defeated',
      targetId: 'c1',
      targetName: 'Test PC',
    }));
  });
});
