// src/components/GMDashboard.tsx

import { useState, useEffect, useCallback } from 'react';
import { useAppState } from '../hooks/useAppState';
import { getQueueSize } from '../services/writeQueue';
import { Menu } from 'lucide-react';
import { hasToken } from '../services/googleAuth';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useSheetSync } from '../hooks/useSheetSync';
import { useEncounterLifecycle } from '../hooks/useEncounterLifecycle';
import { useEncounterResume } from '../hooks/useEncounterResume';
import { SyncingOverlay } from './SyncingOverlay';
import { GMLoadingScreen } from './GMLoadingScreen';
import { GMDashboardSidebar } from './GMDashboardSidebar';
import { GMTabContent } from './GMTabContent';
import { STORAGE_KEYS, WRITE_QUEUE } from '../lib/constants';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { AudioPanel } from './AudioPanel';
import { DiceRoller } from './DiceRoller';
import { CommandPalette } from './CommandPalette';
import { useMoodPresets } from '../hooks/useMoodPresets';

const VALID_TABS = [
  'party',
  'encounters',
  'npc-library',
  'combat',
  'settings'
] as const;

type Tab = typeof VALID_TABS[number];

function isTab(value: unknown): value is Tab {
  return typeof value === 'string' && (VALID_TABS as readonly string[]).includes(value);
}

const LAST_TAB_KEY = STORAGE_KEYS.lastActiveTab;

import { Campaign } from '../hooks/useCampaign';

export interface GMDashboardProps {
  campaign?: Campaign;
  onCloseCampaign?: () => void;
}

