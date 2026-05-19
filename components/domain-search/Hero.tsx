'use client';

import {
  Search,
  Loader2,
  Check,
  X,
  AlertCircle,
  ShoppingCart,
  Mail,
  Shield,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useTransition } from 'react';
import {
  checkDomainAvailability,
  type DomainSearchResult,
} from '@/actions/domain-search-actions';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { trackAddToCart } from '@/lib/ga4';
import { toast } from 'sonner';
import DomainConfigModal, {
  type CheckboxAddon,
} from '@/components/home/DomainConfigModal';

export default function Hero() {
  const t = useTranslations('domain-search.hero');
  const router = useRouter();
  const { currency, currencyInfo } = useCurrency();
  const { addToCart, isInCart } = useCart();
  const suggestions = (t.raw('suggestions') as string[]) || [];

  const normalizeDomainInput = (value: string) => {
    return (value || '')
      .toLowerCase()
      .trim()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .replace(/\/$/, '')
      .replace(/\.+$/, '');
  };

  // Auto-typing states
  const [placeholder, setPlaceholder] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSearchTerm, setLastSearchTerm] = useState('');
  const [results, setResults] = useState<DomainSearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [whmcsPricing, setWhmcsPricing] = useState<Record<string, any> | null>(
    null
  );

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] =
    useState<DomainSearchResult | null>(null);

  // Fetch WHMCS pricing in selected currency (no hardcoded pricing)
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const { getTLDPricing: fetchTLDPricing } = await import(
          '@/actions/domain-search-actions'
        );
        const result = await fetchTLDPricing(currency);
        if (result.success && result.data) {
          const pricingMap: Record<string, any> = {};
          Object.keys(result.data).forEach((key) => {
            const normalizedKey = key.startsWith('.') ? key : `.${key}`;
            pricingMap[normalizedKey] = (result.data as any)[key];
          });
          setWhmcsPricing(pricingMap);
        }
      } catch (e) {
        // Intentionally silent: UI will still show availability
      }
    };
    fetchPricing();
  }, [currency]);

  // Typing animation effect
  useEffect(() => {
    const handleType = () => {
      if (!suggestions.length) return;
      const i = loopNum % suggestions.length;
      const fullText = suggestions[i];

      setPlaceholder(
        isDeleting
          ? fullText.substring(0, placeholder.length - 1)
          : fullText.substring(0, placeholder.length + 1)
      );

      let speed = 150;
      if (isDeleting) speed = 50;

      if (!isDeleting && placeholder === fullText) {
        speed = 2000;
        setIsDeleting(true);
      } else if (isDeleting && placeholder === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        speed = 500;
      }

      setTypingSpeed(speed);
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [placeholder, isDeleting, loopNum, typingSpeed, suggestions]);

  // Handle search
  const handleSearch = () => {
    const cleanedTerm = normalizeDomainInput(searchTerm);

    if (!cleanedTerm) {
      setError(t('errorEmpty'));
      return;
    }

    // Validate domain format - must contain at least one alphanumeric character
    const domainPart = cleanedTerm.split('.')[0];
    if (
      !domainPart ||
      !/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*$/.test(domainPart)
    ) {
      setError(
        'Please enter a valid domain name (e.g., example or example.com)'
      );
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
        setError(response.error || t('errorFailed'));
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

  // Handle register domain - redirect to order page
  const handleRegister = (domain: string) => {
    router.push(`/order?domain=${encodeURIComponent(domain)}`);
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
    addToCart({
      type: 'domain',
      domain: config.domain,
      tld: config.tld,
      price: config.price,
      regPeriod: config.regPeriod,
      addons: config.addons.length > 0 ? config.addons : undefined,
    });

    
    toast.success(t('toastAddedTitle', { domain: config.domain }), {
      description: t('toastAddedDesc', {
        years: config.regPeriod,
        price: `${currencyInfo.prefix}${config.price.toFixed(2)}${currencyInfo.suffix}`,
      }),
    });
    
    trackAddToCart({
      currency: currencyInfo.code,
      value: config.price,
      items: [{
        item_id: `domain-${config.domain}`,
        item_name: config.domain,
        price: config.price,
        quantity: config.regPeriod,
      }],
    });

    setIsModalOpen(false);
  };

  const isDomainInCart = (domain: string) => isInCart(`domain-${domain}`);

  // Get pricing for a TLD from WHMCS (no fallback pricing)
  const getTLDPricing = (tld: string) => {
    if (whmcsPricing) {
      const tldWithDot = tld.startsWith('.') ? tld : `.${tld}`;
      const tldNoDot = tld.startsWith('.') ? tld.substring(1) : tld;
      const pricingData =
        whmcsPricing[tld] || whmcsPricing[tldWithDot] || whmcsPricing[tldNoDot];

      if (pricingData) {
        let registerPrice = 0;
        let renewPrice = 0;

        const extractPrice = (priceVal: any): number => {
          if (!priceVal) return 0;
          if (typeof priceVal === 'number') return priceVal;
          if (typeof priceVal === 'string') return parseFloat(priceVal) || 0;
          if (typeof priceVal === 'object') {
            return parseFloat(priceVal['1']) || 0;
          }
          return 0;
        };

        registerPrice = extractPrice(pricingData.register);
        renewPrice = extractPrice(pricingData.renew);

        if (registerPrice > 0) {
          if (renewPrice <= 0) renewPrice = registerPrice;
          return { register: registerPrice, renew: renewPrice };
        }
      }
    }

    return { register: 0, renew: 0 };
  };

  const getPricingMap = (tld: string): Record<number, number> => {
    if (!whmcsPricing) return { 1: 0 };

    const tldWithDot = tld.startsWith('.') ? tld : `.${tld}`;
    const tldNoDot = tld.startsWith('.') ? tld.substring(1) : tld;

    const pricingData =
      whmcsPricing[tld] || whmcsPricing[tldWithDot] || whmcsPricing[tldNoDot];

    if (!pricingData || !pricingData.register) return { 1: 0 };

    const priceMap: Record<number, number> = {};

    if (typeof pricingData.register === 'object') {
      Object.keys(pricingData.register).forEach((year) => {
        const price = parseFloat(pricingData.register[year]);
        if (!Number.isNaN(price) && price > 0) {
          priceMap[parseInt(year, 10)] = price;
        }
      });
    } else if (typeof pricingData.register === 'string') {
      const price = parseFloat(pricingData.register);
      if (!Number.isNaN(price) && price > 0) {
        priceMap[1] = price;
      }
    }

    if (Object.keys(priceMap).length === 0) return { 1: 0 };
    return priceMap;
  };

  const getAvailableAddons = (tld: string): CheckboxAddon[] => {
    if (!whmcsPricing) return [];

    const tldWithDot = tld.startsWith('.') ? tld : `.${tld}`;
    const tldNoDot = tld.startsWith('.') ? tld.substring(1) : tld;

    const pricingData =
      whmcsPricing[tld] || whmcsPricing[tldWithDot] || whmcsPricing[tldNoDot];

    const addonsData = pricingData?.addons || {};
    const addons: CheckboxAddon[] = [];

    // Extract addon prices from WHMCS data
    const getAddonPrice = (addonKey: string): number => {
      const addonData = addonsData[addonKey];
      if (!addonData) {
        return 0;
      }
      
      // WHMCS addon pricing structure: { pricing: { 1: price, 2: price, ... } }
      if (addonData.pricing && addonData.pricing[1]) {
        const price = parseFloat(addonData.pricing[1]) || 0;
        return price;
      }
      
      // Fallback to direct price if available
      if (typeof addonData === 'number') {
        return addonData;
      }
      
      return 0;
    };

    if (addonsData.dns || addonsData.dnsmanagement) {
      addons.push({
        id: 'dnsmanagement',
        name: t('addonDnsTitle'),
        description: t('addonDnsDesc'),
        price: getAddonPrice('dnsmanagement') || getAddonPrice('dns'),
        icon: <Zap className="h-5 w-5" />,
      });
    }

    if (addonsData.email || addonsData.emailforwarding) {
      addons.push({
        id: 'emailforwarding',
        name: t('addonEmailTitle'),
        description: t('addonEmailDesc'),
        price: getAddonPrice('emailforwarding') || getAddonPrice('email'),
        icon: <Mail className="h-5 w-5" />,
      });
    }

    if (addonsData.idprotect || addonsData.idprotection) {
      addons.push({
        id: 'idprotection',
        name: t('addonIdProtectTitle'),
        description: t('addonIdProtectDesc'),
        price: getAddonPrice('idprotection') || getAddonPrice('idprotect'),
        icon: <Shield className="h-5 w-5" />,
      });
    }

    return addons;
  };

  return (
    <section className="relative flex flex-1 flex-col justify-center overflow-hidden bg-[#06010E]">
      {/* Blob Glow Right */}
      <div className="pointer-events-none absolute top-[10%] -right-[10%] z-0 h-[400px] w-[400px] rounded-full bg-[radial-gradient(48.52%_49.86%_at_50%_50.14%,#8C52FF_35.58%,#000000_100%)] opacity-30 blur-[80px] md:h-[600px] md:w-[600px] lg:h-[824px] lg:w-[849px]" />
      <div className="h-[60px] w-full"></div>
      <div className="relative z-10 container mx-auto flex h-full w-full max-w-[1920px] flex-col items-center justify-center gap-6 px-4 pt-24 pb-8 sm:px-6 md:gap-8 md:px-6 md:py-6 lg:gap-12 lg:px-12 lg:py-8 xl:gap-16 xl:px-20 xl:py-10 2xl:px-32">
        <div className="flex w-full max-w-[1185px] flex-col items-center gap-8 md:gap-10 lg:gap-[60px]">
          {/* Top Content */}
          <div className="flex w-full max-w-[734px] flex-col items-center gap-4 text-center md:gap-6">
            {/* Header Text */}
            <div className="w-full space-y-3 md:space-y-4">
              <h1 className="font-dm-sans text-[clamp(2.125rem,5vw,4.375rem)] leading-[1.1] font-bold tracking-tight text-white">
                {t('title')}
              </h1>
              <p className="font-dm-sans text-[clamp(0.875rem,1.5vw,1.125rem)] leading-normal font-normal text-white/60">
                {t('subtitle')}
              </p>
            </div>

            {/* Search Box */}
            <div className="flex w-full max-w-[698px] items-center gap-3 rounded-full border border-[#EAECF0] bg-white p-2 pl-4 shadow-[0px_4px_35px_rgba(0,0,0,0.09)] transition-all duration-300 hover:shadow-[0px_6px_40px_rgba(0,0,0,0.12)] md:gap-4 md:pl-6">
              <div className="flex flex-1 items-center gap-3 overflow-hidden md:gap-4">
                <Search
                  className="h-5 w-5 shrink-0 text-[#1E1F21] opacity-80 sm:h-6 sm:w-6"
                  strokeWidth={1.5}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    placeholder || t('searchPlaceholder')
                  }
                  disabled={isPending}
                  className="font-dm-sans min-w-0 flex-1 bg-transparent text-sm font-normal text-[#667085]/70 outline-none placeholder:text-[#667085]/70 disabled:opacity-50 sm:text-base md:text-lg"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isPending || !searchTerm.trim()}
                className="font-dm-sans h-[40px] shrink-0 rounded-full bg-[#8C52FF] px-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#7b42ff] disabled:opacity-50 sm:h-[45px] sm:px-6 sm:text-base"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('searching')}
                  </>
                ) : (
                  t('searchButton')
                )}
              </Button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex w-full max-w-[698px] items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/20 p-4 text-red-300">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Search Results */}
          {showResults && (
            <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-[900px] duration-500">
              {isPending ? (
                <div className="space-y-4 rounded-xl border border-[#EAECF0] bg-white p-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex animate-pulse items-center gap-4 border-b border-[#EAECF0] pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                      <div className="flex-1">
                        <div className="mb-2 h-5 w-1/3 rounded bg-gray-200"></div>
                        <div className="h-4 w-1/4 rounded bg-gray-200"></div>
                      </div>
                      <div className="text-right">
                        <div className="mb-2 h-5 w-20 rounded bg-gray-200"></div>
                        <div className="h-4 w-16 rounded bg-gray-200"></div>
                      </div>
                      <div className="h-10 w-28 rounded-full bg-gray-200"></div>
                    </div>
                  ))}
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-4">
                  {/* Header with title and clear button */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-dm-sans text-left text-base font-semibold text-white sm:text-lg">
                      {t('resultsFor')} &quot;{lastSearchTerm}&quot;
                    </h3>
                    <button
                      onClick={handleClearSearch}
                      className="font-dm-sans text-sm font-medium text-white/60 transition-colors hover:text-white"
                    >
                      {t('clearSearch')}
                    </button>
                  </div>

                  {(() => {
                    const query = normalizeDomainInput(lastSearchTerm);
                    const queryDomain = query.includes('.') ? query : `${query}.com`;

                    const primary =
                      results.find((r) => r.domain.toLowerCase() === queryDomain) ||
                      results.find((r) => r.domain.toLowerCase().startsWith(`${query}.`)) ||
                      results[0];

                    const suggestionsList = results
                      .filter((r) => r.domain !== primary.domain)
                      .slice()
                      .sort((a, b) => {
                        if (a.available && !b.available) return -1;
                        if (!a.available && b.available) return 1;
                        return a.domain.localeCompare(b.domain);
                      });

                    const renderRow = (
                      result: DomainSearchResult,
                      opts?: { variant?: 'primary' | 'suggestion' }
                    ) => {
                      const pricing = getTLDPricing(result.tld);
                      const inCart = isDomainInCart(result.domain);
                      const finalPrice = pricing.register;

                      const isPrimary = opts?.variant === 'primary';
                      return (
                        <div
                          className={`flex flex-col gap-3 px-6 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                            isPrimary
                              ? result.available
                                ? 'bg-green-50'
                                : 'bg-red-50'
                              : 'hover:bg-gray-50'
                          } ${!isPrimary ? 'border-b border-[#EAECF0] last:border-b-0' : ''} ${
                            !result.available && !isPrimary ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                result.available ? 'bg-green-100' : 'bg-red-100'
                              }`}
                            >
                              {result.available ? (
                                <Check className="h-5 w-5 text-green-600" />
                              ) : (
                                <X className="h-5 w-5 text-red-500" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-dm-sans truncate text-base font-semibold text-[#1E1F21] md:text-lg">
                                  {result.domain}
                                </h4>
                              </div>
                              <p
                                className={`font-dm-sans text-sm ${
                                  result.available
                                    ? 'text-green-600'
                                    : 'text-red-500'
                                }`}
                              >
                                {result.available
                                  ? t('statusLineAvailable')
                                  : t('statusLineTaken')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-4">
                            {result.available && pricing.register > 0 ? (
                              <div className="text-left sm:text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <span className="font-dm-sans whitespace-nowrap text-base font-bold text-[#8C52FF] sm:text-lg">
                                    {currencyInfo.prefix}{finalPrice.toFixed(2)}{currencyInfo.suffix}/{t('yr')}
                                  </span>
                                </div>
                                <span className="font-dm-sans block whitespace-nowrap text-xs text-[#667085]">
                                  {t('renew')} {currencyInfo.prefix}{pricing.renew.toFixed(2)}{currencyInfo.suffix}/{t('yr')}
                                </span>
                              </div>
                            ) : (
                              <div className="text-left sm:text-right">
                                <span className="font-dm-sans whitespace-nowrap text-sm font-semibold text-gray-500">
                                  {t('priceUnavailable')}
                                </span>
                              </div>
                            )}

                            {result.available ? (
                              <Button
                                onClick={() => handleAddToCart(result)}
                                disabled={inCart || pricing.register <= 0}
                                className={`font-dm-sans flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all md:px-6 ${
                                  inCart || pricing.register <= 0
                                    ? 'cursor-not-allowed bg-gray-400'
                                    : 'bg-[#8C52FF] hover:bg-[#7b42ff]'
                                }`}
                              >
                                {inCart ? (
                                  <>
                                    <Check className="h-4 w-4" />
                                    <span className="hidden sm:inline">
                                      {t('inCart')}
                                    </span>
                                    <span className="sm:hidden">
                                      {t('cart')}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="h-4 w-4" />
                                    <span className="hidden sm:inline">
                                      {t('addToCart')}
                                    </span>
                                    <span className="sm:hidden">{t('add')}</span>
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                disabled
                                className="font-dm-sans cursor-not-allowed rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-500 md:px-6"
                              >
                                {t('unavailable')}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    };

                    return (
                      <div className="space-y-4">
                        {/* Primary exact match */}
                        <div className="overflow-hidden rounded-xl border border-[#EAECF0] bg-white">
                          {renderRow(primary, { variant: 'primary' })}
                        </div>

                        {/* Suggestions */}
                        {suggestionsList.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-dm-sans text-xs font-semibold tracking-wide text-white/60">
                                {t('suggestionsHeading')}
                              </span>
                              <div className="h-px flex-1 bg-white/10" />
                            </div>

                            <div className="overflow-hidden rounded-xl border border-[#EAECF0] bg-white">
                              {suggestionsList.map((r) => (
                                <div key={r.domain}>{renderRow(r, { variant: 'suggestion' })}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <p className="font-dm-sans text-center text-sm text-white/60 sm:hidden">
                    {t('pricingInfo')}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-[#EAECF0] bg-white py-12 text-center">
                  <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="font-dm-sans text-lg text-gray-600">
                    {t('noResults')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Domain TLD Cards - Only show when no results */}

          {/* Domain Configuration Modal */}
          {selectedDomain && (
            <DomainConfigModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              domain={selectedDomain.domain}
              tld={selectedDomain.tld}
              yearPrices={getPricingMap(selectedDomain.tld)}
              availableAddons={getAvailableAddons(selectedDomain.tld)}
              onAddToCart={handleModalAddToCart}
            />
          )}
        </div>
      </div>
    </section>
  );
}
