import React from 'react';
import { Combatant } from '../../types';
import { useAppState } from '../../hooks/useAppState';
import { parseResourcePools, spendResourcePip, recoverResourcePip, ResourcePool } from '../../lib/resourcePools';

interface CombatantCompactResourceRowProps {
  c: Combatant;
  isSyncing: boolean;
  onUpdateResourcePools?: (combatant: Combatant, pools: ResourcePool[]) => void;
}

export const CombatantCompactResourceRow = ({
  c,
  isSyncing,
  onUpdateResourcePools,
}: CombatantCompactResourceRowProps) => {
  const { state } = useAppState();

  if (c.type !== 'pc') return null;

  const char = state.characters.find(charItem => charItem.id === c.characterId);
  if (!char) return null;

  const pools = parseResourcePools(char.resourcePools || '[]');
  if (pools.length === 0) return null;

  return (
    <div 
      onClick={e => e.stopPropagation()}
      className="border-t border-[#e2e8f0] px-4 py-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs select-none bg-[#f9f8ff]/40 rounded-b-2xl"
    >
      {pools.map(pool => (
        <div key={pool.name} className="inline-flex items-center gap-1.5" id={`compact-pool-${pool.name.toLowerCase().replace(/\s+/g, '-')}`}>
          <span className="font-sans font-bold text-[#8d8db9] uppercase tracking-wide text-[10px]">
            {pool.name.length > 10 ? `${pool.name.slice(0, 10)}...` : pool.name}
          </span>
          <button
            onClick={() => {
              if (pool.current <= 0 || isSyncing) return;
              const updatedPools = spendResourcePip(pools, pool.name, 1);
              onUpdateResourcePools?.(c, updatedPools);
            }}
            disabled={pool.current <= 0 || isSyncing}
            className="w-4 h-4 inline-flex items-center justify-center border border-[#e2e8f0] rounded text-[10px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-30 cursor-pointer select-none leading-none"
            title="Spend 1 Use"
            id={`compact-spend-${c.id}-${pool.name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            -
          </button>
          <span className="font-mono font-bold text-xs text-[#0f172a]">
            {pool.current}/{pool.max}
          </span>
          <button
            onClick={() => {
              if (pool.current >= pool.max || isSyncing) return;
              const updatedPools = recoverResourcePip(pools, pool.name, 1);
              onUpdateResourcePools?.(c, updatedPools);
            }}
            disabled={pool.current >= pool.max || isSyncing}
            className="w-4 h-4 inline-flex items-center justify-center border border-[#e2e8f0] rounded text-[10px] font-bold text-green-700 hover:bg-green-50 disabled:opacity-30 cursor-pointer select-none leading-none"
            title="Recover 1 Use"
            id={`compact-recover-${c.id}-${pool.name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            +
          </button>
        </div>
      ))}
    </div>
  );
};
