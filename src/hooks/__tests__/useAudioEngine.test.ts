// src/hooks/__tests__/useAudioEngine.test.ts

import 'fake-indexeddb/auto';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioEngine, resetAudioEngineState } from '../useAudioEngine';
import { closeDB, resetDB } from '../../lib/audioFileStore';

// Ensure URL.createObjectURL is mocked
URL.createObjectURL = vi.fn().mockImplementation(() => 'mock://object-url');

// Mock Blob.prototype.arrayBuffer to prevent virtual environment hangs
Blob.prototype.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

// Mock Web Audio API
class MockAudioContext {
  state = 'suspended';
  currentTime = 0;
  resume = vi.fn().mockImplementation(async () => {
    this.state = 'running';
  });
  createMediaElementSource = vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
  }));
  createGain = vi.fn().mockImplementation(() => ({
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  }));
  createBufferSource = vi.fn().mockImplementation(() => ({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
  }));
  decodeAudioData = vi.fn().mockImplementation(async () => {
    return {} as AudioBuffer;
  });
  destination = {} as AudioNode;
}

class MockAudio {
  src = '';
  crossOrigin = '';
  loop = false;
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
}

// Attach mocks globally and to window
globalThis.AudioContext = MockAudioContext as any;
globalThis.Audio = MockAudio as any;
if (typeof window !== 'undefined') {
  (window as any).AudioContext = MockAudioContext;
  (window as any).webkitAudioContext = MockAudioContext;
  (window as any).Audio = MockAudio;
}

describe('useAudioEngine', () => {
  beforeEach(async () => {
    resetAudioEngineState();
    // Allow any pending background DB mounts to complete so they can be closed cleanly
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
    await closeDB();
    resetDB();
    // Delete database to start clean
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('gm-audio-store');
      req.onsuccess = () => resolve();
    });
    localStorage.clear();
  });

  afterEach(async () => {
    resetAudioEngineState();
    // Allow any pending background DB mounts to complete so they can be closed cleanly
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
    await closeDB();
    resetDB();
  });

  it('storedFiles is populated from IndexedDB on mount', async () => {
    const file = new File(['audio'], '13_Cave_of_Time.mp3', { type: 'audio/mp3' });
    const { saveAudioFile } = await import('../../lib/audioFileStore');
    const stored = await saveAudioFile(file, 'ambient');

    const { result } = renderHook(() => useAudioEngine());

    await vi.waitFor(() => {
      expect(result.current.storedFiles).toHaveLength(1);
      expect(result.current.storedFiles[0].id).toBe(stored.id);
    });
  });

  it('addFiles saves files and refreshes storedFiles', async () => {
    const { result } = renderHook(() => useAudioEngine());

    const file1 = new File(['a'], 'TrackA.mp3', { type: 'audio/mp3' });
    const file2 = new File(['b'], 'TrackB.mp3', { type: 'audio/mp3' });

    await act(async () => {
      await result.current.addFiles([file1, file2], 'ambient');
    });

    expect(result.current.storedFiles).toHaveLength(2);
    expect(result.current.storedFiles[0].name).toBe('TrackA');
    expect(result.current.storedFiles[1].name).toBe('TrackB');
  });

  it('removeFile deletes from IndexedDB and removes from storedFiles', async () => {
    const { result } = renderHook(() => useAudioEngine());

    const file = new File(['audio'], 'Track.mp3', { type: 'audio/mp3' });
    await act(async () => {
      await result.current.addFiles([file], 'ambient');
    });

    expect(result.current.storedFiles).toHaveLength(1);
    const addedId = result.current.storedFiles[0].id;

    await act(async () => {
      await result.current.removeFile(addedId);
    });

    expect(result.current.storedFiles).toHaveLength(0);
  });

  it('playAmbient sets currentAmbientId to the provided fileId', async () => {
    const { result } = renderHook(() => useAudioEngine());

    const file = new File(['audio'], 'Track.mp3', { type: 'audio/mp3' });
    await act(async () => {
      await result.current.addFiles([file], 'ambient');
    });

    const fileId = result.current.storedFiles[0].id;

    await act(async () => {
      await result.current.playAmbient(fileId);
    });

    expect(result.current.currentAmbientId).toBe(fileId);
    expect(result.current.isAmbientPlaying).toBe(true);
  });

  it('stopAmbient sets currentAmbientId to null and isAmbientPlaying to false', async () => {
    const { result } = renderHook(() => useAudioEngine());

    const file = new File(['audio'], 'Track.mp3', { type: 'audio/mp3' });
    await act(async () => {
      await result.current.addFiles([file], 'ambient');
    });

    const fileId = result.current.storedFiles[0].id;

    await act(async () => {
      await result.current.playAmbient(fileId);
    });

    expect(result.current.currentAmbientId).toBe(fileId);

    await act(async () => {
      await result.current.stopAmbient();
    });

    expect(result.current.currentAmbientId).toBeNull();
    expect(result.current.isAmbientPlaying).toBe(false);
  });

  it('setAmbientVolume updates ambientVolume and saves to localStorage', async () => {
    const { result } = renderHook(() => useAudioEngine());

    await act(async () => {
      result.current.setAmbientVolume(0.4);
    });

    expect(result.current.ambientVolume).toBe(0.4);
    expect(localStorage.getItem('gm_ambient_volume')).toBe('0.4');
  });

  it('playEffect does not affect currentAmbientId or isAmbientPlaying', async () => {
    const { result } = renderHook(() => useAudioEngine());

    const ambientFile = new File(['audio'], 'Ambient.mp3', { type: 'audio/mp3' });
    const effectFile = new File(['audio'], 'Effect.mp3', { type: 'audio/mp3' });

    await act(async () => {
      await result.current.addFiles([ambientFile], 'ambient');
      await result.current.addFiles([effectFile], 'effect');
    });

    const ambientId = result.current.storedFiles.find((f) => f.category === 'ambient')!.id;
    const effectId = result.current.storedFiles.find((f) => f.category === 'effect')!.id;

    await act(async () => {
      await result.current.playAmbient(ambientId);
    });

    expect(result.current.currentAmbientId).toBe(ambientId);
    expect(result.current.isAmbientPlaying).toBe(true);

    await act(async () => {
      await result.current.playEffect(effectId);
    });

    // Ambient state remains untouched
    expect(result.current.currentAmbientId).toBe(ambientId);
    expect(result.current.isAmbientPlaying).toBe(true);
  });
});
