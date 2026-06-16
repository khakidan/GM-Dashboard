// src/lib/audioFileStore.ts

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

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('gm-audio-store', 1);

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
}

// Resets DB connection mainly for testing purposes
export function resetDB() {
  if (activeDB) {
    activeDB.close();
    activeDB = null;
  }
  dbPromise = null;
}

export async function saveAudioFile(
  file: File,
  category: 'ambient' | 'effect'
): Promise<StoredAudioFile> {
  const db = await getDB();
  const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

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

export async function getAllAudioFiles(): Promise<StoredAudioFile[]> {
  const db = await getDB();
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

export async function getAudioFile(id: string): Promise<StoredAudioFile | null> {
  const db = await getDB();
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

export async function deleteAudioFile(id: string): Promise<void> {
  const db = await getDB();
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
  category: 'ambient' | 'effect'
): Promise<StoredAudioFile[]> {
  const all = await getAllAudioFiles();
  return all.filter((file) => file.category === category);
}

export function createObjectURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}
