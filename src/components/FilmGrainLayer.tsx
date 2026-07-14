import React, { useId } from 'react';

interface FilmGrainLayerProps {
  zIndex: number;
  opacity: number;
  scrollDuration: number; // in seconds
  variant?: 'normal' | 'rage' | 'death';
}

export const FilmGrainLayer: React.FC<FilmGrainLayerProps> = ({
  zIndex,
  opacity,
  scrollDuration,
  variant = 'normal',
}) => {
  const rawId = useId();
  // Strip colons to make it a valid HTML/SVG identifier without escaping issues
  const id = `grain-filter-${rawId.replace(/:/g, '')}`;

  const animationName =
    variant === 'rage'
      ? 'cinematic-grainScroll-rage'
      : variant === 'death'
      ? 'cinematic-grainScroll-death'
      : 'cinematic-grainScroll';

  const svgString = [
    'url("data:image/svg+xml,%3Csvg',
    " viewBox='0 0 256 256'",
    " xmlns='http://www.w3.org/2000/svg'%3E",
    `%3Cfilter id='${id}'%3E`,
    '%3CfeTurbulence type=\'fractalNoise\'',
    " baseFrequency='0.9'",
    " numOctaves='4'",
    " stitchTiles='stitch'/%3E",
    '%3C/filter%3E',
    `%3Crect width='100%25' height='100%25'`,
    ` filter='url(%23${id})'/%3E`,
    '%3C/svg%3E")',
  ].join('');

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: '-10%',
        zIndex,
        opacity,
        pointerEvents: 'none',
        animation: `${animationName} ${scrollDuration}s steps(1) infinite`,
        backgroundImage: svgString,
        backgroundRepeat: 'repeat',
        backgroundSize: '256px 256px',
      }}
    />
  );
};
