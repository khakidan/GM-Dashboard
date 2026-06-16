// src/components/__tests__/AudioPanel.test.tsx

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { AudioPanel } from '../AudioPanel';
import { StoredAudioFile } from '../../lib/audioFileStore';

const mockStoredFiles: StoredAudioFile[] = [
  {
    id: 'f-1',
    name: 'Witch Mountain',
    fileName: 'Witch_Mountain.mp3',
    blob: new Blob([''], { type: 'audio/mp3' }),
    category: 'ambient',
    addedAt: 12345,
  },
  {
    id: 'f-2',
    name: 'Sword Slash',
    fileName: 'Sword_Slash.mp3',
    blob: new Blob([''], { type: 'audio/mp3' }),
    category: 'effect',
    addedAt: 67890,
  }
];

const defaultProps = {
  currentAmbientId: null,
  isAmbientPlaying: false,
  ambientVolume: 0.5,
  effectVolume: 0.5,
  storedFiles: mockStoredFiles,
  playAmbient: vi.fn(),
  stopAmbient: vi.fn(),
  setAmbientVolume: vi.fn(),
  playEffect: vi.fn(),
  setEffectVolume: vi.fn(),
  addFiles: vi.fn(),
  removeFile: vi.fn(),
};

describe('AudioPanel', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders in collapsed state by default', () => {
    render(<AudioPanel {...defaultProps} />);
    
    // Header should be screen visible
    expect(screen.getByText(/AUDIO/)).toBeDefined();
    // Tabs should not be visible as it is collapsed
    expect(screen.queryByText('Ambient')).toBeNull();
  });

  it('shows "No track" when isAmbientPlaying is false', () => {
    render(<AudioPanel {...defaultProps} currentAmbientId={null} isAmbientPlaying={false} />);
    expect(screen.getByText('No track')).toBeDefined();
  });

  it('shows current track name when playing', () => {
    render(<AudioPanel {...defaultProps} currentAmbientId="f-1" isAmbientPlaying={true} />);
    expect(screen.getByText('Witch Mountain')).toBeDefined();
  });

  it('clicking the header toggles expanded state', () => {
    render(<AudioPanel {...defaultProps} />);
    
    // Header click
    const header = screen.getByText(/AUDIO/);
    fireEvent.click(header);
    
    // Tabs should now be visible
    expect(screen.getByText('Ambient')).toBeDefined();
    expect(screen.getByText('Soundboard')).toBeDefined();
    expect(screen.getByText('Library')).toBeDefined();

    // Click header again to collapse
    fireEvent.click(header);
    expect(screen.queryByText('Ambient')).toBeNull();
  });

  it('M key toggles open/closed', () => {
    render(<AudioPanel {...defaultProps} />);
    
    // Initially closed
    expect(screen.queryByText('Ambient')).toBeNull();

    // Fire keydown M
    fireEvent.keyDown(window, { key: 'm', code: 'KeyM' });
    expect(screen.getByText('Ambient')).toBeDefined();

    // Fire keydown M again to close
    fireEvent.keyDown(window, { key: 'M', code: 'KeyM' });
    expect(screen.queryByText('Ambient')).toBeNull();
  });
});
