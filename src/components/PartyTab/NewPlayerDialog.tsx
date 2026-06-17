import React, { useEffect, useState, useMemo } from 'react';
import { X, UserPlus, Shield, Heart, Eye, Star, Info, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Character } from '../../types';
import { cn } from '../../lib/utils';
import { IrvMultiSelect } from '../ui/IrvMultiSelect';
import { useFormState } from '../../hooks/useFormState';
import { parseHitDiceConfig, suggestHitDiceConfig } from '../../lib/hitDice';

interface NewPlayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (character: Omit<Character, 'id' | 'sheetRowIndex'>) => void;
}

export function NewPlayerDialog({ isOpen, onClose, onConfirm }: NewPlayerDialogProps) {
  const { values: formData, handleChange, reset } = useFormState({
    playerName: '',
    characterName: '',
    class: '',
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

  const [hitDiceConfig, setHitDiceConfig] = useState('');
  const [hitDiceError, setHitDiceError] = useState('');
  const [isHitDiceTouched, setIsHitDiceTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      reset();
      setHitDiceConfig('');
      setHitDiceError('');
      setIsHitDiceTouched(false);
    }
  }, [isOpen, reset]);

  const handleHitDiceChange = (val: string) => {
    setHitDiceConfig(val);
    setIsHitDiceTouched(true);
    if (!val.trim()) {
      setHitDiceError('');
    } else {
      const parsed = parseHitDiceConfig(val);
      if (parsed.length === 0) {
        setHitDiceError('Invalid format. Use [count]d[size], e.g. 7d8 or 4d12+3d10');
      } else {
        setHitDiceError('');
      }
    }
  };

  const classValue = formData.class;
  const levelValue = formData.level;

  const suggestedConfig = useMemo(() => {
    return suggestHitDiceConfig(classValue, Number(levelValue));
  }, [classValue, levelValue]);

  useEffect(() => {
    if (!isHitDiceTouched && suggestedConfig) {
      setHitDiceConfig(suggestedConfig);
    }
  }, [suggestedConfig, isHitDiceTouched]);

  const isFormValid = formData.playerName.trim() !== '' && 
                      formData.characterName.trim() !== '' && 
                      formData.maxHp > 0 &&
                      !hitDiceError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    onConfirm({
      playerName: formData.playerName,
      characterName: formData.characterName,
      level: formData.level,
      class: formData.class,
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
      hitDiceConfig: hitDiceConfig.trim(),
      hitDiceUsed: '{}',
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
                      onChange={e => handleChange('playerName', e.target.value)}
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
                      onChange={e => handleChange('characterName', e.target.value)}
                      placeholder="e.g. Caleb"
                      className="w-full bg-white border border-[#e5e1d8] rounded-xl px-4 py-3 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all font-serif italic"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                      Class
                    </label>
                    <input
                      id="new-character-class"
                      type="text"
                      value={formData.class}
                      onChange={e => handleChange('class', e.target.value)}
                      placeholder="e.g. Barbarian or Barbarian / Fighter"
                      className="w-full bg-white border border-[#e5e1d8] rounded-xl px-4 py-3 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all"
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
                        onChange={e => handleChange('level', parseInt(e.target.value) || 0)}
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
                        onChange={e => handleChange('ac', parseInt(e.target.value) || 0)}
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
                        onChange={e => handleChange('maxHp', parseInt(e.target.value) || 0)}
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
                        onChange={e => handleChange('passivePerception', parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-[#e5e1d8] rounded-xl pl-10 pr-4 py-3 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                      Hit Dice
                    </label>
                    <input
                      id="new-character-hitdice"
                      type="text"
                      value={hitDiceConfig}
                      onChange={e => handleHitDiceChange(e.target.value)}
                      placeholder="e.g. 7d8 or 4d12+3d10"
                      className="w-full bg-white border border-[#e5e1d8] rounded-xl px-4 py-3 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all font-mono"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 px-1">
                      Format: [count]d[size]. Separate multiple pools with +.
                    </p>
                    {hitDiceError && (
                      <p id="hitdice-error-msg" className="text-xs text-red-500 mt-1 px-1">
                        {hitDiceError}
                      </p>
                    )}
                    {suggestedConfig && suggestedConfig !== hitDiceConfig && (
                      <div className="flex items-center gap-1.5 mt-1 text-xs">
                        <span className="text-gray-500">Suggested: <code className="bg-[#2c2c26]/5 px-1 py-0.5 rounded font-mono text-[11px]">{suggestedConfig}</code></span>
                        <button
                          id="use-suggestion-btn"
                          type="button"
                          onClick={() => handleHitDiceChange(suggestedConfig)}
                          className="text-[#c5b358] hover:text-[#b0a04f] font-bold cursor-pointer underline decoration-dotted text-xs"
                        >
                          Use suggestion
                        </button>
                      </div>
                    )}
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
                    onChange={e => handleChange('statusId', parseInt(e.target.value))}
                    className="w-full bg-white border border-[#e5e1d8] rounded-xl px-4 py-3 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value={1}>Active</option>
                    <option value={2}>Inactive</option>
                    <option value={3}>Deceased</option>
                  </select>
                </div>
                <IrvMultiSelect
                  label="Resistances"
                  value={formData.resistances}
                  onChange={v => handleChange('resistances', v)}
                  placeholder="e.g. fire, cold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <IrvMultiSelect
                  label="Immunities"
                  value={formData.immunities}
                  onChange={v => handleChange('immunities', v)}
                  placeholder="e.g. poison, charmed"
                />
                <IrvMultiSelect
                  label="Vulnerabilities"
                  value={formData.vulnerabilities}
                  onChange={v => handleChange('vulnerabilities', v)}
                  placeholder="e.g. thunder"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                  Notes
                </label>
                <textarea
                  id="new-character-notes"
                  value={formData.notes}
                  onChange={e => handleChange('notes', e.target.value)}
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
