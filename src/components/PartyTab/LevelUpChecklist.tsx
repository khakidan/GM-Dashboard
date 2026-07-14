import React from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { SectionHeader } from '../ui/SectionHeader';

export interface LevelUpChecklistProps {
  chkHp: boolean;
  setChkHp: (val: boolean) => void;
  chkAc: boolean;
  setChkAc: (val: boolean) => void;
  chkPerception: boolean;
  setChkPerception: (val: boolean) => void;
  chkResistances: boolean;
  setChkResistances: (val: boolean) => void;
  chkOther: boolean;
  setChkOther: (val: boolean) => void;
}

export const LevelUpChecklist: React.FC<LevelUpChecklistProps> = ({
  chkHp,
  setChkHp,
  chkAc,
  setChkAc,
  chkPerception,
  setChkPerception,
  chkResistances,
  setChkResistances,
  chkOther,
  setChkOther,
}) => {
  return (
    <div className="space-y-3" id="checklist-section">
      <SectionHeader>
        Section A: GM Checklist <span className="text-[9px] font-normal text-[#8d8db9] normal-case tracking-normal">(visual only memory aid)</span>
      </SectionHeader>
      
      <div className="space-y-2.5">
        <button
          id="chk-hp-btn"
          onClick={() => setChkHp(!chkHp)}
          className="flex items-start gap-2.5 w-full text-left text-xs text-[#8d8db9] hover:text-[#0f172a] transition-colors"
        >
          {chkHp ? (
            <CheckSquare className="w-4 h-4 text-[#2563eb] shrink-0 mt-0.5" />
          ) : (
            <Square className="w-4 h-4 text-[#e2e8f0] hover:border-[#2563eb] shrink-0 mt-0.5" />
          )}
          <span>
            <strong>Ask player:</strong> what is your new Max HP?
            <span className="block text-[10px] text-gray-400 mt-0.5">(Roll hit die + CON modifier, or take the average)</span>
          </span>
        </button>

        <button
          id="chk-ac-btn"
          onClick={() => setChkAc(!chkAc)}
          className="flex items-start gap-2.5 w-full text-left text-xs text-[#8d8db9] hover:text-[#0f172a] transition-colors"
        >
          {chkAc ? (
            <CheckSquare className="w-4 h-4 text-[#2563eb] shrink-0 mt-0.5" />
          ) : (
            <Square className="w-4 h-4 text-[#e2e8f0] shrink-0 mt-0.5" />
          )}
          <span>
            <strong>Ask player:</strong> did your AC change?
            <span className="block text-[10px] text-gray-400 mt-0.5">(New armor, Unarmored Defense change, magical item, etc.)</span>
          </span>
        </button>

        <button
          id="chk-perc-btn"
          onClick={() => setChkPerception(!chkPerception)}
          className="flex items-start gap-2.5 w-full text-left text-xs text-[#8d8db9] hover:text-[#0f172a] transition-colors"
        >
          {chkPerception ? (
            <CheckSquare className="w-4 h-4 text-[#2563eb] shrink-0 mt-0.5" />
          ) : (
            <Square className="w-4 h-4 text-[#e2e8f0] shrink-0 mt-0.5" />
          )}
          <span>
            <strong>Ask player:</strong> did your Passive Perception change?
            <span className="block text-[10px] text-gray-400 mt-0.5">(Wisdom score increase, new Perception proficiency, etc.)</span>
          </span>
        </button>

        <button
          id="chk-res-btn"
          onClick={() => setChkResistances(!chkResistances)}
          className="flex items-start gap-2.5 w-full text-left text-xs text-[#8d8db9] hover:text-[#0f172a] transition-colors"
        >
          {chkResistances ? (
            <CheckSquare className="w-4 h-4 text-[#2563eb] shrink-0 mt-0.5" />
          ) : (
            <Square className="w-4 h-4 text-[#e2e8f0] shrink-0 mt-0.5" />
          )}
          <span>
            <strong>Ask player:</strong> any new resistances, immunities, or special traits to record in Notes?
          </span>
        </button>

        <button
          id="chk-other-btn"
          onClick={() => setChkOther(!chkOther)}
          className="flex items-start gap-2.5 w-full text-left text-xs text-[#8d8db9] hover:text-[#0f172a] transition-colors"
        >
          {chkOther ? (
            <CheckSquare className="w-4 h-4 text-[#2563eb] shrink-0 mt-0.5" />
          ) : (
            <Square className="w-4 h-4 text-[#e2e8f0] shrink-0 mt-0.5" />
          )}
          <span>
            <strong>Ask player:</strong> any other stat changes?
            <span className="block text-[10px] text-gray-400 mt-0.5">(Speed, saving throws, new features, etc. — notes only)</span>
          </span>
        </button>
      </div>
    </div>
  );
};
