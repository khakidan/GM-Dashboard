import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useHealthChange } from '../hooks/useHealthChange';
import type { Combatant } from '../../../types';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

const mockUpdateState = vi.fn();
const mockAppState = {
  combatState: {
    combatants: [] as any[],
  },
};

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: () => ({
    state: {
      characters: [],
      npcs: [],
    },
    updateState: mockUpdateState,
  }),
  getSnapshot: () => mockAppState,
}));

const mockFireConcentrationAlert = vi.fn();
vi.mock('../../../lib/concentrationCheck', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/concentrationCheck')>();
  return {
    ...actual,
    fireConcentrationAlert: (...args: any[]) => mockFireConcentrationAlert(...args),
  };
});

vi.mock('../../../hooks/useCombatOverlayEvents', () => ({
  useDamageEvent: () => ({ fire: vi.fn() }),
  useHealEvent: () => ({ fire: vi.fn() }),
  useUnconsciousEvent: () => ({ fire: vi.fn() }),
  useDeathEvent: () => ({ fire: vi.fn() }),
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
    type: 'pc',
    ac: 15,
    maxHp: 30,
    currentHp: 30,
    tempHp: 5,
    initiative: 10,
    notes: '',
    passivePerception: 10,
    conditions: '',
  };

  it('applying damage reduces currentHp by the correct amount', async () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setDamageInputs({ c1: '10' });
    });

    await act(async () => {
      // 10 damage: 5 is absorbed by tempHp, remaining 5 reduces currentHp to 25
      await result.current.handleHealthChange('c1', baseCombatant, true);
    });

    expect(updateSpy).toHaveBeenCalledWith('c1', { currentHp: 25, tempHp: 0 });
  });

  it('applying damage respects resistance and halves the value', async () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    const resistantCombatant = { ...baseCombatant, resistances: 'fire', tempHp: 0 };

    act(() => {
      result.current.setDamageInputs({ c1: '10' });
    });

    await act(async () => {
      await result.current.handleHealthChange('c1', resistantCombatant, true, 'fire');
    });

    // 10 damage halved = 5 damage. 30 - 5 = 25
    expect(updateSpy).toHaveBeenCalledWith('c1', { currentHp: 25, tempHp: 0 });
  });

  it('applying damage respects immunity and reduces damage to zero', async () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    const immuneCombatant = { ...baseCombatant, immunities: 'fire', tempHp: 0 };

    act(() => {
      result.current.setDamageInputs({ c1: '10' });
    });

    await act(async () => {
      await result.current.handleHealthChange('c1', immuneCombatant, true, 'fire');
    });

    // 10 damage immune = 0 damage. 30 - 0 = 30
    expect(updateSpy).toHaveBeenCalledWith('c1', { currentHp: 30, tempHp: 0 });
  });

  it('applying damage respects vulnerability and doubles the value', async () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    const vulnerableCombatant = { ...baseCombatant, vulnerabilities: 'fire', tempHp: 0 };

    act(() => {
      result.current.setDamageInputs({ c1: '10' });
    });

    await act(async () => {
      await result.current.handleHealthChange('c1', vulnerableCombatant, true, 'fire');
    });

    // 10 damage doubled = 20 damage. 30 - 20 = 10
    expect(updateSpy).toHaveBeenCalledWith('c1', { currentHp: 10, tempHp: 0 });
  });

  it('healing cannot exceed maxHp', async () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    const woundedCombatant = { ...baseCombatant, currentHp: 25, tempHp: 0 };

    act(() => {
      result.current.setHealInputs({ c1: '10' });
    });

    await act(async () => {
      await result.current.handleHealthChange('c1', woundedCombatant, false);
    });

    // Cannot exceed max HP (30)
    expect(updateSpy).toHaveBeenCalledWith('c1', { currentHp: 30, tempHp: 0 });
  });

  it('damage that reduces HP to 0 or below sets currentHp to 0, not negative', async () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setDamageInputs({ c1: '50' });
    });

    await act(async () => {
      await result.current.handleHealthChange('c1', baseCombatant, true);
    });

    expect(updateSpy).toHaveBeenCalledWith('c1', expect.objectContaining({ currentHp: 0 }));
  });

  it('damage to a concentrating combatant fires a concentration alert', async () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    const concentratingCombatant = { ...baseCombatant, conditions: 'concentrating' };

    act(() => {
      result.current.setDamageInputs({ c1: '10' });
    });

    await act(async () => {
      await result.current.handleHealthChange('c1', concentratingCombatant, true);
    });

    expect(mockFireConcentrationAlert).toHaveBeenCalledWith(expect.any(String), 10);
  });

  it('damage to a non-concentrating combatant does not fire a concentration alert', async () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setDamageInputs({ c1: '10' });
    });

    await act(async () => {
      await result.current.handleHealthChange('c1', baseCombatant, true);
    });

    expect(mockFireConcentrationAlert).not.toHaveBeenCalled();
  });
});
