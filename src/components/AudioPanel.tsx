// src/components/AudioPanel.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Music, Volume2, HardDrive, Play, HelpCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { StoredAudioFile } from '../lib/audioFileStore';
import { AmbientPlayer } from './AmbientPlayer';
import { Soundboard } from './Soundboard';
import { AudioLibrary } from './AudioLibrary';
import { MoodId } from '../lib/constants';

interface AudioPanelProps {
  currentAmbientId: string | null;
  isAmbientPlaying: boolean;
  ambientVolume: number;
  effectVolume: number;
  storedFiles: StoredAudioFile[];
  playAmbient: (fileId: string) => Promise<void>;
  stopAmbient: () => Promise<void>;
  setAmbientVolume: (volume: number) => void;
  playEffect: (fileId: string) => Promise<void>;
  setEffectVolume: (volume: number) => void;
  addFiles: (files: FileList | File[], category: 'ambient' | 'effect') => Promise<void>;
  removeFile: (fileId: string) => Promise<void>;
  clearAllFiles: (category: 'ambient' | 'effect' | 'all') => Promise<void>;

  // Mood Presets Props
  activeMood: MoodId | null;
  setActiveMood: (mood: MoodId | null) => void;
  assignments: Record<MoodId, string | null>;
  assignTrackToMood: (fileId: string, moodId: MoodId) => void;
  unassignTrack: (fileId: string) => void;
  getMoodForTrack: (fileId: string) => MoodId | null;
  activateMood: (moodId: MoodId, playAmbient: (fileId: string) => void) => void;
  resetAllMoods: () => void;

  // New Modal Props
  isOpen?: boolean;
  onClose?: () => void;
  campaignId?: string;
}

type AudioTab = 'ambient' | 'soundboard' | 'library';

export function AudioPanel({
  currentAmbientId,
  isAmbientPlaying,
  ambientVolume,
  effectVolume,
  storedFiles,
  playAmbient,
  stopAmbient,
  setAmbientVolume,
  playEffect,
  setEffectVolume,
  addFiles,
  removeFile,
  clearAllFiles,
  activeMood,
  setActiveMood,
  assignments,
  assignTrackToMood,
  unassignTrack,
  getMoodForTrack,
  activateMood,
  resetAllMoods,
  isOpen = false,
  onClose = () => {},
  campaignId,
}: AudioPanelProps) {
  const [activeTab, setActiveTab] = useState<AudioTab>('ambient');

  // Handle Esc to close Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when user is typing in forms
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Remove handleToggleExpand and closePanel as we use onClose directly

  const currentTrack = storedFiles.find((f) => f.id === currentAmbientId);
  const currentTrackName = currentTrack ? currentTrack.name : 'No track';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-[680px] max-w-[90vw] max-h-[85vh] flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden font-sans border border-[#e5e1d8]"
            id="audio-panel-expanded-content"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h2 className="text-xl font-bold font-serif text-[#2c2c26] flex items-center gap-2">
                <span role="img" aria-label="music">🎵</span> Audio
              </h2>
              <button
                onClick={onClose}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Inner Tab switching bar */}
              <div className="flex border-b border-stone-200 bg-[#faf9f6]/40 px-5 pt-1.5 shrink-0 select-none gap-2" id="audio-panel-tabs">
                <button
                  id="tab-ambient"
                  onClick={() => setActiveTab('ambient')}
                  className={cn(
                    "px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer font-sans rounded-t-md",
                    activeTab === 'ambient'
                      ? "border-[#c5b358] text-[#2c2c26] bg-white border-t border-x border-stone-200/50"
                      : "border-transparent text-stone-400 hover:text-stone-700"
                  )}
                >
                  Ambient
                </button>
                <button
                  id="tab-soundboard"
                  onClick={() => setActiveTab('soundboard')}
                  className={cn(
                    "px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer font-sans rounded-t-md",
                    activeTab === 'soundboard'
                      ? "border-[#c5b358] text-[#2c2c26] bg-white border-t border-x border-stone-200/50"
                      : "border-transparent text-stone-400 hover:text-stone-700"
                  )}
                >
                  Soundboard
                </button>
                <button
                  id="tab-library"
                  onClick={() => setActiveTab('library')}
                  className={cn(
                    "px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer font-sans rounded-t-md",
                    activeTab === 'library'
                      ? "border-[#c5b358] text-[#2c2c26] bg-white border-t border-x border-stone-200/50"
                      : "border-transparent text-stone-400 hover:text-stone-700"
                  )}
                >
                  Library
                </button>
              </div>

              {/* Active component render viewport */}
              <div className="p-5 flex-1 overflow-y-auto" id="audio-tab-content-container">
                {activeTab === 'ambient' && (
                  <AmbientPlayer
                    currentAmbientId={currentAmbientId}
                    isAmbientPlaying={isAmbientPlaying}
                    ambientVolume={ambientVolume}
                    storedFiles={storedFiles}
                    playAmbient={playAmbient}
                    stopAmbient={stopAmbient}
                    setAmbientVolume={setAmbientVolume}
                    onSwitchTab={(tab) => setActiveTab(tab)}
                    activeMood={activeMood}
                    setActiveMood={setActiveMood}
                    assignments={assignments}
                    activateMood={activateMood}
                    getMoodForTrack={getMoodForTrack}
                  />
                )}
                {activeTab === 'soundboard' && (
                  <Soundboard
                    storedFiles={storedFiles}
                    playEffect={playEffect}
                    onSwitchTab={(tab) => setActiveTab(tab)}
                    campaignId={campaignId}
                  />
                )}
                {activeTab === 'library' && (
                  <AudioLibrary
                    storedFiles={storedFiles}
                    addFiles={addFiles}
                    removeFile={removeFile}
                    clearAllFiles={clearAllFiles}
                    assignTrackToMood={assignTrackToMood}
                    unassignTrack={unassignTrack}
                    getMoodForTrack={getMoodForTrack}
                    resetAllMoods={resetAllMoods}
                    assignments={assignments}
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
  );
}
