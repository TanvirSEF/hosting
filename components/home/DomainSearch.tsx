"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect, useTransition } from "react";
import { useTranslations } from 'next-intl';
import { checkDomainAvailability, type DomainSearchResult } from "@/actions/domain-search-actions";
import { Loader2, Check, X, AlertCircle, ShoppingCart, Sparkles, Mail, Shield, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import DomainConfigModal, { type CheckboxAddon } from "@/components/home/DomainConfigModal";
import { useCurrency } from '@/contexts/CurrencyContext';
import { trackAddToCart } from '@/lib/ga4';

export default function DomainSearch() {
    const t = useTranslations('domain-search');
    const homeT = useTranslations();
    const { addToCart, isInCart } = useCart();
    const suggestions = (t.raw('hero.suggestions') as string[]) || [];
    const [placeholder, setPlaceholder] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(150);

    // Search states
    const [searchTerm, setSearchTerm] = useState("");
    const [lastSearchTerm, setLastSearchTerm] = useState("");
    const [results, setResults] = useState<DomainSearchResult[]>([]);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [whmcsPricing, setWhmcsPricing] = useState<Record<string, any> | null>(null);
    const [whmcsCurrency, setWhmcsCurrency] = useState<any>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDomain, setSelectedDomain] = useState<DomainSearchResult | null>(null);

    // Selected UI currency and formatter
    const { formatPrice, currency } = useCurrency();

    const normalizeDomainInput = (value: string) => {
        return (value || '')
            .toLowerCase()
            .trim()
            .replace(/^(https?:\/\/)?(www\.)?/, '')
            .replace(/\/$/, '')
            .replace(/\.+$/, '');
    };

    const formatWhmcsMoney = (amount: number) => {
        const value = Number.isFinite(amount) ? amount : 0;
        // Use the centralized formatPrice from useCurrency which handles SEK correctly
        return formatPrice(value);
    };

    // Fetch WHMCS pricing in selected currency
    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const { getTLDPricing: fetchTLDPricing } = await import('@/actions/domain-search-actions');
                const result = await fetchTLDPricing(currency);
                if (result.success && result.data) {
                    // Pre-process pricing keys to be uniform (e.g. all starting with dot) for easier lookup
                    const pricingMap: Record<string, any> = {};
                    Object.keys(result.data).forEach(key => {
                        const normalizedKey = key.startsWith('.') ? key : `.${key}`;
                        pricingMap[normalizedKey] = result.data[key];
                    });
                    setWhmcsPricing(pricingMap);
                    setWhmcsCurrency((result as any).currency || null);
                }
            } catch (error) {
                console.error("Failed to fetch WHMCS pricing", error);
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

            setPlaceholder(isDeleting
                ? fullText.substring(0, placeholder.length - 1)
                : fullText.substring(0, placeholder.length + 1)
            );

            let speed = 150;
            if (isDeleting) speed = 50;

            if (!isDeleting && placeholder === fullText) {
                speed = 2000;
                setIsDeleting(true);
            } else if (isDeleting && placeholder === "") {
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
        // Clean the search term - remove trailing dots and whitespace
        const cleanedTerm = normalizeDomainInput(searchTerm);

        if (!cleanedTerm) {
            setError(t('hero.errorEmpty'));
            return;
        }

        // Validate domain format - must contain at least one alphanumeric character
        const domainPart = cleanedTerm.split('.')[0];
        if (!domainPart || !/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*$/.test(domainPart)) {
            setError(t('hero.errorInvalid'));
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
                setError(response.error || t('hero.errorFailed'));
                setResults([]);
            }
        });
    };

    const handleClearSearch = () => {
        setShowResults(false);
        setResults([]);
        setSearchTerm("");
        setLastSearchTerm("");
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
        addToCart({
            type: 'domain',
            domain: config.domain,
            tld: config.tld,
            price: config.price,
            regPeriod: config.regPeriod,
            addons: config.addons.length > 0 ? config.addons : undefined,
        });

        toast.success(t('hero.toastAddedTitle', { domain: config.domain }), {
            description: t('hero.toastAddedDesc', {
                years: config.regPeriod,
                price: formatWhmcsMoney(config.price),
            }),
        });

        trackAddToCart({
            currency,
            value: config.price,
            items: [{
                item_id: `domain-${config.domain}`,
                item_name: config.domain,
                price: config.price,
                quantity: config.regPeriod,
            }],
        });
    };

    // Check if domain is in cart
    const isDomainInCart = (domain: string) => {
        return isInCart(`domain-${domain}`);
    };

    // Get pricing for a TLD (WHMCS or default)
    const getTLDPricing = (tld: string) => {
        // Try WHMCS pricing first
        if (whmcsPricing) {
            // Normalize TLD to ensure it starts with dot for lookup if keys have dots
            // OR checks for keys without dots if that's how they are stored
            const tldWithDot = tld.startsWith('.') ? tld : `.${tld}`;
            const tldNoDot = tld.startsWith('.') ? tld.substring(1) : tld;

            // Try all possible key formats
            const pricingData = whmcsPricing[tld] || whmcsPricing[tldWithDot] || whmcsPricing[tldNoDot];

            if (pricingData) {
                // WHMCS pricing structure normalization
                let registerPrice = 0;
                let renewPrice = 0;

                // Helper to extract price from various formats
                const extractPrice = (priceVal: any): number => {
                    if (!priceVal) return 0;
                    if (typeof priceVal === 'number') return priceVal;
                    if (typeof priceVal === 'string') return parseFloat(priceVal) || 0;
                    if (typeof priceVal === 'object') {
                        return parseFloat(priceVal['1']) || 0; // Default to 1 year
                    }
                    return 0;
                };

                registerPrice = extractPrice(pricingData.register);
                renewPrice = extractPrice(pricingData.renew);

                if (registerPrice > 0) {
                    return { register: registerPrice, renew: renewPrice };
                }
            }
        }

        // Fallback to default pricing only if WHMCS data missing for this TLD
        return { register: 0, renew: 0 };
    };

    // Calculate discount percentage
    const getDiscountPercent = (tld: string) => {
        const pricing = getTLDPricing(tld);
        if (!pricing || pricing.renew <= pricing.register) return 0;
        return Math.round(((pricing.renew - pricing.register) / pricing.renew) * 100);
    };

    // Helper to get full pricing map for a TLD
    const getPricingMap = (tld: string): Record<number, number> => {
        if (!whmcsPricing) return { 1: 0 }; // Should not happen if filtered correctly

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
        } else if (typeof pricingData.register === 'string') {
            const price = parseFloat(pricingData.register);
            if (!isNaN(price) && price > 0) {
                priceMap[1] = price;
            }
        }

        // If map is empty but we have data, maybe fallback? 
        // But user wants real data. If empty, it means unavailable.
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
                name: t('hero.addonDnsTitle'),
                description: t('hero.addonDnsDesc'),
                price: getAddonPrice('dnsmanagement') || getAddonPrice('dns'),
                icon: <Zap className="h-5 w-5" />,
            });
        }

        // Email Forwarding
        if (addonsData.email || addonsData.emailforwarding) {
            addons.push({
                id: 'emailforwarding',
                name: t('hero.addonEmailTitle'),
                description: t('hero.addonEmailDesc'),
                price: getAddonPrice('emailforwarding') || getAddonPrice('email'),
                icon: <Mail className="h-5 w-5" />,
            });
        }

        // ID Protection
        if (addonsData.idprotect || addonsData.idprotection) {
            addons.push({
                id: 'idprotection',
                name: t('hero.addonIdProtectTitle'),
                description: t('hero.addonIdProtectDesc'),
                price: getAddonPrice('idprotection') || getAddonPrice('idprotect'),
                icon: <Shield className="h-5 w-5" />,
            });
        }

        return addons;
    };

    return (
        <section className="w-full bg-[#FAFAFA] text-[#1E1F21] py-12 md:py-16">
            <div className="container relative z-10 w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12 lg:px-20 xl:px-32 flex flex-col items-center gap-8 md:gap-12">

                {/* Header */}
                <div className="flex flex-col items-center gap-4 md:gap-6 w-full max-w-[800px] text-center">
                    <h2 className="text-[#1E1F21] font-bold font-dm-sans leading-tight text-[clamp(1.75rem,4vw,2.5rem)]">
                        {homeT('domainSearch.heading')}
                    </h2>
                    <p className="text-[#667085] font-normal font-dm-sans leading-[1.3] text-center max-w-[634px] 2xl:max-w-[800px] text-[clamp(1rem,2vw,1.125rem)]">
                        {homeT('domainSearch.description')}
                    </p>
                </div>

                {/* Search Box */}
                <div className="w-full max-w-[698px] 2xl:max-w-[900px]">
                    <div className="bg-white rounded-full p-2 pl-4 md:pl-8 pr-2 flex items-center shadow-[0px_4px_35px_rgba(0,0,0,0.08)] border border-[#EAECF0] gap-3 md:gap-4 transition-all duration-300 hover:shadow-[0px_6px_40px_rgba(0,0,0,0.12)]">
                        <div className="flex-1 flex items-center gap-3 md:gap-4 overflow-hidden">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1E1F21] w-5 h-5 md:w-6 md:h-6 2xl:w-8 2xl:h-8 opacity-80 shrink-0">
                                <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M14.5 14.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={placeholder || t('hero.searchPlaceholder')}
                                disabled={isPending}
                                className="w-full bg-transparent border-none outline-none text-[#1E1F21] placeholder:text-[#667085]/70 font-dm-sans truncate text-[1rem] md:text-[1.125rem] disabled:opacity-50"
                            />
                        </div>

                        <Button
                            onClick={handleSearch}
                            disabled={isPending || !searchTerm.trim()}
                            className="bg-[#8C52FF] hover:bg-[#7b42ff] text-white rounded-full font-semibold font-dm-sans transition-all duration-300 shrink-0 px-6 py-2.5 h-[40px] md:h-[45px] md:px-8 md:py-3 2xl:px-12 text-[0.875rem] md:text-[1rem] disabled:opacity-50"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {t('hero.searching')}
                                </>
                            ) : (
                                t('hero.searchButton')
                            )}
                        </Button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                </div>

                {/* Results Section */}
                {showResults && (
                    <div className="w-full max-w-[1000px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {isPending ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="bg-white p-4 rounded-lg border border-[#EAECF0] animate-pulse flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                            <div className="flex-1">
                                                <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                                                <div className="h-4 bg-gray-200 rounded w-24"></div>
                                            </div>
                                        </div>
                                        <div className="h-10 bg-gray-200 rounded w-32"></div>
                                    </div>
                                ))}
                            </div>
                        ) : results.length > 0 ? (
                            <div className="space-y-4">
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2 sm:gap-0">
                                    <h3 className="text-lg sm:text-xl font-bold text-[#1E1F21] font-dm-sans wrap-break-word min-w-0 flex-1">
                                        {t('hero.resultsFor')} "{lastSearchTerm}"
                                    </h3>
                                    <button
                                        onClick={handleClearSearch}
                                        className="text-sm text-[#667085] hover:text-[#1E1F21] transition-colors whitespace-nowrap shrink-0"
                                    >
                                        {t('hero.clearSearch')}
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

                                    const renderCard = (result: DomainSearchResult, opts?: { isPrimary?: boolean }) => {
                                        const pricing = getTLDPricing(result.tld);
                                        const inCart = isDomainInCart(result.domain);
                                        const isPrimary = Boolean(opts?.isPrimary);

                                        // Use WHMCS price directly (no custom discount)
                                        const finalPrice = pricing.register;

                                        return (
                                            <div
                                                className={`rounded-lg border transition-all duration-200 ${isPrimary
                                                    ? (result.available ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50')
                                                    : (result.available
                                                        ? 'bg-white border-[#EAECF0] hover:border-[#8C52FF]/30 hover:shadow-md'
                                                        : 'bg-white border-gray-200 opacity-60')
                                                    }`}
                                            >
                                                <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                                                    {/* Left: Domain Info */}
                                                    <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
                                                        {/* Icon */}
                                                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${result.available
                                                            ? 'bg-green-100'
                                                            : 'bg-gray-100'
                                                            }`}>
                                                            {result.available ? (
                                                                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                                            ) : (
                                                                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                                                            )}
                                                        </div>

                                                        {/* Domain Name */}
                                                        <div className="flex-1 min-w-0 overflow-hidden">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h4 className="text-sm sm:text-base font-semibold text-[#1E1F21] wrap-break-word font-dm-sans min-w-0">
                                                                    {result.domain}
                                                                </h4>
                                                            </div>
                                                            <p className="text-xs sm:text-sm text-[#667085] mt-0.5 wrap-break-word">
                                                                {result.available ? t('hero.statusLineAvailable') : t('hero.statusLineTaken')}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Right: Price & Action */}
                                                    {result.available && (
                                                        <div className="flex items-center gap-3 sm:gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                                                            {/* Price */}
                                                            <div className="text-left sm:text-right">
                                                                {pricing.register > 0 ? (
                                                                    <>
                                                                        <div className="flex items-center justify-end gap-2">
                                                                            <span className="text-base sm:text-lg font-bold text-[#8C52FF] font-dm-sans whitespace-nowrap">
                                                                                {formatWhmcsMoney(finalPrice)}/{t('hero.yr')}
                                                                            </span>
                                                                        </div>
                                                                        {pricing.renew > 0 && (
                                                                            <span className="text-xs text-[#667085] whitespace-nowrap block text-right">
                                                                                {t('hero.renew')} {formatWhmcsMoney(pricing.renew)}/{t('hero.yr')}
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-base sm:text-lg font-bold text-gray-400 font-dm-sans whitespace-nowrap">
                                                                            {t('hero.priceUnavailable')}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Add to Cart Button */}
                                                            <Button
                                                                onClick={() => handleAddToCart(result)}
                                                                disabled={inCart || pricing.register <= 0}
                                                                className={`${inCart || pricing.register <= 0
                                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                                    : 'bg-[#8C52FF] hover:bg-[#7b42ff]'
                                                                    } text-white font-semibold font-dm-sans rounded-lg px-4 sm:px-6 h-9 sm:h-10 transition-all duration-200 text-xs sm:text-sm whitespace-nowrap shrink-0`}
                                                            >
                                                                {inCart ? (
                                                                    <>
                                                                        <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                                                        <span className="hidden sm:inline">{t('hero.inCart')}</span>
                                                                        <span className="sm:hidden">{t('hero.cart')}</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                                                        <span className="hidden sm:inline">{t('hero.addToCart')}</span>
                                                                        <span className="sm:hidden">{t('hero.add')}</span>
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    };

                                    return (
                                        <div className="space-y-4">
                                            {renderCard(primary, { isPrimary: true })}

                                            {suggestionsList.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold tracking-wide text-[#667085] uppercase">
                                                            {t('hero.suggestionsHeading')}
                                                        </span>
                                                        <div className="h-px flex-1 bg-[#EAECF0]" />
                                                    </div>

                                                    <div className="space-y-2">
                                                        {suggestionsList.map((r) => (
                                                            <div key={r.domain}>{renderCard(r)}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* No Available Domains Message */}
                                {results.every(r => !r.available) && (
                                    <div className="mt-6 p-6 bg-amber-50 border border-amber-200 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-semibold text-amber-900 mb-1">{t('allTakenTitle')}</h4>
                                                <p className="text-sm text-amber-700">{t('allTakenDesc')}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-xl border border-[#EAECF0]">
                                <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-lg text-gray-600 font-dm-sans">{t('noResults')}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

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
        </section>
    );
}
