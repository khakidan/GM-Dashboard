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

vi.mock('../useOverlayEvents', () => ({
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
});
