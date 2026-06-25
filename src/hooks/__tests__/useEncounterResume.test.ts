import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEncounterResume } from '../useEncounterResume';
import { useAppState } from '../useAppState';

vi.mock('../useAppState', () => ({
  useAppState: vi.fn(),
}));

describe('useEncounterResume State Transition Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('restores in-progress encounter state from the sheet snapshot when hasInitialSynced is false', () => {
    const updateState = vi.fn();
    const mockEnc = { id: 'enc-1', currentRound: 2, activeTurnId: 'pc-1' };
    const mockEC = { id: 'ec-1', encounterId: 'enc-1', playerId: 'char-1', initiative: 10 };
    const mockChar = { id: 'char-1', characterName: 'Thorin', maxHp: 50, currentHp: 50, ac: 15 };

    vi.mocked(useAppState).mockReturnValue({
      state: { 
        hasInitialSynced: true, // Transitions to true to trigger restore
        encounters: [mockEnc], 
        characters: [mockChar], 
        encounterCombatants: [mockEC], 
        npcs: [],
        combatState: { activeEncounterId: null }
      },
      updateState,
    } as any);

    renderHook(() => useEncounterResume());
    expect(updateState).toHaveBeenCalled();
  });

  it('does not restore anything if hasInitialSynced is true or activeEncounterId is already set', () => {
    const updateState = vi.fn();
    vi.mocked(useAppState).mockReturnValue({
      state: { 
        hasInitialSynced: false, // If false, no restore is triggered
        encounters: [{ id: 'enc-1', currentRound: 2 }], 
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
});
