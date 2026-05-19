'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import { getProductDetailsAction, calculateHostingPriceAction, createHostingOrderAction, getTaxRatesAction, validatePromoCodeAction } from '@/actions/hosting-actions'
import { detectCountryFromIP } from '@/actions/geolocation-actions'
import { checkUserLoginStatus } from '@/actions/domain-order-actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, Loader2, Server, Gift, Tag, X, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useCurrency } from '@/contexts/CurrencyContext'
import { getDiscountModuleData, selectDiscountRuleForCycle } from '@/lib/discount-module'
import DomainConfig from '@/components/order/DomainConfig'
import AddonSelection from '@/components/order/AddonSelection'
import { trackBeginCheckout } from '@/lib/ga4'

function HostingOrderContent() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const locale = (params?.locale as string) || 'en'
    const planId = searchParams.get('plan') || '1'
    const initialCycle = searchParams.get('cycle') || 'annually'

    const [product, setProduct] = useState<any>(null)
    const [billingCycle, setBillingCycle] = useState(initialCycle)
    const [pricing, setPricing] = useState<any>(null)

    const [loading, setLoading] = useState(true)
    const [ordering, setOrdering] = useState(false)

    const [domainConfig, setDomainConfig] = useState<any>(null)
    const [selectedAddons, setSelectedAddons] = useState<any[]>([])

    const [taxRates, setTaxRates] = useState<any>({ taxrate: 0, taxrate2: 0, taxname: 'VAT', taxname2: '' })
    const [userCountry, setUserCountry] = useState<string>('')
    const [countryDetected, setCountryDetected] = useState(false)
    const [detectedLocation, setDetectedLocation] = useState<any>(null)

    const { formatPrice, currency } = useCurrency()

    const [discountData, setDiscountData] = useState<any>(null)
    const [allDiscountRules, setAllDiscountRules] = useState<any>(null)
    const [productDiscountPercent, setProductDiscountPercent] = useState<number>(0)
    const [freeDomainInfo, setFreeDomainInfo] = useState<any>(null)

    // Promo code state
    const [promoCodeInput, setPromoCodeInput] = useState('')
    const [appliedPromo, setAppliedPromo] = useState<{ code: string; type: 'percentage' | 'fixed'; value: number; description: string } | null>(null)
    const [promoLoading, setPromoLoading] = useState(false)
    const [promoError, setPromoError] = useState('')

    // Track if user is logged in to show currency warning
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

    useEffect(() => {
        const checkLogin = async () => {
            try {
                const result = await checkUserLoginStatus()
                setIsLoggedIn(result.isLoggedIn)
            } catch {
                setIsLoggedIn(false)
            }
        }
        checkLogin()
    }, [])

    useEffect(() => {
        const fetchDiscounts = async () => {
            const data = await getDiscountModuleData()
            if (data.success && data.rules_detailed) {
                const rulesForProduct = data.rules_detailed[parseInt(planId)]

                if (rulesForProduct) {
                    // Store ALL rules for this product
                    setAllDiscountRules(rulesForProduct)
                } else {
                    setAllDiscountRules(null)
                }
            } else {
                setAllDiscountRules(null)
            }
        }
        fetchDiscounts()
    }, [planId])

    useEffect(() => {
        const selectDiscountForCycle = () => {
            if (!allDiscountRules) {
                setDiscountData(null)
                return
            }

            const selectedRule = selectDiscountRuleForCycle(allDiscountRules, billingCycle, parseInt(planId))

            if (selectedRule && selectedRule.promo_details) {
                setDiscountData(selectedRule)
            } else {
                setDiscountData(null)
            }
        }
        selectDiscountForCycle()
    }, [billingCycle, allDiscountRules, planId])

    useEffect(() => {

        if (!discountData || !discountData.promo_details) {
            setProductDiscountPercent(0)
            return
        }

        const promo = discountData.promo_details

        if (!promo.is_started || !promo.is_active || !promo.is_available) {
            setProductDiscountPercent(0)
            return
        }

        if (promo.applies_to.length > 0 && !promo.applies_to.includes(String(planId))) {
        }

        if (promo.requires.length > 0) {
        }

        const hasRestrictions = (promo.cycles_raw && promo.cycles_raw.length > 0) || promo.billing_cycles.length > 0

        if (hasRestrictions) {
            const hasMatchingCycle = promo.billing_cycles.some((cycle: string) => {
                const c1 = cycle.toLowerCase().replace(/[^a-z0-9]/g, '')
                const c2 = billingCycle.toLowerCase().replace(/[^a-z0-9]/g, '')
                return c1 === c2
            })

            if (!hasMatchingCycle) {
                setProductDiscountPercent(0)
                return
            }
        }

        if (promo.recurring !== undefined && promo.recurring > 0) {
        }

        if (promo.apply_once) {
        }

        if (promo.lifetime_promo) {
        }

        if (promo.new_signups_only) {
        }

        if (promo.existing_client) {
        }

        if (promo.once_per_client) {
        }

        if (promo.upgrades_enabled) {
        }


        setProductDiscountPercent(discountData.percentage)
    }, [billingCycle, discountData, planId])

    useEffect(() => {
        if (product?.pricing) {
            const availableCycles = Object.keys(product.pricing).filter(
                key => parseFloat(product.pricing[key] || '0') > 0
            )
            if (availableCycles.length > 0 && !availableCycles.includes(billingCycle)) {
                setBillingCycle(availableCycles[0])
            }
        }
    }, [product, billingCycle])


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
    }, [])

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
    }, [userCountry])

    useEffect(() => {
        async function loadProduct() {
            const result = await getProductDetailsAction(parseInt(planId), locale, currency)
            if (result.success && result.data) {
                setProduct(result.data)
            }
            setLoading(false)
        }
        loadProduct()
    }, [planId, locale, currency])

    useEffect(() => {
        async function calculatePrice() {
            if (!product) return

            const result = await calculateHostingPriceAction(
                product.id,
                billingCycle,
                [],
                currency
            )

            if (result.success && result.data) {
                let finalData = result.data
                if (productDiscountPercent > 0) {
                    const discountAmount = (result.data.total * productDiscountPercent) / 100
                    finalData = {
                        ...result.data,
                        discount: discountAmount,
                        total: result.data.total - discountAmount,
                    }
                }
                setPricing(finalData)
            }
        }
        calculatePrice()
    }, [product, billingCycle, productDiscountPercent, currency])




    const handleApplyPromo = async () => {
        if (!promoCodeInput.trim()) return
        setPromoLoading(true)
        setPromoError('')
        try {
            const result = await validatePromoCodeAction(
                promoCodeInput,
                parseInt(planId),
                billingCycle
            )
            if (result.success && result.data) {
                setAppliedPromo(result.data as any)
                setPromoError('')
                toast.success(`Promo code "${result.data.code}" applied — ${result.data.description}`)
                
                // GTM DataLayer Push
                if (typeof window !== 'undefined' && (window as any).dataLayer) {
                    (window as any).dataLayer.push({
                        event: 'promo_code_applied',
                        promoCode: result.data.code,
                        promoType: result.data.type,
                        promoValue: result.data.value
                    });
                }
            } else {
                setPromoError((result as any).error || 'Invalid promo code')
                setAppliedPromo(null)
            }
        } catch {
            setPromoError('Failed to validate promo code')
        } finally {
            setPromoLoading(false)
        }
    }

    const handleRemovePromo = () => {
        setAppliedPromo(null)
        setPromoCodeInput('')
        setPromoError('')
    }

    const handleCheckout = async () => {
        setOrdering(true)

        const { checkUserLoginStatus, getUserFullProfile } = await import('@/actions/domain-order-actions');
        const loginStatus = await checkUserLoginStatus();
        let userProfile = null;
        if (loginStatus.isLoggedIn) {
            userProfile = await getUserFullProfile();
        }

        // GTM DataLayer Push
        if (typeof window !== 'undefined' && (window as any).dataLayer) {
            (window as any).dataLayer.push({
                event: 'proceed_to_checkout',
                user_id: loginStatus.userId || null,
                user_email: loginStatus.userEmail || null,
                user_name: loginStatus.userName || null,
                user_phone: userProfile?.phone || null,
                user_address: userProfile?.address1 || null,
                user_city: userProfile?.city || null,
                user_state: userProfile?.state || null,
                user_country: userProfile?.country || null,
                user_postcode: userProfile?.postcode || null
            });
        }

        const promoCode = (productDiscountPercent > 0 && discountData?.promo_details?.code)
            ? discountData.promo_details.code
            : (appliedPromo?.code || '');

        const selectedDomain = String(domainConfig?.domain || '').trim();

        // Calculate checkout totals for VAT consistency
        const addonsTotal = selectedAddons.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
        const subtotalAfterDiscount = (pricing?.total || 0) + (domainConfig?.price || 0) + addonsTotal;
        const checkoutTaxAmount = subtotalAfterDiscount * (taxRates.taxrate / 100);

        // GA4 begin_checkout event
        trackBeginCheckout({
            currency,
            value: subtotalAfterDiscount,
            coupon: promoCode || undefined,
            items: [{
                item_id: `hosting-${planId}`,
                item_name: product?.name || `Hosting Plan ${planId}`,
                price: subtotalAfterDiscount,
                quantity: 1,
            }],
        });

        // Clear any existing pending order to prevent accumulation
        localStorage.removeItem('pendingHostingOrder');

        localStorage.setItem('pendingHostingOrder', JSON.stringify({
            planId: parseInt(planId),
            productName: product?.name || '',
            billingCycle,
            currency,
            promoCode,
            domain: selectedDomain,
            domainType: domainConfig?.type || 'existing',
            domainConfig: domainConfig || null,
            regPeriod: domainConfig?.years || 1,
            addons: [], // Configurable options
            crossSells: selectedAddons, // Additional products (VPN, SSL, etc.)
            country: userCountry,
            state: detectedLocation?.region,
            // Pass checkout-calculated tax values for VAT consistency
            checkoutTaxRate: taxRates.taxrate,
            checkoutTaxAmount: checkoutTaxAmount,
            checkoutTotal: subtotalAfterDiscount + checkoutTaxAmount,
        }))

        if (loginStatus.isLoggedIn) {
            router.push('/dashboard/processing')
        } else {
            const locale = window.location.pathname.split('/')[1] || 'en'
            toast.info('Please create an account or login to continue')
            router.push(`/${locale}/register`)

        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white pt-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#8C52FF]" />
            </div>
        )
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white pt-20">
                <Card className="p-8">
                    <p className="text-red-600">Product not found</p>
                </Card>
            </div>
        )
    }

    const getBillingCyclesWithSavings = () => {
        if (!product?.pricing) return []

        const cycles: any[] = []
        const billingCycleMap: Record<string, string> = {
            onetime: 'One Time',
            monthly: 'Monthly',
            quarterly: 'Quarterly',
            semiannually: 'Semi-Annually',
            annually: 'Annually',
            biennially: 'Biennially',
            triennially: 'Triennially',
        }

        const monthsInCycle: Record<string, number> = {
            onetime: 0,
            monthly: 1,
            quarterly: 3,
            semiannually: 6,
            annually: 12,
            biennially: 24,
            triennially: 36,
        }

        const validCyclesFromApi = Object.keys(product.pricing).filter(key => {
            const price = parseFloat(product.pricing[key]);
            return price >= 0;
        });

        let baselineCycle: string | null = null
        let baselineMonthlyRate = Infinity

        for (const key of validCyclesFromApi) {
            if (!monthsInCycle[key] || monthsInCycle[key] === 0) continue;

            const price = parseFloat(product.pricing[key] || '0')
            if (price > 0) {
                const monthlyRate = price / monthsInCycle[key]
                if (monthlyRate < baselineMonthlyRate) {
                    baselineMonthlyRate = monthlyRate
                    baselineCycle = key
                }
            }
        }

        for (const key of validCyclesFromApi) {
            if (monthsInCycle[key] === undefined) continue;

            const label = billingCycleMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
            const price = parseFloat(product.pricing[key] || '0')

            let savingsPercent = 0

            if (key !== baselineCycle && baselineMonthlyRate < Infinity && price > 0 && monthsInCycle[key] > 0) {
                const thisMonthlyRate = price / monthsInCycle[key]
                if (thisMonthlyRate < baselineMonthlyRate) {
                    savingsPercent = Math.round(((baselineMonthlyRate - thisMonthlyRate) / baselineMonthlyRate) * 100)
                }
            }

            cycles.push({
                value: key,
                label: label,
                price: price,
                savings: savingsPercent > 0 ? savingsPercent : 0,
                isBestValue: false
            })
        }

        const maxSavings = Math.max(...cycles.map(c => c.savings));
        cycles.forEach(c => {
            if (c.savings > 0 && c.savings === maxSavings) {
                c.isBestValue = true;
            }
        });

        cycles.sort((a, b) => (monthsInCycle[a.value] || 0) - (monthsInCycle[b.value] || 0));

        return cycles
    }

    const billingCycles = getBillingCyclesWithSavings()



    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 pt-20 pb-12">
            <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Complete Your Order</h1>
                        <p className="text-gray-600">Configure your hosting plan and proceed to checkout</p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
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

                            <Card className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                                        <Server className="w-6 h-6 text-[#8C52FF]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                                        {product.tagline && (
                                            <p className="text-gray-600 mt-1">{product.tagline}</p>
                                        )}
                                        {product.features?.length > 0 && (
                                            <ul className="mt-4 space-y-2">
                                                {product.features.map((feature: string, index: number) => (
                                                    <li key={index} className="flex items-center gap-2 text-gray-700">
                                                        <Check className="w-4 h-4 shrink-0 text-[#8C52FF]" />
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                                {/* Add Free Qbox Business Email */}
                                                <li className="flex items-center gap-2 text-gray-700 font-medium">
                                                    <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                                        <Check className="w-3 h-3 text-green-600" />
                                                    </div>
                                                    <span>Free Business Email (Qbox)</span>
                                                </li>
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h3 className="text-lg font-semibold mb-4">Choose Billing Cycle</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {billingCycles.map((cycle) => {
                                        const getDiscountForCycle = () => {
                                            if (!allDiscountRules) return null;

                                            const rule = selectDiscountRuleForCycle(allDiscountRules, cycle.value, parseInt(planId));

                                            if (rule &&
                                                rule.promo_details?.is_active &&
                                                rule.promo_details?.is_available &&
                                                rule.promo_details?.is_started) {
                                                return rule.percentage;
                                            }
                                            return null;
                                        };

                                        const cycleDiscountPercent = getDiscountForCycle();
                                        const isBestValue = cycle.isBestValue;

                                        return (
                                            <button
                                                key={cycle.value}
                                                onClick={() => setBillingCycle(cycle.value)}
                                                className={`relative p-4 rounded-lg border-2 transition-all ${billingCycle === cycle.value
                                                    ? 'border-[#8C52FF] bg-purple-50'
                                                    : 'border-gray-200 hover:border-[#8C52FF]'
                                                    }`}
                                            >
                                                {isBestValue && (
                                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#8C52FF] text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                                                        Best Value
                                                    </span>
                                                )}
                                                <div className="font-semibold text-sm">{cycle.label}</div>
                                                {cycleDiscountPercent && cycleDiscountPercent > 0 && (
                                                    <div className="text-xs text-green-600 font-medium mt-1">
                                                        Save {cycleDiscountPercent}%
                                                    </div>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </Card>

                            <DomainConfig
                                planId={planId}
                                billingCycle={billingCycle}
                                onDomainConfigured={setDomainConfig}
                                onFreeDomainInfo={setFreeDomainInfo}
                            />

                            <AddonSelection
                                onSelectionChange={setSelectedAddons}
                                hasDomain={!!domainConfig?.domain}
                            />

                        </div>

                        <div className="lg:col-span-1">
                            <Card className="p-6 sticky top-24">
                                <h3 className="text-xl font-bold mb-6">Order Summary</h3>

                                {productDiscountPercent > 0 && (
                                    <div className="mb-4 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-purple-900">Discount Applied</span>
                                            <span className="text-sm font-bold text-purple-700">Save {productDiscountPercent}%</span>
                                        </div>
                                        {discountData?.promo_code && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                Code: {discountData.promo_code}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {freeDomainInfo?.hasFreeDomain && freeDomainInfo?.qualifiesForFreeDomain && (
                                    <div className="mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Gift className="w-4 h-4 text-green-600 shrink-0" />
                                            <span className="text-sm font-medium text-green-800">Free Domain Included!</span>
                                        </div>
                                        {freeDomainInfo.freeDomainTlds?.length > 0 && (
                                            <p className="text-xs text-green-700 mt-1">
                                                Eligible TLDs: {freeDomainInfo.freeDomainTlds.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">{product.name}</span>
                                        <span className="font-medium">{formatPrice(pricing?.basePrice || 0)}</span>
                                    </div>

                                    {domainConfig && (domainConfig.price !== undefined) && (() => {
                                        const isDomainFree = freeDomainInfo?.hasFreeDomain &&
                                            freeDomainInfo?.qualifiesForFreeDomain &&
                                            domainConfig.price === 0 &&
                                            domainConfig.type !== 'existing';
                                        return (
                                            <div className="flex justify-between text-sm items-center">
                                                <span className="text-gray-600">
                                                    Domain ({domainConfig.domain})
                                                </span>
                                                {isDomainFree ? (
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="line-through text-gray-400 text-xs">Paid</span>
                                                        <span className="font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded text-xs">FREE</span>
                                                    </span>
                                                ) : (
                                                    <span className="font-medium">
                                                        {formatPrice(domainConfig.price)}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {selectedAddons.map((addon, index) => (
                                        <div key={`${addon.id}-${index}`} className="flex justify-between text-sm">
                                            <span className="text-gray-600">{addon.name}</span>
                                            <span className="font-medium">{addon.formattedPrice}</span>
                                        </div>
                                    ))}

                                    <div className="pt-4 border-t">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span className="font-medium">
                                                {formatPrice(
                                                    (pricing?.subtotal || 0) + (domainConfig?.price || 0) + selectedAddons.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0)
                                                )}
                                            </span>
                                        </div>

                                        {pricing?.discount > 0 && (
                                            <div className="flex justify-between text-sm mb-2 text-green-600">
                                                <span>Hosting Discount</span>
                                                <span>-{formatPrice(pricing.discount)}</span>
                                            </div>
                                        )}

                                        {appliedPromo && (() => {
                                            const baseForPromo = (pricing?.total || 0) + (domainConfig?.price || 0) + selectedAddons.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
                                            const promoDiscountAmt = appliedPromo.type === 'percentage'
                                                ? baseForPromo * (appliedPromo.value / 100)
                                                : Math.min(appliedPromo.value, baseForPromo);
                                            return (
                                                <div className="flex justify-between text-sm mb-2 text-green-600">
                                                    <span className="flex items-center gap-1">
                                                        <Tag className="w-3 h-3" />
                                                        Promo ({appliedPromo.code})
                                                    </span>
                                                    <span>-{formatPrice(promoDiscountAmt)}</span>
                                                </div>
                                            );
                                        })()}

                                        {(taxRates.taxrate > 0 || taxRates.taxrate2 > 0) && (() => {
                                            const addonsTotal = selectedAddons.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
                                            const subtotalAfterDiscount = (pricing?.total || 0) + (domainConfig?.price || 0) + addonsTotal;
                                            const vat1 = subtotalAfterDiscount * (taxRates.taxrate / 100);
                                            const vat2 = subtotalAfterDiscount * (taxRates.taxrate2 / 100);
                                            return (
                                                <>
                                                    {taxRates.taxrate > 0 && (
                                                        <div className="flex justify-between text-sm mb-2">
                                                            <span className="text-gray-600">{taxRates.taxname} ({taxRates.taxrate}%)</span>
                                                            <span className="font-medium">{formatPrice(vat1)}</span>
                                                        </div>
                                                    )}
                                                    {taxRates.taxrate2 > 0 && (
                                                        <div className="flex justify-between text-sm mb-2">
                                                            <span className="text-gray-600">{taxRates.taxname2} ({taxRates.taxrate2}%)</span>
                                                            <span className="font-medium">{formatPrice(vat2)}</span>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>

                                    {/* Promo code input */}
                                    <div className="pt-3 border-t">
                                        {appliedPromo ? (
                                            <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <Tag className="w-4 h-4 text-green-600 shrink-0" />
                                                    <div>
                                                        <span className="text-sm font-semibold text-green-800 font-mono">{appliedPromo.code}</span>
                                                        <span className="ml-2 text-xs text-green-600">({appliedPromo.description})</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleRemovePromo}
                                                    className="text-green-500 hover:text-green-700 transition-colors"
                                                    aria-label="Remove promo code"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                                    <Tag className="w-3 h-3" />
                                                    Have a promo code?
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={promoCodeInput}
                                                        onChange={e => { setPromoCodeInput(e.target.value); setPromoError('') }}
                                                        onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
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
                                                {promoError && (
                                                    <p className="text-xs text-red-500">{promoError}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-semibold">Total</span>
                                            <span className="text-2xl font-bold text-[#8C52FF]">
                                                {(() => {
                                                    const addonsTotal = selectedAddons.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
                                                    let subtotalAfterDiscount = (pricing?.total || 0) + (domainConfig?.price || 0) + addonsTotal;
                                                    // Apply user-entered promo on top
                                                    if (appliedPromo) {
                                                        const promoDiscountAmt = appliedPromo.type === 'percentage'
                                                            ? subtotalAfterDiscount * (appliedPromo.value / 100)
                                                            : Math.min(appliedPromo.value, subtotalAfterDiscount);
                                                        subtotalAfterDiscount = Math.max(0, subtotalAfterDiscount - promoDiscountAmt);
                                                    }
                                                    const vat1 = subtotalAfterDiscount * (taxRates.taxrate / 100);
                                                    const vat2 = subtotalAfterDiscount * (taxRates.taxrate2 / 100);
                                                    const totalWithVat = subtotalAfterDiscount + vat1 + vat2;
                                                    return formatPrice(totalWithVat);
                                                })()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 text-right">
                                            {billingCycle === 'onetime'
                                                ? 'One Time Payment'
                                                : `per ${billingCycle === 'monthly' ? 'month' : billingCycle}`
                                            }
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleCheckout}
                                    disabled={ordering || !domainConfig}
                                    className="w-full h-12 bg-[#8C52FF] hover:bg-purple-700 text-base font-semibold"
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
                                
                                {!domainConfig && (
                                    <p className="text-sm text-red-600 text-center mt-2">
                                        Please configure your domain to continue
                                    </p>
                                )}

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
            </div >
        </div >
    )
}

export default function HostingOrderPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center pt-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#8C52FF]" />
            </div>
        }>
            <HostingOrderContent />
        </Suspense>
    )
}
