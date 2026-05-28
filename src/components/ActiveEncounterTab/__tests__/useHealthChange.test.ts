import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useHealthChange } from '../hooks/useHealthChange';
import type { Combatant } from '../../../types';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

describe('useHealthChange', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
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
    conditions: '',
  };

  it('handleHealthChange with isDamage true reduces currentHp correctly', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setDamageInputs({ c1: '10' });
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
      result.current.setHealInputs({ c1: '15' });
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
      result.current.setDamageInputs({ c1: '3' });
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
      result.current.setDamageInputs({ c1: '5', c2: '10' });
    });

    act(() => {
      result.current.handleHealthChange('c1', baseCombatant, true);
    });

    expect(result.current.damageInputs['c1']).toBe('');
    expect(result.current.damageInputs['c2']).toBe('10');
  });

  it('handleHealthChange is a no-op when the input value is empty', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setDamageInputs({ c1: '' });
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
      result.current.setDamageInputs({ c1: 'abc' });
    });

    act(() => {
      result.current.handleHealthChange('c1', baseCombatant, true);
    });

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('does not fire concentration toast when non-concentrating take damage', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    act(() => {
      result.current.setDamageInputs({ c1: '5' });
    });
    act(() => {
      result.current.handleHealthChange('c1', baseCombatant, true);
    });
    expect(toast).not.toHaveBeenCalled();
  });

  it('does not fire concentration toast when damage is 0 (immune)', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    const concCombatant = { ...baseCombatant, conditions: 'concentrating' };
    
    act(() => {
      result.current.setDamageInputs({ c1: '0' });
    });
    act(() => {
      result.current.handleHealthChange('c1', concCombatant, true);
    });
    expect(toast).not.toHaveBeenCalled();
  });

  it('fires concentration toast with correct DC when damage > 0', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    const concCombatant = { ...baseCombatant, conditions: 'concentrating, hasted' };
    
    act(() => {
      result.current.setDamageInputs({ c1: '12' });
    });
    act(() => {
      result.current.handleHealthChange('c1', concCombatant, true);
    });
    expect(toast).toHaveBeenCalledWith('Concentration check required', expect.objectContaining({
      description: expect.stringContaining('CON save DC: 10')
    }));
  });

  it('clears concentration and its timers when the toast action is triggered', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    const concCombatant: Combatant = {
      ...baseCombatant,
      conditions: 'blinded, concentrating, blessed',
      conditionTimers: { 'blinded': 5, 'blessed': 10, 'concentrating': 10 }
    };

    act(() => {
      result.current.setDamageInputs({ c1: '20' });
    });

    act(() => {
      result.current.handleHealthChange('c1', concCombatant, true);
    });

    // Get the toast call
    const lastToastCall = vi.mocked(toast).mock.calls[0];
    const options = lastToastCall[1] as any;
    const onFailedSave = options.action.onClick;

    // Trigger the failing save action
    act(() => {
      onFailedSave();
    });

    // Check updateCombatant call
    // 'blessed' and 'concentrating' are concentration effects, so they should be removed.
    // 'blinded' should stay.
    expect(updateSpy).toHaveBeenCalledWith('c1', expect.objectContaining({
      conditions: 'blinded',
      conditionTimers: { 'blinded': 5 }
    }));
  });
});
