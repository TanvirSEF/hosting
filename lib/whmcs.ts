import axios from 'axios';

const API_URL = process.env.API_ENDPOINT || 'https://bill.webblyhosting.com/includes/api.php';
const API_IDENTIFIER = process.env.API_IDENTIFIER || 'LXfEzYe2B6jizwsdQz0dd0Ah2LSLq5CH';
const API_SECRET = process.env.API_SECRET || '3dImq1E91iAl80Nos0CKtfK3RHsiaXD3';

/**
 * Flatten an object so that array values become indexed keys (key[0], key[1], …).
 * URLSearchParams calls .toString() on arrays which produces comma-separated
 * values — PHP does NOT interpret those as arrays.  Indexed keys are the only
 * reliable cross-environment way to send arrays via application/x-www-form-urlencoded.
 *
 * Booleans are converted to "1"/"0" because PHP treats the string "false" as truthy.
 */
function flattenArrays(obj: Record<string, any>): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        flat[`${key}[${i}]`] = typeof v === 'boolean' ? (v ? '1' : '0') : String(v);
      });
    } else {
      flat[key] = typeof value === 'boolean' ? (value ? '1' : '0') : String(value);
    }
  }
  return flat;
}

export const whmcsApi = async (action: string, params: any = {}) => {
  const postData = {
    identifier: API_IDENTIFIER,
    secret: API_SECRET,
    action: action,
    responsetype: 'json',
    ...params,
  };

  try {
    const response = await axios.post(
      API_URL,
      new URLSearchParams(flattenArrays(postData)).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (response.data.result === 'error') {
      const msg = response.data.message || 'Unknown WHMCS error';
      const full = typeof response.data === 'object'
        ? JSON.stringify(response.data)
        : msg;
      console.warn('⚠️ WHMCS API Error:', full);
      throw new Error(msg);
    }

    return response.data;
  } catch (error: any) {
    // Use warn instead of error — callers that use Promise.allSettled handle failures
    // gracefully, so this should not appear as a red error in the console.
    console.warn(`WHMCS API [${action}] failed:`, error.message || '(no message)');
    throw error;
  }
};


/**
 * Get client details by email address
 * @param email - Client email address
 * @returns Client details from WHMCS
 */
export const getClientByEmail = async (email: string) => {
  try {
    const response = await whmcsApi('GetClientsDetails', {
      email: email.toLowerCase(),
      stats: false,
    });

    return response;
  } catch (error: any) {
    // If client not found, WHMCS returns an error
    if (error.message?.includes('Client Not Found')) {
      return null;
    }
    throw error;
  }
};

/**
 * Send password reset email via WHMCS
 * Uses the ResetPassword API which triggers WHMCS's password reset flow
 * @param email - Client email address
 * @returns Success response from WHMCS
 */
export const sendPasswordResetEmail = async (email: string) => {
  try {
    // WHMCS ResetPassword API - sends password reset email directly
    // Documentation: https://developers.whmcs.com/api-reference/resetpassword/
    const response = await whmcsApi('ResetPassword', {
      email: email.toLowerCase(),
    });

    // ResetPassword returns {result: "success"} on success
    if (response.result === 'success') {
      return {
        success: true,
        message: 'Password reset email sent successfully',
      };
    }

    throw new Error('Failed to send password reset email');
  } catch (error: any) {
    console.error('Password reset error:', error.message);

    // Handle specific WHMCS errors
    if (error.message?.includes('User Not Found')) {
      throw new Error('No account found with this email address');
    }

    if (error.message?.includes('Please provide a valid email')) {
      throw new Error('Invalid email address');
    }

    throw error;
  }
};

/**
 * Update client password in WHMCS
 * @param email - Client email address
 * @param newPassword - Plain text new password
 * @returns Success response
 */
export const updateClientPassword = async (
  email: string,
  newPassword: string
) => {
  try {
    // First get client details to get client ID
    const clientData = await getClientByEmail(email);

    if (!clientData || !clientData.userid) {
      throw new Error('Client not found in WHMCS');
    }

    // Update the client password using WHMCS UpdateClient API
    const response = await whmcsApi('UpdateClient', {
      clientid: clientData.userid,
      password2: newPassword, // New password in plain text
    });

    if (response.result === 'success') {
      return {
        success: true,
        clientId: clientData.userid,
        message: 'Password updated successfully in WHMCS',
      };
    }

    throw new Error('Failed to update password in WHMCS');
  } catch (error: any) {
    console.error('WHMCS password update error:', error.message);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// In-memory cache for currency list (avoids hammering WHMCS on every request)
// ---------------------------------------------------------------------------
let _currenciesCache: { data: any[]; expiresAt: number } | null = null;
const CURRENCIES_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get all currencies configured in WHMCS
 * Result is cached in-memory for 5 minutes to avoid redundant API calls.
 */
export const getCurrencies = async () => {
  try {
    // Return cached result if still valid
    if (_currenciesCache && Date.now() < _currenciesCache.expiresAt) {
      return { success: true, data: _currenciesCache.data };
    }

    const response = await whmcsApi('GetCurrencies');

    if (response.result === 'success' && response.currencies?.currency) {
      const data = response.currencies.currency;
      _currenciesCache = { data, expiresAt: Date.now() + CURRENCIES_CACHE_TTL_MS };
      return { success: true, data };
    }

    return { success: false, data: [] };
  } catch (error: any) {
    console.error('Failed to fetch currencies from WHMCS:', error.message);
    return { success: false, data: [] };
  }
};


/**
 * Get products with pricing in specific currency
 * @param currencyCode - Currency code (USD, EUR, GBP, SEK)
 * @returns Products with pricing in specified currency
 */
export const getProductsWithCurrency = async (currencyCode: string = 'USD') => {
  try {
    // First get currency ID from currency code
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
      currency: currencyId,
    });

    if (response.result === 'success') {
      return {
        success: true,
        data: response.products?.product || [],
        currency: currencyCode,
      };
    }

    return {
      success: false,
      data: [],
    };
  } catch (error: any) {
    console.error('Failed to fetch products with currency:', error.message);
    return {
      success: false,
      data: [],
    };
  }
};

/**
 * Get products in a product group with pricing in specific currency
 * @param gid - Product group ID (WHMCS)
 * @param currencyCode - Currency code (USD, EUR, GBP, SEK)
 * @returns Products in the group with pricing in specified currency
 */
export const getProductsByGroupAndCurrency = async (
  gid: number,
  currencyCode: string = 'USD'
) => {
  try {
    const currenciesResponse = await getCurrencies();
    let currencyId = 1;
    if (currenciesResponse.success && currenciesResponse.data.length > 0) {
      const currency = currenciesResponse.data.find(
        (c: any) => c.code.toUpperCase() === currencyCode.toUpperCase()
      );
      if (currency) {
        currencyId = parseInt(currency.id);
      }
    }

    const response = await whmcsApi('GetProducts', {
      gid,
      currency: currencyId,
    });

    if (response.result === 'success') {
      const products = response.products?.product;
      const list = Array.isArray(products) ? products : products ? [products] : [];
      return {
        success: true,
        data: list,
        currency: currencyCode,
      };
    }

    return { success: false, data: [], currency: currencyCode };
  } catch (error: any) {
    console.error(
      'Failed to fetch products by group with currency:',
      error.message
    );
    return { success: false, data: [] };
  }
};
/**
 * Get invoice details
 * @param invoiceId - Invoice ID
 */
export const getInvoiceAction = async (invoiceId: number) => {
  try {
    const response = await whmcsApi('GetInvoice', { invoiceid: invoiceId });
    if (response.result === 'success') {
      return { success: true, data: response };
    }
    return { success: false, error: response.message };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};


/**
 * Update invoice line item using UpdateInvoice
 * Note: UpdateInvoiceLineItem might not be available or permissions issue.
 * We use UpdateInvoice which accepts arrays of item details.
 */
export const updateInvoiceLineItemAction = async (
  invoiceId: number,
  lineItemId: number,
  amount: number,
  description?: string
) => {
  try {
    // UpdateInvoice expects:
    // itemdescription[lineItemId] = ...
    // itemamount[lineItemId] = ...
    // itemtaxed[lineItemId] = ...

    // We strictly follow WHMCS API for UpdateInvoice
    const params: any = {
      invoiceid: invoiceId,
      [`itemamount[${lineItemId}]`]: amount,
    };

    if (description) {
      params[`itemdescription[${lineItemId}]`] = description;
    }

    const response = await whmcsApi('UpdateInvoice', params);

    if (response.result === 'success') {
      return { success: true };
    }
    return { success: false, error: response.message };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Add a discount line item to an existing invoice
 * This adds a NEW line item with a negative amount (discount)
 */
export const addInvoiceDiscountLineItemAction = async (
  invoiceId: number,
  discountAmount: number,
  description: string
) => {
  try {
    // UpdateInvoice can add new line items using newitemdescription[], newitemamount[], newitemtaxed[]
    // We use index 0 since we're adding one item
    const params: any = {
      invoiceid: invoiceId,
      'newitemdescription[0]': description,
      'newitemamount[0]': -Math.abs(discountAmount), // Negative amount for discount
      'newitemtaxed[0]': 0, // Discounts are not taxed
    };

    const response = await whmcsApi('UpdateInvoice', params);

    if (response.result === 'success') {
      return { success: true };
    }
    return { success: false, error: response.message };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};


/**
 * Update client product (service)
 * @param serviceId - Service ID (id from tblhosting)
 * @param params - Parameters to update (recurringamount, etc.)
 */
export const updateClientProductAction = async (
  serviceId: number,
  params: { recurringamount?: number; nextduedate?: string }
) => {
  try {
    const apiParams = {
      serviceid: serviceId,
      ...params,
    };
    const response = await whmcsApi('UpdateClientProduct', apiParams);
    if (response.result === 'success') {
      return { success: true };
    }
    return { success: false, error: response.message };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Get tax rates from WHMCS via API endpoint
 * Uses secure API instead of direct database connection
 * @param country - Country code (e.g., 'SE', 'DE', 'FR')
 * @param state - State/province code (optional, for US/CA)
 * @returns Tax configuration including rates
 */
export const getTaxRates = async (country?: string, state?: string) => {
  try {
    if (!country) {
      return {
        success: false,
        data: { taxrate: 0, taxrate2: 0, taxname: 'VAT', taxname2: '' },
      };
    }

    console.log('[WHMCS getTaxRates] Fetching via API for country:', country, 'state:', state);

    // Build API URL
    const apiUrl = process.env.WHMCS_TAX_API_URL || 'https://bill.webblyhosting.com/api/tax-rates.php';
    const apiKey = process.env.WHMCS_TAX_API_KEY || '';

    if (!apiKey) {
      console.error('[WHMCS getTaxRates] API key not configured');
      return {
        success: false,
        data: { taxrate: 0, taxrate2: 0, taxname: 'VAT', taxname2: '' },
      };
    }

    const params = new URLSearchParams({
      key: apiKey,
      country: country,
    });

    if (state) {
      params.append('state', state);
    }

    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store', // Always get fresh tax rates
    });

    if (!response.ok) {
      console.error('[WHMCS getTaxRates] API responded with status:', response.status);
      return {
        success: false,
        data: { taxrate: 0, taxrate2: 0, taxname: 'VAT', taxname2: '' },
      };
    }

    const result = await response.json();
    console.log('[WHMCS getTaxRates] API response:', result);

    if (result.success && result.data) {
      return {
        success: true,
        data: result.data,
      };
    }

    console.log('[WHMCS getTaxRates] No tax configured for', country);
    return {
      success: false,
      data: { taxrate: 0, taxrate2: 0, taxname: 'VAT', taxname2: '' },
    };
  } catch (error: any) {
    console.error('[WHMCS getTaxRates] Error:', error.message);
    return {
      success: false,
      data: { taxrate: 0, taxrate2: 0, taxname: 'VAT', taxname2: '' },
    };
  }
};