export function GMDashboard({ campaign, onCloseCampaign }: GMDashboardProps = {}) {
  const { state } = useAppState();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const stored = localStorage.getItem(LAST_TAB_KEY);
    return isTab(stored) ? stored : 'party';
  });

  const handleBackToCampaigns = useCallback(() => {
    if (state.combatState.activeEncounterId) {
      setShowLeaveConfirm(true);
    } else {
      onCloseCampaign?.();
    }
  }, [state.combatState.activeEncounterId, onCloseCampaign]);

  useEffect(() => {
    if (activeTab === 'combat' && !state.combatState.activeEncounterId) {
      setActiveTab('encounters');
      localStorage.setItem(LAST_TAB_KEY, 'encounters');
    }
  }, [activeTab, state.combatState.activeEncounterId]);

  const handleTabChange = useCallback((tab: Tab) => {
    localStorage.setItem(LAST_TAB_KEY, tab);
    setActiveTab(tab);
  }, []);

  useEffect(() => {
    const handleTabChangeEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Tab>;
      if (customEvent.detail) {
        handleTabChange(customEvent.detail);
      }
    };
    window.addEventListener('gm-change-tab', handleTabChangeEvent);
    return () => {
      window.removeEventListener('gm-change-tab', handleTabChangeEvent);
    };
  }, [handleTabChange]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.sidebarOpen);
    return stored !== null ? stored === 'true' : false;
  });

  const [isOnline, setIsOnline] = useState(() => typeof window !== 'undefined' ? window.navigator.onLine : true);
  const [queuedWrites, setQueuedWrites] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    setQueuedWrites(getQueueSize());

    const interval = setInterval(() => {
      setQueuedWrites(getQueueSize());
    }, WRITE_QUEUE.queuePollIntervalMs);

    return () => clearInterval(interval);
  }, []);

  const setSidebarOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    setIsSidebarOpen(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      localStorage.setItem(STORAGE_KEYS.sidebarOpen, String(next));
      return next;
    });
  };

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
  } = useGoogleAuth({
    onLog: addLog,
    onAuthSuccess: () => handleSyncWithSheets(false),
  });

  const campaignId = campaign?.id ?? 'default';
  const audioEngine = useAudioEngine(campaignId);
  const moodPresets = useMoodPresets(campaignId);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isAudioPanelOpen, setIsAudioPanelOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        setIsAudioPanelOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsPaletteOpen(true);
        return;
      }

      // Check if user is typing in forms
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

      // Alt + 1-5 for Mood Presets matching Sweet, Adventuring, Tense, Scary, Combat
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '1') {
          e.preventDefault();
          moodPresets.activateMood('sweet', audioEngine.playAmbient);
        } else if (e.key === '2') {
          e.preventDefault();
          moodPresets.activateMood('adventuring', audioEngine.playAmbient);
        } else if (e.key === '3') {
          e.preventDefault();
          moodPresets.activateMood('tense', audioEngine.playAmbient);
        } else if (e.key === '4') {
          e.preventDefault();
          moodPresets.activateMood('scary', audioEngine.playAmbient);
        } else if (e.key === '5') {
          e.preventDefault();
          moodPresets.activateMood('combat', audioEngine.playAmbient);
        }
      }
    };
    const handleOpenPalette = () => {
      setIsPaletteOpen(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleOpenPalette);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleOpenPalette);
    };
  }, [moodPresets, audioEngine.playAmbient]);

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
    <div className="w-full h-[100dvh] bg-[#fdfaf5] flex overflow-hidden font-serif select-none relative">
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-[#2c2c26]/60 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <GMDashboardSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isOpen={isSidebarOpen}
        onToggle={setSidebarOpen}
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
        <header className="h-16 lg:h-20 shrink-0 border-b border-[#e5e1d8] px-4 lg:px-8 flex items-center justify-between bg-white/80 lg:bg-white/50 backdrop-blur-md sticky top-0 z-10 transition-all">
          <div className="flex-1 max-w-lg mr-4 group flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-[#5a5a40] hover:bg-black/5 rounded cursor-pointer" id="header-sidebar-menu-btn">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 id="header-campaign-title" className="text-lg lg:text-xl font-bold text-[#2c2c26] px-2 leading-tight">
                {campaign ? campaign.name : "GM Encounter Dashboard"}
              </h2>
              <p id="header-campaign-subtitle" className="text-xs text-[#5a5a40] px-2 font-sans font-medium uppercase tracking-wider">
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

      <div
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: '0.5rem',
          zIndex: 50,
        }}
      >
        <div className="relative flex flex-col h-11">
          <button
            id="audio-panel-header"
            onClick={() => setIsAudioPanelOpen(true)}
            className={`h-11 bg-white shadow-lg border text-stone-900 overflow-visible transition-all font-sans rounded-xl flex items-center justify-between px-4 cursor-pointer hover:bg-[#f5f5f0] select-none ${
              isAudioPanelOpen ? 'ring-2 ring-[#c5b358] border-[#c5b358]' : 'border-[#e5e1d8]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] shrink-0 font-bold uppercase tracking-wider text-[#2c2c26] flex items-center gap-2 font-sans" id="audio-panel-label">
                <span role="img" aria-label="music" className="text-sm">🎵</span> AUDIO
              </span>

              {audioEngine.isAmbientPlaying && (
                <span className="relative flex h-2 w-2 shrink-0 ml-1" id="audio-active-pulsar">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
                </span>
              )}
            </div>
          </button>
        </div>
        
        {isAudioPanelOpen && (
          <AudioPanel {...audioEngine} {...moodPresets} campaignId={campaignId} isOpen={isAudioPanelOpen} onClose={() => setIsAudioPanelOpen(false)} />
        )}
        <DiceRoller />
      </div>

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
        onClose={() => setIsPaletteOpen(false)}
        ambientFiles={audioEngine.storedFiles.filter(f => f.category === 'ambient')}
        onPlayAmbient={audioEngine.playAmbient}
        currentAmbientId={audioEngine.currentAmbientId}
        activeMood={moodPresets.activeMood}
        assignments={moodPresets.assignments}
        activateMood={moodPresets.activateMood}
      />

      {showLeaveConfirm && (
        <div id="leave-campaign-confirm-overlay" className="fixed inset-0 bg-[#2c2c26]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 select-none animate-fade-in font-serif">
          <div className="bg-[#fdfaf5] border-2 border-[#c5b358] rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <h3 className="text-xl font-bold text-[#2c2c26] mb-3">Leave Campaign?</h3>
            <p className="text-sm font-sans text-[#5a5a40] mb-6">
              An encounter is in progress. Leave this campaign?
            </p>
            <div className="flex justify-center gap-3 font-sans">
              <button
                id="leave-campaign-stay-btn"
                onClick={() => setShowLeaveConfirm(false)}
                className="px-5 py-2.5 bg-stone-200 hover:bg-stone-300 font-bold text-stone-800 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Stay
              </button>
              <button
                id="leave-campaign-leave-btn"
                onClick={() => {
                  setShowLeaveConfirm(false);
                  onCloseCampaign?.();
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 font-bold text-white rounded-lg text-sm transition-colors cursor-pointer animate-pulse"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
