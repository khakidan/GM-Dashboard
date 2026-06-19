import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { InitiativeOverlay } from '../InitiativeOverlay';

describe('InitiativeOverlay', () => {
  afterEach(() => {
    cleanup();
  });

  it('id="initiative-overlay" is present with fixed position', () => {
    const { container } = render(<InitiativeOverlay />);
    const overlay = container.querySelector('#initiative-overlay');
    expect(overlay).not.toBeNull();
    expect((overlay as HTMLElement)?.style.position).toBe('fixed');
  });

  it('At least one video element is present', () => {
    const { container } = render(<InitiativeOverlay />);
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
  });

  it('At least one style tag with @keyframes is present', () => {
    const { container } = render(<InitiativeOverlay />);
    const styleTags = container.querySelectorAll('style');
    expect(styleTags.length).toBeGreaterThanOrEqual(1);
    
    let hasKeyframes = false;
    styleTags.forEach(tag => {
      if (tag.textContent?.includes('@keyframes')) {
        hasKeyframes = true;
      }
    });
    expect(hasKeyframes).toBe(true);
  });

  it('id="initiative-overlay-title" is present in the rendered output', () => {
    const { container } = render(<InitiativeOverlay />);
    const title = container.querySelector('#initiative-overlay-title');
    expect(title).not.toBeNull();
  });
});
