// src/lib/__tests__/audioEngine.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isSoundEnabled,
  initAudio,
  playDamageSound,
  playHealSound,
  playDeathSound,
  playUnconsciousSound,
  playTurnStartSound,
  playRageSound,
  playDeathSaveFailSound,
  playDeathSaveSuccessSound,
  resetAudioContextForTesting
} from '../audioEngine';

describe('AudioEngine Unit Tests', () => {
  let mockGainNode: any;
  let mockOscillatorNode: any;
  let mockBufferSourceNode: any;
  let mockFilterNode: any;
  let mockAudioContext: any;

  beforeEach(() => {
    // Reset private AudioContext singleton
    resetAudioContextForTesting();

    // Reset localstorage mocks
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => {
        if (key === 'gm_sounds_enabled') return null;
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    // Setup typical Web Audio API mocks
    mockGainNode = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    mockOscillatorNode = {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockBufferSourceNode = {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockFilterNode = {
      type: 'lowpass',
      Q: {
        setValueAtTime: vi.fn(),
      },
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    mockAudioContext = {
      sampleRate: 44100,
      currentTime: 0.1,
      state: 'suspended',
      resume: vi.fn().mockResolvedValue(undefined),
      destination: {},
      createGain: vi.fn(() => mockGainNode),
      createOscillator: vi.fn(() => mockOscillatorNode),
      createBuffer: vi.fn(() => ({
        getChannelData: vi.fn(() => new Float32Array(100)),
      })),
      createBiquadFilter: vi.fn(() => mockFilterNode),
      createBufferSource: vi.fn(() => mockBufferSourceNode),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('isSoundEnabled returns true by default', () => {
    expect(isSoundEnabled()).toBe(true);
  });

  it('isSoundEnabled returns false when localStorage has sounds disabled', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => {
        if (key === 'gm_sounds_enabled') return 'false';
        return null;
      }),
      setItem: vi.fn(),
    });
    expect(isSoundEnabled()).toBe(false);
  });

  it('isSoundEnabled returns true when localStorage has sounds enabled explicitly', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => {
        if (key === 'gm_sounds_enabled') return 'true';
        return null;
      }),
      setItem: vi.fn(),
    });
    expect(isSoundEnabled()).toBe(true);
  });

  it('play* functions fail silently and do not throw when called without initialised AudioContext', () => {
    expect(() => playDamageSound()).not.toThrow();
    expect(() => playHealSound()).not.toThrow();
    expect(() => playDeathSound()).not.toThrow();
    expect(() => playUnconsciousSound()).not.toThrow();
    expect(() => playTurnStartSound()).not.toThrow();
    expect(() => playRageSound()).not.toThrow();
    expect(() => playDeathSaveFailSound()).not.toThrow();
    expect(() => playDeathSaveSuccessSound()).not.toThrow();
  });

  it('all play* functions check isSoundEnabled before playing', () => {
    // Disable sounds
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'false'),
      setItem: vi.fn(),
    });

    // Initialize audio context structure mocked using a proper class
    class MockAudioContext {
      constructor() {
        return mockAudioContext;
      }
    }
    vi.stubGlobal('AudioContext', MockAudioContext);
    
    // Call init to set up context
    initAudio();

    // Verify calling all play* functions does not result in calling factory methods on context because sound is disabled
    playDamageSound();
    playHealSound();
    playDeathSound();
    playUnconsciousSound();
    playTurnStartSound();
    playRageSound();
    playDeathSaveFailSound();
    playDeathSaveSuccessSound();

    expect(mockAudioContext.createGain).not.toHaveBeenCalled();
    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
  });

  it('all play* functions run successfully if sounds are enabled and AudioContext is initialized', () => {
    // Enable sounds
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'true'),
      setItem: vi.fn(),
    });

    // Provide constructor mock using a class
    class MockAudioContext {
      constructor() {
        return mockAudioContext;
      }
    }
    vi.stubGlobal('AudioContext', MockAudioContext);

    // Initialise audio context
    initAudio();

    // Trigger sounds and verify appropriate web audio methods are invoked
    playDamageSound();
    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
    expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();

    playHealSound();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();

    playDeathSound();
    playUnconsciousSound();
    playTurnStartSound();
    playRageSound();
    playDeathSaveFailSound();
    playDeathSaveSuccessSound();

    expect(mockAudioContext.createGain).toHaveBeenCalled();
  });
});
