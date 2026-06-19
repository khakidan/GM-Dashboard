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
  clearAllAudioFiles,
  closeDB,
  resetDB,
  getDbName,
} from '../audioFileStore';

// Ensure URL.createObjectURL is mocked
URL.createObjectURL = vi.fn().mockImplementation(() => 'mock://object-url');

describe('audioFileStore', () => {
  beforeEach(async () => {
    await closeDB();
    resetDB();
    // Delete databases to clean up between runs
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('gm_audio_files_abc');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('gm_audio_files_xyz');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });

  it('computes DB names correctly per campaign', () => {
    expect(getDbName('abc')).toBe('gm_audio_files_abc');
    expect(getDbName('xyz')).toBe('gm_audio_files_xyz');
  });

  it('saveAudioFile stores a file in campaign-scoped store and returns a record', async () => {
    const file = new File(['audio content'], '13_Cave_of_Time.mp3', { type: 'audio/mp3' });
    const record = await saveAudioFile('abc', file, 'ambient');

    expect(record.id).toBeDefined();
    expect(typeof record.id).toBe('string');
    expect(record.name).toBe('13_Cave_of_Time');
    expect(record.fileName).toBe('13_Cave_of_Time.mp3');
    expect(record.category).toBe('ambient');
    expect(record.blob).toBeInstanceOf(Blob);
    expect(record.addedAt).toBeLessThanOrEqual(Date.now());
  });

  it('namespaces completely between abc and xyz campaigns', async () => {
    const file1 = new File(['content abc'], 'Cave_ABC.mp3', { type: 'audio/mp3' });
    const file2 = new File(['content xyz'], 'Cave_XYZ.mp3', { type: 'audio/mp3' });

    await saveAudioFile('abc', file1, 'ambient');
    await saveAudioFile('xyz', file2, 'ambient');

    const filesInAbc = await getAllAudioFiles('abc');
    const filesInXyz = await getAllAudioFiles('xyz');

    expect(filesInAbc).toHaveLength(1);
    expect(filesInAbc[0].name).toBe('Cave_ABC');

    expect(filesInXyz).toHaveLength(1);
    expect(filesInXyz[0].name).toBe('Cave_XYZ');
  });

  it('getAllAudioFiles returns files sorted alphabetically by name', async () => {
    const file1 = new File(['c'], 'C_Music.mp3', { type: 'audio/mp3' });
    const file2 = new File(['a'], 'A_Music.mp3', { type: 'audio/mp3' });
    const file3 = new File(['b'], 'B_Music.mp3', { type: 'audio/mp3' });

    await saveAudioFile('abc', file1, 'ambient');
    await saveAudioFile('abc', file2, 'effect');
    await saveAudioFile('abc', file3, 'ambient');

    const all = await getAllAudioFiles('abc');
    expect(all).toHaveLength(3);
    expect(all[0].name).toBe('A_Music');
    expect(all[1].name).toBe('B_Music');
    expect(all[2].name).toBe('C_Music');
  });

  it('getAudioFile returns null for unknown id', async () => {
    const record = await getAudioFile('abc', 'non-existent-id');
    expect(record).toBeNull();
  });

  it('getAudioFilesByCategory filters correctly and remains sorted', async () => {
    const fileAmbient1 = new File(['amb1'], 'Cave.mp3', { type: 'audio/mp3' });
    const fileAmbient2 = new File(['amb2'], 'Antiquarian.mp3', { type: 'audio/mp3' });
    const fileEffect1 = new File(['eff1'], 'Volcano_Explosion.mp3', { type: 'audio/mp3' });

    await saveAudioFile('abc', fileAmbient1, 'ambient');
    await saveAudioFile('abc', fileAmbient2, 'ambient');
    await saveAudioFile('abc', fileEffect1, 'effect');

    const ambients = await getAudioFilesByCategory('abc', 'ambient');
    expect(ambients).toHaveLength(2);
    expect(ambients[0].name).toBe('Antiquarian');
    expect(ambients[1].name).toBe('Cave');

    const effects = await getAudioFilesByCategory('abc', 'effect');
    expect(effects).toHaveLength(1);
    expect(effects[0].name).toBe('Volcano_Explosion');
  });

  it('deleteAudioFile removes the file and getAllAudioFiles no longer returns it', async () => {
    const file = new File(['audio content'], '13_Cave_of_Time.mp3', { type: 'audio/mp3' });
    const record = await saveAudioFile('abc', file, 'ambient');

    const before = await getAllAudioFiles('abc');
    expect(before).toHaveLength(1);

    await deleteAudioFile('abc', record.id);

    const after = await getAllAudioFiles('abc');
    expect(after).toHaveLength(0);

    const check = await getAudioFile('abc', record.id);
    expect(check).toBeNull();
  });

  it('clearAllAudioFiles cleans files of proper categories', async () => {
    const fileAmbient = new File(['amb'], 'Cave.mp3', { type: 'audio/mp3' });
    const fileEffect = new File(['eff'], 'Bang.mp3', { type: 'audio/mp3' });

    await saveAudioFile('abc', fileAmbient, 'ambient');
    await saveAudioFile('abc', fileEffect, 'effect');

    await clearAllAudioFiles('abc', 'ambient');

    const remaining = await getAllAudioFiles('abc');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].name).toBe('Bang');
  });

  it('createObjectURL returns a string', () => {
    const blob = new Blob(['content'], { type: 'audio/mp3' });
    const url = createObjectURL(blob);
    expect(url).toBeTypeOf('string');
  });
});
