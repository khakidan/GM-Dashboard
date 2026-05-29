// src/hooks/__tests__/useAppState.test.ts

// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { AppState, CombatState } from '../../types';
import { getSnapshot, setGlobalState, _testHooks, initialCharacters, initialEncounters, initialNPCs, initialEncounterCombatants, useAppState } from '../useAppState';

const STORAGE_KEY = 'dnd-app-state';

describe('useAppState module', () => {
  beforeEach(() => {
    localStorage.clear();
    _testHooks.resetState();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with default state when storage is empty', () => {
    const state = getSnapshot();
    expect(state.characters).toEqual(initialCharacters);
    expect(state.combatState.round).toBe(1);
    expect(state.combatState.activeTurnId).toBeNull();
  });

  it('persists the new state to storage', () => {
    const defaultState = getSnapshot();
    const newState = { ...defaultState, campaignName: 'Icewind Dale' };
    
    setGlobalState(newState);
    
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.campaignName).toBe('Icewind Dale');
    expect(getSnapshot().campaignName).toBe('Icewind Dale');
  });

  it('notifies all subscribed listeners', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const listeners = _testHooks.getListeners();
    listeners.add(cb1);
    listeners.add(cb2);
    
    setGlobalState(getSnapshot());
    
    expect(cb1).toHaveBeenCalledOnce();
    expect(cb2).toHaveBeenCalledOnce();
  });

  it('handles corrupt storage gracefully', () => {
    // If local storage throws or has bad data, it shouldn't crash
    localStorage.setItem(STORAGE_KEY, 'invalid json');
    
    // We would need to reload the module to truly test constructor-time hydration,
    // but we can test that saving doesn't throw if we override setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => setGlobalState(getSnapshot())).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith("Failed to save state to localStorage (possibly image is too large)", expect.any(Error));
  });

  describe('combat state updates (state logic verification)', () => {
    it('adds a combatant to the list immutably', () => {
      const prev = getSnapshot();
      const newCombatant: any = {
        id: 'combat-npc-1', name: 'Goblin', type: 'npc',
        initiative: 12, ac: 13, maxHp: 10, currentHp: 10,
        passivePerception: 9,
      };

      setGlobalState({
        ...prev,
        combatState: {
          ...prev.combatState,
          combatants: [...prev.combatState.combatants, newCombatant],
        },
      });

      expect(getSnapshot().combatState.combatants).toHaveLength(1);
      expect(getSnapshot().combatState.combatants[0].name).toBe('Goblin');
    });

    it('resets activeTurnId and round on resetCombat', () => {
      const defaultState = getSnapshot();
      setGlobalState({
        ...defaultState,
        combatState: {
          activeEncounterId: 'enc-1',
          combatants: [{ id: 'c1' } as any],
          activeTurnId: 'c1',
          round: 5,
        },
      });

      const prev = getSnapshot();
      setGlobalState({
        ...prev,
        combatState: {
          ...prev.combatState,
          activeTurnId: null,
          round: 1,
          combatants: prev.combatState.combatants.map(c => ({ ...c, initiative: 0 })),
        },
      });

      const after = getSnapshot();
      expect(after.combatState.round).toBe(1);
      expect(after.combatState.activeTurnId).toBeNull();
      expect(after.combatState.combatants[0].initiative).toBe(0);
    });
  });

  describe('useAppState hook testing', () => {
    it('returns state and updateState from the hook', () => {
      const { result } = renderHook(() => useAppState());
      expect(result.current.state.campaignName).toBe('GM Encounter Dashboard');
      expect(typeof result.current.updateState).toBe('function');
    });

    it('updateState allows partial updates and triggers a re-render with new state', () => {
      const { result } = renderHook(() => useAppState());
      
      act(() => {
        result.current.updateState({ campaignName: 'Eberron Campaign' });
      });

      expect(result.current.state.campaignName).toBe('Eberron Campaign');
      expect(getSnapshot().campaignName).toBe('Eberron Campaign');
    });

    it('updateState accepts functional updates', () => {
      const { result } = renderHook(() => useAppState());
      
      act(() => {
        result.current.updateState((prev) => ({
          combatState: {
            ...prev.combatState,
            round: prev.combatState.round + 1,
          }
        }));
      });

      expect(result.current.state.combatState.round).toBe(2);
    });

    it('integrates with external state changes (pub/sub)', () => {
      const { result } = renderHook(() => useAppState());
      
      const nextState = { ...getSnapshot(), campaignName: 'External Update' };
      
      act(() => {
        setGlobalState(nextState);
      });

      expect(result.current.state.campaignName).toBe('External Update');
    });

    it('unsubscribes on unmount', () => {
      const { unmount } = renderHook(() => useAppState());
      expect(_testHooks.getListeners().size).toBe(1);
      
      unmount();
      
      expect(_testHooks.getListeners().size).toBe(0);
    });
  });
});