import React from 'react';
import { Campaign } from '../hooks/useCampaign';
import { AudioPanel } from './AudioPanel';
import { CommandPalette } from './CommandPalette';
import { SyncingOverlay } from './SyncingOverlay';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useMoodPresets } from '../hooks/useMoodPresets';
import { ConfirmationDialog } from './ui/ConfirmationDialog';

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

      <ConfirmationDialog
        isOpen={showLeaveConfirm}
        title="Leave Campaign?"
        description="An encounter is in progress. Leave this campaign?"
        confirmLabel="Leave"
        cancelLabel="Stay"
        onConfirm={onConfirmLeave}
        onClose={onCloseLeaveConfirm}
      />
    </>
  );
}
