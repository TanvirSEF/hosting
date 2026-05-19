
import { getProductsByGroupAndCurrency } from './whmcs';

export interface Promotion {
    id: string;
    title: string;
    description: string;
    originalPrice: string;
    discountedPrice: string;
    discountPercentage: string;
    billingCycle: string;
    link: string;
    features: string[];
    // Raw numeric prices in USD for client-side currency conversion
    rawOriginalPrice?: number;
    rawDiscountedPrice?: number;
    rawCurrencyCode?: string;
}

// Map of internal product names/IDs to display data
const PRODUCT_MAPPINGS: Record<string, { title: string; description: string; image?: string }> = {
    'Starter': {
        title: 'dashboard.promotions.starter.title', // Not used currently, using group logic
        description: 'dashboard.promotions.starter.description',
    },
};

export async function getPromotionalProducts(currencyCode: string = 'EUR'): Promise<Promotion[]> {
    try {
        // We will fetch only Shared Hosting products (GID 1)
        // 1. Starter (PID 1)
        // 2. Pro Plan (PID 2)
        // 3. Business Plan (PID 3)

        // Fetch products and discount rules in parallel
        // NOTE: getCurrencies is NOT called here — symbol is resolved from SYMBOL_MAP directly.
        const [sharedGroup, discountRulesResult] = await Promise.all([
            getProductsByGroupAndCurrency(1, currencyCode),
            import('@/actions/discount-actions').then(mod => mod.getDiscountRulesDirectAction()),
        ]);

        const promotions: Promotion[] = [];
        // Safe symbol map — avoids calling GetCurrencies just for display formatting
        const SYMBOL_MAP: Record<string, { prefix: string; suffix: string }> = {
            USD: { prefix: '$', suffix: '' },
            EUR: { prefix: '€', suffix: '' },
            GBP: { prefix: '£', suffix: '' },
            SEK: { prefix: '', suffix: ' kr' },
        };
        const symbolInfo = SYMBOL_MAP[currencyCode] ?? { prefix: '', suffix: '' };
        const prefix = symbolInfo.prefix;
        const suffix = symbolInfo.suffix;

        // Helper to format price
        const formatPrice = (price: number) => `${prefix}${price.toFixed(2)}${suffix}`;

        // Process discount rules
        let discountMap: Record<number, number> = {};
        if (discountRulesResult.success && discountRulesResult.rules_detailed) {
            const { selectDiscountRuleForCycle } = await import('@/lib/discount-module');

            for (const [pidStr, rules] of Object.entries(discountRulesResult.rules_detailed)) {
                const pid = parseInt(pidStr);
                // Use 'annually' to find the best discount percentage, matching home page logic
                const selectedRule = selectDiscountRuleForCycle(rules as any, 'annually');

                if (selectedRule && selectedRule.percentage) {
                    discountMap[pid] = selectedRule.percentage;
                }
            }
        }

        if (sharedGroup.success && sharedGroup.data) {
            // Filter for specific PIDs we want to show
            const targetPids = [1, 2, 3]; // Starter, Pro, Business

            for (const pid of targetPids) {
                const product = sharedGroup.data.find((p: any) => p.pid == pid);
                if (product) {
                    const pricing = product.pricing?.[currencyCode];
                    if (!pricing) {
                        // Skip product if no pricing exists for this currency — no fallback allowed
                        continue;
                    }
                    const monthlyPrice = parseFloat(pricing.monthly || '0');
                    const annuallyPrice = parseFloat(pricing.annually || '0');

                    // Base price is the monthly price, fallback to annually / 12
                    const basePrice = monthlyPrice > 0 ? monthlyPrice : (annuallyPrice / 12);

                    if (basePrice <= 0) {
                        // Skip if no pricing found for this currency
                        continue;
                    }

                    // Apply discount if available
                    const discountPercent = discountMap[pid] || 0;
                    const hasDiscount = discountPercent > 0;

                    const discountedPrice = hasDiscount
                        ? basePrice * (1 - (discountPercent / 100))
                        : basePrice;

                    // Format display strings
                    const originalPriceDisplay = hasDiscount ? formatPrice(basePrice) : '';
                    const discountedPriceDisplay = formatPrice(discountedPrice) + ' /mo';
                    const discountBadge = hasDiscount ? `SAVE ${discountPercent}%` : '';

                    let titleKey = '';
                    let descKey = '';
                    let features: string[] = [];

                    if (pid === 1) { // Starter
                        titleKey = 'dashboard.promotions.starter.title';
                        descKey = 'dashboard.promotions.starter.description';
                        features = [
                            'dashboard.promotions.features.websites_2',
                            'dashboard.promotions.features.storage_50',
                            'dashboard.promotions.features.ssl',
                            'dashboard.promotions.features.daily_backups'
                        ];
                    } else if (pid === 2) { // Pro
                        titleKey = 'dashboard.promotions.pro.title';
                        descKey = 'dashboard.promotions.pro.description';
                        features = [
                            'dashboard.promotions.features.websites_4',
                            'dashboard.promotions.features.storage_100',
                            'dashboard.promotions.features.redis',
                            'dashboard.promotions.features.ssl'
                        ];
                    } else if (pid === 3) { // Business
                        titleKey = 'dashboard.promotions.business.title';
                        descKey = 'dashboard.promotions.business.description';
                        features = [
                            'dashboard.promotions.features.websites_10',
                            'dashboard.promotions.features.storage_200',
                            'dashboard.promotions.features.scanner',
                            'dashboard.promotions.features.ssl'
                        ];
                    }

                    if (titleKey) {
                        promotions.push({
                            id: product.pid,
                            title: titleKey,
                            description: descKey,
                            originalPrice: originalPriceDisplay,
                            discountedPrice: discountedPriceDisplay,
                            discountPercentage: discountBadge,
                            billingCycle: monthlyPrice > 0 ? '' : 'dashboard.promotions.when',
                            link: `/store/order/${product.pid}`,
                            features: features,
                            // Raw prices for client-side currency conversion
                            rawOriginalPrice: hasDiscount ? basePrice : 0,
                            rawDiscountedPrice: discountedPrice,
                            rawCurrencyCode: currencyCode,
                        });
                    }
                }
            }
        }

        return promotions;
    } catch (error) {
        console.error('Error fetching promotional products:', error);
        return [];
    }
}
