import {
  Swords,
  Users,
  Map,
  RefreshCw,
  Skull,
  Settings,
  Search,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { hasToken } from '../services/googleAuth';

export interface GMDashboardSidebarProps {
  activeTab: 'party' | 'encounters' | 'npc-library' | 'combat' | 'settings' | 'npcs';
  onTabChange: (tab: 'party' | 'encounters' | 'npc-library' | 'combat' | 'settings') => void;
  campaignName: string;
  isSyncing: boolean;
  isOnline?: boolean;
  queuedWrites?: number;
  lastSyncTime?: Date | null;
  syncError?: string | null;
  onSyncWithSheets?: (forcePrompt?: boolean) => void;
  activeEncounterId: string | null;
  onCloseCampaign?: () => void;
}

export function GMDashboardSidebar({
  activeTab,
  onTabChange,
  isSyncing,
  isOnline = true,
  queuedWrites = 0,
  lastSyncTime = null,
  syncError = null,
  onSyncWithSheets,
  activeEncounterId,
  onCloseCampaign,
}: GMDashboardSidebarProps) {
  return (
    <aside className="w-16 bg-[#2c2c26] text-[#e5e1d8] flex flex-col border-r border-[#1a1a14] z-40 h-full relative shrink-0 pt-4 overflow-visible">
      <nav className="flex-1 px-3 space-y-4 overflow-visible flex flex-col items-center">
        {/* Search / Command Palette */}
        <div className="relative group flex justify-center">
          <button
            id="sidebar-search-btn"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-command-palette'));
            }}
            className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors text-[#c5b358] hover:bg-stone-700/50 hover:text-white cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          {/* Tooltip */}
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 bg-stone-800 border border-stone-700 text-stone-200 text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150">
            Search (⌘K)
            {/* Small left-pointing arrow */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-800" />
          </div>
        </div>

        {/* Party Roster */}
        <div className="relative group flex justify-center">
          <button
            onClick={() => onTabChange('party')}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
              activeTab === 'party'
                ? 'bg-[#3f3f37] text-white ring-1 ring-[#c5b358]/30'
                : 'text-stone-400 hover:text-stone-200 hover:bg-[#3f3f37]/50'
            }`}
            aria-label="Party Roster"
          >
            <Users className="w-5 h-5" />
          </button>
          {/* Tooltip */}
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 bg-stone-800 border border-stone-700 text-stone-200 text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150">
            Party Roster
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-800" />
          </div>
        </div>

        {/* NPC Library */}
        <div className="relative group flex justify-center">
          <button
            id="nav-npc-library"
            onClick={() => onTabChange('npc-library')}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
              activeTab === 'npc-library' || activeTab === 'npcs'
                ? 'bg-[#3f3f37] text-white ring-1 ring-[#c5b358]/30'
                : 'text-stone-400 hover:text-stone-200 hover:bg-[#3f3f37]/50'
            }`}
            aria-label="NPC Library"
          >
            <Skull className="w-5 h-5" />
          </button>
          {/* Tooltip */}
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 bg-stone-800 border border-stone-700 text-stone-200 text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150">
            NPC Library
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-800" />
          </div>
        </div>

        {/* Encounters */}
        <div className="relative group flex justify-center">
          <button
            onClick={() => onTabChange('encounters')}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
              activeTab === 'encounters'
                ? 'bg-[#3f3f37] text-white ring-1 ring-[#c5b358]/30'
                : 'text-stone-400 hover:text-stone-200 hover:bg-[#3f3f37]/50'
            }`}
            aria-label="Encounters"
          >
            <Map className="w-5 h-5" />
          </button>
          {/* Tooltip */}
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 bg-stone-800 border border-stone-700 text-stone-200 text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150">
            Encounters
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-800" />
          </div>
        </div>

        {/* Active Combat */}
        <div className="relative group flex justify-center">
          <button
            onClick={() => activeEncounterId && onTabChange('combat')}
            disabled={!activeEncounterId}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              !activeEncounterId
                ? 'opacity-30 cursor-not-allowed text-stone-500'
                : activeTab === 'combat'
                ? 'bg-[#3f3f37] text-white ring-1 ring-[#c5b358]/30 cursor-pointer'
                : 'text-stone-400 hover:text-stone-200 hover:bg-[#3f3f37]/50 cursor-pointer'
            }`}
            aria-label="Active Combat"
          >
            <Swords className="w-5 h-5" />
          </button>
          {/* Tooltip */}
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 bg-stone-800 border border-stone-700 text-stone-200 text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150">
            {activeEncounterId ? 'Active Combat' : 'No Active Combat'}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-800" />
          </div>
        </div>

        {/* App Settings */}
        <div className="relative group flex justify-center">
          <button
            id="app-settings-btn"
            onClick={() => onTabChange('settings')}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#3f3f37] text-white ring-1 ring-[#c5b358]/30'
                : 'text-stone-400 hover:text-stone-200 hover:bg-[#3f3f37]/50'
            }`}
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          {/* Tooltip */}
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 bg-stone-800 border border-stone-700 text-stone-200 text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150">
            Settings
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-800" />
          </div>
        </div>

        {/* All Campaigns (back button) */}
        <div className="relative group flex justify-center">
          <button
            id="sidebar-all-campaigns-btn"
            onClick={onCloseCampaign}
            className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors text-stone-400 hover:text-stone-200 hover:bg-[#3f3f37]/50 mt-4 cursor-pointer"
            aria-label="All Campaigns"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {/* Tooltip */}
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 bg-stone-800 border border-stone-700 text-stone-200 text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150">
            All Campaigns
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-800" />
          </div>
        </div>
      </nav>

      {/* Sync Status Section at the bottom */}
      <div className="p-2 border-t border-[#3f3f37] space-y-4 flex flex-col items-center">
        {/* Google Sheets Icon & Status */}
        <div className="relative group flex justify-center">
          <div
            title={lastSyncTime ? `Synced ${lastSyncTime.toLocaleTimeString()}` : 'Not Synced'}
            className="w-8 h-8 rounded-full bg-[#5a5a40] flex items-center justify-center text-xs font-bold font-sans text-white shrink-0 relative cursor-help"
          >
            G
            <div className={cn('absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#2c2c26]', lastSyncTime ? 'bg-green-500' : 'bg-yellow-500')}></div>
          </div>
          {/* Tooltip */}
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 bg-stone-800 border border-stone-700 text-stone-200 text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150">
            {lastSyncTime
              ? `Sheets synced at ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Google Sheets (Not Synced)'}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-800" />
          </div>
        </div>

        {/* Pull from Sheets Button */}
        <div className="relative group flex justify-center">
          <button
            onClick={() => onSyncWithSheets?.()}
            disabled={isSyncing}
            className="w-10 h-10 flex items-center justify-center bg-[#3f3f37] hover:bg-[#5a5a40] rounded-lg text-white transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Pull from Sheets"
          >
            <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
          </button>
          {/* Tooltip */}
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 bg-stone-800 border border-stone-700 text-stone-200 text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150">
            {isSyncing ? 'Syncing...' : hasToken() ? 'Pull from Sheets' : 'Connect & Sync'}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-800" />
          </div>
        </div>

        {/* Queue / Sync status details */}
        {syncError && (
          <div className="relative group flex justify-center">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-red-500/20 text-red-400 bg-red-950/20 cursor-help">
              ⚠️
            </div>
            {/* Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 bg-stone-800 border border-stone-700 text-red-400 text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg whitespace-normal max-w-xs opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150">
              {syncError}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-800" />
            </div>
          </div>
        )}

        {/* Offline indicator */}
        {(!isOnline || queuedWrites > 0) && (
          <div className="relative group flex justify-center">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center border cursor-help",
              isOnline ? "border-green-500/20 text-green-300 bg-stone-800/40" : "border-amber-500/20 text-amber-300 bg-stone-800/40"
            )}>
              {isOnline ? (
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
              ) : (
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0"></span>
              )}
            </div>
            {/* Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 bg-stone-800 border border-stone-700 text-stone-200 text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150">
              {isOnline ? `Syncing ${queuedWrites} writes...` : `Offline — ${queuedWrites} writes queued`}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-800" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

