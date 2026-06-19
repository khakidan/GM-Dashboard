import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { DeathOverlay } from '../DeathOverlay';

describe('DeathOverlay', () => {
  afterEach(() => {
    cleanup();
  });

  it('the character name appears in the rendered output', () => {
    const { container } = render(<DeathOverlay characterName="Legolas" />);
    const nameEl = container.querySelector('#death-overlay-character-name');
    expect(nameEl).not.toBeNull();
    expect(nameEl?.textContent).toBe('Legolas');
  });

  it('id="death-overlay-tagline" exists in the rendered output', () => {
    const { container } = render(<DeathOverlay characterName="Gimli" />);
    const taglineEl = container.querySelector('#death-overlay-tagline');
    expect(taglineEl).not.toBeNull();
  });

  it('the overlay container has position fixed styling', () => {
    const { container } = render(<DeathOverlay characterName="Aragorn" />);
    const overlay = container.querySelector('#death-overlay');
    expect(overlay).not.toBeNull();
    expect((overlay as HTMLElement)?.style.position).toBe('fixed');
  });

  it('a video element is present in the rendered output', () => {
    const { container } = render(<DeathOverlay characterName="Boromir" />);
    const videoElement = container.querySelector('video');
    expect(videoElement).not.toBeNull();
  });

  it('the style tag containing keyframe animations is injected into the component', () => {
    const { container } = render(<DeathOverlay characterName="Frodo" />);
    const styleTags = container.querySelectorAll('style');
    expect(styleTags.length).toBeGreaterThan(0);
    
    let hasKeyframes = false;
    styleTags.forEach(style => {
      const content = style.textContent || '';
      if (
        content.includes('@keyframes') &&
        content.includes('dof-overlayFadeIn') &&
        content.includes('dof-screenTilt') &&
        content.includes('dof-redPulse')
      ) {
        hasKeyframes = true;
      }
    });

    expect(hasKeyframes).toBe(true);
  });

  it('does not contain any element with the old tooth path pattern (e.g. M 172,261)', () => {
    const { container } = render(<DeathOverlay characterName="Boromir" />);
    const paths = container.querySelectorAll('path');
    let foundToothPath = false;
    paths.forEach(path => {
      const d = path.getAttribute('d') || '';
      if (d.startsWith('M 172,261') || d.includes('172,261')) {
        foundToothPath = true;
      }
    });
    expect(foundToothPath).toBe(false);
  });
});
