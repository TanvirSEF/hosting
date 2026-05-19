'use server';

import { whmcsApi, getCurrencies } from '@/lib/whmcs';
import { getCurrencyPrefixSuffix } from '@/lib/currency-utils';
import {
  createOrRetrieveStripeCustomer,
  retrieveStripeCustomer,
  listPaymentMethods,
  detachPaymentMethod,
  createPaymentIntent,
  retrievePaymentIntent,
  createSetupIntent,
  retrieveSetupIntent,
  createCheckoutSession,
  retrieveCheckoutSession,
  setDefaultPaymentMethod,
  getCurrencyMinorUnitMultiplier,
} from '@/lib/stripe';
import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);



async function pickInvoiceCurrencyCode(invoice: any, clientResponse: any): Promise<string> {
  const fromInvoice =
    invoice?.currencycode || invoice?.currencyCode || invoice?.currency || invoice?.currencyid;
  const fromClient = clientResponse?.client?.currencycode || clientResponse?.client?.currency;
  const raw = String(fromInvoice || fromClient || 'USD').toUpperCase().trim();
  
  // If it's already a 3-letter ISO code, return it
  if (/^[A-Z]{3}$/.test(raw)) return raw;

  // If it's a number (WHMCS ID), resolve it using getCurrencies
  if (/^\d+$/.test(raw)) {
    try {
      const currenciesResponse = await getCurrencies();
      if (currenciesResponse.success && Array.isArray(currenciesResponse.data)) {
        const currency = currenciesResponse.data.find(
          (c: any) => String(c.id) === raw
        );
        if (currency && currency.code) {
          return String(currency.code).toUpperCase().trim();
        }
      }
    } catch (e) {
      console.warn('[pickInvoiceCurrencyCode] Failed to resolve currency ID:', raw, e);
    }
  }

  return 'USD';
}

function pickClientEmail(clientResponse: any): string {
  const email = clientResponse?.client?.email || clientResponse?.email || '';
  return String(email).trim();
}

// Verify user session and get userId
async function getUserId() {
  const cookieStore = cookies();
  const session = (await cookieStore).get('session')?.value;
  if (!session) {
    throw new Error('Unauthorized');
  }
  const { payload } = await jwtVerify(session, JWT_SECRET);
  return payload.userId as string | number;
}

/**
 * Get invoice details
 */
export async function getInvoiceDetailsAction(invoiceId: string | number) {
  try {
    const userId = await getUserId(); // Verify user is authenticated

    // Fetch invoice details and currencies in parallel
    const [response, currenciesResponse, clientResponse] = await Promise.all([
      whmcsApi('GetInvoice', { invoiceid: invoiceId }),
      getCurrencies(),
      whmcsApi('GetClientsDetails', { clientid: userId, stats: false }),
    ]);

    if (response.result === 'success') {
      // Get currency info from multiple sources
      let currencycode = response.currencycode;
      let currencyprefix = response.currencyprefix;
      let currencysuffix = response.currencysuffix;

      // If WHMCS didn't provide currency code, try to get from client's profile
      if (!currencycode && clientResponse.result === 'success' && clientResponse.client) {
        currencycode = clientResponse.client.currencycode;
      }

      // If still no currency code, try to find by currency ID
      if (!currencycode && response.currencyid && currenciesResponse.success && currenciesResponse.data) {
        const currency = currenciesResponse.data.find(
          (c: any) => String(c.id) === String(response.currencyid)
        );
        if (currency) {
          currencycode = currency.code;
        }
      }

      // If we have a currency code but no prefix/suffix, get from currencies list
      if (currencycode && (!currencyprefix || !currencysuffix) && currenciesResponse.success && currenciesResponse.data) {
        const currency = currenciesResponse.data.find(
          (c: any) => c.code.toUpperCase() === currencycode.toUpperCase()
        );
        if (currency) {
          currencyprefix = currency.prefix;
          currencysuffix = currency.suffix;
        }
      }

      // Final fallback: derive from currency code using our mapping
      currencycode = currencycode || 'USD';
      if (!currencyprefix && !currencysuffix) {
        const derived = getCurrencyPrefixSuffix(currencycode);
        currencyprefix = derived.prefix;
        currencysuffix = derived.suffix;
      }

      // Return all invoice items with stamped currency info
      return {
        success: true,
        data: {
          ...response,
          currencycode,
          currencyprefix,
          currencysuffix,
        },
      };
    } else {
      return {
        success: false,
        error: response.message || 'Invoice not found',
      };
    }
  } catch (error: any) {
    console.error('Get Invoice Details Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch invoice details',
    };
  }
}

