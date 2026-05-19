'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface CheckoutContextType {
  pendingCheckout: boolean;
  setPendingCheckout: (pending: boolean) => void;
  checkoutRedirectUrl: string | null;
  setCheckoutRedirectUrl: (url: string | null) => void;
  initiateCheckout: (redirectUrl?: string) => void;
  completeCheckout: () => string | null;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(
  undefined
);

const CHECKOUT_STORAGE_KEY = 'pending_checkout';
const REDIRECT_STORAGE_KEY = 'checkout_redirect';

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [pendingCheckout, setPendingCheckoutState] = useState(false);
  const [checkoutRedirectUrl, setCheckoutRedirectUrlState] = useState<
    string | null
  >(null);

  const setPendingCheckout = (pending: boolean) => {
    setPendingCheckoutState(pending);
    if (typeof window !== 'undefined') {
      if (pending) {
        localStorage.setItem(CHECKOUT_STORAGE_KEY, 'true');
      } else {
        localStorage.removeItem(CHECKOUT_STORAGE_KEY);
      }
    }
  };

  const setCheckoutRedirectUrl = (url: string | null) => {
    setCheckoutRedirectUrlState(url);
    if (typeof window !== 'undefined') {
      if (url) {
        localStorage.setItem(REDIRECT_STORAGE_KEY, url);
      } else {
        localStorage.removeItem(REDIRECT_STORAGE_KEY);
      }
    }
  };

  const initiateCheckout = (redirectUrl: string = '/dashboard/billing') => {
    setPendingCheckout(true);
    setCheckoutRedirectUrl(redirectUrl);
  };

  const completeCheckout = (): string | null => {
    if (typeof window !== 'undefined') {
      const redirectUrl =
        localStorage.getItem(REDIRECT_STORAGE_KEY) || '/dashboard/billing';
      localStorage.removeItem(CHECKOUT_STORAGE_KEY);
      localStorage.removeItem(REDIRECT_STORAGE_KEY);
      setPendingCheckoutState(false);
      setCheckoutRedirectUrlState(null);
      return redirectUrl;
    }
    return null;
  };

  return (
    <CheckoutContext.Provider
      value={{
        pendingCheckout,
        setPendingCheckout,
        checkoutRedirectUrl,
        setCheckoutRedirectUrl,
        initiateCheckout,
        completeCheckout,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}
