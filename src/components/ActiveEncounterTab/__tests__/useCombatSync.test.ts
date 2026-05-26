import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCombatSync } from '../hooks/useCombatSync';
import { _testHooks, getSnapshot, setGlobalState } from '../../../hooks/useAppState';

vi.mock('../../../services/dbOperations');
vi.mock('../../../services/writeQueue');
vi.mock('../../../services/sheetsService');

describe('useCombatSync', () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    _testHooks.resetState();
    act(() => {
      const prev = getSnapshot();
      setGlobalState({
        ...prev,
        combatState: {
          ...prev.combatState,
          activeTurnId: 'c2',
          combatants: [
            { id: 'c1', name: 'Goblin', type: 'npc', ac: 15, maxHp: 30, currentHp: 30, initiative: 10, notes: '', passivePerception: 10, encounterCombatantId: '1' },
            { id: 'c2', name: 'Orc', type: 'npc', ac: 16, maxHp: 45, currentHp: 45, initiative: 15, notes: '', passivePerception: 10, encounterCombatantId: '2' },
          ],
        },
      });
    });
  });

  it('updateCombatant updates the combatant in state', () => {
    const { result } = renderHook(() => useCombatSync());

    act(() => {
      result.current.updateCombatant('c1', { currentHp: 20 });
    });

    const state = getSnapshot();
    const c1 = state.combatState.combatants.find((c) => c.id === 'c1');
    expect(c1?.currentHp).toBe(20);
  });

  it('updateCombatant re-sorts combatants by initiative when initiative changes', () => {
    const { result } = renderHook(() => useCombatSync());

    act(() => {
      // Provide an initiative higher than c2 (15)
      result.current.updateCombatant('c1', { initiative: 20 });
    });

    const state = getSnapshot();
    // They should be sorted descending
    expect(state.combatState.combatants[0].id).toBe('c1');
    expect(state.combatState.combatants[1].id).toBe('c2');
  });

  it('removeCombatant removes the target combatant from state', async () => {
    const { result } = renderHook(() => useCombatSync());

    await act(async () => {
      await result.current.removeCombatant('c1');
    });

    const state = getSnapshot();
    expect(state.combatState.combatants).toHaveLength(1);
    expect(state.combatState.combatants[0].id).toBe('c2');
  });

  it('removeCombatant sets activeTurnId to null if the removed combatant was the active turn', async () => {
    const { result } = renderHook(() => useCombatSync());
    // Current activeTurnId is 'c2'
    
    await act(async () => {
      await result.current.removeCombatant('c2');
    });

    const state = getSnapshot();
    expect(state.combatState.combatants).toHaveLength(1);
    expect(state.combatState.activeTurnId).toBeNull();
  });
});
