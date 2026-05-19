'use server';

import { whmcsApi, getCurrencies } from '@/lib/whmcs';
import { formatCurrencyWithSymbol } from '@/lib/currency-utils';
import { getHostingOrdersCollection, getInvoicesCollection } from '@/lib/db';
import { HOSTING_PLANS } from '@/lib/config/hosting-plans';
import type { ProductGroupKey } from '@/lib/product-plans-tina';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { syncInvoiceToMongoDB } from '@/lib/invoice-sync';
import { createEmailServiceAction } from '@/actions/email-bundle-actions';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

/**
 * Get current user from JWT session
 */
async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return null;
    }

    const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET);
    return payload as { userId: number; email: string; mongoId: string };
  } catch {
    return null;
  }
}

async function syncClientCurrency(clientId: number, currencyCode?: string) {
  const requestedCurrency = String(currencyCode || '').trim().toUpperCase();
  if (!requestedCurrency) {
    return { success: false, error: 'Currency code is required' };
  }

  const currenciesResponse = await getCurrencies();
  if (!currenciesResponse.success || !Array.isArray(currenciesResponse.data)) {
    return { success: false, error: 'Failed to load currencies from WHMCS' };
  }

  const selectedCurrency = currenciesResponse.data.find(
    (c: any) => String(c.code || '').toUpperCase() === requestedCurrency
  );

  if (!selectedCurrency) {
    return {
      success: false,
      error: `Currency ${requestedCurrency} is not configured in WHMCS`,
    };
  }

  const currencyId = parseInt(selectedCurrency.id, 10);
  if (!Number.isFinite(currencyId) || currencyId <= 0) {
    return {
      success: false,
      error: `Invalid WHMCS currency ID for ${requestedCurrency}`,
    };
  }

  const response = await whmcsApi('UpdateClient', {
    clientid: clientId,
    currency: currencyId,
  });

  if (response.result !== 'success') {
    return {
      success: false,
      error: response.message || 'Failed to update client currency in WHMCS',
    };
  }

  return { success: true };
}

async function syncClientLocation(clientId: number, country?: string, state?: string) {
  if (!country) return { success: true };

  const updateData: any = {
    clientid: clientId,
    country: country,
  };
  if (state) updateData.state = state;

  // Try to update client location
  try {
    const response = await whmcsApi('UpdateClient', updateData);
    if (response.result !== 'success') {
      console.warn('[Hosting Order] Failed to update client location:', response.message);
    }
  } catch (e) {
    console.warn('[Hosting Order] Error updating client location:', e);
  }
  return { success: true };
}

/**
 * Get all product groups from WHMCS
 */
