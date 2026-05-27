// src/components/GMDashboard.tsx

import { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import {
  Swords,
  Users,
  Map,
  RefreshCw,
  PanelLeftClose,
  PanelLeft,
  Menu,
  Skull,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { PartyTab } from './PartyTab';
import { NpcLibraryTab } from './NpcLibraryTab';
import { EncountersTab } from './EncountersTab';
import { ActiveEncounterTab } from './ActiveEncounterTab';
import { hasToken } from '../services/googleAuth';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useSheetSync } from '../hooks/useSheetSync';
import { SyncingOverlay } from './SyncingOverlay';
import { SettingsPage } from './SettingsPage';

type Tab = 'party' | 'encounters' | 'npc-library' | 'combat' | 'settings';

export function GMDashboard() {
  const { state } = useAppState();
  const [activeTab, setActiveTab] = useState<Tab>('party');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const stored = localStorage.getItem('gm_sidebar_open');
    return stored !== null ? stored === 'true' : false;
  });

  const setSidebarOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    setIsSidebarOpen(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      localStorage.setItem('gm_sidebar_open', String(next));
      return next;
    });
  };

  const {
    handleSyncWithSheets,
    startEncounter,
    clearEncounter,
    isSyncing,
    setIsSyncing,
    syncError,
    setSyncError,
    syncLogs,
    lastSyncTime,
    addLog,
  } = useSheetSync({
    setIsGoogleConnected: (val) => setIsGoogleConnected(val),
    onActiveTabChange: (tab) => setActiveTab(tab),
  });

  const {
    isGoogleConnected,
    setIsGoogleConnected,
    handleSignIn,
    handleSignOut,
  } = useGoogleAuth({
    onLog: addLog,
    onAuthSuccess: () => handleSyncWithSheets(false),
  });

  return (
    <div className="w-full h-[100dvh] bg-[#fdfaf5] flex overflow-hidden font-serif select-none relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-[#2c2c26]/60 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={cn(
        'bg-[#2c2c26] text-[#e5e1d8] flex flex-col border-r border-[#1a1a14] transition-all duration-300 z-40 fixed h-full lg:relative shrink-0',
        isSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
      )}>
        <button
          id="sidebar-toggle-btn"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="hidden lg:flex absolute -right-3 top-6 bg-[#3f3f37] border border-[#1a1a14] p-1.5 rounded-full text-white hover:bg-[#5a5a40] transition-colors z-20"
        >
          {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-white/50 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-4 h-24 flex items-center justify-center">
          {isSidebarOpen ? (
            <div className="w-full px-4">
              <h1 className="text-xl font-bold tracking-tight text-[#c5b358]">GAME MASTER</h1>
              <div className="mt-0.5 text-[11px] uppercase tracking-widest opacity-50 font-sans">Campaign Hub</div>
            </div>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-3 hover:bg-[#3f3f37] rounded-xl text-[#c5b358] transition-all active:scale-95"
              title="Open Sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => {
              setActiveTab('party');
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            className={cn(
              'w-full text-left p-3 flex items-center transition-colors rounded-lg',
              activeTab === 'party' ? 'bg-[#3f3f37] text-white' : 'hover:bg-[#3f3f37]/50 opacity-70',
              isSidebarOpen ? 'gap-3' : 'justify-center'
            )}
            title="Party Roster"
          >
            {activeTab === 'party' && isSidebarOpen && <div className="w-2 h-2 rounded-full bg-[#c5b358] shrink-0"></div>}
            <Users className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="font-bold font-sans line-clamp-1">Party Roster</span>}
          </button>

          <button
            id="nav-npc-library"
            onClick={() => {
              setActiveTab('npc-library');
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            className={cn(
              'w-full text-left p-3 flex items-center transition-colors rounded-lg',
              activeTab === 'npc-library' ? 'bg-[#3f3f37] text-white' : 'hover:bg-[#3f3f37]/50 opacity-70',
              isSidebarOpen ? 'gap-3' : 'justify-center'
            )}
            title="NPC Library"
          >
            {activeTab === 'npc-library' && isSidebarOpen && <div className="w-2 h-2 rounded-full bg-[#c5b358] shrink-0"></div>}
            <Skull className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="font-bold font-sans line-clamp-1">NPC Library</span>}
          </button>

          <button
            onClick={() => {
              setActiveTab('encounters');
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            className={cn(
              'w-full text-left p-3 flex items-center transition-colors rounded-lg',
              activeTab === 'encounters' ? 'bg-[#3f3f37] text-white' : 'hover:bg-[#3f3f37]/50 opacity-70',
              isSidebarOpen ? 'gap-3' : 'justify-center'
            )}
            title="Encounters"
          >
            {activeTab === 'encounters' && isSidebarOpen && <div className="w-2 h-2 rounded-full bg-[#c5b358] shrink-0"></div>}
            <Map className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="font-bold font-sans line-clamp-1">Encounters</span>}
          </button>

          <button
            onClick={() => {
              if (state.combatState.activeEncounterId) {
                setActiveTab('combat');
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }
            }}
            disabled={!state.combatState.activeEncounterId}
            className={cn(
              'w-full text-left p-3 flex items-center transition-colors rounded-lg',
              activeTab === 'combat' ? 'bg-[#3f3f37] text-white' : (state.combatState.activeEncounterId ? 'hover:bg-[#3f3f37]/50 opacity-70' : 'opacity-30 cursor-not-allowed'),
              isSidebarOpen ? 'gap-3' : 'justify-center'
            )}
            title="Active Combat"
          >
            {activeTab === 'combat' && isSidebarOpen && <div className="w-2 h-2 rounded-full bg-[#c5b358] shrink-0"></div>}
            <Swords className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="font-bold font-sans line-clamp-1">Active Combat</span>}
          </button>

          <button
            id="app-settings-btn"
            onClick={() => {
              setActiveTab('settings');
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            className={cn(
              'w-full text-left p-3 flex items-center transition-colors rounded-lg',
              activeTab === 'settings' ? 'bg-[#3f3f37] text-white' : 'hover:bg-[#3f3f37]/50 opacity-70',
              isSidebarOpen ? 'gap-3' : 'justify-center'
            )}
            title="App Settings"
          >
            {activeTab === 'settings' && isSidebarOpen && <div className="w-2 h-2 rounded-full bg-[#c5b358] shrink-0"></div>}
            <Settings className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="font-bold font-sans line-clamp-1">Settings</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-[#3f3f37]">
          {isSidebarOpen ? (
            <div className="flex flex-col gap-3 p-3 bg-[#1a1a14] rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#5a5a40] flex items-center justify-center text-sm font-bold font-sans text-white shrink-0">G</div>
                <div className="overflow-hidden">
                  <div className="text-base font-bold font-sans truncate">Google Sheets</div>
                  <div className={cn(
                    'text-[10px] uppercase tracking-widest font-bold truncate',
                    lastSyncTime ? 'text-green-500' : 'text-yellow-500'
                  )}>
                    {lastSyncTime
                      ? `Synced ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : 'Not Synced'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSyncWithSheets(true)}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 w-full bg-[#3f3f37] hover:bg-[#5a5a40] text-[#e5e1d8] rounded-md py-3 text-xs font-sans font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn('w-4 h-4 shrink-0', isSyncing && 'animate-spin')} />
                {isSyncing ? 'Syncing...' : hasToken() ? 'Pull from Sheets' : 'Connect & Sync'}
              </button>
              {syncError && <div className="text-xs text-red-400 font-sans mt-1 leading-tight">{syncError}</div>}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-2">
              <div
                title={lastSyncTime ? `Synced ${lastSyncTime.toLocaleTimeString()}` : 'Not Synced'}
                className="w-8 h-8 rounded-full bg-[#5a5a40] flex items-center justify-center text-xs font-bold font-sans text-white shrink-0 relative"
              >
                G
                <div className={cn('absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#2c2c26]', lastSyncTime ? 'bg-green-500' : 'bg-yellow-500')}></div>
              </div>
              <button
                onClick={() => handleSyncWithSheets()}
                disabled={isSyncing}
                title="Pull from Sheets"
                className="p-2 bg-[#3f3f37] hover:bg-[#5a5a40] rounded-full text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 lg:h-20 shrink-0 border-b border-[#e5e1d8] px-4 lg:px-8 flex items-center justify-between bg-white/80 lg:bg-white/50 backdrop-blur-md sticky top-0 z-10 transition-all">
          <div className="flex-1 max-w-lg mr-4 group flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-[#5a5a40] hover:bg-black/5 rounded">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg lg:text-xl font-bold text-[#2c2c26] px-2 py-1">
              GM Encounter Dashboard
            </h2>
          </div>
        </header>

        {/* Dashboard Content */}
        <section className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'combat' && state.combatState.activeEncounterId ? (
              <ActiveEncounterTab onBack={clearEncounter} />
            ) : activeTab === 'party' ? (
              <PartyTab />
            ) : activeTab === 'npc-library' ? (
              <NpcLibraryTab />
            ) : activeTab === 'settings' ? (
              <SettingsPage
                isGoogleConnected={isGoogleConnected}
                handleSignIn={handleSignIn}
                handleSignOut={handleSignOut}
                setIsGoogleConnected={setIsGoogleConnected}
                handleSyncWithSheets={handleSyncWithSheets}
                addLog={addLog}
              />
            ) : (
              <EncountersTab
                onSelectEncounter={startEncounter}
                onSyncRequested={async () => {
                  toast.promise(handleSyncWithSheets(false), {
                    loading: 'Syncing with Google Sheets...',
                    success: 'Sync complete',
                    error: 'Sync failed — changes saved locally',
                  });
                }}
              />
            )}
          </div>
        </section>
      </main>

      {/* Syncing Overlay */}
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
