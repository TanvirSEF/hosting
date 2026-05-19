'use client';

import { useState, useEffect, useTransition } from 'react';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface LanguageSwitcherDashboardProps {
  storageKey?: string;
  onLocaleChange?: (locale: string) => void;
}

export function LanguageSwitcherDashboard({
  storageKey = 'dashboard-locale',
  onLocaleChange,
}: LanguageSwitcherDashboardProps) {
  const [locale, setLocale] = useState<string>('en');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Load saved locale from localStorage
    const savedLocale = localStorage.getItem(storageKey);
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'sv')) {
      setLocale(savedLocale);
    }
  }, [storageKey]);

  const handleLocaleChange = (newLocale: string) => {
    startTransition(() => {
      setLocale(newLocale);
      localStorage.setItem(storageKey, newLocale);
      if (onLocaleChange) {
        onLocaleChange(newLocale);
      }
      // Force page reload to apply new translations
      window.location.reload();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          disabled={isPending}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {locale === 'en' ? 'EN' : 'SV'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleLocaleChange('en')}
          className={locale === 'en' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇬🇧</span>
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLocaleChange('sv')}
          className={locale === 'sv' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇸🇪</span>
          Svenska
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hook to get current locale from localStorage
export function useDashboardLocale(
  storageKey: string = 'dashboard-locale'
): string {
  const [locale, setLocale] = useState<string>('en');

  useEffect(() => {
    const savedLocale = localStorage.getItem(storageKey);
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'sv')) {
      setLocale(savedLocale);
    }
  }, [storageKey]);

  return locale;
}
