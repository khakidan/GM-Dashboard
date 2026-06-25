import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useCombatantCard } from '../hooks/useCombatantCard';
import { useDashboardStore } from '../../../hooks/useAppState';

describe('useCombatantCard Hook', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
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

  it('expanding a card adds its id to expandedIds in the store', () => {
    const { result } = renderHook(() => useCombatantCard('c1'));

    expect(result.current.isExpanded).toBe(false);

    act(() => {
      result.current.toggleExpand();
    });

    expect(result.current.isExpanded).toBe(true);
    expect(useDashboardStore.getState().combatState.expandedIds).toContain('c1');
  });

  it('collapsing a card removes its id from expandedIds', () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          expandedIds: ['c1']
        }
      }));
    });

    const { result } = renderHook(() => useCombatantCard('c1'));

    expect(result.current.isExpanded).toBe(true);

    act(() => {
      result.current.toggleExpand();
    });

    expect(result.current.isExpanded).toBe(false);
    expect(useDashboardStore.getState().combatState.expandedIds).not.toContain('c1');
  });

  it('toggling selection adds/removes id from selectedIds', () => {
    const { result } = renderHook(() => useCombatantCard('c1'));

    expect(result.current.isSelected).toBe(false);

    act(() => {
      result.current.toggleSelection();
    });

    expect(result.current.isSelected).toBe(true);
    expect(useDashboardStore.getState().combatState.selectedIds).toContain('c1');

    act(() => {
      result.current.toggleSelection();
    });

    expect(result.current.isSelected).toBe(false);
    expect(useDashboardStore.getState().combatState.selectedIds).not.toContain('c1');
  });
});
