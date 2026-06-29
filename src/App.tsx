import { HashRouter, Routes, Route } from 'react-router-dom';
import { GMDashboard } from './components/GMDashboard';
import { PlayerView } from './components/PlayerView';
import { AuthRelay } from './components/auth/AuthRelay';
import { checkAndCaptureToken } from './services/googleAuth';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { ThemeProvider } from './context/ThemeContext';
import { useAppState } from './hooks/useAppState';
import { DeathOverlay } from './components/DeathOverlay';
import { DamageOverlay } from './components/DamageOverlay';
import { HealOverlay } from './components/HealOverlay';
import { UnconsciousOverlay } from './components/UnconsciousOverlay';
import { RageOverlay } from './components/RageOverlay';
import { InitiativeOverlay } from './components/InitiativeOverlay';
import { useCampaign } from './hooks/useCampaign';
import { CampaignSelector } from './components/CampaignSelector';

function AppContent() {
  const { state } = useAppState();
  const campaignState = useCampaign();

  const deathEvent = state.combatState.deathEvent;
  const damageEvent = state.combatState.damageEvent;
  const healEvent = state.combatState.healEvent;
  const unconsciousEvent = state.combatState.unconsciousEvent;
  const rageEvent = state.combatState.rageEvent;
  const initiativeEvent = state.combatState.initiativeEvent;

  return (
    <div id="root-theme-wrapper" data-theme="sleek-modern" className="w-full min-h-[100dvh] flex flex-col transition-colors duration-300">
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
          <Route path="/" element={
            !campaignState.activeCampaign ? (
              <CampaignSelector
                campaigns={campaignState.campaigns}
                isLoading={campaignState.isLoading}
                error={campaignState.error}
                onCreateCampaign={campaignState.createCampaign}
                onConnectCampaign={campaignState.connectCampaign}
                onOpenCampaign={campaignState.openCampaign}
                onDeleteCampaign={campaignState.deleteCampaign}
                onClearError={campaignState.clearError}
              />
            ) : (
              <GMDashboard
                campaign={campaignState.activeCampaign}
                onCloseCampaign={campaignState.closeCampaign}
              />
            )
          } />
          <Route path="/player-view" element={<PlayerView />} />
          <Route path="/auth-relay" element={<AuthRelay />} />
        </Routes>
      </HashRouter>
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

