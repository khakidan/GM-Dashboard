import { RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

import { useGoogleAuth } from '../hooks/useGoogleAuth';

interface SyncStatusIndicatorsProps {
  isSyncing: boolean;
  isOnline: boolean;
  queuedWrites: number;
  lastSyncTime: Date | null;
  syncError: string | null;
  onSyncWithSheets?: (forcePrompt?: boolean) => void;
}

export function SyncStatusIndicators({
  isSyncing,
  isOnline,
  queuedWrites,
  lastSyncTime,
  syncError,
  onSyncWithSheets,
}: SyncStatusIndicatorsProps) {
  const { hasToken } = useGoogleAuth();
  return (
    <div className="p-2 border-t border-[#3f3f37] space-y-4 flex flex-col items-center">
      {/* Google Sheets Icon & Status */}
      <div className="relative group flex justify-center">
        <div
          title={lastSyncTime ? `Synced ${lastSyncTime.toLocaleTimeString()}` : 'Not Synced'}
          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold font-sans text-white shrink-0 relative cursor-help"
        >
          G
          <div className={cn('absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#2563eb]', lastSyncTime ? 'bg-green-500' : 'bg-yellow-500')}></div>
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
          className="w-10 h-10 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-lg text-white transition-colors disabled:opacity-50 cursor-pointer"
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
            isOnline ? "border-green-500/20 text-green-300 bg-stone-800/40" : "border-[#2563eb]/20 text-amber-300 bg-stone-800/40"
          )}>
            {isOnline ? (
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
            ) : (
              <span className="h-2.5 w-2.5 rounded-full bg-[#f9f8ff]0 shrink-0"></span>
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
  );
}
