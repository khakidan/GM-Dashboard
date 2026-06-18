import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, act, cleanup } from '@testing-library/react';
import { AudioLibrary } from '../AudioLibrary';
import { STORAGE_KEYS } from '../../lib/constants';

describe('AudioLibrary', () => {
  const mockAddFiles = vi.fn();
  const mockRemoveFile = vi.fn();
  
  let playMock: ReturnType<typeof vi.fn>;
  let pauseMock: ReturnType<typeof vi.fn>;

  const createMockFile = (name: string, type: string, size = 1024): File => {
    return { name, type, size } as unknown as File;
  };

  const sampleAmbientFile = {
    id: 'f-ambient-1',
    name: 'rain',
    fileName: 'rain.mp3',
    category: 'ambient' as const,
    blob: createMockFile('rain.mp3', 'audio/mpeg', 2048),
    addedAt: 12345,
  };

  const sampleEffectFile = {
    id: 'f-effect-1',
    name: 'sword',
    fileName: 'sword.wav',
    category: 'effect' as const,
    blob: createMockFile('sword.wav', 'audio/wav', 1536),
    addedAt: 12345,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    localStorage.clear();

    // Default URL mock
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    // Default Audio mock
    playMock = vi.fn().mockResolvedValue(undefined);
    pauseMock = vi.fn();
    global.Audio = vi.fn().mockImplementation(function() {
      return {
        play: playMock,
        pause: pauseMock,
      };
    }) as any;
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    cleanup();
  });

  describe('FILE UPLOAD TESTS', () => {
    it('Selecting files via the ambient file input calls addFiles with category "ambient"', async () => {
      const { container } = render(
        <AudioLibrary storedFiles={[]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />
      );

      const ambientInput = container.querySelector('#dropzone-ambient input[type="file"]') as HTMLInputElement;
      expect(ambientInput).not.toBeNull();

      const files = [createMockFile('ambient1.mp3', 'audio/mpeg')];
      fireEvent.change(ambientInput, { target: { files } });

      await act(async () => {});
      expect(mockAddFiles).toHaveBeenCalledWith(files, 'ambient');
    });

    it('Selecting files via the effects file input calls addFiles with category "effect"', async () => {
      const { container } = render(
        <AudioLibrary storedFiles={[]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />
      );

      const effectInput = container.querySelector('#dropzone-effect input[type="file"]') as HTMLInputElement;
      expect(effectInput).not.toBeNull();

      const files = [createMockFile('effect1.wav', 'audio/wav')];
      fireEvent.change(effectInput, { target: { files } });

      await act(async () => {});
      expect(mockAddFiles).toHaveBeenCalledWith(files, 'effect');
    });

    it('The ambient input accept attribute includes .mp3, .wav, .ogg, and .m4a extensions', () => {
      const { container } = render(
        <AudioLibrary storedFiles={[]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />
      );
      const ambientInput = container.querySelector('#dropzone-ambient input[type="file"]') as HTMLInputElement;
      const accept = ambientInput.getAttribute('accept');
      expect(accept).toContain('.mp3');
      expect(accept).toContain('.wav');
      expect(accept).toContain('.ogg');
      expect(accept).toContain('.m4a');
    });

    it('The effects input accept attribute includes the same set of extensions', () => {
      const { container } = render(
        <AudioLibrary storedFiles={[]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />
      );
      const effectInput = container.querySelector('#dropzone-effect input[type="file"]') as HTMLInputElement;
      const accept = effectInput.getAttribute('accept');
      expect(accept).toContain('.mp3');
      expect(accept).toContain('.wav');
      expect(accept).toContain('.ogg');
      expect(accept).toContain('.m4a');
    });
  });

  describe('DRAG AND DROP TESTS', () => {
    it('Dropping audio files on the ambient dropzone calls addFiles with category "ambient"', async () => {
      const { container } = render(
        <AudioLibrary storedFiles={[]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />
      );
      
      const dropzone = container.querySelector('#dropzone-ambient') as HTMLElement;
      expect(dropzone).not.toBeNull();

      const file = createMockFile('some_ambience.mp3', 'audio/mpeg');
      fireEvent.drop(dropzone, {
        dataTransfer: { files: [file] },
      });

      await act(async () => {});
      expect(mockAddFiles).toHaveBeenCalledWith([file], 'ambient');
    });

    it('Dropping audio files on the effects dropzone calls addFiles with category "effect"', async () => {
      const { container } = render(
        <AudioLibrary storedFiles={[]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />
      );
      const dropzone = container.querySelector('#dropzone-effect') as HTMLElement;
      expect(dropzone).not.toBeNull();

      const file = createMockFile('some_effect.wav', 'audio/wav');
      fireEvent.drop(dropzone, {
        dataTransfer: { files: [file] },
      });

      await act(async () => {});
      expect(mockAddFiles).toHaveBeenCalledWith([file], 'effect');
    });

    it('Dropping non-audio files (e.g. a .pdf or .txt file) does NOT call addFiles', async () => {
      const { container } = render(
        <AudioLibrary storedFiles={[]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />
      );
      const dropzone = container.querySelector('#dropzone-ambient') as HTMLElement;
      expect(dropzone).not.toBeNull();

      const filePdf = createMockFile('document.pdf', 'application/pdf');
      const fileTxt = createMockFile('text.txt', 'text/plain');
      fireEvent.drop(dropzone, {
        dataTransfer: { files: [filePdf, fileTxt] },
      });

      await act(async () => {});
      expect(mockAddFiles).not.toHaveBeenCalled();
    });

    it('Dropping files with .m4a extension are accepted and passed to addFiles', async () => {
      const { container } = render(
        <AudioLibrary storedFiles={[]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />
      );
      const dropzone = container.querySelector('#dropzone-ambient') as HTMLElement;
      expect(dropzone).not.toBeNull();

      const file = createMockFile('track.m4a', 'application/octet-stream'); // testing fallback extension logic
      fireEvent.drop(dropzone, {
        dataTransfer: { files: [file] },
      });

      await act(async () => {});
      expect(mockAddFiles).toHaveBeenCalledWith([file], 'ambient');
    });

    it('Dropping files with .ogg extension are accepted and passed to addFiles', async () => {
      const { container } = render(
        <AudioLibrary storedFiles={[]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />
      );
      const dropzone = container.querySelector('#dropzone-effect') as HTMLElement;
      expect(dropzone).not.toBeNull();

      const file = createMockFile('effect.ogg', 'application/octet-stream');
      fireEvent.drop(dropzone, {
        dataTransfer: { files: [file] },
      });

      await act(async () => {});
      expect(mockAddFiles).toHaveBeenCalledWith([file], 'effect');
    });
  });

  describe('FILE LIST DISPLAY TESTS', () => {
    it('Ambient tracks from storedFiles appear in the Ambient Tracks section', () => {
      const { container } = render(
        <AudioLibrary storedFiles={[sampleAmbientFile]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />
      );
      const listAmbient = container.querySelector('#list-ambient');
      expect(listAmbient?.textContent).toContain('rain.mp3');
    });

    it('Effect files from storedFiles appear in the Sound Effects section', () => {
      const { container } = render(
        <AudioLibrary storedFiles={[sampleEffectFile]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />
      );
      const listEffects = container.querySelector('#list-effects');
      expect(listEffects?.textContent).toContain('sword.wav');
    });

    it('Each file entry shows the filename', () => {
      const { container } = render(
        <AudioLibrary storedFiles={[sampleAmbientFile]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />
      );
      expect(container.textContent).toContain('rain.mp3');
    });

    it('Each file entry shows the file size in KB', () => {
      const { container } = render(
        <AudioLibrary storedFiles={[sampleAmbientFile]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />
      );
      // 2048 bytes / 1024 = 2.0 KB
      expect(container.textContent).toContain('2.0 KB');
    });

    it('When no ambient files exist the empty state message is shown', () => {
      const { container } = render(
        <AudioLibrary storedFiles={[]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />
      );
      const listAmbient = container.querySelector('#list-ambient');
      expect(listAmbient?.textContent).toContain('No tracks uploaded yet');
    });

    it('When no effect files exist the empty state message is shown', () => {
      const { container } = render(
        <AudioLibrary storedFiles={[]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />
      );
      const listEffects = container.querySelector('#list-effects');
      expect(listEffects?.textContent).toContain('No effects uploaded yet');
    });
  });

  describe('FILE DELETION TESTS', () => {
    it('Clicking the delete button on a file calls removeFile with that file\'s id', async () => {
      render(<AudioLibrary storedFiles={[sampleAmbientFile]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />);
      const deleteButtons = screen.getAllByTitle('Delete File');
      fireEvent.click(deleteButtons[0]);
      expect(mockRemoveFile).toHaveBeenCalledWith(sampleAmbientFile.id);
    });

    it('When a deleted file\'s id matches a slot in the localStorage soundboard layout, that slot is removed from the layout', async () => {
      const initialLayout = [
        { fileId: sampleEffectFile.id, label: 'Sword', color: '#fff', order: 0 },
        { fileId: 'f-effect-99', label: 'Other', color: '#000', order: 1 }
      ];
      localStorage.setItem(STORAGE_KEYS.soundboardLayout, JSON.stringify(initialLayout));

      render(<AudioLibrary storedFiles={[sampleEffectFile]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />);
      const deleteButtons = screen.getAllByTitle('Delete File');
      
      await act(async () => {
        fireEvent.click(deleteButtons[0]);
      });

      const updatedLayoutStr = localStorage.getItem(STORAGE_KEYS.soundboardLayout);
      const updatedLayout = JSON.parse(updatedLayoutStr!);
      expect(updatedLayout).toHaveLength(1);
      expect(updatedLayout[0].fileId).toBe('f-effect-99');
    });

    it('When a deleted file\'s id does not appear in the soundboard layout, localStorage is not corrupted', async () => {
      const initialLayout = [
        { fileId: 'f-effect-99', label: 'Other', color: '#000', order: 1 }
      ];
      localStorage.setItem(STORAGE_KEYS.soundboardLayout, JSON.stringify(initialLayout));

      render(<AudioLibrary storedFiles={[sampleAmbientFile]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />);
      const deleteButtons = screen.getAllByTitle('Delete File');
      
      await act(async () => {
        fireEvent.click(deleteButtons[0]);
      });

      const updatedLayoutStr = localStorage.getItem(STORAGE_KEYS.soundboardLayout);
      const updatedLayout = JSON.parse(updatedLayoutStr!);
      expect(updatedLayout).toHaveLength(1);
      expect(updatedLayout[0].fileId).toBe('f-effect-99');
    });
  });

  describe('PREVIEW TESTS', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('Clicking the preview button on a file begins playback for that file', () => {
      render(<AudioLibrary storedFiles={[sampleEffectFile]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />);
      const previewButton = screen.getByTitle('Preview 3s');
      
      fireEvent.click(previewButton);

      expect(global.Audio).toHaveBeenCalledWith('blob:mock-url');
      expect(playMock).toHaveBeenCalled();
    });

    it('Clicking the preview button on the currently previewing file stops it', () => {
      render(<AudioLibrary storedFiles={[sampleEffectFile]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />);
      const previewButton = screen.getByTitle('Preview 3s');
      
      fireEvent.click(previewButton);

      fireEvent.click(previewButton);
      expect(pauseMock).toHaveBeenCalled();
    });

    it('Preview automatically stops after 3000ms (use vi.useFakeTimers())', () => {
      render(<AudioLibrary storedFiles={[sampleEffectFile]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />);
      const previewButton = screen.getByTitle('Preview 3s');
      
      fireEvent.click(previewButton);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(pauseMock).toHaveBeenCalled();
    });

    it('After the preview timer fires, previewingFileId is cleared', async () => {
      render(
        <AudioLibrary storedFiles={[sampleEffectFile]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />
      );
      const previewButton = screen.getByTitle('Preview 3s');
      
      await act(async () => {
        fireEvent.click(previewButton);
      });
      expect(previewButton.innerHTML).toContain('lucide-pause'); // Has pause icon when playing

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(previewButton.innerHTML).toContain('lucide-play'); // Reverts to play icon
    });
  });

  describe('INSTRUCTIONS BANNER TESTS', () => {
    it('Instructions banner renders by default when localStorage flag is not set', () => {
      const { container } = render(
        <AudioLibrary storedFiles={[]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />
      );
      const banner = container.querySelector('#library-import-instructions');
      expect(banner).not.toBeNull();
    });

    it('Clicking the dismiss button hides the banner', () => {
      const { container } = render(
        <AudioLibrary storedFiles={[]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />
      );
      const dismissBtn = container.querySelector('#dismiss-instructions-btn') as HTMLButtonElement;
      
      act(() => {
        fireEvent.click(dismissBtn);
      });
      
      const bannerAfter = container.querySelector('#library-import-instructions');
      expect(bannerAfter).toBeNull();
    });

    it('After dismiss, localStorage contains the dismissed flag', () => {
      const { container } = render(
        <AudioLibrary storedFiles={[]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />
      );
      const dismissBtn = container.querySelector('#dismiss-instructions-btn') as HTMLButtonElement;
      
      act(() => {
        fireEvent.click(dismissBtn);
      });

      expect(localStorage.getItem('gm_instructions_dismissed')).toBe('true');
    });

    it('On mount, if the dismissed flag is already in localStorage the banner does not render', () => {
      localStorage.setItem('gm_instructions_dismissed', 'true');
      const { container } = render(
        <AudioLibrary storedFiles={[]} addFiles={mockAddFiles} removeFile={mockRemoveFile} />
      );
      const banner = container.querySelector('#library-import-instructions');
      expect(banner).toBeNull();
    });
  });
});
