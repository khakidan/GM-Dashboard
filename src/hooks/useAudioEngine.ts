// src/hooks/useAudioEngine.ts

import { useState, useEffect } from 'react';
import { STORAGE_KEYS, AUDIO } from '../lib/constants';
import {
  saveAudioFile,
  getAllAudioFiles,
  deleteAudioFile,
  StoredAudioFile,
} from '../lib/audioFileStore';

interface AudioDeck {
  audio: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  gainNode: GainNode;
  objectUrl: string | null;
}

// Global singletons for Web Audio and HTML5 Elements
let globalAudioContext: AudioContext | null = null;
const deckA = { current: null as AudioDeck | null };
const deckB = { current: null as AudioDeck | null };
const activeDeck = { current: 'A' as 'A' | 'B' };
const cleanupTimers = {
  A: null as ReturnType<typeof setTimeout> | null,
  B: null as ReturnType<typeof setTimeout> | null,
};

const globalEffectCache = new Map<string, AudioBuffer>();

// Global reactive states
let globalCurrentAmbientId: string | null = null;
let globalIsAmbientPlaying = false;
let globalAmbientVolume: number = AUDIO.ambientDefaultVolume;
let globalEffectVolume: number = AUDIO.effectDefaultVolume;
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

function initDeck(): AudioDeck | null {
  if (!globalAudioContext) return null;
  const audio = new Audio();
  audio.crossOrigin = 'anonymous';
  audio.loop = true;

  const source = globalAudioContext.createMediaElementSource(audio);
  const gainNode = globalAudioContext.createGain();
  gainNode.gain.setValueAtTime(0, globalAudioContext.currentTime);

  source.connect(gainNode);
  gainNode.connect(globalAudioContext.destination);

  return { audio, source, gainNode, objectUrl: null };
}

// Initialize ambient HTMLAudioElement and Gain Nodes lazily
function initAmbient() {
  initAudio();
  if (!globalAudioContext) return;
  if (!deckA.current) deckA.current = initDeck();
  if (!deckB.current) deckB.current = initDeck();
}

// Global flag to kick off first load
let initialLoadStarted = false;
let activeCampaignId: string | null = null;

async function initFiles(campaignId: string) {
  if (initialLoadStarted && activeCampaignId === campaignId) return;
  initialLoadStarted = true;
  activeCampaignId = campaignId;
  await refreshFiles(campaignId);
}

async function refreshFiles(campaignId: string) {
  globalStoredFiles = await getAllAudioFiles(campaignId);
  notifyListeners();
}

export function resetAudioEngineState() {
  globalCurrentAmbientId = null;
  globalIsAmbientPlaying = false;
  globalAmbientVolume = AUDIO.ambientDefaultVolume;
  globalEffectVolume = AUDIO.effectDefaultVolume;
  globalStoredFiles = [];
  initialLoadStarted = false;
  activeCampaignId = null;
  globalEffectCache.clear();
  
  const cleanupDeck = (deck: { current: AudioDeck | null }) => {
    if (deck.current) {
      deck.current.audio.pause();
      deck.current.audio.src = '';
      if (deck.current.objectUrl) {
        URL.revokeObjectURL(deck.current.objectUrl);
        deck.current.objectUrl = null;
      }
    }
    deck.current = null;
  };
  cleanupDeck(deckA);
  cleanupDeck(deckB);
  
  if (cleanupTimers.A) clearTimeout(cleanupTimers.A);
  if (cleanupTimers.B) clearTimeout(cleanupTimers.B);
  cleanupTimers.A = null;
  cleanupTimers.B = null;

  activeDeck.current = 'A';
  globalAudioContext = null;
}

