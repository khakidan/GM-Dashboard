import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useEncounterLifecycle } from '../useEncounterLifecycle';
import { useAppState, getSnapshot } from '../useAppState';
import { updateEncounterStateDB, clearEncounterStateDB } from '../../services/dbOperations';

vi.mock('../../services/dbOperations', () => ({
  updateEncounterStateDB: vi.fn().mockResolvedValue(undefined),
  clearEncounterStateDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn(),
}));

describe('useEncounterLifecycle', () => {
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

    let updateStateCalledWith: any;
    vi.mocked(useAppState).mockReturnValue({
      updateState: (fn: any) => { 
        if (typeof fn === 'function') {
          updateStateCalledWith = fn({}); 
        } else {
          updateStateCalledWith = fn;
        }
      }
    } as any);

    vi.mocked(getSnapshot).mockReturnValue({
      encounters: [mockEncounter],
      characters: [{ ...mockCharacter, conditions: 'poisoned, restrained' }],
      encounterCombatants: [],
      npcs: [],
    } as any);

    const { result } = renderHook(() => useEncounterLifecycle());

    await act(async () => {
      await result.current.startEncounter('enc-1');
    });

    const pcCombatant = updateStateCalledWith.combatState.combatants[0];
    expect(pcCombatant.name).toBe('Thorin');
    expect(pcCombatant.conditions).toBe('poisoned, restrained');
  });

  it('clearEncounter sets activeEncounterId to null and routes active tab back to encounters', async () => {
    let updateStateCalledWith: any;
    vi.mocked(useAppState).mockReturnValue({
      updateState: (fn: any) => { 
        updateStateCalledWith = fn({ combatState: { activeEncounterId: 'enc-1' } }); 
      }
    } as any);
    
    vi.mocked(getSnapshot).mockReturnValue({
      combatState: { activeEncounterId: 'enc-1' }
    } as any);

    const onActiveTabChange = vi.fn();
    const { result } = renderHook(() => useEncounterLifecycle(onActiveTabChange));

    act(() => {
      result.current.clearEncounter();
    });

    expect(updateStateCalledWith.combatState.activeEncounterId).toBeNull();
    expect(onActiveTabChange).toHaveBeenCalledWith('encounters');
    expect(clearEncounterStateDB).toHaveBeenCalledWith('enc-1');
  });
});
