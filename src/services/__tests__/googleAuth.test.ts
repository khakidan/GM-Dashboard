// src/services/__tests__/googleAuth.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requestAccessToken, clearTokens, checkAndCaptureToken } from '../googleAuth';
import { STORAGE_KEYS } from '../../lib/constants';

describe('googleAuth token management tests', () => {
  beforeEach(() => {
    localStorage.clear();
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

describe('checkAndCaptureToken state validation', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.clear();
    clearTokens();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('accepts valid matching state and stores the token (Hash & Code flow)', async () => {
    // 1. Hash/Implicit Flow
    localStorage.setItem(STORAGE_KEYS.oauthState, 'matching-state-123');
    vi.stubGlobal('location', {
      href: 'http://localhost/callback#access_token=hash-token-abc&state=matching-state-123',
      pathname: '/callback',
      search: '',
      hash: '#access_token=hash-token-abc&state=matching-state-123',
      origin: 'http://localhost',
    });
    const replaceStateSpy = vi.fn();
    vi.stubGlobal('history', { replaceState: replaceStateSpy });

    let result = await checkAndCaptureToken();
    expect(result).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBe('hash-token-abc');
    expect(replaceStateSpy).toHaveBeenCalled();

    // Reset storage & token for the next part
    localStorage.clear();
    localStorage.clear();
    clearTokens();

    // 2. Code Flow
    localStorage.setItem(STORAGE_KEYS.oauthState, 'matching-state-456');
    vi.stubGlobal('location', {
      href: 'http://localhost/callback?code=code-123&state=matching-state-456',
      pathname: '/callback',
      search: '?code=code-123&state=matching-state-456',
      hash: '',
      origin: 'http://localhost',
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ access_token: 'code-access-token', refresh_token: 'code-refresh-token' }))
      )
    );

    result = await checkAndCaptureToken();
    expect(result).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBe('code-access-token');
    expect(localStorage.getItem(STORAGE_KEYS.googleRefreshToken)).toBe('code-refresh-token');
  });

  it('rejects mismatched state and returns false (Hash & Code flow)', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // 1. Hash Flow
    localStorage.setItem(STORAGE_KEYS.oauthState, 'stored-state');
    vi.stubGlobal('location', {
      href: 'http://localhost/callback#access_token=hash-token-abc&state=attacker-state',
      pathname: '/callback',
      search: '',
      hash: '#access_token=hash-token-abc&state=attacker-state',
      origin: 'http://localhost',
    });
    const replaceStateSpy = vi.fn();
    vi.stubGlobal('history', { replaceState: replaceStateSpy });

    let result = await checkAndCaptureToken();
    expect(result).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBeNull();
    expect(replaceStateSpy).toHaveBeenCalled();

    // Reset storage & token for the next part
    localStorage.clear();
    localStorage.clear();
    clearTokens();

    // 2. Code Flow
    localStorage.setItem(STORAGE_KEYS.oauthState, 'stored-state');
    vi.stubGlobal('location', {
      href: 'http://localhost/callback?code=code-123&state=attacker-state',
      pathname: '/callback',
      search: '?code=code-123&state=attacker-state',
      hash: '',
      origin: 'http://localhost',
    });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    result = await checkAndCaptureToken();
    expect(result).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('rejects missing/null stored state (Hash & Code flow)', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // 1. Hash Flow
    // localStorage has no oauthState
    vi.stubGlobal('location', {
      href: 'http://localhost/callback#access_token=hash-token-abc&state=some-state',
      pathname: '/callback',
      search: '',
      hash: '#access_token=hash-token-abc&state=some-state',
      origin: 'http://localhost',
    });
    const replaceStateSpy = vi.fn();
    vi.stubGlobal('history', { replaceState: replaceStateSpy });

    let result = await checkAndCaptureToken();
    expect(result).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBeNull();

    // Reset storage & token for the next part
    localStorage.clear();
    localStorage.clear();
    clearTokens();

    // 2. Code Flow
    // localStorage has no oauthState
    vi.stubGlobal('location', {
      href: 'http://localhost/callback?code=code-123&state=some-state',
      pathname: '/callback',
      search: '?code=code-123&state=some-state',
      hash: '',
      origin: 'http://localhost',
    });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    result = await checkAndCaptureToken();
    expect(result).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('removes stored state from localStorage after checkAndCaptureToken runs once (regardless of match or mismatch)', async () => {
    // 1. Matching case
    localStorage.setItem(STORAGE_KEYS.oauthState, 'matching-state');
    vi.stubGlobal('location', {
      href: 'http://localhost/callback#access_token=hash-token-abc&state=matching-state',
      pathname: '/callback',
      search: '',
      hash: '#access_token=hash-token-abc&state=matching-state',
      origin: 'http://localhost',
    });
    vi.stubGlobal('history', { replaceState: vi.fn() });

    await checkAndCaptureToken();
    expect(localStorage.getItem(STORAGE_KEYS.oauthState)).toBeNull();

    // Reset storage & token for the next part
    localStorage.clear();
    localStorage.clear();
    clearTokens();

    // 2. Mismatch case
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEYS.oauthState, 'mismatched-state');
    vi.stubGlobal('location', {
      href: 'http://localhost/callback#access_token=hash-token-abc&state=attacker-state',
      pathname: '/callback',
      search: '',
      hash: '#access_token=hash-token-abc&state=attacker-state',
      origin: 'http://localhost',
    });
    vi.stubGlobal('history', { replaceState: vi.fn() });

    await checkAndCaptureToken();
    expect(localStorage.getItem(STORAGE_KEYS.oauthState)).toBeNull();

    consoleErrorSpy.mockRestore();
  });
});

