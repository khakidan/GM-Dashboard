// src/services/__tests__/googleAuth.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requestAccessToken, clearTokens } from '../googleAuth';
import { STORAGE_KEYS } from '../../lib/constants';

describe('googleAuth token management tests', () => {
  beforeEach(() => {
    localStorage.clear();
    clearTokens();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('returns stored access token when valid', async () => {
    localStorage.setItem(STORAGE_KEYS.googleAccessToken, 'valid-token');
    
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const token = await requestAccessToken();
    expect(token).toBe('valid-token');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('refreshes token when expired', async () => {
    localStorage.setItem(STORAGE_KEYS.googleRefreshToken, 'refresh-token');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ access_token: 'new-access-token' }))
      )
    );

    const token = await requestAccessToken();
    expect(token).toBe('new-access-token');
    expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBe('new-access-token');
  });

  it('clears auth state on refresh failure', async () => {
    localStorage.setItem(STORAGE_KEYS.googleRefreshToken, 'refresh-token');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 })
      )
    );

    await expect(requestAccessToken()).rejects.toThrow('UNAUTHENTICATED');
    expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.googleRefreshToken)).toBeNull();
  });
});
