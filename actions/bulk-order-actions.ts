'use server';

import { whmcsApi, getCurrencies } from '@/lib/whmcs';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { revalidatePath } from 'next/cache';
import type { CartItem, HostingCartItem, HostingDomainConfig } from '@/contexts/CartContext';
import { calculateDomainPrice } from './domain-order-actions';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_secret_for_development'
);

// Get user ID from session
async function getUserId() {
  const cookieStore = cookies();
  const session = (await cookieStore).get('session')?.value;

  if (!session) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(session, JWT_SECRET);
    return payload.userId as string | number;
  } catch (error) {
    return null;
  }
}

/**
 * Create bulk order from cart items (domains + hosting)
 */
export async function createBulkOrderAction(cartItems: CartItem[]) {
  try {
    // Check if user is logged in
    const clientId = await getUserId();

    if (!clientId) {
      return {
        success: false,
        error: 'Please login to continue',
        requiresLogin: true,
      };
    }

    if (!cartItems || cartItems.length === 0) {
      return {
        success: false,
        error: 'Cart is empty',
      };
    }

    // Fetch currency from cookies explicitly for WHMCS pricing calls
    const cookieStore = cookies();
    const currency = (await cookieStore).get('currency')?.value || 'USD';

    // Separate domains and hosting products
    const domains = cartItems.filter((item) => item.type === 'domain');
    const hostingProducts = cartItems.filter((item) => item.type === 'hosting');

    // Prepare WHMCS order parameters
    const orderParams: any = {
      clientid: clientId,
      paymentmethod: process.env.WHMCS_ORDER_PAYMENT_METHOD || 'banktransfer',
    };

    // Add domains to order - WHMCS expects specific format
    if (domains.length > 0) {
      // WHMCS AddOrder API for domains requires:
      // - domain: array of FULL domain names (domain + TLD, e.g., "example.com")
      // - domaintype: array of domain types ('register', 'transfer', etc.)
      // - regperiod: array of registration periods (years)
      // - billingcycle: array of billing cycles (for domains, typically 'annually')

      // Combine domain name and TLD to create full domain
      orderParams.domain = domains.map((d) => {
        // If domain already includes TLD (full domain), use as is, otherwise combine
        const fullDomain = d.domain.includes('.')
          ? d.domain
          : `${d.domain}${d.tld}`;
        return fullDomain;
      });
      orderParams.domaintype = domains.map(() => 'register');
      orderParams.regperiod = domains.map((d) => d.regPeriod || 1);
      orderParams.billingcycle = domains.map(() => 'annually');

      // Build boolean arrays for domain addons
      // Passing actual booleans prevents PHP isset() bugs in WHMCS AddOrder API
      const hasDomainAddon = (addons: any, id: string) => {
        if (!addons) return false;
        if (Array.isArray(addons)) return addons.some(a => a.id === id || (id === 'idprotection' && a.id === 'idprotect'));
        return !!(addons[id] || (id === 'idprotection' && addons['idprotect']));
      };
      
      const dnsFlags = domains.map((d) => hasDomainAddon(d.addons, 'dnsmanagement'));
      const emailFlags = domains.map((d) => hasDomainAddon(d.addons, 'emailforwarding'));
      const idpFlags = domains.map((d) => hasDomainAddon(d.addons, 'idprotection'));

      // Only include the arrays if at least one domain requested the addon
      if (dnsFlags.some((f) => f)) orderParams.dnsmanagement = dnsFlags;
      if (emailFlags.some((f) => f)) orderParams.emailforwarding = emailFlags;
      if (idpFlags.some((f) => f)) orderParams.idprotection = idpFlags;

      // EXPLICIT FIX: Enforce the WHMCS pricing matrix for domains natively, preventing internal WHMCS inflation
      const whmcsPrices = await Promise.all(domains.map(async (d) => {
        const res = await calculateDomainPrice(d.domain, d.regPeriod || 1, currency);
        return (res.success && res.data) ? res.data.totalPrice.toFixed(2) : '0.00';
      }));
      orderParams.domainprice = whmcsPrices;
    }

    // Add hosting products to order
    if (hostingProducts.length > 0) {
      // If we already have domains, we need to add hosting as additional items
      if (!orderParams.pid) {
        orderParams.pid = [];
      }
      if (!orderParams.billingcycle) {
        orderParams.billingcycle = [];
      }

      hostingProducts.forEach((h) => {
        orderParams.pid.push(h.productId);
        orderParams.billingcycle.push(h.billingCycle);
      });

      // Add addons if any
      const addons = hostingProducts.flatMap((h) => h.addons || []);
      if (addons.length > 0) {
        orderParams.addons = addons.map((a) => a.id);
      }
    }

    // Get user's currency information
    const { getUserCurrency } = await import('@/lib/currency');
    const userCurrency = await getUserCurrency();

    // Try to fetch pricing from WHMCS first (for display purposes)
    let pricingInfo: Record<string, any> | null = null;
    try {
      const pricingResponse = await whmcsApi('GetTLDPricing', {
        currencyid: userCurrency.currencyid,
      });
      if (pricingResponse.result === 'success' && pricingResponse.pricing) {
        pricingInfo = pricingResponse.pricing;
      }
    } catch (pricingError) {
      // Pricing fetch failed, continue without pricing info
    }

    // Only use placeholder when explicitly enabled (e.g. for demo without WHMCS).
    // In dev/production, if WHMCS AddOrder fails we show the real error so you can fix WHMCS config.
    const usePlaceholderInvoice = process.env.USE_PLACEHOLDER_INVOICE === 'true';

    let response;
    try {
      response = await whmcsApi('AddOrder', orderParams);
    } catch (apiError: any) {
      if (usePlaceholderInvoice) {
        const placeholderOrderId = Math.floor(Math.random() * 10000);
        const placeholderInvoiceId = Math.floor(Math.random() * 10000);
        const totalAmount = cartItems.reduce(
          (sum, item) => sum + item.price,
          0
        );
        revalidatePath('/dashboard/billing', 'page');
        revalidatePath('/dashboard/domains', 'page');
        revalidatePath('/dashboard/services', 'page');
        return {
          success: true,
          orderId: placeholderOrderId,
          invoiceId: placeholderInvoiceId,
          message: `Order created successfully with ${cartItems.length} item(s) [TEST MODE - Placeholder Invoice]`,
          data: {
            result: 'success',
            orderid: placeholderOrderId,
            invoiceid: placeholderInvoiceId,
            total: totalAmount.toFixed(2),
          },
          isPlaceholder: true,
          pricingInfo: pricingInfo,
        };
      }
      // Show real WHMCS error so user can fix config (e.g. domain products, TLD pricing)
      const message =
        apiError?.message || apiError?.response?.data?.message || 'Failed to create order in WHMCS';
      console.error('WHMCS AddOrder failed:', message);
      return {
        success: false,
        error: message,
      };
    }

    // Check if order was created successfully
    if (response.result === 'success') {
      let invoiceId = response.invoiceid;

      // NOTE: We do NOT call AcceptOrder here because it would activate the
      // services/domains before payment is confirmed. AcceptOrder should only
      // be called after successful payment in the Stripe webhook handler.
      // Instead, we try to resolve the invoice ID through other means.

      // Try to get invoice ID from orders list
      if (!invoiceId && response.orderid) {
        try {
          const ordersResponse = await whmcsApi('GetOrders', {
            id: response.orderid,
            limitnum: 1,
          });

          if (ordersResponse.result === 'success' && ordersResponse.orders) {
            const orders = ordersResponse.orders.order;
            const order = Array.isArray(orders) ? orders[0] : orders;

            if (order && order.invoiceid) {
              invoiceId = order.invoiceid;
            } else {
              // Try to find invoice by orderid using GetInvoices
              const userId = await getUserId();
              const invoicesResponse = await whmcsApi('GetInvoices', {
                userid: userId,
                limitnum: 20,
              });

              if (
                invoicesResponse.result === 'success' &&
                invoicesResponse.invoices
              ) {
                const invoices = invoicesResponse.invoices.invoice;
                const invoiceList = Array.isArray(invoices)
                  ? invoices
                  : invoices
                    ? [invoices]
                    : [];

                // Find invoice that matches the order
                const matchingInvoice = invoiceList.find((inv: any) => {
                  const invOrderId = String(inv.orderid || '');
                  const responseOrderId = String(response.orderid);
                  return invOrderId === responseOrderId;
                });

                if (matchingInvoice && matchingInvoice.id) {
                  invoiceId = matchingInvoice.id;
                }
              }
            }
          }
        } catch (orderError: any) {
          // Failed to fetch invoice from order
        }
      }

      // If still no invoiceId, try to create one manually using the order total
      if (!invoiceId && response.orderid) {
        try {
          console.log(
            `Still no invoice found for order ${response.orderid}, attempting manual creation...`
          );

          // 1. Get order details to check amount
          const orderResponse = await whmcsApi('GetOrders', {
            id: response.orderid,
            limitnum: 1,
          });

          let orderAmount = 0;
          if (orderResponse.result === 'success' && orderResponse.orders) {
            const orders = orderResponse.orders.order;
            const order = Array.isArray(orders) ? orders[0] : orders;
            if (order) {
              orderAmount = parseFloat(order.amount || '0');
            }
          }

          if (orderAmount > 0) {
            // Construct descriptive string from cart items
            const itemDescriptions: string[] = [];

            // Add domain descriptions
            domains.forEach((d) => {
              const domainName = d.domain.includes('.')
                ? d.domain
                : `${d.domain}${d.tld}`;
              itemDescriptions.push(`Domain Registration - ${domainName}`);
            });

            // Add hosting descriptions
            hostingProducts.forEach((h) => {
              // Try to find product name if possible, otherwise generic
              itemDescriptions.push(
                `Hosting Service - ${(h as any).domain || 'New Account'}`
              );
            });

            const description =
              itemDescriptions.length > 0
                ? `Order #${response.orderid} - ${itemDescriptions.join(', ')}`
                : `Order #${response.orderid} Payment`;

            // 2. Create invoice manually with correct amount
            const invoiceResponse = await whmcsApi('CreateInvoice', {
              userid: clientId,
              status: 'Unpaid',
              sendinvoice: true,
              paymentmethod: process.env.WHMCS_ORDER_PAYMENT_METHOD || 'banktransfer',
              itemdescription: [description],
              itemamount: [orderAmount],
              itemtaxed: [false], // Tax already included in order total usually
            });

            if (
              invoiceResponse.result === 'success' &&
              invoiceResponse.invoiceid
            ) {
              invoiceId = invoiceResponse.invoiceid;
              console.log(
                `Created manual invoice ${invoiceId} for bulk order ${response.orderid} with amount ${orderAmount}`
              );
            }
          } else {
            console.warn(
              `Order ${response.orderid} has 0 amount, skipping invoice creation`
            );
          }
        } catch (manualInvoiceError) {
          console.error(
            'Failed to create manual invoice for bulk order:',
            manualInvoiceError
          );
        }
      }

      // Sync invoice to MongoDB if invoiceId exists
      if (invoiceId) {
        // NOTE: We rely entirely on WHMCS's native tax rule engine (which reads the client's country)
        // rather than manually calling UpdateInvoice to force `taxrate` or `taxrate2`. Updating the taxrate API property
        // on a freshly minted invoice causes an internal WHMCS recalculation bug, inflating base prices.

        try {
          const { getInvoicesCollection } = await import('@/lib/db');
          const { syncInvoiceToMongoDB } = await import('@/lib/invoice-sync');
          const invoicesCollection = await getInvoicesCollection();
          await syncInvoiceToMongoDB(invoiceId, clientId, invoicesCollection);
        } catch (syncError) {
          console.error('Failed to sync invoice to MongoDB:', syncError);
          // Continue anyway - invoice exists in WHMCS
        }
      }

      // Revalidate relevant pages
      revalidatePath('/dashboard/billing', 'page');
      revalidatePath('/dashboard/domains', 'page');
      revalidatePath('/dashboard/services', 'page');

      return {
        success: true,
        orderId: response.orderid,
        invoiceId: invoiceId || null,
        message: invoiceId
          ? `Order created successfully with ${cartItems.length} item(s)`
          : `Order created successfully with ${cartItems.length} item(s). Invoice will be created after domain registration.`,
        data: response,
      };
    } else {
      // Order creation failed
      // If in development mode and order failed, use placeholder
      if (usePlaceholderInvoice) {
        const placeholderOrderId = Math.floor(Math.random() * 10000);
        const placeholderInvoiceId = Math.floor(Math.random() * 10000);
        const totalAmount = cartItems.reduce(
          (sum, item) => sum + item.price,
          0
        );

        revalidatePath('/dashboard/billing', 'page');
        revalidatePath('/dashboard/domains', 'page');
        revalidatePath('/dashboard/services', 'page');

        return {
          success: true,
          orderId: placeholderOrderId,
          invoiceId: placeholderInvoiceId,
          message: `Order created successfully with ${cartItems.length} item(s) [TEST MODE - Placeholder Invoice]`,
          data: {
            result: 'success',
            orderid: placeholderOrderId,
            invoiceid: placeholderInvoiceId,
            total: totalAmount.toFixed(2),
          },
          isPlaceholder: true,
          pricingInfo: pricingInfo,
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to create order',
        };
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An error occurred while creating order',
    };
  }
}

/**
 * Get order summary for cart items
 */
export async function getCartOrderSummary(cartItems: CartItem[]) {
  try {
    const domains = cartItems.filter((item) => item.type === 'domain');
    const hosting = cartItems.filter((item) => item.type === 'hosting');

    const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

    return {
      success: true,
      data: {
        totalItems: cartItems.length,
        domains: {
          count: domains.length,
          items: domains.map((d) => ({
            domain: d.domain,
            price: d.price,
            period: d.regPeriod,
          })),
        },
        hosting: {
          count: hosting.length,
          items: hosting.map((h) => ({
            name: h.productName,
            price: h.price,
            cycle: h.billingCycle,
          })),
        },
        totalPrice,
        // Removed usage of userCurrency (which is undefined in this scope)
        currency: undefined,
        currencyInfo: undefined,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to calculate order summary',
    };
  }
}

export interface HostingConfiguration {
  cartItemId: string;
  billingCycle: string;
  domainConfig: HostingDomainConfig | null;
  addons: any[];
}

/**
 * Create a unified order from cart items (domains + hosting) with full
 * currency sync, location sync, domain bundling, promo codes, and tax handling.
 */
export async function createUnifiedOrderAction(
  cartItems: CartItem[],
  hostingConfigs: HostingConfiguration[],
  promoCode: string,
  currencyCode: string,
  country?: string,
  state?: string,
) {
  try {
    const clientId = await getUserId();
    if (!clientId) {
      return { success: false, error: 'Please login to continue', requiresLogin: true };
    }

    if (!cartItems || cartItems.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    const selectedCurrency = String(currencyCode || '').trim().toUpperCase();
    if (!selectedCurrency) {
      return { success: false, error: 'Currency code is required' };
    }

    // Sync currency
    try {
      const currenciesResponse = await getCurrencies();
      if (currenciesResponse.success && Array.isArray(currenciesResponse.data)) {
        const selectedCurr = currenciesResponse.data.find(
          (c: any) => String(c.code || '').toUpperCase() === selectedCurrency
        );
        if (selectedCurr) {
          await whmcsApi('UpdateClient', { clientid: clientId, currency: parseInt(selectedCurr.id, 10) });
        }
      }
    } catch (e) {
      console.warn('[UnifiedOrder] Currency sync failed, continuing:', e);
    }

    // Sync location for tax
    if (country) {
      try {
        const updateData: any = { clientid: clientId, country };
        if (state) updateData.state = state;
        await whmcsApi('UpdateClient', updateData);
      } catch (e) {
        console.warn('[UnifiedOrder] Location sync failed, continuing:', e);
      }
    }

    const domains = cartItems.filter((item) => item.type === 'domain');
    const hostingProducts = cartItems.filter((item) => item.type === 'hosting') as HostingCartItem[];

    const orderParams: any = {
      clientid: clientId,
      paymentmethod: process.env.WHMCS_ORDER_PAYMENT_METHOD || 'banktransfer',
    };

    // Domain addon helper
    const hasDomainAddon = (addons: any, id: string) => {
      if (!addons) return false;
      if (Array.isArray(addons)) return addons.some((a) => a.id === id || (id === 'idprotection' && a.id === 'idprotect'));
      return !!(addons[id] || (id === 'idprotection' && addons['idprotect']));
    };

    const pids: number[] = [];
    const cycles: string[] = [];

    // --- Hosting products first (indices 0..hostingCount-1) ---
    // domain[i] at these indices associates with pid[i]
    hostingProducts.forEach((h, idx) => {
      const config = hostingConfigs.find((c) => c.cartItemId === `hosting-${h.productId}`);
      const cycle = config?.billingCycle || h.billingCycle;

      pids.push(h.productId);
      cycles.push(cycle);

      if (config?.domainConfig?.domain) {
        const dc = config.domainConfig;
        orderParams[`domain[${idx}]`] = dc.domain;

        if (dc.type === 'register') {
          orderParams[`domaintype[${idx}]`] = 'register';
          orderParams[`regperiod[${idx}]`] = dc.years || 1;
        } else if (dc.type === 'transfer') {
          orderParams[`domaintype[${idx}]`] = 'transfer';
          orderParams[`regperiod[${idx}]`] = dc.years || 1;
          if (dc.eppCode) orderParams[`eppcode[${idx}]`] = dc.eppCode;
        } else {
          orderParams[`domaintype[${idx}]`] = 'owndomain';
        }

        orderParams[`dnsmanagement[${idx}]`] = 0;
        orderParams[`emailforwarding[${idx}]`] = 0;
        orderParams[`idprotection[${idx}]`] = 0;
      }

      if (config?.addons && config.addons.length > 0) {
        config.addons.forEach((addon: any) => {
          orderParams[`configoptions[${addon.id}]`] = addon.value || addon.name;
        });
      }
    });

    // --- Standalone domains after hosting (indices hostingCount..) ---
    // domain[i] at these indices has no corresponding pid[i], so WHMCS treats
    // them as standalone domain registrations.
    for (let d = 0; d < domains.length; d++) {
      const domain = domains[d];
      const idx = hostingProducts.length + d;
      const fullDomain = domain.domain.includes('.') ? domain.domain : `${domain.domain}${domain.tld}`;

      orderParams[`domain[${idx}]`] = fullDomain;
      orderParams[`domaintype[${idx}]`] = 'register';
      orderParams[`regperiod[${idx}]`] = domain.regPeriod || 1;

      const hasDns = hasDomainAddon(domain.addons, 'dnsmanagement');
      const hasEmail = hasDomainAddon(domain.addons, 'emailforwarding');
      const hasIdp = hasDomainAddon(domain.addons, 'idprotection');
      if (hasDns) orderParams[`dnsmanagement[${idx}]`] = 1;
      if (hasEmail) orderParams[`emailforwarding[${idx}]`] = 1;
      if (hasIdp) orderParams[`idprotection[${idx}]`] = 1;

      const priceRes = await calculateDomainPrice(fullDomain, domain.regPeriod || 1, selectedCurrency);
      if (priceRes.success && priceRes.data) {
        orderParams[`domainprice[${idx}]`] = priceRes.data.totalPrice.toFixed(2);
      }
    }

    orderParams.pid = pids;
    orderParams.billingcycle = cycles;

    // Promo code
    if (promoCode && promoCode.trim()) {
      orderParams.promocode = promoCode.trim();
    }

    // Legacy domain format fallback — converts domain[0] etc. to top-level arrays
    const toLegacyDomainPayload = (payload: any) => {
      if (!payload) return payload;
      const legacy: any = { ...payload };
      for (const key of Object.keys(payload)) {
        const match = key.match(/^(\w+)\[(\d+)\]$/);
        if (match) {
          legacy[match[1]] = legacy[match[1]] || [];
          legacy[match[1]][parseInt(match[2])] = payload[key];
          delete legacy[key];
        }
      }
      return legacy;
    };

    const domainPayloadStrategy = String(process.env.WHMCS_ADDORDER_DOMAIN_FORMAT || 'array')
      .trim()
      .toLowerCase();
    const preferLegacy = domainPayloadStrategy === 'legacy';

    const primaryOrderData = preferLegacy ? toLegacyDomainPayload(orderParams) : orderParams;
    const fallbackOrderData = preferLegacy ? orderParams : toLegacyDomainPayload(orderParams);

    const usePlaceholderInvoice = process.env.USE_PLACEHOLDER_INVOICE === 'true';

    let response: any;
    try {
      response = await whmcsApi('AddOrder', primaryOrderData);
    } catch (addOrderError: any) {
      const canRetryWithLegacyDomainFormat =
        Boolean(orderParams['domain[0]']) &&
        (String(addOrderError?.response?.status || '') === '500' ||
          String(addOrderError?.message || '').toLowerCase().includes('status code 500'));

      if (!canRetryWithLegacyDomainFormat) throw addOrderError;

      console.warn('[UnifiedOrder] Primary format failed, retrying with legacy domain format.');
      response = await whmcsApi('AddOrder', fallbackOrderData);
    }

    if (!response || response.result !== 'success') {
      if (usePlaceholderInvoice) {
        const placeholderOrderId = Math.floor(Math.random() * 10000);
        revalidatePath('/dashboard/billing', 'page');
        revalidatePath('/dashboard/domains', 'page');
        revalidatePath('/dashboard/services', 'page');
        return { success: true, orderId: placeholderOrderId, invoiceId: placeholderOrderId, message: `Order created [TEST MODE]`, isPlaceholder: true };
      }
      return { success: false, error: response?.message || 'Failed to create order in WHMCS' };
    }

    const orderId = parseInt(String(response.orderid || ''), 10);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      return { success: false, error: 'WHMCS did not return a valid order ID' };
    }

    let invoiceId = response.invoiceid ? parseInt(String(response.invoiceid), 10) : undefined;

    // Multi-strategy invoice resolution
    if (!invoiceId && orderId) {
      try {
        const invoicesResponse = await whmcsApi('GetInvoices', {
          userid: clientId,
          limitnum: 20,
          orderby: 'id',
          order: 'DESC',
        });
        if (invoicesResponse.result === 'success' && invoicesResponse.invoices?.invoice) {
          const invoices = invoicesResponse.invoices.invoice;
          const invoiceList = Array.isArray(invoices) ? invoices : [invoices];
          const matching = invoiceList.find((inv: any) => String(inv.orderid || '') === String(orderId));
          if (matching?.id) invoiceId = parseInt(String(matching.id), 10);
        }
      } catch {}

      if (!invoiceId && orderId) {
        try {
          const orderLookup = await whmcsApi('GetOrders', { id: orderId, limitnum: 1 });
          const orderData = Array.isArray(orderLookup.orders?.order)
            ? orderLookup.orders.order[0]
            : orderLookup.orders?.order;
          const orderInvoiceId = parseInt(String(orderData?.invoiceid || ''), 10);
          if (Number.isFinite(orderInvoiceId) && orderInvoiceId > 0) {
            invoiceId = orderInvoiceId;
          } else {
            const orderAmount = parseFloat(String(orderData?.amount || '0'));
            if (orderAmount > 0) {
              const itemDescs: string[] = [];
              domains.forEach((d) => itemDescs.push(`Domain Registration - ${d.domain.includes('.') ? d.domain : `${d.domain}${d.tld}`}`));
              hostingProducts.forEach((h) => itemDescs.push(`Hosting Service - ${h.productName}`));
              const desc = itemDescs.length > 0 ? `Order #${orderId} - ${itemDescs.join(', ')}` : `Order #${orderId} Payment`;
              const fallbackInvoice = await whmcsApi('CreateInvoice', {
                userid: clientId,
                status: 'Unpaid',
                sendinvoice: true,
                paymentmethod: process.env.WHMCS_ORDER_PAYMENT_METHOD || 'banktransfer',
                itemdescription: [desc],
                itemamount: [orderAmount],
                itemtaxed: [true],
              });
              const fallbackInvoiceId = parseInt(String(fallbackInvoice?.invoiceid || ''), 10);
              if (Number.isFinite(fallbackInvoiceId) && fallbackInvoiceId > 0) invoiceId = fallbackInvoiceId;
            }
          }
        } catch {}
      }
    }

    // Sync to MongoDB
    if (invoiceId) {
      try {
        const { getInvoicesCollection } = await import('@/lib/db');
        const { syncInvoiceToMongoDB } = await import('@/lib/invoice-sync');
        const invoicesCollection = await getInvoicesCollection();
        await syncInvoiceToMongoDB(invoiceId, clientId, invoicesCollection);
      } catch (syncError) {
        console.error('[UnifiedOrder] Failed to sync invoice to MongoDB:', syncError);
      }
    }

    // Sync hosting orders to MongoDB
    try {
      const { getHostingOrdersCollection } = await import('@/lib/db');
      const ordersCollection = await getHostingOrdersCollection();
      const serviceIds = response.productids ? String(response.productids).split(',') : [];
      for (let i = 0; i < hostingProducts.length; i++) {
        const h = hostingProducts[i];
        const config = hostingConfigs.find((c) => c.cartItemId === `hosting-${h.productId}`);
        await ordersCollection.insertOne({
          whmcsOrderId: orderId,
          whmcsInvoiceId: invoiceId ?? 0,
          whmcsServiceId: serviceIds[i] ? parseInt(serviceIds[i]) : undefined,
          clientId: Number(clientId),
          clientEmail: '',
          productId: h.productId,
          productName: h.productName,
          billingCycle: config?.billingCycle || h.billingCycle,
          domain: config?.domainConfig?.domain || undefined,
          addons: config?.addons || [],
          basePrice: h.price,
          totalPrice: h.price,
          status: 'Pending',
          createdAt: new Date(),
        });
      }
    } catch (mongoError) {
      console.error('[UnifiedOrder] Failed to sync orders to MongoDB:', mongoError);
    }

    // Create email services for hosting items with domains
    try {
      const { createEmailServiceAction } = await import('./email-bundle-actions');
      const serviceIds = response.productids ? String(response.productids).split(',') : [];
      for (let i = 0; i < hostingProducts.length; i++) {
        const config = hostingConfigs.find((c) => c.cartItemId === `hosting-${hostingProducts[i].productId}`);
        if (serviceIds[i] && config?.domainConfig?.domain) {
          await createEmailServiceAction({
            whmcsServiceId: parseInt(serviceIds[i]),
            clientId: Number(clientId),
            domain: config.domainConfig.domain,
            plan: 'free',
          });
        }
      }
    } catch (emailError) {
      console.warn('[UnifiedOrder] Email service creation failed:', emailError);
    }

    // Lock currency
    try {
      const { setUserDefaultCurrency } = await import('./currency-actions');
      await setUserDefaultCurrency(selectedCurrency);
    } catch {}

    // Revalidate pages
    revalidatePath('/dashboard/billing', 'page');
    revalidatePath('/dashboard/domains', 'page');
    revalidatePath('/dashboard/services', 'page');

    return {
      success: true,
      orderId,
      invoiceId: invoiceId || null,
      message: invoiceId
        ? `Order created successfully with ${cartItems.length} item(s)`
        : `Order created successfully. Invoice will be generated shortly.`,
    };
  } catch (error: any) {
    console.error('[UnifiedOrder] Error:', error);
    return { success: false, error: error.message || 'An error occurred while creating order' };
  }
}