export function useAudioEngine(campaignId: string = 'default') {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setTick((t) => t + 1);
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (activeCampaignId !== null && campaignId !== activeCampaignId) {
      activeCampaignId = campaignId;
      stopAmbient().then(() => {
        refreshFiles(campaignId);
      });
    } else {
      initFiles(campaignId);
    }
  }, [campaignId]);

  // Play Ambient FileId (using HTML5 Streaming + Web Audio Gain fading)
  async function playAmbient(fileId: string) {
    initAmbient();
    if (!globalAudioContext || !deckA.current || !deckB.current) {
      console.error('Audio decks could not be initialized');
      return;
    }

    const file = globalStoredFiles.find((f) => f.id === fileId);
    if (!file) {
      console.error(`Ambient track not found for ID: ${fileId}`);
      return;
    }

    const incomingDeckName = activeDeck.current === 'A' ? 'B' : 'A';
    const outgoingDeckName = activeDeck.current === 'A' ? 'A' : 'B';
    const incomingDeck = incomingDeckName === 'A' ? deckA : deckB;
    const outgoingDeck = outgoingDeckName === 'A' ? deckA : deckB;
    const now = globalAudioContext.currentTime;
    const fadeDuration = AUDIO.crossfadeDurationSec;

    // Cancel any pending cleanup timer for the incoming deck to prevent it being cleared
    if (cleanupTimers[incomingDeckName]) {
      clearTimeout(cleanupTimers[incomingDeckName]!);
      cleanupTimers[incomingDeckName] = null;
    }

    // Load new track onto incoming deck
    const url = URL.createObjectURL(file.blob);
    
    // Revoke previous objectUrl on incoming deck if one exists
    if (incomingDeck.current && incomingDeck.current.objectUrl) {
      URL.revokeObjectURL(incomingDeck.current.objectUrl);
    }
    
    if (incomingDeck.current) {
      incomingDeck.current.audio.src = url;
      incomingDeck.current.audio.loop = true;
      incomingDeck.current.objectUrl = url;
      
      // Start incoming deck at 0 volume
      incomingDeck.current.gainNode.gain.cancelScheduledValues(now);
      incomingDeck.current.gainNode.gain.setValueAtTime(0, now);
      try {
        await incomingDeck.current.audio.play();
      } catch (err) {
        console.warn('[Ambient audio] failed to start play:', err);
      }
      
      // Ramp incoming up and outgoing down simultaneously
      incomingDeck.current.gainNode.gain.linearRampToValueAtTime(
        globalAmbientVolume, 
        now + fadeDuration
      );
    }
    
    if (outgoingDeck.current && outgoingDeck.current.audio.src) {
      outgoingDeck.current.gainNode.gain.cancelScheduledValues(now);
      outgoingDeck.current.gainNode.gain.setValueAtTime(
        outgoingDeck.current.gainNode.gain.value, 
        now
      );
      outgoingDeck.current.gainNode.gain.linearRampToValueAtTime(
        0, 
        now + fadeDuration
      );
    }

    // Cancel any existing timer for the outgoing deck to prevent multiple timers racing
    if (cleanupTimers[outgoingDeckName]) {
      clearTimeout(cleanupTimers[outgoingDeckName]!);
    }

    // After crossfade completes, stop and clean up outgoing deck
    cleanupTimers[outgoingDeckName] = setTimeout(() => {
      cleanupTimers[outgoingDeckName] = null;
      if (outgoingDeck.current && outgoingDeck.current.audio) {
        outgoingDeck.current.audio.pause();
        outgoingDeck.current.audio.src = '';
      }
      if (outgoingDeck.current && outgoingDeck.current.objectUrl) {
        URL.revokeObjectURL(outgoingDeck.current.objectUrl);
        outgoingDeck.current.objectUrl = null;
      }
    }, fadeDuration * 1000);

    // Swap the active deck
    activeDeck.current = activeDeck.current === 'A' ? 'B' : 'A';
    globalCurrentAmbientId = fileId;
    globalIsAmbientPlaying = true;
    notifyListeners();
  }

  // Fade out active deck over crossfadeDurationSec seconds, then pause and clean up
  async function stopAmbient() {
    if (!globalAudioContext || !deckA.current || !deckB.current) {
      globalCurrentAmbientId = null;
      globalIsAmbientPlaying = false;
      notifyListeners();
      return;
    }

    const outgoingName = activeDeck.current === 'A' ? 'A' : 'B';
    const outgoing = outgoingName === 'A' ? deckA : deckB;
    const now = globalAudioContext.currentTime;
    
    if (outgoing.current) {
      outgoing.current.gainNode.gain.cancelScheduledValues(now);
      outgoing.current.gainNode.gain.setValueAtTime(
        outgoing.current.gainNode.gain.value, 
        now
      );
      outgoing.current.gainNode.gain.linearRampToValueAtTime(
        0, 
        now + AUDIO.crossfadeDurationSec
      );
    }
    
    globalCurrentAmbientId = null;
    globalIsAmbientPlaying = false;
    notifyListeners();

    // Cancel any existing timer for the outgoing deck to avoid multiple timers running
    if (cleanupTimers[outgoingName]) {
      clearTimeout(cleanupTimers[outgoingName]!);
    }

    cleanupTimers[outgoingName] = setTimeout(() => {
      cleanupTimers[outgoingName] = null;
      if (outgoing.current) {
        outgoing.current.audio.pause();
        outgoing.current.audio.src = '';
        if (outgoing.current.objectUrl) {
          URL.revokeObjectURL(outgoing.current.objectUrl);
          outgoing.current.objectUrl = null;
        }
      }
    }, AUDIO.crossfadeDurationSec * 1000);
  }

  function setAmbientVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    globalAmbientVolume = clamped;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ambientVolume, clamped.toString());
    }

    // Active deck is whichever is considered active now
    // Actually the prompt says: update the gain on whichever deck is currently active (the incoming deck after a crossfade has started)
    if (globalAudioContext) {
      const activeDeckRef = activeDeck.current === 'A' ? deckA : deckB;
      const now = globalAudioContext.currentTime;
      if (activeDeckRef.current) {
        activeDeckRef.current.gainNode.gain.cancelScheduledValues(now);
        activeDeckRef.current.gainNode.gain.setValueAtTime(clamped, now);
      }
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
      await saveAudioFile(campaignId, file, category);
    }
    await refreshFiles(campaignId);
  }

  async function removeFile(fileId: string) {
    if (globalCurrentAmbientId === fileId) {
      await stopAmbient();
    }
    await deleteAudioFile(campaignId, fileId);
    globalEffectCache.delete(fileId);
    await refreshFiles(campaignId);
  }

  async function clearAllFiles(category: 'ambient' | 'effect' | 'all') {
    const filesToRemove = globalStoredFiles.filter(f => 
      category === 'all' || f.category === category
    );
    
    for (const file of filesToRemove) {
      if (globalCurrentAmbientId === file.id) {
        await stopAmbient();
      }
      await deleteAudioFile(campaignId, file.id);
      globalEffectCache.delete(file.id);
    }
    
    await refreshFiles(campaignId);
    
    if (category === 'all') {
      resetAudioEngineState();
    }
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
    clearAllFiles,
    refreshFiles: () => refreshFiles(campaignId),
  };
}
