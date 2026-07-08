import React from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { IconButton } from './IconButton';

export interface CardHeaderChevronProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  label: string;
  stopPropagation?: boolean;
  className?: string;
  bordered?: boolean;
}

export function CardHeaderChevron({
  isExpanded,
  onToggleExpand,
  label,
  stopPropagation = false,
  className,
  bordered = true,
}: CardHeaderChevronProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 shrink-0",
      bordered && "border-l border-[#e2e8f0] pl-3",
      className
    )}>
      <IconButton
        icon={
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        }
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
          onToggleExpand();
        }}
        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${label}`}
        className="opacity-30 hover:opacity-100"
      />
    </div>
  );
}
