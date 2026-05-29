import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flame } from 'lucide-react';
import { Combatant } from '../../types';

export interface CasterAttributionDialogProps {
  isOpen: boolean;
  effectName: string;
  targetName: string;
  combatants: Combatant[];
  onSelect: (casterId: string) => void;
  onDismiss: () => void;
}

export function CasterAttributionDialog({
  isOpen,
  effectName,
  targetName,
  combatants,
  onSelect,
  onDismiss,
}: CasterAttributionDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#2c2c26]/60 backdrop-blur-sm"
            onClick={onDismiss}
            id="caster-attribution-overlay"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#fdfaf5] w-full max-w-md rounded-2xl shadow-2xl border border-[#e5e1d8] overflow-hidden flex flex-col relative z-20"
            id="caster-attribution-modal"
          >
            <div className="bg-[#2c2c26] p-5 text-[#e5e1d8] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-[#c5b358]" />
                <h2 className="text-lg font-bold font-serif uppercase tracking-wider">Caster Attribution</h2>
              </div>
              <button
                onClick={onDismiss}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                title="Dismiss"
                id="caster-attribution-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div>
                <h3 className="text-base font-bold text-[#2c2c26] font-serif uppercase tracking-normal">
                  Who is concentrating on {effectName}?
                </h3>
                <p className="text-sm text-[#5a5a40] mt-1">
                  Target: <span className="font-semibold">{targetName}</span>
                </p>
              </div>

              {/* Scrollable list of combatants */}
              <div className="max-h-60 overflow-y-auto space-y-2 border border-[#e5e1d8] rounded-xl p-3 bg-white" id="caster-list">
                {combatants.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelect(c.id)}
                    className="w-full text-left px-4 py-2.5 rounded-lg border border-[#e5e1d8] hover:border-[#c5b358] hover:bg-[#fcfbf9] font-sans text-sm font-medium transition-all text-[#2c2c26] flex justify-between items-center group cursor-pointer"
                    id={`caster-option-${c.id}`}
                  >
                    <span>{c.name}</span>
                    <span className="text-xs uppercase tracking-wider font-semibold text-[#5a5a40]/60 bg-[#f5f5f0] group-hover:bg-[#c5b358]/10 group-hover:text-[#c5b358] px-2 py-0.5 rounded transition-all">
                      {c.type === 'pc' ? 'PC' : 'NPC'}
                    </span>
                  </button>
                ))}
                {combatants.length === 0 && (
                  <p className="text-xs text-[#5a5a40]/60 italic text-center py-4">No combatants available</p>
                )}
              </div>

              {/* Dismiss (already applied) button */}
              <button
                onClick={onDismiss}
                className="w-full py-2.5 px-4 bg-[#f5f5f0] border border-[#e5e1d8] hover:bg-[#e4e1d6] hover:border-[#cbc6b8] text-[#5a5a40] font-bold text-sm rounded-xl transition-all uppercase tracking-wider cursor-pointer"
                id="caster-dismiss-btn"
              >
                Dismiss (already applied)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
