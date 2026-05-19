import Stripe from 'stripe';

const DEFAULT_API_VERSION = '2024-06-20';

// Initialize Stripe with secret key
function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable');
  }
  return new Stripe(secretKey, {
    apiVersion: (process.env.STRIPE_API_VERSION || DEFAULT_API_VERSION) as Stripe.LatestApiVersion,
  });
}

// -------------------------
// Stripe Types
// -------------------------

export type StripePaymentIntent = Stripe.PaymentIntent;
export type StripeCustomer = Stripe.Customer;
export type StripePaymentMethod = Stripe.PaymentMethod;

// -------------------------
// Currency Helpers
// -------------------------

export function getCurrencyMinorUnitMultiplier(currencyCode: string): number {
  const code = String(currencyCode || 'USD').toUpperCase().trim();
  
  // Stripe expects the amount in the smallest currency unit (e.g., cents for USD).
  // Most currencies have 2 decimal places (multiplier 100).
  // Some have 0 (multiplier 1) and some have 3 (multiplier 1000).
  
  // ISO 4217: zero-decimal currencies
  const zeroDecimal = new Set([
    'BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
  ]);
  
  // ISO 4217: three-decimal currencies
  const threeDecimal = new Set([
    'BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND'
  ]);

  if (zeroDecimal.has(code)) return 1;
  if (threeDecimal.has(code)) return 1000;
  return 100;
}


// -------------------------
// Customer Management
// -------------------------

/**
 * Create or retrieve a Stripe customer
 */
export async function createOrRetrieveStripeCustomer(params: {
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
}): Promise<StripeCustomer> {
  const stripe = getStripeClient();

  // Search for existing customer by email
  const customers = await stripe.customers.list({
    email: params.email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0];
  }

  // Create new customer
  return await stripe.customers.create({
    email: params.email,
    name: params.name || undefined,
    phone: params.phone || undefined,
    metadata: params.metadata,
  });
}

/**
 * Retrieve a Stripe customer by ID
 */
export async function retrieveStripeCustomer(customerId: string): Promise<StripeCustomer | null> {
  try {
    const stripe = getStripeClient();
    return await stripe.customers.retrieve(customerId) as StripeCustomer;
  } catch {
    return null;
  }
}

/**
 * Update a Stripe customer
 */
export async function updateStripeCustomer(
  customerId: string,
  params: Stripe.CustomerUpdateParams
): Promise<StripeCustomer> {
  const stripe = getStripeClient();
  return await stripe.customers.update(customerId, params);
}

// -------------------------
// Payment Intents
// -------------------------

/**
 * Create a PaymentIntent for invoice payment
 */
export async function createPaymentIntent(params: {
  amount: number;
  currency: string;
  customerId: string;
  description?: string;
  metadata?: Record<string, string>;
  paymentMethodId?: string;
  savePaymentMethod?: boolean;
  returnUrl?: string;
}): Promise<StripePaymentIntent> {
  const stripe = getStripeClient();

  // Convert amount to the smallest currency unit
  const multiplier = getCurrencyMinorUnitMultiplier(params.currency);
  const amountInSmallestUnit = Math.round(params.amount * multiplier);

  const paymentIntentData: Stripe.PaymentIntentCreateParams = {
    amount: amountInSmallestUnit,
    currency: params.currency.toLowerCase(),
    customer: params.customerId,
    description: params.description,
    metadata: params.metadata,
    payment_method_types: ['card'],
    payment_method: params.paymentMethodId,
    // Only set setup_future_usage if we are saving a NEW card. 
    // If we're using a saved card (paymentMethodId present), we don't need this.
    setup_future_usage: (params.savePaymentMethod && !params.paymentMethodId) ? 'off_session' : undefined,
    confirm: params.paymentMethodId ? true : undefined,
    return_url: params.paymentMethodId ? params.returnUrl : undefined,
  };

  return await stripe.paymentIntents.create(paymentIntentData);
}

/**
 * Retrieve a PaymentIntent
 */
export async function retrievePaymentIntent(paymentIntentId: string): Promise<StripePaymentIntent> {
  const stripe = getStripeClient();
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Confirm a PaymentIntent
 */
export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId?: string
): Promise<StripePaymentIntent> {
  const stripe = getStripeClient();
  return await stripe.paymentIntents.confirm(paymentIntentId, {
    payment_method: paymentMethodId,
  });
}

// -------------------------
// Payment Methods
// -------------------------

/**
 * List payment methods for a customer
 */
export async function listPaymentMethods(
  customerId: string,
  type: Stripe.PaymentMethodListParams.Type = 'card'
): Promise<StripePaymentMethod[]> {
  const stripe = getStripeClient();
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type,
  });
  return paymentMethods.data;
}

/**
 * Retrieve a payment method
 */
export async function retrievePaymentMethod(paymentMethodId: string): Promise<StripePaymentMethod> {
  const stripe = getStripeClient();
  return await stripe.paymentMethods.retrieve(paymentMethodId);
}

/**
 * Detach a payment method from a customer
 */
export async function detachPaymentMethod(paymentMethodId: string): Promise<StripePaymentMethod> {
  const stripe = getStripeClient();
  return await stripe.paymentMethods.detach(paymentMethodId);
}

/**
 * Set default payment method for a customer
 */
export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<StripeCustomer> {
  const stripe = getStripeClient();
  return await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
}

// -------------------------
// Setup Intents (for saving cards)
// -------------------------

/**
 * Create a SetupIntent for saving a card
 */
export async function createSetupIntent(params: {
  customerId: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.SetupIntent> {
  const stripe = getStripeClient();
  return await stripe.setupIntents.create({
    customer: params.customerId,
    usage: 'off_session',
    metadata: params.metadata,
    payment_method_types: ['card'],
  });
}

/**
 * Retrieve a SetupIntent
 */
export async function retrieveSetupIntent(setupIntentId: string): Promise<Stripe.SetupIntent> {
  const stripe = getStripeClient();
  return await stripe.setupIntents.retrieve(setupIntentId);
}

// -------------------------
// Webhook Verification
// -------------------------

/**
 * Verify Stripe webhook signature
 */
export function verifyStripeWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

// -------------------------
// Checkout Sessions (for hosted checkout)
// -------------------------

/**
 * Create a Checkout Session for invoice payment
 */
export async function createCheckoutSession(params: {
  amount: number;
  currency: string;
  customerId: string;
  invoiceId: string;
  description?: string;
  successUrl: string;
  cancelUrl: string;
  savePaymentMethod?: boolean;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();

  const amountInSmallestUnit = Math.round(params.amount * 100);

  const sessionData: Stripe.Checkout.SessionCreateParams = {
    customer: params.customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: {
            name: params.description || `Invoice #${params.invoiceId}`,
          },
          unit_amount: amountInSmallestUnit,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      invoiceId: params.invoiceId,
    },
  };

  // If saving payment method, use payment mode with setup
  if (params.savePaymentMethod) {
    sessionData.payment_intent_data = {
      setup_future_usage: 'off_session',
    };
  }

  return await stripe.checkout.sessions.create(sessionData);
}

/**
 * Retrieve a Checkout Session
 */
export async function retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();
  return await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent'],
  });
}

export { getStripeClient };
