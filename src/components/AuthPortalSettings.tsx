// src/components/AuthPortalSettings.tsx

import { LogIn } from 'lucide-react';

interface AuthPortalSettingsProps {
  isGoogleConnected: boolean;
  handleSignIn: () => void;
  handleSignOutWithClear: () => void;
  showAdvancedAuth: boolean;
  setShowAdvancedAuth: (val: boolean) => void;
  manualToken: string;
  setManualTokenState: (val: string) => void;
  handleApplyManualToken: () => void;
}

export function AuthPortalSettings({
  isGoogleConnected,
  handleSignIn,
  handleSignOutWithClear,
  showAdvancedAuth,
  setShowAdvancedAuth,
  manualToken,
  setManualTokenState,
  handleApplyManualToken,
}: AuthPortalSettingsProps) {
  return (
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
            onClick={handleSignIn}
            className="w-full bg-[#c5b358] hover:bg-[#b09f4d] text-white py-3 px-4 rounded-full text-xs font-bold uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Sign In with Google
          </button>
        ) : (
          <button
            onClick={handleSignOutWithClear}
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
            <div className="mt-3 p-4 bg-[#f5f5f0] border-2 border-dashed border-[#c5b358]/50 rounded-xl space-y-3 animate-fade-in">
              <p className="text-[11px] text-[#5a5a40] uppercase font-bold text-center">Manual Refresh Token Input</p>
              <input
                type="password"
                value={manualToken}
                onChange={e => setManualTokenState(e.target.value)}
                placeholder="Paste google refresh token..."
                className="w-full bg-white border border-[#e5e1d8] rounded-xl px-3 py-2.5 text-xs font-mono outline-none focus:border-[#c5b358]"
              />
              <button
                onClick={handleApplyManualToken}
                className="w-full bg-[#5a5a40] text-white py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Apply Token
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
