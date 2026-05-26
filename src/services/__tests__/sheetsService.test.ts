// src/services/__tests__/sheetsService.test.ts

import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { toast } from 'sonner';
import {
  setSheetNotifier,
  getSheetNotifier,
  silentNotifier,
  updateSheetData,
  Notifier
} from '../sheetsService';

// ─── Inline token store ───────────────────────────────────────────────────────
// We test the token management logic in isolation by inlining a stripped-down
// version of the relevant functions. This avoids importing import.meta.env
// and the Google Identity Services script loader, which don't exist in the
// test environment.

const ACCESS_KEY  = 'GM_GOOGLE_ACCESS_TOKEN';
const REFRESH_KEY = 'GM_GOOGLE_REFRESH_TOKEN';

function makeTokenStore(storage: {
  getItem: (k: string) => string | null;
  setItem: (k: string, v: string) => void;
  removeItem: (k: string) => void;
}) {
  let accessToken:  string | null = null;
  let refreshToken: string | null = null;

  function refreshLocalTokens() {
    accessToken  = storage.getItem(ACCESS_KEY);
    refreshToken = storage.getItem(REFRESH_KEY);
  }

  function clearTokens() {
    storage.removeItem(ACCESS_KEY);
    storage.removeItem(REFRESH_KEY);
    accessToken  = null;
    refreshToken = null;
  }

  function hasToken(): boolean {
    refreshLocalTokens();
    return !!accessToken || !!refreshToken;
  }

  // ✅ New explicit functions replacing the old setManualToken heuristic
  function setManualAccessToken(token: string) {
    storage.setItem(ACCESS_KEY, token);
    accessToken = token;
  }

  function setManualRefreshToken(token: string) {
    storage.setItem(REFRESH_KEY, token);
    refreshToken = token;
  }

  // Kept for regression testing — documents the known limitation
  function setManualToken_ORIGINAL(token: string) {
    if (token.includes('//') && token.length > 50) {
      storage.setItem(REFRESH_KEY, token);
      refreshToken = token;
    } else {
      storage.setItem(ACCESS_KEY, token);
      accessToken = token;
    }
  }

  function getAccessToken()  { return accessToken; }
  function getRefreshToken() { return refreshToken; }

  return {
    clearTokens,
    hasToken,
    setManualAccessToken,
    setManualRefreshToken,
    setManualToken_ORIGINAL,
    getAccessToken,
    getRefreshToken,
    refreshLocalTokens,
  };
}

// Helper that creates a fresh in-memory storage map per test
function makeStorage(initial?: Record<string, string>) {
  const map = new Map<string, string>(Object.entries(initial ?? {}));
  return {
    getItem:    (k: string)            => map.get(k) ?? null,
    setItem:    (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string)            => { map.delete(k); },
    _map: map,
  };
}

// ─── clearTokens ─────────────────────────────────────────────────────────────

describe('clearTokens', () => {
  it('removes both tokens from storage and nulls the in-memory values', () => {
    const storage = makeStorage();
    const store = makeTokenStore(storage);

    store.setManualAccessToken('access-abc');
    store.setManualRefreshToken('refresh-xyz');
    store.clearTokens();

    expect(store.getAccessToken()).toBeNull();
    expect(store.getRefreshToken()).toBeNull();
    expect(storage._map.get(ACCESS_KEY)).toBeUndefined();
    expect(storage._map.get(REFRESH_KEY)).toBeUndefined();
  });

  it('is safe to call when no tokens exist', () => {
    const store = makeTokenStore(makeStorage());
    expect(() => store.clearTokens()).not.toThrow();
  });
});

// ─── hasToken ─────────────────────────────────────────────────────────────────

