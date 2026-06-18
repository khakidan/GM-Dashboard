// src/components/AmbientPlayer.tsx

import React from 'react';
import { Play, Pause, Volume2, Music, Square } from 'lucide-react';
import { StoredAudioFile } from '../lib/audioFileStore';
import { MOODS, MoodId } from '../lib/constants';

interface AmbientPlayerProps {
  currentAmbientId: string | null;
  isAmbientPlaying: boolean;
  ambientVolume: number;
  storedFiles: StoredAudioFile[];
  playAmbient: (fileId: string) => Promise<void>;
  stopAmbient: () => Promise<void>;
  setAmbientVolume: (volume: number) => void;
  onSwitchTab?: (tab: 'ambient' | 'soundboard' | 'library') => void;
  assignments?: Record<MoodId, string[]>;
  activeMood?: MoodId | null;
  getMoodForTrack?: (fileId: string) => MoodId | null;
  activateMood?: (moodId: MoodId, playAmbient: (fileId: string) => void) => void;
  setActiveMood?: (moodId: MoodId | null) => void;
}

const moodClasses: Record<MoodId, { active: string; hasTracks: string }> = {
  sweet: {
    active: 'bg-pink-600 text-white border-pink-600 shadow-sm',
    hasTracks: 'border-pink-300 text-pink-700 bg-pink-50/30 hover:bg-pink-100 hover:text-pink-850',
  },
  adventuring: {
    active: 'bg-amber-600 text-white border-amber-600 shadow-sm',
    hasTracks: 'border-amber-300 text-amber-700 bg-amber-50/30 hover:bg-amber-100 hover:text-amber-850',
  },
  tense: {
    active: 'bg-orange-600 text-white border-orange-600 shadow-sm',
    hasTracks: 'border-orange-300 text-orange-700 bg-orange-50/30 hover:bg-orange-100 hover:text-orange-850',
  },
  scary: {
    active: 'bg-purple-600 text-white border-purple-600 shadow-sm',
    hasTracks: 'border-purple-300 text-purple-700 bg-purple-50/30 hover:bg-purple-100 hover:text-purple-850',
  },
  combat: {
    active: 'bg-red-600 text-white border-red-600 shadow-sm',
    hasTracks: 'border-red-300 text-red-700 bg-red-50/30 hover:bg-red-100 hover:text-red-850',
  },
};

export function AmbientPlayer({
  currentAmbientId,
  isAmbientPlaying,
  ambientVolume,
  storedFiles,
  playAmbient,
  stopAmbient,
  setAmbientVolume,
  onSwitchTab,
  assignments = { sweet: [], adventuring: [], tense: [], scary: [], combat: [] },
  activeMood = null,
  getMoodForTrack,
  activateMood = () => {},
  setActiveMood,
}: AmbientPlayerProps) {
  const ambientTracks = storedFiles.filter((file) => file.category === 'ambient');

  const handleTrackClick = async (trackId: string) => {
    if (currentAmbientId === trackId && isAmbientPlaying) {
      await stopAmbient();
      if (setActiveMood) {
        setActiveMood(null);
      }
    } else {
      await playAmbient(trackId);
      if (setActiveMood && getMoodForTrack) {
        setActiveMood(getMoodForTrack(trackId));
      }
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

      {/* Mood Presets System */}
      <div id="mood-presets-grid" className="grid grid-cols-5 gap-1.5 mb-4">
        {MOODS.map((mood) => {
          const tracks = assignments[mood.id] || [];
          const hasTracks = tracks.length > 0;
          const isActive = activeMood === mood.id;

          let btnClass = '';
          if (isActive) {
            btnClass = moodClasses[mood.id].active;
          } else if (hasTracks) {
            btnClass = moodClasses[mood.id].hasTracks;
          } else {
            btnClass = 'border-stone-200 text-stone-400 hover:text-stone-600 hover:border-stone-300 bg-stone-50/10 hover:bg-stone-50/50 opacity-70';
          }

          return (
            <button
              key={mood.id}
              id={`btn-mood-${mood.id}`}
              onClick={() => activateMood(mood.id, playAmbient)}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg border text-[10px] sm:text-xs font-sans font-bold transition-all cursor-pointer ${btnClass}`}
              title={hasTracks ? `${tracks.length} track(s) assigned` : 'No tracks assigned'}
            >
              <span className="text-sm">{mood.emoji}</span>
              <span className="truncate">{mood.label}</span>
            </button>
          );
        })}
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
