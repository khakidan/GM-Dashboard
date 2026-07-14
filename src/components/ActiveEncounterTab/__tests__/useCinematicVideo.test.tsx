import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCinematicVideo } from '../hooks/useCinematicVideo';

describe('useCinematicVideo', () => {
  let playSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // JSDOM does not implement HTMLMediaElement.prototype.play, so we must mock it
    window.HTMLMediaElement.prototype.play = vi.fn();
    playSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function TestComponent({ deps }: { deps: React.DependencyList }) {
    const videoRef = useCinematicVideo(deps);
    return <video ref={videoRef} data-testid="video" />;
  }

  it('resets currentTime to 0 and calls play on mount', () => {
    const { getByTestId } = render(<TestComponent deps={['initial']} />);
    const video = getByTestId('video') as HTMLVideoElement;
    
    expect(video.currentTime).toBe(0);
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('catches promise rejection from play()', async () => {
    // Mock rejection to ensure it is caught and doesn't throw an unhandled promise rejection
    playSpy.mockImplementation(() => Promise.reject(new Error('Autoplay blocked')));
    
    // We render the component. If the hook doesn't catch the promise rejection, 
    // it would result in an unhandled rejection, failing the test.
    expect(() => render(<TestComponent deps={[]} />)).not.toThrow();
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('re-fires when deps change but not on unrelated re-renders', () => {
    const { rerender } = render(<TestComponent deps={['initial']} />);
    expect(playSpy).toHaveBeenCalledTimes(1);
    
    // Rerender with same deps
    rerender(<TestComponent deps={['initial']} />);
    expect(playSpy).toHaveBeenCalledTimes(1); // Should not increase
    
    // Rerender with new deps
    rerender(<TestComponent deps={['changed']} />);
    expect(playSpy).toHaveBeenCalledTimes(2); // Should increase
  });
});