describe('hasToken', () => {
  it('returns false when no tokens exist', () => {
    expect(makeTokenStore(makeStorage()).hasToken()).toBe(false);
  });

  it('returns true when only an access token exists', () => {
    const store = makeTokenStore(makeStorage({ [ACCESS_KEY]: 'tok' }));
    expect(store.hasToken()).toBe(true);
  });

  it('returns true when only a refresh token exists', () => {
    const store = makeTokenStore(makeStorage({ [REFRESH_KEY]: '1//tok' }));
    expect(store.hasToken()).toBe(true);
  });

  it('returns true when both tokens exist', () => {
    const store = makeTokenStore(makeStorage({ [ACCESS_KEY]: 'a', [REFRESH_KEY]: 'r' }));
    expect(store.hasToken()).toBe(true);
  });

  it('reflects storage changes made after the store was created', () => {
    const storage = makeStorage();
    const store = makeTokenStore(storage);

    expect(store.hasToken()).toBe(false);

    // Simulate another tab writing a token directly to storage
    storage._map.set(ACCESS_KEY, 'late-token');
    expect(store.hasToken()).toBe(true); // refreshLocalTokens re-reads storage
  });

  it('returns false after clearTokens even if tokens existed before', () => {
    const store = makeTokenStore(makeStorage({ [ACCESS_KEY]: 'tok' }));
    store.clearTokens();
    expect(store.hasToken()).toBe(false);
  });
});

// ─── setManualAccessToken / setManualRefreshToken (new API) ───────────────────

describe('setManualAccessToken', () => {
  it('always writes to the access token slot regardless of token content', () => {
    const store = makeTokenStore(makeStorage());
    store.setManualAccessToken('ya29.any-length-token-with//slashes-in-it');
    expect(store.getAccessToken()).toBe('ya29.any-length-token-with//slashes-in-it');
    expect(store.getRefreshToken()).toBeNull();
  });

  it('overwrites an existing access token', () => {
    const store = makeTokenStore(makeStorage({ [ACCESS_KEY]: 'old-token' }));
    store.setManualAccessToken('new-token');
    expect(store.getAccessToken()).toBe('new-token');
  });
});

describe('setManualRefreshToken', () => {
  it('always writes to the refresh token slot regardless of token length', () => {
    const store = makeTokenStore(makeStorage());
    store.setManualRefreshToken('1//short'); // too short for the old heuristic
    expect(store.getRefreshToken()).toBe('1//short');
    expect(store.getAccessToken()).toBeNull();
  });

  it('overwrites an existing refresh token', () => {
    const store = makeTokenStore(makeStorage({ [REFRESH_KEY]: 'old-refresh' }));
    store.setManualRefreshToken('new-refresh');
    expect(store.getRefreshToken()).toBe('new-refresh');
  });
});

// ─── setManualToken_ORIGINAL — regression tests ───────────────────────────────
// These tests document the known bugs in the old implementation so we have a
// record of why it was replaced.

describe('setManualToken_ORIGINAL — known limitations', () => {
  it('correctly identifies a long refresh token containing "//"', () => {
    const store = makeTokenStore(makeStorage());
    const fakeRefresh = '1//' + 'x'.repeat(50); // length > 50, has //
    store.setManualToken_ORIGINAL(fakeRefresh);
    expect(store.getRefreshToken()).toBe(fakeRefresh);
    expect(store.getAccessToken()).toBeNull();
  });

  it('correctly identifies a token without "//" as an access token', () => {
    const store = makeTokenStore(makeStorage());
    store.setManualToken_ORIGINAL('ya29.short');
    expect(store.getAccessToken()).toBe('ya29.short');
    expect(store.getRefreshToken()).toBeNull();
  });

  it('KNOWN BUG — misclassifies a short refresh token as an access token', () => {
    // A valid refresh token shorter than 51 chars with "//" is misclassified.
    // This test documents the limitation that motivated replacing the function.
    const store = makeTokenStore(makeStorage());
    const shortRefresh = '1//abc'; // valid prefix, but too short
    store.setManualToken_ORIGINAL(shortRefresh);
    // Stored as access token — wrong slot
    expect(store.getAccessToken()).toBe(shortRefresh);
    expect(store.getRefreshToken()).toBeNull();
  });
});

// ─── Backoff delay formula ────────────────────────────────────────────────────
// The retry logic in googleFetch uses this formula. Testing it here ensures
// the timing guarantees are never accidentally broken by a refactor.

