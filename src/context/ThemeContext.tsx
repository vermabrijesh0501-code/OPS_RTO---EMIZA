import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (mode: ThemeMode) => void;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  mode: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
  setMode: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('emiza_app_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'system';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Listen to OS system color scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  const resolvedTheme: ResolvedTheme = theme === 'system' ? (systemIsDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    try {
      localStorage.setItem('emiza_app_theme', theme);
    } catch {
      // ignore
    }

    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  }, [theme, resolvedTheme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const current = prev === 'system' ? (systemIsDark ? 'dark' : 'light') : prev;
      return current === 'dark' ? 'light' : 'dark';
    });
  }, [systemIsDark]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        mode: theme,
        resolvedTheme,
        setTheme,
        setMode: setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

