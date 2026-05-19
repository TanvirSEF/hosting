'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cookie,
  Shield,
  BarChart,
  ShoppingBag,
  X,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface CookieSettings {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<CookieSettings>({
    essential: true, // Always true and disabled
    analytics: true, // Default to true or false based on preference, usually false for strict compliance
    marketing: true,
  });

  useEffect(() => {
    // Check if user has already consented
    const savedConsent = localStorage.getItem('cookie-consent');
    if (!savedConsent) {
      // Delay showing the banner for a smooth entrance
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = { essential: true, analytics: true, marketing: true };
    saveConsent(allAccepted);
  };

  const handleRejectAll = () => {
    const allRejected = { essential: true, analytics: false, marketing: false };
    saveConsent(allRejected);
  };

  const handleSaveSettings = () => {
    saveConsent(settings);
  };

  const saveConsent = (preference: CookieSettings) => {
    localStorage.setItem('cookie-consent', JSON.stringify(preference));
    setIsVisible(false);
    setShowSettings(false);

    // Here you would trigger your analytics/marketing scripts
    // e.g. if (preference.analytics) enableGoogleAnalytics()
  };

  if (!isVisible) return null;

  return (
    <>
      <AnimatePresence>
        {isVisible && !showSettings && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed right-4 bottom-4 left-4 z-50 md:left-auto md:w-[450px]"
          >
            <div className="border-primary/20 shadow-primary/10 rounded-2xl border bg-white/90 p-6 shadow-2xl backdrop-blur-md dark:bg-zinc-900/90">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 shrink-0 rounded-xl p-3">
                  <Cookie className="text-primary h-6 w-6" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-foreground font-semibold">
                    We value your privacy
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    We use cookies to enhance your browsing experience, serve
                    personalized content, and analyze our traffic.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(true)}
                  className="h-9 flex-1 text-xs sm:text-sm"
                >
                  Customize
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleRejectAll}
                  className="h-9 flex-1 text-xs sm:text-sm"
                >
                  Reject All
                </Button>
                <Button
                  onClick={handleAcceptAll}
                  className="bg-primary hover:bg-primary/90 shadow-primary/20 h-9 flex-1 text-xs text-white shadow-lg sm:text-sm"
                >
                  Accept All
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Cookie className="text-primary h-5 w-5" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Manage your cookie settings. Essential cookies are required for
              the website to function.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Essential */}
            <div className="bg-muted/50 flex items-start justify-between rounded-lg border p-4">
              <div className="flex gap-3">
                <div>
                  <h4 className="text-sm font-medium">Essential Cookies</h4>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Required for basic site functionality like login and
                    navigation.
                  </p>
                </div>
              </div>
              <div className="flex h-6 items-center">
                <div className="bg-primary relative h-4 w-4 cursor-not-allowed rounded-full opacity-50">
                  <div className="absolute inset-1 rounded-full bg-white"></div>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="hover:bg-muted/30 flex items-start justify-between rounded-lg border p-4 transition-colors">
              <div className="flex gap-3">
                <div>
                  <h4 className="text-sm font-medium">Analytics</h4>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Help us understand how visitors interact with our website.
                  </p>
                </div>
              </div>
              <div className="flex h-6 items-center">
                <CustomSwitch
                  checked={settings.analytics}
                  onCheckedChange={(c) =>
                    setSettings((prev) => ({ ...prev, analytics: c }))
                  }
                />
              </div>
            </div>

            {/* Marketing */}
            <div className="hover:bg-muted/30 flex items-start justify-between rounded-lg border p-4 transition-colors">
              <div className="flex gap-3">
                <div>
                  <h4 className="text-sm font-medium">Marketing</h4>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Used to deliver relevant advertisements and track
                    performance.
                  </p>
                </div>
              </div>
              <div className="flex h-6 items-center">
                <CustomSwitch
                  checked={settings.marketing}
                  onCheckedChange={(c) =>
                    setSettings((prev) => ({ ...prev, marketing: c }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              className="bg-primary hover:bg-primary/90"
            >
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CustomSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (c: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'focus-visible:ring-ring focus-visible:ring-offset-background h-6 w-11 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        checked ? 'bg-primary' : 'bg-input'
      )}
    >
      <span
        className={cn(
          'bg-background pointer-events-none ml-0.5 block h-5 w-5 rounded-full shadow-sm transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}
