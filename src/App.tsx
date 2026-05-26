import { HashRouter, Routes, Route } from 'react-router-dom';
import { GMDashboard } from './components/GMDashboard';
import { PlayerView } from './components/PlayerView';
import { AuthRelay } from './components/AuthRelay';
import { checkAndCaptureToken } from './services/sheetsService';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';

export default function App() {
  const [isCapturing, setIsCapturing] = useState(true);

  useEffect(() => {
    const runCapture = async () => {
      await checkAndCaptureToken();
      setIsCapturing(false);
    };
    runCapture();
  }, []);

  if (isCapturing) {
    return (
      <div className="fixed inset-0 bg-[#2c2c26] flex items-center justify-center">
        <div className="text-white font-sans animate-pulse">Authenticating...</div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors />
      <HashRouter>
        <Routes>
          <Route path="/" element={<GMDashboard />} />
          <Route path="/player-view" element={<PlayerView />} />
          <Route path="/auth-relay" element={<AuthRelay />} />
        </Routes>
      </HashRouter>
    </>
  );
}

