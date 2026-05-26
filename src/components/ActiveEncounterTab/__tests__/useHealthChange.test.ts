import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useHealthChange } from '../hooks/useHealthChange';
import type { Combatant } from '../../../types';

describe('useHealthChange', () => {
  afterEach(() => cleanup());
  const syncingIds = new Set<string>();

  const baseCombatant: Combatant = {
    id: 'c1',
    name: 'Goblin',
    type: 'npc',
    ac: 15,
    maxHp: 30,
    currentHp: 30,
    tempHp: 5,
    initiative: 10,
    notes: '',
    passivePerception: 10,
  };

  it('handleHealthChange with isDamage true reduces currentHp correctly', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setHealthInputs({ c1: '10' });
    });

    act(() => {
      // 10 damage: 5 is absorbed by tempHp, 5 by currentHp. So temp=0, hp=25
      result.current.handleHealthChange('c1', baseCombatant, true);
    });

    expect(updateSpy).toHaveBeenCalledWith('c1', { currentHp: 25, tempHp: 0 });
  });

  it('handleHealthChange with isDamage false increases currentHp correctly', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    const woundedCombatant = { ...baseCombatant, currentHp: 10, tempHp: 0 };

    act(() => {
      result.current.setHealthInputs({ c1: '15' });
    });

    act(() => {
      result.current.handleHealthChange('c1', woundedCombatant, false);
    });

    // 10 + 15 = 25
    expect(updateSpy).toHaveBeenCalledWith('c1', { currentHp: 25, tempHp: 0 });
  });

  it('handleHealthChange absorbs damage into tempHp before currentHp', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setHealthInputs({ c1: '3' });
    });

    act(() => {
      // 3 damage, tempHp is 5. So temp=2, hp=30
      result.current.handleHealthChange('c1', baseCombatant, true);
    });

    expect(updateSpy).toHaveBeenCalledWith('c1', { currentHp: 30, tempHp: 2 });
  });

  it('handleHealthChange clears the health input for that combatant id after applying the change', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setHealthInputs({ c1: '5', c2: '10' });
    });

    act(() => {
      result.current.handleHealthChange('c1', baseCombatant, true);
    });

    expect(result.current.healthInputs['c1']).toBe('');
    expect(result.current.healthInputs['c2']).toBe('10');
  });

  it('handleHealthChange is a no-op when the input value is empty', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setHealthInputs({ c1: '' });
    });

    act(() => {
      result.current.handleHealthChange('c1', baseCombatant, true);
    });

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('handleHealthChange is a no-op when the input value is not a number', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setHealthInputs({ c1: 'abc' });
    });

    act(() => {
      result.current.handleHealthChange('c1', baseCombatant, true);
    });

    expect(updateSpy).not.toHaveBeenCalled();
  });
});
