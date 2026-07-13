import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioEngine, resetAudioEngineState } from '../useAudioEngine';
import { getAllAudioFiles } from '../../lib/audioFileStore';
import { AUDIO } from '../../lib/constants';

// Mock audioFileStore
vi.mock('../../lib/audioFileStore', () => ({
  getAllAudioFiles: vi.fn(),
  saveAudioFile: vi.fn(),
  deleteAudioFile: vi.fn(),
}));

describe('useAudioEngine Race Condition & Timer Cancellation Tests', () => {
  let mockAudioElements: any[] = [];
  let mockObjectURLs: Set<string> = new Set();

  class MockAudioContext {
    state = 'suspended';
    destination = {};
    get currentTime() {
      return Date.now() / 1000;
    }
    resume() {
      this.state = 'running';
      return Promise.resolve();
    }
    createMediaElementSource(audio: any) {
      return {
        connect: vi.fn(),
      };
    }
    createGain() {
      return {
        gain: {
          value: 1,
          cancelScheduledValues: vi.fn(),
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      };
    }
  }

  class MockAudio {
    _src = '';
    loop = false;
    crossOrigin = '';
    
    constructor() {
      mockAudioElements.push(this);
    }

    get src() {
      return this._src;
    }

    set src(value: string) {
      this._src = value;
    }

    play = vi.fn().mockResolvedValue(undefined);
    pause = vi.fn();
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    mockAudioElements = [];
    mockObjectURLs = new Set();

    vi.stubGlobal('Audio', MockAudio);
    vi.stubGlobal('AudioContext', MockAudioContext);
    vi.stubGlobal('webkitAudioContext', MockAudioContext);

    URL.createObjectURL = vi.fn().mockImplementation(() => {
      const url = `blob:mock-url-${mockObjectURLs.size}`;
      mockObjectURLs.add(url);
      return url;
    });

    URL.revokeObjectURL = vi.fn().mockImplementation((url) => {
      mockObjectURLs.delete(url);
    });

    vi.mocked(getAllAudioFiles).mockResolvedValue([
      {
        id: 'track-1',
        name: 'Track 1',
        fileName: 'track1.mp3',
        blob: new Blob(['audio1'], { type: 'audio/mp3' }),
        category: 'ambient',
        addedAt: Date.now(),
      },
      {
        id: 'track-2',
        name: 'Track 2',
        fileName: 'track2.mp3',
        blob: new Blob(['audio2'], { type: 'audio/mp3' }),
        category: 'ambient',
        addedAt: Date.now(),
      },
      {
        id: 'track-3',
        name: 'Track 3',
        fileName: 'track3.mp3',
        blob: new Blob(['audio3'], { type: 'audio/mp3' }),
        category: 'ambient',
        addedAt: Date.now(),
      },
    ]);
  });

  afterEach(() => {
    act(() => {
      resetAudioEngineState();
    });
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('successfully mitigates the race condition by cancelling stale deck cleanup timers', async () => {
    const { result } = renderHook(() => useAudioEngine('test-campaign'));

    // Wait for initial files to load
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(result.current.storedFiles).toHaveLength(3);

    // Call playAmbient 3 times in rapid succession:
    // Call 1 at t = 0
    await act(async () => {
      await result.current.playAmbient('track-1');
    });

    // Verify 2 decks got created when initAmbient ran
    expect(mockAudioElements).toHaveLength(2);
    const deckA_audio = mockAudioElements[0];
    const deckB_audio = mockAudioElements[1];

    // Under playAmbient('track-1'):
    // Active deck was 'A', so track-1 went to incoming deckB.
    expect(deckB_audio.src).toBe('blob:mock-url-0');
    expect(deckB_audio.play).toHaveBeenCalledTimes(1);

    // Call 2 at t = 500ms
    vi.advanceTimersByTime(500);
    await act(async () => {
      await result.current.playAmbient('track-2');
    });

    const crossfadeMs = AUDIO.crossfadeDurationSec * 1000;

    // Active deck was 'B', so track-2 went to incoming deckA.
    // Cleanup of deckB (holding track-1) is scheduled for:
    // t = 500ms + crossfade duration = 500 + crossfadeMs
    expect(deckA_audio.src).toBe('blob:mock-url-1');
    expect(deckA_audio.play).toHaveBeenCalledTimes(1);

    // Call 3 at t = 1000ms
    vi.advanceTimersByTime(500);
    await act(async () => {
      await result.current.playAmbient('track-3');
    });

    // Active deck was 'A', so track-3 went to incoming deckB.
    // Crucially, this MUST cancel the pending cleanup of deckB!
    // A new cleanup of deckA (holding track-2) is scheduled for:
    // t = 1000ms + crossfade duration = 1000 + crossfadeMs
    expect(deckB_audio.src).toBe('blob:mock-url-2');
    expect(deckB_audio.play).toHaveBeenCalledTimes(2);

    // Reset play/pause mocks to monitor cleanups during timer execution
    deckA_audio.pause.mockClear();
    deckB_audio.pause.mockClear();

    // Advance time to when the stale deckB cleanup timer (from Call 2) would have fired:
    // Target is t = 500 + crossfadeMs
    // Since we are currently at t = 1000, we advance by: (500 + crossfadeMs) - 1000 = crossfadeMs - 500
    const advanceToStaleTimerMs = crossfadeMs - 500;
    vi.advanceTimersByTime(advanceToStaleTimerMs);
    
    // Verify deckB (which now holds the currently playing track-3) is STILL playing and untouched.
    expect(deckB_audio.src).toBe('blob:mock-url-2');
    expect(deckB_audio.pause).not.toHaveBeenCalled();

    // Advance time to when deckA's cleanup timer (from Call 3) should fire:
    // Target is t = 1000 + crossfadeMs
    // Since we are currently at t = 500 + crossfadeMs, we advance by: (1000 + crossfadeMs) - (500 + crossfadeMs) = 500ms
    const advanceToFinalTimerMs = 500;
    vi.advanceTimersByTime(advanceToFinalTimerMs);
    
    // Verify deckA (which holds outgoing track-2) gets correctly stopped and cleaned up.
    expect(deckA_audio.src).toBe('');
    expect(deckA_audio.pause).toHaveBeenCalledTimes(1);

    // Ensure currently playing track-3 on deckB remains completely active
    expect(deckB_audio.src).toBe('blob:mock-url-2');
    expect(deckB_audio.pause).not.toHaveBeenCalled();
  });
});
