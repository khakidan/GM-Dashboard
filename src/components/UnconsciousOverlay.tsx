import { ANIMATION_TIMING } from '../lib/constants';
  import React from 'react';
  import { useCinematicVideo } from './ActiveEncounterTab/hooks/useCinematicVideo';
  import { FilmGrainLayer } from './FilmGrainLayer';

  interface UnconsciousOverlayProps {
    characterName: string;
  }

  const STYLES = `
    @keyframes unc-worldBlur {
      0%   { 
        filter: blur(0px) brightness(1.0);
        transform: scale(1.0) rotate(0deg);
      }
      15%  {
        filter: blur(1px) brightness(1.1);
        transform: scale(1.02) rotate(-0.3deg);
      }
      100% { 
        filter: blur(5px) brightness(0.55);
        transform: scale(1.04) rotate(-1.8deg);
      }
    }
    @keyframes unc-vignetteClose {
      0%   { opacity: 0; }
      20%  { opacity: 0.5; }
      100% { opacity: 0.92; }
    }
    @keyframes unc-nameReveal {
      0%   { 
        opacity: 0;
        transform: translateY(-12px) scale(1.1);
        filter: blur(4px);
      }
      100% { 
        opacity: 1;
        transform: translateY(0) scale(1.0);
        filter: blur(0);
      }
    }
    @keyframes unc-taglineReveal {
      from { opacity: 0; letter-spacing: 0.8em; }
      to   { opacity: 1; letter-spacing: 0.45em; }
    }
    @keyframes unc-whiteFlash {
      0%   { opacity: 0; }
      8%   { opacity: 0.7; }
      100% { opacity: 0; }
    }

    @keyframes unc-heartbeat {
      0%, 100% { opacity: 0.0; transform: scaleX(1.0); }
      5%        { opacity: 1.0; transform: scaleX(1.0); }
      10%       { opacity: 0.6; transform: scaleX(0.98); }
      15%       { opacity: 1.0; transform: scaleX(1.0); }
      20%       { opacity: 0.0; }
    }

    /* Specific overrides to prevent global theme stylesheet rules from overriding cinematic headings */
    #unconscious-overlay h1#unconscious-overlay-name {
      color: #ffffff !important;
      font-family: Georgia, "Times New Roman", serif !important;
      text-shadow: 
        0 0 30px rgba(200, 200, 255, 0.9),
        0 0 80px rgba(120, 120, 200, 0.5),
        0 3px 8px rgba(0, 0, 0, 1) !important;
    }
    #unconscious-overlay p#unconscious-overlay-tagline {
      color: #c8c8ff !important;
      font-family: "Helvetica Neue", Arial, sans-serif !important;
      text-shadow: 0 0 16px rgba(200, 0, 0, 0.8) !important;
    }
  `;

  export function UnconsciousOverlay({ 
    characterName 
  }: UnconsciousOverlayProps) {
    const videoRef = useCinematicVideo([characterName]);

    return (
      <div
        id="unconscious-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          overflow: 'hidden',
          pointerEvents: 'none',
          animation: [
            'cinematic-overlayIn 100ms ease-out forwards',
            `cinematic-overlayOut ${ANIMATION_TIMING.unconsciousExitDuration}ms ease-in ${ANIMATION_TIMING.unconsciousExit}ms forwards`,
          ].join(', '),
        }}
      >
        <style>{STYLES}</style>

        {/* World blur layer — progressively blurs and 
            darkens as consciousness slips away. 
            Much stronger than damage desaturation. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            backdropFilter: 
              'grayscale(100%) brightness(0.35) blur(3px)',
            WebkitBackdropFilter: 
              'grayscale(100%) brightness(0.35) blur(3px)',
            backgroundColor: 'rgba(2, 2, 8, 0.55)',
            animation: 'unc-worldBlur 5s ease-in forwards',
          }}
        />

        {/* Brief white flash — the moment of impact */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            backgroundColor: '#ffffff',
            opacity: 0,
            animation: 
              'unc-whiteFlash 500ms ease-out 60ms forwards',
          }}
        />

        {/* Vignette closing in from edges — 
            gets progressively darker over 5 seconds */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            background: [
              'radial-gradient(',
              'ellipse at 50% 50%,',
              'transparent 20%,',
              'rgba(0,0,0,0.5) 55%,',
              'rgba(0,0,0,0.98) 100%)',
            ].join(' '),
            opacity: 0,
            animation: 
              'unc-vignetteClose 5s ease-in 80ms forwards',
          }}
        />

        {/* Stars / consciousness video layer */}
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
            zIndex: 4,
            opacity: 0.85,
          }}
        >
          <source 
            src="/assets/unconscious-impact.webm" 
            type="video/webm" 
          />
          <source 
            src="/assets/unconscious-impact.mp4" 
            type="video/mp4" 
          />
        </video>

        {/* Film grain */}
        <FilmGrainLayer zIndex={5} opacity={0.07} scrollDuration={0.15} variant="normal" />

        {/* Text content */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            pointerEvents: 'none',
          }}
        >
          {/* Character name */}
          <h1
            id="unconscious-overlay-name"
            style={{
              margin: 0,
              fontFamily: 
                'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
              fontWeight: 'bold',
              color: '#ffffff',
              letterSpacing: '0.08em',
              lineHeight: 1,
              textShadow: [
                '0 0 30px rgba(200, 200, 255, 0.9)',
                '0 0 80px rgba(120, 120, 200, 0.5)',
                '0 3px 8px rgba(0, 0, 0, 1)',
              ].join(', '),
              opacity: 0,
              animation: 
                'unc-nameReveal 600ms cubic-bezier(0.16,1,0.3,1) 200ms forwards',
            }}
          >
            {characterName}
          </h1>

          {/* FALLS UNCONSCIOUS tagline */}
          <p
            id="unconscious-overlay-tagline"
            style={{
              margin: 0,
              fontFamily: 
                '"Helvetica Neue", Arial, sans-serif',
              fontSize: 'clamp(1rem, 2vw, 1.4rem)',
              fontWeight: 900,
              letterSpacing: '0.55em',
              color: '#c8c8ff',
              textTransform: 'uppercase',
              textShadow: '0 0 16px rgba(200, 0, 0, 0.8)',
              opacity: 0,
              animation: 
                'unc-taglineReveal 800ms ease-out 700ms forwards',
            }}
          >
            Falls Unconscious
          </p>

          {/* Flatline heartbeat bar — 
              pulses twice then goes silent */}
          <div
            aria-hidden
            style={{
              marginTop: '8px',
              width: 'clamp(160px, 25vw, 260px)',
              height: '2px',
              backgroundColor: '#c8c8ff',
              opacity: 0,
              animation: 
                'unc-heartbeat 2s ease-out 900ms forwards',
              boxShadow: 
                '0 0 8px rgba(180, 180, 255, 0.8)',
            }}
          />
        </div>

      </div>
    );
  }
