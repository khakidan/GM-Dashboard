import React from 'react';
import { Campaign } from '../hooks/useCampaign';
import { AudioPanel } from './AudioPanel';
import { CommandPalette } from './CommandPalette';
import { SyncingOverlay } from './SyncingOverlay';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useMoodPresets } from '../hooks/useMoodPresets';

interface GMDashboardDialogsProps {
  campaignId: string;
  isAudioOpen: boolean;
  onCloseAudio: () => void;
  audioEngine: ReturnType<typeof useAudioEngine>;
  moodPresets: ReturnType<typeof useMoodPresets>;
  
  isPaletteOpen: boolean;
  onClosePalette: () => void;
  
  showLeaveConfirm: boolean;
  onCloseLeaveConfirm: () => void;
  onConfirmLeave: () => void;
  
  // Syncing Overlay
  isSyncing: boolean;
  syncLogs: string[];
  syncError: string | null;
  isGoogleConnected: boolean;
  handleSignIn: () => void;
  setSyncError: (error: string | null) => void;
  setIsSyncing: (isSyncing: boolean) => void;
  addLog: (msg: string) => void;
}

export function GMDashboardDialogs({
  campaignId,
  isAudioOpen,
  onCloseAudio,
  audioEngine,
  moodPresets,
  isPaletteOpen,
  onClosePalette,
  showLeaveConfirm,
  onCloseLeaveConfirm,
  onConfirmLeave,
  isSyncing,
  syncLogs,
  syncError,
  isGoogleConnected,
  handleSignIn,
  setSyncError,
  setIsSyncing,
  addLog,
}: GMDashboardDialogsProps) {
  return (
    <>
      {isAudioOpen && (
        <AudioPanel
          {...audioEngine}
          {...moodPresets}
          campaignId={campaignId}
          isOpen={isAudioOpen}
          onClose={onCloseAudio}
        />
      )}

      <SyncingOverlay
        isSyncing={isSyncing}
        syncLogs={syncLogs}
        syncError={syncError}
        isGoogleConnected={isGoogleConnected}
        handleSignIn={handleSignIn}
        setSyncError={setSyncError}
        setIsSyncing={setIsSyncing}
        addLog={addLog}
      />

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={onClosePalette}
        ambientFiles={audioEngine.storedFiles.filter(f => f.category === 'ambient')}
        onPlayAmbient={audioEngine.playAmbient}
        currentAmbientId={audioEngine.currentAmbientId}
        activeMood={moodPresets.activeMood}
        assignments={moodPresets.assignments}
        activateMood={moodPresets.activateMood}
      />

      {showLeaveConfirm && (
        <div id="leave-campaign-confirm-overlay" className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 select-none animate-fade-in font-serif">
          <div className="bg-[#ffffff] border-2 border-[#2563eb] rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <h3 className="text-xl font-bold text-[#0f172a] mb-3">Leave Campaign?</h3>
            <p className="text-sm font-sans text-[#8d8db9] mb-6">
              An encounter is in progress. Leave this campaign?
            </p>
            <div className="flex justify-center gap-3 font-sans">
              <button
                id="leave-campaign-stay-btn"
                onClick={onCloseLeaveConfirm}
                className="px-5 py-2.5 bg-stone-200 hover:bg-stone-300 font-bold text-stone-800 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Stay
              </button>
              <button
                id="leave-campaign-leave-btn"
                onClick={() => {
                  onCloseLeaveConfirm();
                  onConfirmLeave();
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 font-bold text-white rounded-lg text-sm transition-colors cursor-pointer animate-pulse"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
