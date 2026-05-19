'use server';

import { whmcsApi } from '@/lib/whmcs';
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
} from '@/lib/stripe';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { activateEmailServiceAction } from '@/actions/email-bundle-actions';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

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

function pickInvoiceCurrencyCode(invoice: any, clientResponse: any): string {
  const fromInvoice =
    invoice?.currencycode || invoice?.currencyCode || invoice?.currency;
  const fromClient = clientResponse?.client?.currencycode;
  const raw = String(fromInvoice || fromClient || 'USD').toUpperCase().trim();
  return /^[A-Z]{3}$/.test(raw) ? raw : 'USD';
}

function pickClientEmail(clientResponse: any): string {
  const email = clientResponse?.client?.email || clientResponse?.email || '';
  return String(email).trim();
}

/**
 * Create Stripe PaymentIntent for invoice
 */
export async function createStripePaymentIntentAction(
  invoiceId: string | number,
  options?: {
    savePaymentMethod?: boolean;
    paymentMethodId?: string;
    useCheckoutSession?: boolean;
    successUrl?: string;
    cancelUrl?: string;
  }
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
    const currency = pickInvoiceCurrencyCode(invoice, clientResponse);
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
      paymentMethodId: options?.paymentMethodId,
      savePaymentMethod: options?.savePaymentMethod,
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
    console.error('Create Stripe payment intent error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create payment session',
    };
  }
}

/**
 * Record Stripe payment in WHMCS and MongoDB
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

    // Accept the order after successful payment to activate services/domains
    // This is the correct place to call AcceptOrder - only after payment confirmation
    if (invoice.orderid) {
      try {
        const acceptResponse = await whmcsApi('AcceptOrder', {
          orderid: invoice.orderid,
        });

        if (acceptResponse.result === 'success') {
          console.log(`[Payment Success] Order ${invoice.orderid} accepted, services/domains activated`);
        } else {
          console.warn(`[Payment Success] AcceptOrder failed for order ${invoice.orderid}:`, acceptResponse.message);
        }
      } catch (acceptError: any) {
        // Log but don't fail - payment is recorded, WHMCS may auto-accept based on config
        console.warn('[Payment Success] AcceptOrder error:', acceptError.message);
      }
    }

    // Update MongoDB
    const { getInvoicesCollection, getHostingOrdersCollection } = await import('@/lib/db');
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

    // Update hosting orders
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

          // Activate associated email service
          await activateEmailServiceAction(Number(item.relid));
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
 * Get saved cards for user
 */
