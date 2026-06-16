// src/lib/__tests__/audioFileStore.test.ts

import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveAudioFile,
  getAllAudioFiles,
  getAudioFile,
  deleteAudioFile,
  getAudioFilesByCategory,
  createObjectURL,
  closeDB,
  resetDB,
} from '../audioFileStore';

// Ensure URL.createObjectURL is mocked
URL.createObjectURL = vi.fn().mockImplementation(() => 'mock://object-url');

describe('audioFileStore', () => {
  beforeEach(async () => {
    await closeDB();
    resetDB();
    // Delete database to clean up between runs
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('gm-audio-store');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });

  it('saveAudioFile stores a file and returns a record with a generated id', async () => {
    const file = new File(['audio content'], '13_Cave_of_Time.mp3', { type: 'audio/mp3' });
    const record = await saveAudioFile(file, 'ambient');

    expect(record.id).toBeDefined();
    expect(typeof record.id).toBe('string');
    expect(record.name).toBe('13_Cave_of_Time');
    expect(record.fileName).toBe('13_Cave_of_Time.mp3');
    expect(record.category).toBe('ambient');
    expect(record.blob).toBeInstanceOf(Blob);
    expect(record.addedAt).toBeLessThanOrEqual(Date.now());
  });

  it('getAllAudioFiles returns files sorted alphabetically by name', async () => {
    const file1 = new File(['c'], 'C_Music.mp3', { type: 'audio/mp3' });
    const file2 = new File(['a'], 'A_Music.mp3', { type: 'audio/mp3' });
    const file3 = new File(['b'], 'B_Music.mp3', { type: 'audio/mp3' });

    await saveAudioFile(file1, 'ambient');
    await saveAudioFile(file2, 'effect');
    await saveAudioFile(file3, 'ambient');

    const all = await getAllAudioFiles();
    expect(all).toHaveLength(3);
    expect(all[0].name).toBe('A_Music');
    expect(all[1].name).toBe('B_Music');
    expect(all[2].name).toBe('C_Music');
  });

  it('getAudioFile returns null for unknown id', async () => {
    const record = await getAudioFile('non-existent-id');
    expect(record).toBeNull();
  });

  it('getAudioFilesByCategory filters correctly and remains sorted', async () => {
    const fileAmbient1 = new File(['amb1'], 'Cave.mp3', { type: 'audio/mp3' });
    const fileAmbient2 = new File(['amb2'], 'Antiquarian.mp3', { type: 'audio/mp3' });
    const fileEffect1 = new File(['eff1'], 'Volcano_Explosion.mp3', { type: 'audio/mp3' });

    await saveAudioFile(fileAmbient1, 'ambient');
    await saveAudioFile(fileAmbient2, 'ambient');
    await saveAudioFile(fileEffect1, 'effect');

    const ambients = await getAudioFilesByCategory('ambient');
    expect(ambients).toHaveLength(2);
    expect(ambients[0].name).toBe('Antiquarian'); // 'Antiquarian' before 'Cave'
    expect(ambients[1].name).toBe('Cave');

    const effects = await getAudioFilesByCategory('effect');
    expect(effects).toHaveLength(1);
    expect(effects[0].name).toBe('Volcano_Explosion');
  });

  it('deleteAudioFile removes the file and getAllAudioFiles no longer returns it', async () => {
    const file = new File(['audio content'], '13_Cave_of_Time.mp3', { type: 'audio/mp3' });
    const record = await saveAudioFile(file, 'ambient');

    const before = await getAllAudioFiles();
    expect(before).toHaveLength(1);

    await deleteAudioFile(record.id);

    const after = await getAllAudioFiles();
    expect(after).toHaveLength(0);

    const check = await getAudioFile(record.id);
    expect(check).toBeNull();
  });

  it('createObjectURL returns a string', () => {
    const blob = new Blob(['content'], { type: 'audio/mp3' });
    const url = createObjectURL(blob);
    expect(url).toBeTypeOf('string');
  });
});
