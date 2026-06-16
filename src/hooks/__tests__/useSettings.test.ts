// src/hooks/__tests__/useSettings.test.ts

import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { useSettings } from '../useSettings';
import { STORAGE_KEYS } from '../../lib/constants';
import { toast } from 'sonner';
import * as sheetsService from '../../services/sheetsService';
import * as googleAuth from '../../services/googleAuth';

// Mock sonner
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    promise: vi.fn().mockImplementation((val) => val),
  }),
}));

// Mock sheetsService
vi.mock('../../services/sheetsService', () => ({
  getSpreadsheetId: vi.fn().mockReturnValue('mock-id'),
  setSpreadsheetId: vi.fn(),
}));

// Mock googleAuth
vi.mock('../../services/googleAuth', () => ({
  setManualRefreshToken: vi.fn(),
  clearTokens: vi.fn(),
}));

// Mock useTheme
vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'default',
    setTheme: vi.fn(),
  }),
}));

// Mock useAppState
const mockUpdateState = vi.fn();
vi.mock('../useAppState', () => ({
  useAppState: () => ({
    updateState: mockUpdateState,
  }),
}));

// Mock useOverlayEvents
vi.mock('../useOverlayEvents', () => ({
  useDeathEvent: () => ({ fire: vi.fn() }),
  useDamageEvent: () => ({ fire: vi.fn() }),
  useHealEvent: () => ({ fire: vi.fn() }),
  useUnconsciousEvent: () => ({ fire: vi.fn() }),
  useRageEvent: () => ({ fire: vi.fn() }),
  useInitiativeEvent: () => ({ fire: vi.fn() }),
}));

describe('useSettings', () => {
  const mockProps = {
    isGoogleConnected: false,
    handleSignIn: vi.fn(),
    handleSignOut: vi.fn(),
    setIsGoogleConnected: vi.fn(),
    handleSyncWithSheets: vi.fn().mockResolvedValue(undefined),
    addLog: vi.fn(),
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('isSoundEnabled returns true by default', () => {
    const { result } = renderHook(() => useSettings(mockProps));
    expect(result.current.isSoundEnabled).toBe(true);
  });

  it('isSoundEnabled returns false when STORAGE_KEYS.soundsEnabled is "false" in localStorage', () => {
    localStorage.setItem(STORAGE_KEYS.soundsEnabled, 'false');
    const { result } = renderHook(() => useSettings(mockProps));
    expect(result.current.isSoundEnabled).toBe(false);
  });

  it('toggleSound updates localStorage and flips the isSoundEnabled value', () => {
    const { result } = renderHook(() => useSettings(mockProps));
    expect(result.current.isSoundEnabled).toBe(true);

    act(() => {
      result.current.toggleSound();
    });

    expect(result.current.isSoundEnabled).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.soundsEnabled)).toBe('false');
    expect(toast.success).toHaveBeenCalledWith('Sound effects disabled');

    act(() => {
      result.current.toggleSound();
    });

    expect(result.current.isSoundEnabled).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.soundsEnabled)).toBe('true');
    expect(toast.success).toHaveBeenCalledWith('Sound effects enabled');
  });

  it('handleSignOut clears auth tokens and resets relevant state', () => {
    const { result } = renderHook(() => useSettings(mockProps));

    act(() => {
      result.current.handleSignOutWithClear();
    });

    expect(googleAuth.clearTokens).toHaveBeenCalledTimes(1);
    expect(mockProps.setIsGoogleConnected).toHaveBeenCalledWith(false);
    expect(mockProps.handleSignOut).toHaveBeenCalledTimes(1);
    expect(mockProps.addLog).toHaveBeenCalledWith('Signed out of Google Account.');
  });

  describe('JSON import functionality', () => {
    it('importing a valid JSON file updates state correctly', async () => {
      const { result } = renderHook(() => useSettings(mockProps));
      const validJson = JSON.stringify({
        campaignName: 'Epic Campaign',
        characters: [{ id: '1', name: 'Legend' }],
      });

      let importResult;
      await act(async () => {
        importResult = await result.current.importCampaignDataJson(validJson);
      });

      expect(importResult).toBe(true);
      expect(mockUpdateState).toHaveBeenCalled();
      const updateFn = mockUpdateState.mock.calls[0][0];
      const prevDummyState = {};
      const updatedState = updateFn(prevDummyState);
      expect(updatedState.campaignName).toBe('Epic Campaign');
      expect(updatedState.characters).toEqual([{ id: '1', name: 'Legend' }]);
      expect(toast.success).toHaveBeenCalledWith('Campaign data imported successfully');
    });

    it('importing malformed JSON shows an error toast and does not update state', async () => {
      const { result } = renderHook(() => useSettings(mockProps));
      const invalidJson = 'invalid-json}';

      await expect(
        act(async () => {
          await result.current.importCampaignDataJson(invalidJson);
        })
      ).rejects.toThrow();

      expect(mockUpdateState).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Import Failed: Malformed campaign JSON', expect.any(Object));
    });

    it('importing JSON with valid JSON structure but missing relevant campaign keys still fails validation', async () => {
      const { result } = renderHook(() => useSettings(mockProps));
      const keysMissingJson = JSON.stringify({
        somethingElse: 'completely irrelevant data',
      });

      await expect(
        act(async () => {
          await result.current.importCampaignDataJson(keysMissingJson);
        })
      ).rejects.toThrow('Invalid campaign backup schema');

      expect(mockUpdateState).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Import Failed: Malformed campaign JSON', expect.any(Object));
    });
  });

  describe('Database and Spreadsheet config operations', () => {
    it('handleSaveSpreadsheet saves ID and syncs', async () => {
      const { result } = renderHook(() => useSettings(mockProps));
      
      await act(async () => {
        await result.current.handleSaveSpreadsheet();
      });

      expect(sheetsService.setSpreadsheetId).toHaveBeenCalledWith('mock-id');
      expect(mockProps.handleSyncWithSheets).toHaveBeenCalledWith(false);
      expect(toast.promise).toHaveBeenCalled();
    });

    it('handleApplyManualToken saves manual refresh token and sets isGoogleConnected to true', async () => {
      const { result } = renderHook(() => useSettings(mockProps));

      act(() => {
        result.current.setManualTokenState('fake-refresh-token');
      });

      await act(async () => {
        await result.current.handleApplyManualToken();
      });

      expect(googleAuth.setManualRefreshToken).toHaveBeenCalledWith('fake-refresh-token');
      expect(mockProps.setIsGoogleConnected).toHaveBeenCalledWith(true);
      expect(toast.success).toHaveBeenCalledWith('Refresh Token Saved!');
      expect(result.current.manualToken).toBe('');
      expect(result.current.showAdvancedAuth).toBe(false);
    });
  });
});