/**
 * Get invoice PDF download URL
 */
export async function getInvoicePdfAction(invoiceId: string | number) {
  try {
    await getUserId(); // Verify user is authenticated

    // WHMCS invoice PDF is available at: {WHMCS_URL}/dl.php?type=i&id={invoiceId}
    // We need the WHMCS base URL from environment
    const whmcsUrl =
      process.env.WHMCS_URL ||
      process.env.API_ENDPOINT?.replace('/includes/api.php', '') ||
      '';

    if (!whmcsUrl) {
      return {
        success: false,
        error: 'WHMCS URL not configured',
      };
    }

    // Construct PDF URL
    const pdfUrl = `${whmcsUrl}/dl.php?type=i&id=${invoiceId}`;

    return {
      success: true,
      pdfUrl,
      invoiceId: invoiceId,
      message: 'Invoice PDF ready for download',
    };
  } catch (error: any) {
    console.error('Get Invoice PDF Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get invoice PDF',
    };
  }
}

/**
 * Get payment URL for an invoice (redirects to WHMCS clientarea pay page)
 */
export async function getInvoicePaymentUrlAction(invoiceId: string | number) {
  try {
    await getUserId(); // Verify user is authenticated

    // Get WHMCS base URL from environment
    const whmcsUrl =
      process.env.WHMCS_URL ||
      process.env.API_ENDPOINT?.replace('/includes/api.php', '') ||
      '';

    if (!whmcsUrl) {
      return {
        success: false,
        error: 'WHMCS URL not configured',
      };
    }

    // WHMCS payment URL format: {WHMCS_URL}/clientarea.php?action=pay&id={invoiceId}
    // Alternative: {WHMCS_URL}/viewinvoice.php?id={invoiceId} (has payment button)
    const paymentUrl = `${whmcsUrl}/clientarea.php?action=pay&id=${invoiceId}`;

    return {
      success: true,
      paymentUrl,
      invoiceId: invoiceId,
      message: 'Redirecting to payment page...',
    };
  } catch (error: any) {
    console.error('Get Payment URL Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get payment URL',
    };
  }
}


export async function createStripePaymentAction(
  invoiceId: string | number,
  options?: { savePaymentMethod?: boolean; useCheckoutSession?: boolean; successUrl?: string; cancelUrl?: string; paymentMethodId?: string; returnUrl?: string; }
) {
  try {
    const userId = await getUserId();

    const invoiceResponse = await whmcsApi('GetInvoice', {
      invoiceid: invoiceId,
    });

    if (invoiceResponse.result !== 'success') {
      return {
        success: false,
        error: invoiceResponse.message || 'Invoice not found',
      };
    }

    const invoice = invoiceResponse;
    const amount = parseFloat(invoice.total || '0');

    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        success: false,
        error: 'Stripe is not configured. Please contact support.',
      };
    }

    const clientResponse = await whmcsApi('GetClientsDetails', {
      clientid: userId,
      stats: false,
    });

    if (clientResponse.result !== 'success') {
      return {
        success: false,
        error: 'Failed to get user details',
      };
    }

    const userEmail = pickClientEmail(clientResponse);
    const currency = await pickInvoiceCurrencyCode(invoice, clientResponse);
    const client = clientResponse?.client || {};
    const userName = String(
      client?.firstname
        ? `${client.firstname} ${client.lastname || ''}`.trim()
        : client?.fullname || ''
    ).trim();

    // Validate inputs
    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        success: false,
        error: 'Invalid invoice amount. Please contact support.',
      };
    }
    if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      return {
        success: false,
        error: 'Invalid customer email. Please contact support.',
      };
    }

    // Get or create Stripe customer
    const { getClientsCollection } = await import('@/lib/db');
    const clientsCollection = await getClientsCollection();
    const clientDoc = await clientsCollection.findOne({
      whmcsId: Number(userId),
    });

    let stripeCustomerId = clientDoc?.stripeCustomerId;
    if (stripeCustomerId) {
      // Verify customer still exists in Stripe
      const customer = await retrieveStripeCustomer(stripeCustomerId);
      if (!customer) {
        stripeCustomerId = undefined;
      }
    }

    if (!stripeCustomerId) {
      const customer = await createOrRetrieveStripeCustomer({
        email: userEmail,
        name: userName || undefined,
        phone: client.phonenumber || undefined,
        metadata: {
          whmcsClientId: String(userId),
        },
      });
      stripeCustomerId = customer.id;
      await clientsCollection.updateOne(
        { whmcsId: Number(userId) },
        {
          $set: {
            stripeCustomerId,
            updatedAt: new Date(),
          },
        }
      );
    }

    // Use Checkout Session for hosted checkout experience
    if (options?.useCheckoutSession && options?.successUrl && options?.cancelUrl) {
      const session = await createCheckoutSession({
        amount,
        currency,
        customerId: stripeCustomerId,
        invoiceId: String(invoiceId),
        description: `Invoice #${invoice.invoicenum || invoiceId}`,
        successUrl: options.successUrl,
        cancelUrl: options.cancelUrl,
        savePaymentMethod: options.savePaymentMethod,
      });

      return {
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id,
        customerEmail: userEmail,
        customerName: userName || undefined,
        amount,
        currency,
      };
    }

    // Create PaymentIntent for embedded checkout
    const paymentIntent = await createPaymentIntent({
      amount,
      currency,
      customerId: stripeCustomerId,
      description: `Invoice #${invoice.invoicenum || invoiceId}`,
      metadata: {
        invoiceId: String(invoiceId),
        whmcsClientId: String(userId),
        invoiceNum: invoice.invoicenum || '',
      },
      savePaymentMethod: options?.savePaymentMethod,
      paymentMethodId: options?.paymentMethodId,
      returnUrl: options?.returnUrl,
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerEmail: userEmail,
      customerName: userName || undefined,
      amount,
      currency,
      customerId: stripeCustomerId,
    };
  } catch (error: any) {
    console.error('[invoice-actions] createStripePaymentAction failed:', {
      invoiceId,
      message: error.message,
      stack: error.stack,
      error
    });
    return {
      success: false,
      error: error.message || 'Failed to create payment session',
    };
  }
}

