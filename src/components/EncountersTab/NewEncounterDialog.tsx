import React, { useState } from 'react';
import { X, Sword, MapPin, Trophy, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Encounter, DifficultyLevel } from '../../types';
import { cn } from '../../lib/utils';

interface NewEncounterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { name: string; location: string; difficultyId: number }) => void;
  difficulties: DifficultyLevel[];
}

export function NewEncounterDialog({ isOpen, onClose, onConfirm, difficulties }: NewEncounterDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    difficultyId: 1, // Default Easy
  });

  const isFormValid = formData.name.trim() !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    onConfirm(formData);
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
            className="bg-[#fdfaf5] w-full max-w-lg rounded-2xl shadow-2xl border border-[#e5e1d8] overflow-hidden flex flex-col relative z-10"
          >
            <div className="bg-[#2c2c26] p-6 text-[#e5e1d8] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sword className="w-6 h-6 text-[#c5b358]" />
                <h2 className="text-xl font-bold font-serif uppercase tracking-wider">Plan New Encounter</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                    Encounter Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="new-encounter-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Goblin Ambush"
                    className="w-full bg-white border border-[#e5e1d8] rounded-xl px-4 py-3 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all font-serif"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a40] opacity-50" />
                    <input
                      id="new-encounter-location"
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Whispering Woods"
                      className="w-full bg-white border border-[#e5e1d8] rounded-xl pl-10 pr-4 py-3 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                    Difficulty <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c5b358] opacity-50" />
                    <select
                      id="new-encounter-difficulty"
                      value={formData.difficultyId}
                      onChange={e => setFormData({ ...formData, difficultyId: parseInt(e.target.value) })}
                      className="w-full bg-white border border-[#e5e1d8] rounded-xl pl-10 pr-4 py-3 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all appearance-none cursor-pointer font-bold"
                    >
                      {difficulties.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  id="cancel-new-encounter-btn"
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-[#e5e1d8] hover:bg-[#d4cfc1] text-[#2c2c26] py-3.5 rounded-xl font-bold font-sans uppercase tracking-widest text-xs transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  id="confirm-add-encounter-btn"
                  type="submit"
                  disabled={!isFormValid}
                  className={cn(
                    "flex-1 bg-[#c5b358] hover:bg-[#b0a04f] text-[#2c2c26] py-3.5 rounded-xl font-bold font-sans uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed",
                  )}
                >
                  <Save className="w-4 h-4" />
                  Add Encounter →
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
