import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { UnconsciousOverlay } from '../UnconsciousOverlay';

// Mock play and catch for Video element
beforeAll(() => {
  HTMLMediaElement.prototype.play = function() {
    return Promise.resolve();
  };
});

afterEach(() => {
  cleanup();
});

describe('UnconsciousOverlay', () => {
  it('id="unconscious-overlay" is present with fixed position', () => {
    const { container } = render(
      <UnconsciousOverlay characterName="Gareth of Stonehaven" />
    );
    const element = container.querySelector('#unconscious-overlay') as HTMLElement;
    expect(element).not.toBeNull();
    expect(element.style.position).toBe('fixed');
  });

  it('id="unconscious-overlay-name" shows the character name', () => {
    const { container } = render(
      <UnconsciousOverlay characterName="Gareth of Stonehaven" />
    );
    const nameEl = container.querySelector('#unconscious-overlay-name') as HTMLElement;
    expect(nameEl).not.toBeNull();
    expect(nameEl.textContent).toBe('Gareth of Stonehaven');
  });

  it('id="unconscious-overlay-tagline" exists in the rendered output', () => {
    const { container } = render(
      <UnconsciousOverlay characterName="Gareth of Stonehaven" />
    );
    const taglineEl = container.querySelector('#unconscious-overlay-tagline') as HTMLElement;
    expect(taglineEl).not.toBeNull();
  });

  it('at least one video element is present', () => {
    const { container } = render(
      <UnconsciousOverlay characterName="Gareth of Stonehaven" />
    );
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
  });

  it('at least one style tag with @keyframes is present', () => {
    const { container } = render(
      <UnconsciousOverlay characterName="Gareth of Stonehaven" />
    );
    const styleTag = container.querySelector('style');
    expect(styleTag).not.toBeNull();
    expect(styleTag?.textContent).toContain('@keyframes');
  });
});
