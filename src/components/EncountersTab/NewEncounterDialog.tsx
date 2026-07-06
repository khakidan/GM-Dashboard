import React, { useEffect } from 'react';
import { Sword, MapPin, Trophy, Save } from 'lucide-react';
import { DifficultyLevel } from '../../types';
import { cn } from '../../lib/utils';
import { useFormState } from '../../hooks/useFormState';
import { DialogShell } from '../ui/DialogShell';

interface NewEncounterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { name: string; location: string; difficultyId: number }) => void;
  difficulties: DifficultyLevel[];
}

export function NewEncounterDialog({ isOpen, onClose, onConfirm, difficulties }: NewEncounterDialogProps) {
  const { values: formData, handleChange, reset } = useFormState({
    name: '',
    location: '',
    difficultyId: 1, // Default Easy
  });

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const isFormValid = formData.name.trim() !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    onConfirm(formData);
  };

  return (
    <DialogShell
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-lg"
      zIndex="z-[100]"
      title="Plan New Encounter"
      icon={<Sword className="w-6 h-6 text-[#2563eb]" />}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-[#8d8db9] mb-1.5 px-1">
              Encounter Name <span className="text-red-500">*</span>
            </label>
            <input
              id="new-encounter-name"
              type="text"
              required
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="e.g. Goblin Ambush"
              className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all font-serif"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-[#8d8db9] mb-1.5 px-1">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8db9] opacity-50" />
              <input
                id="new-encounter-location"
                type="text"
                value={formData.location}
                onChange={e => handleChange('location', e.target.value)}
                placeholder="e.g. Whispering Woods"
                className="w-full bg-white border border-[#e2e8f0] rounded-xl pl-10 pr-4 py-3 text-sm focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-[#8d8db9] mb-1.5 px-1">
              Difficulty <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2563eb] opacity-50" />
              <select
                id="new-encounter-difficulty"
                value={formData.difficultyId}
                onChange={e => handleChange('difficultyId', parseInt(e.target.value))}
                className="w-full bg-white border border-[#e2e8f0] rounded-xl pl-10 pr-4 py-3 text-sm focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all appearance-none cursor-pointer font-bold"
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
            className="flex-1 bg-[#e2e8f0] hover:bg-[#d4cfc1] text-[#0f172a] py-3.5 rounded-xl font-bold font-sans uppercase tracking-widest text-xs transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            id="confirm-add-encounter-btn"
            type="submit"
            disabled={!isFormValid}
            className={cn(
              "flex-1 bg-[#2563eb] hover:bg-[#567eff] text-white py-3.5 rounded-xl font-bold font-sans uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed",
            )}
          >
            <Save className="w-4 h-4" />
            Add Encounter →
          </button>
        </div>
      </form>
    </DialogShell>
  );
}
