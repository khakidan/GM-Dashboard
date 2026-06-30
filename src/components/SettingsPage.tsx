// src/components/SettingsPage.tsx

import { Settings, Upload, Download } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { SheetConnectionSettings } from './SheetConnectionSettings';
import { AuthPortalSettings } from './auth/AuthPortalSettings';
import { ReferenceDataSeeder } from './ReferenceDataSeeder';
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
    handleExportJSON,
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
    <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] overflow-hidden flex flex-col w-full min-h-full" id="settings-standalone-container">
      {/* Page Header */}
      <div className="bg-[#ffffff] border-b border-[#e2e8f0] p-6 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Settings</h1>
            <p className="text-sm text-[#8d8db9] mt-0.5">Manage Google Sheets connectivity, database synchronization, and campaign resources.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white w-full p-6 overflow-y-auto space-y-8">
        {/* Full width — Sheet Connection */}
        <SheetConnectionSettings
          tempSpreadsheetId={tempSpreadsheetId}
          setTempSpreadsheetId={setTempSpreadsheetId}
          handleSaveSpreadsheet={handleSaveSpreadsheet}
          handleResetConfiguration={handleResetConfiguration}
          isGoogleConnected={props.isGoogleConnected}
        />

        {/* Two columns — Auth and Backup side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
          <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm space-y-4">
            <h3 className="text-md font-bold text-[#0f172a] font-sans border-b border-[#e2e8f0] pb-1">
              Campaign Backup
            </h3>
            <p className="text-xs text-[#8d8db9]">Import or export full campaign states directly from a backup JSON file.</p>
            <div className="flex gap-2 w-full">
              <label className="w-1/2 bg-white border border-[#e2e8f0] hover:border-[#2563eb] text-[#8d8db9] py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2">
                <Upload className="w-4 h-4 text-[#2563eb]" />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={handleExportJSON}
                className="w-1/2 bg-white border border-[#e2e8f0] hover:border-[#2563eb] text-[#8d8db9] py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-[#2563eb]" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Full width — Reference Data Seeder */}
        <ReferenceDataSeeder isGoogleConnected={props.isGoogleConnected} />

        {/* Full width — GM Testing Tools */}
        <GMTestingTools
          fireDeathEvent={fireDeathEvent}
          fireDamageEvent={fireDamageEvent}
          fireHealEvent={fireHealEvent}
          fireUnconsciousEvent={fireUnconsciousEvent}
          fireRageEvent={fireRageEvent}
          fireInitiativeEvent={fireInitiativeEvent}
        />
      </div>
    </div>
  );
}
