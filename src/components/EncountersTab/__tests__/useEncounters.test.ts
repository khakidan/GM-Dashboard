// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEncounters } from '../hooks/useEncounters';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { deleteEncounterFully, addEncounterDB } from '../../../services/dbOperations';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../../../services/dbOperations', () => ({
  deleteEncounterFully: vi.fn().mockResolvedValue(undefined),
  addEncounterDB: vi.fn(),
}));

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn()
}));

const mockSyncRequested = vi.fn().mockResolvedValue(undefined);

describe('useEncounters', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.resetAllMocks(); });

  describe('handleDelete error handling', () => {
    it('rolls back state and shows error toast if deleteEncounterFully throws', async () => {
      const mockEnc = { id: 'enc-1', name: 'Goblin ambush' };
      const updateStateSpy = vi.fn();
      const mockState = { encounters: [mockEnc], encounterCombatants: [] };

      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      vi.mocked(deleteEncounterFully).mockRejectedValue(new Error('DB Error'));

      const { result } = renderHook(() => useEncounters({ onSelectEncounter: vi.fn(), onSyncRequested: vi.fn().mockResolvedValue(undefined) }));
      
      await act(async () => {
        await result.current.handleDelete(mockEnc as any);
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to save changes. Please try again.', expect.any(Object));
      expect(updateStateSpy).toHaveBeenCalled();
    });
  });
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers a success toast with the encounter name on deletion', async () => {
    const mockEnc = { id: 'enc-1', name: 'Goblin Ambush', location: 'Woods' };
    vi.mocked(useAppState).mockReturnValue({
      state: { encounters: [mockEnc], encounterCombatants: [] } as any,
      updateState: vi.fn(),
      getSnapshot: vi.fn(),
    } as any);

    const { result } = renderHook(() => useEncounters({
      onSelectEncounter: vi.fn(),
      onSyncRequested: mockSyncRequested
    }));
    
    await act(async () => {
      await result.current.handleDelete(mockEnc as any);
    });

    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Goblin Ambush'));
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('deleted'));
  });

  describe('handleCreateEncounter', () => {
    it('optimistically adds an encounter, calls addEncounterDB, and updates state with the real encounter on success', async () => {
      const mockDifficulties = { 1: 'Easy', 2: 'Medium' };
      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: { encounters: [], difficulties: mockDifficulties } as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);

      const mockRealEncounter = { id: 'real-enc-99', name: 'Goblin Ambush', location: 'Woods', difficultyId: 2, status: 'planned', difficultyName: 'Medium' };
      vi.mocked(addEncounterDB).mockResolvedValue(mockRealEncounter as any);

      const mockOnSelectEncounter = vi.fn();
      const mockOnSyncRequested = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => useEncounters({
        onSelectEncounter: mockOnSelectEncounter,
        onSyncRequested: mockOnSyncRequested,
      }));

      await act(async () => {
        await result.current.handleCreateEncounter({
          name: 'Goblin Ambush',
          location: 'Woods',
          difficultyId: 2,
        });
      });

      // 1. Optimistic Add
      expect(updateStateSpy).toHaveBeenCalled();
      const firstCallFn = updateStateSpy.mock.calls[0][0];
      const stateAfterOptimistic = firstCallFn({ encounters: [], difficulties: mockDifficulties });
      expect(stateAfterOptimistic.encounters).toHaveLength(1);
      expect(stateAfterOptimistic.encounters[0].id).toBe('1'); // dynamic increment optimistic id
      expect(stateAfterOptimistic.encounters[0].name).toBe('Goblin Ambush');

      // 2. addEncounterDB call
      expect(addEncounterDB).toHaveBeenCalledWith('Goblin Ambush', 'Woods', 2, 0);

      // 3. Replaces optimistic with real ID
      const secondCallFn = updateStateSpy.mock.calls[1][0];
      const stateAfterReal = secondCallFn({
        encounters: [stateAfterOptimistic.encounters[0]],
      });
      expect(stateAfterReal.encounters[0].id).toBe('real-enc-99');

      // 4. Success Toast & onSyncRequested
      expect(toast.success).toHaveBeenCalledWith('Goblin Ambush added to Encounters');
      expect(mockOnSyncRequested).toHaveBeenCalled();
    });

    it('rolls back state if addEncounterDB throws', async () => {
      const mockDifficulties = { 1: 'Easy' };
      const updateStateSpy = vi.fn();
      const mockInitialState = { encounters: [], difficulties: mockDifficulties };
      vi.mocked(useAppState).mockReturnValue({
        state: mockInitialState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);

      const mockOnSelectEncounter = vi.fn();
      const mockOnSyncRequested = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => useEncounters({
        onSelectEncounter: mockOnSelectEncounter,
        onSyncRequested: mockOnSyncRequested,
      }));

      // Mock addEncounterDB rejection
      vi.mocked(addEncounterDB).mockRejectedValue(new Error('Failed to save'));

      await act(async () => {
        await result.current.handleCreateEncounter({
          name: 'Goblin Ambush',
          location: 'Woods',
          difficultyId: 1,
        });
      });

      // Assert rollback
      expect(updateStateSpy).toHaveBeenLastCalledWith(mockInitialState);
      expect(result.current.globalError).toBe('Unable to create a new encounter at this time. Please try again.');
    });
  });

  describe('handleDelete relational logic', () => {
    it('removes encounter and linked combatants, then calls deleteEncounterFully and syncs', async () => {
      const mockEnc = { id: 'enc-1', name: 'Goblin Ambush' };
      const mockCombatant1 = { id: 'ec-1', encounterId: 'enc-1' };
      const mockCombatant2 = { id: 'ec-2', encounterId: 'enc-2' };

      const updateStateSpy = vi.fn();
      const mockInitialState = {
        encounters: [mockEnc],
        encounterCombatants: [mockCombatant1, mockCombatant2],
      };
      vi.mocked(useAppState).mockReturnValue({
        state: mockInitialState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);

      vi.mocked(deleteEncounterFully).mockResolvedValue(undefined as any);

      const mockOnSelectEncounter = vi.fn();
      const mockOnSyncRequested = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => useEncounters({
        onSelectEncounter: mockOnSelectEncounter,
        onSyncRequested: mockOnSyncRequested,
      }));

      await act(async () => {
        await result.current.handleDelete(mockEnc as any);
      });

      // Local state filtering check
      expect(updateStateSpy).toHaveBeenCalled();
      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockInitialState);
      expect(nextState.encounters).not.toContain(mockEnc);
      expect(nextState.encounterCombatants).toHaveLength(1);
      expect(nextState.encounterCombatants[0].encounterId).toBe('enc-2');

      // deleteEncounterFully DB call check
      expect(deleteEncounterFully).toHaveBeenCalledWith('enc-1');
      expect(mockOnSyncRequested).toHaveBeenCalled();
    });

    it('rolls back state if deleteEncounterFully throws', async () => {
      const mockEnc = { id: 'enc-1', name: 'Goblin Ambush' };
      const mockCombatant1 = { id: 'ec-1', encounterId: 'enc-1' };

      const updateStateSpy = vi.fn();
      const mockInitialState = {
        encounters: [mockEnc],
        encounterCombatants: [mockCombatant1],
      };
      vi.mocked(useAppState).mockReturnValue({
        state: mockInitialState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);

      vi.mocked(deleteEncounterFully).mockRejectedValue(new Error('Cascade deletion failed'));

      const mockOnSelectEncounter = vi.fn();
      const mockOnSyncRequested = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => useEncounters({
        onSelectEncounter: mockOnSelectEncounter,
        onSyncRequested: mockOnSyncRequested,
      }));

      await act(async () => {
        await result.current.handleDelete(mockEnc as any);
      });

      // Rollback checklist: should reset both encounters and encounterCombatants
      expect(updateStateSpy).toHaveBeenLastCalledWith(mockInitialState);
      expect(result.current.globalError).toBe('Failed to delete "Goblin Ambush". It might be heavily linked to combatants.');
    });
  });
});
