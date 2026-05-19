'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useCart, getItemId } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getProductDetailsAction, calculateHostingPriceAction, getTaxRatesAction, validatePromoCodeAction, checkProductFreeDomainAction } from '@/actions/hosting-actions';
import { checkUserLoginStatus, getUserFullProfile, calculateDomainPrice } from '@/actions/domain-order-actions';
import { detectCountryFromIP } from '@/actions/geolocation-actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Globe, Server, Loader2, ShoppingCart, Tag, X, AlertTriangle, Trash2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import DomainConfig from '@/components/order/DomainConfig';
import AddonSelection from '@/components/order/AddonSelection';
import { trackBeginCheckout, trackRemoveFromCart } from '@/lib/ga4';

/** WHMCS billing cycle keys — used to filter out setup fees and formatting keys */
const BILLING_CYCLES = [
  'monthly', 'quarterly', 'semiannually', 'annually', 'biennially', 'triennially',
] as const;

interface HostingItemState {
  product: any;
  billingCycle: string;
  pricing: any;
  domainConfig: any;
  selectedAddons: any[];
  freeDomainInfo: any;
  loading: boolean;
  showDetails: boolean;
}

function CheckoutContent() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { cart, removeFromCart, updateCartItem, clearCart, isLoaded } = useCart();
  const { formatPrice, currency } = useCurrency();

  const [hostingStates, setHostingStates] = useState<Map<string, HostingItemState>>(new Map());
  const [taxRates, setTaxRates] = useState<any>({ taxrate: 0, taxrate2: 0, taxname: 'VAT', taxname2: '' });
  const [userCountry, setUserCountry] = useState('');
  const [countryDetected, setCountryDetected] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<any>(null);

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; type: string; value: number; description: string } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');

  const [ordering, setOrdering] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const domainItems = cart.filter((item) => item.type === 'domain');
  const hostingItems = cart.filter((item) => item.type === 'hosting');

  // Redirect if cart is empty
  useEffect(() => {
    if (isLoaded && cart.length === 0) {
      router.replace(`/${locale}`);
    }
  }, [isLoaded, cart.length, locale, router]);

  // Check login
  useEffect(() => {
    const check = async () => {
      try {
        const result = await checkUserLoginStatus();
        setIsLoggedIn(result.isLoggedIn);
      } catch {
        setIsLoggedIn(false);
      }
    };
    check();
  }, []);

  // Detect country for tax
  useEffect(() => {
    const detect = async () => {
      try {
        // Pass the client's browser timezone so the server can use it as a
        // fallback when IP-based geolocation (Cloudflare / Vercel headers) is
        // unavailable.  Without this the server falls back to its own timezone,
        // which may not match the user's actual location.
        const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const result = await detectCountryFromIP(clientTimezone);
        if (result.country) {
          setUserCountry(result.country);
          setDetectedLocation(result);
        }
        setCountryDetected(true);
      } catch {
        setCountryDetected(true);
      }
    };
    detect();
  }, []);

  // Fetch tax rates
  useEffect(() => {
    const fetchTax = async () => {
      if (!userCountry) return;
      const result = await getTaxRatesAction(userCountry);
      if (result.success && result.data) {
        setTaxRates(result.data);
      }
    };
    fetchTax();
  }, [userCountry]);

  // Load hosting product details (initial load only — currency re-pricing is handled separately)
  useEffect(() => {
    const loadProducts = async () => {
      const newStates = new Map(hostingStates);

      for (const item of hostingItems) {
        const itemId = getItemId(item as any);
        if (!newStates.has(itemId)) {
          newStates.set(itemId, {
            product: null,
            billingCycle: (item as any).billingCycle || 'annually',
            pricing: null,
            domainConfig: (item as any).domainConfig || null,
            selectedAddons: [],
            freeDomainInfo: null,
            loading: true,
            showDetails: false,
          });

          // Fetch product details
          try {
            const result = await getProductDetailsAction((item as any).productId, locale, currency);
            if (result.success && result.data) {
              const state = newStates.get(itemId)!;
              state.product = result.data;
              state.loading = false;

              // Calculate initial price
              const priceResult = await calculateHostingPriceAction(
                result.data.id,
                state.billingCycle,
                [],
                currency
              );
              if (priceResult.success && priceResult.data) {
                state.pricing = priceResult.data;
              }

              // Update cart item price
              updateCartItem(itemId, { price: priceResult.data?.total || (item as any).price } as any);
            } else {
              const state = newStates.get(itemId)!;
              state.loading = false;
            }
          } catch {
            const state = newStates.get(itemId)!;
            state.loading = false;
          }
        }
      }

      setHostingStates(newStates);
    };

    if (hostingItems.length > 0) {
      loadProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostingItems.length, locale]);

  // Re-price ALL items (domain + hosting) when currency changes
  useEffect(() => {
    const recalculate = async () => {
      // 1. Re-price domain items
      for (const item of cart.filter((i) => i.type === 'domain')) {
        const itemId = getItemId(item);
        const result = await calculateDomainPrice(
          (item as any).domain, item.regPeriod, currency
        );
        if (result.success && result.data) {
          updateCartItem(itemId, { price: result.data.totalPrice });
        }
      }

      // 2. Re-price hosting items — update both cart item AND hostingStates
      //    (hostingStates.pricing is used directly in the UI, so it must be refreshed)
      const updatedStates = new Map(hostingStates);
      let hostingChanged = false;
      for (const item of hostingItems) {
        const itemId = getItemId(item as any);
        const state = updatedStates.get(itemId);
        if (state?.product) {
          try {
            const priceResult = await calculateHostingPriceAction(
              state.product.id,
              state.billingCycle,
              [],
              currency
            );
            if (priceResult.success && priceResult.data) {
              updatedStates.set(itemId, { ...state, pricing: priceResult.data });
              updateCartItem(itemId, { price: priceResult.data.total } as any);
              hostingChanged = true;
            }
          } catch {
            // individual item failure — skip silently
          }
        }
      }
      if (hostingChanged) {
        setHostingStates(updatedStates);
      }
    };
    if (cart.length > 0 && isLoaded) recalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]);

  const handleDomainConfiguredRef = useRef<(itemId: string, config: any) => void>(null!);
  const handleFreeDomainInfoRef = useRef<(itemId: string, info: any) => void>(null!);
  const handleAddonChangeRef = useRef<(itemId: string, addons: any[]) => void>(null!);

  handleDomainConfiguredRef.current = (itemId: string, config: any) => {
    const state = hostingStates.get(itemId);
    if (!state) return;
    setHostingStates(new Map(hostingStates.set(itemId, { ...state, domainConfig: config })));
  };

  handleFreeDomainInfoRef.current = (itemId: string, info: any) => {
    const state = hostingStates.get(itemId);
    if (!state) return;
    setHostingStates(new Map(hostingStates.set(itemId, { ...state, freeDomainInfo: info })));
  };

  handleAddonChangeRef.current = (itemId: string, addons: any[]) => {
    const state = hostingStates.get(itemId);
    if (!state) return;
    setHostingStates(new Map(hostingStates.set(itemId, { ...state, selectedAddons: addons })));
  };

  const stableHandleFreeDomainInfo = useCallback((info: any) => {
    // Find which hosting item this belongs to based on the calling context
    // We use a per-item stable wrapper approach
  }, []);

  // Create stable callback wrappers per hosting item
  const domainConfigCallbacks = useRef<Map<string, { onDomainConfigured: (config: any) => void; onFreeDomainInfo: (info: any) => void; onAddonChange: (addons: any[]) => void }>>(new Map());

  const getItemCallbacks = useCallback((itemId: string) => {
    if (!domainConfigCallbacks.current.has(itemId)) {
      domainConfigCallbacks.current.set(itemId, {
        onDomainConfigured: (config: any) => handleDomainConfiguredRef.current?.(itemId, config),
        onFreeDomainInfo: (info: any) => handleFreeDomainInfoRef.current?.(itemId, info),
        onAddonChange: (addons: any[]) => handleAddonChangeRef.current?.(itemId, addons),
      });
    }
    return domainConfigCallbacks.current.get(itemId)!;
  }, []);

  const handleBillingCycleChange = async (itemId: string, newCycle: string) => {
    const state = hostingStates.get(itemId);
    if (!state?.product) return;

    const priceResult = await calculateHostingPriceAction(
      state.product.id,
      newCycle,
      state.selectedAddons.map((a) => ({ id: a.id, value: a.selectedCycle || a.cycle || 'monthly' })),
      currency
    );

    const updatedState = { ...state, billingCycle: newCycle, pricing: priceResult.data };
    setHostingStates(new Map(hostingStates.set(itemId, updatedState)));
    updateCartItem(itemId, { billingCycle: newCycle, price: priceResult.data?.total || state.pricing?.total || 0 } as any);
  };

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      const firstHosting = hostingItems[0] as any;
      const result = await validatePromoCodeAction(
        promoCodeInput,
        firstHosting?.productId,
        hostingStates.get(getItemId(firstHosting))?.billingCycle || 'annually'
      );
      if (result.success && result.data) {
        setAppliedPromo(result.data as any);
        setPromoError('');
        toast.success(`Promo code "${result.data.code}" applied`);
      } else {
        setPromoError((result as any).error || 'Invalid promo code');
        setAppliedPromo(null);
      }
    } catch {
      setPromoError('Failed to validate promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  // Calculate totals
  const domainSubtotal = domainItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const hostingSubtotal = hostingItems.reduce((sum, item) => {
    const itemId = getItemId(item as any);
    const state = hostingStates.get(itemId);
    const addonsTotal = state?.selectedAddons?.reduce((acc: number, a: any) => acc + (parseFloat(a.price) || 0), 0) || 0;
    const domainPrice = state?.domainConfig?.price || 0;
    return sum + (state?.pricing?.total || item.price || 0) + addonsTotal + domainPrice;
  }, 0);
  const subtotal = domainSubtotal + hostingSubtotal;

  const promoDiscount = appliedPromo
    ? appliedPromo.type === 'percentage'
      ? subtotal * (appliedPromo.value / 100)
      : Math.min(appliedPromo.value, subtotal)
    : 0;

  const afterDiscount = Math.max(0, subtotal - promoDiscount);
  const tax1 = afterDiscount * (taxRates.taxrate / 100);
  const tax2 = afterDiscount * (taxRates.taxrate2 / 100);
  const total = afterDiscount + tax1 + tax2;

  const handleCheckout = async () => {
    setOrdering(true);

    try {
      const loginStatus = await checkUserLoginStatus();
      let userProfile = null;
      if (loginStatus.isLoggedIn) {
        try { userProfile = await getUserFullProfile(); } catch {}
      }

      // GTM DataLayer
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: 'proceed_to_checkout',
          user_id: loginStatus.userId || null,
          user_email: loginStatus.userEmail || null,
          user_name: loginStatus.userName || null,
        });
      }

      // GA4 begin_checkout event
      trackBeginCheckout({
        currency,
        value: total,
        coupon: appliedPromo?.code || undefined,
        items: cart.map((item) => ({
          item_id: getItemId(item),
          item_name: item.type === 'domain' ? (item as any).domain : (item as any).productName,
          price: item.price,
          quantity: item.type === 'domain' ? (item as any).regPeriod : 1,
        })),
      });

      // Build hosting configurations
      const hostingConfigs = hostingItems.map((item) => {
        const itemId = getItemId(item as any);
        const state = hostingStates.get(itemId);
        return {
          cartItemId: itemId,
          billingCycle: state?.billingCycle || (item as any).billingCycle || 'annually',
          domainConfig: state?.domainConfig || (item as any).domainConfig || null,
          addons: state?.selectedAddons || [],
        };
      });

      const checkoutTaxAmount = tax1 + tax2;

      const pendingOrder = {
        type: 'unified',
        items: cart,
        hostingConfigs,
        promoCode: appliedPromo?.code || '',
        currency,
        country: userCountry,
        state: detectedLocation?.region,
        taxRates: { taxrate: taxRates.taxrate, taxrate2: taxRates.taxrate2 },
        checkoutTaxRate: taxRates.taxrate,
        checkoutTaxAmount,
      };

      localStorage.setItem('pendingUnifiedOrder', JSON.stringify(pendingOrder));

      if (loginStatus.isLoggedIn) {
        router.push('/dashboard/processing');
      } else {
        toast.info('Please create an account or login to continue');
        router.push(`/${locale}/register`);
      }
    } catch (error) {
      toast.error('Failed to prepare order. Please try again.');
    } finally {
      setOrdering(false);
    }
  };

  if (!isLoaded || cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#8C52FF]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Complete Your Order</h1>
            <p className="text-gray-600">Review your items and configure your services</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Currency lock warning */}
              {isLoggedIn === false && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800">Current currency is <span className="font-bold">{currency}</span></p>
                    <p className="text-amber-700 mt-1">This will be set as the default in your profile.</p>
                  </div>
                </div>
              )}

              {/* Domain Items */}
              {domainItems.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#8C52FF]" />
                    Domain{domainItems.length > 1 ? 's' : ''} ({domainItems.length})
                  </h2>
                  {domainItems.map((item) => {
                    const itemId = getItemId(item);
                    return (
                      <Card key={itemId} className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-purple-100">
                              <Globe className="h-5 w-5 text-[#8C52FF]" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">{item.domain}</h4>
                              <p className="text-sm text-gray-500">
                                {item.regPeriod} {item.regPeriod === 1 ? 'year' : 'years'} registration
                              </p>
                              {item.addons && item.addons.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.addons.map((addon, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs bg-purple-50 text-purple-700">
                                      {addon.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-dm-sans text-lg font-bold text-[#8C52FF]">{formatPrice(item.price)}</span>
                            <button
                              onClick={() => {
                                trackRemoveFromCart({
                                  currency,
                                  value: item.price,
                                  items: [{
                                    item_id: itemId,
                                    item_name: item.domain,
                                    price: item.price,
                                    quantity: item.regPeriod,
                                  }],
                                });
                                removeFromCart(itemId);
                                toast.success(`${item.domain} removed`);
                              }}
                              className="rounded-full p-1.5 transition-colors hover:bg-red-100"
                            >
                              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                            </button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Hosting Items */}
              {hostingItems.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Server className="w-5 h-5 text-blue-600" />
                    Hosting Services ({hostingItems.length})
                  </h2>
                  {hostingItems.map((item) => {
                    const hostingItem = item as any;
                    const itemId = getItemId(item);
                    const state = hostingStates.get(itemId);
                    const isExpanded = state?.showDetails ?? false;
                    const itemCallbacks = getItemCallbacks(itemId);

                    return (
                      <Card key={itemId} className="overflow-hidden">
                        <div className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-blue-100">
                                <Server className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-semibold text-gray-900 truncate">{hostingItem.productName}</h4>
                                {state?.product?.tagline && (
                                  <p className="text-sm text-gray-500">{state.product.tagline}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-dm-sans text-lg font-bold text-[#8C52FF]">
                                {formatPrice(state?.pricing?.total || hostingItem.price)}
                              </span>
                              <button onClick={() => {
                                trackRemoveFromCart({
                                  currency,
                                  value: state?.pricing?.total || hostingItem.price,
                                  items: [{
                                    item_id: itemId,
                                    item_name: hostingItem.productName,
                                    price: state?.pricing?.total || hostingItem.price,
                                    quantity: 1,
                                  }],
                                });
                                removeFromCart(itemId);
                              }} className="rounded-full p-1.5 transition-colors hover:bg-red-100">
                                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                              </button>
                            </div>
                          </div>

                          {/* Expand/collapse toggle */}
                          <button
                            onClick={() => {
                              const updated = new Map(hostingStates);
                              const current = updated.get(itemId);
                              if (current) {
                                updated.set(itemId, { ...current, showDetails: !current.showDetails });
                                setHostingStates(updated);
                              }
                            }}
                            className="flex items-center gap-1 mt-3 text-sm text-[#8C52FF] hover:text-[#7b42ff] font-medium"
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            {isExpanded ? 'Hide configuration' : 'Configure this service'}
                          </button>
                        </div>

                        {/* Expanded configuration */}
                        {isExpanded && (
                          <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50/50">
                            {state?.loading ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-[#8C52FF]" />
                              </div>
                            ) : (
                              <>
                                {/* Product features */}
                                {state?.product?.features?.length > 0 && (
                                  <div>
                                    <ul className="space-y-1.5">
                                      {state!.product.features.map((f: string, i: number) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                          <Check className="w-4 h-4 shrink-0 text-[#8C52FF]" />
                                          <span>{f}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Billing cycle selector */}
                                {state?.product?.pricing && (
                                  <div>
                                    <h5 className="text-sm font-semibold mb-2">Billing Cycle</h5>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                      {Object.entries(state!.product.pricing)
                                        .filter(([cycle, price]) =>
                                          (BILLING_CYCLES as readonly string[]).includes(cycle) &&
                                          parseFloat(String(price) || '0') > 0
                                        )
                                        .map(([cycle, price]) => (
                                          <button
                                            key={cycle}
                                            onClick={() => handleBillingCycleChange(itemId, cycle)}
                                            className={`p-3 rounded-lg border-2 text-sm transition-all ${
                                              state?.billingCycle === cycle
                                                ? 'border-[#8C52FF] bg-purple-50'
                                                : 'border-gray-200 hover:border-[#8C52FF]'
                                            }`}
                                          >
                                            <div className="font-semibold capitalize">{cycle.replace(/ly$/, '')}</div>
                                            <div className="text-[#8C52FF] font-bold mt-1">{formatPrice(parseFloat(String(price)))}</div>
                                          </button>
                                        ))}
                                    </div>
                                  </div>
                                )}

                                {/* Domain configuration */}
                                <DomainConfig
                                  planId={String(hostingItem.productId)}
                                  billingCycle={state?.billingCycle || hostingItem.billingCycle}
                                  onDomainConfigured={itemCallbacks.onDomainConfigured}
                                  onFreeDomainInfo={itemCallbacks.onFreeDomainInfo}
                                />

                                {/* Cross-sell addons */}
                                <AddonSelection
                                  onSelectionChange={itemCallbacks.onAddonChange}
                                  hasDomain={!!state?.domainConfig?.domain}
                                />
                              </>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Empty state */}
              {domainItems.length === 0 && hostingItems.length === 0 && (
                <Card className="p-8 text-center">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-500 mb-4">Add domains or hosting services to get started</p>
                  <Button onClick={() => router.push(`/${locale}`)} className="bg-[#8C52FF] text-white hover:bg-[#7b42ff]">
                    Browse Services
                  </Button>
                </Card>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24">
                <h3 className="text-xl font-bold mb-6">Order Summary</h3>

                {/* Promo code display */}
                {appliedPromo && (
                  <div className="mb-4 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-purple-900">Promo Applied</span>
                      <button onClick={() => { setAppliedPromo(null); setPromoCodeInput(''); }} className="text-purple-500 hover:text-purple-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Code: {appliedPromo.code} — {appliedPromo.description}</div>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  {/* Domain line items */}
                  {domainItems.map((item) => {
                    const itemId = getItemId(item);
                    return (
                      <div key={itemId} className="flex justify-between text-sm">
                        <span className="text-gray-600 truncate mr-2">{item.domain}</span>
                        <span className="font-medium shrink-0">{formatPrice(item.price)}</span>
                      </div>
                    );
                  })}

                  {/* Hosting line items */}
                  {hostingItems.map((item) => {
                    const hostingItem = item as any;
                    const itemId = getItemId(item);
                    const state = hostingStates.get(itemId);
                    const addonsTotal = state?.selectedAddons?.reduce((acc: number, a: any) => acc + (parseFloat(a.price) || 0), 0) || 0;

                    return (
                      <div key={itemId}>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 truncate mr-2">{hostingItem.productName}</span>
                          <span className="font-medium shrink-0">{formatPrice(state?.pricing?.basePrice || hostingItem.price)}</span>
                        </div>
                        {state?.domainConfig?.domain && state?.domainConfig?.price !== undefined && (
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-gray-500">Domain ({state.domainConfig.domain})</span>
                            <span className="text-gray-500">{state.domainConfig.price > 0 ? formatPrice(state.domainConfig.price) : 'Free'}</span>
                          </div>
                        )}
                        {state?.selectedAddons?.map((addon: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm mt-1">
                            <span className="text-gray-500">{addon.name}</span>
                            <span className="text-gray-500">{addon.formattedPrice || formatPrice(parseFloat(addon.price) || 0)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>

                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-sm mb-2 text-green-600">
                      <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Promo ({appliedPromo?.code})</span>
                      <span>-{formatPrice(promoDiscount)}</span>
                    </div>
                  )}

                  {(taxRates.taxrate > 0 || taxRates.taxrate2 > 0) && (
                    <>
                      {taxRates.taxrate > 0 && (
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">{taxRates.taxname} ({taxRates.taxrate}%)</span>
                          <span className="font-medium">{formatPrice(tax1)}</span>
                        </div>
                      )}
                      {taxRates.taxrate2 > 0 && (
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">{taxRates.taxname2} ({taxRates.taxrate2}%)</span>
                          <span className="font-medium">{formatPrice(tax2)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Promo code input */}
                <div className="pt-3 border-t">
                  {appliedPromo ? (
                    <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="text-sm font-semibold text-green-800 font-mono">{appliedPromo.code}</span>
                        <span className="ml-2 text-xs text-green-600">({appliedPromo.description})</span>
                      </div>
                      <button onClick={() => { setAppliedPromo(null); setPromoCodeInput(''); setPromoError(''); }} className="text-green-500 hover:text-green-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        <Tag className="w-3 h-3" /> Have a promo code?
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoCodeInput}
                          onChange={(e) => { setPromoCodeInput(e.target.value); setPromoError(''); }}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                          placeholder="Enter code"
                          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C52FF] focus:border-transparent"
                        />
                        <Button
                          onClick={handleApplyPromo}
                          disabled={promoLoading || !promoCodeInput.trim()}
                          size="sm"
                          className="bg-[#8C52FF] hover:bg-purple-700 text-white text-xs px-3"
                        >
                          {promoLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Apply'}
                        </Button>
                      </div>
                      {promoError && <p className="text-xs text-red-500">{promoError}</p>}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-[#8C52FF]">{formatPrice(total)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    ({cart.length} item{cart.length !== 1 ? 's' : ''})
                  </p>
                </div>

                {/* Validation messages */}
                {hostingItems.some((item) => {
                  const itemId = getItemId(item);
                  const state = hostingStates.get(itemId);
                  return state && !state.loading && !state.domainConfig;
                }) && (
                  <p className="text-sm text-amber-600 text-center mt-3">
                    Please configure a domain for each hosting service
                  </p>
                )}

                <Button
                  onClick={handleCheckout}
                  disabled={ordering || hostingItems.some((item) => {
                    const itemId = getItemId(item);
                    const state = hostingStates.get(itemId);
                    return state && !state.loading && !state.domainConfig;
                  })}
                  className="w-full h-12 bg-[#8C52FF] hover:bg-purple-700 text-base font-semibold mt-4"
                >
                  {ordering ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Proceed to Checkout'
                  )}
                </Button>

                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Check className="w-4 h-4" />
                    <span className="font-medium">30-Day Money-Back Guarantee</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#8C52FF]" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
