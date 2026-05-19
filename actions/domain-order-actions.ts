'use server';

import { getCurrencies, whmcsApi } from '@/lib/whmcs';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// Schema for domain order
const domainOrderSchema = z.object({
  domain: z.string().min(3, 'Domain name is required'),
  regperiod: z.number().min(1).max(10).default(1),
});

// Get user ID from session
async function getUserId() {
  const cookieStore = cookies();
  const session = (await cookieStore).get('session')?.value;

  if (!session) {
    return null; // Return null instead of throwing, for better handling
  }

  try {
    const { payload } = await jwtVerify(session, JWT_SECRET);
    return payload.userId as string | number;
  } catch (error) {
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
      console.warn('[Domain Order] Failed to update client location:', response.message);
    }
  } catch (e) {
    console.warn('[Domain Order] Error updating client location:', e);
  }
  return { success: true };
}

/**
 * Get current user from JWT session
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return null;
    }

    const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET);
    return payload as { userId: number; email: string; name?: string };
  } catch {
    return null;
  }
}

/**
 * Check domain availability using WHMCS API
 */
export async function checkDomainAvailabilityAction(domain: string) {
  try {

    // Try Spaceship API first, fall back to WHMCS on any error
    try {
      const { spaceshipApi } = await import('@/lib/spaceship');
      const spaceshipResponse = await spaceshipApi.checkAvailability(domain);

      if (spaceshipResponse && spaceshipResponse.domains && spaceshipResponse.domains.length > 0) {
        const result = spaceshipResponse.domains[0];

        // Map Spaceship status to WHMCS-like format
        const status = result.result === 'available' ? 'available' : 'unavailable';

        return {
          success: true,
          data: {
            status: status,
            premiumPricing: result.premiumPricing || null,
          }
        };
      }
    } catch (e) {
      console.warn('Spaceship check failed, falling back to WHMCS:', e);
      // Continue to WHMCS fallback
    }

    const response = await whmcsApi('DomainWhois', {
      domain,
    });

    return {
      success: true,
      data: response,
    };
  } catch (error: any) {
    console.error('Domain availability check failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get TLD pricing from WHMCS
 */
export async function getTLDPricingAction(currencyCode: string) {
  try {
    const requestedCurrency = (currencyCode || '').trim().toUpperCase();

    if (!requestedCurrency) {
      return {
        success: false,
        error: 'Currency code is required for TLD pricing',
      };
    }

    const currenciesResponse = await getCurrencies();
    if (!currenciesResponse.success || !Array.isArray(currenciesResponse.data)) {
      return {
        success: false,
        error: 'Failed to load currencies from WHMCS',
      };
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

    const response = await whmcsApi('GetTLDPricing', {
      currencyid: currencyId,
    });

    if (response.result === 'success' && response.pricing) {
      return {
        success: true,
        data: response.pricing,
        currency: selectedCurrency,
      };
    }

    console.error('❌ Failed to fetch TLD pricing, response:', response);
    return {
      success: false,
      error: 'Failed to fetch pricing',
    };
  } catch (error: any) {
    console.error('❌ TLD pricing error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch pricing',
    };
  }
}

/**
 * Add domain registration to cart
 */
export async function addDomainRegistrationAction(
  domain: string,
  options: {
    years?: number;
    dnsmanagement?: boolean;
    emailforwarding?: boolean;
    idprotection?: boolean;
    promo_code?: string;
  } = {}
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Please login to add domain to cart',
      };
    }

    const orderData: any = {
      clientid: userId,
      domain: domain,
      domaintype: 'register',
      regperiod: options.years || 1,
      dnsmanagement: options.dnsmanagement ? 1 : 0,
      emailforwarding: options.emailforwarding ? 1 : 0,
      idprotection: options.idprotection ? 1 : 0,
    };

    if (options.promo_code && options.promo_code.trim() !== '') {
      orderData.promocode = options.promo_code.trim();
    }

    const response = await whmcsApi('addorder', orderData);

    if (response.result === 'success') {
      revalidatePath('/cart');
      return {
        success: true,
        data: response,
        message: 'Domain added to cart successfully',
      };
    }

    return {
      success: false,
      error: response.message || 'Failed to add domain to cart',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Add domain transfer to cart
 */
export async function addDomainTransferAction(
  domain: string,
  eppCode: string,
  options: {
    years?: number;
    dnsmanagement?: boolean;
    emailforwarding?: boolean;
    idprotection?: boolean;
    promo_code?: string;
  } = {}
) {
  try {
    const eppValidation = validateEppCode(eppCode);
    if (!eppValidation.valid) {
      return {
        success: false,
        error: eppValidation.error,
      };
    }

    const userId = await getUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Please login to add domain transfer to cart',
      };
    }

    // First validate if transfer is possible (domain must be registered)
    const validation = await whmcsApi('DomainWhois', {
      domain,
    });

    // If domain is available, it means it's NOT registered, so cannot be transferred
    if (validation.status === 'available') {
      return {
        success: false,
        error: 'Domain transfer is not available for this domain',
      };
    }

    const orderData: any = {
      clientid: userId,
      domain: domain,
      domaintype: 'transfer',
      regperiod: options.years || 1,
      transfersecret: String(eppCode).trim(),
      dnsmanagement: options.dnsmanagement ? 1 : 0,
      emailforwarding: options.emailforwarding ? 1 : 0,
      idprotection: options.idprotection ? 1 : 0,
    };

    if (options.promo_code && options.promo_code.trim() !== '') {
      orderData.promocode = options.promo_code.trim();
    }

    const response = await whmcsApi('addorder', orderData);

    if (response.result === 'success') {
      revalidatePath('/cart');
      return {
        success: true,
        data: response,
        message: 'Domain transfer added to cart successfully',
      };
    }

    return {
      success: false,
      error: response.message || 'Failed to add domain transfer to cart',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get existing domain pricing from WHMCS
 */
export async function getExistingDomainPricingAction(
  domain: string,
  currencyCode: string
) {
  try {
    // Check WHMCS for domain status (optional, just to verify it exists)
    // We skip pricing from DomainLookup as it's invalid
    let domainCost = 0;
    let setupFee = 0;

    try {
      await whmcsApi('DomainWhois', { domain });
    } catch (e) {
      // Ignore error if validation fails, just proceed to check products
    }

    // Resolve pricing currency explicitly from WHMCS
    const requestedCurrency = (currencyCode || '').trim().toUpperCase();

    if (!requestedCurrency) {
      return {
        success: false,
        error: 'Currency code is required for existing domain pricing',
      };
    }

    const currenciesResponse = await getCurrencies();
    if (!currenciesResponse.success || !Array.isArray(currenciesResponse.data)) {
      return {
        success: false,
        error: 'Failed to load currencies from WHMCS',
      };
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

    // Also check if there are any domain-related products
    const productsResponse = await whmcsApi('getproducts', {
      gid: '1', // Domain products group
      currency: currencyId,
    });

    let domainSetupFee = 0;
    if (productsResponse && productsResponse.products) {
      const domainProducts = productsResponse.products.product || [];
      const existingDomainProduct = domainProducts.find((p: any) =>
        p.name.toLowerCase().includes('existing domain') ||
        p.name.toLowerCase().includes('domain setup')
      );

      if (existingDomainProduct && existingDomainProduct.pricing) {
        const pricingRoot = existingDomainProduct.pricing;
        const pricing =
          pricingRoot[requestedCurrency] && typeof pricingRoot[requestedCurrency] === 'object'
            ? pricingRoot[requestedCurrency]
            : pricingRoot;

        const pricingCycleOrder = [
          'onetime',
          'monthly',
          'quarterly',
          'semiannually',
          'annually',
          'biennially',
          'triennially',
        ];

        for (const cycle of pricingCycleOrder) {
          const rawPrice = pricing?.[cycle];
          const parsed = parseFloat(rawPrice);
          if (Number.isFinite(parsed) && parsed > 0) {
            domainSetupFee = parsed;
            break;
          }
        }
      }
    }

    return {
      success: true,
      data: {
        domain,
        domainCost,
        setupFee,
        domainSetupFee,
        totalCost: domainCost + setupFee + domainSetupFee,
        hasCost: (domainCost + setupFee + domainSetupFee) > 0,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Add existing domain to cart (for hosting orders)
 */
export async function addExistingDomainAction(domain: string) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Please login to add domain to cart',
      };
    }

    // Check if domain exists (optional validation)
    try {
      await whmcsApi('DomainWhois', { domain });
    } catch (e) {
      // Ignore
    }

    let domainCost = 0;
    // DomainWhois doesn't return price, so we rely on default behaviour or product configuration

    const response = await whmcsApi('addorder', {
      clientid: userId,
      domain: domain,
      domaintype: 'existing',
      // Add pricing if WHMCS supports it for existing domains
      ...(domainCost > 0 && { price: domainCost }),
    });

    if (response.result === 'success') {
      revalidatePath('/cart');
      return {
        success: true,
        data: response,
        message: 'Domain added to cart successfully',
      };
    }

    return {
      success: false,
      error: response.message || 'Failed to add domain to cart',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Calculate domain price for given domain and period
 */
export async function calculateDomainPrice(
  domain: string,
  years: number = 1,
  currencyCode?: string
) {
  try {
    const parts = domain.split('.');
    if (parts.length < 2) {
      return { success: false, error: 'Invalid domain format' };
    }

    const tld = '.' + parts[parts.length - 1];

    const requestedCurrency = (currencyCode || '').trim().toUpperCase();

    if (!requestedCurrency) {
      return { success: false, error: 'Currency code is required for domain pricing' };
    }

    const pricingResult = await getTLDPricingAction(requestedCurrency);

    if (!pricingResult.success || !pricingResult.data) {
      return {
        success: false,
        error:
          pricingResult.error ||
          'Unable to fetch pricing from WHMCS. Please try again later.',
      };
    }

    let tldPricing = pricingResult.data[tld] ||
      pricingResult.data[tld.toLowerCase()] ||
      pricingResult.data[tld.toUpperCase()] ||
      pricingResult.data[parts[parts.length - 1]] ||
      pricingResult.data[parts[parts.length - 1].toLowerCase()];

    if (!tldPricing) {
      return {
        success: false,
        error: `The TLD ${tld} is not configured in WHMCS. Please contact support.`,
      };
    }

    let registerPriceForYears = '0';

    if (tldPricing.register && tldPricing.register[years.toString()]) {
      registerPriceForYears = tldPricing.register[years.toString()];
    } else if (tldPricing[years.toString()]) {
      registerPriceForYears = tldPricing[years.toString()];
    }

    const registerPrice = parseFloat(registerPriceForYears);

    if (registerPrice <= 0 || isNaN(registerPrice)) {
      return {
        success: false,
        error: `Pricing for ${years} year(s) is not available for ${tld}.`,
      };
    }

    let icannFeePerYear = 0;
    if (tldPricing.addons && tldPricing.addons.icannfee) {
      icannFeePerYear = parseFloat(tldPricing.addons.icannfee) || 0;
    } else if (tldPricing.icannfee) {
      icannFeePerYear = parseFloat(tldPricing.icannfee) || 0;
    }

    const icannFee = icannFeePerYear * years;
    const totalPrice = registerPrice;
    const pricePerYear = registerPrice / years;
    const grandTotal = totalPrice + icannFee;

    return {
      success: true,
      data: {
        domain,
        tld,
        years,
        registerPrice,
        pricePerYear,
        icannFee,
        totalPrice,
        grandTotal,
        currency: pricingResult.currency,
      },
    };
  } catch (error: any) {
    console.error('Calculate domain price error:', error);
    return {
      success: false,
      error: error.message || 'Failed to calculate domain price',
    };
  }
}

/**
 * Check user login status
 */
export async function checkUserLoginStatus() {
  try {
    const userId = await getUserId();
    const user = await getCurrentUser();
    return {
      isLoggedIn: !!userId,
      userId: userId,
      userEmail: user?.email,
      userName: user?.name,
    };
  } catch (error: any) {
    return {
      isLoggedIn: false,
      userId: null,
      userEmail: undefined,
      userName: undefined,
    };
  }
}

/**
 * Get full user profile from WHMCS for GTM tracking
 */
export async function getUserFullProfile() {
  try {
    const userId = await getUserId();
    if (!userId) return null;

    const response = await whmcsApi('GetClientsDetails', {
      clientid: userId,
      stats: false,
    });

    if (response.result === 'success' && response.client) {
      return {
        phone: response.client.phonenumber || null,
        address1: response.client.address1 || null,
        city: response.client.city || null,
        state: response.client.state || null,
        country: response.client.country || null,
        postcode: response.client.postcode || null,
        company: response.client.companyname || null,
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Validate domain format
 */
export async function validateDomainFormat(domain: string): Promise<{ valid: boolean; error?: string }> {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;

  if (!domain || domain.length < 3) {
    return { valid: false, error: 'Domain must be at least 3 characters long' };
  }

  if (!domainRegex.test(domain)) {
    return { valid: false, error: 'Invalid domain format' };
  }

  if (domain.length > 253) {
    return { valid: false, error: 'Domain is too long' };
  }

  return { valid: true };
}

/**
 * Validate EPP/Auth code format for transfer requests
 * Registrar-level validity is still enforced by WHMCS/registrar after order placement.
 */
function validateEppCode(eppCode: string): { valid: boolean; error?: string } {
  const code = String(eppCode || '').trim();

  if (!code) {
    return { valid: false, error: 'EPP/Authorization code is required for transfer' };
  }

  // Common registrar auth-code constraints (length + visible characters)
  if (code.length < 4 || code.length > 255) {
    return { valid: false, error: 'Invalid EPP/Authorization code format' };
  }

  // Allow standard visible ASCII except spaces
  if (!/^[!-~]+$/.test(code)) {
    return { valid: false, error: 'Invalid EPP/Authorization code format' };
  }

  return { valid: true };
}

/**
 * Get domain suggestions
 */
export async function getDomainSuggestionsAction(baseDomain: string, tlds: string[] = ['.com', '.net', '.org', '.io', '.co']) {
  try {
    const suggestions = [];
    const baseName = baseDomain.split('.')[0];

    for (const tld of tlds) {
      const domainName = baseName + tld;
      const response = await whmcsApi('DomainLookup', {
        domain: domainName,
        search: 'domain',
      });

      if (response.status === 'available') {
        suggestions.push({
          domain: domainName,
          status: 'available',
          price: response.price || null,
        });
      }
    }

    return {
      success: true,
      data: suggestions,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create bulk domain order action for processing page
 */
export async function createBulkDomainOrderAction(bulkOrderData: any) {
  try {
    // Get current user from session
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        requiresLogin: true,
        error: 'Please login to complete your order',
      };
    }

    const { items, currency: bulkCurrency, domainType, country, state } = bulkOrderData;
    
    if (!items || items.length === 0) {
      return {
        success: false,
        error: 'No domains found in bulk order',
      };
    }

    const selectedCurrency = String(bulkCurrency || '').trim().toUpperCase();
    const currencySync = await syncClientCurrency(user.userId, selectedCurrency);
    if (!currencySync.success) {
      return {
        success: false,
        error: currencySync.error,
      };
    }

    // Update client location if provided for accurate tax calculation
    if (country) {
      await syncClientLocation(user.userId, country, state);
    }

    // Prepare WHMCS order parameters for multiple domains
    // WHMCS AddOrder API supports multiple domains in array format
    const whmcsOrderData: any = {
      clientid: user.userId,
      paymentmethod: 'stripe', // Hardcoded fix
      noinvoice: false, // Ensure invoice is created
      noemail: false,   // Send confirmation email
    };


    // Add each domain to the order using Promise.all to await native WHMCS pricing fetching
    await Promise.all(items.map(async (item: any, index: number) => {
      whmcsOrderData[`domain[${index}]`] = item.domain;
      whmcsOrderData[`domaintype[${index}]`] = domainType || 'register';
      whmcsOrderData[`regperiod[${index}]`] = item.regPeriod || 1;

      const hasDomainAddon = (addons: any, id: string) => {
        if (!addons) return false;
        if (Array.isArray(addons)) return addons.some(a => a.id === id || (id === 'idprotection' && a.id === 'idprotect'));
        return !!(addons[id] || (id === 'idprotection' && addons['idprotect']));
      };

      // Add domain addons ONLY if explicitly true. Omit completely if false.
      // Passing false/0 can trigger PHP isset() presence-checks in WHMCS API natively.
      if (hasDomainAddon(item.addons, 'dnsmanagement')) whmcsOrderData[`dnsmanagement[${index}]`] = true;
      if (hasDomainAddon(item.addons, 'emailforwarding')) whmcsOrderData[`emailforwarding[${index}]`] = true;
      if (hasDomainAddon(item.addons, 'idprotection')) whmcsOrderData[`idprotection[${index}]`] = true;

      // EXPLICIT FIX: Enforce the WHMCS pricing matrix for bulk domains natively, no custom prices from UI
      const whmcsPriceResult = await calculateDomainPrice(item.domain, item.regPeriod || 1, bulkOrderData.currency || 'USD');
      if (whmcsPriceResult.success && whmcsPriceResult.data) {
        whmcsOrderData[`domainprice[${index}]`] = whmcsPriceResult.data.totalPrice.toFixed(2);
      }

      // Add EPP code for transfers (also array format)
      if (domainType === 'transfer' && item.eppCode) {
        whmcsOrderData[`eppcode[${index}]`] = String(item.eppCode).trim();
      }
    }));

    // Add promo code if provided (apply to first domain)
    if (items[0]?.promoCode && items[0].promoCode.trim() !== '') {
      whmcsOrderData.promocode = items[0].promoCode.trim();
    }

    // Add bulk domain order to WHMCS
    const response = await whmcsApi('AddOrder', whmcsOrderData);

    if (response.result === 'success') {
      const orderId = parseInt(response.orderid);
      const rawInvoiceId = response.invoiceid;
      let invoiceId = rawInvoiceId ? parseInt(rawInvoiceId) : null;

      // If no invoice was created automatically, generate one manually
      if (!invoiceId) {
        try {
          // Try CreateInvoice with userid instead of clientid
          const invoiceResponse = await whmcsApi('CreateInvoice', {
            userid: user.userId,
            itemdescription1: `Domain Registration - ${items.map((item: any) => item.domain).join(', ')}`,
            itemamount1: items.reduce((sum: number, item: any) => sum + (parseFloat(item.price) || 0), 0),
            itemtaxed1: 1, // Taxable
          });

          if (invoiceResponse.result === 'success' && invoiceResponse.invoiceid) {
            invoiceId = parseInt(invoiceResponse.invoiceid);
          } else {
            // Try GenInvoice as fallback
            const genInvoiceResponse = await whmcsApi('GenInvoice', {
              clientid: user.userId,
              orderids: orderId,
            });
            
            if (genInvoiceResponse.result === 'success' && genInvoiceResponse.invoiceid) {
              invoiceId = parseInt(genInvoiceResponse.invoiceid);
            }
          }
        } catch (invoiceError) {
          console.error('Invoice generation error:', invoiceError);
        }
      }

      // Update invoice tax settings
      if (invoiceId) {
        try {
          // Reset taxrate2 to prevent double taxation
          await whmcsApi('UpdateInvoice', {
            invoiceid: invoiceId,
            taxrate2: '0.00',
          });
        } catch (e) {
          console.error('[Bulk Domain Order] Failed to update invoice:', e);
        }
      }

      // Set user's default currency after successful order (locks currency)
      try {
        const { setUserDefaultCurrency } = await import('@/actions/currency-actions');
        await setUserDefaultCurrency(selectedCurrency);
      } catch (currencyLockError) {
        // Don't fail the order if currency locking fails
      }

      return {
        success: true,
        orderId,
        invoiceId,
        domainCount: items.length,
        domains: items.map((item: any) => item.domain),
      };
    } else {
      const errorMsg = response.message || 'Failed to create bulk domain order';
      return {
        success: false,
        error: errorMsg,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Create domain order action for processing page
 */
export async function createDomainOrderAction(orderData: any) {
  try {
    // Get current user from session
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        requiresLogin: true,
        error: 'Please login to complete your order',
      };
    }

    if (orderData.domainType === 'transfer') {
      const eppValidation = validateEppCode(orderData.eppCode || '');
      if (!eppValidation.valid) {
        return {
          success: false,
          error: eppValidation.error,
        };
      }
    }

    const selectedCurrency = String(orderData.currency || '').trim().toUpperCase();
    const currencySync = await syncClientCurrency(user.userId, selectedCurrency);
    if (!currencySync.success) {
      return {
        success: false,
        error: currencySync.error,
      };
    }

    // Update client location if provided for accurate tax calculation
    if (orderData.country) {
      await syncClientLocation(user.userId, orderData.country, orderData.state);
    }

    // Prepare WHMCS order parameters
    // IMPORTANT: WHMCS AddOrder API requires domain parameters as ARRAYS
    // See: https://developers.whmcs.com/api-reference/addorder/
    const whmcsOrderData: any = {
      clientid: user.userId,
      paymentmethod: 'stripe', // Hardcoded fix process.env.WHMCS_ORDER_PAYMENT_METHOD || 'banktransfer',
      noinvoice: false, // Ensure invoice is created
      noemail: false,   // Send confirmation email
    };

    // Add domain as array (WHMCS requires array format)
    whmcsOrderData['domain[0]'] = orderData.domain;
    whmcsOrderData['domaintype[0]'] = orderData.domainType || 'register';
    whmcsOrderData['regperiod[0]'] = orderData.years || 1;

    // Add promo code if provided
    if (orderData.promoCode && orderData.promoCode.trim() !== '') {
      whmcsOrderData.promocode = orderData.promoCode.trim();
      }

    const hasDomainAddon = (addons: any, id: string) => {
      if (!addons) return false;
      if (Array.isArray(addons)) return addons.some(a => a.id === id || (id === 'idprotection' && a.id === 'idprotect'));
      return !!(addons[id] || (id === 'idprotection' && addons['idprotect']));
    };

    // Add domain addons ONLY if explicitly true. Omit completely if false.
    // Passing false/0 can trigger PHP isset() presence-checks in WHMCS API natively.
    if (hasDomainAddon(orderData.addons, 'dnsmanagement')) whmcsOrderData['dnsmanagement[0]'] = true;
    if (hasDomainAddon(orderData.addons, 'emailforwarding')) whmcsOrderData['emailforwarding[0]'] = true;
    if (hasDomainAddon(orderData.addons, 'idprotection')) whmcsOrderData['idprotection[0]'] = true;

    // EXPLICIT FIX: Enforce the WHMCS pricing matrix. We fetch from WHMCS directly using calculateDomainPrice.
    // This prevents WHMCS AddOrder from inflating the unit price internally while ensuring we DO NOT use a "custom" price from the UI.
    const whmcsPriceResult = await calculateDomainPrice(orderData.domain, orderData.years || 1, orderData.currency || 'USD');
    if (whmcsPriceResult.success && whmcsPriceResult.data) {
      // Use the raw total price (without tax, as tax is applied natively by WHMCS)
      whmcsOrderData['domainprice[0]'] = whmcsPriceResult.data.totalPrice.toFixed(2);
    }

    // Add EPP code for transfers (also array format)
    if (orderData.domainType === 'transfer' && orderData.eppCode) {
      whmcsOrderData['eppcode[0]'] = String(orderData.eppCode).trim();
    }


    // Add domain order to WHMCS (use capital A - AddOrder)
    const response = await whmcsApi('AddOrder', whmcsOrderData);

    if (response.result === 'success') {
      const orderId = parseInt(response.orderid);
      let invoiceId = response.invoiceid ? parseInt(response.invoiceid) : null;

      // For transfer orders, immediately trigger WHMCS DomainTransfer to validate auth code at registrar level.
      if (String(orderData.domainType || '').toLowerCase() === 'transfer') {
        const transferDomainId = Number.parseInt(
          String(response.domainids || '')
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)[0] || '0',
          10
        );

        if (!Number.isFinite(transferDomainId) || transferDomainId <= 0) {
          // Best-effort cleanup when WHMCS did not create a usable domain transfer record
          if (Number.isFinite(orderId) && orderId > 0) {
            try {
              await whmcsApi('DeleteOrder', {
                orderid: orderId,
                deleteinvoice: true,
              });
            } catch {
              // ignore cleanup failures
            }
          }

          return {
            success: false,
            error:
              'WHMCS did not return a valid transfer domain ID. Please verify TLD transfer setup in WHMCS registrar configuration.',
          };
        }

        const transferInitiation = await whmcsApi('DomainTransfer', {
          domainid: transferDomainId,
          eppcode: String(orderData.eppCode || '').trim(),
        });

        if (transferInitiation.result !== 'success') {
          // Best-effort cleanup so invalid transfer auth codes do not leave orphan pending orders/invoices
          if (Number.isFinite(orderId) && orderId > 0) {
            try {
              await whmcsApi('DeleteOrder', {
                orderid: orderId,
                deleteinvoice: true,
              });
            } catch {
              // ignore cleanup failures
            }
          }

          return {
            success: false,
            error:
              transferInitiation.message ||
              'Transfer authorization code was rejected by WHMCS/registrar. Please verify EPP code and domain lock status.',
          };
        }
      }

      const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      const resolveInvoiceFromOrder = async (attempts: number, delayMs: number) => {
        for (let i = 0; i < attempts; i += 1) {
          try {
            const orderLookup = await whmcsApi('GetOrders', {
              id: orderId,
              limitnum: 1,
            });

            if (orderLookup.result === 'success' && orderLookup.orders?.order) {
              const orders = orderLookup.orders.order;
              const order = Array.isArray(orders) ? orders[0] : orders;
              const parsed = Number.parseInt(String(order?.invoiceid || '0'), 10);
              if (Number.isFinite(parsed) && parsed > 0) {
                return parsed;
              }
            }
          } catch (orderLookupError: any) {
            // Silently handle lookup errors
          }

          if (i < attempts - 1) {
            await wait(delayMs);
          }
        }

        return null;
      };

      const resolveInvoiceFromInvoices = async (attempts: number, delayMs: number) => {
        for (let i = 0; i < attempts; i += 1) {
          try {
            const invoicesResponse = await whmcsApi('GetInvoices', {
              userid: user.userId,
              limitnum: 50,
              orderby: 'id',
              order: 'DESC',
            });

            if (invoicesResponse.result === 'success' && invoicesResponse.invoices) {
              const invoices = invoicesResponse.invoices.invoice;
              const invoiceList = Array.isArray(invoices) ? invoices : invoices ? [invoices] : [];

              const matchingInvoice = invoiceList.find((inv: any) => String(inv.orderid || '') === String(orderId));
              if (matchingInvoice?.id) {
                const parsed = Number.parseInt(String(matchingInvoice.id), 10);
                if (Number.isFinite(parsed) && parsed > 0) {
                  return parsed;
                }
              }
            }
          } catch (invoiceError: any) {
            // Silently handle invoice lookup errors
          }

          if (i < attempts - 1) {
            await wait(delayMs);
          }
        }

        return null;
      };

      // NOTE: We do NOT call AcceptOrder here because it would activate the domain
      // before payment is confirmed. AcceptOrder should only be called after
      // successful payment in the Stripe webhook handler (stripe-actions.ts).
      // Instead, we try to resolve the invoice ID through other means.

      // If still no invoice, try to find it via GetInvoices
      if (!invoiceId && orderId) {

        const byInvoices = await resolveInvoiceFromInvoices(3, 1000);
        if (byInvoices) {
          invoiceId = byInvoices;
        } else {
        }
      }

      // Last-resort fallback: create invoice from provided price or WHMCS order amount
      if (!invoiceId && orderId) {
        try {
          const orderResponse = await whmcsApi('GetOrders', {
            id: orderId,
            limitnum: 1,
          });
 
          // FIX: Instead of reading the post-tax order.amount from WHMCS, we must use the 
          // explicitly fetched pre-tax base price. Otherwise, CreateInvoice will apply tax 
          // ON TOP of the already-taxed order.amount, causing double-taxation inflation.
          let orderAmount = whmcsPriceResult.success && whmcsPriceResult.data ? whmcsPriceResult.data.totalPrice : 0;
          
          if (orderResponse.result === 'success' && orderResponse.orders?.order) {
            const orders = orderResponse.orders.order;
            const order = Array.isArray(orders) ? orders[0] : orders;

            // If invoice became available between calls, use it directly
            if (!invoiceId && order?.invoiceid) {
              const parsed = Number.parseInt(String(order.invoiceid), 10);
              if (Number.isFinite(parsed) && parsed > 0) {
                invoiceId = parsed;
              }
            }
          }

          if (!invoiceId && (!Number.isFinite(orderAmount) || orderAmount <= 0)) {
            // If order amount is unavailable/zero, derive from WHMCS TLD transfer pricing
            try {
              const tldPricingResponse: { success: boolean; data?: any } =
                await getTLDPricingAction(selectedCurrency);

              if (tldPricingResponse.success && tldPricingResponse.data) {
                const tld = String(orderData.domain || '').split('.').pop() || '';
                const tldPricing =
                  tldPricingResponse.data[tld] ||
                  tldPricingResponse.data[`.${tld}`] ||
                  tldPricingResponse.data[tld.toLowerCase()] ||
                  tldPricingResponse.data[`.${tld.toLowerCase()}`];

                const pickYearPrice = (pricingBlock: any): number => {
                  const years = orderData.years || 1;
                  const raw =
                    pricingBlock?.[String(years)] ??
                    pricingBlock?.[years] ??
                    pricingBlock?.['1'] ??
                    pricingBlock?.[1] ??
                    pricingBlock;
                  const candidate =
                    typeof raw === 'object' && raw !== null
                      ? raw.price ?? raw.amount ?? raw
                      : raw;
                  const parsed = Number.parseFloat(
                    String(candidate).replace(/\b[A-Z]{3}\b/g, '').replace(/[^\d.]/g, '')
                  );
                  return Number.isFinite(parsed) ? parsed : 0;
                };

                const transferAmount = pickYearPrice(tldPricing?.transfer);
                const renewAmount = pickYearPrice(tldPricing?.renew);
                const registerAmount = pickYearPrice(tldPricing?.register);

                orderAmount = transferAmount > 0 ? transferAmount : renewAmount > 0 ? renewAmount : registerAmount;
              }
            } catch (pricingFallbackError: any) {
              // Silently handle pricing fallback errors
            }
          }

          if (!invoiceId && Number.isFinite(orderAmount) && orderAmount > 0) {
            // Final duplicate-guard: avoid creating another invoice if WHMCS already generated one
            // without order linkage in API response yet.
            try {
              const existingInvoicesResponse = await whmcsApi('GetInvoices', {
                userid: user.userId,
                status: 'Unpaid',
                limitnum: 50,
                orderby: 'id',
                order: 'DESC',
              });

              if (existingInvoicesResponse.result === 'success' && existingInvoicesResponse.invoices?.invoice) {
                const invoices = existingInvoicesResponse.invoices.invoice;
                const invoiceList = Array.isArray(invoices) ? invoices : [invoices];
                const duplicateCandidate = invoiceList.find(
                  (inv: any) => String(inv.orderid || '') === String(orderId)
                );

                if (duplicateCandidate?.id) {
                  const existingId = Number.parseInt(String(duplicateCandidate.id), 10);
                  if (Number.isFinite(existingId) && existingId > 0) {
                    invoiceId = existingId;
                  }
                }
              }
            } catch (guardError: any) {
              // Silently handle duplicate guard errors
            }
          }

          if (!invoiceId && Number.isFinite(orderAmount) && orderAmount > 0) {
            const invoiceResponse = await whmcsApi('CreateInvoice', {
              userid: user.userId,
              status: 'Unpaid',
              sendinvoice: true,
              paymentmethod: process.env.WHMCS_ORDER_PAYMENT_METHOD || 'stripe',
              itemdescription: [
                `Domain ${String(orderData.domainType || 'register')} - ${String(orderData.domain)}`,
              ],
              itemamount: [orderAmount],
              itemtaxed: [true],
            });

            if (invoiceResponse.result === 'success' && invoiceResponse.invoiceid) {
              invoiceId = Number.parseInt(String(invoiceResponse.invoiceid), 10);
            }
          }
        } catch (fallbackInvoiceError: any) {
          // Silently handle fallback invoice errors
        }
      }

      // Sync invoice to MongoDB if we have one
      if (invoiceId) {
        // NOTE: We rely entirely on WHMCS's native tax rule engine (which reads the client's country)
        // rather than manually calling UpdateInvoice to force `taxrate`. Updating the taxrate API property
        // on a freshly minted invoice causes an internal WHMCS recalculation bug, inflating base prices.

        try {
          const { getInvoicesCollection } = await import('@/lib/db');
          const { syncInvoiceToMongoDB } = await import('@/lib/invoice-sync');
          const invoicesCollection = await getInvoicesCollection();
          await syncInvoiceToMongoDB(invoiceId, user.userId, invoicesCollection);
        } catch (syncError) {
          // Continue anyway - invoice exists in WHMCS
        }
      }

      // Revalidate relevant pages
      revalidatePath('/dashboard/billing', 'page');
      revalidatePath('/dashboard/domains', 'page');

      // Set user's default currency after successful order (locks currency)
      try {
        const { setUserDefaultCurrency } = await import('@/actions/currency-actions');
        await setUserDefaultCurrency(selectedCurrency);
      } catch (currencyLockError) {
        // Don't fail the order if currency locking fails
      }

      return {
        success: true,
        data: response,
        orderId,
        invoiceId: invoiceId || null,
        message: invoiceId
          ? 'Domain order created successfully!'
          : 'Domain order created! Invoice will be generated shortly.',
      };
    }

    return {
      success: false,
      error: response.message || 'Failed to create domain order',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An error occurred while creating domain order',
    };
  }
}