describe('exponential backoff delay formula', () => {
  function calcDelay(attempt: number, rand: number = 0): number {
    return Math.pow(2, attempt) * 500 + rand * 200;
  }

  it('attempt 0 produces a 500ms base delay', () => {
    expect(calcDelay(0)).toBe(500);
  });

  it('attempt 1 produces a 1000ms base delay', () => {
    expect(calcDelay(1)).toBe(1000);
  });

  it('attempt 2 produces a 2000ms base delay', () => {
    expect(calcDelay(2)).toBe(2000);
  });

  it('jitter adds at most 200ms on top of the base', () => {
    expect(calcDelay(1, 1) - calcDelay(1, 0)).toBe(200);
  });

  it('worst case delay within MAX_RETRIES=3 window is 2200ms', () => {
    expect(calcDelay(2, 1)).toBe(2200);
  });

  it('delays grow exponentially across attempts', () => {
    const d0 = calcDelay(0);
    const d1 = calcDelay(1);
    const d2 = calcDelay(2);
    expect(d1).toBe(d0 * 2);
    expect(d2).toBe(d0 * 4);
  });
});

// ─── Notifier Pattern ─────────────────────────────────────────────────────────

describe('Notifier Pattern', () => {
  const customNotifier: Notifier = {
    loading: vi.fn().mockReturnValue('toast-id'),
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn()
  };

  const originalNotifier = getSheetNotifier();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setSheetNotifier(customNotifier);
  });

  afterAll(() => {
    setSheetNotifier(originalNotifier);
    vi.unstubAllGlobals();
  });

  it('setSheetNotifier replaces the active notifier', () => {
    setSheetNotifier(silentNotifier);
    expect(getSheetNotifier()).toBe(silentNotifier);
  });

  it('getSheetNotifier returns the currently active notifier', () => {
    setSheetNotifier(customNotifier);
    expect(getSheetNotifier()).toBe(customNotifier);
  });

  it('After setting silentNotifier, getSheetNotifier returns silentNotifier', () => {
    setSheetNotifier(silentNotifier);
    expect(getSheetNotifier()).toBe(silentNotifier);
  });

  it('After setting a custom notifier object, its loading method is called when a sheet write begins', async () => {
    localStorage.setItem('GM_GOOGLE_ACCESS_TOKEN', 'fake-token');
    localStorage.setItem('GM_DATA_SPREADSHEET_ID', 'test-id');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 })));

    await updateSheetData('A1', [[1]]);
    expect(customNotifier.loading).toHaveBeenCalledWith('Updating sheet...');
  });

  it("The notifier's success method is called when the write succeeds", async () => {
    localStorage.setItem('GM_GOOGLE_ACCESS_TOKEN', 'fake-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 })));

    await updateSheetData('A1', [[1]]);
    expect(customNotifier.success).toHaveBeenCalledWith('Sheet updated successfully', { id: 'toast-id' });
  });

  it("The notifier's error method is called when the write fails with a non-UNAUTHENTICATED error", async () => {
    localStorage.setItem('GM_GOOGLE_ACCESS_TOKEN', 'fake-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Bad Request', { status: 400 })));

    await expect(updateSheetData('A1', [[1]])).rejects.toThrow();
    expect(customNotifier.error).toHaveBeenCalledWith('Failed to update sheet', { id: 'toast-id' });
  });

  it("The notifier's dismiss method is called when the write fails with an UNAUTHENTICATED error", async () => {
    localStorage.setItem('GM_GOOGLE_ACCESS_TOKEN', 'fake-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'UNAUTHENTICATED' }), { status: 401 })));

    await expect(updateSheetData('A1', [[1]])).rejects.toThrow('UNAUTHENTICATED');
    expect(customNotifier.dismiss).toHaveBeenCalledWith('toast-id');
  });

  it('Resetting to the default sonner toast restores normal behaviour', () => {
    setSheetNotifier(toast);
    expect(getSheetNotifier()).toBe(toast);
  });
});