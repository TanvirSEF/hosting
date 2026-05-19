'use client';

import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LanguageSwitcherDashboard() {
  return (
    <Button variant="ghost" size="sm" className="gap-2" disabled>
      <Globe className="h-4 w-4" />
      <span className="hidden sm:inline">EN</span>
    </Button>
  );
}

// Hook to get current locale — always returns 'en'
export function useDashboardLocale(): string {
  return 'en';
}
