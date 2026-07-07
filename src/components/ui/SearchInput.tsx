// src/components/ui/SearchInput.tsx

import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DebouncedInput, DebouncedInputProps } from './DebouncedInput';

export interface SearchInputProps extends Omit<DebouncedInputProps, 'size'> {
  // We lock the size to 'compact' internally, but expose all other DebouncedInput props
}

export function SearchInput({ value, onChange, placeholder, id, className, disabled, ...props }: SearchInputProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8db9]/60" />
      <DebouncedInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        id={id}
        disabled={disabled}
        size="compact"
        immediate={true}
        className="pl-9"
        {...props}
      />
    </div>
  );
}