/**
 * Record Stripe payment in WHMCS and MongoDB.
 * Called from Stripe webhook (payment_intent.succeeded) – do not require user session.
 */
export async function recordInvoicePaymentFromStripe(
  invoiceId: string | number,
  paymentIntentId: string,
  amount: number
) {
  try {
    const invoiceResponse = await whmcsApi('GetInvoice', {
      invoiceid: invoiceId,
    });

    if (invoiceResponse.result !== 'success') {
      return {
        success: false,
        error: 'Invoice not found',
      };
    }

    const invoice = invoiceResponse;
    const userId = invoice.userid;

    const whmcsGateway =
      (process.env.WHMCS_ORDER_PAYMENT_METHOD || '').trim() ||
      String(invoice.paymentmethod || '').trim() ||
      'stripe';

    let paymentResult;
    try {
      paymentResult = await whmcsApi('AddInvoicePayment', {
        invoiceid: invoiceId,
        transid: paymentIntentId,
        gateway: whmcsGateway,
        amount: amount.toFixed(2),
        date: new Date().toISOString().split('T')[0],
        noemail: false,
      });

      if (paymentResult.result !== 'success') {
        throw new Error(paymentResult.message || 'Failed to record payment in WHMCS');
      }
    } catch (err: any) {
      const msg = err.message || String(err);
      if (msg.includes('SQLSTATE[42S22]') || msg.includes('Unknown column') || msg.includes('invoiceid')) {
        console.warn('WHMCS Backend Error ignored (AddInvoicePayment):', msg);
        paymentResult = { result: 'success' };
      } else {
        return {
          success: false,
          error: msg,
        };
      }
    }

    const { getInvoicesCollection, getHostingOrdersCollection } =
      await import('@/lib/db');
    const invoicesCollection = await getInvoicesCollection();
    const now = new Date();

    await invoicesCollection.updateOne(
      { whmcsInvoiceId: Number(invoiceId) },
      {
        $set: {
          whmcsInvoiceId: Number(invoiceId),
          clientId: Number(userId),
          total: amount,
          subtotal: parseFloat(invoice.subtotal || '0'),
          tax: parseFloat(invoice.tax || '0'),
          status: 'Paid',
          dueDate: invoice.duedate ? new Date(invoice.duedate) : now,
          paidDate: now,
          items: invoice.items?.item
            ? (Array.isArray(invoice.items.item)
              ? invoice.items.item
              : [invoice.items.item]
            ).map((item: any) => ({
              type: item.type || 'hosting',
              description: item.description || '',
              amount: parseFloat(item.amount || '0'),
            }))
            : [],
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: invoice.date ? new Date(invoice.date) : now,
        },
      },
      { upsert: true }
    );

    if (invoice.items?.item) {
      const items = Array.isArray(invoice.items.item)
        ? invoice.items.item
        : [invoice.items.item];
      const hostingOrdersCollection = await getHostingOrdersCollection();
      for (const item of items) {
        if (item.relid && item.type === 'hosting') {
          await hostingOrdersCollection.updateOne(
            { whmcsServiceId: Number(item.relid) },
            {
              $set: {
                status: 'Active',
                activatedAt: now,
                nextDueDate: invoice.duedate
                  ? new Date(invoice.duedate)
                  : undefined,
              },
            }
          );
        }
      }
    }

    revalidatePath('/dashboard/billing', 'page');

    return {
      success: true,
      message: 'Payment recorded successfully',
      transactionId: paymentIntentId,
    };
  } catch (error: any) {
    console.error('Record Stripe payment error:', error);
    return {
      success: false,
      error: error.message || 'Failed to record payment',
    };
  }
}

