'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Check, Globe, Shield, Loader2, Lock, AlertTriangle } from 'lucide-react';
import {
  calculateDomainPrice,
  checkUserLoginStatus,
} from '@/actions/domain-order-actions';
import { toast } from 'sonner';
import Link from 'next/link';
import { useCurrency } from '@/contexts/CurrencyContext';

import { detectCountryFromIP } from '@/actions/geolocation-actions';
import { getTaxRatesAction } from '@/actions/hosting-actions';
import { trackBeginCheckout } from '@/lib/ga4';

interface PriceData {
  domain: string;
  tld: string;
  years: number;
  registerPrice: number;
  pricePerYear: number;
  totalPrice: number;
  icannFee: number;
  grandTotal: number;
  currency: any;
}

function OrderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const domain = searchParams.get('domain');
  const isBulkOrder = searchParams.get('bulk') === 'true';
  const { formatPrice, currency } = useCurrency();

  const initialPeriod = searchParams.get('period') || '1';
  const [regPeriod, setRegPeriod] = useState(initialPeriod);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [allPeriodPrices, setAllPeriodPrices] = useState<Record<string, PriceData>>({});
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Bulk order state
  const [bulkDomains, setBulkDomains] = useState<{ domain: string; regPeriod: number; price?: number; addons?: { id: string; name: string; price: number }[] }[]>([]);
  const [bulkPrices, setBulkPrices] = useState<Record<string, PriceData>>({});
  const [isLoadingBulkPrices, setIsLoadingBulkPrices] = useState(false);

  const [availablePeriods, setAvailablePeriods] = useState<{ value: string, label: string }[]>([{ value: '1', label: '1 Year' }]);

  // Track if user is logged in to show currency warning
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const result = await checkUserLoginStatus();
        setIsLoggedIn(result.isLoggedIn);
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkLogin();
  }, []);

  useEffect(() => {
    const initializePage = async () => {
      if (!domain) {
        router.push('/');
        return;
      }

      // Check for bulk order in localStorage
      if (isBulkOrder) {
        setIsLoadingBulkPrices(true);
        try {
          const bulkOrderData = localStorage.getItem('pendingBulkDomainOrder');
          if (bulkOrderData) {
            const parsed = JSON.parse(bulkOrderData);
            const items = parsed.items || [];
            
            // Fetch WHMCS prices for all bulk domains
            const itemsWithPrices = await Promise.all(
              items.map(async (item: any) => {
                const priceResult = await calculateDomainPrice(
                  item.domain,
                  item.regPeriod || 1,
                  currency
                );
                return {
                  ...item,
                  price: priceResult.success && priceResult.data ? priceResult.data.totalPrice : 0
                };
              })
            );
            
            setBulkDomains(itemsWithPrices);
            console.log('🛒 [BULK ORDER] Loaded domains with WHMCS prices:', itemsWithPrices);
          }
        } catch (e) {
          console.error('Failed to parse bulk order data:', e);
        } finally {
          setIsLoadingBulkPrices(false);
        }
        return;  // Don't fetch prices for bulk orders
      }

      const fetchAllPrices = async () => {
      setIsLoadingPrice(true);
      const potentialPeriods = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
      const prices: Record<string, PriceData> = {};
      const validPeriods: { value: string, label: string }[] = [];

      await Promise.all(potentialPeriods.map(async (period) => {
        const result = await calculateDomainPrice(
          domain,
          parseInt(period),
          currency
        );
        if (result.success && result.data && result.data.totalPrice > 0) {
          prices[period] = result.data;
          validPeriods.push({
            value: period,
            label: `${period} Year${period !== '1' ? 's' : ''}`
          });
        }
      }));

      validPeriods.sort((a, b) => parseInt(a.value) - parseInt(b.value));

      if (validPeriods.length > 0) {
        setAvailablePeriods(validPeriods);
        setAllPeriodPrices(prices);

        if (!prices[regPeriod]) {
          setRegPeriod(validPeriods[0].value);
          setPriceData(prices[validPeriods[0].value]);
        } else {
          setPriceData(prices[regPeriod]);
        }
      }

      setIsLoadingPrice(false);
    };

    fetchAllPrices();
  };

  initializePage();
}, [domain, router, currency, isBulkOrder]);

  useEffect(() => {
    if (allPeriodPrices[regPeriod]) {
      setPriceData(allPeriodPrices[regPeriod]);
    }
  }, [regPeriod, allPeriodPrices]);

  const [userCountry, setUserCountry] = useState<string>('US'); // Default to US
  const [countryDetected, setCountryDetected] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<any>({ region: 'California' }); // Default region
  const [taxRates, setTaxRates] = useState<{ taxrate: number; taxrate2: number; taxname: string; taxname2: string }>({
    taxrate: 0,
    taxrate2: 0,
    taxname: 'VAT',
    taxname2: ''
  });

  const handleCheckout = () => {
    if (!domain) return;

    startTransition(async () => {
      const { checkUserLoginStatus } =
        await import('@/actions/domain-order-actions');
      const loginStatus = await checkUserLoginStatus();

      // Handle bulk order
      if (isBulkOrder && bulkDomains.length > 0) {
        console.log('🛒 [BULK CHECKOUT] Processing bulk order for domains:', bulkDomains);

        // GA4 begin_checkout event
        const bulkValue = bulkDomains.reduce((sum, d) => sum + (d.price || 0), 0);
        trackBeginCheckout({
          currency,
          value: bulkValue,
          items: bulkDomains.map((d) => ({
            item_id: `domain-${d.domain}`,
            item_name: d.domain,
            price: d.price || 0,
            quantity: d.regPeriod || 1,
          })),
        });
        
        // Store bulk order data for processing page
        const bulkOrderData = {
          items: bulkDomains,
          currency,
          country: userCountry,
          state: detectedLocation?.region,
          domainType: 'register',
        };

        // Clear any existing pending orders
        localStorage.removeItem('pendingDomainOrder');
        localStorage.removeItem('pendingHostingOrder');
        
        // Store bulk order data
        localStorage.setItem('pendingBulkDomainOrder', JSON.stringify(bulkOrderData));
        
        console.log('🛒 [BULK CHECKOUT] Bulk order data stored:', bulkOrderData);

        if (loginStatus.isLoggedIn) {
          router.push('/dashboard/processing');
        } else {
          const locale = window.location.pathname.split('/')[1] || 'en';
          toast.info('Please create an account or login to continue');
          router.push(`/${locale}/register`);
        }
        return;
      }

      // Handle single domain order
      // GA4 begin_checkout event
      const totals = calculateTotals();
      trackBeginCheckout({
        currency,
        value: totals.total,
        items: [{
          item_id: `domain-${domain}`,
          item_name: domain,
          price: priceData?.totalPrice || 0,
          quantity: parseInt(regPeriod),
        }],
      });

      const orderData: any = {
        domain,
        regPeriod: parseInt(regPeriod),
        currency,
        country: userCountry,
        state: detectedLocation?.region,
        // Pass checkout-calculated tax values for invoice consistency
        checkoutTaxRate: taxRates.taxrate,
      };

      // Clear any existing pending order to prevent accumulation
      localStorage.removeItem('pendingBulkDomainOrder');
      localStorage.removeItem('pendingHostingOrder');
      localStorage.removeItem('pendingSingleDomainOrder');

      localStorage.setItem('pendingDomainOrder', JSON.stringify(orderData));

      if (loginStatus.isLoggedIn) {
        router.push('/dashboard/processing');
      } else {
        const locale = window.location.pathname.split('/')[1] || 'en';
        toast.info('Please create an account or login to continue');
        router.push(`/${locale}/register`);
      }
    });
  };

  useEffect(() => {
    async function autoDetectCountry() {
      try {
        const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const result = await detectCountryFromIP(clientTimezone)

        if (result.country) {
          setUserCountry(result.country)
          setDetectedLocation(result)
          setCountryDetected(true)
          toast.success(`Location detected: ${result.countryName}`, {
            description: 'VAT/Tax calculated based on location'
          })
        } else {
          setCountryDetected(true)
        }

      } catch (error) {
        setCountryDetected(true)
      }
    }
    autoDetectCountry()
  }, []);

  useEffect(() => {
    async function fetchTaxRates() {
      if (!userCountry) return

      const result = await getTaxRatesAction(userCountry)

      if (result.success && result.data) {
        setTaxRates(result.data)
      } else {
        setTaxRates({ taxrate: 0, taxrate2: 0, taxname: 'VAT', taxname2: '' })
      }
    }
    fetchTaxRates()
  }, [userCountry]);

  const calculateTotals = () => {
    if (!priceData) return { subtotal: 0, tax: 0, tax2: 0, total: 0 };

    const basePrice = priceData.totalPrice;
    const taxableSubtotal = basePrice + priceData.icannFee;

    const taxAmount = (taxableSubtotal * taxRates.taxrate) / 100;
    const taxAmount2 = (taxableSubtotal * taxRates.taxrate2) / 100;

    const total = taxableSubtotal + taxAmount + taxAmount2;

    return {
      subtotal: taxableSubtotal,
      tax: taxAmount,
      tax2: taxAmount2,
      total: total
    };
  };

  const totals = calculateTotals();

  if (!domain) {
    return null;
  }

  const periods = [
    { value: '1', label: '1 Year' },
    { value: '2', label: '2 Years' },
    { value: '3', label: '3 Years' },
    { value: '5', label: '5 Years' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="border-b bg-white">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to search
          </Link>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="space-y-6 lg:col-span-2">
            {/* Currency lock warning for unauthenticated users */}
            {isLoggedIn === false && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">
                    Current currency is <span className="font-bold">{currency}</span>
                  </p>
                  <p className="text-amber-700 mt-1">
                    This will be set as the default in your profile. You will be unable to switch this. You need to contact support if you want to change.
                  </p>
                </div>
              </div>
            )}

            {/* Bulk Order Summary */}
            {isBulkOrder && (
              <Card className="border-2 border-blue-500 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-xl font-bold">Bulk Domain Registration</CardTitle>
                    <Badge className="border-blue-300 bg-blue-100 text-blue-800 hover:bg-blue-200">
                      {bulkDomains.length} Domains
                    </Badge>
                  </div>
                  <CardDescription>
                    You're registering multiple domains at once
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingBulkPrices ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-[#8C52FF]" />
                      <span className="ml-2 text-gray-600">Loading domain prices...</span>
                    </div>
                  ) : bulkDomains.length > 0 ? (
                    <div className="space-y-3">
                      {bulkDomains.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                              <Globe className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{item.domain}</div>
                              <div className="text-sm text-gray-500">{item.regPeriod} year{item.regPeriod > 1 ? 's' : ''}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-600">
                              {formatPrice(item.price || 0)}
                            </div>
                          </div>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex items-center justify-between pt-2">
                        <span className="font-semibold text-gray-900">Bulk Total:</span>
                        <span className="text-xl font-bold text-blue-600">
                          {formatPrice(bulkDomains.reduce((sum: number, item: any) => sum + (item.price || 0), 0))}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-gray-500">
                      No domains found in bulk order
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Single Domain Card (only show if not bulk order) */}
            {!isBulkOrder && (
              <Card className="border-2 border-green-500 shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold break-all text-gray-900 md:text-3xl">
                        {domain}
                      </CardTitle>
                      <CardDescription className="mt-2 flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-700">
                          Available for registration
                        </span>
                      </CardDescription>
                    </div>
                    <Badge className="shrink-0 border-green-300 bg-green-100 text-green-800 hover:bg-green-200">
                      Available
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            )}

            {/* Registration Period Selection - Only show for single domain orders */}
            {!isBulkOrder && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Choose Registration Period
                  </CardTitle>
                  <CardDescription>
                    Longer registration periods offer better value
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={regPeriod}
                    onValueChange={setRegPeriod}
                    className="space-y-3"
                  >
                    {availablePeriods.map((period) => (
                      <div
                        key={period.value}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem value={period.value} id={period.value} />
                        <Label
                          htmlFor={period.value}
                          className="flex flex-1 cursor-pointer items-center justify-between py-2"
                        >
                          <span className="font-medium">{period.label}</span>
                          <div className="flex items-center gap-2">
                            {isLoadingPrice ? (
                              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            ) : allPeriodPrices[period.value] ? (
                              <span className={`font-bold ${regPeriod === period.value ? 'text-[#8C52FF]' : 'text-gray-500'}`}>
                                {formatPrice(allPeriodPrices[period.value].totalPrice)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What's Included</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100">
                    <Shield className="h-5 w-5 text-[#8C52FF]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Free Privacy Protection
                    </h4>
                    <p className="text-sm text-gray-600">
                      Keep your personal information private and secure
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100">
                    <Globe className="h-5 w-5 text-[#8C52FF]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      DNS Management
                    </h4>
                    <p className="text-sm text-gray-600">
                      Full control over your domain's DNS settings
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100">
                    <Lock className="h-5 w-5 text-[#8C52FF]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Domain Lock</h4>
                    <p className="text-sm text-gray-600">
                      Protect your domain from unauthorized transfers
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Card className="shadow-lg">
                <CardHeader className="border-b bg-gray-50">
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  {/* Bulk Order Summary */}
                  {isBulkOrder && (
                    <>
                      {isLoadingBulkPrices ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-[#8C52FF]" />
                          <span className="ml-2 text-gray-600">Loading bulk order prices...</span>
                        </div>
                      ) : bulkDomains.length > 0 ? (
                        <>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                              <Globe className="h-5 w-5 text-blue-600" />
                              <h4 className="font-semibold text-gray-900">Bulk Order Summary</h4>
                              <Badge className="border-blue-300 bg-blue-100 text-blue-800 hover:bg-blue-200">
                                {bulkDomains.length} Domains
                              </Badge>
                            </div>
                            
                            {bulkDomains.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  {item.domain} ({item.regPeriod} year{item.regPeriod > 1 ? 's' : ''})
                                </span>
                                <span className="font-medium">
                                  {formatPrice(item.price || 0)}
                                </span>
                              </div>
                            ))}

                            <Separator />

                            <div className="flex justify-between">
                              <span className="font-semibold text-gray-900">Subtotal</span>
                              <span className="font-bold text-blue-600">
                                {formatPrice(bulkDomains.reduce((sum: number, item: any) => sum + (item.price || 0), 0))}
                              </span>
                            </div>

                            <div className="flex justify-between text-sm text-green-700">
                              <span className="flex items-center gap-1">
                                <Check className="h-4 w-4" />
                                Privacy Protection for all domains
                              </span>
                              <span className="font-semibold">FREE</span>
                            </div>
                          </div>

                          <Separator />

                          <div className="flex items-baseline justify-between">
                            <span className="text-lg font-semibold text-gray-900">
                              Total
                            </span>
                            <div className="text-right">
                              <div className="text-3xl font-bold text-[#8C52FF]">
                                {formatPrice(bulkDomains.reduce((sum: number, item: any) => sum + (item.price || 0), 0))}
                              </div>
                              <div className="text-xs text-gray-500">
                                for {bulkDomains.length} domain{bulkDomains.length > 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={handleCheckout}
                            disabled={isPending}
                            className="h-12 w-full bg-[#8C52FF] text-base font-semibold text-white hover:bg-[#7b42ff]"
                            size="lg"
                          >
                            {isPending ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>Proceed to Checkout</>
                            )}
                          </Button>

                          <p className="text-center text-xs text-gray-500">
                            You'll be asked to login or create an account
                          </p>
                        </>
                      ) : (
                        <div className="py-4 text-center text-gray-500">
                          No domains found in bulk order
                        </div>
                      )}
                    </>
                  )}

                  {/* Single Domain Summary */}
                  {!isBulkOrder && (
                    <>
                      {isLoadingPrice ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-[#8C52FF]" />
                        </div>
                      ) : priceData ? (
                        <>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Domain Registration
                          </span>
                          <span className="font-medium">
                            {formatPrice(priceData.totalPrice)}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">ICANN Fee</span>
                          <span className="font-medium">
                            {formatPrice(priceData.icannFee)}
                          </span>
                        </div>

                        {taxRates.taxrate > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {taxRates.taxname} ({taxRates.taxrate}%)
                            </span>
                            <span className="font-medium">
                              {formatPrice(totals.tax)}
                            </span>
                          </div>
                        )}
                        {taxRates.taxrate2 > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {taxRates.taxname2} ({taxRates.taxrate2}%)
                            </span>
                            <span className="font-medium">
                              {formatPrice(totals.tax2)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between text-sm text-green-700">
                          <span className="flex items-center gap-1">
                            <Check className="h-4 w-4" />
                            Privacy Protection
                          </span>
                          <span className="font-semibold">FREE</span>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-baseline justify-between">
                        <span className="text-lg font-semibold text-gray-900">
                          Total
                        </span>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-[#8C52FF]">
                            {formatPrice(totals.total)}
                          </div>
                          <div className="text-xs text-gray-500">
                            for {priceData.years} year
                            {priceData.years > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handleCheckout}
                        disabled={isPending}
                        className="h-12 w-full bg-[#8C52FF] text-base font-semibold text-white hover:bg-[#7b42ff]"
                        size="lg"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>Proceed to Checkout</>
                        )}
                      </Button>

                      <p className="text-center text-xs text-gray-500">
                        You'll be asked to login or create an account
                      </p>
                    </>
                  ) : (
                    <div className="py-4 text-center text-gray-500">
                      Failed to load pricing
                    </div>
                  )}
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2 text-sm text-green-800">
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">Secure Checkout</span>
                </div>
                <p className="mt-1 text-xs text-green-700">
                  Your payment information is encrypted and secure
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#8C52FF]" />
      </div>
    }>
      <OrderPageContent />
    </Suspense>
  );
}
