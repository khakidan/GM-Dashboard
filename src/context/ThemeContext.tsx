import { STORAGE_KEYS } from '../lib/constants';
import React, { createContext, useContext, useState, useEffect } from 'react';

export type VisualStyle = 'default' | 'dnd' | 'sleek-modern';

const VALID_VISUAL_STYLES: VisualStyle[] = ['default', 'dnd', 'sleek-modern'];

function isVisualStyle(v: unknown): v is VisualStyle {
  return typeof v === 'string' && (VALID_VISUAL_STYLES as string[]).includes(v);
}

interface ThemeContextType {
  theme: VisualStyle;
  setTheme: (theme: VisualStyle) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<VisualStyle>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.visualStyle);
    return isVisualStyle(saved) ? saved : 'default';
  });

  const setTheme = (newTheme: VisualStyle) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEYS.visualStyle, newTheme);
  };

  useEffect(() => {
    // Also set on HTML element or body for flexibility
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
