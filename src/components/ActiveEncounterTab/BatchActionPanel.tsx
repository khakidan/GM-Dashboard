import React from 'react';
import { Combatant, DamageType } from '../../types';
import { MultiTargetActionPanel } from './MultiTargetActionPanel';

export interface BatchActionPanelProps {
  selectedIds: Set<string>;
  combatants: Combatant[];
  onApplyDamage: (amount: number, type: DamageType | null) => void;
  onApplyHeal: (amount: number) => void;
  onApplyCondition: (condition: string) => void;
  onDeleteSelected: () => void;
  onCancel: () => void;
}

export const BatchActionPanel: React.FC<BatchActionPanelProps> = ({
  selectedIds,
  combatants,
  onApplyDamage,
  onApplyHeal,
  onApplyCondition,
  onDeleteSelected,
  onCancel,
}) => {
  return (
    <MultiTargetActionPanel
      selectedCount={selectedIds.size}
      onApplyDamage={onApplyDamage}
      onApplyHealing={onApplyHeal}
      onApplyCondition={onApplyCondition}
      onDeleteSelected={onDeleteSelected}
      onCancelSelection={onCancel}
    />
  );
};
