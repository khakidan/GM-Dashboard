import React, { useState } from 'react';
import { X, UserPlus, Shield, Heart, Eye, Star, Info, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Character } from '../../types';
import { cn } from '../../lib/utils';

interface NewPlayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (character: Omit<Character, 'id' | 'sheetRowIndex'>) => void;
}

export function NewPlayerDialog({ isOpen, onClose, onConfirm }: NewPlayerDialogProps) {
  const [formData, setFormData] = useState({
    playerName: '',
    characterName: '',
    level: 1,
    ac: 10,
    maxHp: 10,
    passivePerception: 10,
    statusId: 1, // Active
    notes: '',
    resistances: '',
    immunities: '',
    vulnerabilities: '',
  });

  const isFormValid = formData.playerName.trim() !== '' && 
                      formData.characterName.trim() !== '' && 
                      formData.maxHp > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    onConfirm({
      playerName: formData.playerName,
      characterName: formData.characterName,
      level: formData.level,
      ac: formData.ac,
      maxHp: formData.maxHp,
      currentHp: formData.maxHp, // Defaults to Max HP
      tempHp: 0, // Defaults to 0
      passivePerception: formData.passivePerception,
      statusId: formData.statusId,
      statusName: formData.statusId === 1 ? 'Active' : formData.statusId === 2 ? 'Inactive' : 'Deceased',
      notes: formData.notes,
      resistances: formData.resistances,
      immunities: formData.immunities,
      vulnerabilities: formData.vulnerabilities,
      conditions: '',
      isActive: formData.statusId === 1,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#2c2c26]/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#fdfaf5] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#e5e1d8] overflow-hidden flex flex-col relative z-10"
          >
            <div className="bg-[#2c2c26] p-6 text-[#e5e1d8] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-[#c5b358]" />
                <h2 className="text-xl font-bold font-serif uppercase tracking-wider">Add New Player Character</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Names */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                      Player Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="new-player-name"
                      type="text"
                      required
                      value={formData.playerName}
                      onChange={e => setFormData({ ...formData, playerName: e.target.value })}
                      placeholder="e.g. Matt"
                      className="w-full bg-white border border-[#e5e1d8] rounded-xl px-4 py-3 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                      Character Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="new-character-name"
                      type="text"
                      required
                      value={formData.characterName}
                      onChange={e => setFormData({ ...formData, characterName: e.target.value })}
                      placeholder="e.g. Caleb"
                      className="w-full bg-white border border-[#e5e1d8] rounded-xl px-4 py-3 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all font-serif italic"
                    />
                  </div>
                </div>

                {/* Core Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                      Level <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c5b358]" />
                      <input
                        id="new-character-level"
                        type="number"
                        min="1"
                        required
                        value={formData.level}
                        onFocus={(e) => e.target.select()}
                        onChange={e => setFormData({ ...formData, level: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white border border-[#e5e1d8] rounded-xl pl-10 pr-4 py-3 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                      AC <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a40] opacity-50" />
                      <input
                        id="new-character-ac"
                        type="number"
                        min="0"
                        required
                        value={formData.ac}
                        onFocus={(e) => e.target.select()}
                        onChange={e => setFormData({ ...formData, ac: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white border border-[#e5e1d8] rounded-xl pl-10 pr-4 py-3 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                      Max HP <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                      <input
                        id="new-character-maxhp"
                        type="number"
                        min="1"
                        required
                        value={formData.maxHp}
                        onFocus={(e) => e.target.select()}
                        onChange={e => setFormData({ ...formData, maxHp: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white border border-[#e5e1d8] rounded-xl pl-10 pr-4 py-3 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                      Passive Percept.
                    </label>
                    <div className="relative">
                      <Eye className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a40] opacity-50" />
                      <input
                        id="new-character-passive"
                        type="number"
                        min="0"
                        value={formData.passivePerception}
                        onFocus={(e) => e.target.select()}
                        onChange={e => setFormData({ ...formData, passivePerception: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white border border-[#e5e1d8] rounded-xl pl-10 pr-4 py-3 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="new-character-status"
                    value={formData.statusId}
                    onChange={e => setFormData({ ...formData, statusId: parseInt(e.target.value) })}
                    className="w-full bg-white border border-[#e5e1d8] rounded-xl px-4 py-3 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value={1}>Active</option>
                    <option value={2}>Inactive</option>
                    <option value={3}>Deceased</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                    Resistances
                  </label>
                  <input
                    id="new-character-resistances"
                    type="text"
                    value={formData.resistances}
                    onChange={e => setFormData({ ...formData, resistances: e.target.value })}
                    placeholder="e.g. fire, cold"
                    className="w-full bg-white border border-[#e5e1d8] rounded-xl px-4 py-3 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                    Immunities
                  </label>
                  <input
                    id="new-character-immunities"
                    type="text"
                    value={formData.immunities}
                    onChange={e => setFormData({ ...formData, immunities: e.target.value })}
                    placeholder="e.g. poison, charmed"
                    className="w-full bg-white border border-[#e5e1d8] rounded-xl px-4 py-3 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                    Vulnerabilities
                  </label>
                  <input
                    id="new-character-vulnerabilities"
                    type="text"
                    value={formData.vulnerabilities}
                    onChange={e => setFormData({ ...formData, vulnerabilities: e.target.value })}
                    placeholder="e.g. thunder"
                    className="w-full bg-white border border-[#e5e1d8] rounded-xl px-4 py-3 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                  Notes
                </label>
                <textarea
                  id="new-character-notes"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Character backstory, special items, etc."
                  rows={3}
                  className="w-full bg-white border border-[#e5e1d8] rounded-xl px-4 py-3 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  id="cancel-new-character-btn"
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-[#e5e1d8] hover:bg-[#d4cfc1] text-[#2c2c26] py-3.5 rounded-xl font-bold font-sans uppercase tracking-widest text-xs transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  id="confirm-add-character-btn"
                  type="submit"
                  disabled={!isFormValid}
                  className={cn(
                    "flex-1 bg-[#c5b358] hover:bg-[#b0a04f] text-[#2c2c26] py-3.5 rounded-xl font-bold font-sans uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed",
                  )}
                >
                  <Save className="w-4 h-4" />
                  Add Character →
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
