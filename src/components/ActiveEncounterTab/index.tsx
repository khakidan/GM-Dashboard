import React, { useState, useEffect } from 'react';
import { Skull, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DamageType } from '../../types';
import { useAppState, getSnapshot } from '../../hooks/useAppState';
import { useDashboardStore } from '../../hooks/dashboardStore';
import { toast } from 'sonner';

import { CombatHeader } from './CombatHeader';
import { CombatantCard } from './CombatantCard';
import { AddCombatantDialog } from './AddCombatantDialog';
import { CasterAttributionDialog } from './CasterAttributionDialog';

import { useCombatSync } from './hooks/useCombatSync';
import { useHealthChange } from './hooks/useHealthChange';
import { useSelectionMode } from './hooks/useSelectionMode';
import { useEncounterKeyboard } from './hooks/useEncounterKeyboard';
import { useEncounterPresetLoader } from './hooks/useEncounterPresetLoader';
import { ShortcutCheatSheet } from './ShortcutCheatSheet';
import { useBatchActions } from './hooks/useBatchActions';
import { GlobalActionContextPanel } from './GlobalActionContextPanel';

export function ActiveEncounterTab({ onBack }: { onBack: () => void }) {
  const { state, updateState } = useAppState();
  const combatState = useDashboardStore(s => s.combatState);
  const setActionContext = useDashboardStore(s => s.setActionContext);
  const encounter = state.encounters.find(e => e.id === state.combatState.activeEncounterId);

  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const expandedIdsSet = React.useMemo(() => new Set(state.combatState.expandedIds || []), [state.combatState.expandedIds]);

  const setExpandedIds = (updater: (prev: Set<string>) => Set<string>) => {
    updateState(prev => {
      const currentSet = new Set(prev.combatState.expandedIds || []);
      const nextSet = updater(currentSet);
      return {
        ...prev,
        combatState: {
          ...prev.combatState,
          expandedIds: Array.from(nextSet),
        }
      };
    });
  };

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
    cancelCombat,
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
    exitSelectionMode,
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

        <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] overflow-hidden text-sm md:text-base flex-1 flex flex-col w-full">
          <CombatHeader
            encounter={encounter}
            round={state.combatState.round}
            isMultiTargetMode={isMultiTargetMode}
            selectedCount={selectedCombatantIds.size}
            onOpenTools={() => setIsToolsModalOpen(true)}
            onRollNpcInit={rollInitForNPCs}
            onResetCombat={resetCombat}
            onCancelEncounter={cancelCombat}
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
          <GlobalActionContextPanel
            combatStarted={combatState.combatStarted}
            actionContext={combatState.actionContext}
            combatants={combatState.combatants}
            activeTurnId={combatState.activeTurnId}
            setActionContext={setActionContext}
          />

          <div className="flex-1 bg-white w-full p-6">
            <div className="grid grid-cols-1 gap-4">
              {state.combatState.combatants.length === 0 ? (
                <div className="col-span-full py-20 text-center flex flex-col items-center justify-center">
                  <Skull className="w-12 h-12 text-[#8d8db9] opacity-20 mb-4" />
                  <p className="text-lg font-serif font-bold text-[#0f172a]">No combatants in tracker</p>
                  <p className="text-sm text-[#8d8db9] italic">Add players or NPCs from the tools menu to begin.</p>
                </div>
              ) : (
                state.combatState.combatants.map(c => {
                  const pcCharacter = c.type === 'pc' && c.characterId ? state.characters.find(char => char.id === c.characterId) : undefined;
                  const npcModel = c.type === 'npc' ? state.npcs.find(n => n.id === c.npcId) : undefined;
                  return (
                    <CombatantCard
                      key={c.id}
                      c={c}
                      isExpanded={expandedIdsSet.has(c.id)}
                      damageInput={damageInputs[c.id] || ''}
                      healInput={healInputs[c.id] || ''}
                      currentRound={state.combatState.round}
                      combatStarted={combatState.combatStarted}
                      onDamageInputChange={(val) => setDamageInputs(prev => ({ ...prev, [c.id]: val }))}
                      onHealInputChange={(val) => setHealInputs(prev => ({ ...prev, [c.id]: val }))}
                      onHealthSubmit={(isDamage, damageType) => handleHealthChange(c.id, c, isDamage, damageType)}
                      onToggleExpand={() => toggleExpand(c.id)}
                      onToggleSelect={toggleCombatantSelection}
                      onUpdateCombatant={(updates) => updateCombatant(c.id, updates)}
                      onRemoveCombatant={() => removeCombatant(c.id)}
                      onConcentrationPrompt={handleConcentrationPrompt}
                      hpMode={hpMode}
                      pcCharacter={pcCharacter}
                      npcModel={npcModel}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <AddCombatantDialog
        isOpen={isToolsModalOpen}
        onClose={() => setIsToolsModalOpen(false)}
        npcs={state.npcs}
        characters={state.characters}
        onAddPreset={handleAddPreset}
        onAddNpc={handleAddNpc}
        combatants={state.combatState.combatants}
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
    </div>
  );
}
