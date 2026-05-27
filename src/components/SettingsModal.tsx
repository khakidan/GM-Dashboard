// src/components/SettingsModal.tsx

import { useState } from 'react';
import { Settings, X, LogIn, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  getSpreadsheetId,
  setSpreadsheetId,
} from '../services/sheetsService';
import {
  setManualRefreshToken,
} from '../services/googleAuth';

interface SettingsModalProps {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (val: boolean) => void;
  isGoogleConnected: boolean;
  handleSignIn: () => void;
  handleSignOut: () => void;
  setIsGoogleConnected: (val: boolean) => void;
  handleSyncWithSheets: (isManual?: boolean) => Promise<void>;
  addLog: (msg: string) => void;
}

export function SettingsModal({
  isSettingsOpen,
  setIsSettingsOpen,
  isGoogleConnected,
  handleSignIn,
  handleSignOut,
  setIsGoogleConnected,
  handleSyncWithSheets,
  addLog,
}: SettingsModalProps) {
  const [tempSpreadsheetId, setTempSpreadsheetId] = useState(getSpreadsheetId());
  const [manualToken, setManualTokenState] = useState('');
  const [showAdvancedAuth, setShowAdvancedAuth] = useState(false);

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#fdfaf5] w-full max-w-lg rounded-2xl shadow-2xl border border-[#e5e1d8] overflow-hidden flex flex-col">
        <div className="bg-[#2c2c26] p-6 text-[#e5e1d8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-[#c5b358]" />
            <h2 className="text-xl font-bold font-serif uppercase tracking-wider">App Settings</h2>
          </div>
          <button
            onClick={() => {
              setTempSpreadsheetId(getSpreadsheetId());
              setIsSettingsOpen(false);
            }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-[#f5f5f0] border-2 border-[#e5e1d8] rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#2c2c26] mb-1">Google Connection</h3>
                <p className="text-xs text-[#5a5a40]">
                  {isGoogleConnected
                    ? 'Currently connected to Google Services.'
                    : 'Sign in to sync your campaign data with Google Sheets.'}
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                {!isGoogleConnected ? (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={async () => {
                        try {
                          console.log('[Auth] Initiating Redirect Flow...');
                          handleSignIn();
                        } catch (err: unknown) {
                          console.error('[Auth] Redirect Error:', err);
                          const message = err instanceof Error ? err.message : 'An unknown error occurred';
                          toast.error(`Failed to start login: ${message}`);
                        }
                      }}
                      className="bg-[#c5b358] hover:bg-[#b09f4d] text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign In with Google
                    </button>
                    <p className="text-[10px] text-[#5a5a40]/60 text-center px-4 leading-tight">
                      Authorization required for Sheets sync. Redirect flow is most reliable.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      handleSignOut();
                    }}
                    className="bg-red-50 hover:bg-red-100 text-red-600 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>

            {!isGoogleConnected && (
              <div className="mt-4 pt-4 border-t border-[#e5e1d8]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-[#5a5a40] font-medium">Advanced Setup:</p>
                  <button
                    onClick={() => setShowAdvancedAuth(!showAdvancedAuth)}
                    className="text-xs font-bold text-[#c5b358] hover:underline uppercase"
                  >
                    {showAdvancedAuth ? 'Hide Manual' : 'Configure Manual Token'}
                  </button>
                </div>

                {showAdvancedAuth && (
                  <div className="space-y-3 bg-white/30 p-4 rounded-xl border border-dashed border-[#c5b358]/50">
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#5a5a40] uppercase font-bold opacity-70">Manual Configuration</p>
                      <p className="text-xs text-[#5a5a40] leading-tight mb-2">
                        If the redirect flow fails, paste a refresh token below.
                      </p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={manualToken}
                          onChange={e => setManualTokenState(e.target.value)}
                          placeholder="paste_token_here..."
                          className="flex-1 bg-white border border-[#e5e1d8] rounded px-3 py-2 text-sm font-mono"
                        />
                        <button
                          onClick={() => {
                            if (manualToken) {
                              try {
                                setManualRefreshToken(manualToken);
                                setIsGoogleConnected(true);
                                toast.success('Manual token applied!');
                                setManualTokenState('');
                                setShowAdvancedAuth(false);
                              } catch (err: unknown) {
                                const message = err instanceof Error ? err.message : 'An unknown error occurred';
                                toast.error('Error: ' + message);
                              }
                            }
                          }}
                          className="bg-[#c5b358] text-white px-4 py-2 rounded text-xs font-bold uppercase transition-all active:scale-95 shadow-sm"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {isGoogleConnected && (
            <div className="bg-[#f5f5f0] border-2 border-[#e5e1d8] rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#2c2c26] mb-1">Database Maintenance</h3>
                  <p className="text-[10px] text-[#5a5a40]">
                    Runs a background job to scrub empty rows and clean up orphaned relational database IDs.
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={async () => {
                      const conf = confirm('Run Sync & Sanitize? This will remove empty rows from your sheets.');
                      if (!conf) return;
                      try {
                        const { syncAndSanitizeDatabase } = await import('../services/dbOperations');
                        addLog('Starting Sync & Sanitize...');
                        const deletedCount = await syncAndSanitizeDatabase();
                        addLog(`Sanitize complete. Removed ${deletedCount} empty rows.`);
                        toast.success(`Sanitize complete. Removed ${deletedCount} empty rows.`);
                        toast.promise(handleSyncWithSheets(false), {
                          loading: 'Syncing with Google Sheets...',
                          success: 'Sync complete',
                          error: 'Sync failed — changes saved locally',
                        });
                      } catch (err: unknown) {
                        const message = err instanceof Error ? err.message : 'An unknown error occurred';
                        toast.error('Sanitize failed: ' + message);
                      }
                    }}
                    className="bg-[#5a5a40] hover:bg-[#3f3f37] text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
                  >
                    Sync & Sanitize
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-[#5a5a40] mb-2 px-1">
              Google Spreadsheet ID
            </label>
            <div className="relative group">
              <input
                type="text"
                value={tempSpreadsheetId}
                onChange={e => setTempSpreadsheetId(e.target.value)}
                placeholder="Enter Spreadsheet ID"
                className="w-full bg-[#f5f5f0] border-2 border-[#e5e1d8] rounded-xl px-5 py-4 font-sans text-base outline-none focus:border-[#c5b358] transition-all"
              />
              <div className="mt-2 text-xs text-[#5a5a40]/60 italic px-1">
                This ID determines which Google Sheet the app syncs with.
                Changes require a manual "Pull from Sheets" to take effect.
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={() => {
                setSpreadsheetId(tempSpreadsheetId);
                setIsSettingsOpen(false);
                toast.promise(handleSyncWithSheets(false), {
                  loading: 'Syncing with Google Sheets...',
                  success: 'Sync complete',
                  error: 'Sync failed — changes saved locally',
                });
              }}
              className="flex-1 bg-[#5a5a40] hover:bg-[#3f3f37] text-white py-3 rounded-xl font-bold font-sans uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Save className="w-4 h-4" />
              Save & Sync Now
            </button>
            <button
              id="settings-cancel-btn"
              onClick={() => setIsSettingsOpen(false)}
              className="flex-1 bg-[#e5e1d8] hover:bg-[#d4cfc1] text-[#2c2c26] py-3 rounded-xl font-bold font-sans uppercase tracking-widest text-xs transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
