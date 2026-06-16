import { HashRouter, Routes, Route } from 'react-router-dom';
import { GMDashboard } from './components/GMDashboard';
import { PlayerView } from './components/PlayerView';
import { AuthRelay } from './components/AuthRelay';
import { checkAndCaptureToken } from './services/googleAuth';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { useAppState } from './hooks/useAppState';
import { DeathOverlay } from './components/DeathOverlay';
import { DamageOverlay } from './components/DamageOverlay';
import { HealOverlay } from './components/HealOverlay';
import { UnconsciousOverlay } from './components/UnconsciousOverlay';
import { RageOverlay } from './components/RageOverlay';
import { InitiativeOverlay } from './components/InitiativeOverlay';
import { CommandPalette } from './components/CommandPalette';
import {
  initAudio,
  playDamageSound,
  playHealSound,
  playDeathSound,
  playUnconsciousSound,
  playRageSound,
} from './lib/audioEngine';

function AppContent() {
  const { theme } = useTheme();
  const { state } = useAppState();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Initialize Web Audio API on first user interaction (click)
  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleInteraction);
    };
    document.addEventListener('click', handleInteraction);
    return () => {
      document.removeEventListener('click', handleInteraction);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const deathEvent = state.combatState.deathEvent;
  const damageEvent = state.combatState.damageEvent;
  const healEvent = state.combatState.healEvent;
  const unconsciousEvent = state.combatState.unconsciousEvent;
  const rageEvent = state.combatState.rageEvent;
  const initiativeEvent = state.combatState.initiativeEvent;

  // Audio trigger effects using primitive values to prevent infinite renders or object reference mismatches
  const damageEventKey = damageEvent ? `${damageEvent.combatantNames.join(',')}-${damageEvent.damageAmount}` : '';
  useEffect(() => {
    if (damageEventKey) {
      playDamageSound();
    }
  }, [damageEventKey]);

  const healEventKey = healEvent ? `${healEvent.combatantNames.join(',')}-${healEvent.healAmount}` : '';
  useEffect(() => {
    if (healEventKey) {
      playHealSound();
    }
  }, [healEventKey]);

  const deathEventKey = deathEvent ? deathEvent.characterName : '';
  useEffect(() => {
    if (deathEventKey) {
      playDeathSound();
    }
  }, [deathEventKey]);

  const unconsciousEventKey = unconsciousEvent ? unconsciousEvent.characterName : '';
  useEffect(() => {
    if (unconsciousEventKey) {
      playUnconsciousSound();
    }
  }, [unconsciousEventKey]);

  const rageEventKey = rageEvent ? rageEvent.characterName : '';
  useEffect(() => {
    if (rageEventKey) {
      playRageSound();
    }
  }, [rageEventKey]);

  return (
    <div id="root-theme-wrapper" data-theme={theme} className="w-full min-h-[100dvh] flex flex-col transition-colors duration-300">
      {deathEvent && (
        <DeathOverlay characterName={deathEvent.characterName} />
      )}
      {unconsciousEvent && !deathEvent && (
        <UnconsciousOverlay
          characterName={unconsciousEvent.characterName}
        />
      )}
      {damageEvent && !deathEvent && !unconsciousEvent && (
        <DamageOverlay
          combatantNames={damageEvent.combatantNames}
          damageAmount={damageEvent.damageAmount}
          damageType={damageEvent.damageType}
        />
      )}
      {healEvent && !deathEvent && !unconsciousEvent && !damageEvent && (
        <HealOverlay
          combatantNames={healEvent.combatantNames}
          healAmount={healEvent.healAmount}
        />
      )}
      {rageEvent && !deathEvent && !unconsciousEvent && !damageEvent && !healEvent && (
        <RageOverlay
          characterName={rageEvent.characterName}
        />
      )}
      {initiativeEvent && 
       !deathEvent && 
       !unconsciousEvent && 
       !damageEvent && 
       !healEvent && 
       !rageEvent && (
        <InitiativeOverlay />
      )}
      <HashRouter>
        <Routes>
          <Route path="/" element={<GMDashboard />} />
          <Route path="/player-view" element={<PlayerView />} />
          <Route path="/auth-relay" element={<AuthRelay />} />
        </Routes>
      </HashRouter>
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </div>
  );
}

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
    <ThemeProvider>
      <Toaster position="top-center" richColors />
      <AppContent />
    </ThemeProvider>
  );
}

