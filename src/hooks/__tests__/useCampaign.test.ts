import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCampaign, extractSpreadsheetId } from '../useCampaign';
import { STORAGE_KEYS } from '../../lib/constants';
import * as googleAuth from '../../services/googleAuth';
import * as sheetsService from '../../services/sheetsService';

vi.mock('../../services/googleAuth', () => ({
  requestAccessToken: vi.fn(),
  clearTokens: vi.fn(),
  hasToken: vi.fn(),
}));

vi.mock('../../services/sheetsService', () => ({
  fetchSheetData: vi.fn(),
  setSpreadsheetId: vi.fn(),
}));

describe('useCampaign & extractSpreadsheetId tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Clear URL query parameters
    window.history.pushState(null, '', '/');
    global.fetch = originalFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('extractSpreadsheetId', () => {
    it('correctly parse spreadsheet ID from URL and plain ID inputs', () => {
      const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit';
      const plainId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
      expect(extractSpreadsheetId(url)).toBe(plainId);
      expect(extractSpreadsheetId(plainId)).toBe(plainId);
      expect(extractSpreadsheetId('   ')).toBe('');
    });
  });

  describe('useCampaign Hook', () => {
    it('initialize empty if localStorage is empty', () => {
      const { result } = renderHook(() => useCampaign());
      expect(result.current.campaigns).toEqual([]);
      expect(result.current.activeCampaign).toBeNull();
    });

    it('extract valid campaign ID from URL query params', () => {
      const existing = [
        {
          id: 'camp-123',
          name: 'Strahd',
          spreadsheetId: 'sheet-123',
          spreadsheetUrl: 'url-123',
          createdAt: new Date().toISOString(),
          lastOpenedAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEYS.campaigns, JSON.stringify(existing));

      // Push campaign URL
      const url = new URL(window.location.href);
      url.searchParams.set('campaign', 'camp-123');
      window.history.pushState(null, '', url.pathname + url.search);

      const { result } = renderHook(() => useCampaign());
      expect(result.current.activeCampaign).not.toBeNull();
      expect(result.current.activeCampaign?.id).toBe('camp-123');
    });

    it('successfully mock a campaign create flow', async () => {
      vi.mocked(googleAuth.requestAccessToken).mockResolvedValue('mock-token');

      const mockResponse = {
        spreadsheetId: 'new-sheet-999',
        spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/new-sheet-999/edit',
        title: 'New Campaign',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useCampaign());

      let createdCampaign;
      await act(async () => {
        createdCampaign = await result.current.createCampaign('New Campaign');
      });

      expect(createdCampaign).toBeDefined();
      expect(createdCampaign!.spreadsheetId).toBe('new-sheet-999');
      expect(createdCampaign!.name).toBe('New Campaign');
      expect(result.current.campaigns.length).toBe(1);
      expect(result.current.activeCampaign?.id).toBe(createdCampaign!.id);

      // Verify localStorage
      expect(localStorage.getItem(STORAGE_KEYS.activeCampaignId)).toBe(createdCampaign!.id);
      expect(localStorage.getItem(STORAGE_KEYS.activeCampaignSpreadsheetId)).toBe('new-sheet-999');
    });

    it('handle backend Spreadsheet creation failure', async () => {
      vi.mocked(googleAuth.requestAccessToken).mockResolvedValue('mock-token');

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Authorization key not valid' }),
      });

      const { result } = renderHook(() => useCampaign());

      let createdCampaign;
      await act(async () => {
        createdCampaign = await result.current.createCampaign('Failed Campaign');
      });

      expect(createdCampaign).toBeNull();
      expect(result.current.error).toContain('Authorization key not valid');
      expect(result.current.campaigns.length).toBe(0);
    });

    it('connectCampaign with a valid spreadsheetId successfully fetches validation range, saves, and opens', async () => {
      vi.mocked(googleAuth.requestAccessToken).mockResolvedValue('mock-token');
      vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({ values: [['Mock Data']] });

      const { result } = renderHook(() => useCampaign());
      
      let connectedCampaign;
      await act(async () => {
        connectedCampaign = await result.current.connectCampaign('Connected Campaign', 'connect-sheet-123');
      });

      expect(sheetsService.fetchSheetData).toHaveBeenCalledWith('connect-sheet-123', 'Characters!A1');
      expect(connectedCampaign).toBeDefined();
      expect(connectedCampaign!.spreadsheetId).toBe('connect-sheet-123');
      expect(connectedCampaign!.name).toBe('Connected Campaign');
      expect(result.current.campaigns.length).toBe(1);
      expect(result.current.activeCampaign?.id).toBe(connectedCampaign!.id);
    });

    it('connectCampaign with a full Google Sheets URL extracts just the spreadsheetId before saving', async () => {
      vi.mocked(googleAuth.requestAccessToken).mockResolvedValue('mock-token');
      vi.mocked(sheetsService.fetchSheetData).mockResolvedValueOnce({ values: [['Mock Data']] });

      const { result } = renderHook(() => useCampaign());
      
      const fullUrl = 'https://docs.google.com/spreadsheets/d/url-extracted-123/edit#gid=0';
      let connectedCampaign;
      await act(async () => {
        connectedCampaign = await result.current.connectCampaign('Extracted URL Campaign', fullUrl);
      });

      expect(sheetsService.fetchSheetData).toHaveBeenCalledWith('url-extracted-123', 'Characters!A1');
      expect(connectedCampaign!.spreadsheetId).toBe('url-extracted-123');
      expect(result.current.activeCampaign?.id).toBe(connectedCampaign!.id);
    });

    it('connectCampaign where the validation fetch fails sets error state and does not save the campaign', async () => {
      vi.mocked(googleAuth.requestAccessToken).mockResolvedValue('mock-token');
      vi.mocked(sheetsService.fetchSheetData).mockRejectedValueOnce(new Error('Network or 404 error'));

      const { result } = renderHook(() => useCampaign());
      
      let connectedCampaign;
      await act(async () => {
        connectedCampaign = await result.current.connectCampaign('Failed Campaign', 'bad-sheet-567');
      });

      expect(connectedCampaign).toBeNull();
      expect(result.current.error).toContain('Network or 404 error');
      expect(result.current.campaigns.length).toBe(0);
      expect(result.current.activeCampaign).toBeNull();
    });

    it('connectCampaign sets isLoading true during the request and false after', async () => {
      vi.mocked(googleAuth.requestAccessToken).mockResolvedValue('mock-token');
      
      let resolveFetch: any;
      vi.mocked(sheetsService.fetchSheetData).mockImplementationOnce(() => {
        return new Promise((resolve) => {
          resolveFetch = resolve;
        });
      });

      const { result } = renderHook(() => useCampaign());
      
      expect(result.current.isLoading).toBe(false);

      let connectPromise: any;
      act(() => {
        connectPromise = result.current.connectCampaign('Loading Test', 'sheet-123');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveFetch({ values: [['Data']] });
        await connectPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('safely delete non-active campaigns and prevent active-campaign deletion', () => {
      const campaign1 = {
        id: 'camp-1',
        name: 'Strahd',
        spreadsheetId: 'sheet-1',
        spreadsheetUrl: 'url-1',
        createdAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString(),
      };
      const campaign2 = {
        id: 'camp-2',
        name: 'Eberron',
        spreadsheetId: 'sheet-2',
        spreadsheetUrl: 'url-2',
        createdAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEYS.campaigns, JSON.stringify([campaign1, campaign2]));

      const { result } = renderHook(() => useCampaign());

      // Set active campaign to camp-2
      act(() => {
        result.current.openCampaign(campaign2);
      });

      expect(result.current.activeCampaign?.id).toBe('camp-2');

      // Try deleting active campaign (campaign2) -> should set error and prevent delete
      act(() => {
        result.current.deleteCampaign('camp-2');
      });
      expect(result.current.campaigns.length).toBe(2);
      expect(result.current.error).toContain('Cannot delete the currently active campaign.');

      // Try deleting non-active campaign (campaign1) -> should succeed
      act(() => {
        result.current.clearError();
        result.current.deleteCampaign('camp-1');
      });
      expect(result.current.campaigns.length).toBe(1);
      expect(result.current.campaigns[0].id).toBe('camp-2');
      expect(result.current.error).toBeNull();
    });

    it('clear storage keys when closed', () => {
      const campaign = {
        id: 'camp-77',
        name: 'Ravenloft',
        spreadsheetId: 'sheet-77',
        spreadsheetUrl: 'url-77',
        createdAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEYS.campaigns, JSON.stringify([campaign]));
      localStorage.setItem(STORAGE_KEYS.activeCampaignId, campaign.id);
      localStorage.setItem(STORAGE_KEYS.activeCampaignSpreadsheetId, campaign.spreadsheetId);

      // Add query param
      const url = new URL(window.location.href);
      url.searchParams.set('campaign', campaign.id);
      window.history.pushState(null, '', url.pathname + url.search);

      const { result } = renderHook(() => useCampaign());
      expect(result.current.activeCampaign).not.toBeNull();

      act(() => {
        result.current.closeCampaign();
      });

      expect(result.current.activeCampaign).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.activeCampaignId)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.activeCampaignSpreadsheetId)).toBeNull();
      expect(new URL(window.location.href).searchParams.has('campaign')).toBe(false);
    });
  });
});
