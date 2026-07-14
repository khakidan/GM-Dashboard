import { ANIMATION_TIMING } from '../lib/constants';
import React from 'react';
import { useCinematicVideo } from './ActiveEncounterTab/hooks/useCinematicVideo';
import { FilmGrainLayer } from './FilmGrainLayer';

interface DeathOverlayProps {
  characterName: string;
}

const STYLES = `
  @keyframes dof-screenTilt {
    0%   { transform: rotate(0deg) scale(1.0); }
    100% { transform: rotate(-2.5deg) scale(1.06); }
  }
  @keyframes dof-redPulse {
    0%, 100% { opacity: 0.55; }
    50%       { opacity: 0.85; }
  }
  @keyframes dof-nameReveal {
    0%   { 
      opacity: 0; 
      transform: translateY(18px); 
      letter-spacing: 0.35em; 
    }
    100% { 
      opacity: 1; 
      transform: translateY(0); 
      letter-spacing: 0.08em; 
    }
  }
  @keyframes dof-taglineReveal {
    0%   { opacity: 0; transform: scaleX(0.3); }
    100% { opacity: 1; transform: scaleX(1); }
  }


  /* Specific overrides to prevent global theme stylesheet rules from overriding cinematic headings */
  #death-overlay h1#death-overlay-character-name {
    color: #ffffff !important;
    font-family: Georgia, "Times New Roman", serif !important;
    letter-spacing: 0.08em !important;
    text-shadow: 
      0 0 30px rgba(180, 0, 0, 0.95),
      0 0 80px rgba(100, 0, 0, 0.6),
      0 3px 8px rgba(0, 0, 0, 0.99) !important;
  }
  #death-overlay p#death-overlay-tagline {
    color: #ffffff !important;
    font-family: "Helvetica Neue", Arial, sans-serif !important;
    letter-spacing: 0.55em !important;
    text-shadow: 0 0 16px rgba(200, 0, 0, 0.8) !important;
  }
`;

export function DeathOverlay({ characterName }: DeathOverlayProps) {
  const videoRef = useCinematicVideo([characterName]);

  return (
    <div
      id="death-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflow: 'hidden',
        animation: [
          'cinematic-overlayIn 120ms ease-out forwards',
          `cinematic-overlayOut ${ANIMATION_TIMING.deathExitDuration}ms ease-in ${ANIMATION_TIMING.deathExit}ms forwards`,
        ].join(', '),
      }}
    >
      <style>{STYLES}</style>

      {/* === WORLD DESATURATION LAYER ===
          backdrop-filter desaturates and darkens everything 
          underneath — this is the core "you are dying" 
          visual that games use */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          backdropFilter: 'grayscale(85%) brightness(0.45) blur(1px)',
          WebkitBackdropFilter: 'grayscale(85%) brightness(0.45) blur(1px)',
          backgroundColor: 'rgba(6, 2, 2, 0.55)',
        }}
      />

      {/* === SLOW SCREEN TILT ===
          The entire visible content tilts slowly as if 
          the character is collapsing — 10 second duration 
          matches the overlay length */}
      <div
        style={{
          position: 'absolute',
          inset: '-5%',
          zIndex: 2,
          animation: 'dof-screenTilt 10s ease-in forwards',
          transformOrigin: 'center center',
        }}
      >

        {/* === BLOOD VIDEO LAYER ===
            mix-blend-mode: screen removes all black pixels 
            from the video, leaving only the blood visible.
            The video plays once and holds on its last frame */}
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
            opacity: 0.92,
          }}
        >
          <source src="/assets/death-impact.webm" type="video/webm" />
          <source src="/assets/death-impact.mp4"  type="video/mp4" />
        </video>

        {/* === RED VIGNETTE EDGES ===
            Pulses every 1.8s — suggests the character's 
            heartbeat slowing */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            background: [
              'radial-gradient(',
              '  ellipse at 50% 50%,',
              '  transparent 38%,',
              '  rgba(120, 0, 0, 0.55) 72%,',
              '  rgba(60, 0, 0, 0.88) 100%',
              ')',
            ].join(''),
            animation: 'dof-redPulse 1.8s ease-in-out 0.8s infinite',
          }}
        />

        {/* === FILM GRAIN LAYER ===
            SVG feTurbulence noise animated — adds the 
            cinematic grain texture that games bake in */}
        <FilmGrainLayer zIndex={3} opacity={0.08} scrollDuration={0.18} variant="death" />

        {/* === CHARACTER NAME ===
            Fades in at 600ms. Heavy serif typography,
            red glow — minimal, weighted, cinematic */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              opacity: 0,
              animation: 'dof-nameReveal 700ms cubic-bezier(0.16,1,0.3,1) 600ms forwards',
            }}
          >
            <h1
              id="death-overlay-character-name"
              style={{
                margin: 0,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
                fontWeight: 'bold',
                color: '#ffffff',
                letterSpacing: '0.08em',
                lineHeight: 1,
                textShadow: [
                  '0 0 30px rgba(180, 0, 0, 0.95)',
                  '0 0 80px rgba(100, 0, 0, 0.6)',
                  '0 3px 8px rgba(0, 0, 0, 0.99)',
                ].join(', '),
              }}
            >
              {characterName}
            </h1>

            <p
              id="death-overlay-tagline"
              style={{
                margin: '16px 0 0 0',
                fontFamily:
                  '"Helvetica Neue", Arial, sans-serif',
                fontSize: 'clamp(1rem, 2vw, 1.4rem)',
                fontWeight: 900,
                letterSpacing: '0.55em',
                color: '#ffffff',
                textTransform: 'uppercase',
                textShadow: '0 0 16px rgba(200, 0, 0, 0.8)',
                opacity: 0,
                animation:
                  'dof-taglineReveal 800ms ease-out 1100ms forwards',
              }}
            >
              HAS FALLEN
            </p>
          </div>
        </div>

      </div>
      {/* end screen tilt wrapper */}

    </div>
  );
}
