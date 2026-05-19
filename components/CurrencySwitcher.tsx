'use client';

import * as React from 'react';
import { ChevronDown, Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';

const CURRENCIES = [
  {
    code: 'USD',
    symbol: '$',
    label: 'US Dollar',
    mobileLabel: 'USD',
  },
  {
    code: 'EUR',
    symbol: '€',
    label: 'Euro',
    mobileLabel: 'EUR',
  },
  {
    code: 'GBP',
    symbol: '£',
    label: 'British Pound',
    mobileLabel: 'GBP',
  },
  {
    code: 'SEK',
    symbol: 'kr',
    label: 'Swedish Krona',
    mobileLabel: 'SEK',
  },
];

interface CurrencySwitcherProps {
  isScrolled?: boolean;
  isMobile?: boolean;
  className?: string;
}

export function CurrencySwitcher({
  isScrolled,
  isMobile,
  className,
}: CurrencySwitcherProps) {
  const { currency, isLocked, isLoading } = useCurrency();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const currentCurrency =
    CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCurrencyChange = (newCurrency: string) => {
    if (isLocked) return;

    setIsOpen(false);
    // Dispatch custom event for context to handle
    window.dispatchEvent(
      new CustomEvent('currency-change', { detail: newCurrency })
    );
  };

  const textColorClass = isMobile
    ? isScrolled
      ? 'text-gray-700'
      : 'text-white'
    : isScrolled
      ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 bg-transparent border-transparent'
      : 'text-white hover:text-gray-200 hover:bg-white/10 bg-transparent border-transparent';

  // If currency is locked (user has completed an order), show static display
  if (isLocked) {
    return (
      <div
        className={cn(
          'flex items-center rounded-md text-sm font-medium',
          isMobile ? 'gap-0.5 px-1.5 py-1.5' : 'gap-1 px-3 py-2',
          textColorClass
        )}
        title="Currency is locked after your first order"
      >
        <span className="flex items-center gap-1">
          <span
            className={cn('font-semibold', isMobile ? 'text-sm' : 'text-base')}
          >
            {currentCurrency.symbol}
          </span>
          {!isMobile && (
            <span className="hidden uppercase md:inline">
              {currentCurrency.code}
            </span>
          )}
        </span>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center rounded-md text-sm font-medium',
          isMobile ? 'px-1.5 py-1.5' : 'px-3 py-2',
          textColorClass
        )}
      >
        <span className={cn('font-semibold', isMobile ? 'text-sm' : 'text-base')}>
          {currentCurrency.symbol}
        </span>
      </div>
    );
  }

  // Dropdown for unlocked users (not logged in or no orders yet)
  return (
    <div
      className={cn('relative', className)}
      ref={dropdownRef}
      onMouseEnter={() => !isMobile && setIsOpen(true)}
      onMouseLeave={() => !isMobile && setIsOpen(false)}
    >
      <button
        onClick={() => !isLocked && setIsOpen(!isOpen)}
        className={cn(
          'flex items-center rounded-md text-sm font-medium transition-all duration-300',
          isMobile ? 'gap-0.5 px-1.5 py-1.5' : 'gap-1.5 px-3 py-2',
          textColorClass,
          isOpen && !isMobile && 'bg-gray-50 text-gray-900'
        )}
        aria-expanded={isOpen}
        disabled={isLocked}
      >
        <span className="flex items-center gap-1">
          <span
            className={cn('font-semibold', isMobile ? 'text-sm' : 'text-base')}
          >
            {currentCurrency.symbol}
          </span>
          {!isMobile && (
            <span className="hidden uppercase md:inline">
              {currentCurrency.code}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'transition-transform duration-300',
            isMobile ? 'h-3 w-3' : 'h-4 w-4',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <div
        className={cn(
          'absolute top-full right-0 z-50 w-48 pt-2 transition-all duration-300 ease-out',
          isOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-2 opacity-0'
        )}
      >
        <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-xl ring-1 ring-black/5">
          <div className="py-1">
            {CURRENCIES.map((curr) => (
              <button
                key={curr.code}
                onClick={() => handleCurrencyChange(curr.code)}
                className="group flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50"
              >
                <span className="flex flex-1 items-center gap-3">
                  <span className="w-6 text-center text-base font-semibold text-gray-500">
                    {curr.symbol}
                  </span>
                  <span
                    className={cn(
                      'font-medium transition-colors',
                      currency === curr.code
                        ? 'text-gray-900'
                        : 'text-gray-600 group-hover:text-gray-900'
                    )}
                  >
                    {curr.label}
                  </span>
                </span>
                {currency === curr.code && (
                  <Check className="h-4 w-4 text-[#8A2BE2]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
