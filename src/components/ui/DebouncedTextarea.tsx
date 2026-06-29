import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export interface DebouncedTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DebouncedTextarea({ value, onChange, onBlur, className, ...props }: DebouncedTextareaProps) {
  const [localValue, setLocalValue] = useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const commit = () => {
    if (localValue !== value) onChange(localValue);
  };

  return (
    <textarea
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
      onBlur={e => {
        commit();
        if (onBlur) onBlur(e);
      }}
      className={cn(
        "bg-white border border-[#e2e8f0] rounded-xl text-[#0f172a] placeholder:text-[#8d8db9] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/50 focus:outline-none w-full px-3 py-2 text-sm resize-none transition-colors",
        className
      )}
      {...props}
    />
  );
}
