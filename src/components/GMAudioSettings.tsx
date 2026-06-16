// src/components/GMAudioSettings.tsx

interface GMAudioSettingsProps {
  isSoundEnabled: boolean;
  toggleSound: () => void;
}

export function GMAudioSettings({ isSoundEnabled, toggleSound }: GMAudioSettingsProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#e5e1d8] shadow-sm space-y-4" id="audio-settings-card">
      <div>
        <h3 className="text-lg font-bold text-[#2c2c26] font-serif pb-1">Audio & Ambient Sounds</h3>
        <p className="text-xs text-[#5a5a40]">
          Toggle procedural synthesized sound effects for damage, healing, turn changes, and death saves.
        </p>
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl border border-[#e5e1d8] bg-stone-50/50">
        <div>
          <div id="sound-effects-toggle-label" className="text-sm font-bold font-sans text-stone-900">Sound Effects</div>
          <div className="text-xs text-[#5a5a40]/80 mt-1">Enable procedural Web Audio cues</div>
        </div>
        <button
          id="sound-effects-toggle-btn"
          type="button"
          onClick={toggleSound}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isSoundEnabled ? 'bg-[#c5b358]' : 'bg-stone-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isSoundEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
