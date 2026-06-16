// src/components/SettingsPage.tsx

import { Settings, Upload } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { VisualSuiteSelector } from './VisualSuiteSelector';
import { GMAudioSettings } from './GMAudioSettings';
import { SheetConnectionSettings } from './SheetConnectionSettings';
import { AuthPortalSettings } from './AuthPortalSettings';
import { GMTestingTools } from './GMTestingTools';

interface SettingsPageProps {
  isGoogleConnected: boolean;
  handleSignIn: () => void;
  handleSignOut: () => void;
  setIsGoogleConnected: (val: boolean) => void;
  handleSyncWithSheets: (isManual?: boolean) => Promise<void>;
  addLog: (msg: string) => void;
}

export function SettingsPage(props: SettingsPageProps) {
  const {
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
    fireDeathEvent,
    fireDamageEvent,
    fireHealEvent,
    fireUnconsciousEvent,
    fireRageEvent,
    fireInitiativeEvent,
  } = useSettings(props);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportFile(file).catch(() => {});
    }
  };

  return (
    <div className="space-y-8" id="settings-standalone-container">
      {/* Settings Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#e5e1d8] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#c5b358]" />
            <h2 className="text-xl font-bold text-[#2c2c26] font-serif uppercase tracking-wider">Campaign & App Settings</h2>
          </div>
          <p className="text-sm text-[#5a5a40] mt-1 font-sans">
            Customize your visual theme suite, manage Google Sheets connectivity database synchronization, and optimize resources.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns filled with Core Adjustments */}
        <div className="lg:col-span-2 space-y-6">
          <VisualSuiteSelector theme={theme} setTheme={setTheme} />
          
          <GMAudioSettings isSoundEnabled={isSoundEnabled} toggleSound={toggleSound} />

          <SheetConnectionSettings
            tempSpreadsheetId={tempSpreadsheetId}
            setTempSpreadsheetId={setTempSpreadsheetId}
            handleSaveSpreadsheet={handleSaveSpreadsheet}
            handleResetConfiguration={handleResetConfiguration}
            isGoogleConnected={props.isGoogleConnected}
          />
        </div>

        {/* Right Sidebar containing Authorization Settings and Local JSON Backup */}
        <div className="space-y-6">
          <AuthPortalSettings
            isGoogleConnected={props.isGoogleConnected}
            handleSignIn={props.handleSignIn}
            handleSignOutWithClear={handleSignOutWithClear}
            showAdvancedAuth={showAdvancedAuth}
            setShowAdvancedAuth={setShowAdvancedAuth}
            manualToken={manualToken}
            setManualTokenState={setManualTokenState}
            handleApplyManualToken={handleApplyManualToken}
          />

          {/* Backup Import Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#e5e1d8] shadow-sm space-y-4">
            <h3 className="text-md font-bold text-[#2c2c26] font-serif border-b border-[#e5e1d8] pb-1">
              Campaign Backup
            </h3>
            <p className="text-xs text-[#5a5a40]">Import full campaign states directly from a backup JSON file.</p>
            <label className="w-full bg-white border border-[#e5e1d8] hover:border-[#c5b358] text-[#5a5a40] py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2">
              <Upload className="w-4 h-4 text-[#c5b358]" />
              Import JSON Backup
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      <GMTestingTools
        fireDeathEvent={fireDeathEvent}
        fireDamageEvent={fireDamageEvent}
        fireHealEvent={fireHealEvent}
        fireUnconsciousEvent={fireUnconsciousEvent}
        fireRageEvent={fireRageEvent}
        fireInitiativeEvent={fireInitiativeEvent}
      />
    </div>
  );
}
