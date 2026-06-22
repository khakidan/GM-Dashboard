import React from 'react';

export interface SidebarIconProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  'aria-label'?: string;
  id?: string;
  disabled?: boolean;
}

export function SidebarIcon({
  icon,
  label,
  isActive = false,
  onClick,
  'aria-label': ariaLabel,
  id,
  disabled = false,
}: SidebarIconProps) {
  return (
    <div className="relative group flex justify-center">
      <button
        id={id}
        onClick={onClick}
        disabled={disabled}
        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
          disabled
            ? 'opacity-50 cursor-not-allowed text-[#5a5a40]'
            : isActive
            ? 'bg-[#e5e1d8] text-[#2c2c26] ring-1 ring-[#c5b358]/50 cursor-pointer'
            : 'text-[#5a5a40] hover:text-[#2c2c26] hover:bg-[#e5e1d8]/60 cursor-pointer'
        }`}
        aria-label={ariaLabel || label}
      >
        {icon}
      </button>
      {/* Tooltip */}
      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 bg-[#2c2c26] border border-[#3f3f37] text-[#fdfaf5] text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150">
        {label}
        {/* Small left-pointing arrow */}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#2c2c26]" />
      </div>
    </div>
  );
}
