// src/hooks/useAudioEngine.ts

import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../lib/constants';
import {
  saveAudioFile,
  getAllAudioFiles,
  deleteAudioFile,
  createObjectURL,
  StoredAudioFile,
} from '../lib/audioFileStore';

// Global singletons for Web Audio and HTML5 Elements
let globalAudioContext: AudioContext | null = null;
let globalAmbientAudioElement: HTMLAudioElement | null = null;
let globalAmbientSourceNode: MediaElementAudioSourceNode | null = null;
let globalAmbientGainNode: GainNode | null = null;
const globalEffectCache = new Map<string, AudioBuffer>();

// Global reactive states
let globalCurrentAmbientId: string | null = null;
let globalIsAmbientPlaying = false;
let globalAmbientVolume = 0.7;
let globalEffectVolume = 0.8;
let globalStoredFiles: StoredAudioFile[] = [];

// Storage defaults
if (typeof localStorage !== 'undefined') {
  const savedAmbient = localStorage.getItem(STORAGE_KEYS.ambientVolume);
  if (savedAmbient !== null) {
    globalAmbientVolume = Number(savedAmbient);
  }
  const savedEffect = localStorage.getItem(STORAGE_KEYS.effectVolume);
  if (savedEffect !== null) {
    globalEffectVolume = Number(savedEffect);
  }
}

// Reactivity list
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore errors from unmounted components or stale hooks
    }
  });
}

// Initialize general audio context lazily on user gesture
function initAudio() {
  if (!globalAudioContext) {
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    globalAudioContext = new AudioContextClass();
  }
  if (globalAudioContext.state === 'suspended') {
    globalAudioContext.resume();
  }
}

// Initialize ambient HTMLAudioElement and Gain Nodes lazily
function initAmbient() {
  initAudio();
  if (!globalAudioContext) return;

  if (!globalAmbientAudioElement) {
    globalAmbientAudioElement = new Audio();
    globalAmbientAudioElement.crossOrigin = 'anonymous';
    globalAmbientAudioElement.loop = true;

    globalAmbientSourceNode = globalAudioContext.createMediaElementSource(globalAmbientAudioElement);
    globalAmbientGainNode = globalAudioContext.createGain();
    globalAmbientGainNode.gain.setValueAtTime(globalAmbientVolume, globalAudioContext.currentTime);

    globalAmbientSourceNode.connect(globalAmbientGainNode);
    globalAmbientGainNode.connect(globalAudioContext.destination);
  }
}

// Global flag to kick off first load
let initialLoadStarted = false;
async function initFiles() {
  if (initialLoadStarted) return;
  initialLoadStarted = true;
  await refreshFiles();
}

async function refreshFiles() {
  globalStoredFiles = await getAllAudioFiles();
  notifyListeners();
}

export function resetAudioEngineState() {
  globalCurrentAmbientId = null;
  globalIsAmbientPlaying = false;
  globalAmbientVolume = 0.7;
  globalEffectVolume = 0.8;
  globalStoredFiles = [];
  initialLoadStarted = false;
  globalEffectCache.clear();
  if (globalAmbientAudioElement) {
    globalAmbientAudioElement.pause();
    globalAmbientAudioElement.src = '';
  }
  globalAudioContext = null;
  globalAmbientAudioElement = null;
  globalAmbientSourceNode = null;
  globalAmbientGainNode = null;
}

