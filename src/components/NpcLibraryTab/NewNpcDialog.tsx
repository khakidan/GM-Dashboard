import React, { useEffect, useState } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NPC } from '../../types';
import { cn } from '../../lib/utils';
import { NpcFormFields, NpcFormData, DEFAULT_NPC_FORM_DATA } from './NpcFormFields';

interface NewNpcDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (npc: Omit<NPC, 'id'>) => void;
}

export function NewNpcDialog({ isOpen, onClose, onConfirm }: NewNpcDialogProps) {
  const [formData, setFormData] = useState<NpcFormData>(DEFAULT_NPC_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      setFormData(DEFAULT_NPC_FORM_DATA);
      setErrors({});
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // ... basic validation logic
    if (formData.name.trim() === '') return;

    // Validate recharge abilities
    const newErrors: Record<string, string> = {};
    formData.rechargeAbilities.forEach(ability => {
      if (!ability.name.trim()) {
        newErrors[ability.id] = 'Ability name is required.';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onConfirm({
      name: formData.name,
      ac: Number(formData.ac),
      maxHp: Number(formData.maxHp),
      tempHp: 0,
      currentHp: Number(formData.maxHp),
      conditions: '',
      notes: formData.notes,
      resistances: formData.resistances,
      immunities: formData.immunities,
      vulnerabilities: formData.vulnerabilities,
      legendaryActions: formData.legendaryActions,
      legendaryResistances: formData.legendaryResistances,
      rechargeAbilities: formData.rechargeAbilities.map(r => ({ name: r.name, rechargeOn: r.rechargeOn })),
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
              <NpcFormFields data={formData} onChange={setFormData} errors={errors} />

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-[#e5e1d8] hover:bg-[#d4cfc1] text-[#2c2c26] py-3.5 rounded-xl font-bold font-sans uppercase tracking-widest text-xs transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#c5b358] hover:bg-[#b0a04f] text-[#2c2c26] py-3.5 rounded-xl font-bold font-sans uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
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
