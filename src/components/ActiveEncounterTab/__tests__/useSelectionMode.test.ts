import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useSelectionMode } from '../hooks/useSelectionMode';
import { useDashboardStore } from '../../../hooks/useAppState';

describe('useSelectionMode', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    useDashboardStore.setState({
      combatState: {
        activeEncounterId: null,
        activeTurnId: null,
        round: 1,
        combatants: [],
        concentrationLinks: {},
        deathEvent: null,
        damageEvent: null,
        healEvent: null,
        rageEvent: null,
        unconsciousEvent: null,
        initiativeEvent: false,
        selectedIds: [],
        isSelectionMode: false,
        syncingIds: [],
        expandedIds: [],
      }
    });
  });

  it('entering selection mode sets isSelectionMode to true', () => {
    const { result } = renderHook(() => useSelectionMode());
    act(() => {
      result.current.enterSelectionMode();
    });
    expect(result.current.isSelectionMode).toBe(true);
  });

  it('exiting selection mode clears selectedIds and sets isSelectionMode to false', () => {
    const { result } = renderHook(() => useSelectionMode());
    act(() => {
      result.current.enterSelectionMode();
      result.current.toggleSelection('id-1');
    });
    expect(result.current.isSelectionMode).toBe(true);
    expect(result.current.selectedIds.has('id-1')).toBe(true);

    act(() => {
      result.current.exitSelectionMode();
    });
    expect(result.current.isSelectionMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('selecting all combatants populates selectedIds with every combatant id', () => {
    const { result } = renderHook(() => useSelectionMode());
    act(() => {
      result.current.selectAll(['id-1', 'id-2']);
    });
    expect(result.current.selectedIds.has('id-1')).toBe(true);
    expect(result.current.selectedIds.has('id-2')).toBe(true);
    expect(result.current.selectedIds.size).toBe(2);
  });
});
