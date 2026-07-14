import { ANIMATION_TIMING } from '../lib/constants';
  import React from 'react';
  import { useCinematicVideo } from './ActiveEncounterTab/hooks/useCinematicVideo';
  import { formatNames } from '../lib/stringUtils';
  import { FilmGrainLayer } from './FilmGrainLayer';

  interface HealOverlayProps {
    combatantNames: string[];
    healAmount: number;
  }

  const STYLES = `
    @keyframes heal-bloom {
      0%   { 
        opacity: 0;
        transform: scale(0.92);
        filter: brightness(0.8);
      }
      25%  { 
        opacity: 1;
        transform: scale(1.03);
        filter: brightness(1.3);
      }
      55%  { 
        transform: scale(1.0);
        filter: brightness(1.0);
      }
      100% { 
        opacity: 1;
        transform: scale(1.0);
        filter: brightness(1.0);
      }
    }
    @keyframes heal-numberRise {
      0%   { 
        opacity: 0; 
        transform: scale(0.5) translateY(30px);
        filter: blur(6px);
      }
      40%  { 
        opacity: 1; 
        transform: scale(1.1) translateY(-4px);
        filter: blur(0);
      }
      60%  { transform: scale(0.97) translateY(0); }
      80%  { transform: scale(1.02); }
      100% { 
        opacity: 1; 
        transform: scale(1.0) translateY(0);
      }
    }
    @keyframes heal-nameIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes heal-greenFlash {
      0%   { opacity: 0; }
      18%  { opacity: 0.3; }
      100% { opacity: 0; }
    }
    @keyframes heal-pulseGlow {
      0%, 100% { opacity: 0.5; }
      50%       { opacity: 0.8; }
    }

  `;

  export function HealOverlay({ 
    combatantNames, 
    healAmount 
  }: HealOverlayProps) {
    const videoRef = useCinematicVideo([combatantNames, healAmount]);

    return (
      <div
        id="heal-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9996,
          overflow: 'hidden',
          pointerEvents: 'none',
          animation: [
            'cinematic-overlayIn 120ms ease-out forwards',
            `heal-overlayOut ${ANIMATION_TIMING.healExitDuration}ms ease-in ${ANIMATION_TIMING.healExit}ms forwards`,
          ].join(', '),
        }}
      >
        <style>{STYLES}</style>

        {/* Brightening layer — opposite of damage 
            which darkens. Healing brightens the world
            slightly with a warm tint */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            backdropFilter: 
              'brightness(1.08) saturate(1.15)',
            WebkitBackdropFilter: 
              'brightness(1.08) saturate(1.15)',
            backgroundColor: 'rgba(0, 8, 2, 0.28)',
          }}
        />

        {/* Bloom wrapper — gentle scale pulse 
            instead of violent shake */}
        <div
          style={{
            position: 'absolute',
            inset: '-3%',
            zIndex: 2,
            animation: 
              'heal-bloom 600ms ease-out 60ms forwards',
          }}
        >

          {/* Green flash at impact */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              backgroundColor: '#003a10',
              opacity: 0,
              animation: 
                'heal-greenFlash 400ms ease-out 60ms forwards',
            }}
          />

          {/* Heal video layer */}
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
              zIndex: 2,
              opacity: 0.9,
            }}
          >
            <source 
              src="/assets/heal-impact.webm" 
              type="video/webm" 
            />
            <source 
              src="/assets/heal-impact.mp4" 
              type="video/mp4" 
            />
          </video>

          {/* Green vignette edges — pulses softly */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 3,
              background: [
                'radial-gradient(',
                'ellipse at 50% 50%,',
                'transparent 40%,',
                'rgba(0,60,20,0.35) 72%,',
                'rgba(0,30,8,0.65) 100%)',
              ].join(' '),
              animation: 
                'heal-pulseGlow 1.6s ease-in-out 0.5s infinite',
            }}
          />

          {/* Film grain */}
          <FilmGrainLayer zIndex={4} opacity={0.05} scrollDuration={0.15} variant="normal" />

          {/* Heal number + name */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            {/* Big heal number with + prefix */}
            <div
              id="heal-overlay-amount"
              style={{
                fontFamily: 
                  'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(4rem, 12vw, 8rem)',
                fontWeight: 'bold',
                color: '#ffffff',
                lineHeight: 1,
                textShadow: [
                  '0 0 40px rgba(0, 220, 80, 1)',
                  '0 0 100px rgba(0, 140, 40, 0.85)',
                  '0 4px 12px rgba(0, 0, 0, 1)',
                ].join(', '),
                opacity: 0,
                animation: 
                  'heal-numberRise 500ms cubic-bezier(0.16,1,0.3,1) 100ms forwards',
              }}
            >
              +{healAmount}
            </div>

            {/* Combatant name */}
            <div
              id="heal-overlay-name"
              style={{
                fontFamily: 
                  '"Helvetica Neue", Arial, sans-serif',
                fontSize: 'clamp(1rem, 2vw, 1.4rem)',
                fontWeight: 700,
                letterSpacing: '0.55em',
                color: '#ffffff',
                textTransform: 'uppercase',
                textShadow: '0 0 16px rgba(0, 150, 40, 0.8)', // Note: fixing shadow color from red to green
                opacity: 0,
                animation: 
                  'heal-nameIn 400ms ease-out 380ms forwards',
              }}
            >
              {formatNames(combatantNames)} {combatantNames.length === 1 ? 'was' : 'were'} healed
            </div>
          </div>

        </div>
      </div>
    );
  }
