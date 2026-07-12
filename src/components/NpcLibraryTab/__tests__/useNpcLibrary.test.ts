import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useNpcLibrary } from '../hooks/useNpcLibrary';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { deleteNpcDB, updateNpcFullDB, addNpcDB } from '../../../services/dbOperations';

vi.mock('../../../services/dbOperations', () => ({
  deleteNpcDB: vi.fn(),
  updateNpcFullDB: vi.fn(),
  addNpcDB: vi.fn().mockResolvedValue({ id: 'new-npc' }),
  resetNpcHpDB: vi.fn(),
}));

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn()
}));

describe('useNpcLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
  });
  afterEach(() => vi.restoreAllMocks());

  it('handleUpdateNpc updates the state and calls the DB', async () => {
    const updateStateSpy = vi.fn();
    const mockState = { npcs: [{ id: 'npc-1', name: 'Goblin' }], encounterCombatants: [], combatState: { combatants: [] } };
    const mockGetSnapshot = vi.fn().mockReturnValue({
      npcs: [{ id: 'npc-1', name: 'Goblin', maxHp: 30 }],
      encounterCombatants: [],
      combatState: { combatants: [] }
    });
    
    vi.mocked(useAppState).mockReturnValue({
      state: mockState as any,
      updateState: updateStateSpy,
      getSnapshot: mockGetSnapshot,
    } as any);

    const { result } = renderHook(() => useNpcLibrary());
    
    await act(async () => {
      await result.current.handleUpdateNpc('npc-1', { maxHp: 30 });
    });

    expect(updateNpcFullDB).toHaveBeenCalledWith(expect.objectContaining({ id: 'npc-1', maxHp: 30 }));
    expect(updateStateSpy).toHaveBeenCalled();
  });

  it('handleUpdateNpc sends the merged update to updateNpcFullDB even when the update includes multiple fields', async () => {
    const updateStateSpy = vi.fn();
    const mockState = { npcs: [{ id: 'npc-1', name: 'Goblin', maxHp: 10, ac: 15 }], encounterCombatants: [], combatState: { combatants: [] } };
    const mockGetSnapshot = vi.fn().mockReturnValue({
      npcs: [{ id: 'npc-1', name: 'Goblin', maxHp: 30, ac: 18 }],
      encounterCombatants: [],
      combatState: { combatants: [] }
    });
    
    vi.mocked(useAppState).mockReturnValue({
      state: mockState as any,
      updateState: updateStateSpy,
      getSnapshot: mockGetSnapshot,
    } as any);

    const { result } = renderHook(() => useNpcLibrary());
    
    await act(async () => {
      await result.current.handleUpdateNpc('npc-1', { maxHp: 30, ac: 18 });
    });

    expect(updateNpcFullDB).toHaveBeenCalledWith(expect.objectContaining({ id: 'npc-1', maxHp: 30, ac: 18 }));
    expect(updateStateSpy).toHaveBeenCalled();
  });

  it('handleDeleteNpc removes the NPC from state and calls the DB', async () => {
    const updateStateSpy = vi.fn();
    const mockState = { npcs: [{ id: 'npc-1', name: 'Goblin' }] };
    
    vi.mocked(useAppState).mockReturnValue({
      state: mockState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue(mockState as any);

    const { result } = renderHook(() => useNpcLibrary());
    
    await act(async () => {
      await result.current.handleDeleteNpc('npc-1');
    });

    expect(deleteNpcDB).toHaveBeenCalledWith('npc-1');
    expect(updateStateSpy).toHaveBeenCalled();
  });

  it('handleAddNpc adds the NPC to state and calls the DB', async () => {
    const updateStateSpy = vi.fn();
    vi.mocked(useAppState).mockReturnValue({
      state: { npcs: [] } as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);

    const { result } = renderHook(() => useNpcLibrary());
    
    await act(async () => {
      await result.current.handleAddNpc({ name: 'Orc' } as any);
    });

    expect(addNpcDB).toHaveBeenCalled();
    expect(updateStateSpy).toHaveBeenCalled();
  });
});
