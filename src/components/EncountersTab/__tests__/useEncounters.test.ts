import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEncounters } from '../hooks/useEncounters';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { addEncounterDB, deleteEncounterFully, updateEncounterDB } from '../../../services/dbOperations';

vi.mock('../../../services/dbOperations', () => ({
  addEncounterDB: vi.fn().mockResolvedValue({ id: 'real-enc-1', name: 'Goblin Ambush', location: 'Woods', difficultyId: 2, status: 'planned', difficultyName: 'Medium' }),
  deleteEncounterFully: vi.fn().mockResolvedValue(undefined),
  updateEncounterDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn()
}));

describe('useEncounters', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('handleCreateEncounter passes correct arguments to addEncounterDB', async () => {
    const updateStateSpy = vi.fn();
    vi.mocked(useAppState).mockReturnValue({
      state: {
        encounters: [],
        difficulties: { 1: 'Easy', 2: 'Medium' }
      } as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);

    const { result } = renderHook(() =>
      useEncounters({
        onSelectEncounter: vi.fn(),
        onSyncRequested: vi.fn()
      })
    );

    await act(async () => {
      await result.current.handleCreateEncounter({
        name: 'Goblin Ambush',
        location: 'Woods',
        difficultyId: 2
      });
    });

    // Assert exact arguments reached DB
    expect(addEncounterDB).toHaveBeenCalledWith(
      'Goblin Ambush',
      'Woods',
      2,
      0
    );

    // Assert optimistic encounter appeared
    // in state before DB response
    const firstCall = updateStateSpy.mock.calls[0][0];
    const stateAfterOptimistic = firstCall({
      encounters: [],
      difficulties: { 1: 'Easy', 2: 'Medium' }
    });
    expect(stateAfterOptimistic.encounters)
      .toHaveLength(1);
    expect(stateAfterOptimistic.encounters[0])
      .toMatchObject({
        name: 'Goblin Ambush',
        location: 'Woods',
        difficultyId: 2,
      });
  });

  it('handleDeleteEncounter passes correct id to deleteEncounterFully and removes encounter from state', async () => {
    const mockEnc = {
      id: 'enc-1',
      name: 'Goblin Ambush',
      location: 'Woods'
    };
    const updateStateSpy = vi.fn();
    vi.mocked(useAppState).mockReturnValue({
      state: {
        encounters: [mockEnc],
        encounterCombatants: []
      } as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);

    const { result } = renderHook(() =>
      useEncounters({
        onSelectEncounter: vi.fn(),
        onSyncRequested: vi.fn()
      })
    );

    await act(async () => {
      await result.current.handleDelete(
        mockEnc as any
      );
    });

    // Assert correct ID was passed to DB
    expect(deleteEncounterFully)
      .toHaveBeenCalledWith('enc-1');

    // Assert encounter was filtered from
    // optimistic state update
    const firstCall =
      updateStateSpy.mock.calls[0][0];
    const stateAfterDelete = firstCall({
      encounters: [mockEnc],
      encounterCombatants: []
    });
    expect(stateAfterDelete.encounters)
      .toHaveLength(0);
  });

  it('handleCreateEncounter writes all required fields and appears in store', async () => {
    const updateStateSpy = vi.fn();
    const initialState = { encounters: [], difficulties: { 3: 'Hard' } };
    vi.mocked(useAppState).mockReturnValue({
      state: initialState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn().mockReturnValue(initialState),
    } as any);

    const { result } = renderHook(() => useEncounters({ onSelectEncounter: vi.fn(), onSyncRequested: vi.fn() }));
    const encounterData = { name: 'Goblin Ambush', location: 'Dark Forest', difficultyId: 3 };

    await act(async () => {
      await result.current.handleCreateEncounter(encounterData);
    });

    expect(addEncounterDB).toHaveBeenCalledWith(
      'Goblin Ambush',
      'Dark Forest',
      3,
      0
    );
    
    // Check optimistic update
    const stateUpdater = updateStateSpy.mock.calls[0][0];
    const nextState = stateUpdater(initialState);
    expect(nextState.encounters.length).toBe(1);
    expect(nextState.encounters[0].name).toBe('Goblin Ambush');
  });

  it('Failed encounter creation rolls back state', async () => {
    const updateStateSpy = vi.fn();
    const initialState = { encounters: [], difficulties: { 1: 'Easy' } };
    vi.mocked(useAppState).mockReturnValue({
      state: initialState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn().mockReturnValue(initialState),
    } as any);

    vi.mocked(addEncounterDB).mockRejectedValue(new Error('Fail'));

    const { result } = renderHook(() => useEncounters({ onSelectEncounter: vi.fn(), onSyncRequested: vi.fn() }));
    
    await act(async () => {
      await result.current.handleCreateEncounter({ name: 'Fail', location: '', difficultyId: 1 });
    });

    // Optimistic update + rollback
    expect(updateStateSpy).toHaveBeenCalledTimes(2);
    const lastCall = updateStateSpy.mock.calls[1][0];
    const restoredState = typeof lastCall === 'function' ? lastCall(initialState) : lastCall;
    expect(restoredState).toEqual(initialState);
  });

  it('handleUpdateEncounter updates encounter in state and calls the DB', async () => {
    const updateStateSpy = vi.fn();
    const initialState = {
      encounters: [{ id: 'enc-1', name: 'Goblin Ambush', location: 'Woods', difficultyId: 2 }],
      difficulties: { 1: 'Easy', 2: 'Medium', 3: 'Hard' }
    };
    vi.mocked(useAppState).mockReturnValue({
      state: initialState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn().mockReturnValue(initialState),
    } as any);

    const { result } = renderHook(() => useEncounters({ onSelectEncounter: vi.fn(), onSyncRequested: vi.fn() }));
    
    await act(async () => {
      await result.current.handleUpdateEncounter('enc-1', 'Dragon Lair', 'Cave', 3);
    });

    expect(updateEncounterDB).toHaveBeenCalledWith('enc-1', 'Dragon Lair', 'Cave', 3);
    
    // Check optimistic update
    const stateUpdater = updateStateSpy.mock.calls[0][0];
    const nextState = stateUpdater(initialState);
    expect(nextState.encounters[0].name).toBe('Dragon Lair');
    expect(nextState.encounters[0].location).toBe('Cave');
    expect(nextState.encounters[0].difficultyId).toBe(3);
  });

  it('rolls back state when encounter deletion fails', async () => {
    const mockEnc = {
      id: 'enc-1',
      name: 'Goblin Ambush',
      location: 'Woods',
      difficultyId: 2,
    };

    const initialState = {
      encounters: [mockEnc],
      encounterCombatants: [],
    };

    // Make deleteEncounterFully fail
    vi.mocked(deleteEncounterFully).mockRejectedValueOnce(
      new Error('Delete failed')
    );

    const updateStateSpy = vi.fn();
    vi.mocked(useAppState).mockReturnValue({
      state: initialState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);

    const { result } = renderHook(() =>
      useEncounters({
        onSelectEncounter: vi.fn(),
        onSyncRequested: vi.fn(),
      })
    );

    await act(async () => {
      try {
        await result.current.handleDelete(mockEnc as any);
      } catch {
        // expected
      }
    });

    // The first updateState call removes the encounter (optimistic delete)
    // The last updateState call restores it (rollback)
    const calls = updateStateSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(1);

    // Last call should restore original state containing the encounter
    const lastCall = calls[calls.length - 1][0];
    const restoredState = typeof lastCall === 'function' ? lastCall(initialState) : lastCall;

    expect(restoredState).toEqual(initialState);
  });
});
