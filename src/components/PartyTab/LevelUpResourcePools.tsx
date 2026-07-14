import React from 'react';
import { PoolEdit } from '../../types';
import { SectionHeader } from '../ui/SectionHeader';

export interface LevelUpResourcePoolsProps {
  poolEdits: PoolEdit[];
  setPoolEdits: React.Dispatch<React.SetStateAction<PoolEdit[]>>;
}

export const LevelUpResourcePools: React.FC<LevelUpResourcePoolsProps> = ({
  poolEdits,
  setPoolEdits,
}) => {
  if (poolEdits.length === 0) return null;

  return (
    <div className="space-y-3" id="resource-pools-section">
      <SectionHeader>
        Resource Pools
      </SectionHeader>
      <div className="border border-[#e2e8f0] rounded-2xl p-4 bg-[#f9f8ff] space-y-3">
        {poolEdits.map((entry, index) => (
          <div
            key={entry.name}
            className={`flex items-center justify-between gap-4 py-2 border-b border-[#e2e8f0]/50 last:border-0 ${
              !entry.include ? 'opacity-50' : ''
            }`}
            id={`pool-row-${entry.name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {/* LEFT: pool name + badge */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-[#0f172a] font-medium text-xs truncate">
                {entry.name}
              </span>
              {entry.isNew && (
                <span className="bg-[#2563eb]/20 border border-[#2563eb] text-[#567eff] px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0">
                  New
                </span>
              )}
            </div>

            {/* MIDDLE: input + auto label */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={entry.max}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                  setPoolEdits(prev =>
                    prev.map((item, i) => (i === index ? { ...item, max: val } : item))
                  );
                }}
                disabled={!entry.include}
                className="bg-white border border-[#e2e8f0] rounded-xl text-[#0f172a] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/50 focus:outline-none w-16 px-2 py-1 text-xs text-center font-bold"
                id={`pool-input-${entry.name.toLowerCase().replace(/\s+/g, '-')}`}
              />
              {entry.isAutoDerived && (
                <span className="text-[#8d8db9] text-[9px] font-bold bg-[#8d8db9]/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Auto
                </span>
              )}
            </div>

            {/* RIGHT: reset label */}
            <div className="w-24 text-right shrink-0">
              <span className="text-[#8d8db9] text-[11px] font-medium">
                {entry.reset === 'short'
                  ? 'Short/Long Rest'
                  : entry.reset === 'long'
                  ? 'Long Rest'
                  : 'Manual'}
              </span>
            </div>

            {/* FAR RIGHT: include checkbox for new pools only */}
            <div className="w-12 flex justify-end shrink-0">
              {entry.isNew ? (
                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={entry.include}
                    onChange={(e) => {
                      setPoolEdits(prev =>
                        prev.map((item, i) => (i === index ? { ...item, include: e.target.checked } : item))
                      );
                    }}
                    className="w-3.5 h-3.5 accent-[#2563eb] cursor-pointer"
                    id={`pool-checkbox-${entry.name.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                  <span className="text-[9px] font-bold text-[#8d8db9] uppercase">Add</span>
                </label>
              ) : (
                <div className="w-7 h-3.5" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
