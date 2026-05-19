'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardTranslation } from '@/components/DashboardTranslationProvider';
import { useCurrency } from '@/contexts/CurrencyContext';
import { ChevronDown, Check } from 'lucide-react';
import { getPromotionalProductsAction } from '@/actions/hosting-actions';

interface Promotion {
    id: string;
    title: string;
    description: string;
    originalPrice: string;
    discountedPrice: string;
    discountPercentage: string;
    billingCycle: string;
    link: string;
    features?: string[];
    rawCurrencyCode?: string;
}

interface PromotionalBannerProps {
    promotions?: Promotion[];
}

// ---------------------------------------------------------------------------
// Skeleton card — shown while fetching correct-currency data
// ---------------------------------------------------------------------------
function SkeletonCard() {
    return (
        <div className="relative overflow-hidden rounded-xl border border-gray-200/60 bg-white p-8 shadow-sm flex flex-col h-full animate-pulse">
            {/* Title */}
            <div className="h-5 w-2/3 rounded-md bg-gray-200 mb-2" />
            {/* Description */}
            <div className="space-y-1.5 mt-1">
                <div className="h-3 w-full rounded bg-gray-100" />
                <div className="h-3 w-4/5 rounded bg-gray-100" />
            </div>
            {/* Price row */}
            <div className="flex items-baseline gap-2 mt-5">
                <div className="h-4 w-16 rounded bg-gray-200" />
                <div className="h-4 w-12 rounded bg-purple-100" />
            </div>
            {/* Big price */}
            <div className="h-8 w-28 rounded-md bg-gray-200 mt-3" />
            {/* Features */}
            <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-purple-100 shrink-0" />
                        <div className="h-3 rounded bg-gray-100" style={{ width: `${55 + i * 8}%` }} />
                    </div>
                ))}
            </div>
            {/* Button */}
            <div className="mt-auto pt-6">
                <div className="h-9 w-full rounded-lg bg-gray-100" />
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function PromotionalBanner({ promotions: initialPromotions }: PromotionalBannerProps) {
    const { t } = useDashboardTranslation();
    const { currency } = useCurrency();
    const router = useRouter();

    const [isExpanded, setIsExpanded] = useState(true);
    const [promotions, setPromotions] = useState<Promotion[] | undefined>(initialPromotions);
    const [isLoading, setIsLoading] = useState(false);

    // Track last fetched currency so we only re-fetch when currency actually changes
    const fetchedCurrencyRef = useRef<string | null>(
        initialPromotions?.[0]?.rawCurrencyCode ?? null
    );

    useEffect(() => {
        if (!currency) return;
        // Already have correct-currency data — skip
        if (fetchedCurrencyRef.current === currency) return;

        const fetchPromotions = async () => {
            setIsLoading(true);
            // Clear stale data immediately so no wrong-currency prices flash
            setPromotions(undefined);
            try {
                const result = await getPromotionalProductsAction(currency);
                if (result.success && result.data && result.data.length > 0) {
                    setPromotions(result.data as Promotion[]);
                    fetchedCurrencyRef.current = currency;
                } else {
                    // No promotions for this currency — hide banner
                    setPromotions([]);
                    fetchedCurrencyRef.current = currency;
                }
            } catch (error) {
                console.error('Failed to fetch updated promotional prices', error);
                setPromotions([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPromotions();
    }, [currency]);

    const handleOrder = (offer: Promotion) => {
        if (offer.id) {
            router.push(`/en/order/hosting?plan=${offer.id}`);
        } else {
            router.push(offer.link);
        }
    };

    // Hide banner only when we know there are no promotions (not during loading)
    if (!isLoading && promotions !== undefined && promotions.length === 0) {
        return null;
    }

    return (
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-purple-50 via-white to-blue-50 shadow-sm max-w-7xl mx-auto">
            {/* Header */}
            <div
                className="relative cursor-pointer px-6 pb-6 pt-8 sm:px-8 transition-colors hover:bg-white/30"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                            {t('dashboard.promotions.heading')}
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">{t('dashboard.promotions.subheading')}</p>
                    </div>
                    <div className="ml-4 shrink-0 flex items-center gap-4">
                        {isLoading && (
                            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-purple-600" />
                        )}
                        <ChevronDown
                            className={`h-6 w-6 text-purple-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'
                                }`}
                        />
                    </div>
                </div>
            </div>

            {/* Cards */}
            <div
                className={`grid gap-8 px-10 pb-8 pt-6 sm:px-12 md:grid-cols-3 transition-all duration-300 ease-in-out overflow-hidden max-w-7xl mx-auto ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 pb-0'
                    }`}
            >
                {/* Skeleton state — no data yet */}
                {(isLoading || promotions === undefined) &&
                    [0, 1, 2].map((i) => <SkeletonCard key={i} />)}

                {/* Real data — only rendered when we have confirmed correct-currency data */}
                {!isLoading &&
                    promotions !== undefined &&
                    promotions.map((offer, index) => (
                        <div
                            key={index}
                            className="group relative overflow-hidden rounded-xl border border-gray-200/60 bg-white p-8 shadow-sm transition-all duration-300 hover:border-purple-600 hover:ring-1 hover:ring-purple-600 hover:shadow-lg hover:-translate-y-1 flex flex-col h-full"
                        >
                            <div className="space-y-5 flex-1">
                                {/* Title & Description */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-purple-600">
                                        {t(offer.title)}
                                    </h3>
                                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                                        {t(offer.description)}
                                    </p>
                                </div>

                                {/* Strikethrough original price — only if discount exists */}
                                {offer.discountPercentage && offer.originalPrice && (
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm text-gray-400 line-through">
                                            {offer.originalPrice}
                                        </span>
                                        <span className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                                            {offer.discountPercentage}
                                        </span>
                                    </div>
                                )}

                                {/* Discounted price — always from server, never computed client-side */}
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xs text-gray-500">{t('dashboard.promotions.from')}</span>
                                        <span className="text-2xl font-bold text-purple-600">
                                            {offer.discountedPrice}
                                        </span>
                                    </div>
                                    {offer.billingCycle && (
                                        <span className="text-[10px] text-gray-400 leading-tight">
                                            {t(offer.billingCycle)}
                                        </span>
                                    )}
                                </div>

                                {/* Feature list */}
                                {offer.features && offer.features.length > 0 && (
                                    <ul className="space-y-2 pt-2 border-t border-gray-100">
                                        {offer.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                                <Check className="h-4 w-4 text-purple-600 shrink-0" />
                                                <span>{t(feature)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* CTA */}
                            <div className="mt-auto pt-6">
                                <button
                                    onClick={() => handleOrder(offer)}
                                    className="w-full rounded-lg border border-purple-200 bg-white py-2.5 text-sm font-medium text-purple-600 transition-colors hover:bg-purple-50 flex items-center justify-center"
                                >
                                    {t('dashboard.promotions.getDeal')}
                                </button>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
}
