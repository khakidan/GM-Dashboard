import { batchUpdateValues, resolveActiveSpreadsheetId } from './sheetsService';
import { toast } from 'sonner';
import { STORAGE_KEYS, TIMERS } from '../lib/constants';

type WriteValue = string | number | boolean | null;
type WriteGrid = WriteValue[][];

const queue = new Map<string, { spreadsheetId: string; range: string; values: WriteGrid }>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const RETRY_STORAGE_KEY = STORAGE_KEYS.writeRetryQueue;

function loadPersistedWrites(): Array<{ spreadsheetId: string; range: string; values: WriteGrid }> {
  try {
    const raw = localStorage.getItem(RETRY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function persistFailedWrites(writes: Array<{ spreadsheetId: string; range: string; values: WriteGrid }>) {
  const existing = loadPersistedWrites();
  const mergedMap = new Map<string, { spreadsheetId?: string; range: string; values: WriteGrid }>();
  
  for (const item of existing) {
    if (item && item.range) {
      const spId = item.spreadsheetId || '';
      mergedMap.set(`${spId}|${item.range}`, item);
    }
  }
  for (const item of writes) {
    if (item && item.range) {
      const spId = item.spreadsheetId || '';
      const toStore: any = { range: item.range, values: item.values };
      if (item.spreadsheetId) {
        toStore.spreadsheetId = item.spreadsheetId;
      }
      mergedMap.set(`${spId}|${item.range}`, toStore);
    }
  }
  
  const mergedArray = Array.from(mergedMap.values()).map(item => {
    const res: any = { range: item.range, values: item.values };
    if (item.spreadsheetId) {
      res.spreadsheetId = item.spreadsheetId;
    }
    return res;
  });
  const capped = mergedArray.slice(-50);
  
  localStorage.setItem(RETRY_STORAGE_KEY, JSON.stringify(capped));
}

export function clearRetryQueue(): void {
  localStorage.removeItem(RETRY_STORAGE_KEY);
}

function clearPersistedWrites() {
  localStorage.removeItem(RETRY_STORAGE_KEY);
}

export function queueWrite(spreadsheetIdOrRange: string, rangeOrValues: WriteGrid | string, optionalValues?: WriteGrid): void {
  let spreadsheetId = '';
  let range = '';
  let values: WriteGrid;

  if (optionalValues !== undefined) {
    spreadsheetId = spreadsheetIdOrRange;
    range = rangeOrValues as string;
    values = optionalValues;
  } else {
    range = spreadsheetIdOrRange;
    values = rangeOrValues as WriteGrid;
    spreadsheetId = resolveActiveSpreadsheetId();
  }

  const queueKey = `${spreadsheetId}|${range}`;
  queue.set(queueKey, { spreadsheetId, range, values });
  
  if (flushTimer) {
    clearTimeout(flushTimer);
  }
  
  flushTimer = setTimeout(() => {
    void flushQueue();
  }, TIMERS.writeQueuePollingMs);
}

export async function flushQueue(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (queue.size === 0) {
    return;
  }

  const data = Array.from(queue.values());
  queue.clear();

  try {
    const groups = new Map<string, Array<{ range: string; values: WriteGrid }>>();
    for (const item of data) {
      if (!groups.has(item.spreadsheetId)) {
        groups.set(item.spreadsheetId, []);
      }
      groups.get(item.spreadsheetId)!.push({ range: item.range, values: item.values });
    }

    await Promise.all(
      Array.from(groups.entries()).map(([spreadsheetId, writes]) => {
        if (!spreadsheetId) {
          return batchUpdateValues(writes);
        }
        return batchUpdateValues(spreadsheetId, writes);
      })
    );

    clearPersistedWrites();
  } catch (err) {
    persistFailedWrites(data);
    console.error('[WriteQueue] Failed to flush queue:', err);
    toast.error('Failed to sync some changes');
  }
}

export function getQueueSize(): number {
  return queue.size;
}

export async function retryPersistedWrites(): Promise<void> {
  const writes = loadPersistedWrites();
  if (writes.length === 0) return;
  for (const write of writes) {
    queueWrite(write.spreadsheetId || '', write.range, write.values);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void retryPersistedWrites();
  });
}
