import { RefreshCw } from 'lucide-react';

export interface GMLoadingScreenProps {
  isAuthenticated: boolean;
  campaignName: string;
  isSyncing?: boolean;
  onSignIn: () => void;
}

export function GMLoadingScreen({
  isAuthenticated,
  campaignName,
  isSyncing = false,
  onSignIn,
}: GMLoadingScreenProps) {
  return (
    <div className="w-full h-[100dvh] bg-[#0f172a] flex items-center justify-center font-sans tracking-wide">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[#2563eb]">{campaignName || "D&D GM Dashboard"}</h1>
        {(!isAuthenticated && !isSyncing) ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-[#e2e8f0]/70">Connect your Google account to get started.</p>
            <button 
              onClick={onSignIn} 
              className="px-6 py-3 bg-[#2563eb] text-white font-bold uppercase tracking-widest text-xs rounded hover:bg-white transition-colors cursor-pointer"
            >
              Sign In With Google
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-8 h-8 text-[#2563eb] animate-spin" />
            <p className="text-[#e2e8f0]/70 text-xs uppercase font-bold tracking-widest">Loading from Google Sheets...</p>
          </div>
        )}
      </div>
    </div>
  );
}
