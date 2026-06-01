// src/components/SettingsPage.tsx

import { useState } from 'react';
import { Settings, LogIn, Save, RefreshCw, Trash2, Skull, Zap, Heart, Moon, Flame, Dice6 } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import {
  getSpreadsheetId,
  setSpreadsheetId,
} from '../services/sheetsService';
import {
  setManualRefreshToken,
} from '../services/googleAuth';
import { syncAndSanitizeDatabase } from '../services/dbOperations';
import { useCombatSync } from './ActiveEncounterTab/hooks/useCombatSync';
import { useAppState } from '../hooks/useAppState';

interface SettingsPageProps {
  isGoogleConnected: boolean;
  handleSignIn: () => void;
  handleSignOut: () => void;
  setIsGoogleConnected: (val: boolean) => void;
  handleSyncWithSheets: (isManual?: boolean) => Promise<void>;
  addLog: (msg: string) => void;
}

export function SettingsPage({
  isGoogleConnected,
  handleSignIn,
  handleSignOut,
  setIsGoogleConnected,
  handleSyncWithSheets,
  addLog,
}: SettingsPageProps) {
  const [tempSpreadsheetId, setTempSpreadsheetId] = useState(getSpreadsheetId());
  const [manualToken, setManualTokenState] = useState('');
  const [showAdvancedAuth, setShowAdvancedAuth] = useState(false);
  const [soundsEnabled, setSoundsEnabled] = useState(() => {
    if (typeof window === 'undefined' || !window.localStorage) return true;
    return window.localStorage.getItem('gm_sounds_enabled') !== 'false';
  });
  const { theme, setTheme } = useTheme();
  const { fireDeathEvent, fireDamageEvent, fireHealEvent, fireUnconsciousEvent, fireRageEvent } = useCombatSync();
  const { updateState } = useAppState();

  const handleSaveSpreadsheet = () => {
    setSpreadsheetId(tempSpreadsheetId);
    toast.promise(handleSyncWithSheets(false), {
      loading: 'Syncing with Google Sheets...',
      success: 'Sync complete',
      error: 'Sync failed — changes saved locally',
    });
  };

  return (
    <div className="space-y-8" id="settings-standalone-container">
      {/* Settings Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#e5e1d8] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#c5b358]" />
            <h2 className="text-xl font-bold text-[#2c2c26] font-serif uppercase tracking-wider">Campaign & App Settings</h2>
          </div>
          <p className="text-sm text-[#5a5a40] mt-1 font-sans">
            Customize your visual theme suite, manage Google Sheets connectivity database synchronization, and optimize resources.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns filled with Core Adjustments */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Visual Suite Section */}
          <div className="bg-white p-6 rounded-2xl border border-[#e5e1d8] shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold text-[#2c2c26] font-serif pb-1">Visual Suite Styles</h3>
              <p className="text-xs text-[#5a5a40]">
                Choose one polished visual preset to instantly transform layout elements, typography pairings, borders, and interactive micro-animations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="visual-style-switcher-grid">
              <button
                id="theme-btn-default"
                type="button"
                onClick={() => setTheme('default')}
                className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  theme === 'default'
                    ? 'border-[#c5b358] bg-[#f5f5f0] shadow-sm font-semibold ring-2 ring-[#c5b358]/20'
                    : 'border-[#e5e1d8] bg-stone-50/50 hover:bg-stone-50'
                }`}
              >
                <div>
                  <div className="text-sm font-bold font-sans text-stone-900">Style 1: Default</div>
                  <div className="text-xs text-[#5a5a40]/80 mt-1">Classic golden parchment layout</div>
                </div>
                {theme === 'default' && <div className="w-3 h-3 rounded-full bg-[#c5b358]" />}
              </button>

              <button
                id="theme-btn-dnd"
                type="button"
                onClick={() => setTheme('dnd')}
                className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  theme === 'dnd'
                    ? 'border-amber-700 bg-amber-100 shadow-sm font-semibold ring-2 ring-amber-700/20'
                    : 'border-[#e5e1d8] bg-stone-50/50 hover:bg-stone-50'
                }`}
              >
                <div>
                  <div className="text-sm font-bold font-serif text-amber-900">Classic D&D Adventure</div>
                  <div className="text-xs text-amber-700 mt-1">Warm leather & medieval gold</div>
                </div>
                {theme === 'dnd' && <div className="w-3 h-3 rounded-full bg-amber-700" />}
              </button>

              <button
                id="theme-btn-sleek-modern"
                type="button"
                onClick={() => setTheme('sleek-modern')}
                className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  theme === 'sleek-modern'
                    ? 'border-indigo-600 bg-indigo-50 shadow-sm font-semibold ring-2 ring-indigo-600/20'
                    : 'border-[#e5e1d8] bg-stone-50/50 hover:bg-stone-50'
                }`}
              >
                <div>
                  <div className="text-sm font-bold font-sans text-indigo-950">Minimalist Sleek</div>
                  <div className="text-xs text-indigo-800 mt-1">Sleek styling and modern interfaces</div>
                </div>
                {theme === 'sleek-modern' && <div className="w-3 h-3 rounded-full bg-indigo-600" />}
              </button>
            </div>
          </div>

          {/* Audio & Ambient Sounds Section */}
          <div className="bg-white p-6 rounded-2xl border border-[#e5e1d8] shadow-sm space-y-4" id="audio-settings-card">
            <div>
              <h3 className="text-lg font-bold text-[#2c2c26] font-serif pb-1">Audio & Ambient Sounds</h3>
              <p className="text-xs text-[#5a5a40]">
                Toggle procedural synthesized sound effects for damage, healing, turn changes, and death saves.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-[#e5e1d8] bg-stone-50/50">
              <div>
                <div id="sound-effects-toggle-label" className="text-sm font-bold font-sans text-stone-900">Sound Effects</div>
                <div className="text-xs text-[#5a5a40]/80 mt-1">Enable procedural Web Audio cues</div>
              </div>
              <button
                id="sound-effects-toggle-btn"
                type="button"
                onClick={() => {
                  const currentSec = localStorage.getItem('gm_sounds_enabled') !== 'false';
                  const nextVal = !currentSec;
                  localStorage.setItem('gm_sounds_enabled', nextVal ? 'true' : 'false');
                  setSoundsEnabled(nextVal);
                  toast.success(`Sound effects ${nextVal ? 'enabled' : 'disabled'}`);
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  soundsEnabled ? 'bg-[#c5b358]' : 'bg-stone-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    soundsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Database & ID Management */}
          <div className="bg-white p-6 rounded-2xl border border-[#e5e1d8] shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold text-[#2c2c26] font-serif pb-1">Google Spreadsheet Connection</h3>
              <p className="text-xs text-[#5a5a40]">
                Link your active campaign database with a remote Google Spreadsheet for persistent real-time campaign states.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-widest font-bold text-[#5a5a40] px-1">
                  Google Spreadsheet ID
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={tempSpreadsheetId}
                    onChange={e => setTempSpreadsheetId(e.target.value)}
                    placeholder="Enter Spreadsheet ID"
                    className="flex-1 bg-[#f5f5f0] border-2 border-[#e5e1d8] rounded-xl px-5 py-3 font-sans text-sm outline-none focus:border-[#c5b358] transition-all"
                  />
                  <button
                    onClick={handleSaveSpreadsheet}
                    className="bg-[#5a5a40] hover:bg-[#3f3f37] text-white px-6 py-3 rounded-xl font-bold font-sans uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Save ID
                  </button>
                </div>
                <p className="text-[11px] text-[#5a5a40]/60 italic px-1">
                  This ID links directly with your Sheets workspace. Save updates to trigger immediate schema alignment checks.
                </p>
              </div>

              {isGoogleConnected && (
                <div className="border-t border-[#e5e1d8] pt-4 mt-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#f5f5f0] border border-[#e5e1d8] rounded-2xl p-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#2c2c26] mb-1">Database Maintenance</h4>
                      <p className="text-[11px] text-[#5a5a40]">
                        Runs a sanitization job to secure proper IDs and clear empty/broken sheet values.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        const conf = confirm('Run Sync & Sanitize? This will clean up empty rows and sync entities.');
                        if (!conf) return;
                        try {
                          addLog('Starting Sync & Sanitize...');
                          const deletedCount = await syncAndSanitizeDatabase();
                          addLog(`Sanitize complete. Cleaned up ${deletedCount} rows.`);
                          toast.success(`Sanitize complete. Cleaned up ${deletedCount} rows.`);
                          await handleSyncWithSheets(false);
                        } catch (err: unknown) {
                          const msg = err instanceof Error ? err.message : 'An error occurred';
                          toast.error('Db Sanitize Failed: ' + msg);
                        }
                      }}
                      className="bg-[#5a5a40] hover:bg-[#3f3f37] text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Sanitize DB
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar containing Authorization Settings */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#e5e1d8] shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-[#2c2c26] font-serif border-b border-[#e5e1d8] pb-2">
              Authentication Portal
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#f5f5f0] border-2 border-[#e5e1d8] space-y-3">
                <div className="text-xs font-bold uppercase tracking-widest text-[#2c2c26]">
                  Connection State
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isGoogleConnected ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="text-sm font-bold font-sans">
                    {isGoogleConnected ? 'Connected to Google' : 'Offline / Local-Only'}
                  </span>
                </div>
                <p className="text-xs text-[#5a5a40] leading-relaxed">
                  {isGoogleConnected
                    ? 'Google sync is live! All changes in your roster, library and encounters will automatically sync.'
                    : 'Log in to securely store, share or retrieve active sheets data in real-time.'}
                </p>
              </div>

              {!isGoogleConnected ? (
                <button
                  onClick={async () => {
                    try {
                      handleSignIn();
                    } catch (err: unknown) {
                      const msg = err instanceof Error ? err.message : 'Login failed';
                      toast.error(`Login error: ${msg}`);
                    }
                  }}
                  className="w-full bg-[#c5b358] hover:bg-[#b09f4d] text-white py-3 px-4 rounded-full text-xs font-bold uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In with Google
                </button>
              ) : (
                <button
                  onClick={handleSignOut}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3 px-4 rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer border border-red-200"
                >
                  Disconnect Account
                </button>
              )}

              <div className="pt-2">
                <button
                  onClick={() => setShowAdvancedAuth(!showAdvancedAuth)}
                  className="w-full text-center text-xs font-bold text-[#c5b358] hover:underline uppercase tracking-wider"
                >
                  {showAdvancedAuth ? 'Hide Manual Sync' : 'Configure Manual Token'}
                </button>

                {showAdvancedAuth && (
                  <div className="mt-3 p-4 bg-[#f5f5f0] border-2 border-dashed border-[#c5b358]/50 rounded-xl space-y-3">
                    <p className="text-[11px] text-[#5a5a40] uppercase font-bold text-center">Manual Refresh Token Input</p>
                    <input
                      type="password"
                      value={manualToken}
                      onChange={e => setManualTokenState(e.target.value)}
                      placeholder="Paste google refresh token..."
                      className="w-full bg-white border border-[#e5e1d8] rounded-xl px-3 py-2.5 text-xs font-mono outline-none focus:border-[#c5b358]"
                    />
                    <button
                      onClick={() => {
                        if (manualToken.trim()) {
                          try {
                            setManualRefreshToken(manualToken.trim());
                            setIsGoogleConnected(true);
                            toast.success('Refresh Token Saved!');
                            setManualTokenState('');
                            setShowAdvancedAuth(false);
                            handleSyncWithSheets(false);
                          } catch (err: unknown) {
                            const msg = err instanceof Error ? err.message : 'Failed to apply';
                            toast.error(msg);
                          }
                        }
                      }}
                      className="w-full bg-[#5a5a40] text-white py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Apply Token
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GM Tools & Testing Section */}
      <div className="bg-white p-6 rounded-2xl border border-[#e5e1d8] shadow-sm space-y-4" id="gm-tools-testing-section">
        <div>
          <h3 className="text-lg font-bold text-[#2c2c26] font-serif pb-1">GM Tools & Testing</h3>
          <p className="text-xs text-[#5a5a40]">
            Utility actions for testing presentation effects and validating active overlays.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            id="test-death-animation-btn"
            type="button"
            onClick={() => {
              fireDeathEvent('Aldric the Brave');
              toast('Death animation triggered', {
                description: 'Check the Player View to see the overlay.',
                duration: 3000,
              });
            }}
            className="border border-[#e5e1d8] hover:bg-[#fcfbf9] text-[#5a5a40] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Skull className="w-4 h-4" />
            Test Death Animation
          </button>

          <button
            id="test-damage-animation-btn"
            type="button"
            onClick={() => {
              fireDamageEvent('Thorin Ironforge', 47);
              toast('Damage animation triggered — check the Player View.', {
                duration: 3000,
              });
            }}
            className="border border-[#e5e1d8] hover:bg-[#fcfbf9] text-[#5a5a40] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Test Damage Animation
          </button>

          <button
            id="test-heal-animation-btn"
            type="button"
            onClick={() => {
              if (fireHealEvent) {
                fireHealEvent('Seraphina Brightwell', 34);
              }
              toast('Heal animation triggered — check the Player View.', {
                duration: 3000,
              });
            }}
            className="border border-[#eef5e6] bg-[#f8fbf5] hover:bg-[#f2f8ec] text-[#2e5a2c] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Heart className="w-4 h-4" />
            Test Heal Animation
          </button>

          <button
            id="test-unconscious-animation-btn"
            type="button"
            onClick={() => {
              if (fireUnconsciousEvent) {
                fireUnconsciousEvent('Gareth of Stonehaven');
              }
              toast('Unconscious animation triggered — check the Player View.', {
                duration: 3000,
              });
            }}
            className="border border-[#e2e8f0] bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#475569] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Moon className="w-4 h-4" />
            Test Unconscious Animation
          </button>

          <button
            id="test-rage-animation-btn"
            type="button"
            onClick={() => {
              if (fireRageEvent) {
                fireRageEvent('Bjorn the Unbroken');
              }
              toast('Rage animation triggered — check the Player View.', {
                duration: 3000,
              });
            }}
            className="border border-[#ffcdce] bg-[#fff5f5] hover:bg-[#ffeded] text-[#9b2c2c] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Flame className="w-4 h-4" />
            Test Rage Animation
          </button>

          <button
            id="test-initiative-animation-btn"
            type="button"
            onClick={() => {
              updateState(prev => ({
                ...prev,
                combatState: {
                  ...prev.combatState,
                  initiativeEvent: true,
                }
              }));

              setTimeout(() => {
                updateState(prev => ({
                  ...prev,
                  combatState: {
                    ...prev.combatState,
                    initiativeEvent: false,
                  }
                }));
              }, 8500);

              toast('Initiative animation triggered — check the Player View.');
            }}
            className="border border-amber-300 bg-amber-50/50 hover:bg-amber-100 text-amber-700 font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Dice6 className="w-4 h-4" />
            Test Initiative Animation
          </button>
        </div>
      </div>
    </div>
  );
}
