// src/components/SyncingOverlay.tsx

import { AlertCircle, LogIn, RefreshCw } from 'lucide-react';

interface SyncingOverlayProps {
  isSyncing: boolean;
  syncLogs: string[];
  syncError: string | null;
  isGoogleConnected: boolean;
  handleSignIn: () => void;
  setSyncError: (err: string | null) => void;
  setIsSyncing: (val: boolean) => void;
  addLog: (msg: string) => void;
}

export function SyncingOverlay({
  isSyncing,
  syncLogs,
  syncError,
  isGoogleConnected,
  handleSignIn,
  setSyncError,
  setIsSyncing,
  addLog,
}: SyncingOverlayProps) {
  if (!isSyncing) return null;

  return (
    <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-6 text-white text-center">
      <div className="bg-[#ffffff] w-full max-w-xl rounded-2xl shadow-2xl p-8 flex flex-col gap-6 border border-[#e2e8f0] text-left">
        <div className="flex flex-col items-center text-center gap-4">
          <RefreshCw className="w-12 h-12 text-[#2563eb] animate-spin" />
          <div>
            <h3 className="text-xl font-bold text-[#0f172a] font-serif uppercase tracking-wider">Synchronizing Data</h3>
            <p className="text-sm text-[#8d8db9] font-sans mt-1">Fetching campaign information from Google Sheets...</p>
          </div>
        </div>

        <div className="bg-[#0f172a] rounded-xl p-5 font-mono text-xs text-[#e2e8f0]/80 h-56 overflow-y-auto flex flex-col gap-1.5 border border-black/20">
          {syncLogs.length === 0 && <span className="opacity-40 animate-pulse">Initializing connection...</span>}
          {syncLogs.map((log, i) => (
            <div key={i} className="border-l-2 border-[#2563eb]/30 pl-2 leading-relaxed">
              {log}
            </div>
          ))}
          {syncError && (
            <div className="mt-4 p-5 bg-red-900/40 border border-[#e2e8f0] rounded-xl shadow-inner">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-red-100 shrink-0" />
                <div>
                  <p className="text-red-100 font-sans font-bold text-sm">Action Required</p>
                  <p className="text-red-200/80 font-sans text-xs mt-1 leading-relaxed">
                    {syncError.includes('UNAUTHENTICATED')
                      ? 'Your session has expired. To maintain background sync, we need you to sign in again using the persistent flow.'
                      : "We couldn't connect to Google. This often happens if the spreadsheet ID is wrong or your session is stale."}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setSyncError(null);
                    addLog('Initiating Persistent Auth via Redirect...');
                    handleSignIn();
                  }}
                  className="bg-[#2563eb] hover:bg-[#567eff] text-white px-4 py-3 rounded-xl font-bold font-sans uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg"
                >
                  <LogIn className="w-4 h-4" />
                  Reconnect with Google
                </button>

                <button
                  onClick={() => setIsSyncing(false)}
                  className="text-white/40 hover:text-white/60 text-[10px] uppercase tracking-tighter font-bold py-2"
                >
                  Dismiss and continue offline
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-widest text-[#8d8db9] font-bold opacity-60">
            {isGoogleConnected ? 'Connected to Google Account' : 'Accessing Google Services...'}
          </div>
          <button
            onClick={() => setIsSyncing(false)}
            className="text-xs uppercase tracking-widest text-red-500 font-bold hover:underline"
          >
            Cancel Sync
          </button>
        </div>
      </div>
    </div>
  );
}