export async function getSavedCardsAction() {
  try {
    const userId = await getUserId();
    const { getClientsCollection } = await import('@/lib/db');
    const clientsCollection = await getClientsCollection();
    const clientDoc = await clientsCollection.findOne({ whmcsId: Number(userId) });

    if (!clientDoc?.stripeCustomerId) {
      return { success: true, cards: [], defaultCardId: null, lastSyncedAt: null };
    }

    // Refresh from Stripe
    const methods = await listPaymentMethods(clientDoc.stripeCustomerId, 'card');
    const cards = methods.map((m) => ({
      id: m.id,
      last4: m.card?.last4,
      brand: m.card?.brand,
      expiryMonth: m.card?.exp_month,
      expiryYear: m.card?.exp_year,
      cardholderName: m.billing_details?.name,
      isDefault: m.id === clientDoc.defaultPaymentMethodId,
    })).sort((a, b) => (a.isDefault ? -1 : b.isDefault ? 1 : 0));

    // Update cache
    await clientsCollection.updateOne(
      { whmcsId: Number(userId) },
      {
        $set: {
          stripePaymentMethods: methods.map((m) => ({
            id: m.id,
            type: m.type,
            last4: m.card?.last4,
            brand: m.card?.brand,
            expiryMonth: m.card?.exp_month,
            expiryYear: m.card?.exp_year,
            cardholderName: m.billing_details?.name ?? undefined,
          })),
          stripePaymentMethodsLastSyncedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return { success: true, cards, defaultCardId: clientDoc.defaultPaymentMethodId || null, lastSyncedAt: new Date().toISOString() };
  } catch (e: any) {
    console.error('Get saved cards error:', e);
    return { success: false, error: e?.message || 'Failed to load saved cards' };
  }
}

/**
 * Create SetupIntent for adding a card
 */
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

    // Get or create Stripe customer
    const { getClientsCollection } = await import('@/lib/db');
    const clientsCollection = await getClientsCollection();
    const clientDoc = await clientsCollection.findOne({ whmcsId: Number(userId) });

    let stripeCustomerId = clientDoc?.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await createOrRetrieveStripeCustomer({
        email: userEmail,
        name: userName || undefined,
      });
      stripeCustomerId = customer.id;
      await clientsCollection.updateOne(
        { whmcsId: Number(userId) },
        {
          $set: {
            stripeCustomerId,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    const setupIntent = await createSetupIntent({
      customerId: stripeCustomerId,
      metadata: {
        whmcsClientId: String(userId),
        purpose: 'add_card',
      },
    });

    return {
      success: true,
      clientSecret: setupIntent.client_secret,
      customerId: stripeCustomerId,
    };
  } catch (e: any) {
    console.error('Create Stripe add card setup error:', e);
    return { success: false, error: e?.message || 'Failed to start add card flow' };
  }
}

/**
 * Delete a saved card
 */
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
    const methods = await listPaymentMethods(clientDoc.stripeCustomerId, 'card');

    const updateData: any = {
      stripePaymentMethods: methods.map((m) => ({
        id: m.id,
        type: m.type,
        last4: m.card?.last4,
        brand: m.card?.brand,
        expiryMonth: m.card?.exp_month,
        expiryYear: m.card?.exp_year,
        cardholderName: m.billing_details?.name,
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
    console.error('Delete saved card error:', e);
    return { success: false, error: e?.message || 'Failed to delete card' };
  }
}

/**
 * Set default payment method
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

    // Verify payment method exists
    const methods = await listPaymentMethods(clientDoc.stripeCustomerId, 'card');
    const cardExists = methods.some((m) => m.id === paymentMethodId);

    if (!cardExists) {
      return { success: false, error: 'Card not found' };
    }

    await setDefaultPaymentMethod(clientDoc.stripeCustomerId, paymentMethodId);

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
    console.error('Set default card error:', e);
    return { success: false, error: e?.message || 'Failed to set default card' };
  }
}

/**
 * Pay invoice with saved card
 */
export async function payWithSavedCardAction(params: {
  invoiceId: string | number;
  paymentMethodId: string;
}) {
  try {
    const userId = await getUserId();

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

    const { getClientsCollection } = await import('@/lib/db');
    const clientsCollection = await getClientsCollection();
    const clientDoc = await clientsCollection.findOne({ whmcsId: Number(userId) });

    if (!clientDoc?.stripeCustomerId) {
      return { success: false, error: 'No saved cards found. Please add a card first.' };
    }

    const result = await createStripePaymentIntentAction(params.invoiceId, {
      paymentMethodId: params.paymentMethodId,
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
    console.error('Pay with saved card error:', e);
    return { success: false, error: e?.message || 'Failed to process payment' };
  }
}

/**
 * Verify and finalize payment
 */
export async function finalizeStripePaymentAction(params: {
  invoiceId: string | number;
  paymentIntentId: string;
}) {
  try {
    const userId = await getUserId();

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

    // Verify payment intent status
    const paymentIntent = await retrievePaymentIntent(params.paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return { success: false, error: `Payment not completed (status: ${paymentIntent.status})` };
    }

    const amount = paymentIntent.amount / 100;

    const recorded = await recordInvoicePaymentFromStripe(
      params.invoiceId,
      params.paymentIntentId,
      amount
    );

    if (!recorded.success) {
      // Re-check if already paid
      const recheck = await whmcsApi('GetInvoice', {
        invoiceid: params.invoiceId,
      });
      if (
        recheck.result === 'success' &&
        String(recheck.status || '').toLowerCase() === 'paid'
      ) {
        return { success: true, message: 'Invoice paid' };
      }
      return { success: false, error: recorded.error || 'Failed to record payment' };
    }

    // Sync saved cards
    try {
      const { getClientsCollection } = await import('@/lib/db');
      const clientsCollection = await getClientsCollection();
      const clientDoc = await clientsCollection.findOne({ whmcsId: Number(userId) });
      if (clientDoc?.stripeCustomerId) {
        const methods = await listPaymentMethods(clientDoc.stripeCustomerId, 'card');
        await clientsCollection.updateOne(
          { whmcsId: Number(userId) },
          {
            $set: {
              stripePaymentMethods: methods.map((m) => ({
                id: m.id,
                type: m.type,
                last4: m.card?.last4,
                brand: m.card?.brand,
                expiryMonth: m.card?.exp_month,
                expiryYear: m.card?.exp_year,
                cardholderName: m.billing_details?.name ?? undefined,
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

    return { success: true, message: 'Invoice paid' };
  } catch (e: any) {
    console.error('Finalize Stripe payment error:', e);
    return { success: false, error: e?.message || 'Finalize payment failed' };
  }
}
