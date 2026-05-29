// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useSheetSync } from '../useSheetSync';
import { useAppState, getSnapshot } from '../useAppState';

vi.mock('../useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn(),
}));

describe('useSheetSync', () => {
  const setIsGoogleConnected = vi.fn();

  it('startEncounter constructs PC combatants with the latest conditions from the sheet snapshot', async () => {
    const mockCharacter = {
      id: 'char-1',
      characterName: 'Thorin',
      isActive: true,
      ac: 18,
      maxHp: 50,
      currentHp: 45,
      tempHp: 0,
      conditions: 'poisoned',
      notes: 'Some notes',
      passivePerception: 12,
      sheetRowIndex: 2,
    };

    const mockEncounter = {
      id: 'enc-1',
      name: 'Forest Ambush',
    };

    // Mock useAppState BEFORE rendering the hook
    let updateStateCalledWith: any;
    vi.mocked(useAppState).mockReturnValue({
      state: {
        encounters: [mockEncounter],
        characters: [mockCharacter],
        encounterCombatants: [],
      },
      updateState: (fn: any) => { 
        if (typeof fn === 'function') {
          updateStateCalledWith = fn({}); 
        } else {
          updateStateCalledWith = fn;
        }
      }
    } as any);

    // Snapshot with updated conditions (representing a change between render and function call)
    vi.mocked(getSnapshot).mockReturnValue({
      encounters: [mockEncounter],
      characters: [{ ...mockCharacter, conditions: 'poisoned, restrained' }],
      encounterCombatants: [],
    } as any);

    const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected }));

    await act(async () => {
      await result.current.startEncounter('enc-1');
    });

    const pcCombatant = updateStateCalledWith.combatState.combatants[0];
    expect(pcCombatant.name).toBe('Thorin');
    // It should pick up the LATEST conditions from getSnapshot, not the initial stale ones from the closure
    expect(pcCombatant.conditions).toBe('poisoned, restrained');
  });
});