export async function getProductGroupsAction() {
  try {
    const response = await whmcsApi('GetProducts', {});

    if (response.result === 'success' && response.products) {
      // Extract unique groups
      const products = Array.isArray(response.products.product)
        ? response.products.product
        : [response.products.product];

      const groupsMap = new Map();
      products.forEach((product: any) => {
        if (!groupsMap.has(product.gid)) {
          groupsMap.set(product.gid, {
            id: parseInt(product.gid),
            name: product.group_name || `Group ${product.gid}`,
          });
        }
      });

      return {
        success: true,
        data: Array.from(groupsMap.values()),
      };
    }

    return { success: false, error: 'Failed to fetch product groups' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get products by group ID from WHMCS
 */
export async function getProductsAction(groupId?: number) {
  try {
    const params: any = {};
    if (groupId) {
      params.gid = groupId;
    }

    const response = await whmcsApi('GetProducts', params);

    if (response.result === 'success' && response.products) {
      const products = Array.isArray(response.products.product)
        ? response.products.product
        : [response.products.product];

      // Format products with pricing
      const formattedProducts = products.map((product: any) => ({
        id: parseInt(product.pid),
        groupId: parseInt(product.gid),
        name: product.name,
        description: product.description || '',
        type: product.type,
        pricing: product.pricing?.USD || product.pricing || {},
        features: parseFeatures(product.description),
      }));

      return {
        success: true,
        data: formattedProducts,
      };
    }

    return { success: false, error: 'No products found' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Map WHMCS group ID (gid) to Tina product-plans group key */
function getGroupKeyFromGid(gid: number): ProductGroupKey | null {
  const gidStr = String(gid);
  if (HOSTING_PLANS.shared?.gid === gidStr) return 'shared';
  if (HOSTING_PLANS.wordpress?.gid === gidStr) return 'wordpress';
  if (HOSTING_PLANS.vps?.gid === gidStr) return 'vps';
  if (HOSTING_PLANS.ecommerce?.gid === gidStr) return 'ecommerce';
  return null;
}

/**
 * Parse WHMCS_FREE_DOMAIN_CONFIG env var.
 * Format: pid:paymentterms:tlds|pid:paymentterms:tlds
 * Example: 1:annually:.com,.net,.org|2:annually,biennially:.com
 */
function normalizeBillingCycleAlias(cycle: string): string {
  const normalized = String(cycle || '').trim().toLowerCase();
  const cleaned = normalized.replace(/[^a-z]/g, '');

  switch (cleaned) {
    case 'annual':
    case 'yearly':
    case 'year':
      return 'annually';
    case 'semiannual':
    case 'semiannually':
    case 'halfyearly':
      return 'semiannually';
    case 'biannual':
    case 'biennial':
    case 'twoyear':
      return 'biennially';
    case 'triennial':
    case 'threeyear':
      return 'triennially';
    default:
      return cleaned || normalized;
  }
}

function parseFreeDomainEnvConfig(): Record<number, { paymentTerms: string[]; freeDomainTlds: string[] }> {
  const raw = process.env.WHMCS_FREE_DOMAIN_CONFIG || '*:annually,semiannually,monthly,quarterly,onetime:.com,.org,.net,.xyz,.art,.cc,.eu,.best,.info,.biz,.pro,.name,.online,.website,.web,.one,.blog,.club,.vip,.top,.us,.ca,.uk,.co.uk,.nl,.de,.es';
  const result: Record<number, { paymentTerms: string[]; freeDomainTlds: string[] }> = {};

  if (!raw.trim()) return result;

  for (const entry of raw.split('|')) {
    const parts = entry.trim().split(':');
    if (parts.length < 3) continue;

    const pidToken = parts[0].trim();
    const pid = pidToken === '*' ? 0 : parseInt(pidToken, 10);
    if (!Number.isFinite(pid) || (pid < 0 && pid !== 0)) continue;

    const paymentTerms = parts[1]
      .split(',')
      .map((t) => normalizeBillingCycleAlias(t))
      .filter(Boolean);

    const freeDomainTlds = parts[2]
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .map((t) => (t.startsWith('.') ? t : `.${t}`));

    result[pid] = { paymentTerms, freeDomainTlds };
  }

  return result;
}

export async function checkProductFreeDomainAction(
  productId: number,
  billingCycle: string,
  domainName?: string
) {

  try {
    // WHMCS GetProducts API does not expose free domain fields (freedomaintype etc.)
    // We rely on WHMCS_FREE_DOMAIN_CONFIG env var which mirrors the WHMCS product Free Domain tab.
    const freeDomainConfig = parseFreeDomainEnvConfig();
  
    const productConfig = freeDomainConfig[productId] || freeDomainConfig[0];
  
    if (!productConfig) {
      return { success: true, hasFreeDomain: false, qualifiesForFreeDomain: false };
    }

    const { paymentTerms, freeDomainTlds } = productConfig;

    const normalizedCycle = normalizeBillingCycleAlias(billingCycle);
    const qualifiesByCycle = paymentTerms.includes(normalizedCycle);

    const normalizedDomain = String(domainName || '').trim().toLowerCase();
    const domainTld = normalizedDomain.includes('.')
      ? `.${normalizedDomain.split('.').pop() || ''}`
      : '';

    const qualifiesByTld = !domainTld || freeDomainTlds.length === 0 || freeDomainTlds.includes(domainTld);
    const qualifiesForFreeDomain = qualifiesByCycle && qualifiesByTld;

    console.log('[FreeDomain] pid:', productId, 'cycle:', normalizedCycle, 'tld:', domainTld || '(n/a)', 'qualifies:', qualifiesForFreeDomain);

    return {
      success: true,
      hasFreeDomain: true,
      qualifiesForFreeDomain,
      freedomaintype: 'register',
      paymentTerms,
      freeDomainTlds,
    };
  } catch (error: any) {
    console.error('[FreeDomain] Error:', error.message);
    return { success: false, hasFreeDomain: false, qualifiesForFreeDomain: false };
  }
}

/**
 * Get single product details. If locale is provided, name/tagline/description/features
 * are overridden from Tina CMS (translations/product-plans/{group}/{locale}.json).
 */
export async function getProductDetailsAction(
  productId: number,
  locale?: string,
  currencyCode: string = 'USD'
) {
  try {
    // Get currency ID for WHMCS API
    const currenciesResponse = await getCurrencies();
    let currencyId = 1; // Default to USD
    if (currenciesResponse.success && currenciesResponse.data.length > 0) {
      const currency = currenciesResponse.data.find(
        (c: any) => c.code.toUpperCase() === currencyCode.toUpperCase()
      );
      if (currency) {
        currencyId = parseInt(currency.id);
      }
    }

    const response = await whmcsApi('GetProducts', {
      pid: productId,
      currency: currencyId
    });

    if (response.result === 'success' && response.products?.product) {
      // WHMCS can return single product or array
      const products = Array.isArray(response.products.product)
        ? response.products.product
        : [response.products.product];

      // Find the specific product by ID
      const product = products.find((p: any) => parseInt(p.pid) === productId);

      if (!product) {
        return { success: false, error: 'Product not found' };
      }

      const groupId = parseInt(product.gid, 10) || 0;
      let name = product.name;
      let tagline = product.tagline || '';
      let description = product.description || '';
      let features = parseFeatures(product.description);

      if (locale) {
        const groupKey = getGroupKeyFromGid(groupId);
        if (groupKey) {
          const { getTinaTranslationMap } = await import('@/lib/product-plans-tina');
          const tinaMap = await getTinaTranslationMap(groupKey, locale);
          const tinaPlan = tinaMap.get(productId);
          if (tinaPlan) {
            if (tinaPlan.name) name = tinaPlan.name;
            if (tinaPlan.tagline != null) tagline = tinaPlan.tagline;
            if (tinaPlan.description != null) description = tinaPlan.description;
            if (tinaPlan.features?.length) features = tinaPlan.features;
          }
        }
      }

      return {
        success: true,
        data: {
          id: parseInt(product.pid),
          groupId,
          name,
          tagline,
          description,
          pricing: product.pricing?.[currencyCode] || product.pricing?.USD || product.pricing || {},
          configoptions: product.configoptions || [],
          features,
        },
      };
    }

    return { success: false, error: 'Product not found' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Calculate hosting price with add-ons
 */
export async function calculateHostingPriceAction(
  productId: number,
  billingCycle: string,
  addons: { id: number; value: string }[] = [],
  currencyCode: string = 'USD'
) {
  try {
    const productResult = await getProductDetailsAction(productId, undefined, currencyCode);

    if (!productResult.success || !productResult.data) {
      return { success: false, error: 'Product not found' };
    }

    const { pricing, configoptions } = productResult.data;

    // Get base price for billing cycle
    const basePrice = parseFloat(
      pricing[billingCycle] || pricing.monthly || '0'
    );

    // Calculate add-ons price
    let addonsTotal = 0;
    if (configoptions && addons.length > 0) {
      addons.forEach((addon) => {
        const config = configoptions.find((c: any) => c.id === addon.id);
        if (config && config.options) {
          const option = config.options.find(
            (o: any) => o.name === addon.value
          );
          if (option && option.pricing) {
            addonsTotal += parseFloat(
              option.pricing[billingCycle] || option.pricing.monthly || '0'
            );
          }
        }
      });
    }

    const total = basePrice + addonsTotal;

    // Note: WHMCS pricing already includes different rates per billing cycle
    // The pricing object has: monthly, quarterly, semiannually, annually, biennially, triennially
    // Each with its own price - no need to calculate manual discounts
    // The price difference IS the discount

    return {
      success: true,
      data: {
        basePrice,
        addonsTotal,
        subtotal: total,
        discount: 0, // Discount is already in WHMCS pricing per cycle
        total: total,
        billingCycle,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create hosting order in WHMCS and sync to MongoDB
 */
export async function createHostingOrderAction(
  productId: number,
  billingCycle: string,
  domain?: string,
  addons: { id: number; value: string; name: string; price: number }[] = [],
  domainType?: 'register' | 'transfer' | 'owndomain' | 'existing',
  promoCode?: string,
  eppCode?: string,
  regperiod: number = 1,
  apiOptions: any = {},
  currencyCode?: string,
  country?: string,
  state?: string
) {
  try {
    // Check if user is logged in
    const user = await getCurrentUser();

    if (!user) {
      // Save to localStorage via client-side redirect,
      return {
        success: false,
        requiresLogin: true,
        message: 'Please login to complete your order',
      };
    }

    const selectedCurrency = String(currencyCode || '').trim().toUpperCase();
    if (!selectedCurrency) {
      return { success: false, error: 'Currency code is required' };
    }

    const currencySync = await syncClientCurrency(user.userId, selectedCurrency);
    if (!currencySync.success) {
      return { success: false, error: currencySync.error };
    }

    // Update client location if provided for accurate tax calculation
    if (country) {
      await syncClientLocation(user.userId, country, state);
    }

    // Get product details
    const productResult = await getProductDetailsAction(
      productId,
      undefined,
      selectedCurrency
    );
    if (!productResult.success || !productResult.data) {
      return { success: false, error: 'Product not found' };
    }

    // Calculate pricing
    const priceResult = await calculateHostingPriceAction(
      productId,
      billingCycle,
      addons,
      selectedCurrency
    );
    if (!priceResult.success || !priceResult.data) {
      return { success: false, error: 'Failed to calculate pricing' };
    }

    // Prepare config options for WHMCS
    const configoptions: Record<number, string> = {};
    addons.forEach((addon) => {
      configoptions[addon.id] = addon.value;
    });

    // Create order in WHMCS
    const orderData: any = {
      clientid: user.userId,
      pid: productId,
      billingcycle: billingCycle,
      paymentmethod: process.env.WHMCS_ORDER_PAYMENT_METHOD || 'stripe',
      ...apiOptions,
    };

    // WHMCS AddOrder rejects domaintype=owndomain for TLDs not in its pricing
    // table (even .com fails). Skip domain fields for owndomain and patch after.
    const isOwnDomain = Boolean(domain) && (!domainType || domainType === 'existing');

    if (domain && !isOwnDomain) {
      const whmcsDomainType = domainType === 'register' ? 'register' : 'transfer';
      orderData['domain[0]'] = domain;
      orderData['domaintype[0]'] = whmcsDomainType;
      orderData['regperiod[0]'] = regperiod || 1;

      if (whmcsDomainType === 'transfer' && eppCode) {
        orderData['eppcode[0]'] = eppCode;
      }

      orderData['dnsmanagement[0]'] = 0;
      orderData['emailforwarding[0]'] = 0;
      orderData['idprotection[0]'] = 0;
    }

    if (Object.keys(configoptions).length > 0) {
      orderData.configoptions = configoptions;
    }


    // Include promo code if provided - WHMCS will apply the discount automatically
    const promoCodeToApply = promoCode && promoCode.trim() !== '' ? promoCode.trim() : null;

    if (promoCodeToApply) {
      orderData.promocode = promoCodeToApply;
    }

    console.log('[Hosting Order] AddOrder payload summary:', {
      pid: orderData.pid,
      billingcycle: orderData.billingcycle,
      domain: orderData.domain || orderData['domain[0]'] || '(none)',
      domaintype: orderData.domaintype || orderData['domaintype[0]'] || '(none)',
      isOwnDomain,
      hasPromo: Boolean(orderData.promocode),
    });

    const toLegacyDomainPayload = (payload: any) => {
      if (!payload?.['domain[0]']) return payload;

      const legacyPayload: any = {
        ...payload,
        domain: payload['domain[0]'],
        domaintype: payload['domaintype[0]'],
      };

      if (payload['regperiod[0]'] != null) {
        legacyPayload.regperiod = payload['regperiod[0]'];
      }

      if (payload['eppcode[0]']) {
        legacyPayload.transfersecret = payload['eppcode[0]'];
      }

      delete legacyPayload['domain[0]'];
      delete legacyPayload['domaintype[0]'];
      delete legacyPayload['regperiod[0]'];
      delete legacyPayload['eppcode[0]'];
      delete legacyPayload['dnsmanagement[0]'];
      delete legacyPayload['emailforwarding[0]'];
      delete legacyPayload['idprotection[0]'];

      return legacyPayload;
    };

    const domainPayloadStrategy = String(process.env.WHMCS_ADDORDER_DOMAIN_FORMAT || 'array')
      .trim()
      .toLowerCase();
    const preferLegacy = domainPayloadStrategy === 'legacy';

    const primaryOrderData = preferLegacy ? toLegacyDomainPayload(orderData) : orderData;
    const fallbackOrderData = preferLegacy ? orderData : toLegacyDomainPayload(orderData);

    let response: any;
    try {
      response = await whmcsApi('AddOrder', primaryOrderData);
    } catch (addOrderError: any) {
      const errorMsg = String(addOrderError?.message || '').toLowerCase();
      const canRetryWithLegacyDomainFormat =
        Boolean(domain) &&
        Boolean(orderData['domain[0]']) &&
        (String(addOrderError?.response?.status || '') === '500' ||
          errorMsg.includes('status code 500') ||
          errorMsg.includes('invalid tld') ||
          errorMsg.includes('domain'));

      if (!canRetryWithLegacyDomainFormat) {
        throw addOrderError;
      }

      const retryLabel = preferLegacy ? 'array' : 'legacy';
      console.warn(`[Hosting Order] AddOrder primary format failed. Retrying with ${retryLabel} domain format.`);
      response = await whmcsApi('AddOrder', fallbackOrderData);
    }

    console.log('[Hosting Order] AddOrder response:', JSON.stringify({
      result: response.result,
      orderid: response.orderid,
      invoiceid: response.invoiceid,
      productids: response.productids,
      domainids: response.domainids,
      message: response.message,
    }));

    if (response.result !== 'success') {
      return {
        success: false,
        error: response.message || 'Failed to create order in WHMCS',
      };
    }

    const orderId = parseInt(String(response.orderid || ''), 10);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      return {
        success: false,
        error: 'WHMCS did not return a valid order ID',
      };
    }

    const hasCreatedItems = [
      response.productids,
      response.serviceids,
      response.addonids,
      response.domainids,
    ].some((value) => String(value || '').trim() !== '');

    if (!hasCreatedItems) {
      // Best-effort cleanup: WHMCS reported success but created an empty order.
      await whmcsApi('DeleteOrder', {
        orderid: orderId,
        deleteinvoice: true,
      });

      return {
        success: false,
        error:
          response.message ||
          `WHMCS created an empty order for product ${productId}. Check product setup and billing cycle availability in WHMCS.`,
      };
    }

    const parsedInvoiceId = parseInt(String(response.invoiceid || ''), 10);
    let invoiceId =
      Number.isFinite(parsedInvoiceId) && parsedInvoiceId > 0
        ? parsedInvoiceId
        : undefined;

    // NOTE: We do NOT call AcceptOrder here because it would activate the
    // hosting service before payment is confirmed. AcceptOrder should only
    // be called after successful payment in the Stripe webhook handler.
    // Instead, we try to resolve the invoice ID through other means.

    if (!invoiceId && orderId) {
      try {
        const invoicesResponse = await whmcsApi('GetInvoices', {
          userid: user.userId,
          limitnum: 20,
          orderby: 'id',
          order: 'DESC',
        });

        if (invoicesResponse.result === 'success' && invoicesResponse.invoices?.invoice) {
          const invoices = invoicesResponse.invoices.invoice;
          const invoiceList = Array.isArray(invoices) ? invoices : [invoices];
          const matchingInvoice = invoiceList.find((inv: any) => String(inv.orderid || '') === String(orderId));

          const matchedId = parseInt(String(matchingInvoice?.id || ''), 10);
          if (Number.isFinite(matchedId) && matchedId > 0) {
            invoiceId = matchedId;
          }
        }
      } catch (invoiceLookupError: any) {
        console.warn('[Hosting Order] GetInvoices invoice lookup failed:', invoiceLookupError?.message || invoiceLookupError);
      }
    }

    if (!invoiceId && orderId) {
      try {
        const orderLookup = await whmcsApi('GetOrders', { id: orderId, limitnum: 1 });
        const orderData = Array.isArray(orderLookup.orders?.order)
          ? orderLookup.orders.order[0]
          : orderLookup.orders?.order;

        const orderInvoiceId = parseInt(String(orderData?.invoiceid || ''), 10);
        if (Number.isFinite(orderInvoiceId) && orderInvoiceId > 0) {
          invoiceId = orderInvoiceId;
        }

        const orderAmount = parseFloat(String(orderData?.amount || '0'));
        if (!invoiceId && Number.isFinite(orderAmount) && orderAmount > 0) {
          const fallbackInvoice = await whmcsApi('CreateInvoice', {
            userid: user.userId,
            status: 'Unpaid',
            sendinvoice: true,
            paymentmethod: process.env.WHMCS_ORDER_PAYMENT_METHOD || 'stripe',
            itemdescription: [
              `Hosting Order - ${String(productResult.data.name || 'Hosting')} ${domain ? `(${domain})` : ''}`,
            ],
            itemamount: [orderAmount],
            itemtaxed: [true],
          });

          const fallbackInvoiceId = parseInt(String(fallbackInvoice?.invoiceid || ''), 10);
          if (Number.isFinite(fallbackInvoiceId) && fallbackInvoiceId > 0) {
            invoiceId = fallbackInvoiceId;
          }
        }
      } catch (fallbackInvoiceError: any) {
        console.warn('[Hosting Order] Fallback CreateInvoice failed:', fallbackInvoiceError?.message || fallbackInvoiceError);
      }
    }

    const serviceId = response.productids
      ? parseInt(String(response.productids).split(',')[0])
      : undefined;

    // For owndomain, patch domain onto service + add domain line item to invoice
    if (isOwnDomain && domain && serviceId) {
      try {
        await whmcsApi('UpdateClientProduct', {
          serviceid: serviceId,
          domain: domain,
        });
        console.log('[Hosting Order] Set domain on service', serviceId, '→', domain);
      } catch (e: any) {
        console.warn('[Hosting Order] UpdateClientProduct failed:', e?.message || e);
      }

      if (invoiceId) {
        try {
          await whmcsApi('UpdateInvoice', {
            invoiceid: invoiceId,
            'newitemdescription[0]': `Domain: ${domain} (own domain)`,
            'newitemamount[0]': 0,
            'newitemtaxed[0]': false,
          });
          console.log('[Hosting Order] Added domain line item to invoice', invoiceId);
        } catch (e: any) {
          console.warn('[Hosting Order] Invoice patch failed:', e?.message || e);
        }
      }
    }

    // Sync to MongoDB for tracking
    const ordersCollection = await getHostingOrdersCollection();
    const now = new Date();

    await ordersCollection.insertOne({
      whmcsOrderId: orderId,
      whmcsInvoiceId: invoiceId ?? 0,
      whmcsServiceId: serviceId,
      clientId: user.userId,
      clientEmail: user.email,
      productId,
      productName: productResult.data.name,
      billingCycle,
      domain,
      addons: addons.map((a) => ({ id: a.id, name: a.name, price: a.price })),
      basePrice: priceResult.data.basePrice,
      totalPrice: priceResult.data.total,
      status: 'Pending',
      createdAt: now,
    });

    // Sync invoice to MongoDB only if WHMCS returned a concrete invoice id.
    // NOTE: Domain invoice line items are fully controlled by WHMCS AddOrder logic.
    // Do not append domain items from the app side (causes duplicate charges).
    if (invoiceId) {
      // Update invoice with checkout-calculated tax rate for VAT consistency
      // This ensures the invoice displays the same tax as shown at checkout
      const checkoutTaxRate = apiOptions?.checkoutTaxRate;
      const checkoutTaxAmount = apiOptions?.checkoutTaxAmount;
      
      if (typeof checkoutTaxRate === 'number' && checkoutTaxRate >= 0) {
        try {
          // Set the tax rate to match checkout calculation
          // WHMCS will recalculate tax based on invoice subtotal
          await whmcsApi('UpdateInvoice', {
            invoiceid: invoiceId,
            taxrate: checkoutTaxRate.toFixed(2),
            taxrate2: '0.00',
          });
          
          // Fetch the updated invoice to verify tax amount
          const updatedInvoice = await whmcsApi('GetInvoice', { invoiceid: invoiceId });
          
          // If the calculated tax differs from checkout tax, adjust via line item
          // This handles cases where WHMCS subtotal differs from checkout subtotal
          if (updatedInvoice.result === 'success' && typeof checkoutTaxAmount === 'number') {
            const invoiceTax = parseFloat(updatedInvoice.tax || '0');
            const taxDifference = Math.abs(invoiceTax - checkoutTaxAmount);
            
            // If tax difference is significant (more than 0.01), we need to adjust
            if (taxDifference > 0.01) {
              console.log('[Hosting Order] Tax adjustment needed. WHMCS tax:', invoiceTax, 'Checkout tax:', checkoutTaxAmount);
              
              // Get the invoice items
              const items = updatedInvoice.items?.item;
              const itemArray = Array.isArray(items) ? items : items ? [items] : [];
              
              if (itemArray.length > 0) {
                if (checkoutTaxAmount < invoiceTax) {
                  // WHMCS charged more tax - add a discount line item for the difference
                  const taxOvercharge = invoiceTax - checkoutTaxAmount;
                  await whmcsApi('UpdateInvoice', {
                    invoiceid: invoiceId,
                    'newitemdescription[0]': 'Tax Adjustment (VAT Correction)',
                    'newitemamount[0]': -taxOvercharge,
                    'newitemtaxed[0]': false,
                  });
                  console.log('[Hosting Order] Added tax adjustment line item: -', taxOvercharge);
                }
              }
            }
          }
        } catch (e) {
          console.error('[Hosting Order] Failed to update invoice tax:', e);
        }
      } else {
        // No checkout tax rate provided, just reset taxrate2
        try {
          await whmcsApi('UpdateInvoice', {
            invoiceid: invoiceId,
            taxrate2: '0.00',
          });
        } catch (e) {
          console.error('[Order] Failed to reset taxrate2:', e);
        }
      }

      const invoicesCollection = await getInvoicesCollection();
      await syncInvoiceToMongoDB(invoiceId, user.userId, invoicesCollection);
    }

    // Create pending email service for this hosting order
    if (serviceId && domain) {
      await createEmailServiceAction({
        whmcsServiceId: serviceId,
        clientId: user.userId,
        domain: domain,
        plan: 'free', // Default to free tier
      });
    }

    // Set user's default currency after successful order (locks currency)
    try {
      const { setUserDefaultCurrency } = await import('@/actions/currency-actions');
      await setUserDefaultCurrency(selectedCurrency);
    } catch (currencyLockError) {
      console.warn('[Order] Failed to set default currency:', currencyLockError);
      // Don't fail the order if currency locking fails
    }

    // Revalidate billing and services pages to show new order
    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/dashboard/billing', 'page');
      revalidatePath('/dashboard/services', 'page');
    } catch (revalidateError) {
      console.warn('[Order] Failed to revalidate paths (likely running in background/script):', revalidateError);
    }

    return {
      success: true,
      orderId,
      invoiceId,
      message: 'Order created successfully!',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An error occurred while creating order',
    };
  }
}

/**
 * Delete a WHMCS order (best-effort rollback for failed multi-item checkout flows).
 * WHMCS requires orders to be in Cancelled or Fraud status before deletion.
 */
export async function deleteHostingOrderAction(orderId: number) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Not logged in' };
    }

    // Step 1: Cancel the order first (WHMCS requirement)
    const cancelResponse = await whmcsApi('CancelOrder', {
      orderid: orderId,
    });

    if (cancelResponse.result !== 'success') {
      return {
        success: false,
        error: cancelResponse.message || 'Failed to cancel order in WHMCS',
      };
    }

    // Step 2: Now delete the cancelled order
    const deleteResponse = await whmcsApi('DeleteOrder', {
      orderid: orderId,
      deleteinvoice: true,
    });

    if (deleteResponse.result !== 'success') {
      return {
        success: false,
        error: deleteResponse.message || 'Failed to delete order in WHMCS',
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to rollback order',
    };
  }
}

/**
 * Generate invoice for the current client's pending orders.
 * Uses GenInvoices API.
 */
export async function generateInvoiceAction() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Not logged in' };
    }

    // GenInvoices has a known WHMCS SQL bug (Unknown column 'invoiceid' in tblhosting).
    // Instead, fetch the latest unpaid invoice for this client via GetInvoices.
    const response = await whmcsApi('GetInvoices', {
      userid: user.userId,
      status: 'Unpaid',
      limitnum: 1,
      orderby: 'id',
      order: 'DESC',
    });

    if (response.result === 'success' && response.invoices?.invoice) {
      const invoices = response.invoices.invoice;
      const invoiceList = Array.isArray(invoices) ? invoices : [invoices];
      const latest = invoiceList[0];
      const latestId = parseInt(String(latest?.id || '0'), 10);

      if (!Number.isFinite(latestId) || latestId <= 0) {
        return { success: false, error: 'No unpaid invoice found' };
      }

      try {
        await whmcsApi('UpdateInvoice', {
          invoiceid: latestId,
          taxrate2: '0.00',
        });
      } catch (e) {
        console.error('[Invoice Gen] Failed to reset taxrate2:', e);
      }

      return { success: true, invoiceId: latestId };
    }

    return { success: false, error: response.message || 'No unpaid invoice found' };
  } catch (e: any) {
    console.error('[GenerateInvoice] Exception:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Get shared hosting plans for home page pricing section.
 * Pricing comes from WHMCS; text content can be overridden by Tina translations.
 */
export async function getSharedHostingPlansForHomeAction(
  currencyCode: string = 'USD',
  locale?: string
) {
  try {

    const { HOSTING_PLANS } = await import('@/lib/config/hosting-plans');
    const { getProductsByGroupAndCurrency } = await import('@/lib/whmcs');

    const sharedGid = parseInt(HOSTING_PLANS.shared.gid || '0', 10);

    if (!sharedGid) {
      return { success: false, data: null };
    }

    const productsResult = await getProductsByGroupAndCurrency(
      sharedGid,
      currencyCode
    );


    if (!productsResult.success || !productsResult.data?.length) {
      return { success: false, data: null };
    }

    const products = productsResult.data;

    const sharedPlans = products
      .slice(0, 4) // Get first 4 plans from group
      .map((product: any, index: number) => {

        // Get pricing for the requested currency
        const pricing =
          product.pricing?.[currencyCode] ||
          product.pricing?.USD ||
          product.pricing ||
          {};
        const monthlyPrice = parseFloat(pricing.monthly || '0');
        const yearlyPrice = parseFloat(pricing.annually || '0');
        const features = parseFeatures(product.description || product.name, true);

        // Default features if none found in description
        const defaultFeatures = [
          'Free SSL Certificate',
          'cPanel Control Panel',
          '1-Click App Installs',
          'LiteSpeed Cache Optimization',
          '99.9% Uptime Guarantee',
          'Unlimited Bandwidth',
          'Fast NVMe Storage',
          'Free Website Migration',
        ];

        // Get currency symbol
        const currencySymbols: Record<string, string> = {
          USD: '$',
          EUR: '€',
          GBP: '£',
          SEK: 'kr',
        };
        const symbol = currencySymbols[currencyCode] || '$';
        const prefix = currencyCode === 'SEK' ? '' : symbol;
        const suffix = currencyCode === 'SEK' ? ` ${symbol}` : '';

        const planId = parseInt(product.pid || product.id);

        // Calculate effective monthly price from annual (annual / 12 is often better rate)
        const effectiveMonthlyPrice = yearlyPrice > 0 ? yearlyPrice / 12 : monthlyPrice;
        const displayPrice = effectiveMonthlyPrice > 0 ? effectiveMonthlyPrice : monthlyPrice;

        return {
          id: planId,
          name:
            product.name ||
            `${index === 0 ? 'Starter' : index === 1 ? 'Premium' : 'Business'} Plan`,
          // Only from WHMCS – no hardcoded fallback; add Product Description/Tagline in WHMCS for each plan
          tagline: product.tagline || product.description?.split('\n')[0] || '',
          description: product.description?.split('\n')[0] || '',
          price:
            displayPrice > 0
              ? formatCurrencyWithSymbol(displayPrice, currencyCode)
              : 'Price unavailable',
          // Raw annual total for cart use — do NOT use plan.price (it's per-month display)
          rawAnnualPrice: yearlyPrice > 0 ? yearlyPrice : monthlyPrice,
          unit: '/mo',
          yearly:
            yearlyPrice > 0
              ? `${formatCurrencyWithSymbol(yearlyPrice, currencyCode)} yearly`
              : '',
          orLabel: 'or',
          features:
            features.length > 0
              ? features.slice(0, 8)
              : defaultFeatures.slice(0, 4 + index * 2),
          highlight: index === 1, // Middle plan is highlighted
        };
      });

    const withTina = await applyTinaTranslations(
      sharedPlans,
      'shared',
      locale
    );
    return {
      success: true,
      data: withTina.length > 0 ? withTina : null,
    };
  } catch (error: any) {
    return { success: false, data: null };
  }
}

/**
 * Parse features from WHMCS Product Description.
 * WHMCS allows HTML (e.g. <br />, <strong>, <em>). We split by line-breaks and strip tags.
 * @param skipFirstLine - when true, first line is excluded (use it as tagline above, list from 2nd line onwards)
 */
function parseFeatures(description: string, skipFirstLine = false): string[] {
  if (!description) return [];

  // Normalize HTML line breaks to newlines, then split into lines
  const withNewlines = description
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n');
  const lines = withNewlines.split('\n');
  const linesForFeatures = skipFirstLine ? lines.slice(1) : lines;

  const features = linesForFeatures
    .map((line) => line.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  return features.slice(0, 10); // Max 10 features
}

/**
 * Get WordPress hosting plans.
 * Pricing comes from WHMCS; text content can be overridden by Tina translations.
 */
export async function getWordPressPlansAction(
  currencyCode: string = 'USD',
  locale?: string
) {
  try {
    const { HOSTING_PLANS } = await import('@/lib/config/hosting-plans');
    const { getCurrencySymbol } = await import('@/lib/currency-utils');
    const { getProductsByGroupAndCurrency } = await import('@/lib/whmcs');

    const wpGid = parseInt(HOSTING_PLANS.wordpress.gid || '0', 10);
    if (!wpGid) {
      return {
        success: false,
        data: null,
        error: 'No configured WordPress hosting group ID (NEXT_PUBLIC_WORDPRESS_HOSTING_GID)',
      };
    }

    const productsResult = await getProductsByGroupAndCurrency(
      wpGid,
      currencyCode
    );

    if (!productsResult.success || !productsResult.data?.length) {
      return { success: false, data: null };
    }

    const currencySymbol = getCurrencySymbol(currencyCode);

    const wpPlans = productsResult.data.map((product: any, index: number) => {
      const pricing =
        product.pricing?.[currencyCode] ||
        product.pricing?.USD ||
        product.pricing ||
        {};
      const monthlyPrice = parseFloat(pricing.monthly || '0');
      const yearlyPrice = parseFloat(pricing.annually || '0');
      const features = parseFeatures(product.description);

      // Calculate effective monthly price from annual (annual / 12 is often better rate)
      const effectiveMonthlyPrice = yearlyPrice > 0 ? yearlyPrice / 12 : monthlyPrice;
      const displayPrice = effectiveMonthlyPrice > 0 ? effectiveMonthlyPrice : monthlyPrice;

      return {
        id: parseInt(product.pid),
        name: product.name,
        tagline: product.tagline || '',
        description:
          product.description?.split('\n')[0] || 'Managed WordPress Hosting',
        price:
          displayPrice > 0
            ? formatCurrencyWithSymbol(displayPrice, currencyCode)
            : 'Price unavailable',
        unit: '/mo',
        yearly:
          yearlyPrice > 0
            ? `${formatCurrencyWithSymbol(yearlyPrice, currencyCode)} yearly`
            : '',
        orLabel: 'or',
        features: features.length > 0 ? features.slice(0, 8) : [],
        highlight: index === 1, // Middle plan highlighted
      };
    });

    wpPlans.sort((a: any, b: any) => {
      const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ''));
      const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ''));
      return priceA - priceB;
    });

    const withTina = await applyTinaTranslations(
      wpPlans,
      'wordpress',
      locale
    );
    return { success: true, data: withTina };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get VPS hosting plans.
 * Pricing comes from WHMCS; text content can be overridden by Tina translations.
 */
export async function getVpsPlansAction(
  currencyCode: string = 'USD',
  locale?: string
) {
  try {
    const { HOSTING_PLANS } = await import('@/lib/config/hosting-plans');
    const { getCurrencySymbol } = await import('@/lib/currency-utils');
    const { getProductsByGroupAndCurrency } = await import('@/lib/whmcs');

    const vpsGid = parseInt(HOSTING_PLANS.vps.gid || '0', 10);
    if (!vpsGid) {
      return {
        success: false,
        data: null,
        error: 'No configured VPS hosting group ID (NEXT_PUBLIC_VPS_HOSTING_GID)',
      };
    }

    const productsResult = await getProductsByGroupAndCurrency(
      vpsGid,
      currencyCode
    );

    if (!productsResult.success || !productsResult.data?.length) {
      return { success: false, data: null };
    }

    const currencySymbol = getCurrencySymbol(currencyCode);

    const vpsPlans = productsResult.data.map((product: any, index: number) => {
      const pricing =
        product.pricing?.[currencyCode] ||
        product.pricing?.USD ||
        product.pricing ||
        {};
      const monthlyPrice = parseFloat(pricing.monthly || '0');
      const yearlyPrice = parseFloat(pricing.annually || '0');
      const features = parseFeatures(product.description);

      // Calculate effective monthly price from annual (annual / 12 is often better rate)
      const effectiveMonthlyPrice = yearlyPrice > 0 ? yearlyPrice / 12 : monthlyPrice;
      const displayPrice = effectiveMonthlyPrice > 0 ? effectiveMonthlyPrice : monthlyPrice;

      return {
        id: parseInt(product.pid),
        name: product.name,
        tagline: product.tagline || '',
        description:
          product.description?.split('\n')[0] || 'VPS Hosting',
        price:
          displayPrice > 0
            ? formatCurrencyWithSymbol(displayPrice, currencyCode)
            : 'Price unavailable',
        unit: '/mo',
        yearly:
          yearlyPrice > 0
            ? `${formatCurrencyWithSymbol(yearlyPrice, currencyCode)} yearly`
            : '',
        orLabel: 'or',
        features: features.length > 0 ? features.slice(0, 8) : [],
        highlight: index === 1,
      };
    });

    vpsPlans.sort((a: any, b: any) => {
      const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ''));
      const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ''));
      return priceA - priceB;
    });

    const withTina = await applyTinaTranslations(vpsPlans, 'vps', locale);
    return { success: true, data: withTina };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get E-commerce hosting plans.
 * Pricing comes from WHMCS; text content can be overridden by Tina translations.
 */
export async function getEcommercePlansAction(
  currencyCode: string = 'USD',
  locale?: string
) {
  try {
    const { HOSTING_PLANS } = await import('@/lib/config/hosting-plans');
    const { getCurrencySymbol } = await import('@/lib/currency-utils');
    const { getProductsByGroupAndCurrency } = await import('@/lib/whmcs');

    const ecommerceGid = parseInt(HOSTING_PLANS.ecommerce.gid || '0', 10);
    if (!ecommerceGid) {
      return {
        success: false,
        data: null,
        error: 'No configured E-commerce hosting group ID (NEXT_PUBLIC_ECOMMERCE_HOSTING_GID)',
      };
    }

    const productsResult = await getProductsByGroupAndCurrency(
      ecommerceGid,
      currencyCode
    );

    if (!productsResult.success || !productsResult.data?.length) {
      return { success: false, data: null };
    }

    const currencySymbol = getCurrencySymbol(currencyCode);

    const ecommercePlans = productsResult.data.map((product: any, index: number) => {
      const pricing =
        product.pricing?.[currencyCode] ||
        product.pricing?.USD ||
        product.pricing ||
        {};
      const monthlyPrice = parseFloat(pricing.monthly || '0');
      const yearlyPrice = parseFloat(pricing.annually || '0');
      const features = parseFeatures(product.description);

      // Calculate effective monthly price from annual (annual / 12 is often better rate)
      const effectiveMonthlyPrice = yearlyPrice > 0 ? yearlyPrice / 12 : monthlyPrice;
      const displayPrice = effectiveMonthlyPrice > 0 ? effectiveMonthlyPrice : monthlyPrice;

      return {
        id: parseInt(product.pid),
        name: product.name,
        tagline: product.tagline || '',
        description:
          product.description?.split('\n')[0] || 'E-commerce Hosting',
        price:
          displayPrice > 0
            ? formatCurrencyWithSymbol(displayPrice, currencyCode)
            : 'Price unavailable',
        unit: '/mo',
        yearly:
          yearlyPrice > 0
            ? `${formatCurrencyWithSymbol(yearlyPrice, currencyCode)} yearly`
            : '',
        orLabel: 'or',
        features: features.length > 0 ? features.slice(0, 8) : [],
        highlight: index === 1,
      };
    });

    ecommercePlans.sort((a: any, b: any) => {
      const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ''));
      const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ''));
      return priceA - priceB;
    });

    const withTina = await applyTinaTranslations(
      ecommercePlans,
      'ecommerce',
      locale
    );
    return { success: true, data: withTina };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function applyTinaTranslations(
  plans: any[],
  groupKey: 'shared' | 'wordpress' | 'vps' | 'ecommerce',
  locale?: string
) {
  if (!locale) return plans;
  const { getTinaTranslationMap } = await import('@/lib/product-plans-tina');
  const map = await getTinaTranslationMap(groupKey, locale);
  return plans.map((plan) => {
    const t = map.get(Number(plan.id));
    if (!t) return plan;
    return {
      ...plan,
      name: t.name || plan.name,
      tagline: t.tagline ?? plan.tagline,
      description: t.description ?? plan.description,
      features: t.features?.length ? t.features : plan.features,
    };
  });
}

/**
 * Get tax rates for a specific country/state
 * @param country - Country code (e.g., 'SE', 'DE', 'FR')
 * @param state - State code (optional, for US/CA)
 */
export async function getTaxRatesAction(country?: string, state?: string) {
  try {
    const { getTaxRates } = await import('@/lib/whmcs');
    const result = await getTaxRates(country, state);
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: { taxrate: 0, taxrate2: 0, taxname: 'VAT', taxname2: '' },
    };
  }
}

/**
 * Fetch promotional products with dynamic currency for client-side use
 */
export async function getPromotionalProductsAction(currencyCode: string = 'EUR') {
  try {
    const { getPromotionalProducts } = await import('@/lib/whmcs-promotions');
    const promotions = await getPromotionalProducts(currencyCode);

    return {
      success: true,
      data: promotions
    };
  } catch (error: any) {
    console.error('Error fetching promotional products from action:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch promotional products',
      data: []
    };
  }
}

/**
 * Fetch all order-page products with a specific currency for client-side use
 */
export async function getOrderProductsForCurrencyAction(currencyCode: string = 'USD') {
  'use server';
  try {
    const { getProductsByGroupAndCurrency } = await import('@/lib/whmcs');

    const GID_LIST = [
      parseInt(process.env.NEXT_PUBLIC_SHARED_HOSTING_GID || '1'),
      parseInt(process.env.NEXT_PUBLIC_VPS_HOSTING_GID || '2'),
      parseInt(process.env.NEXT_PUBLIC_WORDPRESS_HOSTING_GID || '3'),
      parseInt(process.env.NEXT_PUBLIC_ECOMMERCE_HOSTING_GID || '4'),
      parseInt(process.env.NEXT_PUBLIC_EMAIL_SERVICE_GID || '7'),
    ];

    // Fetch all groups in parallel
    const results = await Promise.all(
      GID_LIST.map(gid => getProductsByGroupAndCurrency(gid, currencyCode))
    );

    // Merge all products indexed by pid → currency pricing
    const pricingByCurrencyByPid: Record<number, any> = {};
    results.forEach(result => {
      if (result.success && result.data) {
        result.data.forEach((product: any) => {
          pricingByCurrencyByPid[product.pid] = product.pricing?.[currencyCode] || product.pricing?.[Object.keys(product.pricing || {})[0]] || {};
        });
      }
    });

    return {
      success: true,
      data: pricingByCurrencyByPid,
    };
  } catch (error: any) {
    console.error('Error fetching order products for currency:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch products',
      data: {},
    };
  }
}

/**
 * Validate a promo code against WHMCS and return discount details.
 * Uses the GetPromotions API to fetch all active promotions and find a match.
 */
export async function validatePromoCodeAction(code: string, productId?: number, billingCycle?: string) {
  'use server';
  try {
    const trimmedCode = (code || '').trim().toLowerCase();
    if (!trimmedCode) {
      return { success: false, error: 'Please enter a promo code' };
    }

    const response = await whmcsApi('GetPromotions', {});

    if (response.result !== 'success') {
      return { success: false, error: 'Unable to validate promo code at this time' };
    }

    const promotions = response.promotions?.promotion;
    if (!promotions) {
      return { success: false, error: 'Invalid promo code' };
    }

    const list = Array.isArray(promotions) ? promotions : [promotions];

    // Find the promotion matching the entered code (case-insensitive)
    const promo = list.find((p: any) =>
      (p.code || '').toLowerCase() === trimmedCode
    );

    if (!promo) {
      return { success: false, error: 'Invalid promo code' };
    }

    // Check if expired
    if (promo.expirationdate) {
      const expiry = new Date(promo.expirationdate);
      if (!isNaN(expiry.getTime()) && expiry < new Date()) {
        return { success: false, error: 'This promo code has expired' };
      }
    }

    // Check uses limit
    if (promo.maxuses && parseInt(promo.maxuses) > 0) {
      if (parseInt(promo.uses || '0') >= parseInt(promo.maxuses)) {
        return { success: false, error: 'This promo code has reached its usage limit' };
      }
    }

    // Check if product matches (if applies_to is set)
    if (productId && promo.appliesto && String(promo.appliesto).trim() !== '') {
      const appliesToIds = String(promo.appliesto).split(',').map((s: string) => s.trim());
      if (appliesToIds.length > 0 && !appliesToIds.includes(String(productId))) {
        return { success: false, error: 'This promo code is not applicable to the selected product' };
      }
    }

    // Check billing cycle restriction
    if (billingCycle && promo.cycles && String(promo.cycles).trim() !== '') {
      const allowedCycles = String(promo.cycles).split(',').map((s: string) => s.trim().toLowerCase());
      if (allowedCycles.length > 0 && !allowedCycles.includes(billingCycle.toLowerCase())) {
        return { success: false, error: `This promo code is only valid for: ${promo.cycles}` };
      }
    }

    const discountPercent = parseFloat(promo.value || '0');
    const discountType: 'percentage' | 'fixed' = (promo.type || '').toLowerCase() === 'percentage' ? 'percentage' : 'fixed';

    return {
      success: true,
      data: {
        code: promo.code,
        type: discountType,
        value: discountPercent,
        // For 'percentage' type, this is the % off. For 'fixed', it's the fixed amount off.
        discountPercent: discountType === 'percentage' ? discountPercent : 0,
        discountFixed: discountType === 'fixed' ? discountPercent : 0,
        description: `${discountType === 'percentage' ? `${discountPercent}%` : discountPercent} OFF`,
      }
    };
  } catch (error: any) {
    console.error('[validatePromoCodeAction] Error:', error.message);
    return { success: false, error: 'Unable to validate promo code. Please try again.' };
  }
}

