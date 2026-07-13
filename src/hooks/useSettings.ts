// src/hooks/useSettings.ts

import { useState, useCallback } from 'react';
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
} from './useCombatOverlayEvents';

import { CampaignBackupSchema } from '../lib/objectSchemas';
import { Character, NPC, Encounter, EncounterCombatant } from '../types';

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
  const { state, updateState } = useAppState();

  const { fire: fireDeathEvent } = useDeathEvent();
  const { fire: fireDamageEvent } = useDamageEvent();
  const { fire: fireHealEvent } = useHealEvent();
  const { fire: fireUnconsciousEvent } = useUnconsciousEvent();
  const { fire: fireRageEvent } = useRageEvent();
  const { fire: fireInitiativeEvent } = useInitiativeEvent();

  const [tempSpreadsheetId, setTempSpreadsheetId] = useState(() => getSpreadsheetId());
  const [manualToken, setManualTokenState] = useState('');
  const [showAdvancedAuth, setShowAdvancedAuth] = useState(false);

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
    setSpreadsheetId('');
    setTempSpreadsheetId('');
    toast.success('Spreadsheet ID has been reset.');
  };

  const importCampaignDataJson = async (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      const validation = CampaignBackupSchema.safeParse(parsed);

      if (validation.success) {
        const { data } = validation;
        
        // Merge only the specific fields produced by handleExportJSON that are present in the backup
        // This prevents metadata like 'version' or 'exportDate' from being merged into AppState
        // We use explicit narrow type assertions through 'unknown' because CampaignBackupSchema uses
        // .passthrough() for array elements to be lenient and validate only structural shapes,
        // resulting in loose inferred types that do not match the full AppState type definitions.
        updateState((prev) => ({
          ...prev,
          ...(data.campaignName !== undefined && { campaignName: data.campaignName }),
          ...(data.characters !== undefined && { characters: data.characters as unknown as Character[] }),
          ...(data.npcs !== undefined && { npcs: data.npcs as unknown as NPC[] }),
          ...(data.encounters !== undefined && { encounters: data.encounters as unknown as Encounter[] }),
          ...(data.encounterCombatants !== undefined && { encounterCombatants: data.encounterCombatants as unknown as EncounterCombatant[] }),
        }));

        toast.success('Campaign data imported successfully');
        return true;
      } else {
        const firstError = validation.error.issues[0];
        const fieldPath = firstError.path.join('.');
        throw new Error(`Invalid backup schema at ${fieldPath}: ${firstError.message}`);
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

  const handleExportJSON = useCallback(() => {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      campaignName: state.campaignName,
      characters: state.characters,
      npcs: state.npcs,
      encounters: state.encounters,
      encounterCombatants: state.encounterCombatants,
    };
    
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    
    const date = new Date().toISOString().split('T')[0];
    const safeName = state.campaignName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    link.download = `campaign-${safeName}-${date}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Campaign exported successfully');
  }, [state]);

  return {
    theme,
    setTheme,
    tempSpreadsheetId,
    setTempSpreadsheetId,
    manualToken,
    setManualTokenState,
    showAdvancedAuth,
    setShowAdvancedAuth,
    handleSaveSpreadsheet,
    handleApplyManualToken,
    handleSignOutWithClear,
    handleResetConfiguration,
    handleImportFile,
    importCampaignDataJson,
    handleExportJSON,

    // Overlaid triggers
    fireDeathEvent,
    fireDamageEvent,
    fireHealEvent,
    fireUnconsciousEvent,
    fireRageEvent,
    fireInitiativeEvent,
  };
}
