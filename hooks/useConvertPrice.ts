import { useCurrency } from '@/contexts/CurrencyContext';

/**
 * Hook to format static prices from translations
 * Useful for components that don't fetch from WHMCS API
 * Note: This does NOT convert prices - it only formats them.
 * For WHMCS-fetched prices, use formatPrice directly from useCurrency.
 */
export function useConvertPrice() {
  const { currency, currencyInfo, formatPrice } = useCurrency();

  /**
   * Format a price string with current currency symbol
   * @param priceString - Price in format "$99" or "99.99" or "$99.99"
   * @returns Formatted price in current currency
   */
  const formatStaticPrice = (priceString: string): string => {
    // Remove currency symbols and extract number
    const numericPrice = parseFloat(priceString.replace(/[^0-9.]/g, ''));

    if (isNaN(numericPrice)) {
      return priceString; // Return original if can't parse
    }

    // Format with current currency (no conversion)
    return formatPrice(numericPrice);
  };

  /**
   * Format an entire pricing plan object
   */
  const formatPlan = (plan: any) => {
    return {
      ...plan,
      price: formatStaticPrice(plan.price),
      yearly: plan.yearly
        ? formatStaticPrice(plan.yearly.replace(/[a-zA-Z\s]/g, '')) + ' yearly'
        : plan.yearly,
    };
  };

  return {
    formatStaticPrice,
    formatPlan,
    currency,
    currencySymbol: currencyInfo.symbol,
  };
}
