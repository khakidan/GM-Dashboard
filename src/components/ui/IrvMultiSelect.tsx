import React, { useState, useRef, useEffect } from 'react';
import { X, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { IRV_OPTIONS } from '../../lib/irvOptions';

interface IrvMultiSelectProps {
  label: string;
  value: string; // comma-separated string e.g. "fire, poison"
  onChange: (value: string) => void;
  options?: string[]; // defaults to IRV_OPTIONS
  placeholder?: string;
}

export function IrvMultiSelect({
  label,
  value,
  onChange,
  options = IRV_OPTIONS,
  placeholder = "Search and add...",
}: IrvMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const debouncedOnChange = (newValue: string) => {
    setLocalValue(newValue);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  };

  const selectedItems = localValue
    ? localValue.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const filteredOptions = options.filter(
    (option) =>
      option.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedItems.includes(option)
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectItem = (item: string) => {
    const newItems = [...selectedItems, item];
    debouncedOnChange(newItems.join(', '));
    setSearchTerm('');
    // Stay open if there are more options
    if (filteredOptions.length <= 1) {
      setIsOpen(false);
    }
  };

  const handleRemoveItem = (itemToRemove: string) => {
    const newItems = selectedItems.filter((item) => item !== itemToRemove);
    debouncedOnChange(newItems.join(', '));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredOptions.length > 0) {
      e.preventDefault();
      handleSelectItem(filteredOptions[0]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1 ml-1">
        {label}
      </label>
      
      <div className="min-h-[42px] p-1.5 bg-[#faf9f6]/50 border border-[#e5e1d8] rounded-xl flex flex-wrap gap-1.5 items-center transition-all focus-within:ring-2 focus-within:ring-[#c5b358]/20 focus-within:border-[#c5b358]">
        <AnimatePresence>
          {selectedItems.map((item) => (
            <motion.span
              key={item}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-[#e5e1d8] rounded-full text-xs font-medium text-[#5a5a40] shadow-sm whitespace-nowrap"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemoveItem(item)}
                className="p-0.5 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
                aria-label={`Remove ${item}`}
              >
                <X className="w-3 h-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>

        <div className="relative flex-1 min-w-[120px]">
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent border-none outline-none text-sm font-medium py-1 px-1 placeholder:text-[#5a5a40]/40"
            placeholder={selectedItems.length === 0 ? placeholder : ''}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
          />
          
          <AnimatePresence>
            {isOpen && (searchTerm.length > 0 || filteredOptions.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#e5e1d8] rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto overflow-x-hidden p-1"
              >
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleSelectItem(option)}
                      className="w-full text-left px-3 py-2 text-sm text-[#2c2c26] hover:bg-[#fdfaf5] hover:text-[#c5b358] rounded-lg transition-colors font-medium flex items-center justify-between group"
                    >
                      {option}
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] uppercase font-bold text-[#b0a04f]">Add</span>
                    </button>
                  ))
                ) : searchTerm.length > 0 ? (
                  <div className="px-3 py-3 text-xs text-[#5a5a40] italic text-center">
                    No matching damage types or conditions
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
