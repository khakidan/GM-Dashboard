import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { HealOverlay } from '../HealOverlay';

// Mock play and catch for Video element
beforeAll(() => {
  HTMLMediaElement.prototype.play = function() {
    return Promise.resolve();
  };
});

afterEach(() => {
  cleanup();
});

describe('HealOverlay', () => {
  it('renders without crashing given combatantName and healAmount props', () => {
    const { container } = render(
      <HealOverlay combatantName="Seraphina Brightwell" healAmount={34} />
    );
    expect(container).toBeDefined();
  });

  it('id="heal-overlay" is present with fixed position', () => {
    const { container } = render(
      <HealOverlay combatantName="Seraphina Brightwell" healAmount={34} />
    );
    const element = container.querySelector('#heal-overlay') as HTMLElement;
    expect(element).not.toBeNull();
    expect(element.style.position).toBe('fixed');
  });

  it('id="heal-overlay-amount" shows the heal number with a plus sign', () => {
    const { container } = render(
      <HealOverlay combatantName="Seraphina Brightwell" healAmount={34} />
    );
    const amountEl = container.querySelector('#heal-overlay-amount') as HTMLElement;
    expect(amountEl).not.toBeNull();
    expect(amountEl.textContent).toContain('+34');
  });

  it('id="heal-overlay-name" shows the combatant name', () => {
    const { container } = render(
      <HealOverlay combatantName="Seraphina Brightwell" healAmount={34} />
    );
    const nameEl = container.querySelector('#heal-overlay-name') as HTMLElement;
    expect(nameEl).not.toBeNull();
    expect(nameEl.textContent).toBe('Seraphina Brightwell');
  });

  it('at least one video element is present', () => {
    const { container } = render(
      <HealOverlay combatantName="Seraphina Brightwell" healAmount={34} />
    );
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
  });

  it('at least one style tag with @keyframes is present', () => {
    const { container } = render(
      <HealOverlay combatantName="Seraphina Brightwell" healAmount={34} />
    );
    const styleTag = container.querySelector('style');
    expect(styleTag).not.toBeNull();
    expect(styleTag?.textContent).toContain('@keyframes');
  });
});
