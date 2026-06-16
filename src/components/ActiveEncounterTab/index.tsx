import React, { useState, useEffect } from 'react';
import { Skull, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DamageType } from '../../types';
import { useAppState, getSnapshot } from '../../hooks/useAppState';
import { toast } from 'sonner';

import { CombatHeader } from './CombatHeader';
import { CombatantCard } from './CombatantCard';
import { CombatSidebar } from './CombatSidebar';
import { CasterAttributionDialog } from './CasterAttributionDialog';
import { DiceRoller } from '../DiceRoller';

import { useCombatSync } from './hooks/useCombatSync';
import { useHealthChange } from './hooks/useHealthChange';
import { useSelectionMode } from './hooks/useSelectionMode';
import { useEncounterKeyboard } from './hooks/useEncounterKeyboard';
import { useEncounterPresetLoader } from './hooks/useEncounterPresetLoader';
import { BatchActionPanel } from './BatchActionPanel';
import { ShortcutCheatSheet } from './ShortcutCheatSheet';
import { useBatchActions } from './hooks/useBatchActions';

export function ActiveEncounterTab({ onBack }: { onBack: () => void }) {
  const { state, updateState } = useAppState();
  const encounter = state.encounters.find(e => e.id === state.combatState.activeEncounterId);

  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [hpMode, setHpMode] = useState<'damage' | 'heal'>('damage');
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);

  // Modular selection state
  const {
    selectedIds: selectedCombatantIds,
    isSelectionMode: isMultiTargetMode,
    toggleSelection: toggleCombatantSelection,
    clearSelection,
    enterSelectionMode,
    exitSelectionMode,
  } = useSelectionMode();

  const {
    syncingIds,
    globalError,
    removeCombatant,
    updateCombatant,
    rollInitForNPCs,
    resetCombat,
    handleCallInitiative,
    nextTurn,
    handleConcentrationPrompt,
    handleSelectCaster,
    concentrationPrompt,
    setConcentrationPrompt,
  } = useCombatSync();

  const {
    damageInputs,
    setDamageInputs,
    healInputs,
    setHealInputs,
    handleHealthChange,
  } = useHealthChange(syncingIds, updateCombatant);

  // Modular preset & NPC db-to-state loader
  const { handleAddPreset, handleAddNpc } = useEncounterPresetLoader(encounter, updateCombatant);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleMultiTargetMode = () => {
    if (isMultiTargetMode) {
      exitSelectionMode();
    } else {
      enterSelectionMode();
    }
  };

  const {
    handleApplyMultiDamage,
    handleApplyMultiHealing,
    handleApplyMultiCondition,
    handleDeleteSelected
  } = useBatchActions({
    selectedIds: selectedCombatantIds,
    combatants: state.combatState.combatants,
    onSuccess: exitSelectionMode
  });

  // Listen for global custom commands from the Command Palette
  useEffect(() => {
    const handleNextTurn = () => nextTurn();
    const handleRollNpcInit = () => rollInitForNPCs();
    const handleCallInit = () => handleCallInitiative();
    const handleOpenTools = () => setIsToolsModalOpen(true);

    window.addEventListener('gm-cmd-next-turn', handleNextTurn);
    window.addEventListener('gm-cmd-roll-npc-init', handleRollNpcInit);
    window.addEventListener('gm-cmd-call-initiative', handleCallInit);
    window.addEventListener('gm-cmd-open-tools', handleOpenTools);

    return () => {
      window.removeEventListener('gm-cmd-next-turn', handleNextTurn);
      window.removeEventListener('gm-cmd-roll-npc-init', handleRollNpcInit);
      window.removeEventListener('gm-cmd-call-initiative', handleCallInit);
      window.removeEventListener('gm-cmd-open-tools', handleOpenTools);
    };
  }, [nextTurn, rollInitForNPCs, handleCallInitiative]);

  // Integrated Keyboard Shortcuts Hook
  useEncounterKeyboard({
    nextTurn,
    rollInitForNPCs,
    setIsToolsModalOpen,
    toggleMultiTargetMode,
    handleCallInitiative,
    setHpMode,
    combatants: state.combatState.combatants,
    activeTurnId: state.combatState.activeTurnId,
    initiativeEventExists: !!state.combatState.initiativeEvent,
    setIsCheatSheetOpen,
    setExpandedIds,
  });

  return (
    <div className="flex flex-col gap-8 relative items-start">
      <div className={cn('space-y-6 flex flex-col transition-all duration-300 w-full')}>
        {globalError && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-800 text-sm shadow-sm transition-all absolute top-2 right-2 z-50">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{globalError}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-[#e5e1d8] overflow-hidden text-sm md:text-base flex-1 flex flex-col w-full">
          <CombatHeader
            encounter={encounter}
            round={state.combatState.round}
            isMultiTargetMode={isMultiTargetMode}
            selectedCount={selectedCombatantIds.size}
            onOpenTools={() => setIsToolsModalOpen(true)}
            onRollNpcInit={rollInitForNPCs}
            onResetCombat={resetCombat}
            onNextTurn={nextTurn}
            onToggleMultiTargetMode={toggleMultiTargetMode}
            onDeleteSelected={handleDeleteSelected}
            onCancelSelection={exitSelectionMode}
            onBack={onBack}
            onCallInitiative={handleCallInitiative}
            initiativeEvent={!!state.combatState.initiativeEvent}
            onOpenCheatSheet={() => setIsCheatSheetOpen(true)}
            onApplyDamage={handleApplyMultiDamage}
            onApplyHealing={handleApplyMultiHealing}
            onApplyCondition={handleApplyMultiCondition}
          />

          <div className="flex-1 bg-white w-full p-6">
            <div className="grid grid-cols-1 gap-4">
              {state.combatState.combatants.length === 0 ? (
                <div className="col-span-full py-20 text-center flex flex-col items-center justify-center">
                  <Skull className="w-12 h-12 text-[#5a5a40] opacity-20 mb-4" />
                  <p className="text-lg font-serif font-bold text-[#2c2c26]">No combatants in tracker</p>
                  <p className="text-sm text-[#5a5a40] italic">Add players or NPCs from the tools menu to begin.</p>
                </div>
              ) : (
                state.combatState.combatants.map(c => (
                  <CombatantCard
                    key={c.id}
                    c={c}
                    isExpanded={expandedIds.has(c.id)}
                    damageInput={damageInputs[c.id] || ''}
                    healInput={healInputs[c.id] || ''}
                    currentRound={state.combatState.round}
                    onDamageInputChange={(val) => setDamageInputs(prev => ({ ...prev, [c.id]: val }))}
                    onHealInputChange={(val) => setHealInputs(prev => ({ ...prev, [c.id]: val }))}
                    onHealthSubmit={(isDamage, damageType) => handleHealthChange(c.id, c, isDamage, damageType)}
                    onToggleExpand={() => toggleExpand(c.id)}
                    onToggleSelect={toggleCombatantSelection}
                    onUpdateCombatant={(updates) => updateCombatant(c.id, updates)}
                    onRemoveCombatant={() => removeCombatant(c.id)}
                    onConcentrationPrompt={handleConcentrationPrompt}
                    hpMode={hpMode}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <CombatSidebar
        isOpen={isToolsModalOpen}
        onClose={() => setIsToolsModalOpen(false)}
        npcs={state.npcs}
        characters={state.characters}
        onAddPreset={handleAddPreset}
        onAddNpc={handleAddNpc}
        combatants={state.combatState.combatants}
        onUpdateCombatant={updateCombatant}
      />

      <CasterAttributionDialog
        isOpen={!!concentrationPrompt}
        effectName={concentrationPrompt?.effectName || ''}
        targetName={concentrationPrompt?.targetName || ''}
        combatants={state.combatState.combatants}
        onSelect={handleSelectCaster}
        onDismiss={() => setConcentrationPrompt(null)}
      />

      <ShortcutCheatSheet
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
      />

      <DiceRoller />
    </div>
  );
}
