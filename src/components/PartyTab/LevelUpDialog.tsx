import React, { useState, useEffect } from 'react';
import { Character } from '../../types';
import { X, ArrowRight, CheckSquare, Square } from 'lucide-react';

export interface LevelUpDialogProps {
  character: Character;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (updates: Partial<Character>) => void;
}

export const LevelUpDialog: React.FC<LevelUpDialogProps> = ({
  character,
  isOpen,
  onClose,
  onConfirm,
}) => {
  // Section A checklist states (visual only)
  const [chkHp, setChkHp] = useState(false);
  const [chkAc, setChkAc] = useState(false);
  const [chkPerception, setChkPerception] = useState(false);
  const [chkResistances, setChkResistances] = useState(false);
  const [chkOther, setChkOther] = useState(false);

  // Section B updated values states
  const [newLevel, setNewLevel] = useState<number>(character.level + 1);
  const [newMaxHp, setNewMaxHp] = useState<number>(character.maxHp);
  const [alsoIncreaseCurrentHp, setAlsoIncreaseCurrentHp] = useState(true);
  const [newAc, setNewAc] = useState<number>(character.ac);
  const [newPassivePerception, setNewPassivePerception] = useState<number>(character.passivePerception);
  const [newNotes, setNewNotes] = useState<string>(character.notes || '');
  const [newResistances, setNewResistances] = useState<string>(character.resistances || '');
  const [newImmunities, setNewImmunities] = useState<string>(character.immunities || '');
  const [newVulnerabilities, setNewVulnerabilities] = useState<string>(character.vulnerabilities || '');

  // Keep states updated if the input character prop changes while open
  useEffect(() => {
    if (isOpen) {
      setNewLevel(character.level + 1);
      setNewMaxHp(character.maxHp);
      setAlsoIncreaseCurrentHp(true);
      setNewAc(character.ac);
      setNewPassivePerception(character.passivePerception);
      setNewNotes(character.notes || '');
      setNewResistances(character.resistances || '');
      setNewImmunities(character.immunities || '');
      setNewVulnerabilities(character.vulnerabilities || '');

      setChkHp(false);
      setChkAc(false);
      setChkPerception(false);
      setChkResistances(false);
      setChkOther(false);
    }
  }, [character, isOpen]);

  if (!isOpen) return null;

  // Derive HP Gain (can be negative or positive, but we're mostly interested in positive increase)
  const hpIncrease = Math.max(0, newMaxHp - character.maxHp);

  const handleConfirm = () => {
    const updates: Partial<Character> = {
      level: Number(newLevel),
    };

    if (Number(newMaxHp) !== character.maxHp) {
      updates.maxHp = Number(newMaxHp);
    }

    if (alsoIncreaseCurrentHp && hpIncrease > 0) {
      const finalCurrentHp = Math.min(Number(newMaxHp), character.currentHp + hpIncrease);
      if (finalCurrentHp !== character.currentHp) {
        updates.currentHp = finalCurrentHp;
      }
    }

    if (Number(newAc) !== character.ac) {
      updates.ac = Number(newAc);
    }

    if (Number(newPassivePerception) !== character.passivePerception) {
      updates.passivePerception = Number(newPassivePerception);
    }

    if (newResistances !== (character.resistances || '')) {
      updates.resistances = newResistances;
    }

    if (newImmunities !== (character.immunities || '')) {
      updates.immunities = newImmunities;
    }

    if (newVulnerabilities !== (character.vulnerabilities || '')) {
      updates.vulnerabilities = newVulnerabilities;
    }

    if (newNotes !== character.notes) {
      updates.notes = newNotes;
    }

    onConfirm(updates);
  };

  return (
    <div
      id="level-up-overlay"
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="level-up-dialog"
        className="bg-[#fdfaf5] w-full max-w-lg rounded-2xl shadow-2xl border border-[#e5e1d8] overflow-hidden flex flex-col my-8"
      >
        {/* Header */}
        <div className="bg-[#2c2c26] p-5 text-[#e5e1d8] flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold font-serif uppercase tracking-wider text-[#c5b358]">
              Level Up Wizard
            </h2>
            <p className="text-[10px] text-[#5a5a40] font-sans font-bold uppercase tracking-wider mt-0.5">
              {character.characterName} (Level {character.level})
            </p>
          </div>
          <button
            id="close-dialog-btn"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* SECTION A: GM Checklist */}
          <div className="space-y-3" id="checklist-section">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#2c2c26] border-b border-[#e5e1d8] pb-1.5">
              Section A: GM Checklist <span className="text-[9px] font-normal text-[#5a5a40] normal-case tracking-normal">(visual only memory aid)</span>
            </h3>
            
            <div className="space-y-2.5">
              <button
                id="chk-hp-btn"
                onClick={() => setChkHp(!chkHp)}
                className="flex items-start gap-2.5 w-full text-left text-xs text-[#5a5a40] hover:text-[#2c2c26] transition-colors"
              >
                {chkHp ? (
                  <CheckSquare className="w-4 h-4 text-[#c5b358] shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-[#e5e1d8] hover:border-[#c5b358] shrink-0 mt-0.5" />
                )}
                <span>
                  <strong>Ask player:</strong> what is your new Max HP?
                  <span className="block text-[10px] text-gray-400 mt-0.5">(Roll hit die + CON modifier, or take the average)</span>
                </span>
              </button>

              <button
                id="chk-ac-btn"
                onClick={() => setChkAc(!chkAc)}
                className="flex items-start gap-2.5 w-full text-left text-xs text-[#5a5a40] hover:text-[#2c2c26] transition-colors"
              >
                {chkAc ? (
                  <CheckSquare className="w-4 h-4 text-[#c5b358] shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-[#e5e1d8] shrink-0 mt-0.5" />
                )}
                <span>
                  <strong>Ask player:</strong> did your AC change?
                  <span className="block text-[10px] text-gray-400 mt-0.5">(New armor, Unarmored Defense change, magical item, etc.)</span>
                </span>
              </button>

              <button
                id="chk-perc-btn"
                onClick={() => setChkPerception(!chkPerception)}
                className="flex items-start gap-2.5 w-full text-left text-xs text-[#5a5a40] hover:text-[#2c2c26] transition-colors"
              >
                {chkPerception ? (
                  <CheckSquare className="w-4 h-4 text-[#c5b358] shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-[#e5e1d8] shrink-0 mt-0.5" />
                )}
                <span>
                  <strong>Ask player:</strong> did your Passive Perception change?
                  <span className="block text-[10px] text-gray-400 mt-0.5">(Wisdom score increase, new Perception proficiency, etc.)</span>
                </span>
              </button>

              <button
                id="chk-res-btn"
                onClick={() => setChkResistances(!chkResistances)}
                className="flex items-start gap-2.5 w-full text-left text-xs text-[#5a5a40] hover:text-[#2c2c26] transition-colors"
              >
                {chkResistances ? (
                  <CheckSquare className="w-4 h-4 text-[#c5b358] shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-[#e5e1d8] shrink-0 mt-0.5" />
                )}
                <span>
                  <strong>Ask player:</strong> any new resistances, immunities, or special traits to record in Notes?
                </span>
              </button>

              <button
                id="chk-other-btn"
                onClick={() => setChkOther(!chkOther)}
                className="flex items-start gap-2.5 w-full text-left text-xs text-[#5a5a40] hover:text-[#2c2c26] transition-colors"
              >
                {chkOther ? (
                  <CheckSquare className="w-4 h-4 text-[#c5b358] shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-[#e5e1d8] shrink-0 mt-0.5" />
                )}
                <span>
                  <strong>Ask player:</strong> any other stat changes?
                  <span className="block text-[10px] text-gray-400 mt-0.5">(Speed, saving throws, new features, etc. — notes only)</span>
                </span>
              </button>
            </div>
          </div>

          {/* SECTION B: Updated Values */}
          <div className="space-y-4" id="values-section">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#2c2c26] border-b border-[#e5e1d8] pb-1.5">
              Section B: Updated Values
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="new-level-input" className="block text-[9px] font-bold uppercase tracking-wider text-[#5a5a40] mb-1">
                  New Level
                </label>
                <input
                  id="new-level-input"
                  type="number"
                  value={newLevel}
                  onChange={e => setNewLevel(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#faf9f6] border border-[#e5e1d8] rounded-xl px-3 py-2 text-sm outline-none focus:bg-white focus:border-[#c5b358]"
                />
              </div>

              <div>
                <label htmlFor="new-ac-input" className="block text-[9px] font-bold uppercase tracking-wider text-[#5a5a40] mb-1">
                  New AC
                </label>
                <input
                  id="new-ac-input"
                  type="number"
                  value={newAc}
                  onChange={e => setNewAc(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#faf9f6]/50 border border-[#e5e1d8] rounded-xl px-3 py-2 text-sm outline-none focus:bg-white focus:border-[#c5b358]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-[#fdfaf5] border border-[#e5e1d8] rounded-2xl p-4">
              <div>
                <label htmlFor="new-max-hp-input" className="block text-[9px] font-bold uppercase tracking-wider text-[#5a5a40] mb-1">
                  New Max HP
                </label>
                <input
                  id="new-max-hp-input"
                  type="number"
                  value={newMaxHp}
                  onChange={e => setNewMaxHp(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#faf9f6] border border-[#e5e1d8] rounded-xl px-3 py-2 text-sm outline-none focus:bg-white focus:border-[#c5b358]"
                />
              </div>

              <div>
                <span className="block text-[9px] font-bold uppercase tracking-wider text-[#5a5a40] mb-1">
                  HP Increase
                </span>
                <div className="bg-gray-100/70 text-gray-700 rounded-xl px-3 py-2 text-sm font-bold border border-[#e5e1d8] h-[38px] flex items-center justify-between">
                  <span id="hp-increase-display">{hpIncrease}</span>
                  <span className="text-[9px] font-normal text-gray-400">gained this level</span>
                </div>
              </div>

              <div className="col-span-2">
                <label
                  htmlFor="also-increase-hp"
                  className="flex items-center gap-2.5 text-xs text-[#5a5a40] select-none cursor-pointer hover:text-[#2c2c26]"
                >
                  <input
                    id="also-increase-hp"
                    type="checkbox"
                    checked={alsoIncreaseCurrentHp}
                    onChange={e => setAlsoIncreaseCurrentHp(e.target.checked)}
                    className="w-4 h-4 accent-[#c5b358] cursor-pointer"
                  />
                  <span>
                    Also increase Current HP by <strong className="text-[#c5b358]">{hpIncrease}</strong>
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="new-passive-perception" className="block text-[9px] font-bold uppercase tracking-wider text-[#5a5a40] mb-1">
                  New Passive Perception
                </label>
                <input
                  id="new-passive-perception"
                  type="number"
                  value={newPassivePerception}
                  onChange={e => setNewPassivePerception(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#faf9f6]/50 border border-[#e5e1d8] rounded-xl px-3 py-2 text-sm outline-none focus:bg-white focus:border-[#c5b358]"
                />
              </div>

              <div>
                <label htmlFor="new-resistances" className="block text-[9px] font-bold uppercase tracking-wider text-[#5a5a40] mb-1">
                  Resistances
                </label>
                <input
                  id="new-resistances"
                  type="text"
                  value={newResistances}
                  onChange={e => setNewResistances(e.target.value)}
                  placeholder="e.g. fire, poison"
                  className="w-full bg-[#faf9f6]/50 border border-[#e5e1d8] rounded-xl px-3 py-2 text-sm outline-none focus:bg-white focus:border-[#c5b358]"
                />
              </div>

              <div>
                <label htmlFor="new-immunities" className="block text-[9px] font-bold uppercase tracking-wider text-[#5a5a40] mb-1">
                  Immunities
                </label>
                <input
                  id="new-immunities"
                  type="text"
                  value={newImmunities}
                  onChange={e => setNewImmunities(e.target.value)}
                  placeholder="e.g. poison, conditions"
                  className="w-full bg-[#faf9f6]/50 border border-[#e5e1d8] rounded-xl px-3 py-2 text-sm outline-none focus:bg-white focus:border-[#c5b358]"
                />
              </div>

              <div>
                <label htmlFor="new-vulnerabilities" className="block text-[9px] font-bold uppercase tracking-wider text-[#5a5a40] mb-1">
                  Vulnerabilities
                </label>
                <input
                  id="new-vulnerabilities"
                  type="text"
                  value={newVulnerabilities}
                  onChange={e => setNewVulnerabilities(e.target.value)}
                  placeholder="e.g. bludgeoning"
                  className="w-full bg-[#faf9f6]/50 border border-[#e5e1d8] rounded-xl px-3 py-2 text-sm outline-none focus:bg-white focus:border-[#c5b358]"
                />
              </div>

              <div>
                <label htmlFor="new-notes" className="block text-[9px] font-bold uppercase tracking-wider text-[#5a5a40] mb-1">
                  Notes
                </label>
                <textarea
                  id="new-notes"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Record level up traits, feats, spell choices..."
                  className="w-full bg-[#faf9f6] border border-[#e5e1d8] rounded-xl px-3 py-2 text-xs italic outline-none focus:bg-white focus:border-[#c5b358] h-20 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#f5f5f0] border-t border-[#e5e1d8] p-4 flex justify-end gap-3 px-6">
          <button
            id="cancel-dialog-btn"
            onClick={onClose}
            className="px-4 py-2 hover:bg-gray-200 text-[#5a5a40] rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="confirm-level-up-btn"
            onClick={handleConfirm}
            className="px-5 py-2 bg-[#c5b358] hover:bg-[#b09e4b] text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer"
          >
            Confirm Level Up <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
