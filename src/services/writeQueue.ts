import { batchUpdateValues } from './sheetsService';
import { toast } from 'sonner';
import { STORAGE_KEYS } from '../lib/constants';

const queue = new Map<string, { range: string; values: any[][] }>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const RETRY_STORAGE_KEY = STORAGE_KEYS.writeRetryQueue;

function loadPersistedWrites(): Array<{range: string, values: any[][]}> {
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

function persistFailedWrites(writes: Array<{range: string, values: any[][]}>) {
  const existing = loadPersistedWrites();
  const mergedMap = new Map<string, {range: string, values: any[][]}>();
  
  for (const item of existing) {
    if (item && item.range) mergedMap.set(item.range, item);
  }
  for (const item of writes) {
    if (item && item.range) mergedMap.set(item.range, item);
  }
  
  const mergedArray = Array.from(mergedMap.values());
  const capped = mergedArray.slice(-50);
  
  localStorage.setItem(RETRY_STORAGE_KEY, JSON.stringify(capped));
}

export function clearRetryQueue(): void {
  localStorage.removeItem(RETRY_STORAGE_KEY);
}

function clearPersistedWrites() {
  localStorage.removeItem(RETRY_STORAGE_KEY);
}

export function queueWrite(range: string, values: any[][]): void {
  queue.set(range, { range, values });
  
  if (flushTimer) {
    clearTimeout(flushTimer);
  }
  
  flushTimer = setTimeout(() => {
    void flushQueue();
  }, 2000);
}

export async function flushQueue(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (queue.size === 0) {
    return;
  }

  // Drain the queue to a local array so new writes can be queued during flush
  const data = Array.from(queue.values());
  queue.clear();

  const tId = toast.loading('Syncing changes...');
  try {
    await batchUpdateValues(data);
    toast.success('Changes synced successfully', { id: tId });
    clearPersistedWrites();
  } catch (err) {
    persistFailedWrites(data);
    console.error('[WriteQueue] Failed to flush queue:', err);
    toast.error('Failed to sync some changes', { id: tId });
    // Do not re-throw — failed writes are persisted to 
    // localStorage and retried automatically on reconnect.
    // Throwing here would interrupt the GM's session.
  }
}

export function getQueueSize(): number {
  return queue.size;
}

export async function retryPersistedWrites(): Promise<void> {
  const writes = loadPersistedWrites();
  if (writes.length === 0) return;
  for (const write of writes) {
    queueWrite(write.range, write.values);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void retryPersistedWrites();
  });
}
