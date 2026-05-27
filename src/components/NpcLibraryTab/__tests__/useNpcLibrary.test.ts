import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNpcLibrary } from '../hooks/useNpcLibrary';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { deleteNpcDB } from '../../../services/dbOperations';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../../../services/dbOperations', () => ({
  deleteNpcDB: vi.fn().mockResolvedValue(undefined),
  resetNpcHpDB: vi.fn(),
  addNpcDB: vi.fn(),
  updateNpcFullDB: vi.fn(),
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
  });
});
