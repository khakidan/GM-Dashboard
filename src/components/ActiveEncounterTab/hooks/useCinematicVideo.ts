import { useEffect, useRef } from 'react';

export function useCinematicVideo(deps: React.DependencyList) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Autoplay blocked — expected/handled
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  
  return videoRef;
}
