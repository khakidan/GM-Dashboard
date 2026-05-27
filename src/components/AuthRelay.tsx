import { useState, useEffect } from 'react';
import { Copy, Check, LogIn, AlertCircle, Info, RefreshCcw } from 'lucide-react';
import { signInWithRedirect, signInWithToken } from '../services/googleAuth';

export function AuthRelay() {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  const redirectUri = window.location.origin;

  useEffect(() => {
    const checkTokens = () => {
      const savedToken = localStorage.getItem('GM_GOOGLE_ACCESS_TOKEN');
      const savedRefresh = localStorage.getItem('GM_GOOGLE_REFRESH_TOKEN');
      
      let found = false;
      if (savedToken) {
        setToken(savedToken);
        found = true;
      }
      if (savedRefresh) {
        setRefreshToken(savedRefresh);
        found = true;
      }
      return found;
    };

    // Check immediately
    if (checkTokens()) return;

    // Set up polling interval as a fallback for redirect timing
    const interval = setInterval(() => {
      if (checkTokens()) {
        clearInterval(interval);
      }
    }, 500);

    // Also listen for storage events (if multiple tabs are used)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'GM_GOOGLE_ACCESS_TOKEN' && e.newValue) {
        setToken(e.newValue);
      }
      if (e.key === 'GM_GOOGLE_REFRESH_TOKEN' && e.newValue) {
        setRefreshToken(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('GM_GOOGLE_ACCESS_TOKEN');
    localStorage.removeItem('GM_GOOGLE_REFRESH_TOKEN');
    setToken(null);
    setRefreshToken(null);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#2c2c26] flex items-center justify-center p-6 text-center">
        <div className="bg-[#fdfaf5] p-8 rounded-3xl shadow-2xl max-w-lg w-full border border-[#c5b358]/30">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-[#c5b358]/10 rounded-full flex items-center justify-center">
               <RefreshCcw className="w-8 h-8 text-[#c5b358]" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-[#2c2c26] mb-2 font-serif uppercase tracking-tight">Sync Authentication</h1>
          <p className="text-sm text-[#5a5a40] mb-8 font-sans">Connect your Google Sheets campaign to the web hub.</p>
          
          <div className="space-y-6">
            <div className="p-6 bg-white border-2 border-[#c5b358]/20 rounded-2xl text-left bg-gradient-to-br from-white to-[#fdfaf5]">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-6 h-6 bg-[#c5b358] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">!</div>
                 <h3 className="font-bold text-[#2c2c26] text-xs uppercase tracking-widest">Configuration</h3>
              </div>
              <p className="text-[11px] text-[#5a5a40] mb-6 leading-relaxed">
                For persistent login, ensure <code>VITE_GOOGLE_CLIENT_SECRET</code> is set in your AI Studio Secrets. This allows you to stay synced indefinitely.
              </p>
              
              <button 
                onClick={() => signInWithRedirect()}
                className="w-full bg-[#c5b358] text-white px-8 py-5 rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-xl hover:bg-[#b09f4d] transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <LogIn className="w-4 h-4" />
                Sign In with Google
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex gap-3 text-left">
               <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
               <p className="text-[10px] text-blue-800 leading-snug">
                 <strong>Privacy Note:</strong> This will request "Offline Access" so the app can refresh your token in the background. We never see your password.
               </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-black/5">
            <button 
              onClick={() => setShowTroubleshooting(!showTroubleshooting)}
              className="text-[10px] uppercase font-bold text-[#5a5a40] hover:underline opacity-60 flex items-center gap-1 mx-auto"
            >
              <AlertCircle className="w-3 h-3" />
              Troubleshooting Login Issues
            </button>
            
            {showTroubleshooting && (
              <div className="mt-6 text-left p-6 bg-[#2c2c26] rounded-2xl text-white/90 text-[11px] space-y-5 shadow-inner">
                <div>
                   <p className="font-bold text-[#c5b358] mb-1 uppercase tracking-widest text-[9px]">1. Authorized Redirect URI</p>
                   <p className="opacity-70 mb-2 leading-relaxed">Copy this URI and ensure it is in your Google Cloud "Authorized redirect URIs" list:</p>
                   <code className="bg-black/30 p-2 rounded block break-all font-mono text-[10px] select-all border border-white/10 text-green-400">
                     {redirectUri}
                   </code>
                </div>
                <div>
                   <p className="font-bold text-[#c5b358] mb-1 uppercase tracking-widest text-[9px]">2. Missing Refresh Token?</p>
                   <p className="opacity-70 leading-relaxed">If you log in but don't get a persistent code, visit <a href="https://myaccount.google.com/permissions" target="_blank" className="underline text-blue-300">Google Account Permissions</a>, remove this app's access, then <strong>sign in again</strong> here.</p>
                </div>
                <div>
                  <p className="font-bold text-[#c5b358] mb-1 uppercase tracking-widest text-[9px]">3. 400: redirect_uri_mismatch</p>
                  <p className="opacity-70 leading-relaxed">Check that the URI above matches the one in your Google Console <strong>exactly</strong>, including the protocol (https) and any trailing slashes.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2c2c26] flex items-center justify-center p-6">
      <div className="bg-[#fdfaf5] p-8 rounded-3xl shadow-2xl max-w-xl w-full border-2 border-[#c5b358]">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-[#c5b358] rounded-full flex items-center justify-center text-white shadow-inner">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2c2c26] font-serif uppercase tracking-tight">Login Successful!</h1>
            <p className="text-xs text-[#5a5a40] uppercase tracking-widest font-bold opacity-60">Here are your persistence codes</p>
          </div>
        </div>

        <div className="space-y-6">
          {refreshToken ? (
            <div className="p-6 bg-green-50 border-2 border-green-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-green-800 font-bold uppercase tracking-wider">
                  Persistent Sync Code (Refresh Token):
                </p>
                <div className="bg-green-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">Permanent</div>
              </div>
              <p className="text-[10px] text-green-700 leading-tight mb-3">
                This token is saved in your browser and used to refresh your session automatically.
              </p>
              
              <div className="relative">
                <textarea 
                  readOnly
                  value={refreshToken}
                  className="w-full h-24 bg-white border border-green-200 rounded-xl p-4 text-[11px] font-mono text-green-900 break-all focus:ring-2 focus:ring-green-500/20 outline-none resize-none shadow-inner"
                />
                <button 
                  onClick={() => handleCopy(refreshToken)}
                  className="absolute top-3 right-3 bg-green-700 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-green-800 transition-all shadow-lg active:scale-95"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied!" : "Copy Refresh Token"}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl shadow-sm">
               <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-[11px] text-red-800 font-bold uppercase tracking-wider">
                    Persistence ERROR
                  </p>
               </div>
               <p className="text-[10px] text-red-700 leading-relaxed mb-4">
                 Google did not return a <strong>Refresh Token</strong>. This happens if you have logged in before. Your access will expire in <strong>1 hour</strong>.
               </p>
               <div className="p-4 bg-white/50 rounded-xl border border-red-100 flex flex-col gap-3">
                  <p className="text-[9px] text-[#5a5a40] uppercase font-bold">To fix this permanently:</p>
                  <ol className="text-[10px] text-[#5a5a40] space-y-2 list-decimal pl-4">
                    <li>Go to <a href="https://myaccount.google.com/permissions" target="_blank" className="underline font-bold text-red-600">Google Permissions</a></li>
                    <li>Find this application and <strong>Remove Access</strong></li>
                    <li>Return here and click <strong>"Sign In Again"</strong></li>
                  </ol>
                  <button 
                    onClick={handleLogout}
                    className="mt-2 w-full bg-red-600 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-md hover:bg-red-700"
                  >
                    Sign Out & Try Again
                  </button>
               </div>
            </div>
          )}

          <div className="p-6 bg-[#f5f5f0] border-2 border-[#e5e1d8] rounded-2xl opacity-80">
            <p className="text-[11px] text-[#2c2c26] font-bold uppercase tracking-wider mb-2 opacity-70">
              Temporary Code (Access Token):
            </p>
            
            <div className="relative group">
              <textarea 
                readOnly
                value={token || ''}
                className="w-full h-24 bg-white border border-[#e5e1d8] rounded-xl p-4 text-[11px] font-mono text-[#5a5a40] break-all focus:ring-2 focus:ring-[#c5b358]/20 outline-none resize-none shadow-inner"
              />
              <button 
                onClick={() => handleCopy(token || '')}
                className="absolute top-3 right-3 bg-[#2c2c26] text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                Copy Temporary Code
              </button>
            </div>
          </div>

          <div className="flex gap-3 text-left bg-[#c5b358]/10 p-4 rounded-xl border border-[#c5b358]/20">
             <div className="w-6 h-6 bg-[#c5b358] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">?</div>
             <p className="text-[11px] text-[#5a5a40] leading-snug">
               Everything is set up. Your campaign data will now stay in sync between this web hub and your Google Sheets.
             </p>
          </div>

          <div className="mt-8 pt-6 border-t border-black/5 flex flex-col gap-3">
            <button 
              onClick={handleLogout}
              className="text-[10px] uppercase font-bold text-red-600 hover:underline opacity-80"
            >
              Sign Out & Clear Session
            </button>
            <a href="/#/" className="text-[10px] uppercase font-bold text-[#5a5a40]/60 hover:underline">Return to Dashboard</a>
          </div>
        </div>
      </div>
    </div>
  );
}
