'use client';

import { ShoppingCart, X, Globe, Server } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getItemId } from '@/contexts/CartContext';
import { calculateDomainPrice } from '@/actions/domain-order-actions';
import { calculateHostingPriceAction } from '@/actions/hosting-actions';
import { trackBeginCheckout, trackRemoveFromCart } from '@/lib/ga4';

export default function DomainCartSidebar() {
  const { cart, removeFromCart, clearCart, updateCartItem, getTotalPrice, getCartCount, isLoaded } =
    useCart();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { formatPrice, currency } = useCurrency();

  // Re-fetch all cart item prices when currency changes
  useEffect(() => {
    const recalculate = async () => {
      for (const item of cart) {
        const itemId = getItemId(item);
        if (item.type === 'domain') {
          const result = await calculateDomainPrice(item.domain, item.regPeriod, currency);
          if (result.success && result.data) {
            updateCartItem(itemId, { price: result.data.totalPrice });
          }
        } else if (item.type === 'hosting') {
          const priceResult = await calculateHostingPriceAction(
            item.productId, item.billingCycle, [], currency
          );
          if (priceResult.success && priceResult.data) {
            updateCartItem(itemId, { price: priceResult.data.total });
          }
        }
      }
    };
    if (cart.length > 0 && isLoaded) recalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]);

  // Extract locale from pathname (e.g., /en/... -> en)
  // If in dashboard, locale will be 'dashboard', so we need to handle that
  const pathSegments = pathname.split('/').filter(Boolean);
  const isInDashboard = pathSegments[0] === 'dashboard';
  const locale = isInDashboard ? 'en' : (pathSegments[0] || 'en');

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsOpen(false);

    trackBeginCheckout({
      currency,
      value: getTotalPrice(),
      items: cart.map((item) => ({
        item_id: getItemId(item),
        item_name: item.type === 'domain' ? item.domain : (item as any).productName,
        price: item.price,
        quantity: item.type === 'domain' ? item.regPeriod : 1,
      })),
    });

    // All checkouts go through the unified checkout page
    router.push(`/${locale}/order/checkout`);
  };

  return (
    <>
      {/* Floating Cart Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="group fixed right-6 bottom-6 z-50 cursor-pointer rounded-full bg-[#8C52FF] p-4 text-white shadow-lg transition-all duration-300 hover:bg-[#7b42ff] hover:shadow-xl"
        aria-label="Shopping cart"
      >
        <div className="relative">
          <ShoppingCart className="h-6 w-6" />
          {getCartCount() > 0 && (
            <Badge className="absolute -top-2 -right-2 flex h-5 min-w-[20px] items-center justify-center border-2 border-white bg-red-500 p-0 px-1 text-xs font-bold text-white hover:bg-red-600">
              {getCartCount()}
            </Badge>
          )}
        </div>
      </button>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Cart Sidebar */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full transform bg-white shadow-2xl transition-transform duration-300 ease-in-out sm:w-[400px] ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-[#8C52FF]" />
              <h2 className="font-dm-sans text-xl font-bold text-[#1E1F21]">
                Shopping Cart
              </h2>
              {getCartCount() > 0 && (
                <Badge className="bg-[#8C52FF]/10 text-[#8C52FF] hover:bg-[#8C52FF]/20">
                  {getCartCount()}
                </Badge>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 transition-colors hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                  <ShoppingCart className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Your cart is empty
                </h3>
                <p className="mb-4 text-sm text-gray-500">
                  Search for domains or hosting and add them to your cart
                </p>
                <Button
                  onClick={() => setIsOpen(false)}
                  className="bg-[#8C52FF] text-white hover:bg-[#7b42ff]"
                >
                  Start Searching
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => {
                  const itemId = getItemId(item);

                  return (
                    <div
                      key={itemId}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:border-[#8C52FF]/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          {/* Icon based on type */}
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.type === 'domain'
                              ? 'bg-purple-100'
                              : 'bg-blue-100'
                              }`}
                          >
                            {item.type === 'domain' ? (
                              <Globe className="h-5 w-5 text-[#8C52FF]" />
                            ) : (
                              <Server className="h-5 w-5 text-blue-600" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="font-dm-sans truncate font-semibold text-[#1E1F21]">
                              {item.type === 'domain'
                                ? item.domain
                                : item.productName}
                            </h4>
                            <p className="mt-1 text-sm text-gray-500">
                              {item.type === 'domain'
                                ? `${item.regPeriod} ${item.regPeriod === 1 ? 'year' : 'years'} registration`
                                : item.billingCycle}
                            </p>
                            {item.type === 'domain' &&
                              item.addons &&
                              item.addons.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {item.addons.map((addon, idx) => (
                                    <p
                                      key={idx}
                                      className="flex items-center gap-1 text-xs text-purple-600"
                                    >
                                      <span className="h-1 w-1 rounded-full bg-purple-600"></span>
                                      {addon.name}
                                    </p>
                                  ))}
                                </div>
                              )}
                            <p className="font-dm-sans mt-2 text-lg font-bold text-[#8C52FF]">
                              {formatPrice(item.price)}
                              {item.type === 'domain' && item.regPeriod > 1 && (
                                <span className="ml-1 text-xs font-normal text-gray-500">
                                  (
                                  {formatPrice(item.price / item.regPeriod)}
                                  /yr)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const itemName =
                              item.type === 'domain'
                                ? item.domain
                                : item.productName;
                            trackRemoveFromCart({
                              currency,
                              value: item.price,
                              items: [{
                                item_id: itemId,
                                item_name: itemName,
                                price: item.price,
                                quantity: item.type === 'domain' ? item.regPeriod : 1,
                              }],
                            });
                            removeFromCart(itemId);
                            toast.success(`${itemName} removed from cart`);
                          }}
                          className="group rounded-full p-2 transition-colors hover:bg-red-100"
                        >
                          <X className="h-4 w-4 text-gray-500 group-hover:text-red-600" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Clear Cart Button */}
                {cart.length > 1 && (
                  <button
                    onClick={() => {
                      // Track remove_from_cart for each item before clearing
                      cart.forEach((item) => {
                        const cartItemId = getItemId(item);
                        trackRemoveFromCart({
                          currency,
                          value: item.price,
                          items: [{
                            item_id: cartItemId,
                            item_name: item.type === 'domain' ? item.domain : (item as any).productName,
                            price: item.price,
                            quantity: item.type === 'domain' ? item.regPeriod : 1,
                          }],
                        });
                      });
                      clearCart();
                      toast.success('Cart cleared');
                    }}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Clear all items
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="space-y-4 border-t border-gray-200 p-6">
              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-600">Total</span>
                <div className="text-right">
                  <span className="font-dm-sans text-2xl font-bold text-[#8C52FF]">
                    {formatPrice(getTotalPrice())}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    ({getCartCount()} items)
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                className="h-12 w-full bg-[#8C52FF] text-base font-semibold text-white hover:bg-[#7b42ff]"
              >
                Proceed to Checkout
              </Button>

              <p className="text-center text-xs text-gray-500">
                You'll be asked to login or create an account
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
