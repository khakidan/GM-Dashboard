// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { queueWrite, flushQueue, getQueueSize, retryPersistedWrites } from '../writeQueue';
import { batchUpdateValues } from '../sheetsService';

vi.mock('../sheetsService', () => ({
  batchUpdateValues: vi.fn(),
  getSpreadsheetId: vi.fn().mockReturnValue('mock-id'),
}));

describe('writeQueue', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.mocked(batchUpdateValues).mockClear();
    
    // Clear the queue cleanly for a fresh test environment
    if (getQueueSize() > 0) {
      await flushQueue();
      vi.mocked(batchUpdateValues).mockClear();
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('queueWrite adds an entry and getQueueSize returns 1', () => {
    queueWrite('A1', [[1]]);
    expect(getQueueSize()).toBe(1);
  });

  it('queueWrite with the same range twice keeps only the latest values and getQueueSize still returns 1', async () => {
    queueWrite('A1', [[1]]);
    queueWrite('A1', [[2]]);
    expect(getQueueSize()).toBe(1);
    
    await flushQueue();
    expect(batchUpdateValues).toHaveBeenCalledWith([{ range: 'A1', values: [[2]] }]);
  });

  it('flushQueue calls batchUpdateValues once with all queued writes', async () => {
    queueWrite('A1', [[1]]);
    await flushQueue();
    expect(batchUpdateValues).toHaveBeenCalledTimes(1);
    expect(batchUpdateValues).toHaveBeenCalledWith([{ range: 'A1', values: [[1]] }]);
  });

  it('flushQueue on an empty queue does not call batchUpdateValues', async () => {
    await flushQueue();
    expect(batchUpdateValues).not.toHaveBeenCalled();
  });

  it('flushQueue clears the queue so getQueueSize returns 0 afterwards', async () => {
    queueWrite('A1', [[1]]);
    await flushQueue();
    expect(getQueueSize()).toBe(0);
  });

  it('Two different ranges are both included in a single flush call', async () => {
    queueWrite('A1', [[1]]);
    queueWrite('B2', [[2]]);
    expect(getQueueSize()).toBe(2);
    
    await flushQueue();
    expect(batchUpdateValues).toHaveBeenCalledTimes(1);
    expect(batchUpdateValues).toHaveBeenCalledWith([
      { range: 'A1', values: [[1]] },
      { range: 'B2', values: [[2]] },
    ]);
  });
});

describe('writeQueue persistence', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.mocked(batchUpdateValues).mockClear();
    
    if (getQueueSize() > 0) {
      await flushQueue();
      vi.mocked(batchUpdateValues).mockClear();
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('persistFailedWrites saves writes to localStorage under the correct key', async () => {
    vi.mocked(batchUpdateValues).mockRejectedValueOnce(new Error('Network error'));
    queueWrite('A1', [[1]]);
    await flushQueue();
    expect(localStorage.getItem('gm_failed_writes')).toBe(JSON.stringify([{ range: 'A1', values: [[1]] }]));
  });

  it('loadPersistedWrites returns an empty array when localStorage is empty', async () => {
    expect(localStorage.getItem('gm_failed_writes')).toBeNull();
    await retryPersistedWrites();
    expect(getQueueSize()).toBe(0);
  });

  it('loadPersistedWrites returns an empty array when localStorage contains invalid JSON', async () => {
    localStorage.setItem('gm_failed_writes', '{ invalid');
    await retryPersistedWrites();
    expect(getQueueSize()).toBe(0);
  });

  it('loadPersistedWrites returns previously saved writes correctly', async () => {
    localStorage.setItem('gm_failed_writes', JSON.stringify([{ range: 'B2', values: [[2]] }]));
    await retryPersistedWrites();
    expect(getQueueSize()).toBe(1);
    await flushQueue();
    expect(batchUpdateValues).toHaveBeenCalledWith([{ range: 'B2', values: [[2]] }]);
  });

  it('persistFailedWrites merges with existing stored writes, with the latest values winning on range conflicts', async () => {
    localStorage.setItem('gm_failed_writes', JSON.stringify([
      { range: 'A1', values: [[1]] },
      { range: 'B2', values: [[2]] }
    ]));
    
    vi.mocked(batchUpdateValues).mockRejectedValueOnce(new Error('Network error'));
    queueWrite('A1', [[99]]);
    queueWrite('C3', [[3]]);
    await flushQueue();
    
    const stored = JSON.parse(localStorage.getItem('gm_failed_writes') || '[]');
    expect(stored).toEqual([
      { range: 'A1', values: [[99]] },
      { range: 'B2', values: [[2]] },
      { range: 'C3', values: [[3]] }
    ]);
  });

  it('persistFailedWrites caps stored entries at 50', async () => {
    const existing = Array.from({ length: 20 }, (_, i) => ({ range: `Z${i}`, values: [[i]] }));
    localStorage.setItem('gm_failed_writes', JSON.stringify(existing));
    
    vi.mocked(batchUpdateValues).mockRejectedValueOnce(new Error('Network error'));
    for (let i = 20; i < 60; i++) {
        queueWrite(`Z${i}`, [[i]]);
    }
    await flushQueue();
    
    const stored = JSON.parse(localStorage.getItem('gm_failed_writes') || '[]');
    expect(stored.length).toBe(50);
    expect(stored[0].range).toBe('Z10');
    expect(stored[49].range).toBe('Z59');
  });

  it('retryPersistedWrites re-queues stored writes so getQueueSize increases', async () => {
    localStorage.setItem('gm_failed_writes', JSON.stringify([{ range: 'C3', values: [[3]] }]));
    expect(getQueueSize()).toBe(0);
    await retryPersistedWrites();
    expect(getQueueSize()).toBe(1);
  });

  it('retryPersistedWrites is a no-op when localStorage is empty', async () => {
    await retryPersistedWrites();
    expect(getQueueSize()).toBe(0);
  });

  it('flushQueue calls clearPersistedWrites after a successful batch write', async () => {
    localStorage.setItem('gm_failed_writes', JSON.stringify([{ range: 'A1', values: [[1]] }]));
    queueWrite('B2', [[2]]);
    await flushQueue();
    expect(localStorage.getItem('gm_failed_writes')).toBeNull();
  });

  it('flushQueue calls persistFailedWrites when batchUpdateValues throws', async () => {
    vi.mocked(batchUpdateValues).mockRejectedValueOnce(new Error('Network error'));
    queueWrite('D4', [[4]]);
    await flushQueue();
    expect(localStorage.getItem('gm_failed_writes')).toBe(JSON.stringify([{ range: 'D4', values: [[4]] }]));
  });
});
