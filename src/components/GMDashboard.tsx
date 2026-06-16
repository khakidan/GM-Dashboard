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

export function GMDashboard() {
  const { state } = useAppState();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const stored = localStorage.getItem(LAST_TAB_KEY);
    return isTab(stored) ? stored : 'party';
  });

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

  const audioEngine = useAudioEngine();

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
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 lg:h-20 shrink-0 border-b border-[#e5e1d8] px-4 lg:px-8 flex items-center justify-between bg-white/80 lg:bg-white/50 backdrop-blur-md sticky top-0 z-10 transition-all">
          <div className="flex-1 max-w-lg mr-4 group flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-[#5a5a40] hover:bg-black/5 rounded cursor-pointer">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg lg:text-xl font-bold text-[#2c2c26] px-2 py-1">
              GM Encounter Dashboard
            </h2>
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
        <AudioPanel {...audioEngine} />
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
    </div>
  );
}
