import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { RageOverlay } from '../RageOverlay';

describe('RageOverlay', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders without crashing given a characterName prop', () => {
    const { container } = render(<RageOverlay characterName="Bjorn" />);
    expect(container).toBeDefined();
  });

  it('renders the character name', () => {
    const { container } = render(<RageOverlay characterName="Bjorn the Unbroken" />);
    const nameEl = container.querySelector('#rage-overlay-name');
    expect(nameEl?.textContent).toContain('Bjorn the Unbroken');
  });

  it('is assigned id="rage-overlay" and has position fixed', () => {
    const { container } = render(<RageOverlay characterName="Bjorn" />);
    const overlay = container.querySelector('#rage-overlay') as HTMLElement;
    expect(overlay).not.toBeNull();
    expect(overlay.style.position).toBe('fixed');
  });

  it('has id="rage-overlay-name" for character name', () => {
    const { container } = render(<RageOverlay characterName="Bjorn" />);
    const nameEl = container.querySelector('#rage-overlay-name');
    expect(nameEl).not.toBeNull();
  });

  it('has id="rage-overlay-tagline" that exists', () => {
    const { container } = render(<RageOverlay characterName="Bjorn" />);
    const tagline = container.querySelector('#rage-overlay-tagline');
    expect(tagline).not.toBeNull();
  });

  it('contains at least one video element', () => {
    const { container } = render(<RageOverlay characterName="Bjorn" />);
    const videos = container.querySelectorAll('video');
    expect(videos.length).toBeGreaterThanOrEqual(1);
  });

  it('contains at least one style tag with @keyframes', () => {
    const { container } = render(<RageOverlay characterName="Bjorn" />);
    const styleTags = Array.from(container.querySelectorAll('style'));
    expect(styleTags.length).toBeGreaterThanOrEqual(1);
    const hasKeyframes = styleTags.some(style => style.innerHTML.includes('@keyframes'));
    expect(hasKeyframes).toBe(true);
  });
});
