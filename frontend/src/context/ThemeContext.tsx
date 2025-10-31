import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface Theme {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  border_color: string;
  success_color: string;
  error_color: string;
  warning_color: string;
  info_color: string;
}

interface Fonts {
  id: string;
  name: string;
  primary_font: string;
  heading_font: string;
  base_font_size: number;
  heading_font_size: number;
  button_font_size: number;
  primary_font_weight: string;
  heading_font_weight: string;
  button_font_weight: string;
}

interface ThemeContextType {
  theme: Theme | null;
  fonts: Fonts | null;
  loading: boolean;
  setTheme: (theme: Theme) => void;
  setFonts: (fonts: Fonts) => void;
  refreshTheme: () => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [fonts, setFonts] = useState<Fonts | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      loadThemeAndFonts();
    }
  }, [token]);

  const loadThemeAndFonts = async () => {
    try {
      const [themeRes, fontsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/admin/themes/active`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/admin/fonts/active`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (themeRes.ok) {
        const themeData = await themeRes.json();
        setTheme(themeData);
        applyThemeToDOM(themeData);
      }

      if (fontsRes.ok) {
        const fontsData = await fontsRes.json();
        setFonts(fontsData);
        applyFontsToDOM(fontsData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading theme:', error);
      setLoading(false);
    }
  };

  const applyThemeToDOM = (theme: Theme) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primary_color);
    root.style.setProperty('--color-secondary', theme.secondary_color);
    root.style.setProperty('--color-accent', theme.accent_color);
    root.style.setProperty('--color-background', theme.background_color);
    root.style.setProperty('--color-text', theme.text_color);
    root.style.setProperty('--color-border', theme.border_color);
    root.style.setProperty('--color-success', theme.success_color);
    root.style.setProperty('--color-error', theme.error_color);
    root.style.setProperty('--color-warning', theme.warning_color);
    root.style.setProperty('--color-info', theme.info_color);
  };

  const applyFontsToDOM = (fonts: Fonts) => {
    const root = document.documentElement;
    root.style.setProperty('--font-primary', fonts.primary_font);
    root.style.setProperty('--font-heading', fonts.heading_font);
    root.style.setProperty('--font-base-size', `${fonts.base_font_size}px`);
    root.style.setProperty('--font-heading-size', `${fonts.heading_font_size}px`);
    root.style.setProperty('--font-button-size', `${fonts.button_font_size}px`);
    root.style.setProperty('--font-weight-primary', fonts.primary_font_weight);
    root.style.setProperty('--font-weight-heading', fonts.heading_font_weight);
    root.style.setProperty('--font-weight-button', fonts.button_font_weight);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        fonts,
        loading,
        setTheme,
        setFonts,
        refreshTheme: loadThemeAndFonts,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
