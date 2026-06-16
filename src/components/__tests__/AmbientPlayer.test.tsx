// src/components/__tests__/AmbientPlayer.test.tsx

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { AmbientPlayer } from '../AmbientPlayer';
import { StoredAudioFile } from '../../lib/audioFileStore';

const mockStoredFiles: StoredAudioFile[] = [
  {
    id: 'a-1',
    name: 'Forest Rain',
    fileName: 'forest_rain.mp3',
    blob: new Blob([''], { type: 'audio/mp3' }),
    category: 'ambient',
    addedAt: 100,
  },
  {
    id: 'a-2',
    name: 'Dungeon Ambience',
    fileName: 'dungeon_ambient.mp3',
    blob: new Blob([''], { type: 'audio/mp3' }),
    category: 'ambient',
    addedAt: 200,
  },
  {
    id: 'fx-1',
    name: 'Sword Clash',
    fileName: 'sword_clash.mp3',
    blob: new Blob([''], { type: 'audio/mp3' }),
    category: 'effect',
    addedAt: 300,
  }
];

const defaultProps = {
  currentAmbientId: null,
  isAmbientPlaying: false,
  ambientVolume: 0.7,
  storedFiles: mockStoredFiles,
  playAmbient: vi.fn(),
  stopAmbient: vi.fn(),
  setAmbientVolume: vi.fn(),
  onSwitchTab: vi.fn(),
};

describe('AmbientPlayer', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows empty state when no ambient files', () => {
    render(<AmbientPlayer {...defaultProps} storedFiles={[]} />);
    expect(screen.getByText(/No ambient tracks loaded/)).toBeDefined();
    expect(screen.getByText('Open Library')).toBeDefined();
  });

  it('renders a button/item for each ambient file in storedFiles', () => {
    render(<AmbientPlayer {...defaultProps} />);
    expect(screen.getByText('Forest Rain')).toBeDefined();
    expect(screen.getByText('Dungeon Ambience')).toBeDefined();
    // Should NOT show sound effects
    expect(screen.queryByText('Sword Clash')).toBeNull();
  });

  it('clicking a track calls playAmbient with its fileId', () => {
    const playAmbientMock = vi.fn();
    render(<AmbientPlayer {...defaultProps} playAmbient={playAmbientMock} />);
    
    const trackItem = screen.getByText('Forest Rain');
    fireEvent.click(trackItem);
    
    expect(playAmbientMock).toHaveBeenCalledWith('a-1');
  });

  it('the currently playing track has an active/highlighted state', () => {
    render(
      <AmbientPlayer
        {...defaultProps}
        currentAmbientId="a-1"
        isAmbientPlaying={true}
      />
    );
    
    // Looping status micro-animation should exist
    expect(screen.getByText('LOOPING')).toBeDefined();
  });
});
