import { STORAGE_KEYS } from '../lib/constants';
// src/services/googleAuth.ts

// Google Auth Token and Client Management Service
interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: { 
      credential: string 
    }) => void;
  }) => void;
  prompt: () => void;
  renderButton: (
    element: HTMLElement,
    config: object
  ) => void;
}

interface GoogleOAuthClient {
  requestAccessToken: () => void;
}

interface GoogleAccounts {
  accounts: {
    id?: GoogleAccountsId;
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: {
          access_token?: string;
          error?: string;
        }) => void;
      }) => GoogleOAuthClient;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}

import { toast } from 'sonner';

export interface Notifier {
  loading: (message: string) => string | number;
  success: (message: string, options?: { id: string | number }) => void;
  error:   (message: string, options?: { id: string | number }) => void;
  dismiss: (id: string | number) => void;
}

export const silentNotifier: Notifier = {
  loading: () => '',
  success: () => {},
  error:   () => {},
  dismiss: () => {},
};

let activeNotifier: Notifier = toast;

export function setSheetNotifier(notifier: Notifier): void {
  activeNotifier = notifier;
}

export function getSheetNotifier(): Notifier {
  return activeNotifier;
}

let cachedClientId: string | null = null;
export async function getGoogleClientId(): Promise<string> {
  if (cachedClientId) return cachedClientId;
  if (import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    cachedClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    return cachedClientId;
  }
  try {
    const res = await fetch('/api/auth/config');
    if (res.ok) {
      const data = await res.json();
      if (data.clientId) {
        cachedClientId = data.clientId;
        return cachedClientId;
      }
    }
  } catch (err) {
    console.error('[Sheets] Failed to fetch google client_id from server config:', err);
  }
  return '';
}

/**
 * Generates a cryptographically secure random string and stores it in sessionStorage.
 */
function generateAndStoreOAuthState(): string {
  const state = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2) + Date.now().toString(36);
  sessionStorage.setItem(STORAGE_KEYS.oauthState, state);
  return state;
}

/**
 * Trigger a full-page redirect to Google's OAuth page.
 * Uses Authorization Code Flow for persistence.
 */
export async function signInWithRedirect() {
  const clientId = await getGoogleClientId();
  if (!clientId) {
    console.error('[Sheets] Cannot sign in: No Google Client ID available.');
    return;
  }
  const redirectUri = window.location.origin;
  const scope = 'https://www.googleapis.com/auth/spreadsheets';

  // Clear any stale tokens before starting a fresh flow
  clearTokens();

  const state = generateAndStoreOAuthState();

  // Use code flow for offline access (refresh token)
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&access_type=offline` +
    `&state=${encodeURIComponent(state)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&prompt=consent select_account`; // Force consent to ensure we get a fresh refresh token

  // Open in a new tab so the OAuth flow is not inside an iframe
  window.open(authUrl, '_blank', 'noopener');
}

/**
 * Trigger implicit flow for temporary access.
 */
export async function signInWithToken() {
  const clientId = await getGoogleClientId();
  if (!clientId) {
    console.error('[Sheets] Cannot sign in: No Google Client ID available.');
    return;
  }
  const redirectUri = window.location.origin;
  const scope = 'https://www.googleapis.com/auth/spreadsheets';

  clearTokens();

  const state = generateAndStoreOAuthState();

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=token` +
    `&state=${encodeURIComponent(state)}` +
    `&scope=${encodeURIComponent(scope)}`;

  window.location.href = authUrl;
}

let tokenClient: GoogleOAuthClient | null = null;
let accessToken: string | null = null;
let refreshToken: string | null = null;

// Helper to keep local variables in sync with storage
function refreshLocalTokens() {
  accessToken = localStorage.getItem(STORAGE_KEYS.googleAccessToken);
  refreshToken = localStorage.getItem(STORAGE_KEYS.googleRefreshToken);
}

export function clearTokens() {
  localStorage.removeItem(STORAGE_KEYS.googleAccessToken);
  localStorage.removeItem(STORAGE_KEYS.googleRefreshToken);
  accessToken = null;
  refreshToken = null;
}

export function hasToken() {
  refreshLocalTokens();
  return !!accessToken || !!refreshToken;
}

export function setManualAccessToken(token: string) {
  localStorage.setItem(STORAGE_KEYS.googleAccessToken, token);
  accessToken = token;
}

export function setManualRefreshToken(token: string) {
  localStorage.setItem(STORAGE_KEYS.googleRefreshToken, token);
  refreshToken = token;
}

export async function checkAndCaptureToken() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const hashParams = new URLSearchParams(
    window.location.hash.includes('?')
      ? window.location.hash.split('?')[1]
      : window.location.hash.substring(1)
  );
  const hashToken = hashParams.get('access_token');

  if (hashToken) {
    const incomingState = hashParams.get('state');
    const storedState = sessionStorage.getItem(STORAGE_KEYS.oauthState);
    sessionStorage.removeItem(STORAGE_KEYS.oauthState);

    if (!storedState || !incomingState || storedState !== incomingState) {
      console.error('❌ [Sheets] OAuth State Validation Failed (CSRF Warning). Hash token rejected.');
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      return false;
    }

    localStorage.setItem(STORAGE_KEYS.googleAccessToken, hashToken);
    accessToken = hashToken;
    // Clean up hash
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    return true;
  }

  if (code) {
    const incomingState = url.searchParams.get('state');
    const storedState = sessionStorage.getItem(STORAGE_KEYS.oauthState);
    sessionStorage.removeItem(STORAGE_KEYS.oauthState);

    if (!storedState || !incomingState || storedState !== incomingState) {
      console.error('❌ [Sheets] OAuth State Validation Failed (CSRF Warning). Authorization code exchange aborted.');
      window.history.replaceState(null, '', window.location.pathname);
      return false;
    }

    try {
      const redirectUri = window.location.origin;
      const res = await fetch('/api/auth/google-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: redirectUri }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ [Sheets] Token exchange FAILED:', errorData);
        // Clear code to prevent loops
        window.history.replaceState(null, '', window.location.pathname);
        throw new Error(errorData.error || 'Token exchange failed');
      }

      const data = await res.json();

      if (data.access_token) {
        localStorage.setItem(STORAGE_KEYS.googleAccessToken, data.access_token);
        accessToken = data.access_token;
      }

      if (data.refresh_token) {
        localStorage.setItem(STORAGE_KEYS.googleRefreshToken, data.refresh_token);
        refreshToken = data.refresh_token;
      } else {
        console.warn(
          '⚠️ [Sheets] NO REFRESH TOKEN RECEIVED. This usually happens if you have already authorized this app. Persistent background sync will FAIL when the access token expires in 1 hour.'
        );
        console.warn(
          '💡 ACTION: Go to https://myaccount.google.com/permissions, remove this app, and sign in again.'
        );
      }

      // Clean up URL
      window.history.replaceState(null, '', window.location.pathname);
      return true;
    } catch (err) {
      console.error('[Sheets] CRITICAL: Failed to exchange code:', err);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }
  return false;
}

