import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { AudioLibrary } from '../AudioLibrary';

describe('AudioLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds file to uploading state when upload begins and removes after it resolves', async () => {
    let resolveAddFiles: () => void = () => {};
    const addFilesPromise = new Promise<void>((resolve) => {
      resolveAddFiles = resolve;
    });
    const addFilesMock = vi.fn().mockReturnValue(addFilesPromise);
    const removeFileMock = vi.fn();
    render(
      <AudioLibrary
        storedFiles={[]}
        addFiles={addFilesMock}
        removeFile={removeFileMock}
      />
    );
    const user = userEvent.setup();
    const inputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    const ambientInput = inputs[0];
    const file = new File(['audio content'], 'test-track.mp3', { type: 'audio/mp3' });
    
    // Start upload
    await user.upload(ambientInput, file);
    
    // Should show uploading indicator immediately
    expect(await screen.findByText('test-track.mp3')).toBeInTheDocument();
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    expect(addFilesMock).toHaveBeenCalled();
    
    // Resolve the promise to finish upload
    resolveAddFiles();
    
    // Wait for the indicator to be removed
    await waitFor(() => {
      expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
    });
  });

  it('clears the uploading state even if the underlying write throws', async () => {
    const addFilesMock = vi.fn().mockRejectedValue(new Error('Storage quota exceeded'));
    const removeFileMock = vi.fn();
    render(
      <AudioLibrary
        storedFiles={[]}
        addFiles={addFilesMock}
        removeFile={removeFileMock}
      />
    );
    const user = userEvent.setup();
    const inputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    const ambientInput = inputs[0];
    const file = new File(['audio content'], 'fail-track.mp3', { type: 'audio/mp3' });
    
    // Start upload
    await user.upload(ambientInput, file);
    
    // It throws, but it should still clean up the uploading state
    await waitFor(() => {
      expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
    });
  });
});
