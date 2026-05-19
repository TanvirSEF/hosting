'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

// Cart item types
export interface DomainCartItem {
  type: 'domain';
  domain: string;
  tld: string;
  price: number;
  regPeriod: number;
  addons?: DomainAddon[];
  promoCode?: string;
  addedAt: number;
}

export interface DomainAddon {
  id: string;
  name: string;
  price: number;
}

export interface HostingDomainConfig {
  type: 'register' | 'transfer' | 'existing';
  domain: string;
  price?: number;
  years?: number;
  eppCode?: string;
}

export interface HostingCartItem {
  type: 'hosting';
  productId: number;
  productName: string;
  productGroupId?: number;
  billingCycle: string;
  price: number;
  addons?: { id: number; name: string; price: number }[];
  domainConfig?: HostingDomainConfig | null;
  selectedCrossSells?: any[];
  addedAt: number;
}

export type CartItem = DomainCartItem | HostingCartItem;

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    item: Omit<DomainCartItem, 'addedAt'> | Omit<HostingCartItem, 'addedAt'>
  ) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  updateCartItem: (itemId: string, updates: Partial<CartItem>) => void;
  isInCart: (itemId: string) => boolean;
  getTotalPrice: () => number;
  getCartCount: () => number;
  isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'universal_cart';

// Helper to generate unique ID for cart items
export function getItemId(item: CartItem): string {
  if (item.type === 'domain') {
    return `domain-${item.domain}`;
  } else {
    // ID based only on productId so billingCycle can be mutated in-place
    return `hosting-${item.productId}`;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
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

  const addToCart = useCallback(
    (
      item: Omit<DomainCartItem, 'addedAt'> | Omit<HostingCartItem, 'addedAt'>
    ) => {
      setCart((prev) => {
        const itemWithTimestamp = { ...item, addedAt: Date.now() } as CartItem;
        const itemId = getItemId(itemWithTimestamp);

        // Check if item already in cart
        const exists = prev.find((i) => getItemId(i) === itemId);
        if (exists) {
          return prev; // Don't add duplicates
        }

        const newCart = [...prev, itemWithTimestamp];
        return newCart;
      });
    },
    []
  );

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((item) => getItemId(item) !== itemId));
  }, []);

  const updateCartItem = useCallback((itemId: string, updates: Partial<CartItem>) => {
    setCart((prev) =>
      prev.map((item) => {
        if (getItemId(item) === itemId) {
          return { ...item, ...updates } as CartItem;
        }
        return item;
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const isInCart = useCallback(
    (itemId: string) => {
      return cart.some((item) => getItemId(item) === itemId);
    },
    [cart]
  );

  const getTotalPrice = useCallback(() => {
    return cart.reduce((sum, item) => {
      const itemPrice = Number(item.price) || 0;
      return sum + itemPrice;
    }, 0);
  }, [cart]);

  const getCartCount = useCallback(() => {
    return cart.length;
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        updateCartItem,
        isInCart,
        getTotalPrice,
        getCartCount,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
