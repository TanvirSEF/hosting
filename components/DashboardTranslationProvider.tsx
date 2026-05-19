'use client';

import {
  createContext,
  useContext,
  ReactNode,
} from 'react';
import enDashboard from '@/translations/dashboard/en.json';

type Messages = typeof enDashboard;
type Locale = 'en';

interface DashboardTranslationContextType {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const DashboardTranslationContext =
  createContext<DashboardTranslationContextType | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value === undefined || value === null) return path;
    value = value[key];
  }
  return typeof value === 'string' ? value : path;
}

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
}: DashboardTranslationProviderProps) {
  const locale: Locale = 'en';

  const setLocale = (_newLocale: Locale) => {
    // No-op: only English supported
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const text = getNestedValue(enDashboard, key);
    return interpolate(text, params);
  };

  return (
    <DashboardTranslationContext.Provider
      value={{ locale, messages: enDashboard, setLocale, t }}
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

export function useT() {
  const { t } = useDashboardTranslation();
  return t;
}
