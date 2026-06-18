// src/components/AudioLibrary.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Play, Pause, Trash2, X, Music, Volume2, HelpCircle } from 'lucide-react';
import { StoredAudioFile } from '../lib/audioFileStore';
import { STORAGE_KEYS, TIMERS, MOODS, MoodId } from '../lib/constants';
import { SoundboardSlot } from './Soundboard';
import { cn } from '../lib/utils';

interface AudioLibraryProps {
  storedFiles: StoredAudioFile[];
  addFiles: (files: FileList | File[], category: 'ambient' | 'effect') => Promise<void>;
  removeFile: (fileId: string) => Promise<void>;
  clearAllFiles?: (category: 'ambient' | 'effect' | 'all') => Promise<void>;
  assignTrackToMood?: (fileId: string, moodId: MoodId) => void;
  unassignTrack?: (fileId: string) => void;
  getMoodForTrack?: (fileId: string) => MoodId | null;
  resetAllMoods?: () => void;
  assignments?: Record<MoodId, string | null>;
}

export function AudioLibrary({ 
  storedFiles, 
  addFiles, 
  removeFile,
  clearAllFiles = async () => {},
  assignTrackToMood = () => {},
  unassignTrack = () => {},
  getMoodForTrack = () => null,
  resetAllMoods = () => {},
  assignments = { sweet: null, adventuring: null, tense: null, scary: null, combat: null },
}: AudioLibraryProps) {
  const [instructionsDismissed, setInstructionsDismissed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.instructionsDismissed);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const [activeSubTab, setActiveSubTab] = useState<'ambient' | 'effect'>('ambient');
  
  // Confirmation states
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [showResetMoodsConfirm, setShowResetMoodsConfirm] = useState<boolean>(false);

  // Drag over styling state
  const [dragOverCategory, setDragOverCategory] = useState<'ambient' | 'effect' | null>(null);

  // Hidden inputs refs
  const ambientInputRef = useRef<HTMLInputElement>(null);
  const effectInputRef = useRef<HTMLInputElement>(null);

  // Preview state
  const [previewingFileId, setPreviewingFileId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimerRef = useRef<any>(null);

  // Active Picker state
  const [activePickerFileId, setActivePickerFileId] = useState<string | null>(null);

  // Close picker on click away
  useEffect(() => {
    const handleOutsideClick = () => {
      setActivePickerFileId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  // Stop any active preview
  const stopPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    setPreviewingFileId(null);
  };

  // Preview play - plays for 3s max
  const handlePlayPreview = (file: StoredAudioFile) => {
    stopPreview();

    if (previewingFileId === file.id) {
      return;
    }

    try {
      const url = URL.createObjectURL(file.blob);
      const audio = new Audio(url);
      previewAudioRef.current = audio;
      setPreviewingFileId(file.id);

      audio.play().catch((err) => {
        console.warn('[Audio Library] Preview play failed:', err);
        stopPreview();
      });

      previewTimerRef.current = setTimeout(() => {
        stopPreview();
        URL.revokeObjectURL(url);
      }, TIMERS.audioPreviewMs);
    } catch (err) {
      console.error('[Audio Library] Failed to setup preview playback:', err);
      stopPreview();
    }
  };

  // Dismiss instructions
  const handleDismissInstructions = () => {
    setInstructionsDismissed(true);
    localStorage.setItem(STORAGE_KEYS.instructionsDismissed, 'true');
  };

  // Cleanup preview audio on unmount
  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, []);

  // Filter lists
  const ambientTracks = storedFiles.filter((f) => f.category === 'ambient');
  const effectFiles = storedFiles.filter((f) => f.category === 'effect');

  // Unified remove handler including layout cascade deletion
  const handleRemoveFile = async (fileId: string) => {
    // 1. Remove from database
    await removeFile(fileId);

    // 2. Scan and edit soundboard layout in localStorage
    try {
      const rawLayout = localStorage.getItem(STORAGE_KEYS.soundboardLayout);
      if (rawLayout) {
        const layout: SoundboardSlot[] = JSON.parse(rawLayout);
        const updatedLayout = layout.filter((s) => s.fileId !== fileId);
        localStorage.setItem(STORAGE_KEYS.soundboardLayout, JSON.stringify(updatedLayout));
        
        // Dispatch synthetic change event to alert mounted widgets
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.warn('[Audio Library] Failed cascading sound removal layout:', err);
    }
  };

  // Drag-and-drop mechanics
  const handleDragOver = (e: React.DragEvent, category: 'ambient' | 'effect') => {
    e.preventDefault();
    setDragOverCategory(category);
  };

  const handleDragLeave = () => {
    setDragOverCategory(null);
  };

  const handleDrop = async (e: React.DragEvent, category: 'ambient' | 'effect') => {
    e.preventDefault();
    setDragOverCategory(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Filter out non-audio files
      const audioFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (
          file.type.match('audio/.*') ||
          file.name.endsWith('.mp3') ||
          file.name.endsWith('.wav') ||
          file.name.endsWith('.ogg') ||
          file.name.endsWith('.m4a')
        ) {
          audioFiles.push(file);
        }
      }
      if (audioFiles.length > 0) {
        await addFiles(audioFiles, category);
      }
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>, category: 'ambient' | 'effect') => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await addFiles(Array.from(files), category);
    }
  };

  const triggerFileInput = (category: 'ambient' | 'effect') => {
    if (category === 'ambient') {
      ambientInputRef.current?.click();
    } else {
      effectInputRef.current?.click();
    }
  };

  const handleClearConfirm = async () => {
    await clearAllFiles(activeSubTab);
    setShowClearConfirm(false);
  };

  const renderFileRow = (file: StoredAudioFile) => {
    const currentMood = getMoodForTrack(file.id);
    const moodObj = currentMood ? MOODS.find((m) => m.id === currentMood) : null;

    return (
      <div
        key={file.id}
        className="group flex flex-row items-center p-2 bg-[#faf9f6]/50 border border-stone-200/40 rounded-lg text-xs w-full"
      >
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handlePlayPreview(file)}
            className={`w-6 h-6 flex items-center justify-center rounded-full border shrink-0 ${
              previewingFileId === file.id
                ? 'bg-[#c5b358]/10 text-[#c5b358] border-[#c5b358]/30'
                : 'bg-white border-stone-200 text-stone-500 hover:text-stone-700'
            }`}
            title="Preview 3s"
          >
            {previewingFileId === file.id ? (
              <Pause className="w-2.5 h-2.5 fill-current" />
            ) : (
              <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
            )}
          </button>

          {/* Mood Selector Trigger/Badge Button */}
          {activeSubTab === 'ambient' && (
            <div className="relative shrink-0 mr-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePickerFileId(activePickerFileId === file.id ? null : file.id);
                }}
                className={`w-6 h-6 flex items-center justify-center rounded-md border text-xs transition-colors shrink-0 ${
                  currentMood
                    ? 'bg-amber-55 border-amber-200/60 text-stone-700'
                    : 'bg-stone-50/50 border-stone-200/50 text-stone-400 opacity-0 group-hover:opacity-100'
                } hover:border-[#c5b358] hover:bg-amber-50/50 cursor-pointer`}
                title={currentMood ? `Mood: ${moodObj?.label}` : 'Assign Mood'}
                style={{ opacity: currentMood ? 1 : undefined }}
              >
                {currentMood ? moodObj?.emoji : '➕'}
              </button>

              {activePickerFileId === file.id && (
                <div
                  className="absolute left-0 top-7 z-50 bg-white border border-stone-250 rounded-lg shadow-lg p-2.5 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-100 min-w-[220px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="font-bold text-[10px] text-stone-500 uppercase tracking-widest pl-1 mb-1">Assign to mood</p>
                  {MOODS.map((m) => {
                    const assignedTrackId = assignments[m.id];
                    const assignedTrack = assignedTrackId ? ambientTracks.find(f => f.id === assignedTrackId) : null;
                    const truncName = assignedTrack ? (assignedTrack.name.length > 15 ? assignedTrack.name.substring(0, 12) + '...' : assignedTrack.name) : 'none';
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          assignTrackToMood(file.id, m.id);
                          setActivePickerFileId(null);
                        }}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-stone-100 cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span>{m.emoji}</span>
                          <span className="font-sans font-medium">{m.label}</span>
                        </div>
                        <span className="text-[10px] text-stone-400 font-sans italic">currently: {truncName}</span>
                      </button>
                    )
                  })}
                  {currentMood && (
                    <button
                      onClick={() => {
                        unassignTrack(file.id);
                        setActivePickerFileId(null);
                      }}
                      className="w-full mt-1 flex items-center gap-2 px-2 py-1.5 rounded hover:bg-red-50 text-red-550 cursor-pointer text-xs font-medium"
                      title="Remove Assignment"
                    >
                      <X className="w-3.5 h-3.5" />
                      Remove assignment
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-grow min-w-0 px-2 overflow-hidden">
          <p className="font-sans font-medium text-stone-700 leading-tight break-words" title={file.fileName}>
            {file.fileName}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-2">
          <p className="text-[9.5px] font-mono text-stone-400 mt-0.5 whitespace-nowrap text-right min-w-[40px]">
            {(file.blob.size / 1024).toFixed(1)} KB
          </p>
          <button
            onClick={() => handleRemoveFile(file.id)}
            className="p-1 px-1.5 hover:bg-red-50 text-stone-400 hover:text-red-655 rounded-md transition-colors"
            title="Delete File"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const currentFiles = activeSubTab === 'ambient' ? ambientTracks : effectFiles;

  return (
    <div id="audio-library-panel" className="flex flex-col h-full text-stone-800">
      {/* Import Instructions Box */}
      {!instructionsDismissed && (
        <div id="library-import-instructions" className="relative p-3 bg-amber-55/15 border border-amber-200/50 rounded-xl mb-4 font-sans text-xs text-stone-700/90 leading-normal pr-8">
          <button
            id="dismiss-instructions-btn"
            onClick={handleDismissInstructions}
            className="absolute top-2.5 right-2 text-stone-400 hover:text-stone-700 transition-colors p-1"
            title="Dismiss Instructions"
          >
            <X className="w-4 h-4" />
          </button>
          <p className="font-semibold text-[#2c2c26] mb-1 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-[#c5b358]" />
            Audio Import Guidelines
          </p>
          Drag your MP3 files here or click to browse. Ambient tracks loop continuously. Sound effects play on demand from the Soundboard. Files are saved in your browser and available every session.
        </div>
      )}

      {/* Sub-tabs header */}
      <div className="flex items-center justify-between border-b border-stone-200/60 mb-4 pb-0">
        <div className="flex items-center gap-4 px-1">
          <button
            onClick={() => { setActiveSubTab('ambient'); setShowClearConfirm(false); }}
            className={cn(
              "pb-2 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 font-sans flex items-center gap-1.5",
              activeSubTab === 'ambient' ? "border-[#c5b358] text-[#2c2c26]" : "border-transparent text-stone-400 hover:text-stone-600"
            )}
          >
            Ambient Tracks 
            <span className="bg-stone-100 text-[#5a5a40] px-1.5 py-0.5 rounded pl-1.5 font-mono text-[9px]">({ambientTracks.length})</span>
          </button>
          
          <button
            onClick={() => { setActiveSubTab('effect'); setShowClearConfirm(false); }}
            className={cn(
              "pb-2 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 font-sans flex items-center gap-1.5",
              activeSubTab === 'effect' ? "border-[#c5b358] text-[#2c2c26]" : "border-transparent text-stone-400 hover:text-stone-600"
            )}
          >
            Sound Effects
            <span className="bg-stone-100 text-[#5a5a40] px-1.5 py-0.5 rounded pl-1.5 font-mono text-[9px]">({effectFiles.length})</span>
          </button>
        </div>

        {/* Clear All action (per tab) */}
        {currentFiles.length > 0 && !showClearConfirm && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="pb-2 flex items-center gap-1 text-[10px] text-stone-400 hover:text-red-550 font-sans font-medium uppercase tracking-wider transition-colors"
            title={`Clear all ${activeSubTab === 'ambient' ? 'ambient tracks' : 'sound effects'}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear all
          </button>
        )}
      </div>

      {showClearConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
          <p className="text-xs text-red-800 font-medium">
            Remove all {currentFiles.length} {activeSubTab === 'ambient' ? 'ambient tracks' : 'sound effects'}? This cannot be undone.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-black/5 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleClearConfirm}
              className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              Remove all
            </button>
          </div>
        </div>
      )}

      {/* Active Tab Content */}
      <div className="flex flex-col h-full min-w-0" id={`library-${activeSubTab}-section`}>
        {/* Upload Dropzone */}
        <div
          id={`dropzone-${activeSubTab}`}
          onDragOver={(e) => handleDragOver(e, activeSubTab)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, activeSubTab)}
          onClick={() => triggerFileInput(activeSubTab)}
          className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-24 mb-4 shrink-0 ${
            dragOverCategory === activeSubTab
              ? 'bg-amber-500/5 border-[#c5b358] scale-[0.98]'
              : 'bg-[#faf9f6]/40 border-stone-200 hover:border-stone-350 hover:bg-stone-50/20'
          }`}
        >
          <input
            type="file"
            ref={activeSubTab === 'ambient' ? ambientInputRef : effectInputRef}
            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/ogg;codecs=vorbis,audio/mp4,audio/x-m4a,.mp3,.wav,.ogg,.m4a"
            onChange={(e) => handleFileInputChange(e, activeSubTab)}
            className="hidden"
            multiple
          />
          <Upload className="w-5 h-5 text-stone-400 mb-1" />
          <span className="text-[10px] font-sans font-bold text-[#5a5a40] uppercase tracking-wider">
            + Add Files
          </span>
          <span className="text-[9px] text-stone-400 mt-0.5 font-sans">
             MP3 · WAV · OGG · M4A
          </span>
        </div>

        {/* Stored files list */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 pb-8" id={`list-${activeSubTab}`}>
          {currentFiles.length === 0 ? (
            <span className="text-xs text-stone-400 font-sans text-center py-8 border border-dashed border-stone-200 rounded-xl bg-stone-50/50 flex flex-col items-center gap-2">
              <Upload className="w-6 h-6 text-stone-300" />
              {activeSubTab === 'ambient' 
                ? 'No ambient tracks loaded yet.\nDrop MP3, WAV, OGG, or M4A files above to add them.'
                : 'No sound effects loaded yet.\nDrop MP3, WAV, OGG, or M4A files above to add them.'
              }
            </span>
          ) : (
            currentFiles.map((file) => renderFileRow(file))
          )}
        </div>
        
        {/* Reset Moods Action */}
        <div className="shrink-0 pt-4 border-t border-stone-200/50 flex items-center justify-end mt-auto">
          {!showResetMoodsConfirm ? (
            <button
              onClick={() => setShowResetMoodsConfirm(true)}
              className="text-[10px] uppercase tracking-wider font-bold text-stone-400 hover:text-red-550 transition-colors font-sans"
            >
              Reset mood assignments
            </button>
          ) : (
            <div className="flex items-center justify-between w-full bg-stone-50 p-2 rounded-lg border border-stone-200 animate-in fade-in slide-in-from-right-4 duration-200">
              <span className="text-xs text-stone-600 font-medium pl-1">
                Clear all mood assignments? Your tracks will remain.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowResetMoodsConfirm(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-black/5 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    resetAllMoods();
                    setShowResetMoodsConfirm(false);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Reset moods
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

