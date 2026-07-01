// src/components/GMDashboard.tsx

import { useState, useEffect, useCallback } from 'react';
import { useAppState } from '../hooks/useAppState';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useSheetSync } from '../hooks/useSheetSync';
import { useEncounterLifecycle } from '../hooks/useEncounterLifecycle';
import { useEncounterResume } from '../hooks/useEncounterResume';
import { useDashboardShortcuts } from '../hooks/useDashboardShortcuts';
import { useNetworkState, useQueuedWrites } from '../hooks/useNetworkState';
import { useTabState, Tab } from '../hooks/useTabState';
import { GMLoadingScreen } from './GMLoadingScreen';
import { GMDashboardSidebar } from './GMDashboardSidebar';
import { GMTabContent } from './GMTabContent';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useMoodPresets } from '../hooks/useMoodPresets';
import { GMDashboardDialogs } from './GMDashboardDialogs';
import { GlobalControls } from './GlobalControls';
import { Campaign } from '../hooks/useCampaign';

export interface GMDashboardProps {
  campaign?: Campaign;
  onCloseCampaign?: () => void;
}

export function GMDashboard({ campaign, onCloseCampaign }: GMDashboardProps = {}) {
  const { state } = useAppState();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  
  const { activeTab, handleTabChange } = useTabState(state.combatState.activeEncounterId);

  const handleBackToCampaigns = useCallback(() => {
    if (state.combatState.activeEncounterId) {
      setShowLeaveConfirm(true);
    } else {
      onCloseCampaign?.();
    }
  }, [state.combatState.activeEncounterId, onCloseCampaign]);

  const isOnline = useNetworkState();
  const queuedWrites = useQueuedWrites();

  const {
    handleSyncWithSheets,
    isSyncing,
    setIsSyncing,
    syncError,
    setSyncError,
    syncLogs,
    lastSyncTime,
    addLog,
  } = useSheetSync({
    setIsGoogleConnected: (val) => setIsGoogleConnected(val),
    onActiveTabChange: handleTabChange,
  });

  const { startEncounter, clearEncounter } = useEncounterLifecycle(handleTabChange);

  useEncounterResume(handleTabChange);

  const {
    isGoogleConnected,
    setIsGoogleConnected,
    handleSignIn,
    handleSignOut,
    hasToken,
  } = useGoogleAuth({
    onLog: addLog,
    onAuthSuccess: () => handleSyncWithSheets(false),
  });

  const campaignId = campaign?.id ?? 'default';
  const audioEngine = useAudioEngine(campaignId);
  const moodPresets = useMoodPresets(campaignId);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isAudioPanelOpen, setIsAudioPanelOpen] = useState(false);

  useDashboardShortcuts({
    setIsAudioPanelOpen,
    setIsPaletteOpen,
    audioEngine,
    moodPresets,
  });

  if (!state.hasInitialSynced) {
    const isAuthenticated = hasToken();
    return (
      <GMLoadingScreen
        isAuthenticated={isAuthenticated}
        campaignName={state.campaignName}
        isSyncing={isSyncing}
        onSignIn={handleSignIn}
      />
    );
  }

  return (
    <div className="w-full h-[100dvh] bg-[#ffffff] flex overflow-hidden font-serif select-none relative">
      <GMDashboardSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        campaignName={state.campaignName}
        isSyncing={isSyncing}
        isOnline={isOnline}
        queuedWrites={queuedWrites}
        lastSyncTime={lastSyncTime}
        syncError={syncError}
        onSyncWithSheets={handleSyncWithSheets}
        activeEncounterId={state.combatState.activeEncounterId}
        onCloseCampaign={handleBackToCampaigns}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 lg:h-20 shrink-0 border-b border-[#e2e8f0] px-4 lg:px-8 flex items-center justify-between bg-white/80 lg:bg-white/50 backdrop-blur-md sticky top-0 z-10 transition-all">
          <div className="flex-1 max-w-lg mr-4 group flex items-center gap-2">
            <div>
              <h2 id="header-campaign-title" className="text-lg lg:text-xl font-bold text-[#0f172a] px-2 leading-tight">
                {campaign ? campaign.name : "GM Encounter Dashboard"}
              </h2>
              <p id="header-campaign-subtitle" className="text-xs text-[#8d8db9] px-2 font-sans font-medium uppercase tracking-wider">
                GM Dashboard
              </p>
            </div>
          </div>
        </header>

        <section className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <GMTabContent
              activeTab={activeTab}
              hasActiveEncounter={!!state.combatState.activeEncounterId}
              clearEncounter={clearEncounter}
              startEncounter={startEncounter}
              isGoogleConnected={isGoogleConnected}
              handleSignIn={handleSignIn}
              handleSignOut={handleSignOut}
              setIsGoogleConnected={setIsGoogleConnected}
              handleSyncWithSheets={handleSyncWithSheets}
              addLog={addLog}
            />
          </div>
        </section>
      </main>

      <GlobalControls
        isAudioPanelOpen={isAudioPanelOpen}
        setIsAudioPanelOpen={setIsAudioPanelOpen}
        isAmbientPlaying={audioEngine.isAmbientPlaying}
      />

      <GMDashboardDialogs
        campaignId={campaignId}
        isAudioOpen={isAudioPanelOpen}
        onCloseAudio={() => setIsAudioPanelOpen(false)}
        audioEngine={audioEngine}
        moodPresets={moodPresets}
        
        isPaletteOpen={isPaletteOpen}
        onClosePalette={() => setIsPaletteOpen(false)}
        
        showLeaveConfirm={showLeaveConfirm}
        onCloseLeaveConfirm={() => setShowLeaveConfirm(false)}
        onConfirmLeave={() => onCloseCampaign?.()}
        
        isSyncing={isSyncing}
        syncLogs={syncLogs}
        syncError={syncError}
        isGoogleConnected={isGoogleConnected}
        handleSignIn={handleSignIn}
        setSyncError={setSyncError}
        setIsSyncing={setIsSyncing}
        addLog={addLog}
      />
    </div>
  );
}

