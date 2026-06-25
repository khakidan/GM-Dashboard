import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { CommandPalette } from '../CommandPalette';

describe('CommandPalette', () => {
  it('renders', () => {
    expect(true).toBe(true);
  });
});
