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
        "bg-white border border-[#e5e1d8] rounded-xl text-[#2c2c26] placeholder:text-[#5a5a40] focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358]/50 focus:outline-none w-full px-3 py-2 text-sm resize-none transition-colors",
        className
      )}
      {...props}
    />
  );
}
