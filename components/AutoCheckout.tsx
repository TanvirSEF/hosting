'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { createBulkOrderAction } from '@/actions/bulk-order-actions';
import { toast } from 'sonner';

/**
 * Auto-checkout component
 * Automatically processes cart checkout and localStorage domain orders after user logs in
 */
export function AutoCheckout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { cart, clearCart } = useCart();

  // Extract locale from pathname (e.g., /en/... -> en)
  const locale = pathname.split('/')[1] || 'en';

  useEffect(() => {
    const autoCheckout = searchParams.get('autoCheckout');

    // Only run if autoCheckout flag is present
    if (autoCheckout === 'true') {
      // Small delay to ensure user is fully logged in
      const timer = setTimeout(async () => {
        toast.loading('Processing your order...', { id: 'auto-checkout' });

        try {
          let orderProcessed = false;

          // First check for localStorage domain orders
          const pendingUnifiedOrder = localStorage.getItem('pendingUnifiedOrder');
          const pendingDomainOrder = localStorage.getItem('pendingDomainOrder');
          const pendingBulkDomainOrder = localStorage.getItem('pendingBulkDomainOrder');
          const pendingHostingOrder = localStorage.getItem('pendingHostingOrder');

          // Process localStorage orders first (priority over cart)
          if (pendingUnifiedOrder || pendingDomainOrder || pendingBulkDomainOrder || pendingHostingOrder) {
            toast.dismiss('auto-checkout');
            router.push('/dashboard/processing');
            orderProcessed = true;
          }
          // Then process cart if no localStorage orders
          else if (cart.length > 0) {
            const result = await createBulkOrderAction(cart);

            if (result.success) {
              toast.success(result.message || 'Order created successfully!', {
                id: 'auto-checkout',
              });
              clearCart();
              // Redirect to billing page (dashboard routes don't use locale)
              router.push(
                `/dashboard/billing?invoice=${result.invoiceId}&highlight=true`
              );
              orderProcessed = true;
            } else {
              toast.error(result.error || 'Failed to create order', {
                id: 'auto-checkout',
              });
            }
          }

          // If no orders to process, remove autoCheckout param
          if (!orderProcessed) {
            toast.dismiss('auto-checkout');
            router.replace(`/${locale}`);
          }
        } catch (error) {
          toast.error('An error occurred during checkout', {
            id: 'auto-checkout',
          });
          router.replace(`/${locale}`);
        }
      }, 1500); // Increased delay to ensure session is ready

      return () => clearTimeout(timer);
    }
  }, [searchParams, cart, clearCart, router, locale]);

  return null; // This component doesn't render anything
}
