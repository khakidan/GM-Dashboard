// src/components/AudioLibrary.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Play, Pause, Trash2, X, Music, Volume2, HelpCircle } from 'lucide-react';
import { StoredAudioFile } from '../lib/audioFileStore';
import { STORAGE_KEYS } from '../lib/constants';
import { SoundboardSlot } from './Soundboard';

interface AudioLibraryProps {
  storedFiles: StoredAudioFile[];
  addFiles: (files: FileList | File[], category: 'ambient' | 'effect') => Promise<void>;
  removeFile: (fileId: string) => Promise<void>;
}

export function AudioLibrary({ storedFiles, addFiles, removeFile }: AudioLibraryProps) {
  const [instructionsDismissed, setInstructionsDismissed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('gm_instructions_dismissed');
      return stored === 'true';
    } catch {
      return false;
    }
  });

  // Drag over styling state
  const [dragOverCategory, setDragOverCategory] = useState<'ambient' | 'effect' | null>(null);

  // Hidden inputs refs
  const ambientInputRef = useRef<HTMLInputElement>(null);
  const effectInputRef = useRef<HTMLInputElement>(null);

  // Preview state
  const [previewingFileId, setPreviewingFileId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimerRef = useRef<any>(null);

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
      }, 3000);
    } catch (err) {
      console.error('[Audio Library] Failed to setup preview playback:', err);
      stopPreview();
    }
  };

  // Dismiss instructions
  const handleDismissInstructions = () => {
    setInstructionsDismissed(true);
    localStorage.setItem('gm_instructions_dismissed', 'true');
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
        if (file.type.match('audio/.*') || file.name.endsWith('.mp3') || file.name.endsWith('.wav')) {
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

      {/* Primary Categories Panels */}
      <div className="grid grid-cols-2 gap-4 flex-1">
        
        {/* AMBIENT TRACKS SECTION */}
        <div className="flex flex-col h-full min-w-0" id="library-ambient-section">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-serif font-bold text-xs text-[#2c2c26] uppercase tracking-wider flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-stone-500" />
              Ambient Tracks
            </h4>
            <span className="px-2 py-0.5 bg-stone-100 text-[#5a5a40] rounded-full text-[10px] font-mono font-bold" id="badge-ambient-count">
              {ambientTracks.length} Loaded
            </span>
          </div>

          {/* Upload Dropzone */}
          <div
            id="dropzone-ambient"
            onDragOver={(e) => handleDragOver(e, 'ambient')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'ambient')}
            onClick={() => triggerFileInput('ambient')}
            className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-24 mb-3 ${
              dragOverCategory === 'ambient'
                ? 'bg-amber-500/5 border-[#c5b358] scale-[0.98]'
                : 'bg-[#faf9f6]/40 border-stone-200 hover:border-stone-350 hover:bg-stone-50/20'
            }`}
          >
            <input
              type="file"
              ref={ambientInputRef}
              accept="audio/mp3,audio/mpeg,audio/wav"
              onChange={(e) => handleFileInputChange(e, 'ambient')}
              className="hidden"
              multiple
            />
            <Upload className="w-5 h-5 text-stone-400 mb-1" />
            <span className="text-[10px] font-sans font-bold text-[#5a5a40] uppercase tracking-wider">
              + Add Files
            </span>
            <span className="text-[9px] text-stone-400 mt-0.5 font-sans">
              MP3 / WAV files (.mp3, .wav)
            </span>
          </div>

          {/* Stored files list */}
          <div className="flex-1 overflow-y-auto max-h-[160px] pr-1 flex flex-col gap-1.5" id="list-ambient">
            {ambientTracks.length === 0 ? (
              <span className="text-[10px] text-stone-400 font-sans text-center py-6 border border-dashed border-stone-100 rounded-lg">
                No tracks uploaded yet.
              </span>
            ) : (
              ambientTracks.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 bg-[#faf9f6]/50 border border-stone-200/40 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
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
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-sans font-medium text-stone-700 leading-tight">
                        {file.fileName}
                      </p>
                      <p className="text-[9.5px] font-mono text-stone-400 mt-0.5">
                        {(file.blob.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(file.id)}
                    className="p-1 px-1.5 hover:bg-red-50 text-stone-400 hover:text-red-655 rounded-md transition-colors"
                    title="Delete File"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SOUND EFFECTS SECTION */}
        <div className="flex flex-col h-full min-w-0" id="library-effects-section">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-serif font-bold text-xs text-[#2c2c26] uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-stone-500" />
              Sound Effects
            </h4>
            <span className="px-2 py-0.5 bg-stone-100 text-[#5a5a40] rounded-full text-[10px] font-mono font-bold" id="badge-effects-count">
              {effectFiles.length} Loaded
            </span>
          </div>

          {/* Upload Dropzone */}
          <div
            id="dropzone-effect"
            onDragOver={(e) => handleDragOver(e, 'effect')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'effect')}
            onClick={() => triggerFileInput('effect')}
            className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-24 mb-3 ${
              dragOverCategory === 'effect'
                ? 'bg-amber-500/5 border-[#c5b358] scale-[0.98]'
                : 'bg-[#faf9f6]/40 border-stone-200 hover:border-stone-350 hover:bg-stone-50/20'
            }`}
          >
            <input
              type="file"
              ref={effectInputRef}
              accept="audio/mp3,audio/mpeg,audio/wav"
              onChange={(e) => handleFileInputChange(e, 'effect')}
              className="hidden"
              multiple
            />
            <Upload className="w-5 h-5 text-stone-400 mb-1" />
            <span className="text-[10px] font-sans font-bold text-[#5a5a40] uppercase tracking-wider">
              + Add Files
            </span>
            <span className="text-[9px] text-stone-400 mt-0.5 font-sans">
              MP3 / WAV files (.mp3, .wav)
            </span>
          </div>

          {/* Stored files list */}
          <div className="flex-1 overflow-y-auto max-h-[160px] pr-1 flex flex-col gap-1.5" id="list-effects">
            {effectFiles.length === 0 ? (
              <span className="text-[10px] text-stone-400 font-sans text-center py-6 border border-dashed border-stone-100 rounded-lg">
                No effects uploaded yet.
              </span>
            ) : (
              effectFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 bg-[#faf9f6]/50 border border-stone-200/40 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
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
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-sans font-medium text-stone-700 leading-tight">
                        {file.fileName}
                      </p>
                      <p className="text-[9.5px] font-mono text-stone-400 mt-0.5">
                        {(file.blob.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(file.id)}
                    className="p-1 px-1.5 hover:bg-red-50 text-stone-400 hover:text-red-655 rounded-md transition-colors"
                    title="Delete File"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