export async function refreshAccessToken(): Promise<string | null> {
  refreshLocalTokens();
  if (!refreshToken) {
    console.warn('[Sheets] refreshAccessToken: CANNOT REFRESH. No refresh token available in storage.');
    return null;
  }

  try {
    const res = await fetch('/api/auth/google-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error('❌ [Sheets] Background Refresh FAILED:', res.status, errData);

      if (errData.error === 'invalid_grant') {
        console.warn('⚠️ [Sheets] Refresh token is invalid (expired or revoked). Clearing credentials.');
        clearTokens();
      } else if (errData.message && errData.message.includes('VITE_GOOGLE_CLIENT_SECRET')) {
        console.error('❌ [Sheets] REFRESH FAILED: VITE_GOOGLE_CLIENT_SECRET is missing in AI Studio Secrets.');
      }
      return null;
    }

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem(STORAGE_KEYS.googleAccessToken, data.access_token);
      accessToken = data.access_token;
      return accessToken;
    }
  } catch (err) {
    console.error('[Sheets] refreshAccessToken: Exception occurred during refresh:', err);
  }
  return null;
}

export async function initGoogleAuth(): Promise<void> {
  refreshLocalTokens();

  await checkAndCaptureToken();

  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      setupClient(resolve, reject);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setupClient(resolve, reject);
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
}

async function setupClient(resolve: () => void, reject: (err: Error) => void) {
  try {
    const clientId = await getGoogleClientId();
    if (!clientId) {
      throw new Error('Missing Google Client ID in environment variables.');
    }

    const googleApis = window.google;
    if (!googleApis?.accounts?.oauth2) {
      throw new Error('Google Identity Services script not loaded.');
    }

    tokenClient = googleApis.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      callback: (tokenResponse: { access_token?: string; error?: string }) => {
        if (tokenResponse.error !== undefined) {
          reject(new Error(tokenResponse.error));
        }
        accessToken = tokenResponse.access_token || null;
        localStorage.setItem(STORAGE_KEYS.googleAccessToken, accessToken!);
        resolve();
      },
    });
    resolve();
  } catch (error: unknown) {
    reject(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function requestAccessToken(): Promise<string> {
  refreshLocalTokens();

  // 1. Check if we have an access token
  if (accessToken) {
    return accessToken;
  }

  // 2. Try refreshing
  if (refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return refreshed;
    }
  }

  // 3. Fallback: Trigger login

  // If we're in a background context, we can't show a popup.
  // We throw UNAUTHENTICATED and let the UI handle it.
  throw new Error('UNAUTHENTICATED');
}
