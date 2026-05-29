// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
  });

  it('triggers a success toast with the character name on deletion', async () => {
    const mockChar = { id: 'char-1', characterName: 'Testo' };
    vi.mocked(useAppState).mockReturnValue({
      state: { characters: [mockChar] } as any,
      updateState: vi.fn()
    });
    vi.mocked(getSnapshot).mockReturnValue({ characters: [mockChar] } as any);

    const { result } = renderHook(() => useParty());
    
    await act(async () => {
      await result.current.handleDeletePlayer('char-1');
    });

    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Testo'));
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('removed from roster'));
  });

  describe('handleLongRest combatState mirroring', () => {
    it('correctly mirrors state updates to active PC combatants and leaves NPCs untouched', async () => {
      const mockActiveChar1 = { id: 'char-1', characterName: 'Maeve', isActive: true, maxHp: 100, currentHp: 50, conditions: 'exhaustion 4, concentrating', tempHpMax: 0, tempHp: 0 };
      const mockActiveChar2 = { id: 'char-2', characterName: 'Drogar', isActive: true, maxHp: 160, currentHp: 80, conditions: 'poisoned', tempHpMax: 0, tempHp: 0 };
      const mockInactiveChar = { id: 'char-3', characterName: 'Ylva', isActive: false, maxHp: 90, currentHp: 10, conditions: 'blinded', tempHpMax: 0, tempHp: 0 };

      const mockPcCombatant1 = { id: 'combatant-1', type: 'pc', characterId: 'char-1', name: 'Maeve', maxHp: 100, currentHp: 50, tempHp: 0, conditions: 'exhaustion 4, concentrating', conditionTimers: { 'concentrating': 1 } };
      const mockNpcCombatant = { id: 'combatant-npc', type: 'npc', npcId: 'npc-1', name: 'Orc', maxHp: 30, currentHp: 30, tempHp: 0, conditions: 'stunned', conditionTimers: {} };

      const mockState = {
        characters: [mockActiveChar1, mockActiveChar2, mockInactiveChar],
        combatState: {
          combatants: [mockPcCombatant1, mockNpcCombatant]
        }
      };

      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy
      });
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleLongRest();
      });

      expect(updateStateSpy).toHaveBeenCalled();
      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);

      // 1. Check characters are updated
      const updatedMaeve = nextState.characters.find((c: any) => c.id === 'char-1');
      const updatedDrogar = nextState.characters.find((c: any) => c.id === 'char-2');
      const updatedYlva = nextState.characters.find((c: any) => c.id === 'char-3');

      // Maeve: exhaustion 4 -> exhaustion 3, concentrating -> removed
      expect(updatedMaeve.conditions).toBe('exhaustion 3');
      expect(updatedMaeve.currentHp).toBe(100);

      // Drogar: poisoned (persists under long rest)
      expect(updatedDrogar.conditions).toBe('poisoned');
      expect(updatedDrogar.currentHp).toBe(160);

      // Inactive character (Ylva) not updated by long rest
      expect(updatedYlva.currentHp).toBe(10);
      expect(updatedYlva.conditions).toBe('blinded');

      // 2. Check combatants mirroring
      const updatedMaeveCombatant = nextState.combatState.combatants.find((c: any) => c.id === 'combatant-1');
      const updatedNpcCombatantRec = nextState.combatState.combatants.find((c: any) => c.id === 'combatant-npc');

      // Maeve PC combatant must mirror the changes
      expect(updatedMaeveCombatant.conditions).toBe('exhaustion 3'); // exhaustion 4 -> 3
      expect(updatedMaeveCombatant.currentHp).toBe(100);
      expect(updatedMaeveCombatant.conditionTimers).toEqual({}); // reset/cleared

      // NPC combatant must remain completely untouched
      expect(updatedNpcCombatantRec.conditions).toBe('stunned');
      expect(updatedNpcCombatantRec.currentHp).toBe(30);
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
      };
      const mockSavedChar = { ...mockNewCharData, id: 'char-real-id', sheetRowIndex: 4 };

      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: { characters: [] } as any,
        updateState: updateStateSpy,
      });

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
      };

      const updateStateSpy = vi.fn();
      const initialState = { characters: [] };
      vi.mocked(useAppState).mockReturnValue({
        state: initialState as any,
        updateState: updateStateSpy,
      });

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
      });
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
      });
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
      });
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
  });

  describe('handleLongRest basic updates', () => {
    it('restores currentHp to maxHp, sets tempHp to 0, skips inactive characters, and calls updateCharacterDB for each active character', async () => {
      const mockActiveChar = { id: 'char-1', characterName: 'Maeve', isActive: true, maxHp: 50, currentHp: 20, tempHp: 10, tempHpMax: 0, conditions: '' };
      const mockInactiveChar = { id: 'char-2', characterName: 'Drogar', isActive: false, maxHp: 60, currentHp: 30, tempHp: 5, tempHpMax: 0, conditions: '' };
      
      const mockState = {
        characters: [mockActiveChar, mockInactiveChar],
        combatState: { combatants: [] }
      };

      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
      });
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      vi.mocked(updateCharacterDB).mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleLongRest();
      });

      // Verify the state updater function restores and maps correctly
      expect(updateStateSpy).toHaveBeenCalled();
      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);
      
      const updatedActive = nextState.characters.find((c: any) => c.id === 'char-1');
      const updatedInactive = nextState.characters.find((c: any) => c.id === 'char-2');

      expect(updatedActive.currentHp).toBe(50);
      expect(updatedActive.tempHp).toBe(0);
      
      // Inactive should remain unchanged in state mapping
      expect(updatedInactive.currentHp).toBe(30);
      expect(updatedInactive.tempHp).toBe(5);

      // Verify updateCharacterDB called for active character but NOT inactive
      expect(updateCharacterDB).toHaveBeenCalledWith({ currentHp: 50, tempHp: 0 }, mockActiveChar);
      expect(updateCharacterDB).not.toHaveBeenCalledWith(expect.any(Object), mockInactiveChar);
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
        updateState: updateStateSpy
      });
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
        updateState: updateStateSpy
      });
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
      });

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
});
