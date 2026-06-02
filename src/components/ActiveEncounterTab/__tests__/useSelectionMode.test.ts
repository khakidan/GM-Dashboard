import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useSelectionMode } from '../hooks/useSelectionMode';

describe('useSelectionMode', () => {
  it('Initial state has isSelectionMode: false', () => {
    const { result } = renderHook(() => useSelectionMode());
    expect(result.current.isSelectionMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('enterSelectionMode sets isSelectionMode: true', () => {
    const { result } = renderHook(() => useSelectionMode());
    act(() => {
      result.current.enterSelectionMode();
    });
    expect(result.current.isSelectionMode).toBe(true);
  });

  it('exitSelectionMode clears selection and sets isSelectionMode: false', () => {
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

  it('toggleSelection adds an ID when not selected', () => {
    const { result } = renderHook(() => useSelectionMode());
    act(() => {
      result.current.toggleSelection('id-1');
    });
    expect(result.current.selectedIds.has('id-1')).toBe(true);
  });

  it('toggleSelection removes an ID when selected', () => {
    const { result } = renderHook(() => useSelectionMode());
    act(() => {
      result.current.toggleSelection('id-1');
    });
    expect(result.current.selectedIds.has('id-1')).toBe(true);

    act(() => {
      result.current.toggleSelection('id-1');
    });
    expect(result.current.selectedIds.has('id-1')).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('clearSelection empties the selected set', () => {
    const { result } = renderHook(() => useSelectionMode());
    act(() => {
      result.current.toggleSelection('id-1');
      result.current.toggleSelection('id-2');
    });
    expect(result.current.selectedIds.size).toBe(2);

    act(() => {
      result.current.clearSelection();
    });
    expect(result.current.selectedIds.size).toBe(0);
  });
});
