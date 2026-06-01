// src/lib/audioEngine.ts

let audioCtx: AudioContext | null = null;

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return true;
  }
  return window.localStorage.getItem('gm_sounds_enabled') !== 'false';
}

export function initAudio(): void {
  if (typeof window === 'undefined') return;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    } else if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (err) {
    console.warn('[AudioEngine] Failed to initialize audio context:', err);
  }
}

// Helper to access safe AudioContext
function getAudioContext(): AudioContext | null {
  return audioCtx;
}

export function playDamageSound(): void {
  const ctx = getAudioContext();
  if (!ctx || !isSoundEnabled()) return;

  try {
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(150, ctx.currentTime);
    filter.Q.setValueAtTime(1.0, ctx.currentTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.8, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseNode.start();
    noiseNode.stop(ctx.currentTime + 0.3);
  } catch (err) {
    console.error('[AudioEngine] playDamageSound failed:', err);
  }
}

export function playHealSound(): void {
  const ctx = getAudioContext();
  if (!ctx || !isSoundEnabled()) return;

  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.6);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (err) {
    console.error('[AudioEngine] playHealSound failed:', err);
  }
}

export function playDeathSound(): void {
  const ctx = getAudioContext();
  if (!ctx || !isSoundEnabled()) return;

  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(55, ctx.currentTime + 2.0);

    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 2.0);
  } catch (err) {
    console.error('[AudioEngine] playDeathSound failed:', err);
  }
}

export function playUnconsciousSound(): void {
  const ctx = getAudioContext();
  if (!ctx || !isSoundEnabled()) return;

  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(55, ctx.currentTime + 1.2);

    // Create a vibrato effect/wobble in frequency using an LFO
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    lfo.frequency.setValueAtTime(8, ctx.currentTime); // 8 Hz wobble
    lfoGain.gain.setValueAtTime(15, ctx.currentTime); // 15 Hz deviation

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    lfo.start();
    osc.start();

    lfo.stop(ctx.currentTime + 1.2);
    osc.stop(ctx.currentTime + 1.2);
  } catch (err) {
    console.error('[AudioEngine] playUnconsciousSound failed:', err);
  }
}

export function playTurnStartSound(): void {
  const ctx = getAudioContext();
  if (!ctx || !isSoundEnabled()) return;

  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.0);
  } catch (err) {
    console.error('[AudioEngine] playTurnStartSound failed:', err);
  }
}

export function playRageSound(): void {
  const ctx = getAudioContext();
  if (!ctx || !isSoundEnabled()) return;

  try {
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(15, ctx.currentTime);
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.5);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.6, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseNode.start();
    noiseNode.stop(ctx.currentTime + 0.5);
  } catch (err) {
    console.error('[AudioEngine] playRageSound failed:', err);
  }
}

export function playDeathSaveFailSound(): void {
  const ctx = getAudioContext();
  if (!ctx || !isSoundEnabled()) return;

  try {
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, ctx.currentTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.8, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseNode.start();
    noiseNode.stop(ctx.currentTime + 0.2);
  } catch (err) {
    console.error('[AudioEngine] playDeathSaveFailSound failed:', err);
  }
}

export function playDeathSaveSuccessSound(): void {
  const ctx = getAudioContext();
  if (!ctx || !isSoundEnabled()) return;

  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (err) {
    console.error('[AudioEngine] playDeathSaveSuccessSound failed:', err);
  }
}

// Exported for testing purposes only to ensure test isolation
export function resetAudioContextForTesting(): void {
  audioCtx = null;
}