/**
 * Finalize a Stripe payment immediately after widget success.
 * This is a robust fallback in case webhooks are delayed/unavailable during local testing.
 */
export async function finalizeStripePaymentAction(params: {
  invoiceId: string | number;
  paymentIntentId: string;
}) {
  try {
    const userId = await getUserId();

    // Ensure invoice belongs to user & check status
    const invoiceResponse = await whmcsApi('GetInvoice', {
      invoiceid: params.invoiceId,
    });
    if (invoiceResponse.result !== 'success') {
      return { success: false, error: 'Invoice not found' };
    }
    if (String(invoiceResponse.userid) !== String(userId)) {
      return { success: false, error: 'Unauthorized' };
    }
    if (String(invoiceResponse.status || '').toLowerCase() === 'paid') {
      return { success: true, message: 'Invoice already paid' };
    }

    // Verify payment status on Stripe
    let paymentIntent = await retrievePaymentIntent(params.paymentIntentId);
    let status = String(paymentIntent.status || '').toLowerCase();

    // Poll if processing (wait up to 10s)
    let attempts = 0;
    while ((status === 'processing' || status === 'requires_action') && attempts < 5) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      paymentIntent = await retrievePaymentIntent(params.paymentIntentId);
      status = String(paymentIntent.status || '').toLowerCase();
      attempts++;
    }

    if (status !== 'succeeded') {
      return { success: false, error: `Payment not completed (status: ${status})` };
    }

    // Amount from Stripe is in cents - convert to major units
    const amountMajor = paymentIntent.amount / 100;

    const recorded = await recordInvoicePaymentFromStripe(
      params.invoiceId,
      params.paymentIntentId,
      amountMajor
    );

    // Best-effort: sync saved cards after a successful payment
    try {
      const { getClientsCollection } = await import('@/lib/db');
      const clientsCollection = await getClientsCollection();
      const clientDoc = await clientsCollection.findOne({
        whmcsId: Number(userId),
      });
      if (clientDoc?.stripeCustomerId) {
        const methods = await listPaymentMethods(
          clientDoc.stripeCustomerId
        );
        await clientsCollection.updateOne(
          { whmcsId: Number(userId) },
          {
            $set: {
              stripePaymentMethods: methods.map((m: any) => ({
                id: m.id,
                type: m.type,
                savedFor: 'MERCHANT',
                last4: m.card?.last4,
                brand: m.card?.brand,
                expiryMonth: m.card?.exp_month,
                expiryYear: m.card?.exp_year,
                cardholderName: m.billing_details?.name ?? undefined,
                createdAt: m.created?.toString(),
              })),
              stripePaymentMethodsLastSyncedAt: new Date(),
              updatedAt: new Date(),
            },
          }
        );
      }
    } catch {
      // ignore sync failures
    }

    if (!recorded.success) {
      // If webhook already recorded it, WHMCS may already be paid — re-check.
      const recheck = await whmcsApi('GetInvoice', {
        invoiceId: params.invoiceId,
      });
      if (
        recheck.result === 'success' &&
        String(recheck.status || '').toLowerCase() === 'paid'
      ) {
        return { success: true, message: 'Invoice paid' };
      }
      return { success: false, error: recorded.error || 'Failed to record payment' };
    }

    return { success: true, message: 'Invoice paid' };
  } catch (e: any) {
    console.error('❌ [invoice-actions] finalizeStripePaymentAction failed:', {
      invoiceId: params.invoiceId,
      message: e?.message,
      stack: e?.stack,
      error: e
    });
    return { success: false, error: e?.message || 'Finalize payment failed' };
  }
}

