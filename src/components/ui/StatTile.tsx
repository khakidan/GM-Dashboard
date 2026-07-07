import React from 'react';
import { cn } from '../../lib/utils';
import { formatBonus } from './StatBlockScores';

export interface StatTileProps {
  label: string;
  children: React.ReactNode;
  modifier?: number;
  size?: 'default' | 'compact';
  className?: string;
  id?: string;
}

export const StatTile: React.FC<StatTileProps> = ({
  label,
  children,
  modifier,
  size = 'default',
  className,
  id,
}) => {
  const isCompact = size === 'compact';

  return (
    <div
      id={id}
      className={cn(
        "bg-white border border-[#e2e8f0] rounded-xl flex flex-col items-center justify-center",
        isCompact ? "p-2" : "p-3",
        className
      )}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest text-[#8d8db9] mb-1">
        {label}
      </div>
      
      <div className="flex items-center justify-center w-full">
        {children}
      </div>

      {modifier !== undefined && (
        <div
          className={cn(
            "text-xs font-medium mt-1",
            modifier > 0 ? "text-[#2563eb]" : modifier === 0 ? "text-[#8d8db9]" : "text-red-600"
          )}
        >
          {formatBonus(modifier)}
        </div>
      )}
    </div>
  );
};
