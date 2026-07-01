// src/hooks/useGoogleAuth.ts

import { useState, useEffect } from 'react';
import {
  initGoogleAuth,
  hasToken,
  signInWithRedirect,
  clearTokens,
  signInWithToken,
} from '../services/googleAuth';

interface UseGoogleAuthProps {
  onLog?: (msg: string) => void;
  onAuthSuccess?: () => Promise<void>;
}

export function useGoogleAuth(props?: UseGoogleAuthProps) {
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  useEffect(() => {
    let mounted = true;
    initGoogleAuth()
      .then(() => {
        if (mounted) {
          const connected = hasToken();
          setIsGoogleConnected(connected);
          if (connected) {
            props?.onLog?.('Checking connection to Google Sheets...');
            if (props?.onAuthSuccess) {
              props.onAuthSuccess().catch(() => {
                props?.onLog?.("Background sync skipped. Click 'Pull from Sheets' when ready.");
              });
            }
          } else {
            props?.onLog?.("Welcome! Click 'Connect & Sync' to link your Google account.");
          }
        }
      })
      .catch(() => {
        props?.onLog?.('Authentication module could not be initialized.');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSignIn = () => {
    signInWithRedirect();
  };

  const handleSignOut = () => {
    clearTokens();
    setIsGoogleConnected(false);
    props?.onLog?.('Signed out of Google Account.');
  };

  return {
    isGoogleConnected,
    setIsGoogleConnected,
    handleSignIn,
    handleSignOut,
    signInWithRedirect,
    signInWithToken,
    hasToken,
    clearTokens,
  };
}
