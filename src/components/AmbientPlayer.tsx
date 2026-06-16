// src/components/AmbientPlayer.tsx

import React from 'react';
import { Play, Pause, Volume2, Music, Square } from 'lucide-react';
import { StoredAudioFile } from '../lib/audioFileStore';

interface AmbientPlayerProps {
  currentAmbientId: string | null;
  isAmbientPlaying: boolean;
  ambientVolume: number;
  storedFiles: StoredAudioFile[];
  playAmbient: (fileId: string) => Promise<void>;
  stopAmbient: () => Promise<void>;
  setAmbientVolume: (volume: number) => void;
  onSwitchTab?: (tab: 'ambient' | 'soundboard' | 'library') => void;
}

export function AmbientPlayer({
  currentAmbientId,
  isAmbientPlaying,
  ambientVolume,
  storedFiles,
  playAmbient,
  stopAmbient,
  setAmbientVolume,
  onSwitchTab,
}: AmbientPlayerProps) {
  const ambientTracks = storedFiles.filter((file) => file.category === 'ambient');

  const handleTrackClick = async (trackId: string) => {
    if (currentAmbientId === trackId && isAmbientPlaying) {
      await stopAmbient();
    } else {
      await playAmbient(trackId);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) / 100;
    setAmbientVolume(val);
  };

  return (
    <div id="ambient-player" className="flex flex-col h-full text-stone-800">
      <div className="flex items-center justify-between border-b border-[#e5e1d8] pb-3 mb-4">
        <h3 className="font-serif font-bold text-sm text-[#2c2c26] uppercase tracking-wider flex items-center gap-2">
          <Music className="w-4 h-4 text-[#c5b358]" />
          Ambient Music
        </h3>
        
        {isAmbientPlaying && (
          <button
            id="btn-fade-out"
            onClick={() => stopAmbient()}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 font-sans font-bold text-xs rounded transition-all cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-red-700" />
            FADE OUT
          </button>
        )}
      </div>

      {ambientTracks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#e5e1d8] rounded-xl bg-[#faf9f6]/50">
          <p className="text-sm text-[#5a5a40] max-w-xs mb-3 font-sans">
            No ambient tracks loaded. Go to the Library tab to add your MP3 files.
          </p>
          {onSwitchTab && (
            <button
              onClick={() => onSwitchTab('library')}
              className="px-3 py-1.5 bg-[#faf9f6] border border-[#e5e1d8] hover:border-[#c5b358] text-[#5a5a40] hover:text-[#2c2c26] text-xs font-bold uppercase rounded cursor-pointer transition-colors"
            >
              Open Library
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex-1 overflow-y-auto max-h-[160px] pr-1 flex flex-col gap-1.5">
            {ambientTracks.map((track) => {
              const isCurrent = currentAmbientId === track.id;
              const isPlaying = isCurrent && isAmbientPlaying;

              return (
                <div
                  key={track.id}
                  id={`ambient-track-${track.id}`}
                  onClick={() => handleTrackClick(track.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-[#c5b358]/5 border-[#c5b358]/40 shadow-sm'
                      : 'bg-[#faf9f6]/60 border-[#e5e1d8]/40 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      id={`play-btn-${track.id}`}
                      className={`w-7 h-7 flex items-center justify-center rounded-full border transition-colors shrink-0 ${
                        isPlaying
                          ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]'
                          : 'bg-white border-stone-200 text-stone-500 hover:text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {isPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      )}
                    </button>
                    <span
                      className={`text-xs font-sans font-medium truncate ${
                        isCurrent ? 'text-stone-900 font-bold' : 'text-stone-700'
                      }`}
                    >
                      {track.name}
                    </span>
                  </div>

                  {isPlaying && (
                    <div className="flex items-center gap-1.5 pr-1" id={`pulse-indicator-${track.id}`}>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
                      </span>
                      <span className="text-[10px] font-mono text-[#10b981] font-bold uppercase tracking-wider">LOOPING</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-[#faf9f6] border border-[#e5e1d8]/60 rounded-xl p-3 flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-stone-500 shrink-0" />
            <div className="flex-1 flex items-center gap-2">
              <input
                id="ambient-volume-slider"
                type="range"
                min="0"
                max="100"
                value={Math.round(ambientVolume * 100)}
                onChange={handleVolumeChange}
                className="w-full accent-[#c5b358]"
                style={{ cursor: 'pointer' }}
              />
              <span className="text-[10px] font-mono font-bold text-stone-500 w-8 text-right">
                {Math.round(ambientVolume * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
