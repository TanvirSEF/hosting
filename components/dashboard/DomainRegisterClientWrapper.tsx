'use client';

import * as React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardTranslationProvider } from '@/components/DashboardTranslationProvider';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Check,
  X,
  AlertCircle,
  ShoppingCart,
  Search,
  Globe,
} from 'lucide-react';
import { useState, useTransition } from 'react';
import {
  checkDomainAvailability,
  type DomainSearchResult,
} from '@/actions/domain-search-actions';
import { getTLDPricingAction } from '@/actions/domain-order-actions';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import DomainConfigModal from '@/components/home/DomainConfigModal';
import { useCurrency } from '@/contexts/CurrencyContext';
import { trackAddToCart } from '@/lib/ga4';
import { useDashboardTranslation } from '@/components/DashboardTranslationProvider';
import { type CheckboxAddon } from '@/components/home/DomainConfigModal';
import { Mail, Shield, Zap } from 'lucide-react';

interface DomainRegisterClientWrapperProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    firstname: string;
  } | null;
}



function DomainRegisterContent({ user }: DomainRegisterClientWrapperProps) {
  const { t } = useDashboardTranslation();
  const { addToCart, isInCart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSearchTerm, setLastSearchTerm] = useState('');
  const [results, setResults] = useState<DomainSearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [whmcsPricing, setWhmcsPricing] = useState<Record<string, any> | null>(
    null
  );
  const { formatPrice, currency } = useCurrency();

  const normalizeDomainInput = (value: string) => {
    return (value || '')
      .toLowerCase()
      .trim()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .replace(/\/$/, '')
      .replace(/\.+$/, '');
  };

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] =
    useState<DomainSearchResult | null>(null);

  // Fetch WHMCS pricing on component mount
  React.useEffect(() => {
    const fetchPricing = async () => {
      try {
        const pricingResult = await getTLDPricingAction(currency);
        if (pricingResult.success && pricingResult.data) {
          setWhmcsPricing(pricingResult.data);
          // Ignore currency from result as we use CurrencyContext
        }
      } catch (err) {
        // Error fetching pricing
      }
    };
    fetchPricing();
  }, [currency]);

  // Handle search
  const handleSearch = () => {
    const cleanedTerm = normalizeDomainInput(searchTerm);

    if (!cleanedTerm) {
      setError(t('domainRegister.error.emptyDomain'));
      return;
    }

    const domainPart = cleanedTerm.split('.')[0];
    if (
      !domainPart ||
      !/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*$/.test(domainPart)
    ) {
      setError(t('domainRegister.error.invalid'));
      return;
    }

    setError(null);
    setShowResults(true);
    setLastSearchTerm(cleanedTerm);

    startTransition(async () => {
      const response = await checkDomainAvailability(cleanedTerm, currency);

      if (response.success && response.data) {
        setResults(response.data.results);
      } else {
        setError(response.error || t('domainRegister.error.failed'));
        setResults([]);
      }
    });
  };

  const handleClearSearch = () => {
    setShowResults(false);
    setResults([]);
    setSearchTerm('');
    setLastSearchTerm('');
    setError(null);
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle add to cart - Open configuration modal
  const handleAddToCart = (result: DomainSearchResult) => {
    setSelectedDomain(result);
    setIsModalOpen(true);
  };

  // Handle modal submit - Add configured domain to cart
  const handleModalAddToCart = (config: {
    domain: string;
    tld: string;
    regPeriod: number;
    price: number;
    addons: { id: string; name: string; price: number }[];
  }) => {
    // Combine domain and TLD to create full domain name
    const fullDomain = `${config.domain}${config.tld}`;

    addToCart({
      type: 'domain',
      domain: fullDomain, // Store full domain in cart
      tld: config.tld, // Keep TLD for reference
      price: config.price,
      regPeriod: config.regPeriod,
      addons: config.addons.length > 0 ? config.addons : undefined,
    });

    toast.success(t('domainRegister.cart.added', { domain: fullDomain }), {
      description: `${config.regPeriod} ${config.regPeriod === 1
        ? t('domainRegister.cart.year')
        : t('domainRegister.cart.years')
        } - ${formatPrice(config.price)}`,
    });

    trackAddToCart({
      currency,
      value: config.price,
      items: [{
        item_id: `domain-${fullDomain}`,
        item_name: fullDomain,
        price: config.price,
        quantity: config.regPeriod,
      }],
    });

    setIsModalOpen(false);
  };
  const isDomainInCart = (domain: string) => {
    return isInCart(`domain-${domain}`);
  };

  // Get price for domain - try WHMCS first, fallback to defaults
  const getDomainPrice = (tld: string) => {
    // Try WHMCS pricing first
    if (whmcsPricing) {
      // WHMCS pricing keys might be without dot (e.g., 'com' instead of '.com')
      const tldKey = tld.startsWith('.') ? tld.substring(1) : tld;
      const tldWithDot = tld.startsWith('.') ? tld : `.${tld}`;

      // Try both formats: with dot and without dot
      const pricingData =
        whmcsPricing[tld] || whmcsPricing[tldKey] || whmcsPricing[tldWithDot];

      if (pricingData) {
        // WHMCS pricing structure: register is an object with year-based keys
        // Format: register: {1: '13.87', 2: '28.64', 3: '43.42', ...}
        let priceStr = null;

        // Check if register is an object with year-based pricing
        if (pricingData.register && typeof pricingData.register === 'object') {
          // Get 1-year price (key '1' or '1year')
          priceStr =
            pricingData.register['1'] ||
            pricingData.register['1year'] ||
            pricingData.register[1];
        }
        // Try direct register field (if it's a string/number)
        else if (
          pricingData.register !== undefined &&
          pricingData.register !== null &&
          typeof pricingData.register !== 'object'
        ) {
          priceStr = pricingData.register;
        }
        // Try nested pricing object
        else if (pricingData.pricing) {
          if (typeof pricingData.pricing.register === 'object') {
            priceStr =
              pricingData.pricing.register['1'] ||
              pricingData.pricing.register['1year'] ||
              pricingData.pricing.register[1];
          } else {
            priceStr = pricingData.pricing.register;
          }
        }
        // Try year-based fields directly
        else if (pricingData['1'] !== undefined) {
          priceStr = pricingData['1'];
        } else if (pricingData['1year'] !== undefined) {
          priceStr = pricingData['1year'];
        }
        // Try register_1 format
        else if (pricingData.register_1 !== undefined) {
          priceStr = pricingData.register_1;
        }

        if (priceStr !== null && priceStr !== undefined) {
          const price = parseFloat(priceStr);
          if (price > 0 && !isNaN(price)) {
            return price;
          }
        }
      } else {
        // Log available TLDs for debugging
        const availableTlds = Object.keys(whmcsPricing).slice(0, 5);
      }
    }


    return 0;
  };


  // Helper to get full pricing map for a TLD
  const getPricingMap = (tld: string): Record<number, number> => {
    if (!whmcsPricing) return { 1: 0 };

    // Normalize lookup
    const tldWithDot = tld.startsWith('.') ? tld : `.${tld}`;
    const tldNoDot = tld.startsWith('.') ? tld.substring(1) : tld;

    const pricingData = whmcsPricing[tld] || whmcsPricing[tldWithDot] || whmcsPricing[tldNoDot];

    if (!pricingData || !pricingData.register) return { 1: 0 };

    const priceMap: Record<number, number> = {};

    if (typeof pricingData.register === 'object') {
      Object.keys(pricingData.register).forEach(year => {
        const price = parseFloat(pricingData.register[year]);
        if (!isNaN(price) && price > 0) {
          priceMap[parseInt(year)] = price;
        }
      });
    } else if (typeof pricingData.register === 'string' || typeof pricingData.register === 'number') {
      const price = parseFloat(pricingData.register as string);
      if (!isNaN(price) && price > 0) {
        priceMap[1] = price;
      }
    }

    if (Object.keys(priceMap).length === 0) return { 1: 0 };

    return priceMap;
  };

  // Helper to get available addons based on WHMCS flags
  const getAvailableAddons = (tld: string): CheckboxAddon[] => {
    if (!whmcsPricing) return [];

    // Normalize lookup
    const tldWithDot = tld.startsWith('.') ? tld : `.${tld}`;
    const tldNoDot = tld.startsWith('.') ? tld.substring(1) : tld;

    const pricingData = whmcsPricing[tld] || whmcsPricing[tldWithDot] || whmcsPricing[tldNoDot];

    // WHMCS usually returns addons availability as booleans in 'addons' object
    // Structure: addons: { dns: boolean, email: boolean, idprotect: boolean, ... }
    const addonsData = pricingData?.addons || {};

    const addons: CheckboxAddon[] = [];

    // Extract addon prices from WHMCS data
    const getAddonPrice = (addonKey: string): number => {
      const addonData = addonsData[addonKey];
      if (!addonData) return 0;
      
      // WHMCS addon pricing structure: { pricing: { 1: price, 2: price, ... } }
      if (addonData.pricing && addonData.pricing[1]) {
        return parseFloat(addonData.pricing[1]) || 0;
      }
      
      // Fallback to direct price if available
      if (typeof addonData === 'number') {
        return addonData;
      }
      
      return 0;
    };

    // DNS Management
    if (addonsData.dns || addonsData.dnsmanagement) {
      addons.push({
        id: 'dnsmanagement',
        name: 'DNS Management',
        description: 'External DNS Hosting can help speed up your website and improve availability with increased redundancy.',
        price: getAddonPrice('dnsmanagement') || getAddonPrice('dns'),
        icon: <Zap className="h-5 w-5" />,
      });
    }

    // Email Forwarding
    if (addonsData.email || addonsData.emailforwarding) {
      addons.push({
        id: 'emailforwarding',
        name: 'Email Forwarding',
        description: 'Get emails forwarded to alternate email addresses of your choice so that you can monitor all from a single account.',
        price: getAddonPrice('emailforwarding') || getAddonPrice('email'),
        icon: <Mail className="h-5 w-5" />,
      });
    }

    // ID Protection
    if (addonsData.idprotect || addonsData.idprotection) {
      addons.push({
        id: 'idprotection',
        name: 'ID Protection',
        description: 'Protect your personal information and reduce the amount of spam to your inbox.',
        price: getAddonPrice('idprotection') || getAddonPrice('idprotect'),
        icon: <Shield className="h-5 w-5" />,
      });
    }

    return addons;
  };

  const renderResultCard = (
    result: DomainSearchResult,
    opts?: { isPrimary?: boolean }
  ) => {
    const price = getDomainPrice(result.tld);
    const isInCartCheck = isDomainInCart(result.domain);
    const isPrimary = Boolean(opts?.isPrimary);

    return (
      <div
        key={result.domain}
        className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
          result.available
            ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
            : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'
        } ${isPrimary ? 'ring-1 ring-foreground/10' : ''}`}
      >
        <div className="flex flex-1 items-center gap-3">
          {result.available ? (
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
            <X className="h-5 w-5 text-red-600 dark:text-red-400" />
          )}
          <div className="flex-1">
            <div className="text-lg font-semibold">{result.domain}</div>
            <div className="text-muted-foreground text-sm">
              {result.available
                ? t('domainRegister.results.available')
                : t('domainRegister.results.registered')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {result.available &&
            (price > 0 ? (
              <div className="text-right">
                <div className="text-lg font-bold">{formatPrice(price)}</div>
                <div className="text-muted-foreground text-xs">
                  {t('domainRegister.results.perYear')}
                </div>
              </div>
            ) : (
              <div className="text-right">
                <div className="text-lg font-bold text-muted-foreground">
                  -
                </div>
                <div className="text-muted-foreground text-xs">
                  {t('domainRegister.results.unavailable') || 'Unavailable'}
                </div>
              </div>
            ))}
          {result.available && (
            <Button
              onClick={() => handleAddToCart(result)}
              disabled={isInCartCheck || price <= 0}
              variant={isInCartCheck ? 'outline' : 'default'}
            >
              {isInCartCheck ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {t('domainRegister.cart.inCart')}
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {t('domainRegister.cart.addToCart')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Header Section */}
              <div className="px-4 lg:px-6">
                <h1 className="text-foreground text-3xl font-bold tracking-tight">
                  {t('domainRegister.title')}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {t('domainRegister.subtitle')}
                </p>
              </div>

              <div className="space-y-6 px-4 lg:px-6">
                {/* Domain Search Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      {t('domainRegister.search.title')}
                    </CardTitle>
                    <CardDescription>
                      {t('domainRegister.search.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                          placeholder={t('domainRegister.search.placeholder')}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="pl-9"
                        />
                      </div>
                      <Button
                        onClick={handleSearch}
                        disabled={isPending}
                        className="px-6"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('domainRegister.search.searching')}
                          </>
                        ) : (
                          <>
                            <Search className="mr-2 h-4 w-4" />
                            {t('domainRegister.search.button')}
                          </>
                        )}
                      </Button>
                    </div>

                    {error && (
                      <div className="text-destructive bg-destructive/10 mt-4 flex items-center gap-2 rounded-md p-3 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Results Card */}
                {showResults && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('domainRegister.results.title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {results.length === 0 ? (
                        <div className="text-muted-foreground py-8 text-center">
                          <Globe className="mx-auto mb-4 h-12 w-12 opacity-50" />
                          <p>{t('domainRegister.results.tryDifferent')}</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm font-medium">
                              {t('domainRegister.results.resultsFor')}{' '}
                              <span className="text-foreground">
                                "{lastSearchTerm}"
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleClearSearch}
                            >
                              {t('domainRegister.results.clearSearch')}
                            </Button>
                          </div>

                          {(() => {
                            const query = normalizeDomainInput(lastSearchTerm);
                            const queryDomain = query.includes('.')
                              ? query
                              : `${query}.com`;

                            const primary =
                              results.find(
                                (r) => r.domain.toLowerCase() === queryDomain
                              ) ||
                              results.find((r) =>
                                r.domain.toLowerCase().startsWith(`${query}.`)
                              ) ||
                              results[0];

                            const suggestionsList = results
                              .filter((r) => r.domain !== primary.domain)
                              .slice()
                              .sort((a, b) => {
                                if (a.available && !b.available) return -1;
                                if (!a.available && b.available) return 1;
                                return a.domain.localeCompare(b.domain);
                              });

                            return (
                              <div className="space-y-4">
                                {renderResultCard(primary, { isPrimary: true })}

                                {suggestionsList.length > 0 && (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        {t(
                                          'domainRegister.results.suggestionsHeading'
                                        )}
                                      </span>
                                      <div className="h-px flex-1 bg-border" />
                                    </div>
                                    <div className="space-y-3">
                                      {suggestionsList.map((result) =>
                                        renderResultCard(result)
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {results.every((r) => !r.available) && (
                            <div className="border-amber-200 bg-amber-50/60 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100 rounded-lg border p-4">
                              <div className="flex items-start gap-3">
                                <AlertCircle className="mt-0.5 h-5 w-5" />
                                <div>
                                  <div className="font-semibold">
                                    {t('domainRegister.results.allTakenTitle')}
                                  </div>
                                  <div className="text-sm text-amber-800/90 dark:text-amber-100/80">
                                    {t('domainRegister.results.allTakenDesc')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Domain Configuration Modal */}
      {selectedDomain && (
        <DomainConfigModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          domain={selectedDomain.domain.split('.')[0]}
          tld={selectedDomain.tld}
          yearPrices={getPricingMap(selectedDomain.tld)}
          availableAddons={getAvailableAddons(selectedDomain.tld)}
          onAddToCart={handleModalAddToCart}
        />
      )}

    </SidebarProvider>
  );
}

export function DomainRegisterClientWrapper({
  user,
}: DomainRegisterClientWrapperProps) {
  return (
    <DashboardTranslationProvider>
      <DomainRegisterContent user={user} />
    </DashboardTranslationProvider>
  );
}
