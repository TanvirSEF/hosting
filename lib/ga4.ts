/**
 * GA4 E-Commerce Event Tracking
 *
 * Fires events through gtag (loaded by GTM container GTM-5TC3TR35).
 * Each helper constructs a properly typed GA4 ecommerce payload and pushes
 * it to the dataLayer / gtag queue.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface GA4Item {
  item_id: string;
  item_name: string;
  coupon?: string;
  price: number;
  quantity: number;
}

/** Optional user login info attached to events for ads conversion tracking. */
export interface GA4UserInfo {
  user_id?: string | number | null;
  user_email?: string | null;
  user_name?: string | null;
  user_phone?: string | null;
  user_address?: string | null;
  user_city?: string | null;
  user_country?: string | null;
}

export interface GA4AddToCartParams {
  currency: string;
  value: number;
  items: GA4Item[];
}

export interface GA4RemoveFromCartParams {
  currency: string;
  value: number;
  items: GA4Item[];
}

export interface GA4BeginCheckoutParams {
  currency: string;
  value: number;
  coupon?: string;
  items: GA4Item[];
}

export interface GA4AddPaymentInfoParams {
  currency: string;
  value: number;
  payment_type?: string;
  coupon?: string;
  items?: GA4Item[];
  user?: GA4UserInfo;
}

export interface GA4PaymentCompletedParams {
  currency: string;
  value: number;
  transaction_id: string;
  invoice_id?: string | number;
  payment_method?: string;
  items?: GA4Item[];
}

export interface GA4PurchaseParams {
  currency: string;
  value: number;
  coupon?: string;
  transaction_id: string;
  items: GA4Item[];
  user?: GA4UserInfo;
}

// ── Internal helper ────────────────────────────────────────────────────────

/**
 * Push an event to the dataLayer / gtag queue.
 * Works whether GTM has already loaded `gtag` or only the dataLayer exists.
 */
function pushEvent(eventName: string, params: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

  const w = window as any;

  // Use gtag() when available (GTM loads it).  This is the canonical way to
  // fire GA4 ecommerce events and avoids double-counting since gtag handles
  // the dataLayer push internally.
  if (typeof w.gtag === 'function') {
    w.gtag('event', eventName, params);
    return;
  }

  // Fallback: push directly to dataLayer if gtag hasn't initialised yet.
  w.dataLayer?.push({ ecommerce: null }); // clear previous ecommerce state
  w.dataLayer?.push({
    event: eventName,
    ecommerce: params,
  });
}

/** Strip null/undefined values so GA4 receives clean payloads. */
function cleanUserInfo(user?: GA4UserInfo): Record<string, unknown> {
  if (!user) return {};
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(user)) {
    if (value !== null && value !== undefined && value !== '') {
      result[key] = value;
    }
  }
  return result;
}

// ── Public helpers ─────────────────────────────────────────────────────────

/** Fire a GA4 `add_to_cart` event. */
export function trackAddToCart(params: GA4AddToCartParams) {
  pushEvent('add_to_cart', {
    currency: params.currency,
    value: params.value,
    items: params.items,
  });
}

/** Fire a GA4 `remove_from_cart` event. */
export function trackRemoveFromCart(params: GA4RemoveFromCartParams) {
  pushEvent('remove_from_cart', {
    currency: params.currency,
    value: params.value,
    items: params.items,
  });
}

/** Fire a GA4 `begin_checkout` event. */
export function trackBeginCheckout(params: GA4BeginCheckoutParams) {
  pushEvent('begin_checkout', {
    currency: params.currency,
    value: params.value,
    coupon: params.coupon || undefined,
    items: params.items,
  });
}

/** Fire a GA4 `add_payment_info` event (with user login info, NOT card details). */
export function trackAddPaymentInfo(params: GA4AddPaymentInfoParams) {
  pushEvent('add_payment_info', {
    currency: params.currency,
    value: params.value,
    payment_type: params.payment_type || undefined,
    coupon: params.coupon || undefined,
    items: params.items || [],
    ...cleanUserInfo(params.user),
  });
}

/** Fire a custom `payment_completed` event when Stripe payment succeeds. */
export function trackPaymentCompleted(params: GA4PaymentCompletedParams) {
  pushEvent('payment_completed', {
    currency: params.currency,
    value: params.value,
    transaction_id: params.transaction_id,
    invoice_id: params.invoice_id || undefined,
    payment_method: params.payment_method || undefined,
    items: params.items || [],
  });
}

/** Fire a GA4 `purchase` event (with optional user login info). */
export function trackPurchase(params: GA4PurchaseParams) {
  pushEvent('purchase', {
    currency: params.currency,
    value: params.value,
    coupon: params.coupon || undefined,
    transaction_id: params.transaction_id,
    items: params.items,
    ...cleanUserInfo(params.user),
  });
}
