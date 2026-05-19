'use client';

import {
  createContext,
  useContext,
  ReactNode,
} from 'react';
import enAdmin from '@/translations/admin/en.json';

type Locale = 'en';

type Messages = typeof enAdmin;

interface AdminTranslationContextType {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const AdminTranslationContext =
  createContext<AdminTranslationContextType | null>(null);

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
}: AdminTranslationProviderProps) {
  const locale: Locale = 'en';

  const setLocale = (_newLocale: Locale) => {
    // No-op: only English supported
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const text = getNestedValue(enAdmin, key);
    return interpolate(text, params);
  };

  return (
    <AdminTranslationContext.Provider
      value={{ locale, messages: enAdmin, setLocale, t }}
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

export function useAdminT() {
  const { t } = useAdminTranslation();
  return t;
}
