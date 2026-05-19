/**
 * Discount Module Integration
 * Fetches discount rules and custom CSS from the WHMCS discount module
 */

import { getDiscountRulesDirectAction } from '@/actions/discount-actions';

export interface ProductDetails {
    id: number;
    gid: number;
    type: string;
    name: string;
    description: string;
    hidden: boolean;
    retired: boolean;
    payment_type: string;
    pricing: Record<string, number>;
    setup_fees: Record<string, number>;
    free_domain: {
        enabled: boolean;
        type: string;
        payment_terms: string[];
        tlds: string[];
    } | null;
    stock_control: boolean;
    qty: number;
    auto_setup: string;
    order: number;
    tax: boolean;
}

export interface PromoDetails {
    id: number;
    code: string;
    type: string;
    value: number;
    recurring: number;
    billing_cycles: string[];
    domain_cycles: string[];
    cycles_raw: string;
    applies_to: string[];
    requires: string[];
    start_date: string;
    expiry_date: string;
    max_uses: number;
    uses: number;
    remaining_uses: number;
    apply_once: boolean;
    new_signups_only: boolean;
    once_per_client: boolean;
    existing_client: boolean;
    lifetime_promo: boolean;
    upgrades_enabled: any;
    notes: string;
    is_active: boolean;
    is_available: boolean;
    is_started: boolean;
}

export interface DiscountRule {
    percentage: number;
    promo_code: string;
    product: ProductDetails | null;
    promo_details: PromoDetails | null;
    error?: string;
}

export interface DiscountModuleData {
    success: boolean;
    rules: Record<number, number>;
    rules_detailed?: Record<number, DiscountRule | DiscountRule[]>; // Can be single rule or array
    css?: string;
    timestamp?: number;
    error?: string;
    trace?: string;
}

/**
 * Fetch discount module data including rules and CSS
 */
export async function getDiscountModuleData(): Promise<DiscountModuleData> {
    try {
        const result = await getDiscountRulesDirectAction();
        return result;
    } catch (error: any) {
        return {
            success: false,
            rules: {},
            error: error.message,
        };
    }
}

/**
 * Validate if a promo code is applicable for given conditions
 */
export function validatePromoCode(
    promo: PromoDetails,
    options: {
        billingCycle?: string;
        productId?: number;
        isNewSignup?: boolean;
        isExistingClient?: boolean;
    }
): { valid: boolean; reason?: string } {
    // Check if promo is started
    if (!promo.is_started) {
        return { valid: false, reason: 'Promotion has not started yet' };
    }

    // Check if promo is active (not expired)
    if (!promo.is_active) {
        return { valid: false, reason: 'Promotion has expired' };
    }

    // Check if promo is available (usage limit)
    if (!promo.is_available) {
        return { valid: false, reason: 'Promotion usage limit reached' };
    }

    // Check billing cycle restriction
    if (options.billingCycle && promo.billing_cycles.length > 0) {
        if (!promo.billing_cycles.includes(options.billingCycle)) {
            return { valid: false, reason: 'Promotion not valid for selected billing cycle' };
        }
    }

    // Check product restriction (applies_to)
    if (options.productId && promo.applies_to.length > 0) {
        if (!promo.applies_to.includes(String(options.productId))) {
            return { valid: false, reason: 'Promotion not valid for this product' };
        }
    }

    // Check new signups restriction
    if (promo.new_signups_only && !options.isNewSignup) {
        return { valid: false, reason: 'Promotion only valid for new signups' };
    }

    // Check existing client restriction
    if (promo.existing_client && !options.isExistingClient) {
        return { valid: false, reason: 'Promotion only valid for existing clients' };
    }

    return { valid: true };
}

/**
 * Select the correct discount rule from an array based on billing cycle
 */
export function selectDiscountRuleForCycle(
    rules: DiscountRule | DiscountRule[],
    billingCycle: string,
    productId?: number
): DiscountRule | null {
    // If this is a single rule, convert to array for uniform processing
    const rulesArray = Array.isArray(rules) ? rules : [rules];

    // Build cycle variations
    const normalizedCycle = billingCycle.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cycleVariations = [normalizedCycle];

    const cycleMap: Record<string, string[]> = {
        'onetime': ['onetime', 'one', 'once', 'onetimepayment', 'one time'],
        'monthly': ['monthly', 'month', '1month'],
        'quarterly': ['quarterly', 'quarter', '3months', 'threemonths'],
        'semiannually': ['semiannually', 'semiannual', '6months', 'sixmonths'],
        'annually': ['annually', 'annual', 'yearly', 'year', '1year', '12months'],
        'biennially': ['biennially', 'biennial', '2years', 'twoyears', '24months'],
        'triennially': ['triennially', 'triennial', '3years', 'threeyears', '36months'],
    };

    for (const [key, variations] of Object.entries(cycleMap)) {
        if (variations.includes(normalizedCycle)) {
            cycleVariations.push(...variations);
            break;
        }
    }

    let bestRule: DiscountRule | null = null;
    let maxPercentage = -1;

    for (const rule of rulesArray) {
        if (!rule.promo_details) continue;

        const promo = rule.promo_details;

        // 1. Basic Status Check
        if (!promo.is_active || !promo.is_started || !promo.is_available) {
            continue;
        }

        // 2. Product Restriction Check (applies_to) - strict check if data exists
        if (productId && promo.applies_to && promo.applies_to.length > 0) {
            if (!promo.applies_to.includes(String(productId))) {
                continue;
            }
        }

        // 3. Billing Cycle Match
        let hasMatchingCycle = false;

        // Check array format first
        if (promo.billing_cycles && promo.billing_cycles.length > 0) {
            hasMatchingCycle = promo.billing_cycles.some((cycle: string) => {
                const normalizedRuleCycle = cycle.toLowerCase().replace(/[^a-z0-9]/g, '');
                return cycleVariations.includes(normalizedRuleCycle);
            });
        }

        // Fallback: Check raw string format if array check failed (e.g. for "Semi-Annually")
        if (!hasMatchingCycle && promo.cycles_raw) {
            const normalizedRaw = promo.cycles_raw.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cycleVariations.includes(normalizedRaw)) {
                hasMatchingCycle = true;
            }
        }

        if (!hasMatchingCycle) continue;


        if (hasMatchingCycle) {
            // Standard Logic: Prefer the highest discount percentage
            if (rule.percentage > maxPercentage) {
                maxPercentage = rule.percentage;
                bestRule = rule;
            } else if (rule.percentage === maxPercentage) {
                // Tie-breaker: prefer the one with fewer total cycles (more specific)
                const currentRuleCycles = promo.billing_cycles.length;
                const bestRuleCycles = bestRule?.promo_details?.billing_cycles.length || 999;

                if (currentRuleCycles < bestRuleCycles) {
                    bestRule = rule;
                }
            }
        }
    }

    return bestRule;
}

/**
 * Calculate discount amount based on promo type
 */
export function calculateDiscountAmount(
    promo: PromoDetails,
    basePrice: number
): number {
    switch (promo.type) {
        case 'percentage':
            return (basePrice * promo.value) / 100;
        case 'fixed':
            return Math.min(promo.value, basePrice); // Don't exceed base price
        case 'override':
            return Math.max(0, basePrice - promo.value); // New price is promo.value
        case 'free':
            return basePrice; // 100% discount
        default:
            return 0;
    }
}

