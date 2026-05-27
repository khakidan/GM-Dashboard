import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEncounters } from '../hooks/useEncounters';
import { useAppState } from '../../../hooks/useAppState';
import { deleteEncounterFully } from '../../../services/dbOperations';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../../../services/dbOperations', () => ({
  deleteEncounterFully: vi.fn().mockResolvedValue(undefined),
  createEncounterDB: vi.fn(),
}));

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn()
}));

const mockSyncRequested = vi.fn().mockResolvedValue(undefined);

describe('useEncounters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers a success toast with the encounter name on deletion', async () => {
    const mockEnc = { id: 'enc-1', name: 'Goblin Ambush', location: 'Woods' };
    vi.mocked(useAppState).mockReturnValue({
      state: { encounters: [mockEnc], encounterCombatants: [] } as any,
      updateState: vi.fn()
    });

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
});
