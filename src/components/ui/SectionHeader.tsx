import React from 'react';
import { cn } from '../../lib/utils';

export interface SectionHeaderProps {
  children: React.ReactNode;
  size?: 'compact' | 'default';
  className?: string;
  id?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  children,
  size = 'default',
  className,
  id,
}) => {
  const sizeClass = size === 'compact' ? 'text-[10px]' : 'text-xs';

  return (
    <h3
      id={id}
      className={cn(
        'text-[#8d8db9] font-bold uppercase tracking-widest border-b border-[#e2e8f0] pb-1 mb-2',
        sizeClass,
        className
      )}
    >
      {children}
    </h3>
  );
};
