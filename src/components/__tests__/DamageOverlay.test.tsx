import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { DamageOverlay } from '../DamageOverlay';

// Mock play and catch for Video element
beforeAll(() => {
  HTMLMediaElement.prototype.play = function() {
    return Promise.resolve();
  };
});

afterEach(() => {
  cleanup();
});

describe('DamageOverlay', () => {
  it('renders without crashing given combatantNames and damageAmount props', () => {
    const { container } = render(
      <DamageOverlay combatantNames={["Thorin Ironforge"]} damageAmount={47} />
    );
    expect(container).toBeDefined();
  });

  it('id="damage-overlay" is present with fixed position', () => {
    const { container } = render(
      <DamageOverlay combatantNames={["Thorin Ironforge"]} damageAmount={47} />
    );
    const element = container.querySelector('#damage-overlay') as HTMLElement;
    expect(element).not.toBeNull();
    expect(element.style.position).toBe('fixed');
  });

  it('id="damage-overlay-amount" shows the damage number with a minus sign', () => {
    const { container } = render(
      <DamageOverlay combatantNames={["Thorin Ironforge"]} damageAmount={47} />
    );
    const amountEl = container.querySelector('#damage-overlay-amount') as HTMLElement;
    expect(amountEl).not.toBeNull();
    expect(amountEl.textContent).toContain('-47');
  });

  it('id="damage-overlay-name" shows the combatant name correctly for one name', () => {
    const { container } = render(
      <DamageOverlay combatantNames={["Drogar"]} damageAmount={47} />
    );
    const nameEl = container.querySelector('#damage-overlay-name') as HTMLElement;
    expect(nameEl).not.toBeNull();
    expect(nameEl.textContent).toContain('Drogar took damage');
  });

  it('id="damage-overlay-name" shows the combatant name correctly for two names', () => {
    const { container } = render(
      <DamageOverlay combatantNames={["Drogar", "Druin"]} damageAmount={47} />
    );
    const nameEl = container.querySelector('#damage-overlay-name') as HTMLElement;
    expect(nameEl).not.toBeNull();
    expect(nameEl.textContent).toContain('Drogar and Druin took damage');
  });

  it('id="damage-overlay-name" shows the combatant name correctly for three names', () => {
    const { container } = render(
      <DamageOverlay combatantNames={["Drogar", "Druin", "Maeve"]} damageAmount={47} />
    );
    const nameEl = container.querySelector('#damage-overlay-name') as HTMLElement;
    expect(nameEl).not.toBeNull();
    expect(nameEl.textContent).toContain('Drogar, Druin, and Maeve took damage');
  });

  it('id="damage-overlay-type" shows the damage type capitalized if damageType is defined', () => {
    const { container } = render(
      <DamageOverlay combatantNames={["Drogar"]} damageAmount={47} damageType="slashing" />
    );
    const typeEl = container.querySelector('#damage-overlay-type') as HTMLElement;
    expect(typeEl).not.toBeNull();
    expect(typeEl.textContent).toContain('Slashing');
  });

  it('id="damage-overlay-type" is not rendered if damageType is undefined', () => {
    const { container } = render(
      <DamageOverlay combatantNames={["Drogar"]} damageAmount={47} />
    );
    const typeEl = container.querySelector('#damage-overlay-type') as HTMLElement;
    expect(typeEl).toBeNull();
  });

  it('at least one video element is present', () => {
    const { container } = render(
      <DamageOverlay combatantNames={["Thorin Ironforge"]} damageAmount={47} />
    );
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
  });

  it('at least one style tag with @keyframes is present', () => {
    const { container } = render(
      <DamageOverlay combatantNames={["Thorin Ironforge"]} damageAmount={47} />
    );
    const styleTag = container.querySelector('style');
    expect(styleTag).not.toBeNull();
    expect(styleTag?.textContent).toContain('@keyframes');
  });
});
