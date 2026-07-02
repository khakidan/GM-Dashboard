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
});
