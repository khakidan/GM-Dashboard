import React from 'react';
import { Combatant, Character } from '../../types';
import { parseResourcePools, spendResourcePip, recoverResourcePip, ResourcePool } from '../../lib/resourcePools';
import { PipTracker } from '../ui/PipTracker';

interface CombatantCompactResourceRowProps {
  c: Combatant;
  isSyncing: boolean;
  onUpdateResourcePools?: (combatant: Combatant, pools: ResourcePool[]) => void;
  character?: Character;
}

export const CombatantCompactResourceRow = ({
  c,
  isSyncing,
  onUpdateResourcePools,
  character,
}: CombatantCompactResourceRowProps) => {
  if (c.type !== 'pc') return null;

  if (!character) return null;

  const pools = parseResourcePools(character.resourcePools || '[]');
  if (pools.length === 0) return null;

  return (
    <div 
      onClick={e => e.stopPropagation()}
      className="flex flex-wrap items-center gap-3"
    >
      {pools.map(pool => (
        <div key={pool.name} className="inline-flex items-center gap-1.5" id={`compact-pool-${pool.name.toLowerCase().replace(/\s+/g, '-')}`}>
          <span className="font-sans font-bold text-[#8d8db9] uppercase tracking-wide text-sm">
            {pool.name.length > 6 ? `${pool.name.slice(0, 6)}...` : pool.name}
          </span>
          <PipTracker
            max={pool.max}
            remaining={pool.current}
            color="blue"
            size="compact"
            label={pool.name}
            readOnly={isSyncing}
            onChange={(newValue) => {
              if (isSyncing) return;
              let updatedPools = pools;
              if (newValue < pool.current) {
                updatedPools = spendResourcePip(pools, pool.name, pool.current - newValue);
              } else if (newValue > pool.current) {
                updatedPools = recoverResourcePip(pools, pool.name, newValue - pool.current);
              } else {
                return;
              }
              onUpdateResourcePools?.(c, updatedPools);
            }}
          />
        </div>
      ))}
    </div>
  );
};

