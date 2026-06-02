import { PartyTab } from './PartyTab';
import { NpcLibraryTab } from './NpcLibraryTab';
import { EncountersTab } from './EncountersTab';
import { ActiveEncounterTab } from './ActiveEncounterTab';
import { SettingsPage } from './SettingsPage';
import { ErrorBoundary } from './ErrorBoundary';
import { toast } from 'sonner';

export interface GMTabContentProps {
  activeTab: 'party' | 'encounters' | 'npc-library' | 'combat' | 'settings' | 'npcs';
  hasActiveEncounter: boolean;
  clearEncounter: () => void;
  startEncounter: (id: string) => void;
  isGoogleConnected: boolean;
  handleSignIn: () => void;
  handleSignOut: () => void;
  setIsGoogleConnected: (connected: boolean) => void;
  handleSyncWithSheets: (forcePrompt?: boolean) => Promise<void>;
  addLog: (log: string) => void;
}

export function GMTabContent({
  activeTab,
  hasActiveEncounter,
  clearEncounter,
  startEncounter,
  isGoogleConnected,
  handleSignIn,
  handleSignOut,
  setIsGoogleConnected,
  handleSyncWithSheets,
  addLog,
}: GMTabContentProps) {
  if ((activeTab === 'combat') && hasActiveEncounter) {
    return (
      <ErrorBoundary>
        <ActiveEncounterTab onBack={clearEncounter} />
      </ErrorBoundary>
    );
  }

  if (activeTab === 'party') {
    return (
      <ErrorBoundary>
        <PartyTab />
      </ErrorBoundary>
    );
  }

  if (activeTab === 'npc-library' || activeTab === 'npcs') {
    return (
      <ErrorBoundary>
        <NpcLibraryTab />
      </ErrorBoundary>
    );
  }

  if (activeTab === 'settings') {
    return (
      <ErrorBoundary>
        <SettingsPage
          isGoogleConnected={isGoogleConnected}
          handleSignIn={handleSignIn}
          handleSignOut={handleSignOut}
          setIsGoogleConnected={setIsGoogleConnected}
          handleSyncWithSheets={handleSyncWithSheets}
          addLog={addLog}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
