// src/components/AudioPanel.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Music, Volume2, HardDrive, Play, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { StoredAudioFile } from '../lib/audioFileStore';
import { AmbientPlayer } from './AmbientPlayer';
import { Soundboard } from './Soundboard';
import { AudioLibrary } from './AudioLibrary';

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
}: AudioPanelProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<AudioTab>('ambient');

  // Handle M Key Shortcut to toggle panel
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

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsExpanded((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  const currentTrack = storedFiles.find((f) => f.id === currentAmbientId);
  const currentTrackName = currentTrack ? currentTrack.name : 'No track';

  return (
    <div
      id="audio-panel-container"
      className={cn(
        "relative flex flex-col bg-white rounded-xl shadow-2xl border border-[#e5e1d8] text-stone-900 overflow-visible transition-all font-sans",
        "w-48 h-11"
      )}
    >
      {/* Header bar / Collapsed state bar */}
      <div
        id="audio-panel-header"
        onClick={handleToggleExpand}
        className="h-11 w-full bg-[#faf9f6]/95 rounded-xl border-b border-[#e5e1d8] flex items-center justify-between px-3.5 cursor-pointer hover:bg-[#f5f5f0] transition-colors select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs shrink-0 font-bold uppercase tracking-wider text-[#2c2c26] flex items-center gap-1.5 font-sans" id="audio-panel-label">
            <span role="img" aria-label="music" className="text-sm">🎵</span> AUDIO
          </span>

          {!isExpanded && (
            <span
              id="audio-current-track-label"
              className="text-[11px] text-stone-500 truncate font-medium font-sans border-l border-stone-200 pl-2 leading-none"
              title={currentTrackName}
            >
              {currentTrackName}
            </span>
          )}

          {!isExpanded && isAmbientPlaying && (
            <span className="relative flex h-1.5 w-1.5 shrink-0" id="audio-active-pulsar">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10b981]"></span>
            </span>
          )}
        </div>

        <div className="text-stone-500 shrink-0">
          {isExpanded ? (
            <ChevronDown className="w-4.5 h-4.5 shrink-0" id="chevron-collapse" />
          ) : (
            <ChevronUp className="w-4.5 h-4.5 shrink-0" id="chevron-expand" />
          )}
        </div>
      </div>

      {/* Expanded Main Tabs Layout */}
      {isExpanded && (
        <div className="absolute top-full mt-2 left-0 w-80 sm:w-96 flex flex-col bg-white rounded-xl shadow-2xl border border-[#e5e1d8] overflow-hidden z-50" id="audio-panel-expanded-content">
          {/* Inner Tab switching bar */}
          <div className="flex border-b border-stone-200 bg-[#faf9f6]/40 px-2.5 pt-1.5 shrink-0 select-none gap-1" id="audio-panel-tabs">
            <button
              id="tab-ambient"
              onClick={() => setActiveTab('ambient')}
              className={cn(
                "px-2.5 py-1.5 text-[10.5px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer font-sans rounded-t-md",
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
                "px-2.5 py-1.5 text-[10.5px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer font-sans rounded-t-md",
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
                "px-2.5 py-1.5 text-[10.5px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer font-sans rounded-t-md",
                activeTab === 'library'
                  ? "border-[#c5b358] text-[#2c2c26] bg-white border-t border-x border-stone-200/50"
                  : "border-transparent text-stone-400 hover:text-stone-700"
              )}
            >
              Library
            </button>
          </div>

          {/* Active component render viewport */}
          <div className="p-4 max-h-[340px] overflow-y-auto" id="audio-tab-content-container">
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
              />
            )}
            {activeTab === 'soundboard' && (
              <Soundboard
                storedFiles={storedFiles}
                playEffect={playEffect}
                onSwitchTab={(tab) => setActiveTab(tab)}
              />
            )}
            {activeTab === 'library' && (
              <AudioLibrary
                storedFiles={storedFiles}
                addFiles={addFiles}
                removeFile={removeFile}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
