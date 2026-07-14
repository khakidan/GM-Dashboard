import { ANIMATION_TIMING } from '../lib/constants';
  import React from 'react';
  import { useCinematicVideo } from './ActiveEncounterTab/hooks/useCinematicVideo';
  import { FilmGrainLayer } from './FilmGrainLayer';

  interface RageOverlayProps {
    characterName: string;
  }

  const STYLES = `
    @keyframes rage-violentShake {
      0%   { transform: translate(0,0) rotate(0deg); }
      4%   { transform: translate(-14px,-8px) rotate(-1.2deg); }
      8%   { transform: translate(14px,10px) rotate(1.2deg); }
      12%  { transform: translate(-12px,6px) rotate(-0.9deg); }
      16%  { transform: translate(11px,-7px) rotate(0.9deg); }
      20%  { transform: translate(-9px,8px) rotate(-0.7deg); }
      24%  { transform: translate(9px,-6px) rotate(0.7deg); }
      30%  { transform: translate(-6px,5px) rotate(-0.5deg); }
      36%  { transform: translate(6px,-4px) rotate(0.5deg); }
      44%  { transform: translate(-4px,3px) rotate(-0.3deg); }
      54%  { transform: translate(3px,-3px) rotate(0.3deg); }
      66%  { transform: translate(-2px,2px) rotate(-0.15deg); }
      80%  { transform: translate(2px,-1px) rotate(0.1deg); }
      100% { transform: translate(0,0) rotate(0deg); }
    }
    @keyframes rage-redWash {
      0%   { opacity: 0; }
      12%  { opacity: 0.7; }
      25%  { opacity: 0.4; }
      38%  { opacity: 0.65; }
      52%  { opacity: 0.35; }
      68%  { opacity: 0.55; }
      100% { opacity: 0.25; }
    }
    @keyframes rage-vignettePulse {
      0%,100% { opacity: 0.7; transform: scale(1.0); }
      25%      { opacity: 1.0; transform: scale(1.02); }
      50%      { opacity: 0.75; transform: scale(1.0); }
      75%      { opacity: 0.95; transform: scale(1.01); }
    }
    @keyframes rage-nameSlam {
      0%   { 
        opacity: 0;
        transform: scale(3.5) rotate(-4deg);
        filter: blur(12px);
        color: #ff0000;
      }
      20%  { 
        opacity: 1;
        transform: scale(1.06) rotate(-0.5deg);
        filter: blur(0);
        color: #ff2200;
      }
      35%  { transform: scale(0.97) rotate(0.3deg); }
      50%  { transform: scale(1.02) rotate(0deg); }
      100% { 
        opacity: 1;
        transform: scale(1.0) rotate(0deg);
        color: #ffffff;
      }
    }
    @keyframes rage-taglineIn {
      0%   { opacity: 0; transform: scaleX(0.2) scaleY(2.0); }
      50%  { transform: scaleX(1.08) scaleY(0.95); }
      100% { opacity: 1; transform: scaleX(1.0) scaleY(1.0); }
    }


    /* Specific overrides to prevent global theme stylesheet rules from overriding cinematic headings */
    #rage-overlay h1#rage-overlay-name {
      color: #ffffff !important;
      font-family: Georgia, "Times New Roman", serif !important;
      text-shadow: 
        0 0 40px rgba(255, 40, 0, 1),
        0 0 100px rgba(180, 0, 0, 0.9),
        0 4px 12px rgba(0, 0, 0, 1) !important;
    }
    #rage-overlay p#rage-overlay-tagline {
      color: #ffffff !important;
      font-family: "Helvetica Neue", Arial, sans-serif !important;
      text-shadow: 0 0 20px rgba(255, 60, 0, 0.95) !important;
    }
  `;

  export function RageOverlay({ 
    characterName 
  }: RageOverlayProps) {
    const videoRef = useCinematicVideo([characterName]);

    return (
      <div
        id="rage-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9995,
          overflow: 'hidden',
          pointerEvents: 'none',
          animation: [
            'cinematic-overlayIn 60ms ease-out forwards',
            `cinematic-overlayOut ${ANIMATION_TIMING.rageExitDuration}ms ease-in ${ANIMATION_TIMING.rageExit}ms forwards`,
          ].join(', '),
        }}
      >
        <style>{STYLES}</style>

        {/* Heavy red desaturation — the world turns 
            red with rage */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            backdropFilter: 
              'grayscale(60%) brightness(0.6) sepia(0.4)',
            WebkitBackdropFilter: 
              'grayscale(60%) brightness(0.6) sepia(0.4)',
            backgroundColor: 'rgba(20, 0, 0, 0.5)',
          }}
        />

        {/* Pulsing red wash — multiple flashes */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            backgroundColor: '#7a0000',
            opacity: 0,
            animation: 
              'rage-redWash 5s ease-out 60ms forwards',
          }}
        />

        {/* Violent shake wrapper — decays over 5s */}
        <div
          style={{
            position: 'absolute',
            inset: '-5%',
            zIndex: 3,
            animation: 
              'rage-violentShake 800ms ease-out 60ms forwards',
          }}
        >

          {/* Rage video — crimson/orange energy */}
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
              zIndex: 1,
              opacity: 0.95,
            }}
          >
            <source 
              src="/assets/rage-impact.webm" 
              type="video/webm" 
            />
            <source 
              src="/assets/rage-impact.mp4"  
              type="video/mp4" 
            />
          </video>

          {/* Aggressive red vignette that pulses */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 2,
              background: [
                'radial-gradient(',
                'ellipse at 50% 50%,',
                'transparent 25%,',
                'rgba(140,0,0,0.55) 65%,',
                'rgba(60,0,0,0.92) 100%)',
              ].join(' '),
              animation: 
                'rage-vignettePulse 0.9s ease-in-out 0.4s infinite',
            }}
          />

          {/* Film grain — faster cycle for frantic feel */}
          <FilmGrainLayer zIndex={3} opacity={0.09} scrollDuration={0.12} variant="rage" />

          {/* Text — name slams in with violent scale */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              pointerEvents: 'none',
            }}
          >
            <h1
              id="rage-overlay-name"
              style={{
                margin: 0,
                fontFamily: 
                  'Georgia, "Times New Roman", serif',
                fontSize: 
                  'clamp(2.4rem, 5.5vw, 3.8rem)',
                fontWeight: 'bold',
                color: '#ffffff',
                letterSpacing: '0.06em',
                lineHeight: 1,
                textShadow: [
                  '0 0 40px rgba(255, 40, 0, 1)',
                  '0 0 100px rgba(180, 0, 0, 0.9)',
                  '0 4px 12px rgba(0, 0, 0, 1)',
                ].join(', '),
                opacity: 0,
                animation: 
                  'rage-nameSlam 500ms cubic-bezier(0.16,1,0.3,1) 80ms forwards',
              }}
            >
              {characterName}
            </h1>

            <p
              id="rage-overlay-tagline"
              style={{
                margin: 0,
                fontFamily: 
                  '"Helvetica Neue", Arial, sans-serif',
                fontSize: 
                  'clamp(1rem, 2vw, 1.4rem)',
                fontWeight: 900,
                letterSpacing: '0.55em',
                color: '#ffffff',
                textTransform: 'uppercase',
                textShadow: '0 0 16px rgba(200, 0, 0, 0.8)',
                opacity: 0,
                animation: 
                  'rage-taglineIn 400ms cubic-bezier(0.34,1.4,0.64,1) 480ms forwards',
              }}
            >
              Would Like to Rage
            </p>
          </div>

        </div>
      </div>
    );
  }
