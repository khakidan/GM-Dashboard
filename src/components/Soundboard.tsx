// src/components/Soundboard.tsx

import React, { useState, useEffect, useRef } from 'react';
import { VolumeX, Plus, Edit2, Play, Trash2, X, Music, AlertCircle } from 'lucide-react';
import { StoredAudioFile } from '../lib/audioFileStore';
import { STORAGE_KEYS, campaignKey } from '../lib/constants';

export interface SoundboardSlot {
  slotIndex: number;    // 0-11
  fileId: string;
  label: string;
}

interface SoundboardProps {
  storedFiles: StoredAudioFile[];
  playEffect: (fileId: string) => Promise<void>;
  onSwitchTab?: (tab: 'ambient' | 'soundboard' | 'library') => void;
  campaignId?: string;
}

export function Soundboard({ storedFiles, playEffect, onSwitchTab, campaignId }: SoundboardProps) {
  const effectFiles = storedFiles.filter((f) => f.category === 'effect');

  // Load layout from localStorage
  const [layout, setLayout] = useState<SoundboardSlot[]>([]);

  // Reload layout when campaignId changes
  useEffect(() => {
    const key = campaignKey(STORAGE_KEYS.soundboardLayout, campaignId || 'default');
    try {
      const stored = localStorage.getItem(key);
      setLayout(stored ? JSON.parse(stored) : []);
    } catch {
      setLayout([]);
    }
  }, [campaignId]);

  // Keep track of which slots are flashing
  const [flashingSlots, setFlashingSlots] = useState<Record<number, boolean>>({});

  // Dialog state
  const [assigningSlot, setAssigningSlot] = useState<number | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [customLabel, setCustomLabel] = useState<string>('');

  // Context menu state
  const [contextMenuSlot, setContextMenuSlot] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Save layout to localStorage on update
  useEffect(() => {
    const key = campaignKey(STORAGE_KEYS.soundboardLayout, campaignId || 'default');
    localStorage.setItem(key, JSON.stringify(layout));
  }, [layout, campaignId]);

  // Handle click on slot
  const handleSlotClick = async (slotIndex: number) => {
    // If context menu is open, close it
    if (contextMenuSlot !== null) {
      setContextMenuSlot(null);
      return;
    }

    const slot = layout.find((s) => s.slotIndex === slotIndex);
    if (!slot) {
      // Open assignment dialog
      handleOpenAssign(slotIndex);
      return;
    }

    // Play effect
    try {
      // Flash slot
      setFlashingSlots((prev) => ({ ...prev, [slotIndex]: true }));
      setTimeout(() => {
        setFlashingSlots((prev) => ({ ...prev, [slotIndex]: false }));
      }, 500);

      await playEffect(slot.fileId);
    } catch (err) {
      console.error('Failed to play effect from slot:', err);
    }
  };

  // Right-click context menu
  const handleSlotContextMenu = (e: React.MouseEvent, slotIndex: number) => {
    const slot = layout.find((s) => s.slotIndex === slotIndex);
    if (!slot) return; // Only show context menu for assigned slots

    e.preventDefault();
    setContextMenuSlot(slotIndex);
    setMenuPosition({ x: e.clientX, y: e.clientY });
  };

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setContextMenuSlot(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Open helper for assignment
  const handleOpenAssign = (slotIndex: number) => {
    const existing = layout.find((s) => s.slotIndex === slotIndex);
    setAssigningSlot(slotIndex);
    
    if (existing) {
      setSelectedFileId(existing.fileId);
      setCustomLabel(existing.label);
    } else {
      // Default to first effect file if available
      setSelectedFileId(effectFiles[0]?.id || '');
      setCustomLabel('');
    }
  };

  // Save assignment
  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (assigningSlot === null || !selectedFileId) return;

    const file = effectFiles.find((f) => f.id === selectedFileId);
    const label = customLabel.trim() || file?.name || 'Sound Effect';
    const finalLabel = label.substring(0, 16); // up to 16 characters

    setLayout((prev) => {
      const filtered = prev.filter((s) => s.slotIndex !== assigningSlot);
      return [...filtered, { slotIndex: assigningSlot, fileId: selectedFileId, label: finalLabel }];
    });

    setAssigningSlot(null);
    setSelectedFileId('');
    setCustomLabel('');
  };

  const clearSlot = (slotIndex: number) => {
    setLayout((prev) => prev.filter((s) => s.slotIndex !== slotIndex));
    setContextMenuSlot(null);
  };

  const startRenameSlot = (slotIndex: number) => {
    const existing = layout.find((s) => s.slotIndex === slotIndex);
    if (!existing) return;
    setAssigningSlot(slotIndex);
    setSelectedFileId(existing.fileId);
    setCustomLabel(existing.label);
    setContextMenuSlot(null);
  };

  // Generate 12 slots for 3x4 grid
  const slots = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div id="soundboard-panel" className="flex flex-col h-full text-stone-800 relative">
      <div className="flex items-center justify-between border-b border-[#e5e1d8] pb-3 mb-4">
        <h3 className="font-serif font-bold text-sm text-[#2c2c26] uppercase tracking-wider flex items-center gap-2">
          <VolumeX className="w-4 h-4 text-[#c5b358]" />
          Soundboard Grid
        </h3>
      </div>

      {effectFiles.length === 0 && (
        <div id="soundboard-no-effects-note" className="mb-4 p-2.5 bg-amber-50/50 border border-amber-200/50 text-amber-800 text-xs rounded-xl flex items-start gap-2 font-sans">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Add sound effects in the Library tab</p>
            <p className="opacity-90">You will be able to customize these 12 trigger buttons once effect files are loaded.</p>
          </div>
        </div>
      )}

      {/* Grid of 12 Buttons */}
      <div id="soundboard-grid" className="grid grid-cols-3 gap-3 flex-1 select-none">
        {slots.map((slotIndex) => {
          const slot = layout.find((s) => s.slotIndex === slotIndex);
          const isFlashing = flashingSlots[slotIndex];

          return (
            <button
              key={slotIndex}
              id={`soundboard-btn-${slotIndex}`}
              onClick={() => handleSlotClick(slotIndex)}
              onContextMenu={(e) => handleSlotContextMenu(e, slotIndex)}
              className={`h-24 relative rounded-xl border font-sans font-medium text-sm flex flex-col items-center justify-center p-3 transition-all outline-none focus:ring-2 focus:ring-[#c5b358]/50 ${
                slot
                  ? isFlashing
                    ? 'bg-[#c5b358] border-[#c5b358] text-white shadow-md animate-ping-once'
                    : 'bg-[#c5b358]/10 text-[#a08b2c] border-[#c5b358]/30 hover:bg-[#c5b358]/20 focus:bg-[#c5b358]/20 cursor-pointer active:scale-95'
                  : 'bg-stone-50 text-stone-400 border-stone-200/60 border-dashed hover:bg-stone-100/60 hover:text-stone-500 cursor-pointer'
              }`}
              style={{
                animation: isFlashing ? 'pulse-flash 0.3s ease-out' : undefined,
              }}
              title={slot ? `${slot.label} (Right-click to configure)` : 'Add sound effect'}
            >
              {slot ? (
                <>
                  <span className="font-bold break-words whitespace-normal max-w-full text-center leading-tight">
                    {slot.label}
                  </span>
                  <span className="text-[10px] text-[#a08b2c]/65 font-mono uppercase tracking-widest mt-1">FX</span>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                  <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wide">Add Sound</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Context Menu */}
      {contextMenuSlot !== null && (
        <div
          id="soundboard-context-menu"
          className="fixed bg-white border border-[#e5e1d8] rounded-xl shadow-xl py-1 z-[150] w-32 text-stone-800"
          style={{
            top: menuPosition.y,
            left: menuPosition.x,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => startRenameSlot(contextMenuSlot)}
            className="w-full text-left px-3 py-2 text-xs hover:bg-[#c5b358]/10 flex items-center gap-2 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#c5b358]" />
            <span>Rename</span>
          </button>
          <button
            onClick={() => clearSlot(contextMenuSlot)}
            className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      )}

      {/* Assignment Dialog Modal */}
      {assigningSlot !== null && (
        <div
          id="soundboard-assign-modal"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[180] flex items-center justify-center p-4"
          onClick={() => setAssigningSlot(null)}
        >
          <form
            onSubmit={handleSaveAssignment}
            className="bg-[#fdfaf5] w-full max-w-sm rounded-2xl shadow-2xl border border-[#e5e1d8] p-5 text-stone-900 flex flex-col gap-4 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#e5e1d8] pb-3">
              <h4 className="font-serif font-bold text-sm text-[#2c2c26] uppercase tracking-wider">
                Configure Slot #{assigningSlot + 1}
              </h4>
              <button
                type="button"
                onClick={() => setAssigningSlot(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {effectFiles.length === 0 ? (
              <div className="text-center py-6 flex flex-col items-center gap-3">
                <Music className="w-8 h-8 text-stone-300" />
                <p className="text-xs text-stone-500 max-w-xs">
                  No effect files found! Upload sound effects (.mp3, .wav) first inside the Library tab.
                </p>
                {onSwitchTab && (
                  <button
                    type="button"
                    onClick={() => {
                      setAssigningSlot(null);
                      onSwitchTab('library');
                    }}
                    className="mt-1 px-3 py-1.5 bg-[#faf9f6] border border-[#e5e1d8] hover:border-[#c5b358] text-[#5a5a40] hover:text-[#2c2c26] text-xs font-bold uppercase rounded-lg cursor-pointer"
                  >
                    Go to Library
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                    Select Audio File
                  </label>
                  <select
                    id="soundboard-file-select"
                    required
                    value={selectedFileId}
                    onChange={(e) => {
                      setSelectedFileId(e.target.value);
                      const file = effectFiles.find((f) => f.id === e.target.value);
                      if (file && !customLabel) {
                        setCustomLabel(file.name.substring(0, 16));
                      }
                    }}
                    className="w-full bg-[#faf9f6]/80 border border-[#e5e1d8] hover:border-gray-300 focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] rounded-xl px-3 py-2 text-stone-800 outline-none transition-all cursor-pointer font-sans"
                  >
                    <option value="" disabled>-- Choose Sound Effect --</option>
                    {effectFiles.map((file) => (
                      <option key={file.id} value={file.id}>
                        {file.fileName} ({(file.blob.size / 1024).toFixed(1)} KB)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                    Button Label (Max 16 chars)
                  </label>
                  <input
                    id="soundboard-label-input"
                    type="text"
                    maxLength={16}
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder={effectFiles.find((f) => f.id === selectedFileId)?.name || 'E.g., Swords Clashing'}
                    className="w-full bg-white border border-[#e5e1d8]/80 focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] rounded-xl px-3 py-2 text-stone-850 outline-none font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-[#f5f5f0]">
                  <button
                    type="button"
                    onClick={() => setAssigningSlot(null)}
                    className="px-3 py-1.5 bg-[#faf9f6] border border-[#e5e1d8] text-stone-500 rounded-lg text-xs font-bold hover:text-stone-700 uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#c5b358] hover:bg-[#b09e44] text-white rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer"
                  >
                    Assign Sound
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
