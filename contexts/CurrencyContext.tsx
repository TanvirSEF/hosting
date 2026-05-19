'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', prefix: '$', suffix: '' },
  EUR: { code: 'EUR', symbol: '€', prefix: '€', suffix: '' },
  GBP: { code: 'GBP', symbol: '£', prefix: '£', suffix: '' },
  SEK: { code: 'SEK', symbol: 'kr', prefix: '', suffix: ' kr' },
} as const;

type CurrencyCode = keyof typeof CURRENCIES;

interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  prefix: string;
  suffix: string;
}

interface CurrencyContextType {
  currency: CurrencyCode;
  currencyInfo: CurrencyInfo;
  setCurrency: (code: CurrencyCode) => void;
  /**
   * Format a price with the current currency symbol.
   * Note: This does NOT convert the amount - it only formats it.
   * The amount should already be in the correct currency from WHMCS API.
   */
  formatPrice: (amount: number, options?: { showSymbol?: boolean }) => string;
  isLoading: boolean;
  /**
   * Whether the currency is locked (user has completed an order)
   * When locked, the currency cannot be changed
   */
  isLocked: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

const STORAGE_KEY = 'preferred-currency';

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('USD');
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  // Load currency: restore from localStorage first (synchronous), then check server
  useEffect(() => {
    async function loadCurrency() {
      // 1. Immediately restore from localStorage (before any await).
      //    This ensures child component effects (e.g. hosting product loading)
      //    see the correct currency on their first run, avoiding a race where
      //    they fetch prices in the default 'USD' while the real currency loads.
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && saved in CURRENCIES) {
          setCurrencyState(saved as CurrencyCode);
        }
      } catch {
        // localStorage not available (SSR, privacy mode)
      }

      // 2. Check server for a locked currency (async)
      try {
        const { getUserDefaultCurrency } = await import('@/actions/currency-actions');
        const result = await getUserDefaultCurrency();

        if (result.success && result.currency) {
          const lockedCurrency = result.currency.toUpperCase() as CurrencyCode;
          if (lockedCurrency in CURRENCIES) {
            setCurrencyState(lockedCurrency);
            setIsLocked(true);
            localStorage.setItem(STORAGE_KEY, lockedCurrency);
          }
        }

        if (result.isLocked) {
          setIsLocked(true);
        }
      } catch (error) {
        // Server check failed — localStorage value already set above
      }

      setIsLoading(false);
    }

    loadCurrency();
  }, []);

  // Listen to currency-change events from CurrencySwitcher (only if not locked)
  useEffect(() => {
    const handleCurrencyChange = (event: CustomEvent<string>) => {
      if (isLocked) {
        // Ignore currency change events if locked
        return;
      }
      const newCurrency = event.detail;
      if (newCurrency in CURRENCIES) {
        setCurrencyState(newCurrency as CurrencyCode);
        try {
          localStorage.setItem(STORAGE_KEY, newCurrency as CurrencyCode);
        } catch {
          // localStorage not available
        }
      }
    };

    window.addEventListener(
      'currency-change',
      handleCurrencyChange as EventListener
    );
    return () => {
      window.removeEventListener(
        'currency-change',
        handleCurrencyChange as EventListener
      );
    };
  }, [isLocked]);

  const setCurrency = (code: CurrencyCode) => {
    // Don't allow changing currency if locked
    if (isLocked) {
      return;
    }
    setCurrencyState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (error) {
      // localStorage not available
    }
  };

  /**
   * Format a price with currency symbol.
   * This does NOT convert amounts - amounts should come from WHMCS in the correct currency.
   */
  const formatPrice = (
    amount: number,
    options?: { showSymbol?: boolean }
  ): string => {
    const showSymbol = options?.showSymbol !== false;
    const currencyData = CURRENCIES[currency];

    // Ensure amount is a valid number
    const validAmount = Number.isFinite(amount) ? amount : 0;

    // Format number with 2 decimal places
    const formattedAmount = validAmount.toFixed(2);

    if (!showSymbol) {
      return formattedAmount;
    }

    // Format with prefix and suffix
    if (currencyData.prefix) {
      return `${currencyData.prefix}${formattedAmount}${currencyData.suffix}`;
    }
    return `${formattedAmount}${currencyData.suffix}`;
  };

  const currencyInfo: CurrencyInfo = {
    code: currency,
    symbol: CURRENCIES[currency].symbol,
    prefix: CURRENCIES[currency].prefix,
    suffix: CURRENCIES[currency].suffix,
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyInfo,
        setCurrency,
        formatPrice,
        isLoading,
        isLocked,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
