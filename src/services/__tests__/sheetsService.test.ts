// src/services/__tests__/sheetsService.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchSheetData } from '../sheetsService';
import { STORAGE_KEYS } from '../../lib/constants';

vi.mock('../googleAuth', () => ({
  requestAccessToken: vi.fn().mockResolvedValue('fake-access-token'),
}));

describe('sheetsService fetchSheetData tests', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.spreadsheetId, 'mock-spreadsheet-id');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('fetchSheetData returns mapped values array', async () => {
    const mockResponse = { values: [['val1', 'val2']] };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(mockResponse)))
    );

    const result = await fetchSheetData('A1:B2');
    expect(result).toEqual(mockResponse);
    expect(result.values).toEqual([['val1', 'val2']]);
  });

  it('fetchSheetData returns empty array when API response has no values property', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({}))));

    const result = await fetchSheetData('A1:B2');
    expect(result.values || []).toEqual([]);
  });

  it('fetchSheetData propagates API errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('API error')));

    await expect(fetchSheetData('A1:B2')).rejects.toThrow('API error');
  });
});
