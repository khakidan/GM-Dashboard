import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { useSettings } from '../useSettings';
import * as sheetsService from '../../services/sheetsService';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    promise: vi.fn().mockImplementation((val) => val),
  }),
}));

vi.mock('../../services/sheetsService', () => ({
  getSpreadsheetId: vi.fn().mockReturnValue('mock-id'),
  setSpreadsheetId: vi.fn(),
  resolveActiveSpreadsheetId: vi.fn().mockReturnValue('mock-id'),
}));

vi.mock('../../services/googleAuth', () => ({
  setManualRefreshToken: vi.fn(),
  clearTokens: vi.fn(),
}));

const mockSetTheme = vi.fn();
vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
  }),
}));

const mockUpdateState = vi.fn();
const mockState = {
  campaignName: 'Test Campaign',
  characters: [{ id: '1', name: 'Legend' }],
  npcs: [],
  encounters: [],
  encounterCombatants: []
};

vi.mock('../useAppState', () => ({
  useAppState: () => ({
    state: mockState,
    updateState: mockUpdateState,
  }),
}));

vi.mock('../useCombatOverlayEvents', () => ({
  useDeathEvent: () => ({ fire: vi.fn() }),
  useDamageEvent: () => ({ fire: vi.fn() }),
  useHealEvent: () => ({ fire: vi.fn() }),
  useUnconsciousEvent: () => ({ fire: vi.fn() }),
  useRageEvent: () => ({ fire: vi.fn() }),
  useInitiativeEvent: () => ({ fire: vi.fn() }),
}));

describe('useSettings State Transition Tests', () => {
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

  it('loads and saves settings to localStorage', () => {
    const { result } = renderHook(() => useSettings(mockProps));

    // Verify loading Spreadsheet ID
    expect(result.current.tempSpreadsheetId).toBe('mock-id');

    // Verify saving Spreadsheet ID calls setSpreadsheetId
    act(() => {
      result.current.setTempSpreadsheetId('new-sheet-id');
    });
    act(() => {
      result.current.handleSaveSpreadsheet();
    });
    expect(sheetsService.setSpreadsheetId).toHaveBeenCalledWith('new-sheet-id');

    // Verify theme interaction
    act(() => {
      result.current.setTheme('sleek-modern');
    });
    expect(mockSetTheme).toHaveBeenCalledWith('sleek-modern');
  });

  it('exports settings payload correctly', async () => {
    const mockCreateObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
    const mockRevokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const mockClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const { result } = renderHook(() => useSettings(mockProps));

    act(() => {
      result.current.handleExportJSON();
    });

    expect(mockCreateObjectURL).toHaveBeenCalled();
    const blobCall = mockCreateObjectURL.mock.calls[0][0] as Blob;
    expect(blobCall.type).toBe('application/json');

    const text = await blobCall.text();
    const parsed = JSON.parse(text);
    expect(parsed.campaignName).toBe('Test Campaign');
    expect(parsed.characters).toEqual([{ id: '1', name: 'Legend' }]);
    expect(toast.success).toHaveBeenCalledWith('Campaign exported successfully');

    mockCreateObjectURL.mockRestore();
    mockRevokeObjectURL.mockRestore();
    mockClick.mockRestore();
  });

  describe('importCampaignDataJson', () => {
    it('accepts a valid well-formed backup and updates state', async () => {
      const { result } = renderHook(() => useSettings(mockProps));
      const validBackup = JSON.stringify({
        campaignName: 'New Campaign',
        characters: [{ id: 'c1', name: 'Char 1' }],
        npcs: [{ id: 'n1', name: 'NPC 1' }],
        encounters: [{ id: 'e1', name: 'Enc 1' }],
        encounterCombatants: [{ id: 'ec1', name: 'Comb 1' }]
      });

      const success = await act(async () => {
        return await result.current.importCampaignDataJson(validBackup);
      });

      expect(success).toBe(true);
      expect(mockUpdateState).toHaveBeenCalled();
      const stateUpdateFn = mockUpdateState.mock.calls[0][0];
      const newState = stateUpdateFn({});
      expect(newState.campaignName).toBe('New Campaign');
      expect(newState.characters).toEqual([{ id: 'c1', name: 'Char 1' }]);
      expect(toast.success).toHaveBeenCalledWith('Campaign data imported successfully');
    });

    it('rejects backup if an array item is missing its id field', async () => {
      const { result } = renderHook(() => useSettings(mockProps));
      const invalidBackup = JSON.stringify({
        characters: [{ name: 'Missing ID' }]
      });

      await act(async () => {
        await expect(result.current.importCampaignDataJson(invalidBackup)).rejects.toThrow();
      });

      expect(mockUpdateState).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        'Import Failed: Malformed campaign JSON',
        expect.objectContaining({ description: expect.stringContaining('Invalid backup schema at characters.0.id') })
      );
    });

    it('rejects backup if an array item has an empty-string id', async () => {
      const { result } = renderHook(() => useSettings(mockProps));
      const invalidBackup = JSON.stringify({
        npcs: [{ id: '', name: 'Empty ID' }]
      });

      await act(async () => {
        await expect(result.current.importCampaignDataJson(invalidBackup)).rejects.toThrow();
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Import Failed: Malformed campaign JSON',
        expect.objectContaining({ description: expect.stringContaining('Too small: expected string to have >=1 characters') })
      );
    });

    it('rejects backup if a top-level field is wrong type', async () => {
      const { result } = renderHook(() => useSettings(mockProps));
      const invalidBackup = JSON.stringify({
        encounters: "not an array"
      });

      await act(async () => {
        await expect(result.current.importCampaignDataJson(invalidBackup)).rejects.toThrow();
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Import Failed: Malformed campaign JSON',
        expect.objectContaining({ description: expect.stringContaining('expected array, received string') })
      );
    });

    it('filters out extra keys from state update', async () => {
      const { result } = renderHook(() => useSettings(mockProps));
      const backupWithExtras = JSON.stringify({
        campaignName: 'Clean Import',
        version: '1.0.0',
        exportDate: '2024-01-01',
        extraField: 'should be ignored',
        characters: [{ id: 'c2' }]
      });

      await act(async () => {
        await result.current.importCampaignDataJson(backupWithExtras);
      });

      const stateUpdateFn = mockUpdateState.mock.calls[0][0];
      const newState = stateUpdateFn({});
      expect(newState.campaignName).toBe('Clean Import');
      expect(newState.characters).toEqual([{ id: 'c2' }]);
      // @ts-expect-error - testing exclusion of extra keys
      expect(newState.version).toBeUndefined();
      // @ts-expect-error - testing exclusion of extra keys
      expect(newState.extraField).toBeUndefined();
    });

    it('handles malformed JSON syntax errors', async () => {
      const { result } = renderHook(() => useSettings(mockProps));
      const malformedJson = '{ invalid json ';

      await act(async () => {
        await expect(result.current.importCampaignDataJson(malformedJson)).rejects.toThrow();
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Import Failed: Malformed campaign JSON',
        expect.objectContaining({ description: expect.any(String) })
      );
    });
  });
});
