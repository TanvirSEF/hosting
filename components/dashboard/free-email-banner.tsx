'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardTranslation } from '@/components/DashboardTranslationProvider';
import { Mail, X, ArrowRight, Sparkles } from 'lucide-react';

interface FreeEmailBannerProps {
  show: boolean;
}

const DISMISS_KEY = 'free-email-banner-dismissed';

export function FreeEmailBanner({ show }: FreeEmailBannerProps) {
  const { t } = useDashboardTranslation();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const wasDismissed = localStorage.getItem(DISMISS_KEY) === 'true';
      setDismissed(wasDismissed);
    } catch {
      // localStorage unavailable
    }
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (!show || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // localStorage unavailable
    }
  };

  const handleClaim = () => {
    router.push('/dashboard/emails');
  };

  return (
    <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-primary/20 bg-primary/5 px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">
              {t('dashboard.freeEmailBanner.title')}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('dashboard.freeEmailBanner.description')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={handleClaim}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-md hover:scale-[1.03] active:scale-[0.98]"
        >
          {t('dashboard.freeEmailBanner.cta')}
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={handleDismiss}
          className="rounded-full p-1 text-muted-foreground hover:bg-primary/10 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
