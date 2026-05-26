import React, { useState } from 'react';

export interface DebouncedTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export function DebouncedTextarea({ value, onChange, onBlur, ...props }: DebouncedTextareaProps) {
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
      {...props}
    />
  );
}
