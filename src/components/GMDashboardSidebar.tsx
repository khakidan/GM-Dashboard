import {
  Swords,
  Users,
  Map,
  RefreshCw,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
  Skull,
  Settings,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { hasToken } from '../services/googleAuth';

export interface GMDashboardSidebarProps {
  activeTab: 'party' | 'encounters' | 'npc-library' | 'combat' | 'settings' | 'npcs';
  onTabChange: (tab: 'party' | 'encounters' | 'npc-library' | 'combat' | 'settings') => void;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  campaignName: string;
  isSyncing: boolean;
  isOnline?: boolean;
  queuedWrites?: number;
  lastSyncTime?: Date | null;
  syncError?: string | null;
  onSyncWithSheets?: (forcePrompt?: boolean) => void;
  activeEncounterId: string | null;
}

export function GMDashboardSidebar({
  activeTab,
  onTabChange,
  isOpen,
  onToggle,
  campaignName,
  isSyncing,
  isOnline = true,
  queuedWrites = 0,
  lastSyncTime = null,
  syncError = null,
  onSyncWithSheets,
  activeEncounterId,
}: GMDashboardSidebarProps) {
  return (
    <aside className={cn(
      'bg-[#2c2c26] text-[#e5e1d8] flex flex-col border-r border-[#1a1a14] transition-all duration-300 z-40 fixed h-full lg:relative shrink-0',
      isOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
    )}>
      <button
        id="sidebar-toggle-btn"
        onClick={() => onToggle(!isOpen)}
        className="hidden lg:flex absolute -right-3 top-6 bg-[#3f3f37] border border-[#1a1a14] p-1.5 rounded-full text-white hover:bg-[#5a5a40] transition-colors z-20 cursor-pointer"
      >
        {isOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
      </button>

      <button
        onClick={() => onToggle(false)}
        className="lg:hidden absolute top-4 right-4 p-2 text-white/50 hover:text-white"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="p-4 h-24 flex items-center justify-center">
        {isOpen ? (
          <div className="w-full px-4">
            <h1 className="text-xl font-bold tracking-tight text-[#c5b358] truncate">{campaignName || "GAME MASTER"}</h1>
            <div className="mt-0.5 text-[11px] uppercase tracking-widest opacity-50 font-sans">Campaign Hub</div>
          </div>
        ) : (
          <button
            onClick={() => onToggle(true)}
            className="p-3 hover:bg-[#3f3f37] rounded-xl text-[#c5b358] transition-all active:scale-95 cursor-pointer"
            title="Open Sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        <button
          onClick={() => {
            onTabChange('party');
            if (window.innerWidth < 1024) onToggle(false);
          }}
          className={cn(
            'w-full text-left p-3 flex items-center transition-colors rounded-lg cursor-pointer',
            activeTab === 'party' ? 'bg-[#3f3f37] text-white' : 'hover:bg-[#3f3f37]/50 opacity-70',
            isOpen ? 'gap-3' : 'justify-center'
          )}
          title="Party Roster"
        >
          {activeTab === 'party' && isOpen && <div className="w-2 h-2 rounded-full bg-[#c5b358] shrink-0"></div>}
          <Users className="w-5 h-5 shrink-0" />
          {isOpen && <span className="font-bold font-sans line-clamp-1">Party Roster</span>}
        </button>

        <button
          id="nav-npc-library"
          onClick={() => {
            onTabChange('npc-library');
            if (window.innerWidth < 1024) onToggle(false);
          }}
          className={cn(
            'w-full text-left p-3 flex items-center transition-colors rounded-lg cursor-pointer',
            (activeTab === 'npc-library' || activeTab === 'npcs') ? 'bg-[#3f3f37] text-white' : 'hover:bg-[#3f3f37]/50 opacity-70',
            isOpen ? 'gap-3' : 'justify-center'
          )}
          title="NPC Library"
        >
          {(activeTab === 'npc-library' || activeTab === 'npcs') && isOpen && <div className="w-2 h-2 rounded-full bg-[#c5b358] shrink-0"></div>}
          <Skull className="w-5 h-5 shrink-0" />
          {isOpen && <span className="font-bold font-sans line-clamp-1">NPC Library</span>}
        </button>

        <button
          onClick={() => {
            onTabChange('encounters');
            if (window.innerWidth < 1024) onToggle(false);
          }}
          className={cn(
            'w-full text-left p-3 flex items-center transition-colors rounded-lg cursor-pointer',
            activeTab === 'encounters' ? 'bg-[#3f3f37] text-white' : 'hover:bg-[#3f3f37]/50 opacity-70',
            isOpen ? 'gap-3' : 'justify-center'
          )}
          title="Encounters"
        >
          {activeTab === 'encounters' && isOpen && <div className="w-2 h-2 rounded-full bg-[#c5b358] shrink-0"></div>}
          <Map className="w-5 h-5 shrink-0" />
          {isOpen && <span className="font-bold font-sans line-clamp-1">Encounters</span>}
        </button>

        <button
          onClick={() => {
            if (activeEncounterId) {
              onTabChange('combat');
              if (window.innerWidth < 1024) onToggle(false);
            }
          }}
          disabled={!activeEncounterId}
          className={cn(
            'w-full text-left p-3 flex items-center transition-colors rounded-lg cursor-pointer',
            activeTab === 'combat' ? 'bg-[#3f3f37] text-white' : (activeEncounterId ? 'hover:bg-[#3f3f37]/50 opacity-70' : 'opacity-30 cursor-not-allowed'),
            isOpen ? 'gap-3' : 'justify-center'
          )}
          title="Active Combat"
        >
          {activeTab === 'combat' && isOpen && <div className="w-2 h-2 rounded-full bg-[#c5b358] shrink-0"></div>}
          <Swords className="w-5 h-5 shrink-0" />
          {isOpen && <span className="font-bold font-sans line-clamp-1">Active Combat</span>}
        </button>

        <button
          id="app-settings-btn"
          onClick={() => {
            onTabChange('settings');
            if (window.innerWidth < 1024) onToggle(false);
          }}
          className={cn(
            'w-full text-left p-3 flex items-center transition-colors rounded-lg cursor-pointer',
            activeTab === 'settings' ? 'bg-[#3f3f37] text-white' : 'hover:bg-[#3f3f37]/50 opacity-70',
            isOpen ? 'gap-3' : 'justify-center'
          )}
          title="App Settings"
        >
          {activeTab === 'settings' && isOpen && <div className="w-2 h-2 rounded-full bg-[#c5b358] shrink-0"></div>}
          <Settings className="w-5 h-5 shrink-0" />
          {isOpen && <span className="font-bold font-sans line-clamp-1">Settings</span>}
        </button>
      </nav>

      <div className="p-4 border-t border-[#3f3f37]">
        {isOpen ? (
          <div className="flex flex-col gap-3 p-3 rounded-lg bg-[#1a1a14]/40">
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
              onClick={() => onSyncWithSheets?.(true)}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 w-full bg-[#3f3f37] hover:bg-[#5a5a40] text-[#e5e1d8] rounded-md py-3 text-xs font-sans font-bold uppercase tracking-widest transition-colors disabled:opacity-50 cursor-pointer"
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
              onClick={() => onSyncWithSheets?.()}
              disabled={isSyncing}
              title="Pull from Sheets"
              className="p-2 bg-[#3f3f37] hover:bg-[#5a5a40] rounded-full text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
            </button>
          </div>
        )}

        {/* Offline/Syncing Queue Indicator */}
        {(!isOnline || queuedWrites > 0) && (
          <div className={cn(
            "mt-3 text-[11px] font-sans tracking-wider flex items-center bg-[#1a1a14]/60 p-2.5 rounded-lg border",
            isOnline ? "border-green-500/20 text-green-300" : "border-amber-500/20 text-amber-300",
            isOpen ? "gap-2.5 px-3" : "justify-center p-2"
          )}
          title={!isOnline ? `Offline — ${queuedWrites} writes queued` : `Syncing ${queuedWrites} writes...`}
          >
            {isOnline ? (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            ) : (
              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0"></span>
            )}
            {isOpen && (
              <span className="font-bold uppercase tracking-wider truncate leading-none">
                {!isOnline ? `Offline — ${queuedWrites} writes queued` : `Syncing ${queuedWrites} writes...`}
              </span>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
