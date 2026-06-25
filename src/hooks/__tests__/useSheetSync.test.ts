import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSheetSync } from '../useSheetSync';
import { useAppState } from '../useAppState';
import * as sheetsService from '../../services/sheetsService';

vi.mock('../../services/writeQueue', () => ({
  clearRetryQueue: vi.fn(),
}));

vi.mock('../../services/sheetsService', () => ({
  fetchSheetData: vi.fn(),
  initializeDatabaseSchema: vi.fn(),
  getSpreadsheetId: vi.fn().mockReturnValue('mock-id'),
}));

vi.mock('../useAppState', () => ({
  useAppState: vi.fn(),
}));

describe('useSheetSync State Transition Tests', () => {
  const setIsGoogleConnected = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pulls all sheet data and populates characters, npcs, and encounters in the store', async () => {
    let updateStateCalledWith: any = null;
    vi.mocked(useAppState).mockReturnValue({
      state: { hasInitialSynced: false },
      updateState: (fn: any) => { 
        updateStateCalledWith = typeof fn === 'function' ? fn({}) : fn; 
      }
    } as any);

    vi.mocked(sheetsService.initializeDatabaseSchema).mockResolvedValue(undefined);
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['1', 'Goblin']] });

    const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected }));

    await act(async () => {
      await result.current.handleSyncWithSheets(false);
    });

    expect(updateStateCalledWith).not.toBeNull();
    expect(updateStateCalledWith.characters).toBeDefined();
    expect(updateStateCalledWith.npcs).toBeDefined();
    expect(updateStateCalledWith.encounters).toBeDefined();
  });

  it('resets hasInitialSynced to true upon successful initial load', async () => {
    let updateStateCalledWith: any = null;
    vi.mocked(useAppState).mockReturnValue({
      state: { hasInitialSynced: false },
      updateState: (fn: any) => { 
        updateStateCalledWith = typeof fn === 'function' ? fn({}) : fn; 
      }
    } as any);

    vi.mocked(sheetsService.initializeDatabaseSchema).mockResolvedValue(undefined);
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['1', 'data']] });

    const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected }));

    await act(async () => {
      await result.current.handleSyncWithSheets(false);
    });

    expect(updateStateCalledWith.hasInitialSynced).toBe(true);
  });

  it('handles API errors by triggering a rollback or setting an error state', async () => {
    let updateStateCalledWith: any = null;
    vi.mocked(useAppState).mockReturnValue({
      state: { hasInitialSynced: false },
      updateState: (fn: any) => { 
        updateStateCalledWith = typeof fn === 'function' ? fn({}) : fn; 
      }
    } as any);

    vi.mocked(sheetsService.initializeDatabaseSchema).mockRejectedValue(new Error('API failure'));

    const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected }));

    await act(async () => {
      await result.current.handleSyncWithSheets(false);
    });

    expect(updateStateCalledWith).toBeNull(); // No state update upon failure
    expect(result.current.syncError).toBe('API failure');
  });
});
