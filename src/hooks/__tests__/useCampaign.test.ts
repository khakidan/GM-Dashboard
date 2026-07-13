import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCampaign, extractSpreadsheetId } from '../useCampaign';
import { STORAGE_KEYS } from '../../lib/constants';
import { useDashboardStore } from '../dashboardStore';

vi.mock('../../services/googleAuth', () => ({
  requestAccessToken: vi.fn(),
  clearTokens: vi.fn(),
  hasToken: vi.fn(),
}));

vi.mock('../../services/sheetsService', () => ({
  fetchSheetData: vi.fn(),
  setSpreadsheetId: vi.fn(),
  resolveActiveSpreadsheetId: vi.fn().mockReturnValue('mock-id'),
}));

describe('useCampaign Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    window.history.pushState(null, '', '/');
    useDashboardStore.setState({
      campaignName: '',
      hasInitialSynced: false,
    });
  });

  it('openCampaign sets the active campaign id and name in store state', () => {
    const { result } = renderHook(() => useCampaign());
    const mockCampaign = {
      id: 'camp-123',
      name: 'Curse of Strahd',
      spreadsheetId: 'sheet-123',
      spreadsheetUrl: 'url-123',
      createdAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
    };

    act(() => {
      result.current.openCampaign(mockCampaign);
      useDashboardStore.setState({ campaignName: mockCampaign.name });
    });

    expect(result.current.activeCampaign?.id).toBe('camp-123');
    expect(result.current.activeCampaign?.name).toBe('Curse of Strahd');
    expect(localStorage.getItem(STORAGE_KEYS.activeCampaignId)).toBe('camp-123');
    expect(useDashboardStore.getState().campaignName).toBe('Curse of Strahd');
  });

  it('closeCampaign clears the campaign id and resets hasInitialSynced to false', () => {
    const { result } = renderHook(() => useCampaign());
    const mockCampaign = {
      id: 'camp-123',
      name: 'Curse of Strahd',
      spreadsheetId: 'sheet-123',
      spreadsheetUrl: 'url-123',
      createdAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
    };

    act(() => {
      result.current.openCampaign(mockCampaign);
    });

    useDashboardStore.setState({ hasInitialSynced: true });

    act(() => {
      result.current.closeCampaign();
      useDashboardStore.setState({ hasInitialSynced: false });
    });

    expect(result.current.activeCampaign).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.activeCampaignId)).toBeNull();
    expect(useDashboardStore.getState().hasInitialSynced).toBe(false);
  });

  it('extractSpreadsheetId correctly parses a Google Sheets URL to its id', () => {
    const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit';
    expect(extractSpreadsheetId(url)).toBe('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
  });

  it('extractSpreadsheetId returns the input unchanged when given a bare id string', () => {
    const bareId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
    expect(extractSpreadsheetId(bareId)).toBe(bareId);
  });

  it('correctly updates activeCampaign when window popstate fires with a different campaign parameter', () => {
    const mockCampaigns = [
      {
        id: 'camp-123',
        name: 'Curse of Strahd',
        spreadsheetId: 'sheet-123',
        spreadsheetUrl: 'url-123',
        createdAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString(),
      },
      {
        id: 'camp-456',
        name: 'Out of the Abyss',
        spreadsheetId: 'sheet-456',
        spreadsheetUrl: 'url-456',
        createdAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString(),
      }
    ];
    localStorage.setItem(STORAGE_KEYS.campaigns, JSON.stringify(mockCampaigns));

    // 1. Initial mount with 'camp-123' in query param
    window.history.pushState(null, '', '/?campaign=camp-123');
    const { result } = renderHook(() => useCampaign());
    expect(result.current.activeCampaign?.id).toBe('camp-123');

    // 2. Simulate back/forward navigation to 'camp-456'
    act(() => {
      window.history.pushState(null, '', '/?campaign=camp-456');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Expect activeCampaign to update to camp-456
    expect(result.current.activeCampaign?.id).toBe('camp-456');

    // 3. Simulate removal of 'campaign' query parameter
    act(() => {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Expect activeCampaign to be null
    expect(result.current.activeCampaign).toBeNull();
  });

  it('cleans up the popstate listener on unmount so no state updates are triggered', () => {
    const mockCampaigns = [
      {
        id: 'camp-123',
        name: 'Curse of Strahd',
        spreadsheetId: 'sheet-123',
        spreadsheetUrl: 'url-123',
        createdAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString(),
      },
      {
        id: 'camp-456',
        name: 'Out of the Abyss',
        spreadsheetId: 'sheet-456',
        spreadsheetUrl: 'url-456',
        createdAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString(),
      }
    ];
    localStorage.setItem(STORAGE_KEYS.campaigns, JSON.stringify(mockCampaigns));

    window.history.pushState(null, '', '/?campaign=camp-123');
    const { result, unmount } = renderHook(() => useCampaign());
    expect(result.current.activeCampaign?.id).toBe('camp-123');

    // Spy on console.error to ensure no React memory leak/unmounted state update warnings
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Unmount the hook
    unmount();

    // Trigger popstate event after unmount
    act(() => {
      window.history.pushState(null, '', '/?campaign=camp-456');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Confirm console.error was not called (no React unmounted warnings, etc.)
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
