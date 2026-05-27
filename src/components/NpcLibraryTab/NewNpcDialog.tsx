import React, { useState } from 'react';
import { X, UserPlus, Shield, Heart, Info, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NPC } from '../../types';
import { cn } from '../../lib/utils';
import { IrvMultiSelect } from '../ui/IrvMultiSelect';

interface NewNpcDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (npc: Omit<NPC, 'id'>) => void;
}

export function NewNpcDialog({ isOpen, onClose, onConfirm }: NewNpcDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    ac: 10,
    maxHp: 10,
    notes: '',
    resistances: '',
    immunities: '',
    vulnerabilities: '',
  });

  const isFormValid = formData.name.trim() !== '' && formData.maxHp > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    onConfirm({
      name: formData.name,
      ac: formData.ac,
      maxHp: formData.maxHp,
      tempHp: 0,
      currentHp: formData.maxHp,
      conditions: '',
      notes: formData.notes,
      resistances: formData.resistances,
      immunities: formData.immunities,
      vulnerabilities: formData.vulnerabilities,
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
            className="bg-[#fdfaf5] w-full max-w-xl rounded-2xl shadow-2xl border border-[#e5e1d8] overflow-hidden flex flex-col relative z-10"
          >
            <div className="bg-[#2c2c26] p-6 text-[#e5e1d8] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-[#c5b358]" />
                <h2 className="text-xl font-bold font-serif uppercase tracking-wider">Add New NPC</h2>
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
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                    NPC Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="new-npc-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ancient Red Dragon"
                    className="w-full bg-white border border-[#e5e1d8] rounded-xl px-4 py-3 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all font-serif italic"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                      AC <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a40] opacity-50" />
                      <input
                        id="new-npc-ac"
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
                        id="new-npc-maxhp"
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
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <IrvMultiSelect
                  label="Resistances"
                  value={formData.resistances}
                  onChange={v => setFormData({ ...formData, resistances: v })}
                  placeholder="e.g. fire"
                />
                <IrvMultiSelect
                  label="Immunities"
                  value={formData.immunities}
                  onChange={v => setFormData({ ...formData, immunities: v })}
                  placeholder="e.g. poison"
                />
                <IrvMultiSelect
                  label="Vulnerabilities"
                  value={formData.vulnerabilities}
                  onChange={v => setFormData({ ...formData, vulnerabilities: v })}
                  placeholder="e.g. cold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                  Notes
                </label>
                <textarea
                  id="new-npc-notes"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Special abilities or description..."
                  rows={3}
                  className="w-full bg-white border border-[#e5e1d8] rounded-xl px-4 py-3 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  id="cancel-new-npc-btn"
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-[#e5e1d8] hover:bg-[#d4cfc1] text-[#2c2c26] py-3.5 rounded-xl font-bold font-sans uppercase tracking-widest text-xs transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  id="confirm-add-npc-btn"
                  type="submit"
                  disabled={!isFormValid}
                  className={cn(
                    "flex-1 bg-[#c5b358] hover:bg-[#b0a04f] text-[#2c2c26] py-3.5 rounded-xl font-bold font-sans uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed",
                  )}
                >
                  <Save className="w-4 h-4" />
                  Add NPC →
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
