// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

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

  it('updateCombatant cleans up conditionTimers for removed conditions', () => {
    const { result } = renderHook(() => useCombatSync());
    
    // First setup the combatant with conditions and timers
    act(() => {
      result.current.updateCombatant('c1', { 
        conditions: 'poisoned,prone', 
        conditionTimers: { 'poisoned': 1, 'prone': 2 } 
      });
    });

    let state = getSnapshot();
    let c1 = state.combatState.combatants.find((c) => c.id === 'c1');
    expect(c1?.conditionTimers).toEqual({ 'poisoned': 1, 'prone': 2 });

    // Now update without 'poisoned'
    act(() => {
      result.current.updateCombatant('c1', { 
        conditions: 'prone' 
      });
    });

    state = getSnapshot();
    c1 = state.combatState.combatants.find((c) => c.id === 'c1');
    expect(c1?.conditionTimers).toEqual({ 'prone': 2 });
  });

  it('updateCombatant preserves existing timers when conditions string is unchanged', () => {
    const { result } = renderHook(() => useCombatSync());
    
    act(() => {
      result.current.updateCombatant('c1', { 
        conditions: 'poisoned,prone', 
        conditionTimers: { 'poisoned': 1, 'prone': 2 } 
      });
    });

    let state = getSnapshot();
    let c1 = state.combatState.combatants.find((c) => c.id === 'c1');
    expect(c1?.conditionTimers).toEqual({ 'poisoned': 1, 'prone': 2 });

    // Ensure they are preserved when just changing other state
    act(() => {
      result.current.updateCombatant('c1', { 
        currentHp: 10,
        conditions: 'poisoned,prone', 
      });
    });

    state = getSnapshot();
    c1 = state.combatState.combatants.find((c) => c.id === 'c1');
    expect(c1?.currentHp).toBe(10);
    expect(c1?.conditionTimers).toEqual({ 'poisoned': 1, 'prone': 2 });
  });

  it('updateCombatant on NPC combatant updates only combatants and encounterCombatants and does NOT touch state.npcs', () => {
    act(() => {
      const prev = getSnapshot();
      setGlobalState({
        ...prev,
        npcs: [
          { id: 'npc-abc', name: 'Goblin Template', ac: 15, maxHp: 30, currentHp: 30 }
        ] as any,
        encounterCombatants: [
          { id: 'ec-abc', npcId: 'npc-abc', npcCurrentHp: 30, npcTempHp: 0 }
        ] as any,
        combatState: {
          ...prev.combatState,
          combatants: [
            { id: 'c-abc', name: 'Goblin Instance 1', type: 'npc', ac: 15, maxHp: 30, currentHp: 30, encounterCombatantId: 'ec-abc' } as any
          ]
        }
      });
    });

    const { result } = renderHook(() => useCombatSync());

    act(() => {
      result.current.updateCombatant('c-abc', { currentHp: 18, tempHp: 5 });
    });

    const finalState = getSnapshot();

    // Check that combatants are updated correctly
    const updatedCombatant = finalState.combatState.combatants.find(c => c.id === 'c-abc');
    expect(updatedCombatant?.currentHp).toBe(18);
    expect(updatedCombatant?.tempHp).toBe(5);

    // Check that encounterCombatants are updated correctly (independent NPC state)
    const updatedEC = finalState.encounterCombatants.find(ec => ec.id === 'ec-abc');
    expect(updatedEC?.npcCurrentHp).toBe(18);
    expect(updatedEC?.npcTempHp).toBe(5);

    // Assert that the global NPC template remains completely untouched
    const templateNPC = finalState.npcs.find(n => n.id === 'npc-abc');
    expect(templateNPC?.currentHp).toBe(30); // Unaltered template!
  });
});

