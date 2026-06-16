// src/hooks/useSettings.ts

import { useState } from 'react';
import { toast } from 'sonner';
import { STORAGE_KEYS } from '../lib/constants';
import { getSpreadsheetId, setSpreadsheetId } from '../services/sheetsService';
import { setManualRefreshToken, clearTokens } from '../services/googleAuth';
import { useAppState } from './useAppState';
import { useTheme } from '../context/ThemeContext';
import {
  useDeathEvent,
  useDamageEvent,
  useHealEvent,
  useUnconsciousEvent,
  useRageEvent,
  useInitiativeEvent,
} from './useOverlayEvents';

interface UseSettingsProps {
  isGoogleConnected: boolean;
  handleSignIn: () => void;
  handleSignOut: () => void;
  setIsGoogleConnected: (val: boolean) => void;
  handleSyncWithSheets: (isManual?: boolean) => Promise<void>;
  addLog: (msg: string) => void;
}

export function useSettings({
  isGoogleConnected,
  handleSignIn,
  handleSignOut,
  setIsGoogleConnected,
  handleSyncWithSheets,
  addLog,
}: UseSettingsProps) {
  const { theme, setTheme } = useTheme();
  const { updateState } = useAppState();

  const { fire: fireDeathEvent } = useDeathEvent();
  const { fire: fireDamageEvent } = useDamageEvent();
  const { fire: fireHealEvent } = useHealEvent();
  const { fire: fireUnconsciousEvent } = useUnconsciousEvent();
  const { fire: fireRageEvent } = useRageEvent();
  const { fire: fireInitiativeEvent } = useInitiativeEvent();

  const [tempSpreadsheetId, setTempSpreadsheetId] = useState(() => getSpreadsheetId());
  const [manualToken, setManualTokenState] = useState('');
  const [showAdvancedAuth, setShowAdvancedAuth] = useState(false);

  // Sound enabled preference
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    if (typeof window === 'undefined' || !window.localStorage) return true;
    return window.localStorage.getItem(STORAGE_KEYS.soundsEnabled) !== 'false';
  });

  const toggleSound = () => {
    const nextVal = !isSoundEnabled;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEYS.soundsEnabled, nextVal ? 'true' : 'false');
    }
    setIsSoundEnabled(nextVal);
    toast.success(`Sound effects ${nextVal ? 'enabled' : 'disabled'}`);
  };

  const handleSaveSpreadsheet = async () => {
    setSpreadsheetId(tempSpreadsheetId);
    toast.promise(handleSyncWithSheets(false), {
      loading: 'Syncing with Google Sheets...',
      success: 'Sync complete',
      error: 'Sync failed — changes saved locally',
    });
  };

  const handleApplyManualToken = async () => {
    if (!manualToken.trim()) return;
    try {
      setManualRefreshToken(manualToken.trim());
      setIsGoogleConnected(true);
      toast.success('Refresh Token Saved!');
      setManualTokenState('');
      setShowAdvancedAuth(false);
      await handleSyncWithSheets(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to apply';
      toast.error(msg);
    }
  };

  const handleSignOutWithClear = () => {
    clearTokens();
    setIsGoogleConnected(false);
    handleSignOut();
    addLog('Signed out of Google Account.');
  };

  // Schema/Configuration reset operations
  const handleResetConfiguration = async () => {
    const conf = confirm('Are you sure you want to reset the Spreadsheet configuration?');
    if (!conf) return;
    setSpreadsheetId('');
    setTempSpreadsheetId('');
    toast.success('Spreadsheet ID has been reset.');
  };

  const importCampaignDataJson = async (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (
        parsed &&
        typeof parsed === 'object' &&
        ('characters' in parsed || 'encounters' in parsed || 'npcs' in parsed || 'campaignName' in parsed)
      ) {
        updateState((prev) => ({
          ...prev,
          ...parsed,
        }));
        toast.success('Campaign data imported successfully');
        return true;
      } else {
        throw new Error('Invalid campaign backup schema');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON content';
      toast.error('Import Failed: Malformed campaign JSON', { description: msg });
      throw err;
    }
  };

  const handleImportFile = async (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          await importCampaignDataJson(text);
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => {
        toast.error('Error reading campaign backup file');
        reject(new Error('File read error'));
      };
      reader.readAsText(file);
    });
  };

  return {
    theme,
    setTheme,
    tempSpreadsheetId,
    setTempSpreadsheetId,
    manualToken,
    setManualTokenState,
    showAdvancedAuth,
    setShowAdvancedAuth,
    isSoundEnabled,
    toggleSound,
    handleSaveSpreadsheet,
    handleApplyManualToken,
    handleSignOutWithClear,
    handleResetConfiguration,
    handleImportFile,
    importCampaignDataJson,

    // Overlaid triggers
    fireDeathEvent,
    fireDamageEvent,
    fireHealEvent,
    fireUnconsciousEvent,
    fireRageEvent,
    fireInitiativeEvent,
  };
}
