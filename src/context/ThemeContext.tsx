import React, { createContext, useContext, useState, useEffect } from 'react';

export type VisualStyle = 'default' | 'dnd' | 'sleek-modern';

interface ThemeContextType {
  theme: VisualStyle;
  setTheme: (theme: VisualStyle) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<VisualStyle>(() => {
    const saved = localStorage.getItem('gm_visual_style');
    return (saved as VisualStyle) || 'default';
  });

  const setTheme = (newTheme: VisualStyle) => {
    setThemeState(newTheme);
    localStorage.setItem('gm_visual_style', newTheme);
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
