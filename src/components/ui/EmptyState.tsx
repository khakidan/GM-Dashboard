import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title?: React.ReactNode;
  description?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      "bg-white border border-[#e2e8f0] rounded-2xl py-16 px-6 text-center shadow-sm flex flex-col items-center",
      className
    )}>
      <Icon className="w-12 h-12 text-[#8d8db9] opacity-20 mb-4" />
      
      {title && (
        <h3 className="text-lg font-serif font-bold text-[#0f172a] mb-2">
          {title}
        </h3>
      )}
      
      {description && (
        <p className="text-sm text-[#8d8db9] max-w-sm mx-auto mb-6">
          {description}
        </p>
      )}
      
      {actionLabel && onAction && (
        <Button
          intent="primary"
          size="small"
          className="rounded-full px-6"
          disabled={actionDisabled}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
