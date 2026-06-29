import React, { useState, useMemo } from 'react';
import { Combatant, NpcTrait, NpcAction, NpcReaction, NpcLegendaryAction } from '../../types';
import { NpcStatBlockSection, formatActionMeta } from '../ui/NpcStatBlockSection';

export interface NpcReferencePanelProps {
  combatant: Combatant;
}

const isFieldEmpty = (val?: string) => {
  if (!val) return true;
  const trimmed = val.trim();
  return trimmed === '' || trimmed === '[]';
};

export const NpcReferencePanel: React.FC<NpcReferencePanelProps> = ({ combatant }) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasNoContent = 
    isFieldEmpty(combatant.speed) &&
    isFieldEmpty(combatant.senses) &&
    isFieldEmpty(combatant.languages) &&
    isFieldEmpty(combatant.challengeRating) &&
    isFieldEmpty(combatant.traits) &&
    isFieldEmpty(combatant.actions) &&
    isFieldEmpty(combatant.reactions) &&
    isFieldEmpty(combatant.legendaryActionsList);

  if (hasNoContent) return null;

  const traits = useMemo(() => {
    try {
      return JSON.parse(combatant.traits || '[]') as NpcTrait[];
    } catch {
      return [] as NpcTrait[];
    }
  }, [combatant.traits]);

  const actions = useMemo(() => {
    try {
      return JSON.parse(combatant.actions || '[]') as NpcAction[];
    } catch {
      return [] as NpcAction[];
    }
  }, [combatant.actions]);

  const reactions = useMemo(() => {
    try {
      return JSON.parse(combatant.reactions || '[]') as NpcReaction[];
    } catch {
      return [] as NpcReaction[];
    }
  }, [combatant.reactions]);

  const legendaryActions = useMemo(() => {
    try {
      return JSON.parse(combatant.legendaryActionsList || '[]') as NpcLegendaryAction[];
    } catch {
      return [] as NpcLegendaryAction[];
    }
  }, [combatant.legendaryActionsList]);

  return (
    <div className="w-full mt-2" data-testid="npc-reference-panel">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-[#8d8db9] hover:text-[#0f172a] font-medium bg-[#f9f8ff] rounded px-2 py-1 border border-[#e2e8f0] w-full text-left cursor-pointer transition-colors outline-none focus:outline-none"
      >
        {isOpen ? '▼ Stat Block' : '▶ Stat Block'}
      </button>

      {isOpen && (
        <div className="bg-white border border-[#e2e8f0] rounded p-3 mt-1 space-y-3 text-sm text-left">
          {/* Row 1: CR and Speed */}
          {((combatant.challengeRating && combatant.challengeRating.trim() !== '') || (combatant.speed && combatant.speed.trim() !== '')) && (
            <div className="flex flex-wrap items-center gap-1.5 py-1 border-b border-[#e2e8f0]/40 pb-2 mb-1">
              {combatant.challengeRating && combatant.challengeRating.trim() !== '' && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#8d8db9] uppercase font-semibold">CR</span>
                  <span className="text-sm font-medium text-[#0f172a]">{combatant.challengeRating}</span>
                </div>
              )}
              {combatant.challengeRating && combatant.challengeRating.trim() !== '' && combatant.speed && combatant.speed.trim() !== '' && (
                <span className="text-xs text-[#8d8db9] font-medium mx-1.5">·</span>
              )}
              {combatant.speed && combatant.speed.trim() !== '' && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#8d8db9] uppercase font-semibold">Speed</span>
                  <span className="text-sm font-medium text-[#0f172a]">{combatant.speed}</span>
                </div>
              )}
            </div>
          )}

          {/* Row 2: Senses */}
          {combatant.senses && combatant.senses.trim() !== '' && (
            <div className="flex items-center gap-1.5 py-0.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8d8db9]">Senses</span>
              <span className="text-sm font-medium text-[#0f172a]">{combatant.senses}</span>
            </div>
          )}

          {/* Row 3: Languages */}
          {combatant.languages && combatant.languages.trim() !== '' && (
            <div className="flex items-center gap-1.5 py-0.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8d8db9]">Languages</span>
              <span className="text-sm font-medium text-[#0f172a]">{combatant.languages}</span>
            </div>
          )}

          {/* Traits section */}
          {traits.length > 0 && (
            <NpcStatBlockSection
              title="Traits"
              items={traits.map(t => ({
                name: t.name,
                description: t.description,
              }))}
            />
          )}

          {/* Actions section */}
          {actions.length > 0 && (
            <NpcStatBlockSection
              title="Actions"
              items={actions.map(a => ({
                name: a.name,
                description: a.description,
                meta: formatActionMeta(a),
              }))}
            />
          )}

          {/* Reactions section */}
          {reactions.length > 0 && (
            <NpcStatBlockSection
              title="Reactions"
              items={reactions.map(r => ({
                name: r.name,
                description: r.description,
              }))}
            />
          )}

          {/* Legendary Actions section */}
          {legendaryActions.length > 0 && (
            <NpcStatBlockSection
              title="Legendary Actions"
              items={legendaryActions.map(la => ({
                name: la.cost && la.cost > 1
                  ? `${la.name} (Costs ${la.cost})`
                  : la.name,
                description: la.description,
              }))}
            />
          )}
        </div>
      )}
    </div>
  );
};
