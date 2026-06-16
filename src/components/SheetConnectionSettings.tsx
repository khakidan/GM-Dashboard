// src/components/SheetConnectionSettings.tsx

import { Save, RotateCcw } from 'lucide-react';

interface SheetConnectionSettingsProps {
  tempSpreadsheetId: string;
  setTempSpreadsheetId: (id: string) => void;
  handleSaveSpreadsheet: () => void;
  handleResetConfiguration: () => void;
  isGoogleConnected: boolean;
}

export function SheetConnectionSettings({
  tempSpreadsheetId,
  setTempSpreadsheetId,
  handleSaveSpreadsheet,
  handleResetConfiguration,
  isGoogleConnected,
}: SheetConnectionSettingsProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#e5e1d8] shadow-sm space-y-4">
      <div>
        <h3 className="text-lg font-bold text-[#2c2c26] font-serif pb-1">Google Spreadsheet Connection</h3>
        <p className="text-xs text-[#5a5a40]">
          Link your active campaign database with a remote Google Spreadsheet for persistent real-time campaign states.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-widest font-bold text-[#5a5a40] px-1">
            Google Spreadsheet ID
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={tempSpreadsheetId}
              onChange={e => setTempSpreadsheetId(e.target.value)}
              placeholder="Enter Spreadsheet ID"
              className="flex-1 bg-[#f5f5f0] border-2 border-[#e5e1d8] rounded-xl px-5 py-3 font-sans text-sm outline-none focus:border-[#c5b358] transition-all"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveSpreadsheet}
                className="bg-[#5a5a40] hover:bg-[#3f3f37] text-white px-5 py-3 rounded-xl font-bold font-sans uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer animate-fade-in"
              >
                <Save className="w-4 h-4" />
                Save ID
              </button>
              <button
                onClick={handleResetConfiguration}
                title="Reset Spreadsheet Config"
                className="border border-[#e5e1d8] hover:bg-stone-50 text-[#5a5a40] p-3 rounded-xl transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
