'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDomainOrderAction, createBulkDomainOrderAction } from '@/actions/domain-order-actions';
import { createHostingOrderAction, deleteHostingOrderAction } from '@/actions/hosting-actions';
import { createUnifiedOrderAction } from '@/actions/bulk-order-actions';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { trackPurchase } from '@/lib/ga4';
import type { GA4UserInfo } from '@/lib/ga4';

export default function OrderProcessingPage() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [status, setStatus] = useState('Checking for pending orders...');
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    let mounted = true;

    const processOrder = async () => {
      try {
        // Short initial delay to ensure hydration
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // Additional delay to ensure session is properly set after registration
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // GA4: Fetch user info for purchase event tracking
        let ga4User: GA4UserInfo | undefined;
        try {
          const { checkUserLoginStatus, getUserFullProfile } = await import('@/actions/domain-order-actions');
          const loginStatus = await checkUserLoginStatus();
          if (loginStatus.isLoggedIn) {
            const profile = await getUserFullProfile();
            ga4User = {
              user_id: loginStatus.userId || undefined,
              user_email: loginStatus.userEmail || undefined,
              user_name: loginStatus.userName || undefined,
              user_phone: profile?.phone || undefined,
              user_address: profile?.address1 || undefined,
              user_city: profile?.city || undefined,
              user_country: profile?.country || undefined,
            };
          }
        } catch {
          // Non-critical — purchase event will still fire without user info
        }

        if (!mounted) return;

        // Check for pending orders and stale processing lock
        const pendingUnifiedOrder = localStorage.getItem('pendingUnifiedOrder');
        const pendingHostingOrder = localStorage.getItem('pendingHostingOrder');
        const pendingDomainOrder = localStorage.getItem('pendingDomainOrder');
        const pendingBulkDomainOrder = localStorage.getItem('pendingBulkDomainOrder');

        const alreadyProcessing = sessionStorage.getItem('processingOrder');

        // Recover from stale lock (e.g. previous tab/crash) when there are still pending orders.
        if (alreadyProcessing && (pendingUnifiedOrder || pendingHostingOrder || pendingDomainOrder || pendingBulkDomainOrder)) {
          console.warn('[Processing] Detected stale processing lock. Recovering and continuing...');
          sessionStorage.removeItem('processingOrder');
        } else if (alreadyProcessing) {
          // No pending order left, safe to stop this screen.
          setStatus('No pending orders found. Redirecting...');
          setTimeout(() => {
            router.replace('/dashboard/billing');
          }, 800);
          return;
        }

        if (pendingUnifiedOrder) {
          sessionStorage.setItem('processingOrder', 'true');
          setStatus('Creating your order...');

          const orderData = JSON.parse(pendingUnifiedOrder);

          const result = await createUnifiedOrderAction(
            orderData.items,
            orderData.hostingConfigs,
            orderData.promoCode,
            orderData.currency,
            orderData.country,
            orderData.state,
          );

          if (result.success) {
            localStorage.removeItem('pendingUnifiedOrder');
            sessionStorage.removeItem('processingOrder');
            clearCart();

            // GA4 purchase event
            const purchaseValue = (orderData.items as any[]).reduce(
              (sum, item) => sum + (item.price || 0), 0
            );
            trackPurchase({
              currency: orderData.currency,
              value: purchaseValue,
              transaction_id: String(result.invoiceId || result.orderId || Date.now()),
              coupon: orderData.promoCode || undefined,
              items: (orderData.items as any[]).map((item) => ({
                item_id: item.type === 'domain' ? `domain-${item.domain}` : `hosting-${item.productId}`,
                item_name: item.type === 'domain' ? item.domain : item.productName,
                price: item.price || 0,
                quantity: item.type === 'domain' ? (item.regPeriod || 1) : 1,
              })),
              user: ga4User,
            });

            setStatus('Order created successfully!');
            await new Promise((resolve) => setTimeout(resolve, 1000));

            if (result.invoiceId) {
              router.replace(
                `/dashboard/billing?invoice=${result.invoiceId}&highlight=true`
              );
            } else {
              router.replace('/dashboard/billing');
            }
            return;
          } else {
            toast.error(result.error || 'Failed to create order');
            setStatus('Failed to create order');
            setProcessing(false);
            return;
          }
        }

        if (pendingHostingOrder) {
          // Mark as processing to prevent duplicates
          sessionStorage.setItem('processingOrder', 'true');
          setStatus('Creating your hosting account...');

          const orderData = JSON.parse(pendingHostingOrder);
          const createdOrderIds: number[] = [];

          // Call API
          // Call API for main hosting order
          // Pass checkout-calculated tax values for VAT consistency
          const result = await createHostingOrderAction(
            orderData.planId,
            orderData.billingCycle,
            orderData.domain,
            orderData.addons,
            orderData.domainType,
            orderData.promoCode || '', // Pass promo code to WHMCS
            orderData.domainConfig?.eppCode || '', // Pass EPP code for transfers
            orderData.regPeriod || 1, // Pass registration period (default 1)
            { 
              noemail: true, // WHMCS will automatically add domain to invoice when domaintype is register/transfer
              checkoutTaxRate: orderData.checkoutTaxRate,
              checkoutTaxAmount: orderData.checkoutTaxAmount,
            },
            orderData.currency,
            orderData.country,
            orderData.state
          );

          if (result.success) {
            let lastInvoiceId = result.invoiceId;
            const failedCrossSellItems: string[] = [];
            if (typeof result.orderId === 'number' && Number.isFinite(result.orderId)) {
              createdOrderIds.push(result.orderId);
            }

            const rollbackCreatedOrders = async () => {
              const rollbackFailures: string[] = [];
              for (const orderId of [...createdOrderIds].reverse()) {
                try {
                  const rollback = await deleteHostingOrderAction(orderId);
                  if (!rollback.success) {
                    rollbackFailures.push(`#${orderId}: ${rollback.error || 'rollback failed'}`);
                  }
                } catch {
                  rollbackFailures.push(`#${orderId}: rollback exception`);
                }
              }
              return rollbackFailures;
            };

            // Process Cross-Sells / Additional Products
            if (orderData.crossSells && Array.isArray(orderData.crossSells) && orderData.crossSells.length > 0) {
              setStatus('Adding extra services...');
              for (const item of orderData.crossSells) {
                try {
                  // SSL products require a domain - use the main hosting domain if available
                  const isSSLProduct = item.groupKey === 'ssl';
                  const domainForProduct = isSSLProduct ? orderData.domain : undefined;
                  const domainTypeForProduct = isSSLProduct && orderData.domain ? 'existing' : undefined;

                  console.log(`[Processing] Creating cross-sell: ${item.name} (PID: ${item.id}, Domain: ${domainForProduct || 'none'})`);

                  const addonResult = await createHostingOrderAction(
                    item.id,
                    item.selectedCycle || item.cycle || 'monthly',
                    domainForProduct,
                    [],
                    domainTypeForProduct,
                    '',
                    undefined,
                    1,
                    { noinvoice: true, noemail: true },
                    orderData.currency,
                    orderData.country,
                    orderData.state
                  );

                  console.log(`[Processing] Cross-sell result for ${item.name}:`, addonResult);

                  if (!addonResult.success) {
                    console.error(`[Processing] Failed to add cross-sell item ${item.name}: ${addonResult.error}`);
                    failedCrossSellItems.push(`${item.name}: ${addonResult.error || 'Unknown error'}`);
                  } else if (typeof addonResult.orderId === 'number' && Number.isFinite(addonResult.orderId)) {
                    console.log(`[Processing] Successfully created order ${addonResult.orderId} for ${item.name}`);
                    createdOrderIds.push(addonResult.orderId);
                  } else {
                    console.warn(`[Processing] Order created but no valid orderId returned for ${item.name}:`, addonResult);
                  }
                } catch (err) {
                  console.error(`Error processing cross-sell item ${item.name}:`, err);
                  failedCrossSellItems.push(`${item.name}: Unexpected error`);
                }
              }
            }

            if (failedCrossSellItems.length > 0) {
              const rollbackFailures = await rollbackCreatedOrders();

              throw new Error(
                `Some selected add-ons could not be added: ${failedCrossSellItems.join(' | ')}${rollbackFailures.length > 0 ? ` | Rollback issues: ${rollbackFailures.join(' | ')}` : ''}`
              );
            }

            // If cross-sells were added, generate a combined invoice for all pending orders
            // Otherwise use the invoice already created by the main order
            if (orderData.crossSells && Array.isArray(orderData.crossSells) && orderData.crossSells.length > 0) {
              const { generateInvoiceAction } = await import('@/actions/hosting-actions');
              const inv = await generateInvoiceAction();

              if (inv.success && inv.invoiceId) {
                lastInvoiceId = inv.invoiceId;
              }
              // If genInvoice fails, fall back to main order invoice (lastInvoiceId already set)
            }

            if (!lastInvoiceId) {
              const rollbackFailures = await rollbackCreatedOrders();
              throw new Error(
                `Invoice creation failed${rollbackFailures.length > 0 ? ` | Rollback issues: ${rollbackFailures.join(' | ')}` : ''}`
              );
            }

            localStorage.removeItem('pendingHostingOrder');
            sessionStorage.removeItem('processingOrder');

            // GA4 purchase event
            trackPurchase({
              currency: orderData.currency,
              value: orderData.checkoutTotal || 0,
              transaction_id: String(lastInvoiceId || Date.now()),
              coupon: orderData.promoCode || undefined,
              items: [{
                item_id: `hosting-${orderData.planId}`,
                item_name: orderData.productName || `Hosting Plan ${orderData.planId}`,
                price: orderData.checkoutTotal || 0,
                quantity: 1,
              }],
              user: ga4User,
            });

            setStatus('Orders created successfully!');

            await new Promise((resolve) => setTimeout(resolve, 1000));

            router.replace(
              `/dashboard/billing?invoice=${lastInvoiceId}&highlight=true`
            );
            return;
          } else {
            toast.error(result.error || 'Failed to create hosting order');
          }
        }

        // Check for domain order
        if (pendingDomainOrder) {
          setStatus('Preparing your domain order...');

          // Retry session validation a few times to ensure it's properly loaded
          let user = null;
          for (let i = 0; i < 3; i++) {
            try {
              const { getCurrentUser } = await import('@/actions/domain-order-actions');
              user = await getCurrentUser();
              if (user) break;
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (e) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          if (!user) {
            setStatus('Authentication required. Please login again.');
            setProcessing(false);
            // Clear pending order since we can't process it
            localStorage.removeItem('pendingDomainOrder');
            setTimeout(() => {
              router.replace('/dashboard');
            }, 3000);
            return;
          }

          const orderData = JSON.parse(pendingDomainOrder);
          const { domain, regPeriod, promoCode } = orderData;

          const result = await createDomainOrderAction({
            domain,
            years: regPeriod,
            promoCode,
            currency: orderData.currency,
            domainType: orderData.domainType || 'register',
            eppCode: orderData.eppCode, // For domain transfers
            country: orderData.country,
            state: orderData.state,
            // Pass checkout-calculated values for price and tax consistency
            checkoutSubtotal: orderData.checkoutSubtotal,
            checkoutTaxRate: orderData.checkoutTaxRate,
            checkoutTaxAmount: orderData.checkoutTaxAmount,
            checkoutTotal: orderData.checkoutTotal,
          });

          if (result.success) {
            localStorage.removeItem('pendingDomainOrder');
            localStorage.removeItem('pendingSingleDomainOrder');
            sessionStorage.removeItem('processingOrder');

            // Clear cart after successful order
            clearCart();

            // GA4 purchase event
            trackPurchase({
              currency: orderData.currency,
              value: orderData.checkoutTotal || 0,
              transaction_id: String(result.invoiceId || Date.now()),
              coupon: orderData.promoCode || undefined,
              items: [{
                item_id: `domain-${domain}`,
                item_name: domain,
                price: orderData.checkoutTotal || 0,
                quantity: regPeriod,
              }],
              user: ga4User,
            });

            setStatus('Domain order created successfully!');

            // Force a small delay
            await new Promise((resolve) => setTimeout(resolve, 1000));

            if (result.invoiceId) {
              router.replace(
                `/dashboard/billing?invoice=${result.invoiceId}&highlight=true`
              );
            } else {
              router.replace('/dashboard/billing');
            }
            return;
          } else {
            toast.error(result.error || 'Failed to create domain order');
          }
        }

        // Check for bulk domain order
        if (pendingBulkDomainOrder) {
          setStatus('Preparing your domain orders...');

          // Retry session validation a few times to ensure it's properly loaded
          let user = null;
          for (let i = 0; i < 3; i++) {
            try {
              const { getCurrentUser } = await import('@/actions/domain-order-actions');
              user = await getCurrentUser();
              if (user) break;
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (e) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          if (!user) {
            setStatus('Authentication required. Please login again.');
            setProcessing(false);
            // Clear pending order since we can't process it
            localStorage.removeItem('pendingBulkDomainOrder');
            setTimeout(() => {
              router.replace('/dashboard');
            }, 3000);
            return;
          }

          const bulkOrderData = JSON.parse(pendingBulkDomainOrder);

          // Use the new bulk domain order action
          const result = await createBulkDomainOrderAction(bulkOrderData);

          if (result.success) {
            localStorage.removeItem('pendingBulkDomainOrder');
            sessionStorage.removeItem('processingOrder');
            clearCart();

            // GA4 purchase event
            const bulkItems = (bulkOrderData.items || []) as any[];
            const bulkValue = bulkItems.reduce((sum: number, d: any) => sum + (d.price || 0), 0);
            trackPurchase({
              currency: bulkOrderData.currency,
              value: bulkValue,
              transaction_id: String(result.invoiceId || Date.now()),
              items: bulkItems.map((d: any) => ({
                item_id: `domain-${d.domain}`,
                item_name: d.domain,
                price: d.price || 0,
                quantity: d.regPeriod || 1,
              })),
              user: ga4User,
            });

            setStatus(`Successfully registered ${result.domainCount} domain(s)!`);
            toast.success(`Successfully registered ${result.domainCount} domain(s)`);

            // Force a small delay
            await new Promise((resolve) => setTimeout(resolve, 1000));

            if (result.invoiceId) {
              router.replace(
                `/dashboard/billing?invoice=${result.invoiceId}&highlight=true`
              );
            } else {
              router.replace('/dashboard/billing');
            }
            return;
          } else {
            toast.error(result.error || 'Failed to create bulk domain order');
            setStatus('Failed to create bulk domain order');
            setProcessing(false);
            return;
          }
        }

        // If no pending orders or failures, redirect to dashboard
        setStatus('No pending orders found. Redirecting...');
        setTimeout(() => {
          router.replace('/dashboard');
        }, 1000);
      } catch (error) {
        console.error('Order processing error:', error);
        sessionStorage.removeItem('processingOrder'); // Allow retry on error
        const message = error instanceof Error ? error.message : 'An error occurred while processing your order';
        toast.error(message);
        setStatus('An error occurred. Redirecting...');
        setTimeout(() => {
          router.replace('/dashboard');
        }, 2000);
      } finally {
        if (mounted) setProcessing(false);
      }
    };

    processOrder();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
      {processing ? (
        <div className="space-y-4">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#8C52FF]" />
          <h2 className="text-xl font-semibold text-gray-900">
            Processing Your Order
          </h2>
          <p className="text-gray-500">{status}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="text-xl font-semibold text-gray-900">Success!</h2>
          <p className="text-gray-500">Redirecting to billing...</p>
          <button
            onClick={() => window.location.href = '/dashboard/billing'}
            className="text-sm text-purple-600 hover:underline mt-2 block mx-auto underline"
          >
            Click here if you are not automatically redirected
          </button>
        </div>
      )}
    </div>
  );
}
