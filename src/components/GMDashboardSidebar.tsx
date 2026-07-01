import {
  Swords,
  Users,
  Map,
  Skull,
  Settings,
  Search,
  ArrowLeft,
} from 'lucide-react';
import { SidebarIcon } from './SidebarIcon';
import { SyncStatusIndicators } from './SyncStatusIndicators';

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
    <aside className="w-16 bg-[#2563eb] text-white flex flex-col border-r border-[#567eff] z-40 h-full relative shrink-0 pt-4 overflow-visible">
      <nav className="flex-1 px-3 space-y-4 overflow-visible flex flex-col items-center">
        {/* Search / Command Palette */}
        <SidebarIcon
          id="sidebar-search-btn"
          icon={<Search className="w-5 h-5 text-white" />}
          label="Search (⌘K)"
          aria-label="Search"
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
        />

        {/* Party Roster */}
        <SidebarIcon
          icon={<Users className="w-5 h-5" />}
          label="Party Roster"
          isActive={activeTab === 'party'}
          onClick={() => onTabChange('party')}
        />

        {/* NPC Library */}
        <SidebarIcon
          id="nav-npc-library"
          icon={<Skull className="w-5 h-5" />}
          label="NPC Library"
          isActive={activeTab === 'npc-library' || activeTab === 'npcs'}
          onClick={() => onTabChange('npc-library')}
        />

        {/* Encounters */}
        <SidebarIcon
          icon={<Map className="w-5 h-5" />}
          label="Encounters"
          isActive={activeTab === 'encounters'}
          onClick={() => onTabChange('encounters')}
        />

        {/* Active Combat */}
        <SidebarIcon
          icon={<Swords className="w-5 h-5" />}
          label={activeEncounterId ? 'Active Combat' : 'No Active Combat'}
          aria-label="Active Combat"
          disabled={!activeEncounterId}
          isActive={activeTab === 'combat'}
          onClick={() => activeEncounterId && onTabChange('combat')}
        />

        {/* App Settings */}
        <SidebarIcon
          id="app-settings-btn"
          icon={<Settings className="w-5 h-5" />}
          label="Settings"
          isActive={activeTab === 'settings'}
          onClick={() => onTabChange('settings')}
        />

        {/* All Campaigns (back button) */}
        <div className="pt-4 border-t border-[#567eff] w-full mt-4">
          <SidebarIcon
            id="sidebar-all-campaigns-btn"
            icon={<ArrowLeft className="w-5 h-5" />}
            label="All Campaigns"
            onClick={onCloseCampaign || (() => {})}
          />
        </div>
      </nav>

      <SyncStatusIndicators
        isSyncing={isSyncing}
        isOnline={isOnline}
        queuedWrites={queuedWrites}
        lastSyncTime={lastSyncTime}
        syncError={syncError}
        onSyncWithSheets={onSyncWithSheets}
      />
    </aside>
  );
}

