import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useParty } from '../hooks/useParty';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { deleteCharacterFully, addCharacterDB, updateCharacterDB } from '../../../services/dbOperations';

vi.mock('../../../services/dbOperations', () => ({
  deleteCharacterFully: vi.fn().mockResolvedValue(undefined),
  addCharacterDB: vi.fn(),
  updateCharacterDB: vi.fn(),
}));

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn()
}));

describe('useParty - Character CRUD', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('handleUpdate writes changed fields to the database', async () => {
    const mockChar = { id: 'char-1', characterName: 'Testo' };
    vi.mocked(useAppState).mockReturnValue({
      state: { characters: [mockChar] } as any,
      updateState: vi.fn(),
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue({ characters: [mockChar] } as any);

    const { result } = renderHook(() => useParty());
    
    await act(async () => {
      await result.current.handleUpdate('char-1', { maxHp: 50 });
    });

    expect(updateCharacterDB).toHaveBeenCalledWith(expect.objectContaining({ maxHp: 50 }), expect.objectContaining({ id: 'char-1' }));
  });

  it('handleUpdate rolls back state when the DB write fails', async () => {
    const updateStateSpy = vi.fn();
    const mockState = { characters: [{ id: 'char-1', maxHp: 20 }] };

    vi.mocked(useAppState).mockReturnValue({
      state: mockState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue(mockState as any);
    vi.mocked(updateCharacterDB).mockRejectedValue(new Error('Fail'));

    const { result } = renderHook(() => useParty());
    
    await act(async () => {
      await result.current.handleUpdate('char-1', { maxHp: 50 });
    });

    // One optimistic update, one rollback
    expect(updateStateSpy).toHaveBeenCalledTimes(2);
  });

  it('handleDelete removes the character from store state and calls deleteCharacterDB', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    const updateStateSpy = vi.fn();
    const mockState = { characters: [{ id: 'char-1' }] };

    vi.mocked(useAppState).mockReturnValue({
      state: mockState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue(mockState as any);

    const { result } = renderHook(() => useParty());
    
    await act(async () => {
      await result.current.handleDeletePlayer('char-1');
    });

    expect(deleteCharacterFully).toHaveBeenCalled();
    expect(updateStateSpy).toHaveBeenCalledTimes(1); // optimistic update
  });
});