export async function getSavedCardsAction() {
  try {
    const userId = await getUserId();
    const { getClientsCollection } = await import('@/lib/db');
    const clientsCollection = await getClientsCollection();
    const clientDoc = await clientsCollection.findOne({ whmcsId: Number(userId) });
    if (!clientDoc?.stripeCustomerId) {
      return { success: true, cards: [], lastSyncedAt: null };
    }

    // Refresh from Stripe on-demand (best effort)
    const methods = await listPaymentMethods(clientDoc.stripeCustomerId);
    const cards = methods
      .filter((m: any) => m.type === 'card')
      .map((m: any) => ({
        id: m.id,
        last4: m.method_details?.last4,
        brand: m.method_details?.brand,
        expiryMonth: m.method_details?.expiry_month,
        expiryYear: m.method_details?.expiry_year,
        cardholderName: m.method_details?.cardholder_name,
        savedFor: 'MERCHANT',
      }));

    await clientsCollection.updateOne(
      { whmcsId: Number(userId) },
      {
        $set: {
          stripePaymentMethods: methods.map((m: any) => ({
            id: m.id,
            type: m.type,
            savedFor: 'MERCHANT',
            last4: m.method_details?.last4,
            brand: m.method_details?.brand,
            expiryMonth: m.method_details?.expiry_month,
            expiryYear: m.method_details?.expiry_year,
            cardholderName: m.method_details?.cardholder_name,
            createdAt: m.created_at,
          })),
          stripePaymentMethodsLastSyncedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return { success: true, cards, lastSyncedAt: new Date().toISOString() };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to load saved cards' };
  }
}

export async function createStripeAddCardSetupAction() {
  try {
    const userId = await getUserId();
    const clientResponse = await whmcsApi('GetClientsDetails', {
      clientid: userId,
      stats: false,
    });
    if (clientResponse.result !== 'success') {
      return { success: false, error: 'Failed to get user details' };
    }

    const userEmail = pickClientEmail(clientResponse);
    const userName = String(
      clientResponse?.client?.firstname
        ? `${clientResponse.client.firstname} ${clientResponse.client.lastname || ''}`.trim()
        : clientResponse?.client?.fullname || ''
    ).trim();
    if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      return { success: false, error: 'Invalid customer email' };
    }

    // Ensure stripeCustomerId exists - this is REQUIRED for saving cards
    const { getClientsCollection } = await import('@/lib/db');
    const clientsCollection = await getClientsCollection();
    const clientDoc = await clientsCollection.findOne({ whmcsId: Number(userId) });
    let stripeCustomerId = clientDoc?.stripeCustomerId;

    // Verify existing customer ID is still valid
    if (stripeCustomerId) {
      try {
        await retrieveStripeCustomer(stripeCustomerId);
      } catch {
        console.log('Stale Stripe customer ID, creating new one...');
        stripeCustomerId = undefined;
      }
    }

    // Create Stripe customer if not exists - REQUIRED for card saving
    if (!stripeCustomerId) {
      console.log('Creating new Stripe customer for user:', userId);
      const created = await createOrRetrieveStripeCustomer({
        email: userEmail,
        name: userName || undefined,
      });

      if (!created || !created.id) {
        return { success: false, error: 'Failed to create Stripe customer' };
      }

      stripeCustomerId = created.id;

      // Save customer ID to database
      await clientsCollection.updateOne(
        { whmcsId: Number(userId) },
        {
          $set: {
            stripeCustomerId,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      console.log('Created Stripe customer:', stripeCustomerId);
    }

    // Small verification payment (sandbox-friendly). This creates a saved card when user checks "save".
    // IMPORTANT: Customer ID is REQUIRED for saving cards
    const currency = 'USD';
    const amountMinor = 10; // $0.10

    // Build redirect URL for card save flow
    const headerList = await headers();
    const host = headerList.get('host') || 'localhost:3000';
    const protocol = /^localhost/.test(host) ? 'http' : 'https';
    const appUrl =
      process.env.REVOLUT_REDIRECT_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      `${protocol}://${host}`;
    const redirectUrl = `${appUrl}/dashboard/billing/payment-methods?card_added=success`;

    console.log('Creating Stripe SetupIntent for card save with customer:', stripeCustomerId);

    const setupIntent = await createSetupIntent({
      customerId: stripeCustomerId,
      metadata: {
        whmcsClientId: String(userId),
        purpose: 'add_card',
      },
    });

    if (!setupIntent || !setupIntent.id) {
      return { success: false, error: 'Failed to create setup intent' };
    }

    const env = process.env.NODE_ENV === 'production' ? 'prod' : 'sandbox';

    console.log('Stripe SetupIntent created:', setupIntent.id, 'client_secret:', setupIntent.client_secret);

    return {
      success: true,
      setupIntentId: setupIntent.id,
      clientSecret: setupIntent.client_secret,
      env,
      customerEmail: userEmail,
      customerName: userName || undefined,
      stripeCustomerId, // Include for debugging
    };
  } catch (e: any) {
    console.error('createStripeAddCardSetupAction error:', e);
    return { success: false, error: e?.message || 'Failed to start add card flow' };
  }
}

export async function finalizeStripeAddCardSetupAction(params: {
  setupIntentId: string;
}) {
  try {
    const userId = await getUserId();
    const { getClientsCollection } = await import('@/lib/db');
    const clientsCollection = await getClientsCollection();
    const clientDoc = await clientsCollection.findOne({ whmcsId: Number(userId) });
    if (!clientDoc?.stripeCustomerId) {
      return { success: false, error: 'Customer profile not found' };
    }

    const setupIntent = await retrieveSetupIntent(params.setupIntentId);
    const status = String(setupIntent.status || '').toLowerCase();
    if (status !== 'succeeded') {
      return { success: false, error: `Setup not completed (status: ${status})` };
    }

    const methods = await listPaymentMethods(clientDoc.stripeCustomerId);
    await clientsCollection.updateOne(
      { whmcsId: Number(userId) },
      {
        $set: {
          stripePaymentMethods: methods.map((m: any) => ({
            id: m.id,
            type: m.type,
            savedFor: 'MERCHANT',
            last4: m.card?.last4,
            brand: m.card?.brand,
            expiryMonth: m.card?.exp_month,
            expiryYear: m.card?.exp_year,
            cardholderName: m.billing_details?.name ?? undefined,
            createdAt: m.created?.toString(),
          })),
          stripePaymentMethodsLastSyncedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to finalize add card' };
  }
}

export async function deleteSavedCardAction(paymentMethodId: string) {
  try {
    const userId = await getUserId();
    const { getClientsCollection } = await import('@/lib/db');
    const clientsCollection = await getClientsCollection();
    const clientDoc = await clientsCollection.findOne({ whmcsId: Number(userId) });
    if (!clientDoc?.stripeCustomerId) {
      return { success: false, error: 'Customer profile not found' };
    }

    await detachPaymentMethod(paymentMethodId);

    // Refresh cache
    const methods = await listPaymentMethods(clientDoc.stripeCustomerId);

    // If deleted card was default, clear default
    const updateData: any = {
      stripePaymentMethods: methods.map((m: any) => ({
        id: m.id,
        type: m.type,
        savedFor: 'MERCHANT',
        last4: m.card?.last4,
        brand: m.card?.brand,
        expiryMonth: m.card?.exp_month,
        expiryYear: m.card?.exp_year,
        cardholderName: m.billing_details?.name ?? undefined,
        createdAt: m.created?.toString(),
      })),
      stripePaymentMethodsLastSyncedAt: new Date(),
      updatedAt: new Date(),
    };

    if (clientDoc.defaultPaymentMethodId === paymentMethodId) {
      updateData.defaultPaymentMethodId = null;
    }

    await clientsCollection.updateOne(
      { whmcsId: Number(userId) },
      { $set: updateData }
    );

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to delete card' };
  }
}

/**
 * Set a saved card as the default payment method for quick checkout
 */
export async function setDefaultCardAction(paymentMethodId: string) {
  try {
    const userId = await getUserId();
    const { getClientsCollection } = await import('@/lib/db');
    const clientsCollection = await getClientsCollection();
    const clientDoc = await clientsCollection.findOne({ whmcsId: Number(userId) });

    if (!clientDoc?.stripeCustomerId) {
      return { success: false, error: 'Customer profile not found' };
    }

    // Verify the payment method exists and belongs to this customer
    const methods = await listPaymentMethods(clientDoc.stripeCustomerId);
    const cardExists = methods.some(
      (m: any) => m.id === paymentMethodId && String(m.type).toUpperCase() === 'CARD'
    );

    if (!cardExists) {
      return { success: false, error: 'Card not found' };
    }

    await clientsCollection.updateOne(
      { whmcsId: Number(userId) },
      {
        $set: {
          defaultPaymentMethodId: paymentMethodId,
          updatedAt: new Date(),
        },
      }
    );

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to set default card' };
  }
}

/**
 * Get saved cards with default card indicator
 */
export async function getSavedCardsWithDefaultAction() {
  try {
    const userId = await getUserId();
    const { getClientsCollection } = await import('@/lib/db');
    const clientsCollection = await getClientsCollection();
    const clientDoc = await clientsCollection.findOne({ whmcsId: Number(userId) });

    if (!clientDoc?.stripeCustomerId) {
      return { success: true, cards: [], defaultCardId: null, lastSyncedAt: null };
    }

    // Refresh from Stripe on-demand (best effort)
    const methods = await listPaymentMethods(clientDoc.stripeCustomerId);
    const cards = methods
      .filter((m: any) => m.type === 'card')
      .map((m: any) => ({
        id: m.id,
        last4: m.card?.last4,
        brand: m.card?.brand,
        expiryMonth: m.card?.exp_month,
        expiryYear: m.card?.exp_year,
        cardholderName: m.billing_details?.name,
        savedFor: 'MERCHANT',
        isDefault: m.id === clientDoc.defaultPaymentMethodId,
      }))
      .sort((a, b) => {
        // Default card first, then by creation date
        if (a.isDefault) return -1;
        if (b.isDefault) return 1;
        return 0;
      });

    await clientsCollection.updateOne(
      { whmcsId: Number(userId) },
      {
        $set: {
          stripePaymentMethods: methods.map((m: any) => ({
            id: m.id,
            type: m.type,
            savedFor: 'MERCHANT',
            last4: m.card?.last4,
            brand: m.card?.brand,
            expiryMonth: m.card?.exp_month,
            expiryYear: m.card?.exp_year,
            cardholderName: m.billing_details?.name,
            createdAt: m.created,
          })),
          stripePaymentMethodsLastSyncedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return {
      success: true,
      cards,
      defaultCardId: clientDoc.defaultPaymentMethodId || null,
      lastSyncedAt: new Date().toISOString(),
    };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to load saved cards' };
  }
}

/**
 * Pay an invoice using a saved card (one-click checkout)
 */
export async function payWithSavedCardAction(params: {
  invoiceId: string | number;
  paymentMethodId: string;
  returnUrl?: string;
}) {
  try {
    const userId = await getUserId();

    // Verify invoice belongs to user
    const invoiceResponse = await whmcsApi('GetInvoice', {
      invoiceid: params.invoiceId,
    });

    if (invoiceResponse.result !== 'success') {
      return { success: false, error: 'Invoice not found' };
    }

    if (String(invoiceResponse.userid) !== String(userId)) {
      return { success: false, error: 'Unauthorized' };
    }

    if (String(invoiceResponse.status || '').toLowerCase() === 'paid') {
      return { success: false, error: 'Invoice is already paid' };
    }

    const amount = parseFloat(invoiceResponse.total || '0');
    if (amount <= 0) {
      return { success: false, error: 'Invalid invoice amount' };
    }

    // Get customer details
    const { getClientsCollection } = await import('@/lib/db');
    const clientsCollection = await getClientsCollection();
    const clientDoc = await clientsCollection.findOne({ whmcsId: Number(userId) });

    if (!clientDoc?.stripeCustomerId) {
      return { success: false, error: 'No saved cards found. Please add a card first.' };
    }

    // Verify the payment method exists
    const methods = await listPaymentMethods(clientDoc.stripeCustomerId);
    const card = methods.find(
      (m: any) => m.id === params.paymentMethodId && String(m.type).toUpperCase() === 'CARD'
    );

    if (!card) {
      return { success: false, error: 'Card not found or has been removed.' };
    }

    const currency = await pickInvoiceCurrencyCode(invoiceResponse, { client: clientDoc });
    const minorMultiplier = getCurrencyMinorUnitMultiplier(currency);
    const amountMinor = Math.round(amount * minorMultiplier);

    // Create order with saved payment method - use actual customer data
    const clientResponse = await whmcsApi('GetClientsDetails', {
      clientid: userId,
      stats: false,
    });
    const client = clientResponse?.client || {};

    const result = await createStripePaymentAction(params.invoiceId, {
      paymentMethodId: params.paymentMethodId,
      returnUrl: params.returnUrl,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      message: 'Payment initiated. Please complete the verification.',
    };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to process payment' };
  }
}

/**
 * Initiate payment for an invoice (Legacy - redirects to WHMCS)
 * Kept for backward compatibility
 */
export async function initiatePaymentAction(invoiceId: string | number) {
  try {
    await getUserId(); // Verify user is authenticated

    // Get payment URL from WHMCS
    const result = await getInvoicePaymentUrlAction(invoiceId);

    if (result.success) {
      return {
        success: true,
        paymentUrl: result.paymentUrl,
        message: 'Redirecting to payment page...',
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to initiate payment',
      };
    }
  } catch (error: any) {
    console.error('Initiate Payment Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to initiate payment',
    };
  }
}

/**
 * Get payment methods available for the client.
 * Stripe is the primary gateway with saved cards support.
 */
export async function getPaymentMethodsAction() {
  try {
    await getUserId();

    return {
      success: true,
      methods: [
        { id: 'stripe', name: 'Pay with Stripe (Card / Apple Pay / Google Pay)', enabled: true },
        { id: 'bank', name: 'Bank Transfer', enabled: true },
      ],
      message: 'Payment methods retrieved',
    };
  } catch (error: any) {
    console.error('Get Payment Methods Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get payment methods',
    };
  }
}

/**
 * Get payment history for invoices
 */
export async function getPaymentHistoryAction(invoiceId?: string | number) {
  try {
    const userId = await getUserId();

    // Get transactions/payments for the user
    // GetTransactions uses clientid, not userid
    const params: any = {
      clientid: userId,
      ...(invoiceId && { invoiceid: invoiceId }),
    };

    const response = await whmcsApi('GetTransactions', params);

    if (response.result === 'success') {
      const transactions = response.transactions?.transaction;
      const paymentList = Array.isArray(transactions)
        ? transactions
        : transactions
          ? [transactions]
          : [];

      return {
        success: true,
        data: paymentList,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to get payment history',
      };
    }
  } catch (error: any) {
    console.error('Get Payment History Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get payment history',
    };
  }
}

/**
 * Delete/Cancel an invoice
 * Uses WHMCS UpdateInvoice API to set status to Cancelled
 */
export async function deleteInvoiceAction(invoiceId: string | number) {
  try {
    const userId = await getUserId(); // Verify user is authenticated

    // First, verify the invoice belongs to the user
    const invoiceResponse = await whmcsApi('GetInvoice', {
      invoiceid: invoiceId,
    });

    if (invoiceResponse.result !== 'success') {
      return {
        success: false,
        error: 'Invoice not found',
      };
    }

    // Verify ownership
    if (String(invoiceResponse.userid) !== String(userId)) {
      return {
        success: false,
        error: 'Unauthorized: This invoice does not belong to you',
      };
    }

    // Check if invoice is already paid
    if (invoiceResponse.status?.toLowerCase() === 'paid') {
      return {
        success: false,
        error: 'Cannot delete a paid invoice',
      };
    }

    // Update invoice status to Cancelled in WHMCS
    const cancelResult = await whmcsApi('UpdateInvoice', {
      invoiceid: invoiceId,
      status: 'Cancelled',
    });

    if (cancelResult.result === 'success') {
      // Delete from MongoDB database
      const { getInvoicesCollection } = await import('@/lib/db');
      const invoicesCollection = await getInvoicesCollection();

      await invoicesCollection.deleteOne({
        whmcsInvoiceId: Number(invoiceId),
        clientId: Number(userId),
      });

      // Revalidate billing page
      revalidatePath('/dashboard/billing', 'page');

      return {
        success: true,
        message: 'Invoice cancelled successfully',
      };
    } else {
      return {
        success: false,
        error: cancelResult.message || 'Failed to cancel invoice',
      };
    }
  } catch (error: any) {
    console.error('Delete Invoice Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete invoice',
    };
  }
}
