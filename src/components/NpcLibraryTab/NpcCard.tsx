import React from 'react';
import { NPC } from '../../types';
import { Loader2, Trash2, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { DebouncedInput } from '../ui/DebouncedInput';
import { DebouncedTextarea } from '../ui/DebouncedTextarea';

// Modular Sub-components
import { NpcCardHeader } from './NpcCardHeader';
import { NpcIRVSection } from './NpcIRVSection';
import { NpcLegendarySection } from './NpcLegendarySection';
import { NpcRechargeSection } from './NpcRechargeSection';
import { StatBlock } from '../ui/StatBlock';
import { parseAbilityScores, parseProficiencies, serializeAbilityScores, serializeProficiencies } from '../../lib/abilityScores';

export interface NpcCardProps {
  npc: NPC;
  isSyncing: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<NPC>) => void;
  onDelete: () => void;
  onResetHp: () => void;
}

export const NpcCard: React.FC<NpcCardProps> = ({
  npc, isSyncing, isExpanded, onToggleExpand, onUpdate, onDelete, onResetHp
}) => {
  const needsReset = npc.currentHp < npc.maxHp;

  return (
    <div className={cn(
      "bg-[#fdfaf5] rounded-2xl border border-[#e5e1d8] overflow-hidden flex flex-col relative group transition-all",
      isExpanded ? "border-[#c5b358]/40" : "hover:border-[#c5b358]/20",
      isSyncing ? "border-[#c5b358] shadow-[0_0_15px_rgba(197,179,88,0.3)] shadow-[#c5b358]/20" : "shadow-sm hover:shadow-md"
    )}>
      {isSyncing && (
        <div className="absolute top-2 right-10 z-20 flex items-center gap-1 bg-[#c5b358] text-[#2c2c26] text-xs uppercase font-bold px-3 py-1 rounded-full shadow-sm animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin"/> Syncing
        </div>
      )}

      <NpcCardHeader
        name={npc.name} ac={npc.ac} maxHp={npc.maxHp} currentHp={npc.currentHp} conditions={npc.conditions}
        isExpanded={isExpanded} onToggleExpand={onToggleExpand} isSyncing={isSyncing}
        onUpdateName={(val) => onUpdate({ name: val })}
      />

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[#e5e1d8]"
          >
            <div className="p-6 flex flex-col gap-6">
              <StatBlock
                abilityScores={parseAbilityScores(npc.abilityScores || '')}
                proficiencies={parseProficiencies(npc.proficiencies || '')}
                readOnly={false}
                onChange={(scores, profs) => {
                  onUpdate({
                    abilityScores: serializeAbilityScores(scores),
                    proficiencies: serializeProficiencies(profs),
                  });
                }}
              />

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 bg-[#fdfaf5] border border-[#e5e1d8] rounded-xl shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">AC</div>
                  <DebouncedInput type="number" value={npc.ac} onFocus={(e) => (e.target as HTMLInputElement).select()} onChange={(v) => onUpdate({ ac: parseInt(v as string, 10) || 0 })} className="text-lg font-bold text-[#2c2c26] w-full text-center bg-transparent border-none focus:ring-0 p-0 disabled:opacity-50" disabled={isSyncing} />
                </div>
                <div className="text-center p-3 bg-[#fdfaf5] border border-[#e5e1d8] rounded-xl shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">Max HP</div>
                  <DebouncedInput type="number" value={npc.maxHp} onFocus={(e) => (e.target as HTMLInputElement).select()} onChange={(v) => onUpdate({ maxHp: parseInt(v as string, 10) || 1 })} className="text-lg font-bold text-[#2c2c26] w-full text-center bg-transparent border-none focus:ring-0 p-0 disabled:opacity-50" disabled={isSyncing} />
                </div>
                <div className="text-center p-3 bg-[#fdfaf5] border border-[#e5e1d8] rounded-xl shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">HP</div>
                  <DebouncedInput type="number" value={npc.currentHp} onFocus={(e) => (e.target as HTMLInputElement).select()} onChange={(v) => onUpdate({ currentHp: parseInt(v as string, 10) || 0 })} className={cn("text-lg font-bold w-full text-center bg-transparent border-none focus:ring-0 p-0 disabled:opacity-50", npc.currentHp <= 0 ? "text-red-600" : "text-[#2c2c26]")} disabled={isSyncing} />
                </div>
                <div className="text-center p-3 bg-[#fdfaf5] border border-[#e5e1d8] rounded-xl shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">Temp</div>
                  <DebouncedInput type="number" value={npc.tempHp} onFocus={(e) => (e.target as HTMLInputElement).select()} onChange={(v) => onUpdate({ tempHp: parseInt(v as string, 10) || 0 })} className="text-lg font-bold text-[#2c2c26] w-full text-center bg-transparent border-none focus:ring-0 p-0 disabled:opacity-50" disabled={isSyncing} />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-[10px] uppercase text-[#5a5a40] font-bold tracking-widest mb-1.5 px-1">Conditions</div>
                  <DebouncedInput type="text" value={npc.conditions || ''} onChange={(v) => onUpdate({ conditions: v as string })} placeholder="None" className="w-full text-xs text-[#2c2c26] bg-[#fdfaf5] p-3 rounded-lg border border-[#e5e1d8] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all placeholder:text-[#cccbcb] disabled:opacity-50" disabled= {isSyncing} />
                </div>

                <NpcIRVSection resistances={npc.resistances || ''} immunities={npc.immunities || ''} vulnerabilities={npc.vulnerabilities || ''} onUpdate={onUpdate} />

                <div>
                  <div className="text-[10px] uppercase text-[#5a5a40] font-bold tracking-widest mb-1.5 px-1">Notes</div>
                  <DebouncedTextarea value={npc.notes || ''} onChange={(v) => onUpdate({ notes: v as string })} placeholder="Special abilities or description..." rows={3} className="w-full text-xs text-[#2c2c26] bg-[#fdfaf5] p-3 rounded-lg border border-[#e5e1d8] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all resize-none placeholder:text-[#cccbcb] disabled:opacity-50 leading-relaxed font-sans" disabled={isSyncing} />
                </div>

                <NpcLegendarySection legendaryActions={npc.legendaryActions} legendaryResistances={npc.legendaryResistances} isSyncing={isSyncing} onUpdate={onUpdate} />

                <NpcRechargeSection
                  rechargeAbilities={npc.rechargeAbilities} isSyncing={isSyncing}
                  onAddAbility={(ability) => onUpdate({ rechargeAbilities: [...(npc.rechargeAbilities || []), ability] })}
                  onRemoveAbility={(idx) => onUpdate({ rechargeAbilities: (npc.rechargeAbilities || []).filter((_, i) => i !== idx) })}
                />
              </div>

              <div className="flex gap-4 pt-2">
                {needsReset && (
                  <button onClick={onResetHp} disabled={isSyncing} className="flex-1 py-3 bg-[#c5b358]/10 text-[#2c2c26] hover:bg-[#c5b358]/20 border border-[#c5b358]/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    <RotateCcw className="w-4 h-4" /> Reset HP
                  </button>
                )}
                <button onClick={onDelete} disabled={isSyncing} className="flex-1 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold uppercase tracking-widest border border-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  <Trash2 className="w-4 h-4" /> Delete NPC
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
