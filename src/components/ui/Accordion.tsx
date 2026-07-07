import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AccordionProps {
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  rightContent?: React.ReactNode;
  size?: 'compact' | 'default';
  className?: string;
  disabled?: boolean;
  hideChevron?: boolean;
}

export function Accordion({
  isExpanded,
  onToggle,
  children,
  rightContent,
  size = 'default',
  className,
  disabled,
  hideChevron,
}: AccordionProps) {
  const sizeStyles = {
    default: 'p-4',
    compact: 'px-4 py-2.5',
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-between transition-colors text-left cursor-pointer no-blue-hover bg-[#f9f8ff]/50 hover:bg-[#f9f8ff] outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-inset",
        disabled && "cursor-not-allowed",
        sizeStyles[size],
        className
      )}
    >
      {/* Left-side content */}
      <div className="flex items-center gap-3 min-w-0">
        {children}
      </div>

      {/* Right-side content container */}
      <div className="flex items-center gap-3 shrink-0 ml-4">
        {rightContent}
        {!hideChevron && (
          isExpanded ? (
            <ChevronDown className="w-4 h-4 text-[#8d8db9]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#8d8db9]" />
          )
        )}
      </div>
    </button>
  );
}
