import React, { useEffect, useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Character } from '../../types';
import { cn } from '../../lib/utils';
import { useFormState } from '../../hooks/useFormState';

interface NewPlayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (character: Omit<Character, 'id' | 'sheetRowIndex'>) => void;
}

type TabId = 'identity' | 'combat' | 'abilities' | 'resources';

const TABS: { id: TabId; label: string; optional?: boolean }[] = [
  { id: 'identity', label: 'Identity' },
  { id: 'combat', label: 'Combat Stats', optional: true },
  { id: 'abilities', label: 'Abilities', optional: true },
  { id: 'resources', label: 'Resources', optional: true },
];

export function NewPlayerDialog({ isOpen, onClose, onConfirm }: NewPlayerDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>('identity');

  const { values: formData, handleChange, reset } = useFormState({
    playerName: '',
    characterName: '',
    class: '',
    level: 1,
    statusId: 1, // Active
  });

  useEffect(() => {
    if (!isOpen) {
      reset();
      setActiveTab('identity');
    }
  }, [isOpen, reset]);

  const isTab1Valid = formData.playerName.trim() !== '' && formData.characterName.trim() !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTab1Valid) return;

    onConfirm({
      playerName: formData.playerName,
      characterName: formData.characterName,
      level: formData.level,
      class: formData.class,
      statusId: formData.statusId,
      statusName: formData.statusId === 1 ? 'Active' : formData.statusId === 2 ? 'Inactive' : 'Deceased',
      // Hardcoded defaults for uncollected fields:
      ac: 10,
      maxHp: 10,
      currentHp: 10,
      tempHp: 0,
      tempHpMax: 0,
      conditions: '',
      isActive: formData.statusId === 1,
      passivePerception: 10,
      notes: '',
      resistances: '',
      immunities: '',
      vulnerabilities: '',
      tempAc: 0,
      deathSavesFails: 0,
      deathSavesSuccesses: 0,
      hitDiceConfig: '',
      hitDiceUsed: '{}',
      abilityScores: '{}',
      proficiencies: '{}',
      resourcePools: '[]',
    });
  };

  const handleNext = () => {
    const currentIndex = TABS.findIndex(t => t.id === activeTab);
    if (currentIndex < TABS.length - 1) setActiveTab(TABS[currentIndex + 1].id);
  };

  const handlePrev = () => {
    const currentIndex = TABS.findIndex(t => t.id === activeTab);
    if (currentIndex > 0) setActiveTab(TABS[currentIndex - 1].id);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#1a1a12] w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl border border-stone-700 flex flex-col mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-700">
              <div className="flex items-center gap-3">
                <UserPlus className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-stone-100">Add Character</h2>
              </div>
              <button
                onClick={onClose}
                className="text-stone-400 hover:text-stone-200 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-stone-700 px-6 flex items-center overflow-x-auto no-scrollbar">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "px-4 py-3 text-sm transition-colors relative whitespace-nowrap",
                      isActive ? "text-amber-400 border-b-2 border-amber-400 font-medium" : "text-stone-400 hover:text-stone-300"
                    )}
                  >
                    {tab.label}
                    {!tab.optional && (
                      <span className="text-[10px] text-amber-500/70 ml-1.5">(required)</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Form Content Area */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col min-h-0">
              <div className="flex-1 px-6 py-5">
                {activeTab === 'identity' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-400 mb-1.5">
                        Player Name
                      </label>
                      <input
                        type="text"
                        value={formData.playerName}
                        onChange={e => handleChange('playerName', e.target.value)}
                        placeholder="e.g. Sarah"
                        required
                        className="w-full bg-[#2c2c26] border border-stone-700 rounded-lg px-4 py-2 text-sm text-stone-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder:text-stone-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-400 mb-1.5">
                        Character Name
                      </label>
                      <input
                        type="text"
                        value={formData.characterName}
                        onChange={e => handleChange('characterName', e.target.value)}
                        placeholder="e.g. Drogar"
                        required
                        className="w-full bg-[#2c2c26] border border-stone-700 rounded-lg px-4 py-2 text-sm text-stone-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder:text-stone-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-400 mb-1.5">
                        Class
                      </label>
                      <input
                        type="text"
                        value={formData.class}
                        onChange={e => handleChange('class', e.target.value)}
                        placeholder="e.g. Barbarian, Monk, Vitalist"
                        className="w-full bg-[#2c2c26] border border-stone-700 rounded-lg px-4 py-2 text-sm text-stone-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder:text-stone-500"
                      />
                      <p className="text-[11px] text-stone-500 mt-1">
                        Used to suggest starting resources on the Resources tab
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-400 mb-1.5">
                          Level
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={formData.level}
                          onChange={e => handleChange('level', parseInt(e.target.value) || 1)}
                          className="w-full bg-[#2c2c26] border border-stone-700 rounded-lg px-4 py-2 text-sm text-stone-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-400 mb-1.5">
                          Status
                        </label>
                        <select
                          value={formData.statusId}
                          onChange={e => handleChange('statusId', parseInt(e.target.value))}
                          className="w-full bg-[#2c2c26] border border-stone-700 rounded-lg px-4 py-2 text-sm text-stone-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value={1}>Active</option>
                          <option value={2}>Inactive</option>
                          <option value={3}>Deceased</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'combat' && (
                  <div className="flex items-center justify-center h-48 text-stone-500 text-sm">
                    Combat Stats — coming soon
                  </div>
                )}
                {activeTab === 'abilities' && (
                  <div className="flex items-center justify-center h-48 text-stone-500 text-sm">
                    Abilities — coming soon
                  </div>
                )}
                {activeTab === 'resources' && (
                  <div className="flex items-center justify-center h-48 text-stone-500 text-sm">
                    Resources — coming soon
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-stone-700 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  {activeTab !== 'identity' && (
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="text-sm text-stone-400 hover:text-stone-200 px-2 py-1"
                    >
                      ← Previous
                    </button>
                  )}
                  {activeTab !== 'resources' && (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="text-sm text-stone-400 hover:text-stone-200 px-2 py-1"
                    >
                      Next →
                    </button>
                  )}
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-sm text-stone-400 hover:text-stone-200 mr-3 px-3 py-2 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isTab1Valid}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-stone-700 disabled:text-stone-500"
                  >
                    Add Character
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
