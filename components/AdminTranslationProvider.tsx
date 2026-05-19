'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import enAdmin from '@/translations/admin/en.json';
import svAdmin from '@/translations/admin/sv.json';

type Locale = 'en' | 'sv';

// Use type inference from English translations but allow flexible structure
// This ensures both translation files work without strict type checking
 type Messages = typeof enAdmin;

interface AdminTranslationContextType {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const AdminTranslationContext =
  createContext<AdminTranslationContextType | null>(null);

const translations: Record<Locale, Messages> = {
  en: enAdmin,
  sv: svAdmin,
};

// Helper to get nested value from object using dot notation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let value: unknown = obj;
  for (const key of keys) {
    if (value === undefined || value === null) return path;
    value = (value as Record<string, unknown>)[key];
  }
  return typeof value === 'string' ? value : path;
}

// Replace placeholders like {name} with actual values
function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return text.replace(/{(\w+)}/g, (_, key) => String(params[key] ?? `{${key}}`));
}

interface AdminTranslationProviderProps {
  children: ReactNode;
  storageKey?: string;
}

export function AdminTranslationProvider({
  children,
  storageKey = 'admin-locale',
}: AdminTranslationProviderProps) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Use requestAnimationFrame to avoid synchronous setState during render
    requestAnimationFrame(() => {
      const savedLocale = localStorage.getItem(storageKey) as Locale | null;
      if (savedLocale && (savedLocale === 'en' || savedLocale === 'sv')) {
        setLocaleState(savedLocale);
      }
      setMounted(true);
    });
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
    <AdminTranslationContext.Provider
      value={{ locale, messages: translations[locale], setLocale, t }}
    >
      {children}
    </AdminTranslationContext.Provider>
  );
}

export function useAdminTranslation() {
  const context = useContext(AdminTranslationContext);
  if (!context) {
    throw new Error(
      'useAdminTranslation must be used within AdminTranslationProvider'
    );
  }
  return context;
}

// Shorthand hook for just the t function
export function useAdminT() {
  const { t } = useAdminTranslation();
  return t;
}
