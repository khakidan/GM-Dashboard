import React from 'react';
import { ChevronDown, HeartCrack, Skull } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DebouncedInput } from '../ui/DebouncedInput';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CardHeaderChevron } from '../ui/CardHeaderChevron';

const healthStatusMap: Record<string, 'emerald' | 'green' | 'yellow' | 'red' | 'gray' | 'blue'> = {
  Full: 'emerald',
  Defeated: 'red',
  Healthy: 'green',
  Injured: 'yellow',
  Bloodied: 'red',
  Unconscious: 'red',
  Stable: 'blue',
};

export interface CharacterCardHeaderProps {
  characterName: string;
  playerName: string;
  statuses: Record<string, string>;
  className?: string; // Character's D&D class badge or other styling class
  healthStatus: { label: string; color: string };
  isActive: boolean;
  isDeceased: boolean;
  
  // Additional props to preserve functionality & interactive features
  isExpanded: boolean;
  onToggleExpand: () => void;
  isSyncing: boolean;
  statusId: number;
  onStatusChange: (statusId: number, statusName: string) => void;
  characterId: string;
  conditions?: string;
  onUpdateCharacterName?: (val: string) => void;
  onUpdatePlayerName?: (val: string) => void;
  onLevelUpClick?: (() => void) | null;
  statGrid?: React.ReactNode;
}

export const CharacterCardHeader: React.FC<CharacterCardHeaderProps> = ({
  characterName,
  playerName,
  statuses,
  className,
  healthStatus,
  isActive,
  isDeceased,
  isExpanded,
  onToggleExpand,
  isSyncing,
  statusId,
  onStatusChange,
  characterId,
  conditions,
  onUpdateCharacterName,
  onUpdatePlayerName,
  onLevelUpClick,
  statGrid,
}) => {
  return (
    <div className="p-4 flex items-center justify-between gap-3 px-5">
      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <DebouncedInput 
              value={characterName}
              onChange={(v) => onUpdateCharacterName?.(v as string)}
              className="text-lg font-bold text-[#0f172a] font-serif bg-transparent border border-transparent rounded hover:bg-[#f9f8ff] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none px-2 py-1 -ml-2 transition-all placeholder:text-[#8d8db9]/30 disabled:opacity-50 w-auto max-w-[160px] truncate"
              placeholder="Name"
              disabled={isSyncing}
            />
            {healthStatus.label === 'Stable' && (
              <HeartCrack className="w-4 h-4 text-[#8d8db9] shrink-0" />
            )}
            {healthStatus.label === 'Dead' && (
              <Skull className="w-4 h-4 text-[#8d8db9] shrink-0" />
            )}
          </div>
          <div className="hidden sm:block text-[#8d8db9]/30 shrink-0">|</div>
          <DebouncedInput 
            value={playerName}
            onChange={(v) => onUpdatePlayerName?.(v as string)}
            className="text-xs text-[#8d8db9] uppercase tracking-wider font-bold opacity-60 bg-transparent border border-transparent rounded hover:bg-[#f9f8ff] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none px-2 py-1 -ml-2 transition-all placeholder:text-[#8d8db9]/30 disabled:opacity-50 w-auto max-w-[100px] truncate"
            placeholder="Player"
            disabled={isSyncing}
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="relative shrink-0 flex items-center">
            <Badge
              color={statusId === 1 ? 'green' : statusId === 3 ? 'red' : 'gray'}
              size="default"
              className="p-0 flex items-center"
            >
              <select
                value={statusId}
                onChange={(e) => {
                  const id = parseInt(e.target.value, 10);
                  const statusName = statuses[e.target.value] ?? "Unknown";
                  onStatusChange(id, statusName);
                }}
                disabled={isSyncing}
                className="text-xs uppercase tracking-widest font-bold pl-3 pr-8 py-1.5 bg-transparent border-none outline-none cursor-pointer appearance-none disabled:opacity-50 text-inherit"
              >
                {Object.entries(statuses)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([id, label]) => (
                    <option key={id} value={Number(id)}>
                      {label}
                    </option>
                  ))}
              </select>
            </Badge>
            <div className="absolute right-2.5 pointer-events-none text-xs font-bold opacity-40">
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>

          {!isExpanded && (
            <div className="flex items-center gap-4 pl-4 border-l border-[#e2e8f0] whitespace-nowrap">
              {conditions && !['Dead', 'Stable', 'Unconscious'].includes(healthStatus.label) && (
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full text-[14px] font-bold italic max-w-[220px] truncate">
                  {conditions}
                </div>
              )}
              {healthStatus.label !== 'Dead' && (
                <Badge
                  color={healthStatusMap[healthStatus.label] || 'gray'}
                  size="default"
                  className="hidden sm:flex items-center"
                >
                  {healthStatus.label}
                </Badge>
              )}
              {statGrid}
            </div>
          )}
        </div>
      </div>

      {statusId === 1 && onLevelUpClick && (
        <Button
          id={`lvl-btn-${characterId}`}
          intent="secondary"
          onClick={(e) => {
            e.stopPropagation();
            onLevelUpClick();
          }}
        >
          Level Up
        </Button>
      )}
      <CardHeaderChevron isExpanded={isExpanded} onToggleExpand={onToggleExpand} label="character card" />
    </div>
  );
};
