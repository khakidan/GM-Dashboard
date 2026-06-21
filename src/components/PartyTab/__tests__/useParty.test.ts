// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useParty } from '../hooks/useParty';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { deleteCharacterFully, addCharacterDB, updateCharacterDB } from '../../../services/dbOperations';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../../../services/dbOperations', () => ({
  deleteCharacterFully: vi.fn().mockResolvedValue(undefined),
  addCharacterDB: vi.fn(),
  updateCharacterDB: vi.fn(),
}));

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn()
}));

describe('useParty', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.resetAllMocks(); });

  describe('handleDeletePlayer', () => {
    it('rolls back state and shows error toast if deleteCharacterFully throws', async () => {
      const mockChar = { id: 'char-1', characterName: 'Testo' };
      const updateStateSpy = vi.fn();
      const mockState = { characters: [mockChar] };

      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      vi.mocked(deleteCharacterFully).mockRejectedValue(new Error('DB Error'));

      const { result } = renderHook(() => useParty());
      
      await act(async () => {
        await result.current.handleDeletePlayer('char-1');
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to save changes. Please try again.', expect.any(Object));
      expect(updateStateSpy).toHaveBeenCalled();
    });
  });

  describe('handleLevelUpConfirm error handling', () => {
    it('rolls back state and shows error toast if updateCharacterDB throws', async () => {
      const mockChar = { id: 'char-1', characterName: 'Testo' };
      const updateStateSpy = vi.fn();
      const mockState = { characters: [mockChar], combatState: { combatants: [] } };

      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      vi.mocked(updateCharacterDB).mockRejectedValue(new Error('DB Error'));

      const { result } = renderHook(() => useParty());
      
      act(() => {
        result.current.setLevelUpCharacter(mockChar as any);
      });

      await act(async () => {
        await result.current.handleLevelUpConfirm({ level: 2 });
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to save changes. Please try again.', expect.any(Object));
      expect(updateStateSpy).toHaveBeenCalled();
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
  });

  it('triggers a success toast with the character name on deletion', async () => {
    const mockChar = { id: 'char-1', characterName: 'Testo' };
    vi.mocked(useAppState).mockReturnValue({
      state: { characters: [mockChar] } as any,
      updateState: vi.fn(),
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue({ characters: [mockChar] } as any);

    const { result } = renderHook(() => useParty());
    
    await act(async () => {
      await result.current.handleDeletePlayer('char-1');
    });

    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Testo'));
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('removed from roster'));
  });

  describe('handleLongRest basic expectations', () => {
    it('handleLongRest with [id1] applies long rest only to character id1, not to id2', async () => {
      const mockActiveChar1 = { id: 'char-1', characterName: 'Maeve', isActive: true, maxHp: 100, currentHp: 50, conditions: 'exhaustion 4', tempHpMax: 0, tempHp: 0, hitDiceConfig: '4d12', hitDiceUsed: '{"d12":2}' };
      const mockActiveChar2 = { id: 'char-2', characterName: 'Drogar', isActive: true, maxHp: 160, currentHp: 80, conditions: '', tempHpMax: 0, tempHp: 0, hitDiceConfig: '4d10', hitDiceUsed: '{"d10":2}' };

      const mockState = {
        characters: [mockActiveChar1, mockActiveChar2],
        combatState: {
          combatants: []
        }
      };

      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleLongRest(['char-1']);
      });

      expect(updateStateSpy).toHaveBeenCalled();
      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);

      const updatedMaeve = nextState.characters.find((c: any) => c.id === 'char-1');
      const updatedDrogar = nextState.characters.find((c: any) => c.id === 'char-2');

      // Maeve is updated
      expect(updatedMaeve.currentHp).toBe(100);
      expect(updatedMaeve.tempHp).toBe(0);
      // Drogar is NOT updated because his ID was not passed
      expect(updatedDrogar.currentHp).toBe(80);
    });

    it('handleLongRest restores currentHp to maxHp and calls applyLongRestHitDiceRecovery for selected characters', async () => {
      const mockActiveChar1 = { id: 'char-1', characterName: 'Maeve', isActive: true, maxHp: 100, currentHp: 50, conditions: 'exhaustion 4', tempHpMax: 0, tempHp: 0, hitDiceConfig: '4d12', hitDiceUsed: '{"d12":2}' };

      const mockState = {
        characters: [mockActiveChar1],
        combatState: {
          combatants: []
        }
      };

      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleLongRest(['char-1']);
      });

      expect(updateStateSpy).toHaveBeenCalled();
      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);

      const updatedMaeve = nextState.characters.find((c: any) => c.id === 'char-1');
      expect(updatedMaeve.currentHp).toBe(100);
      // d12 pool of 4, recover ceil(4/2) = 2, so 2 - 2 = 0 used
      expect(updatedMaeve.hitDiceUsed).toBe('{"d12":0}');

      expect(updateCharacterDB).toHaveBeenCalledWith(expect.objectContaining({
        currentHp: 100,
        hitDiceUsed: '{"d12":0}'
      }), mockActiveChar1);
    });
  });

  describe('handleCreateCharacter', () => {
    it('optimistically adds a character, calls addCharacterDB, replaces temp ID with real ID, and shows success toast', async () => {
      const mockNewCharData = {
        characterName: 'Maeve',
        playerName: 'Sage',
        ac: 15,
        maxHp: 50,
        currentHp: 50,
        tempHp: 0,
        tempHpMax: 0,
        conditions: '',
        passivePerception: 14,
        level: 5,
        statusId: 1,
        statusName: 'Active',
        notes: '',
        isActive: true,
        resistances: '',
        immunities: '',
        vulnerabilities: '',
        class: 'Rogue',
        hitDiceConfig: '',
        hitDiceUsed: '{}',
      };
      const mockSavedChar = { ...mockNewCharData, id: 'char-real-id', sheetRowIndex: 4 };

      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: { characters: [] } as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);

      vi.mocked(addCharacterDB).mockResolvedValue(mockSavedChar as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleCreateCharacter(mockNewCharData);
      });

      // Assert optimistic add in updateState
      expect(updateStateSpy).toHaveBeenCalled();
      const firstCallFn = updateStateSpy.mock.calls[0][0];
      const stateAfterOptimistic = firstCallFn({ characters: [] });
      expect(stateAfterOptimistic.characters).toHaveLength(1);
      expect(stateAfterOptimistic.characters[0].id).toContain('pc-temp-');

      // Assert DB call
      expect(addCharacterDB).toHaveBeenCalledWith(expect.objectContaining({
        characterName: 'Maeve',
      }));

      // Assert replace temp with real ID
      const secondCallFn = updateStateSpy.mock.calls[1][0];
      const stateAfterReal = secondCallFn({
        characters: [{ ...mockNewCharData, id: stateAfterOptimistic.characters[0].id }]
      });
      expect(stateAfterReal.characters[0].id).toBe('char-real-id');

      // Assert success toast
      expect(toast.success).toHaveBeenCalledWith('Maeve added to the roster');
    });

    it('rolls back state and shows error toast if addCharacterDB throws', async () => {
      const mockNewCharData = {
        characterName: 'Maeve',
        playerName: 'Sage',
        ac: 15,
        maxHp: 50,
        currentHp: 50,
        tempHp: 0,
        tempHpMax: 0,
        conditions: '',
        passivePerception: 14,
        level: 5,
        statusId: 1,
        statusName: 'Active',
        notes: '',
        isActive: true,
        resistances: '',
        immunities: '',
        vulnerabilities: '',
        class: 'Rogue',
        hitDiceConfig: '',
        hitDiceUsed: '{}',
      };

      const updateStateSpy = vi.fn();
      const initialState = { characters: [] };
      vi.mocked(useAppState).mockReturnValue({
        state: initialState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);

      vi.mocked(addCharacterDB).mockRejectedValue(new Error('DB Error'));

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleCreateCharacter(mockNewCharData);
      });

      // Rollback is triggered by calling state update with the previous state (which was state, i.e., initialState)
      expect(updateStateSpy).toHaveBeenCalledWith(initialState);
      expect(result.current.globalError).toBe('Failed to add player. Please try again.');
    });
  });

  describe('handleUpdate', () => {
    it('updates a character field in local state immediately and calls updateCharacterDB with the latest character from getSnapshot', async () => {
      const mockChar = { id: 'char-1', characterName: 'Maeve', ac: 15 };
      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: { characters: [mockChar] } as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue({ characters: [mockChar] } as any);

      vi.mocked(updateCharacterDB).mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleUpdate('char-1', { ac: 16 });
      });

      // Local state update check
      expect(updateStateSpy).toHaveBeenCalled();
      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater({ characters: [mockChar] });
      expect(nextState.characters[0].ac).toBe(16);

      // Call updateCharacterDB check
      expect(updateCharacterDB).toHaveBeenCalledWith({ ac: 16 }, mockChar);
    });

    it('only calls updateCharacterDB for fields that exist in the sheet and does NOT call for non-sheet UI-only fields', async () => {
      const mockChar = { id: 'char-1', characterName: 'Maeve', ac: 15 };
      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: { characters: [mockChar] } as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue({ characters: [mockChar] } as any);

      vi.mocked(updateCharacterDB).mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleUpdate('char-1', { someUIOnlyField: 'value' } as any);
      });

      // Still updates local state
      expect(updateStateSpy).toHaveBeenCalled();
      // But does NOT call updateCharacterDB
      expect(updateCharacterDB).not.toHaveBeenCalled();
    });

    it('rolls back state if updateCharacterDB throws', async () => {
      const mockChar = { id: 'char-1', characterName: 'Maeve', ac: 15 };
      const updateStateSpy = vi.fn();
      const mockInitialState = { characters: [mockChar] };
      vi.mocked(useAppState).mockReturnValue({
        state: mockInitialState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockInitialState as any);

      vi.mocked(updateCharacterDB).mockRejectedValue(new Error('Sync failed'));

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleUpdate('char-1', { ac: 16 });
      });

      // Should call updateState with mockInitialState (which is previousState)
      expect(updateStateSpy).toHaveBeenCalledWith(mockInitialState);
      expect(result.current.globalError).toBe('Failed to update details for "Maeve".');
    });

    it("updates character's tempAc and mirrors it to matching active combatant's tempAcModifier as 2", async () => {
      const mockChar = { id: 'char-1', characterName: 'Maeve', ac: 15, tempAc: 0 };
      const mockPcCombatant = { id: 'combatant-1', type: 'pc', characterId: 'char-1', name: 'Maeve', ac: 15, tempAcModifier: 0 };
      const mockState = {
        characters: [mockChar],
        combatState: {
          combatants: [mockPcCombatant]
        }
      };
      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);
      vi.mocked(updateCharacterDB).mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleUpdate('char-1', { tempAc: 2 });
      });

      expect(updateStateSpy).toHaveBeenCalled();
      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);

      expect(nextState.characters[0].tempAc).toBe(2);
      expect(nextState.combatState.combatants[0].tempAcModifier).toBe(2);

      expect(updateCharacterDB).toHaveBeenCalledWith({ tempAc: 2 }, expect.objectContaining({ id: 'char-1' }));
    });

    it('calls updateCharacterDB with the new class when handleUpdate is called with class', async () => {
      const mockChar = { id: 'char-1', characterName: 'Maeve', isActive: true, class: 'Fighter' };
      const mockState = {
        characters: [mockChar],
        combatState: { combatants: [] }
      };

      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);
      vi.mocked(updateCharacterDB).mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleUpdate('char-1', { class: 'Barbarian / Fighter' });
      });

      expect(updateCharacterDB).toHaveBeenCalledWith({ class: 'Barbarian / Fighter' }, expect.objectContaining({ id: 'char-1' }));
    });
  });

  describe('handleShortRest basic expectations', () => {
    it('handleShortRest adds hpToAdd to currentHp without exceeding maxHp and updates hitDiceUsed', async () => {
      const mockActiveChar = { id: 'char-1', characterName: 'Maeve', isActive: true, maxHp: 50, currentHp: 20, tempHp: 5, hitDiceConfig: '4d8', hitDiceUsed: '{"d8":1}' };
      
      const mockState = {
        characters: [mockActiveChar],
        combatState: { combatants: [] }
      };

      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      vi.mocked(updateCharacterDB).mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleShortRest([
          { characterId: 'char-1', hpToAdd: 40, newHitDiceUsed: '{"d8":2}' }
        ]);
      });

      // Verify the state updater function restores and maps correctly
      expect(updateStateSpy).toHaveBeenCalled();
      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);
      
      const updatedActive = nextState.characters.find((c: any) => c.id === 'char-1');

      // Max HP is 50, temp HP is 5. Max allowed HP is maxHp + tempHp = 55. But 20 + 40 = 60. So capped at 55.
      expect(updatedActive.currentHp).toBe(55);
      expect(updatedActive.hitDiceUsed).toBe('{"d8":2}');

      // Verify updateCharacterDB called
      expect(updateCharacterDB).toHaveBeenCalledWith({ currentHp: 55, hitDiceUsed: '{"d8":2}', resourcePools: '[]' }, mockActiveChar);
    });

    it('handleShortRest rolls back on DB failure', async () => {
      const mockActiveChar = { id: 'char-1', characterName: 'Maeve', isActive: true, maxHp: 50, currentHp: 20, tempHp: 0, hitDiceConfig: '4d12', hitDiceUsed: '{"d12":1}' };
      
      const mockState = {
        characters: [mockActiveChar],
        combatState: { combatants: [] }
      };

      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      vi.mocked(updateCharacterDB).mockRejectedValue(new Error('DB Error'));

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleShortRest([
          { characterId: 'char-1', hpToAdd: 10, newHitDiceUsed: '{"d12":2}' }
        ]);
      });

      // Verification of rollback
      expect(updateStateSpy).toHaveBeenCalledWith(mockState);
      expect(result.current.globalError).toBe('Failed to save short rest. Please try again.');
    });
  });

  describe('handleLevelUpConfirm and handleUpdate combat state propagation', () => {
    it('handleLevelUpConfirm propagates character updates and static fields to active PC combatants', async () => {
      const mockChar = { id: 'char-1', characterName: 'Maeve', isActive: true, maxHp: 100, currentHp: 50, conditions: 'exhaustion 4', tempHpMax: 0, tempHp: 0, level: 5 };
      const mockPcCombatant = { id: 'combatant-1', type: 'pc', characterId: 'char-1', name: 'Maeve', maxHp: 100, currentHp: 50, tempHp: 0, conditions: 'exhaustion 4' };
      const mockState = {
        characters: [mockChar],
        combatState: {
          combatants: [mockPcCombatant]
        }
      };

      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      vi.mocked(updateCharacterDB).mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useParty());
      
      // Set levelUpCharacter first so handleLevelUpConfirm runs
      act(() => {
        result.current.setLevelUpCharacter(mockChar as any);
      });

      await act(async () => {
        await result.current.handleLevelUpConfirm({ level: 6, maxHp: 120, ac: 18 });
      });

      expect(updateStateSpy).toHaveBeenCalled();
      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);

      const updatedMaeveCombatant = nextState.combatState.combatants.find((c: any) => c.id === 'combatant-1');
      expect(updatedMaeveCombatant.maxHp).toBe(120);
      expect(updatedMaeveCombatant.ac).toBe(18);
    });

    it('handleUpdate propagates roster updates directly to active combatants immediately', async () => {
      const mockChar = { id: 'char-1', characterName: 'Maeve', isActive: true, maxHp: 100, currentHp: 50, ac: 15, conditions: '' };
      const mockPcCombatant = { id: 'combatant-1', type: 'pc', characterId: 'char-1', name: 'Maeve', maxHp: 100, currentHp: 50, ac: 15, conditions: '' };
      const mockState = {
        characters: [mockChar],
        combatState: {
          combatants: [mockPcCombatant]
        }
      };

      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      vi.mocked(updateCharacterDB).mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useParty());

      await act(async () => {
        await result.current.handleUpdate('char-1', { ac: 18, maxHp: 120, conditions: 'Poisoned' });
      });

      expect(updateStateSpy).toHaveBeenCalled();
      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);

      const updatedMaeveCombatant = nextState.combatState.combatants.find((c: any) => c.id === 'combatant-1');
      expect(updatedMaeveCombatant.ac).toBe(18);
      expect(updatedMaeveCombatant.maxHp).toBe(120);
      expect(updatedMaeveCombatant.conditions).toBe('Poisoned');
    });
  });

  describe('toggleExpand', () => {
    it('adds an ID to expandedIds when it is not already there, and removes it when it is', () => {
      vi.mocked(useAppState).mockReturnValue({
        state: { characters: [] } as any,
        updateState: vi.fn(),
        getSnapshot: vi.fn(),
      } as any);

      const { result } = renderHook(() => useParty());
      
      // Starts empty
      expect(result.current.expandedIds.has('id-1')).toBe(false);

      // Add it
      act(() => {
        result.current.toggleExpand('id-1');
      });
      expect(result.current.expandedIds.has('id-1')).toBe(true);

      // Remove it
      act(() => {
        result.current.toggleExpand('id-1');
      });
      expect(result.current.expandedIds.has('id-1')).toBe(false);
    });
  });

  describe('hitDice specific DB write path tests', () => {
    it('calls updateCharacterDB with the new hitDiceConfig when handleUpdate is called with hitDiceConfig', async () => {
      const mockChar = { id: 'char-1', characterName: 'Maeve', isActive: true, maxHp: 50, currentHp: 20, hitDiceConfig: '4d12', hitDiceUsed: '{"d12":1}' };
      const mockState = {
        characters: [mockChar],
        combatState: { combatants: [] }
      };

      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);
      vi.mocked(updateCharacterDB).mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleUpdate('char-1', { hitDiceConfig: '5d12' });
      });

      expect(updateCharacterDB).toHaveBeenCalledWith({ hitDiceConfig: '5d12' }, expect.objectContaining({ id: 'char-1' }));
    });

    it('calls updateCharacterDB with the new hitDiceUsed when handleShortRest completes', async () => {
      const mockChar = { id: 'char-1', characterName: 'Maeve', isActive: true, maxHp: 50, currentHp: 20, hitDiceConfig: '4d12', hitDiceUsed: '{"d12":1}' };
      const mockState = {
        characters: [mockChar],
        combatState: { combatants: [] }
      };

      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);
      vi.mocked(updateCharacterDB).mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleShortRest([
          { characterId: 'char-1', hpToAdd: 15, newHitDiceUsed: '{"d12":2}' }
        ]);
      });

      expect(updateCharacterDB).toHaveBeenCalledWith({ currentHp: 35, hitDiceUsed: '{"d12":2}', resourcePools: '[]' }, mockChar);
    });

    it('calls updateCharacterDB with partially recovered hitDiceUsed for 7d8 config (7 spent -> 3 spent) when handleLongRest completes', async () => {
      const mockChar = {
        id: 'char-7d8',
        characterName: 'Caleb',
        isActive: true,
        maxHp: 40,
        currentHp: 10,
        hitDiceConfig: '7d8',
        hitDiceUsed: '{"d8":7}',
        tempHpMax: 0,
        tempHp: 0,
        deathSavesFails: 0,
        deathSavesSuccesses: 0
      };
      const mockState = {
        characters: [mockChar],
        combatState: { combatants: [] }
      };

      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);
      vi.mocked(updateCharacterDB).mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleLongRest(['char-7d8']);
      });

      expect(updateCharacterDB).toHaveBeenCalledWith({
        currentHp: 40,
        tempHp: 0,
        hitDiceUsed: '{"d8":3}',
        deathSavesFails: 0,
        deathSavesSuccesses: 0,
        resourcePools: '[]'
      }, mockChar);
    });

    it('handleUpdate with { class: \'Barbarian\' } results in updateCharacterDB being called with class', async () => {
      const mockChar = { id: 'char-1', characterName: 'Maeve', isActive: true, class: 'Fighter' };
      const mockState = { characters: [mockChar], combatState: { combatants: [] } };
      vi.mocked(useAppState).mockReturnValue({ state: mockState as any, updateState: vi.fn(), getSnapshot: vi.fn() } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);
      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleUpdate('char-1', { class: 'Barbarian' });
      });
      expect(updateCharacterDB).toHaveBeenCalledWith({ class: 'Barbarian' }, expect.any(Object));
    });

    it('handleUpdate with { hitDiceConfig: \'7d8\' } results in updateCharacterDB being called with hitDiceConfig', async () => {
      const mockChar = { id: 'char-1', characterName: 'Maeve', isActive: true, hitDiceConfig: '1d8' };
      const mockState = { characters: [mockChar], combatState: { combatants: [] } };
      vi.mocked(useAppState).mockReturnValue({ state: mockState as any, updateState: vi.fn(), getSnapshot: vi.fn() } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);
      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleUpdate('char-1', { hitDiceConfig: '7d8' });
      });
      expect(updateCharacterDB).toHaveBeenCalledWith({ hitDiceConfig: '7d8' }, expect.any(Object));
    });

    it('handleLongRest writes partially recovered hitDiceUsed and not default {}', async () => {
      const mockChar = { id: 'char-1', characterName: 'Maeve', isActive: true, maxHp: 50, currentHp: 20, hitDiceConfig: '7d8', hitDiceUsed: '{"d8":7}', tempHpMax: 0, tempHp: 0, deathSavesFails: 0, deathSavesSuccesses: 0 };
      const mockState = { characters: [mockChar], combatState: { combatants: [] } };
      vi.mocked(useAppState).mockReturnValue({ state: mockState as any, updateState: vi.fn(), getSnapshot: vi.fn() } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);
      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleLongRest(['char-1']);
      });
      expect(updateCharacterDB).toHaveBeenCalledWith(expect.objectContaining({
        hitDiceUsed: '{"d8":3}'
      }), mockChar);
    });
  });
});
