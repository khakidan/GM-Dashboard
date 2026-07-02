// src/services/__tests__/writeQueue.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { queueWrite, flushQueue, getQueueSize, retryPersistedWrites } from '../writeQueue';
import { batchUpdateValues } from '../sheetsService';
import { STORAGE_KEYS } from '../../lib/constants';

const RETRY_STORAGE_KEY = STORAGE_KEYS.writeRetryQueue;

vi.mock('../sheetsService', () => ({
  batchUpdateValues: vi.fn(),
  getSpreadsheetId: vi.fn().mockReturnValue('mock-id'),
  resolveActiveSpreadsheetId: vi.fn().mockReturnValue('mock-id'),
}));

describe('writeQueue tests', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.mocked(batchUpdateValues).mockClear();
    localStorage.clear();
    
    // Clear the queue cleanly for a fresh test environment
    if (getQueueSize() > 0) {
      await flushQueue();
      vi.mocked(batchUpdateValues).mockClear();
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('queueWrite adds items that are processed in FIFO order', async () => {
    queueWrite('A1', [[1]]);
    queueWrite('B2', [[2]]);
    queueWrite('C3', [[3]]);
    
    expect(getQueueSize()).toBe(3);
    
    await flushQueue();
    
    expect(batchUpdateValues).toHaveBeenCalledTimes(1);
    expect(batchUpdateValues).toHaveBeenCalledWith('mock-id', [
      { range: 'A1', values: [[1]] },
      { range: 'B2', values: [[2]] },
      { range: 'C3', values: [[3]] },
    ]);
  });

  it('failed writes are persisted to localStorage for retry', async () => {
    vi.mocked(batchUpdateValues).mockRejectedValueOnce(new Error('Network error'));
    
    queueWrite('A1', [[1]]);
    await flushQueue();
    
    const stored = JSON.parse(localStorage.getItem(RETRY_STORAGE_KEY) || '[]');
    expect(stored).toEqual([{ range: 'A1', spreadsheetId: 'mock-id', values: [[1]] }]);
  });

  it('retryPersistedWrites processes queued items from localStorage', async () => {
    localStorage.setItem(RETRY_STORAGE_KEY, JSON.stringify([{ range: 'B2', values: [[2]] }]));
    
    await retryPersistedWrites();
    expect(getQueueSize()).toBe(1);
    
    await flushQueue();
    expect(batchUpdateValues).toHaveBeenCalledWith([{ range: 'B2', values: [[2]] }]);
  });

  it('queue respects maxRetryItems limit', async () => {
    const existing = Array.from({ length: 20 }, (_, i) => ({ range: `Z${i}`, values: [[i]] }));
    localStorage.setItem(RETRY_STORAGE_KEY, JSON.stringify(existing));
    
    vi.mocked(batchUpdateValues).mockRejectedValueOnce(new Error('Network error'));
    for (let i = 20; i < 60; i++) {
      queueWrite(`Z${i}`, [[i]]);
    }
    
    await flushQueue();
    
    const stored = JSON.parse(localStorage.getItem(RETRY_STORAGE_KEY) || '[]');
    expect(stored.length).toBe(50);
    expect(stored[0].range).toBe('Z10');
    expect(stored[49].range).toBe('Z59');
  });
});
