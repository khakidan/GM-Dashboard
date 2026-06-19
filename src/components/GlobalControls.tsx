import { DiceRoller } from './DiceRoller';

interface GlobalControlsProps {
  isAudioPanelOpen: boolean;
  setIsAudioPanelOpen: (isOpen: boolean) => void;
  isAmbientPlaying: boolean;
}

export function GlobalControls({
  isAudioPanelOpen,
  setIsAudioPanelOpen,
  isAmbientPlaying,
}: GlobalControlsProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: '0.5rem',
        zIndex: 50,
      }}
    >
      <div className="relative flex flex-col h-11">
        <button
          id="audio-panel-header"
          onClick={() => setIsAudioPanelOpen(true)}
          className={`h-11 bg-white shadow-lg border text-stone-900 overflow-visible transition-all font-sans rounded-xl flex items-center justify-between px-4 cursor-pointer hover:bg-[#f5f5f0] select-none ${
            isAudioPanelOpen ? 'ring-2 ring-[#c5b358] border-[#c5b358]' : 'border-[#e5e1d8]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] shrink-0 font-bold uppercase tracking-wider text-[#2c2c26] flex items-center gap-2 font-sans" id="audio-panel-label">
              <span role="img" aria-label="music" className="text-sm">🎵</span> AUDIO
            </span>

            {isAmbientPlaying && (
              <span className="relative flex h-2 w-2 shrink-0 ml-1" id="audio-active-pulsar">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
              </span>
            )}
          </div>
        </button>
      </div>
      
      <DiceRoller />
    </div>
  );
}
