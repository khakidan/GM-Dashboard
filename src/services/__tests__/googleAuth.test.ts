import { STORAGE_KEYS } from '../../lib/constants';
// src/services/__tests__/googleAuth.test.ts

// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { toast } from 'sonner';
import {
  clearTokens,
  hasToken,
  setManualAccessToken,
  setManualRefreshToken,
  getGoogleClientId,
  getSheetNotifier,
  setSheetNotifier,
  silentNotifier,
  requestAccessToken,
  Notifier,
} from '../googleAuth';

// ─── Inline token store ───────────────────────────────────────────────────────
// We test the token management logic in isolation by inlining a stripped-down
// version of the relevant functions. This avoids importing import.meta.env
// and the Google Identity Services script loader, which don't exist in the
// test environment.

const ACCESS_KEY  = STORAGE_KEYS.googleAccessToken;
const REFRESH_KEY = STORAGE_KEYS.googleRefreshToken;

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

  function clearTokensLocal() {
    storage.removeItem(ACCESS_KEY);
    storage.removeItem(REFRESH_KEY);
    accessToken  = null;
    refreshToken = null;
  }

  function hasTokenLocal(): boolean {
    refreshLocalTokens();
    return !!accessToken || !!refreshToken;
  }

  function setManualAccessTokenLocal(token: string) {
    storage.setItem(ACCESS_KEY, token);
    accessToken = token;
  }

  function setManualRefreshTokenLocal(token: string) {
    storage.setItem(REFRESH_KEY, token);
    refreshToken = token;
  }

  function getAccessToken()  { return accessToken; }
  function getRefreshToken() { return refreshToken; }

  return {
    clearTokens: clearTokensLocal,
    hasToken: hasTokenLocal,
    setManualAccessToken: setManualAccessTokenLocal,
    setManualRefreshToken: setManualRefreshTokenLocal,
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

describe('googleAuth token store isolated tests', () => {
  describe('clearTokens isolated', () => {
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

  describe('hasToken isolated', () => {
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

      storage._map.set(ACCESS_KEY, 'late-token');
      expect(store.hasToken()).toBe(true);
    });

    it('returns false after clearTokens even if tokens existed before', () => {
      const store = makeTokenStore(makeStorage({ [ACCESS_KEY]: 'tok' }));
      store.clearTokens();
      expect(store.hasToken()).toBe(false);
    });
  });

  describe('setManualAccessToken isolated', () => {
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

  describe('setManualRefreshToken isolated', () => {
    it('always writes to the refresh token slot regardless of token length', () => {
      const store = makeTokenStore(makeStorage());
      store.setManualRefreshToken('1//short');
      expect(store.getRefreshToken()).toBe('1//short');
      expect(store.getAccessToken()).toBeNull();
    });

    it('overwrites an existing refresh token', () => {
      const store = makeTokenStore(makeStorage({ [REFRESH_KEY]: 'old-refresh' }));
      store.setManualRefreshToken('new-refresh');
      expect(store.getRefreshToken()).toBe('new-refresh');
    });
  });
});

describe('googleAuth exported functions direct tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('clearTokens', () => {
    it('removes both tokens from real localStorage', () => {
      localStorage.setItem(STORAGE_KEYS.googleAccessToken, 'acc');
      localStorage.setItem(STORAGE_KEYS.googleRefreshToken, 'ref');

      clearTokens();

      expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.googleRefreshToken)).toBeNull();
      expect(hasToken()).toBe(false);
    });
  });

  describe('hasToken', () => {
    it('returns false when no tokens are in localStorage', () => {
      expect(hasToken()).toBe(false);
    });

    it('returns true when access token is in localStorage', () => {
      localStorage.setItem(STORAGE_KEYS.googleAccessToken, 'acc');
      expect(hasToken()).toBe(true);
    });

    it('returns true when refresh token is in localStorage', () => {
      localStorage.setItem(STORAGE_KEYS.googleRefreshToken, 'ref');
      expect(hasToken()).toBe(true);
    });
  });

  describe('setManualAccessToken', () => {
    it('saves raw access token directly to localStorage', () => {
      setManualAccessToken('ya29.abcdef');
      expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBe('ya29.abcdef');
      expect(hasToken()).toBe(true);
    });
  });

  describe('setManualRefreshToken', () => {
    it('saves raw refresh token directly to localStorage', () => {
      setManualRefreshToken('1//ref-abc-123');
      expect(localStorage.getItem(STORAGE_KEYS.googleRefreshToken)).toBe('1//ref-abc-123');
      expect(hasToken()).toBe(true);
    });
  });

  describe('requestAccessToken fallback behaviors', () => {
    it('returns access token if already present in state/storage', async () => {
      localStorage.setItem(STORAGE_KEYS.googleAccessToken, 'instantiated-access-token');
      const token = await requestAccessToken();
      expect(token).toBe('instantiated-access-token');
    });

    it('throws UNAUTHENTICATED error on empty storage', async () => {
      await expect(requestAccessToken()).rejects.toThrow('UNAUTHENTICATED');
    });
  });

  describe('Notifier and registration pattern', () => {
    const customNotifier: Notifier = {
      loading: vi.fn().mockReturnValue('toast-id'),
      success: vi.fn(),
      error: vi.fn(),
      dismiss: vi.fn()
    };

    const originalNotifier = getSheetNotifier();

    afterEach(() => {
      setSheetNotifier(originalNotifier);
    });

    it('correctly sets and retrieves a sheet notifier', () => {
      setSheetNotifier(customNotifier);
      expect(getSheetNotifier()).toBe(customNotifier);

      setSheetNotifier(silentNotifier);
      expect(getSheetNotifier()).toBe(silentNotifier);
    });

    it('resets notifier to default toast successfully', () => {
      setSheetNotifier(toast);
      expect(getSheetNotifier()).toBe(toast);
    });
  });
});
