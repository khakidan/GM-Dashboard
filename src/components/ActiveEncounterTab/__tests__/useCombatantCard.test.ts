import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useCombatantCard } from '../hooks/useCombatantCard';
import { useDashboardStore } from '../../../hooks/useAppState';

describe('useCombatantCard Hook', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useDashboardStore.setState({
        combatState: {
          activeEncounterId: null,
          activeTurnId: null,
          round: 1,
          combatants: [],
          concentrationLinks: {},
          selectedIds: [],
          isSelectionMode: false,
          syncingIds: [],
          expandedIds: [],
        },
      });
    });
  });

  it('isActiveTurn should be true when combatantId matches activeTurnId, false otherwise', () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          activeTurnId: 'combatant-1',
        },
      }));
    });

    const { result: r1 } = renderHook(() => useCombatantCard('combatant-1'));
    expect(r1.current.isActiveTurn).toBe(true);

    const { result: r2 } = renderHook(() => useCombatantCard('combatant-2'));
    expect(r2.current.isActiveTurn).toBe(false);
  });

  it('isSelected should be true when combatantId is in the selected set, false otherwise', () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          selectedIds: ['combatant-1', 'combatant-3'],
        },
      }));
    });

    const { result: r1 } = renderHook(() => useCombatantCard('combatant-1'));
    expect(r1.current.isSelected).toBe(true);

    const { result: r2 } = renderHook(() => useCombatantCard('combatant-2'));
    expect(r2.current.isSelected).toBe(false);

    const { result: r3 } = renderHook(() => useCombatantCard('combatant-3'));
    expect(r3.current.isSelected).toBe(true);
  });

  it('concentrationLinks should be correctly filtered for the given combatantId', () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          concentrationLinks: {
            'combatant-1': ['Maeve', 'Ylva'],
            'combatant-2': [],
          },
        },
      }));
    });

    const { result: r1 } = renderHook(() => useCombatantCard('combatant-1'));
    expect(r1.current.concentrationLinks).toEqual(['Maeve', 'Ylva']);

    const { result: r2 } = renderHook(() => useCombatantCard('combatant-2'));
    expect(r2.current.concentrationLinks).toEqual([]);

    const { result: r3 } = renderHook(() => useCombatantCard('combatant-3'));
    expect(r3.current.concentrationLinks).toEqual([]);
  });
});
