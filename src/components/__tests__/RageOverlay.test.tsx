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
    render(<RageOverlay characterName="Bjorn the Unbroken" />);
    expect(screen.queryByText('Bjorn the Unbroken')).not.toBeNull();
  });

  it('is assigned id="rage-overlay" and has position fixed', () => {
    render(<RageOverlay characterName="Bjorn" />);
    const container = screen.getByText('Bjorn').closest('#rage-overlay') as HTMLElement;
    expect(container).not.toBeNull();
    expect(container.style.position).toBe('fixed');
  });

  it('has id="rage-overlay-name" for character name', () => {
    render(<RageOverlay characterName="Bjorn" />);
    const nameEl = screen.getByText('Bjorn');
    expect(nameEl.id).toBe('rage-overlay-name');
  });

  it('has id="rage-overlay-tagline" that shows "Enters Rage"', () => {
    render(<RageOverlay characterName="Bjorn" />);
    const tagline = screen.getByText('Enters Rage');
    expect(tagline).not.toBeNull();
    expect(tagline.id).toBe('rage-overlay-tagline');
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
