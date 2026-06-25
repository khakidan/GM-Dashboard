import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEncounters } from '../hooks/useEncounters';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { addEncounterDB, deleteEncounterFully } from '../../../services/dbOperations';

vi.mock('../../../services/dbOperations', () => ({
  addEncounterDB: vi.fn().mockResolvedValue({ id: 'real-enc-1', name: 'Goblin Ambush', location: 'Woods', difficultyId: 2, status: 'planned', difficultyName: 'Medium' }),
  deleteEncounterFully: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn()
}));

describe('useEncounters', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('handleCreateEncounter adds an encounter to store state and calls the DB', async () => {
    const updateStateSpy = vi.fn();
    vi.mocked(useAppState).mockReturnValue({
      state: { encounters: [], difficulties: { 1: 'Easy', 2: 'Medium' } } as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);

    const { result } = renderHook(() => useEncounters({ onSelectEncounter: vi.fn(), onSyncRequested: vi.fn() }));
    
    await act(async () => {
      await result.current.handleCreateEncounter({ name: 'Goblin Ambush', location: 'Woods', difficultyId: 2 });
    });

    expect(addEncounterDB).toHaveBeenCalled();
    expect(updateStateSpy).toHaveBeenCalled();
  });

  it('handleDeleteEncounter removes the encounter from store state', async () => {
    const mockEnc = { id: 'enc-1', name: 'Goblin Ambush', location: 'Woods' };
    const updateStateSpy = vi.fn();
    vi.mocked(useAppState).mockReturnValue({
      state: { encounters: [mockEnc], encounterCombatants: [] } as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);

    const { result } = renderHook(() => useEncounters({ onSelectEncounter: vi.fn(), onSyncRequested: vi.fn() }));
    
    await act(async () => {
      await result.current.handleDelete(mockEnc as any);
    });

    expect(deleteEncounterFully).toHaveBeenCalled();
    expect(updateStateSpy).toHaveBeenCalled();
  });
});
