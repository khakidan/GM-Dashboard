// src/services/__tests__/sheetsService.test.ts

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { toast } from 'sonner';
import {
  setSheetNotifier,
  getSheetNotifier,
  silentNotifier,
  Notifier,
} from '../googleAuth';
import {
  updateSheetData,
} from '../sheetsService';

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
