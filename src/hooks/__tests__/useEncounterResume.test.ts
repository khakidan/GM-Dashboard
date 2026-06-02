import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useEncounterResume } from '../useEncounterResume';
import { useAppState } from '../useAppState';

vi.mock('../useAppState', () => ({
  useAppState: vi.fn(),
}));

describe('useEncounterResume', () => {
  it('Does nothing when hasInitialSynced is false', () => {
    const updateState = vi.fn();
    vi.mocked(useAppState).mockReturnValue({
      state: { hasInitialSynced: false, encounters: [], characters: [], encounterCombatants: [], npcs: [] },
      updateState,
    } as any);

    renderHook(() => useEncounterResume());
    expect(updateState).not.toHaveBeenCalled();
  });

  it('When hasInitialSynced becomes true and no encounter has currentRound > 0, combatState is not changed', () => {
    const updateState = vi.fn();
    vi.mocked(useAppState).mockReturnValue({
      state: { 
        hasInitialSynced: true, 
        encounters: [{ id: 'enc-1', currentRound: 0 }], 
        characters: [], 
        encounterCombatants: [], 
        npcs: [],
        combatState: { activeEncounterId: null }
      },
      updateState,
    } as any);

    renderHook(() => useEncounterResume());
    expect(updateState).not.toHaveBeenCalled();
  });

  it('When hasInitialSynced becomes true and an encounter has currentRound > 0, that encounter becomes the active encounter', () => {
    const updateState = vi.fn();
    const mockEnc = { id: 'enc-1', currentRound: 2, activeTurnId: 'pc-1' };
    const mockEC = { id: 'ec-1', encounterId: 'enc-1', playerId: 'char-1', initiative: 10 };
    const mockChar = { id: 'char-1', characterName: 'Thorin', maxHp: 50, currentHp: 50, ac: 15 };

    vi.mocked(useAppState).mockReturnValue({
      state: { 
        hasInitialSynced: true, 
        encounters: [mockEnc], 
        characters: [mockChar], 
        encounterCombatants: [mockEC], 
        npcs: [],
        combatState: { activeEncounterId: null }
      },
      updateState,
    } as any);

    const onActiveTabChange = vi.fn();
    renderHook(() => useEncounterResume(onActiveTabChange));

    expect(updateState).toHaveBeenCalled();
    const updateFn = updateState.mock.calls[0][0];
    const newState = updateFn({ combatState: {} });
    expect(newState.combatState.activeEncounterId).toBe('enc-1');
    expect(newState.combatState.round).toBe(2);
    expect(onActiveTabChange).toHaveBeenCalledWith('combat');
  });

  it('When an in-progress encounter is found, combatants are built from the matching encounterCombatants', () => {
    const updateState = vi.fn();
    const mockEnc = { id: 'enc-1', currentRound: 1 };
    const mockEC = { id: 'ec-1', encounterId: 'enc-1', playerId: 'char-1', initiative: 20 };
    const mockChar = { id: 'char-1', characterName: 'Maeve', maxHp: 40, currentHp: 40, ac: 14 };

    vi.mocked(useAppState).mockReturnValue({
      state: { 
        hasInitialSynced: true, 
        encounters: [mockEnc], 
        characters: [mockChar], 
        encounterCombatants: [mockEC], 
        npcs: [],
        combatState: { activeEncounterId: null }
      },
      updateState,
    } as any);

    renderHook(() => useEncounterResume());
    
    const updateFn = updateState.mock.calls[0][0];
    const newState = updateFn({ combatState: {} });
    expect(newState.combatState.combatants).toHaveLength(1);
    expect(newState.combatState.combatants[0].name).toBe('Maeve');
  });
});
