'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import enDashboard from '@/translations/dashboard/en.json';
import svDashboard from '@/translations/dashboard/sv.json';

type Messages = typeof enDashboard;
type Locale = 'en' | 'sv';

interface DashboardTranslationContextType {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const DashboardTranslationContext =
  createContext<DashboardTranslationContextType | null>(null);

const translations: Record<Locale, Messages> = {
  en: enDashboard,
  sv: svDashboard,
};

// Helper to get nested value from object using dot notation
function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value === undefined || value === null) return path;
    value = value[key];
  }
  return typeof value === 'string' ? value : path;
}

// Replace placeholders like {firstname} with actual values
function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return text.replace(/{(\w+)}/g, (_, key) => String(params[key] ?? `{${key}}`));
}

interface DashboardTranslationProviderProps {
  children: ReactNode;
  storageKey?: string;
}

export function DashboardTranslationProvider({
  children,
  storageKey = 'dashboard-locale',
}: DashboardTranslationProviderProps) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLocale = localStorage.getItem(storageKey) as Locale | null;
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'sv')) {
      setLocaleState(savedLocale);
    }
    setMounted(true);
  }, [storageKey]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(storageKey, newLocale);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const text = getNestedValue(translations[locale], key);
    return interpolate(text, params);
  };

  // Prevent hydration mismatch by returning null until mounted
  if (!mounted) {
    return null;
  }

  return (
    <DashboardTranslationContext.Provider
      value={{ locale, messages: translations[locale], setLocale, t }}
    >
      {children}
    </DashboardTranslationContext.Provider>
  );
}

export function useDashboardTranslation() {
  const context = useContext(DashboardTranslationContext);
  if (!context) {
    throw new Error(
      'useDashboardTranslation must be used within DashboardTranslationProvider'
    );
  }
  return context;
}

// Shorthand hook for just the t function
export function useT() {
  const { t } = useDashboardTranslation();
  return t;
}
