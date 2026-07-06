import React, { useEffect, useState } from 'react';
import { UserPlus, Save } from 'lucide-react';
import { NPC } from '../../types';
import { NpcFormFields, NpcFormData, DEFAULT_NPC_FORM_DATA } from '../ui/NpcFormFields';
import {
  proficiencyBonusFromCR,
  parseProficiencies,
  serializeProficiencies,
} from '../../lib/abilityScores';
import { DialogShell } from '../ui/DialogShell';

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
      abilityScores: formData.abilityScores,
      proficiencies: (() => {
        // Embed CR-derived proficiency bonus into
        // proficiencies JSON before saving.
        // This ensures the stored proficiencies
        // reflect the NPC's actual CR even if the
        // GM did not manually edit the prof bonus.
        try {
          const parsed = parseProficiencies(
            formData.proficiencies
          );
          parsed.proficiencyBonus =
            proficiencyBonusFromCR(
              formData.challengeRating
            );
          return serializeProficiencies(parsed);
        } catch {
          return formData.proficiencies;
        }
      })(),
      speed: formData.speed,
      senses: formData.senses,
      languages: formData.languages,
      challengeRating: formData.challengeRating,
      traits: formData.traits || '[]',
      actions: formData.actions || '[]',
      reactions: formData.reactions || '[]',
      legendaryActionsList: formData.legendaryActionsList || '[]',
    });
  };

  return (
    <DialogShell
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-xl"
      zIndex="z-[100]"
      title="Add New NPC"
      icon={<UserPlus className="w-6 h-6 text-[#2563eb]" />}
    >
      <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto max-h-[70vh]">
        <NpcFormFields data={formData} onChange={setFormData} errors={errors} />

        <div className="pt-4 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-[#e2e8f0] hover:bg-[#d4cfc1] text-[#0f172a] py-3.5 rounded-xl font-bold font-sans uppercase tracking-widest text-xs transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-[#2563eb] hover:bg-[#567eff] text-white py-3.5 rounded-xl font-bold font-sans uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Add NPC →
          </button>
        </div>
      </form>
    </DialogShell>
  );
}
