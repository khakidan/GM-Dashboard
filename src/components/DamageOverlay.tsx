import { ANIMATION_TIMING } from '../lib/constants';
import React from 'react';
import { useCinematicVideo } from './ActiveEncounterTab/hooks/useCinematicVideo';
import { formatNames } from '../lib/stringUtils';
import { FilmGrainLayer } from './FilmGrainLayer';

interface DamageOverlayProps {
  combatantNames: string[];
  damageAmount: number;
  damageType?: string;
}

const STYLES = `
  @keyframes dmg-impactShake {
    0%   { transform: translate(0, 0) scale(1.0); }
    6%   { transform: translate(-8px, -4px) scale(1.02); }
    12%  { transform: translate(8px, 5px) scale(1.02); }
    18%  { transform: translate(-6px, 3px) scale(1.01); }
    24%  { transform: translate(5px, -3px) scale(1.01); }
    34%  { transform: translate(-3px, 2px) scale(1.0); }
    45%  { transform: translate(2px, -2px) scale(1.0); }
    60%  { transform: translate(-1px, 1px) scale(1.0); }
    100% { transform: translate(0, 0) scale(1.0); }
  }
  @keyframes dmg-numberSlam {
    0%   { 
      opacity: 0; 
      transform: scale(2.8) translateY(-20px); 
      filter: blur(8px);
    }
    30%  { 
      opacity: 1; 
      transform: scale(1.08) translateY(0); 
      filter: blur(0);
    }
    50%  { transform: scale(0.96); }
    65%  { transform: scale(1.02); }
    100% { 
      opacity: 1; 
      transform: scale(1.0); 
      filter: blur(0);
    }
  }
  @keyframes dmg-nameIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes dmg-redFlash {
    0%   { opacity: 0; }
    20%  { opacity: 0.45; }
    100% { opacity: 0; }
  }

`;

export function DamageOverlay({ 
  combatantNames, 
  damageAmount,
  damageType 
}: DamageOverlayProps) {
  const videoRef = useCinematicVideo([combatantNames, damageAmount, damageType]);

  return (
    <div
      id="damage-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9997,
        overflow: 'hidden',
        pointerEvents: 'none',
        animation: [
          'cinematic-overlayIn 80ms ease-out forwards',
          `cinematic-overlayOut ${ANIMATION_TIMING.damageExitDuration}ms ease-in ${ANIMATION_TIMING.damageExit}ms forwards`,
        ].join(', '),
      }}
    >
      <style>{STYLES}</style>

      {/* Subtle desaturation — less heavy than death */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          backdropFilter: 
            'grayscale(40%) brightness(0.7)',
          WebkitBackdropFilter: 
            'grayscale(40%) brightness(0.7)',
          backgroundColor: 'rgba(4, 0, 0, 0.35)',
        }}
      />

      {/* Quick screen shake then settle */}
      <div
        style={{
          position: 'absolute',
          inset: '-3%',
          zIndex: 2,
          animation: 
            'dmg-impactShake 550ms ease-out 60ms forwards',
        }}
      >

        {/* Red flash at impact */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            backgroundColor: '#6a0000',
            opacity: 0,
            animation: 
              'dmg-redFlash 350ms ease-out 60ms forwards',
          }}
        />

        {/* Impact video layer */}
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
            opacity: 0.88,
          }}
        >
          <source 
            src="/assets/damage-impact.webm" 
            type="video/webm" 
          />
          <source 
            src="/assets/damage-impact.mp4" 
            type="video/mp4" 
          />
        </video>

        {/* Red vignette edges */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            background: [
              'radial-gradient(',
              'ellipse at 50% 50%,',
              'transparent 45%,',
              'rgba(100,0,0,0.45) 75%,',
              'rgba(40,0,0,0.75) 100%)',
            ].join(' '),
          }}
        />

        {/* Film grain */}
        <FilmGrainLayer zIndex={4} opacity={0.06} scrollDuration={0.15} variant="normal" />

        {/* Damage number + name */}
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
          {/* Big damage number */}
          <div
            id="damage-overlay-amount"
            style={{
              fontFamily: 
                'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(4rem, 12vw, 8rem)',
              fontWeight: 'bold',
              color: '#ffffff',
              lineHeight: 1,
              textShadow: [
                '0 0 40px rgba(220, 0, 0, 1)',
                '0 0 100px rgba(140, 0, 0, 0.8)',
                '0 4px 12px rgba(0, 0, 0, 1)',
              ].join(', '),
              opacity: 0,
              animation: 
                'dmg-numberSlam 400ms cubic-bezier(0.16,1,0.3,1) 100ms forwards',
            }}
          >
            -{damageAmount}
          </div>

          {damageType && (
            <div
              id="damage-overlay-type"
              style={{
                fontFamily: 
                  '"Helvetica Neue", Arial, sans-serif',
                fontSize: 'clamp(1.2rem, 3vw, 2rem)',
                fontWeight: 600,
                letterSpacing: '0.15em',
                color: '#e2d6b5', // Muted gold
                textTransform: 'capitalize',
                textShadow: '0 0 16px rgba(200, 0, 0, 0.6)',
                opacity: 0,
                animation: 
                  'dmg-nameIn 400ms ease-out 250ms forwards',
              }}
            >
              {damageType.charAt(0).toUpperCase() + damageType.slice(1)}
            </div>
          )}

          {/* Combatant name */}
          <div
            id="damage-overlay-name"
            style={{
              fontFamily: 
                '"Helvetica Neue", Arial, sans-serif',
              fontSize: 'clamp(1rem, 2vw, 1.4rem)',
              fontWeight: 700,
              letterSpacing: '0.55em',
              color: '#ffffff',
              textTransform: 'uppercase',
              textShadow: '0 0 16px rgba(200, 0, 0, 0.8)',
              opacity: 0,
              animation: 
                'dmg-nameIn 400ms ease-out 380ms forwards',
            }}
          >
            {formatNames(combatantNames)} took damage
          </div>
        </div>

      </div>
    </div>
  );
}
