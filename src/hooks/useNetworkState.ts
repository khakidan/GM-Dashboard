import { useState, useEffect } from 'react';
import { getQueueSize } from '../services/writeQueue';
import { WRITE_QUEUE } from '../lib/constants';

export function useNetworkState() {
  const [isOnline, setIsOnline] = useState(() => typeof window !== 'undefined' ? window.navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function useQueuedWrites() {
  const [queuedWrites, setQueuedWrites] = useState(0);

  useEffect(() => {
    setQueuedWrites(getQueueSize());

    const interval = setInterval(() => {
      setQueuedWrites(getQueueSize());
    }, WRITE_QUEUE.queuePollIntervalMs);

    return () => clearInterval(interval);
  }, []);

  return queuedWrites;
}
