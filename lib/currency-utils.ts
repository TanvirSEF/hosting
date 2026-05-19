/**
 * Currency configuration mapping
 * Maps currency codes to their symbol, prefix, and suffix
 */
export const CURRENCY_CONFIG: Record<string, { symbol: string; prefix: string; suffix: string }> = {
  USD: { symbol: '$', prefix: '$', suffix: '' },
  EUR: { symbol: '€', prefix: '€', suffix: '' },
  GBP: { symbol: '£', prefix: '£', suffix: '' },
  SEK: { symbol: 'kr', prefix: '', suffix: ' kr' },
  INR: { symbol: '₹', prefix: '₹', suffix: '' },
  AUD: { symbol: 'A$', prefix: 'A$', suffix: '' },
  CAD: { symbol: 'C$', prefix: 'C$', suffix: '' },
  JPY: { symbol: '¥', prefix: '¥', suffix: '' },
  CNY: { symbol: '¥', prefix: '¥', suffix: '' },
  CHF: { symbol: 'CHF', prefix: '', suffix: ' CHF' },
  NOK: { symbol: 'kr', prefix: '', suffix: ' kr' },
  DKK: { symbol: 'kr', prefix: '', suffix: ' kr' },
  PLN: { symbol: 'zł', prefix: '', suffix: ' zł' },
  BRL: { symbol: 'R$', prefix: 'R$', suffix: '' },
  MXN: { symbol: 'MX$', prefix: 'MX$', suffix: '' },
  SGD: { symbol: 'S$', prefix: 'S$', suffix: '' },
  HKD: { symbol: 'HK$', prefix: 'HK$', suffix: '' },
  KRW: { symbol: '₩', prefix: '₩', suffix: '' },
  TRY: { symbol: '₺', prefix: '₺', suffix: '' },
  RUB: { symbol: '₽', prefix: '', suffix: ' ₽' },
  ZAR: { symbol: 'R', prefix: 'R', suffix: '' },
  NZD: { symbol: 'NZ$', prefix: 'NZ$', suffix: '' },
};

/**
 * Get currency configuration from currency code
 * Returns prefix/suffix for formatting prices
 */
export function getCurrencyConfig(currencyCode: string): { symbol: string; prefix: string; suffix: string } {
  const code = (currencyCode || 'USD').toUpperCase().trim();
  return CURRENCY_CONFIG[code] || CURRENCY_CONFIG.USD;
}

/**
 * Get currency prefix and suffix from currency code
 * Useful when WHMCS returns only currencycode but not currencyprefix/currencysuffix
 */
export function getCurrencyPrefixSuffix(currencyCode: string): { prefix: string; suffix: string } {
  const config = getCurrencyConfig(currencyCode);
  return { prefix: config.prefix, suffix: config.suffix };
}

/**
 * Format price with currency prefix only (no suffix for cleaner display)
 * This is a client-side utility function (no 'use server d')
 */
export function formatCurrency(
  amount: number | string,
  currencyInfo?: {
    currencyprefix?: string;
    currencysuffix?: string;
    currencycode?: string;
  }
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const code = (currencyInfo?.currencycode || '').toUpperCase();

  // Get currency config from code
  const config = getCurrencyConfig(code);

  // Use provided prefix if available, otherwise use config default
  let prefix = currencyInfo?.currencyprefix;

  // If prefix is empty or missing but we have a code, derive from code
  if (!prefix && code) {
    prefix = config.prefix;
  }

  // Final fallback to USD
  if (!prefix) {
    prefix = '$';
  }

  // Format the amount (no suffix for cleaner display)
  const formatted = numAmount.toFixed(2);

  return `${prefix}${formatted}`;
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    SEK: 'kr',
    INR: '₹',
    AUD: 'A$',
    CAD: 'C$',
    JPY: '¥',
    CNY: '¥',
  };

  return symbols[currencyCode.toUpperCase()] || currencyCode;
}

/**
 * Format price with currency code and proper symbol placement
 */
export function formatCurrencyWithSymbol(
  amount: number | string,
  currencyCode: string = 'USD'
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const upperCode = currencyCode.toUpperCase();
  const symbol = getCurrencySymbol(upperCode);

  // Special handling for SEK
  if (upperCode === 'SEK') {
    return `${numAmount.toFixed(2)} ${symbol}`;
  }

  // Handle other symbols (default prefix)
  // For known symbols that are typically prefixes, we keep that
  const prefixSymbols = ['$', '€', '£', '₹', 'A$', 'C$', '¥'];
  if (prefixSymbols.includes(symbol)) {
    return `${symbol}${numAmount.toFixed(2)}`;
  }

  // Fallback: symbol as prefix
  return `${symbol}${numAmount.toFixed(2)}`;
}