export function useAudioEngine() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setTick((t) => t + 1);
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  useEffect(() => {
    initFiles();
  }, []);

  // Play Ambient FileId (using HTML5 Streaming + Web Audio Gain fading)
  async function playAmbient(fileId: string) {
    initAmbient();
    if (!globalAudioContext || !globalAmbientAudioElement || !globalAmbientGainNode) {
      console.error('Audio nodes could not be initialized');
      return;
    }

    const file = globalStoredFiles.find((f) => f.id === fileId);
    if (!file) {
      console.error(`Ambient track not found for ID: ${fileId}`);
      return;
    }

    const prevId = globalCurrentAmbientId;
    const wasPlaying = globalIsAmbientPlaying;

    globalCurrentAmbientId = fileId;
    globalIsAmbientPlaying = true;
    notifyListeners();

    // If already playing another track, fade out current music
    if (wasPlaying && prevId !== fileId) {
      const currTime = globalAudioContext.currentTime;
      globalAmbientGainNode.gain.cancelScheduledValues(currTime);
      globalAmbientGainNode.gain.setValueAtTime(globalAmbientGainNode.gain.value, currTime);
      globalAmbientGainNode.gain.linearRampToValueAtTime(0, currTime + 1.5);

      // Wait 1.5s for audio fade out
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 1500);
      });

      // Guard check: did user stop or pick another file during fadeout?
      if (globalCurrentAmbientId !== fileId || !globalIsAmbientPlaying) {
        return;
      }
    }

    const objectUrl = createObjectURL(file.blob);
    globalAmbientAudioElement.src = objectUrl;

    const currTime = globalAudioContext.currentTime;
    globalAmbientGainNode.gain.cancelScheduledValues(currTime);
    globalAmbientGainNode.gain.setValueAtTime(0, currTime);

    try {
      await globalAmbientAudioElement.play();
    } catch (err) {
      console.warn('[Ambient audio] failed to start play:', err);
    }

    // Fade in to desired volume over 1.5s
    const latestTime = globalAudioContext.currentTime;
    globalAmbientGainNode.gain.linearRampToValueAtTime(globalAmbientVolume, latestTime + 1.5);
    notifyListeners();
  }

  // Fade out current playing track over 1.5s, then stop
  async function stopAmbient() {
    if (!globalAmbientAudioElement || !globalAmbientGainNode || !globalAudioContext) {
      globalCurrentAmbientId = null;
      globalIsAmbientPlaying = false;
      notifyListeners();
      return;
    }

    const currTime = globalAudioContext.currentTime;
    globalAmbientGainNode.gain.cancelScheduledValues(currTime);
    globalAmbientGainNode.gain.setValueAtTime(globalAmbientGainNode.gain.value, currTime);
    globalAmbientGainNode.gain.linearRampToValueAtTime(0, currTime + 1.5);

    globalCurrentAmbientId = null;
    globalIsAmbientPlaying = false;
    notifyListeners();

    await new Promise<void>((resolve) => setTimeout(resolve, 1500));

    // Check that we haven't selected some other audio since stop was requested
    if (globalCurrentAmbientId === null) {
      globalAmbientAudioElement.pause();
      globalAmbientAudioElement.src = '';
    }
  }

  function setAmbientVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    globalAmbientVolume = clamped;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ambientVolume, clamped.toString());
    }

    if (globalAmbientGainNode && globalAudioContext) {
      const currTime = globalAudioContext.currentTime;
      globalAmbientGainNode.gain.cancelScheduledValues(currTime);
      globalAmbientGainNode.gain.setValueAtTime(clamped, currTime);
    }
    notifyListeners();
  }

  // Decodes full audio buffer, caches it, and plays immediately
  async function playEffect(fileId: string) {
    initAudio();
    if (!globalAudioContext) {
      console.error('AudioContext is not initialized.');
      return;
    }

    let audioBuffer = globalEffectCache.get(fileId);

    if (!audioBuffer) {
      const file = globalStoredFiles.find((f) => f.id === fileId);
      if (!file) {
        console.error(`Effect track not found for ID: ${fileId}`);
        return;
      }

    try {
      const arrayBuffer = typeof file.blob.arrayBuffer === 'function'
        ? await file.blob.arrayBuffer()
        : new ArrayBuffer(0);
      audioBuffer = await globalAudioContext.decodeAudioData(arrayBuffer);
      globalEffectCache.set(fileId, audioBuffer);
    } catch (err) {
      console.error('[Audio Engine] error decoding effect audio data:', err);
      return;
    }
    }

    const sourceNode = globalAudioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;

    const gainNode = globalAudioContext.createGain();
    gainNode.gain.setValueAtTime(globalEffectVolume, globalAudioContext.currentTime);

    sourceNode.connect(gainNode);
    gainNode.connect(globalAudioContext.destination);

    sourceNode.start(0);
  }

  function setEffectVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    globalEffectVolume = clamped;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.effectVolume, clamped.toString());
    }
    notifyListeners();
  }

  async function addFiles(files: FileList | File[], category: 'ambient' | 'effect') {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      await saveAudioFile(file, category);
    }
    await refreshFiles();
  }

  async function removeFile(fileId: string) {
    if (globalCurrentAmbientId === fileId) {
      await stopAmbient();
    }
    await deleteAudioFile(fileId);
    globalEffectCache.delete(fileId);
    await refreshFiles();
  }

  return {
    // state
    currentAmbientId: globalCurrentAmbientId,
    isAmbientPlaying: globalIsAmbientPlaying,
    ambientVolume: globalAmbientVolume,
    effectVolume: globalEffectVolume,
    storedFiles: globalStoredFiles,
    // ambient
    playAmbient,
    stopAmbient,
    setAmbientVolume,
    // effects
    playEffect,
    setEffectVolume,
    // files
    addFiles,
    removeFile,
    refreshFiles,
  };
}
