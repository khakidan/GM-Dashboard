import React, { useEffect } from 'react';

interface ShortcutCheatSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutCheatSheet({ isOpen, onClose }: ShortcutCheatSheetProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      id="shortcut-cheat-sheet"
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#fdfaf5] w-full max-w-lg rounded-2xl shadow-2xl border border-[#e5e1d8] p-6 text-stone-900"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[#e5e1d8] pb-4 mb-4">
          <span className="p-1.5 bg-[#faf9f6] rounded-lg border border-[#e5e1d8] text-[#c5b358]">
            ❓
          </span>
          <div>
            <h3 className="text-lg font-bold text-[#2c2c26] font-serif uppercase tracking-wider">Keyboard Shortcuts</h3>
            <p className="text-xs text-[#5a5a40]">GM Dashboard quick references</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <h4 className="font-serif font-bold text-sm text-[#c5b358] border-b border-[#f5f5f0] pb-1 uppercase tracking-wider mb-2">Combat</h4>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#faf9f6]/80 border border-[#e5e1d8] px-2 py-0.5 rounded text-[#2c2c26]">N</span>
                <span className="text-[#5a5a40] text-xs">Next turn</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#faf9f6]/80 border border-[#e5e1d8] px-2 py-0.5 rounded text-[#2c2c26]">R</span>
                <span className="text-[#5a5a40] text-xs">Roll NPC initiative</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#faf9f6]/80 border border-[#e5e1d8] px-2 py-0.5 rounded text-[#2c2c26]">S</span>
                <span className="text-[#5a5a40] text-xs">Toggle select mode</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#faf9f6]/80 border border-[#e5e1d8] px-2 py-0.5 rounded text-[#2c2c26]">B</span>
                <span className="text-[#5a5a40] text-xs">Broadcast player view</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#faf9f6]/80 border border-[#e5e1d8] px-2 py-0.5 rounded text-[#2c2c26]">C</span>
                <span className="text-[#5a5a40] text-xs">Call for initiative</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#faf9f6]/80 border border-[#e5e1d8] px-2 py-0.5 rounded text-[#2c2c26]">1-9</span>
                <span className="text-[#5a5a40] text-xs">Select combatant</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#faf9f6]/80 border border-[#e5e1d8] px-2 py-0.5 rounded text-[#2c2c26]">Esc</span>
                <span className="text-[#5a5a40] text-xs">Deselect all</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-serif font-bold text-sm text-[#c5b358] border-b border-[#f5f5f0] pb-1 uppercase tracking-wider mb-2">Input</h4>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#faf9f6]/80 border border-[#e5e1d8] px-2 py-0.5 rounded text-[#2c2c26]">H</span>
                <span className="text-[#5a5a40] text-xs">Heal mode</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#faf9f6]/80 border border-[#e5e1d8] px-2 py-0.5 rounded text-[#2c2c26]">D</span>
                <span className="text-[#5a5a40] text-xs">Damage mode</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#faf9f6]/80 border border-[#e5e1d8] px-2 py-0.5 rounded text-[#2c2c26]">T</span>
                <span className="text-[#5a5a40] text-xs">Open tools</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#faf9f6]/80 border border-[#e5e1d8] px-2 py-0.5 rounded text-[#2c2c26]">? / Shift+/</span>
                <span className="text-[#5a5a40] text-xs">Show shortcuts</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#f5f5f0] flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-[#faf9f6] border border-[#e5e1d8] hover:border-[#c5b358] text-[#5a5a40] hover:text-[#2c2c26] text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
