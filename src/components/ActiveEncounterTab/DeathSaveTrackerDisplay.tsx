import React from 'react';

export interface DeathSaveTrackerDisplayProps {
  deathSavesFails: number;
  deathSavesSuccesses: number;
  isUnconscious: boolean;
  type: 'pc' | 'npc';
  isStable?: boolean;
  cId?: string;
}

export function DeathSaveTrackerDisplay({
  deathSavesFails,
  deathSavesSuccesses,
  isUnconscious,
  type,
  isStable = false,
  cId = 'c1',
}: DeathSaveTrackerDisplayProps) {
  if (type !== 'pc' || !isUnconscious || deathSavesSuccesses >= 3 || isStable) {
    return null;
  }

  return (
    <div 
      className="flex flex-col gap-0.5 bg-rose-50/70 border border-rose-100 rounded-lg px-2.5 py-1 text-xs select-none" 
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-1.5 font-mono">
        <span className="text-[#8d8db9] font-bold text-sm uppercase w-4">F:</span>
        <div className="flex gap-1" id={`death-fails-${cId}`}>
          {[1, 2, 3].map(slot => {
            const isFailed = deathSavesFails >= slot;
            return (
              <span key={slot} className="flex items-center justify-center">
                {isFailed ? (
                  <span className="text-red-500 text-sm leading-none" title="Death Save Failure">●</span>
                ) : (
                  <span className="text-gray-300 text-sm leading-none">○</span>
                )}
              </span>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-1.5 font-mono">
        <span className="text-[#8d8db9] font-bold text-sm uppercase w-4">S:</span>
        <div className="flex gap-1" id={`death-successes-${cId}`}>
          {[1, 2, 3].map(slot => {
            const isSuccess = deathSavesSuccesses >= slot;
            return (
              <span key={slot} className="flex items-center justify-center">
                {isSuccess ? (
                  <span className="text-green-500 text-sm leading-none" title="Death Save Success">♥</span>
                ) : (
                  <span className="text-gray-300 text-sm leading-none">○</span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
