'use client';

import { useState, useEffect } from 'react';

export interface DomainCartItem {
  domain: string;
  tld: string;
  price: number;
  regPeriod: number;
  addedAt: number;
}

const CART_STORAGE_KEY = 'domain_cart';

export function useDomainCart() {
  const [cart, setCart] = useState<DomainCartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch (error) {
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch (error) {
      }
    }
  }, [cart, isLoaded]);

  const addToCart = (item: Omit<DomainCartItem, 'addedAt'>) => {
    setCart((prev) => {
      // Check if domain already in cart
      const exists = prev.find((i) => i.domain === item.domain);
      if (exists) {
        return prev; // Don't add duplicates
      }
      return [...prev, { ...item, addedAt: Date.now() }];
    });
  };

  const removeFromCart = (domain: string) => {
    setCart((prev) => prev.filter((item) => item.domain !== domain));
  };

  const clearCart = () => {
    setCart([]);
  };

  const isInCart = (domain: string) => {
    return cart.some((item) => item.domain === domain);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price, 0);
  };

  const getCartCount = () => {
    return cart.length;
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart,
    getTotalPrice,
    getCartCount,
    isLoaded,
  };
}
