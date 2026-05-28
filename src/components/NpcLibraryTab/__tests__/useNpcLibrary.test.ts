import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNpcLibrary } from '../hooks/useNpcLibrary';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { deleteNpcDB, resetNpcHpDB, addNpcDB, updateNpcFullDB } from '../../../services/dbOperations';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../../../services/dbOperations', () => ({
  deleteNpcDB: vi.fn().mockResolvedValue(undefined),
  resetNpcHpDB: vi.fn().mockResolvedValue(undefined),
  addNpcDB: vi.fn().mockResolvedValue({ id: 'npc-new', name: 'New NPC', ac: 15, maxHp: 20, currentHp: 20, tempHp: 0, conditions: 'None', notes: '' }),
  updateNpcFullDB: vi.fn().mockResolvedValue(undefined),
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

  it('triggers a success toast with the NPC name on deletion', async () => {
    const mockNpc = { id: 'npc-1', name: 'Goblin', ac: 10, maxHp: 10, currentHp: 10, tempHp: 0 };
    vi.mocked(useAppState).mockReturnValue({
      state: { npcs: [mockNpc] } as any,
      updateState: vi.fn()
    });
    vi.mocked(getSnapshot).mockReturnValue({ npcs: [mockNpc] } as any);

    const { result } = renderHook(() => useNpcLibrary());
    
    await act(async () => {
      await result.current.handleDeleteNpc('npc-1');
    });

    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Goblin'));
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('removed from library'));
    expect(deleteNpcDB).toHaveBeenCalledWith('npc-1');
  });

  it('resets NPC HP and calls resetNpcHpDB', async () => {
    const mockNpc = { id: 'npc-1', name: 'Goblin', ac: 10, maxHp: 25, currentHp: 5, tempHp: 0 };
    const updateSpy = vi.fn();
    vi.mocked(useAppState).mockReturnValue({
      state: { npcs: [mockNpc] } as any,
      updateState: updateSpy
    });
    vi.mocked(getSnapshot).mockReturnValue({ npcs: [mockNpc] } as any);

    const { result } = renderHook(() => useNpcLibrary());

    await act(async () => {
      await result.current.handleResetNpcHp('npc-1', 25);
    });

    expect(resetNpcHpDB).toHaveBeenCalledWith('npc-1', 25);
    expect(updateSpy).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('NPC HP reset successfully!');
  });

  it('adds an NPC and triggers a success toast', async () => {
    const updateSpy = vi.fn();
    vi.mocked(useAppState).mockReturnValue({
      state: { npcs: [] } as any,
      updateState: updateSpy
    });

    const { result } = renderHook(() => useNpcLibrary());

    await act(async () => {
      await result.current.handleAddNpc({
        name: 'New NPC',
        ac: 15,
        maxHp: 20,
        currentHp: 20,
        tempHp: 0,
        conditions: 'None',
        notes: '',
        resistances: '',
        immunities: '',
        vulnerabilities: ''
      });
    });

    expect(addNpcDB).toHaveBeenCalledWith('New NPC', 20, 15, '', '', '', '');
    expect(updateSpy).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('New NPC added to NPC Library');
  });

  it('updates target NPC and invokes updateNpcFullDB', async () => {
    const mockNpc = { id: 'npc-1', name: 'Goblin', ac: 10, maxHp: 10, currentHp: 10, tempHp: 0 };
    const updateSpy = vi.fn();
    vi.mocked(useAppState).mockReturnValue({
      state: { npcs: [mockNpc] } as any,
      updateState: updateSpy
    });
    vi.mocked(getSnapshot).mockReturnValue({ npcs: [{ ...mockNpc, maxHp: 12 }] } as any);

    const { result } = renderHook(() => useNpcLibrary());

    await act(async () => {
      await result.current.handleUpdateNpc('npc-1', { maxHp: 12 });
    });

    expect(updateNpcFullDB).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalled();
  });
});
