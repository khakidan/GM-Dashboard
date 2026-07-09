import React, { useState } from 'react';
import { Flame } from 'lucide-react';
import { Combatant } from '../../types';
import { DialogShell } from '../ui/DialogShell';
import { isConcentrating } from '../../lib/conditions';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';

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
  const [pendingCasterId, setPendingCasterId] = useState<string | null>(null);

  const handleCasterClick = (c: Combatant) => {
    if (isConcentrating(c.conditions)) {
      setPendingCasterId(c.id);
    } else {
      onSelect(c.id);
    }
  };

  return (
    <DialogShell
      isOpen={isOpen}
      onClose={onDismiss}
      maxWidth="max-w-md"
      zIndex="z-[110]"
      title="Caster Attribution"
      icon={<Flame className="w-5 h-5 text-[#2563eb]" />}
    >
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-base font-bold text-[#0f172a] font-serif uppercase tracking-normal">
            Who is concentrating on {effectName}?
          </h3>
          <p className="text-sm text-[#8d8db9] mt-1">
            Target: <span className="font-semibold">{targetName}</span>
          </p>
        </div>

        {/* Scrollable list of combatants */}
        <div className="max-h-60 overflow-y-auto space-y-2 border border-[#e2e8f0] rounded-xl p-3 bg-white">
          {combatants.map((c) => (
            <button
              key={c.id}
              onClick={() => handleCasterClick(c)}
              className="w-full text-left px-4 py-2.5 rounded-lg border border-[#e2e8f0] hover:border-[#2563eb] hover:bg-[#f9f8ff] font-sans text-sm font-medium transition-all text-[#0f172a] flex justify-between items-center group cursor-pointer"
            >
              <span>{c.name}</span>
              <span className="text-xs uppercase tracking-wider font-semibold text-[#8d8db9]/60 bg-[#e2e8f0] group-hover:bg-[#2563eb]/10 group-hover:text-[#2563eb] px-2 py-0.5 rounded transition-all">
                {c.type === 'pc' ? 'PC' : 'NPC'}
              </span>
            </button>
          ))}
          {combatants.length === 0 && (
            <p className="text-xs text-[#8d8db9]/60 italic text-center py-4">No combatants available</p>
          )}
        </div>

        {/* Dismiss (already applied) button */}
        <button
          onClick={onDismiss}
          className="w-full py-2.5 px-4 bg-[#e2e8f0] border border-[#e2e8f0] hover:bg-[#e4e1d6] hover:border-[#cbc6b8] text-[#8d8db9] font-bold text-sm rounded-xl transition-all uppercase tracking-wider cursor-pointer"
        >
          Dismiss (already applied)
        </button>

        <ConfirmationDialog
          isOpen={pendingCasterId !== null}
          title="Already Concentrating?"
          description={(() => {
            const pendingCaster = combatants.find(c => c.id === pendingCasterId);
            return pendingCaster ? `${pendingCaster.name} is already concentrating. End previous and start new?` : '';
          })()}
          confirmLabel="End Previous & Start New"
          onConfirm={() => {
            if (pendingCasterId) onSelect(pendingCasterId);
            setPendingCasterId(null);
          }}
          onClose={() => setPendingCasterId(null)}
        />
      </div>
    </DialogShell>
  );
}
