import React, { useEffect } from 'react';
import { DialogShell } from '../ui/DialogShell';

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

  return (
    <DialogShell
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-lg"
      zIndex="z-[120]"
      title="Keyboard Shortcuts"
      subtitle="GM Dashboard quick references"
      icon={
        <span className="p-1.5 bg-[#f9f8ff] rounded-lg border border-[#e2e8f0] text-[#2563eb]">
          ❓
        </span>
      }
      footer={
        <div className="flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-[#f9f8ff] border border-[#e2e8f0] hover:border-[#2563eb] text-[#8d8db9] hover:text-[#0f172a] text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      }
    >
      {/* Prominent Command Palette shortcut callout */}
      <div className="bg-[#ffffff] border border-[#2563eb]/40 rounded-xl p-3.5 mb-5 flex items-center justify-between text-stone-900 shadow-sm hover:border-[#2563eb] transition-all">
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold font-serif uppercase tracking-wider text-[#0f172a]">GM Command Palette</h4>
          <p className="text-[11px] text-[#8d8db9]">Quick access to rests, rolls, conditions, and search.</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <kbd className="font-mono text-xs font-bold bg-white border border-[#e2e8f0] shadow-sm px-2 py-0.5 rounded text-[#2a2a22] self-center">⌘</kbd>
          <span className="text-stone-400 text-xs self-center">+</span>
          <kbd className="font-mono text-xs font-bold bg-white border border-[#e2e8f0] shadow-sm px-2 py-0.5 rounded text-[#2a2a22] self-center">K</kbd>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <div>
          <h4 className="font-serif font-bold text-sm text-[#2563eb] border-b border-[#e2e8f0] pb-1 uppercase tracking-wider mb-2">Combat</h4>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#f9f8ff]/80 border border-[#e2e8f0] px-2 py-0.5 rounded text-[#0f172a]">N</span>
              <span className="text-[#8d8db9] text-xs">Next turn</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#f9f8ff]/80 border border-[#e2e8f0] px-2 py-0.5 rounded text-[#0f172a]">R</span>
              <span className="text-[#8d8db9] text-xs">Roll NPC initiative</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#f9f8ff]/80 border border-[#e2e8f0] px-2 py-0.5 rounded text-[#0f172a]">S</span>
              <span className="text-[#8d8db9] text-xs">Toggle select mode</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#f9f8ff]/80 border border-[#e2e8f0] px-2 py-0.5 rounded text-[#0f172a]">B</span>
              <span className="text-[#8d8db9] text-xs">Broadcast player view</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#f9f8ff]/80 border border-[#e2e8f0] px-2 py-0.5 rounded text-[#0f172a]">C</span>
              <span className="text-[#8d8db9] text-xs">Call for initiative</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#f9f8ff]/80 border border-[#e2e8f0] px-2 py-0.5 rounded text-[#0f172a]">1-9</span>
              <span className="text-[#8d8db9] text-xs">Select combatant</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#f9f8ff]/80 border border-[#e2e8f0] px-2 py-0.5 rounded text-[#0f172a]">Esc</span>
              <span className="text-[#8d8db9] text-xs">Deselect all</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-serif font-bold text-sm text-[#2563eb] border-b border-[#e2e8f0] pb-1 uppercase tracking-wider mb-2">Input</h4>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#f9f8ff]/80 border border-[#e2e8f0] px-2 py-0.5 rounded text-[#0f172a]">H</span>
              <span className="text-[#8d8db9] text-xs">Heal mode</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#f9f8ff]/80 border border-[#e2e8f0] px-2 py-0.5 rounded text-[#0f172a]">D</span>
              <span className="text-[#8d8db9] text-xs">Damage mode</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#f9f8ff]/80 border border-[#e2e8f0] px-2 py-0.5 rounded text-[#0f172a]">T</span>
              <span className="text-[#8d8db9] text-xs">Open tools</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#f9f8ff]/80 border border-[#e2e8f0] px-2 py-0.5 rounded text-[#0f172a]">M</span>
              <span className="text-[#8d8db9] text-xs">Toggle audio panel</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#f9f8ff]/80 border border-[#e2e8f0] px-2 py-0.5 rounded text-[#0f172a]">? / Shift+/</span>
              <span className="text-[#8d8db9] text-xs">Show shortcuts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="font-serif font-bold text-sm text-[#2563eb] border-b border-[#e2e8f0] pb-1 uppercase tracking-wider mb-2">Audio Moods</h4>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#f9f8ff]/80 border border-[#e2e8f0] px-2 py-0.5 rounded text-[#0f172a]">Alt+1</span>
            <span className="text-[#8d8db9] text-xs">Sweet music</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#f9f8ff]/80 border border-[#e2e8f0] px-2 py-0.5 rounded text-[#0f172a]">Alt+2</span>
            <span className="text-[#8d8db9] text-xs">Adventuring music</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#f9f8ff]/80 border border-[#e2e8f0] px-2 py-0.5 rounded text-[#0f172a]">Alt+3</span>
            <span className="text-[#8d8db9] text-xs">Tense music</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#f9f8ff]/80 border border-[#e2e8f0] px-2 py-0.5 rounded text-[#0f172a]">Alt+4</span>
            <span className="text-[#8d8db9] text-xs">Scary music</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#f9f8ff]/80 border border-[#e2e8f0] px-2 py-0.5 rounded text-[#0f172a]">Alt+5</span>
            <span className="text-[#8d8db9] text-xs">Combat music</span>
          </div>
        </div>
      </div>
    </DialogShell>
  );
}
