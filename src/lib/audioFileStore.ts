// src/lib/audioFileStore.ts
import { generateUuid } from './uuid';

export interface StoredAudioFile {
  id: string;         // UUID, generated on add
  name: string;       // display name (from filename with extension stripped)
  fileName: string;   // original filename
  blob: Blob;         // the audio data
  category: 'ambient' | 'effect';
  addedAt: number;    // timestamp
}

let dbPromise: Promise<IDBDatabase> | null = null;
let activeDB: IDBDatabase | null = null;
let currentCampaignId: string | null = null;

export function getDbName(campaignId: string): string {
  return `gm_audio_files_${campaignId}`;
}

export function getDB(campaignId: string): Promise<IDBDatabase> {
  if (dbPromise && currentCampaignId === campaignId) return dbPromise;

  // If we change campaigns, close the active connection first
  if (activeDB && currentCampaignId !== campaignId) {
    activeDB.close();
    activeDB = null;
    dbPromise = null;
  }

  currentCampaignId = campaignId;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(getDbName(campaignId), 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('audio-files')) {
        db.createObjectStore('audio-files', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      activeDB = request.result;
      resolve(request.result);
    };

    request.onerror = () => {
      // Clear promise so we can retry on next attempt
      dbPromise = null;
      activeDB = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

// Closes DB connection and resets state for clean testing
export async function closeDB(): Promise<void> {
  if (activeDB) {
    activeDB.close();
    activeDB = null;
  }
  dbPromise = null;
  currentCampaignId = null;
}

// Resets DB connection mainly for testing purposes
export function resetDB() {
  if (activeDB) {
    activeDB.close();
    activeDB = null;
  }
  dbPromise = null;
  currentCampaignId = null;
}

export async function saveAudioFile(
  campaignId: string,
  file: File,
  category: 'ambient' | 'effect'
): Promise<StoredAudioFile> {
  const db = await getDB(campaignId);
  const id = generateUuid();

  const name = file.name.replace(/\.[^/.]+$/, '');
  const storedFile: StoredAudioFile = {
    id,
    name,
    fileName: file.name,
    blob: new Blob([file], { type: file.type }),
    category,
    addedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('audio-files', 'readwrite');
    const store = transaction.objectStore('audio-files');
    const request = store.add(storedFile);

    request.onsuccess = () => {
      resolve(storedFile);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Alias for saveAudioFile
export const addAudioFile = saveAudioFile;

export async function getAllAudioFiles(campaignId: string): Promise<StoredAudioFile[]> {
  const db = await getDB(campaignId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('audio-files', 'readonly');
    const store = transaction.objectStore('audio-files');
    const request = store.getAll();

    request.onsuccess = () => {
      const files = request.result as StoredAudioFile[];
      files.sort((a, b) => a.name.localeCompare(b.name));
      resolve(files);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getAudioFile(campaignId: string, id: string): Promise<StoredAudioFile | null> {
  const db = await getDB(campaignId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('audio-files', 'readonly');
    const store = transaction.objectStore('audio-files');
    const request = store.get(id);

    request.onsuccess = () => {
      resolve((request.result as StoredAudioFile) || null);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function deleteAudioFile(campaignId: string, id: string): Promise<void> {
  const db = await getDB(campaignId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('audio-files', 'readwrite');
    const store = transaction.objectStore('audio-files');
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getAudioFilesByCategory(
  campaignId: string,
  category: 'ambient' | 'effect'
): Promise<StoredAudioFile[]> {
  const all = await getAllAudioFiles(campaignId);
  return all.filter((file) => file.category === category);
}

export async function clearAllAudioFiles(
  campaignId: string,
  category: 'ambient' | 'effect' | 'all'
): Promise<void> {
  const db = await getDB(campaignId);
  const files = await getAllAudioFiles(campaignId);
  const toDelete = files.filter(f => category === 'all' || f.category === category);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('audio-files', 'readwrite');
    const store = transaction.objectStore('audio-files');
    for (const file of toDelete) {
      store.delete(file.id);
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export function createObjectURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}
