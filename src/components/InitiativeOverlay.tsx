import { ANIMATION_TIMING } from '../lib/constants';
import React from 'react';
import { useCinematicVideo } from './ActiveEncounterTab/hooks/useCinematicVideo';
import { FilmGrainLayer } from './FilmGrainLayer';

const STYLES = `
  @keyframes init-epicPulse {
    0%, 100% { 
      opacity: 0.65; 
      transform: scale(1.0); 
    }
    50%      { 
      opacity: 0.9; 
      transform: scale(1.02); 
    }
  }

  @keyframes init-titleReveal {
    0%   {
      opacity: 0;
      transform: scale(0.7) translateY(10px);
      filter: blur(8px);
      letter-spacing: 0.6em;
    }
    40%  {
      opacity: 1;
      transform: scale(1.05) translateY(-2px);
      filter: blur(0px);
      letter-spacing: 0.18em;
    }
    60%  { transform: scale(0.98) translateY(0); }
    100% {
      opacity: 1;
      transform: scale(1.0) translateY(0);
      letter-spacing: 0.18em;
    }
  }

  @keyframes init-shimmer {
    0%, 100% {
      text-shadow:
        0 0 20px rgba(255, 200, 50, 0.9),
        0 0 60px rgba(200, 140, 0, 0.7),
        0 0 120px rgba(150, 80, 0, 0.4),
        0 4px 12px rgba(0, 0, 0, 1);
    }
    50% {
      text-shadow:
        0 0 35px rgba(255, 220, 80, 1),
        0 0 90px rgba(220, 160, 20, 0.9),
        0 0 160px rgba(180, 100, 0, 0.6),
        0 4px 12px rgba(0, 0, 0, 1);
    }
  }

  /* Specific overrides to prevent global theme stylesheet rules from overriding cinematic headings */
  #initiative-overlay h1#initiative-overlay-title {
    color: #ffffff !important;
  }
`;

export function InitiativeOverlay() {
  const videoRef = useCinematicVideo([]);

  return (
    <div
      id="initiative-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9994,
        overflow: 'hidden',
        pointerEvents: 'none',
        animation: [
          'cinematic-overlayIn 150ms ease-out forwards',
          `cinematic-overlayOut ${ANIMATION_TIMING.initiativeExitDuration}ms ease-in ${ANIMATION_TIMING.initiativeExit}ms forwards`,
        ].join(', '),
      }}
    >
      <style>{STYLES}</style>

      {/* Subtle dark base — less heavy than death 
          and unconscious. This is a positive moment
          so we do not fully desaturate the world. 
          Just darken slightly for contrast. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          backdropFilter: 
            'brightness(0.5) saturate(0.7) blur(1px)',
          WebkitBackdropFilter: 
            'brightness(0.5) saturate(0.7) blur(1px)',
          backgroundColor: 'rgba(4, 2, 12, 0.6)',
        }}
      />

      {/* Gold/purple vignette that pulses — 
          epic rather than ominous */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          background: [
            'radial-gradient(',
            'ellipse at 50% 50%,',
            'transparent 30%,',
            'rgba(60,20,100,0.4) 65%,',
            'rgba(20,5,50,0.8) 100%)',
          ].join(' '),
          animation: 
            'init-epicPulse 2s ease-in-out 0.5s infinite',
        }}
      />

      {/* Initiative video — d20 rolling, 
          gold text, purple energy */}
      <video
        ref={videoRef}
        aria-hidden
        muted
        playsInline
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          mixBlendMode: 'screen',
          zIndex: 3,
          opacity: 0.95,
          transform: 'translateZ(0)',
        }}
      >
        <source 
          src="/assets/initiative.webm" 
          type="video/webm" 
        />
        <source 
          src="/assets/initiative.mp4"  
          type="video/mp4" 
        />
      </video>

      {/* Film grain */}
      <FilmGrainLayer zIndex={4} opacity={0.05} scrollDuration={0.15} variant="normal" />

      {/* Cinematic React text layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <h1
          id="initiative-overlay-title"
          style={{
            margin: 0,
            fontFamily: 
              'Georgia, "Palatino Linotype", "Book Antiqua", Palatino, serif',
            fontSize: 'clamp(2rem, 6vw, 4.5rem)',
            fontWeight: 'bold',
            color: '#ffffff',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            textShadow: '0 0 16px rgba(200, 0, 0, 0.8)',
            lineHeight: 1.1,
            textAlign: 'center',
            opacity: 0,
            animation: [
              'init-titleReveal 900ms cubic-bezier(0.16,1,0.3,1) 2200ms forwards',
              'init-shimmer 2s ease-in-out 3200ms infinite',
            ].join(', '),
          }}
        >
          Roll for Initiative
        </h1>
      </div>

    </div>
  );
}
