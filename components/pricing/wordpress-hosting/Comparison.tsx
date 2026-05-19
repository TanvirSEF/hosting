'use client';

import { Check, Minus, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getWordPressPlansAction } from '@/actions/hosting-actions';
import { getDiscountRulesDirectAction } from '@/actions/discount-actions';
import { selectDiscountRuleForCycle, type DiscountRule } from '@/lib/discount-module';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { trackAddToCart } from '@/lib/ga4';
import { useLocale, useTranslations } from 'next-intl';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

export default function Comparison() {
  const t = useTranslations('wordpressHosting.comparison');
  const { currency, formatPrice: contextFormatPrice } = useCurrency();
  const locale = useLocale();
  const [plans, setPlans] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [activePlanIdx, setActivePlanIdx] = useState(1);
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const { addToCart, isInCart } = useCart();

  const handleAddToCart = (plan: any) => {
    const itemId = `hosting-${plan.id}`;
    if (isInCart(itemId)) {
      toast.info('This plan is already in your cart');
      return;
    }
    const regularPriceRaw = plan.rawAnnualPrice ?? parseFloat(plan.price.replace(/[^0-9.]/g, ''));
    const pid = parseInt(plan.id);

    addToCart({
      type: 'hosting',
      productId: pid,
      productName: plan.name,
      billingCycle: 'annually',
      price: regularPriceRaw,
      addons: [],
    });
    toast.success(`${plan.name} added to cart!`);

    trackAddToCart({
      currency,
      value: regularPriceRaw,
      items: [{
        item_id: `hosting-${pid}`,
        item_name: plan.name,
        price: regularPriceRaw,
        quantity: 1,
      }],
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [plansResult, discountsResult] = await Promise.all([
          getWordPressPlansAction(currency, locale),
          getDiscountRulesDirectAction(),
        ]);

        if (discountsResult.success && discountsResult.rules_detailed) {
          const discountMap: Record<number, number> = {};

          for (const [pidStr, rules] of Object.entries(discountsResult.rules_detailed)) {
            const pid = parseInt(pidStr);
            // Select MONTHLY discount for comparison table
            const selectedRule = selectDiscountRuleForCycle(rules as DiscountRule | DiscountRule[], 'monthly');
            if (selectedRule && selectedRule.percentage) {
              discountMap[pid] = selectedRule.percentage;
            }
          }
          setDiscounts(discountMap);
        }

        if (plansResult.success && plansResult.data) {
          setPlans(plansResult.data);
        }
      } catch (error) {
        console.error('Failed to fetch pricing data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currency, locale]);

  useEffect(() => {
    const checkVisibility = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const inView = rect.top < windowHeight && rect.bottom > 0;
        setIsInView(inView);
      }
    };

    checkVisibility();
    window.addEventListener('scroll', checkVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', checkVisibility);
    };
  }, []);

  const handlePrev = () => {
    setActivePlanIdx((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setActivePlanIdx((prev) => Math.min(plans.length - 1, prev + 1));
  };



  if (plans.length === 0) return null;

  // Process plans with discounts
  const processedPlans = plans.map((plan) => {
    const regularPriceRaw = parseFloat(plan.price.replace(/[^0-9.]/g, ''));
    const pid = plan.id ? parseInt(plan.id) : 0;

    const discountPercent = discounts[pid] || 0;
    const hasDiscount = discountPercent > 0;

    const discountedPrice = hasDiscount ? (regularPriceRaw * (1 - (discountPercent / 100))) : regularPriceRaw;

    const currencySymbol = plan.price.replace(/[0-9.]/g, '').trim() || (currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '');

    const formatPrice = (val: number) => contextFormatPrice(val);

    return {
      ...plan,
      regularPriceDisplay: formatPrice(regularPriceRaw),
      finalPriceDisplay: formatPrice(discountedPrice),
      hasDiscount,
      discount: hasDiscount ? t('save', { percent: discountPercent }) : null
    };
  });

  const activePlan = processedPlans[activePlanIdx];

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#FAFAFA] py-20"
      id="compare"
    >
      {/* Decorative Blob - Left side */}
      <div className="pointer-events-none absolute top-1/2 left-0 -ml-[100px] h-[500px] w-[280px] -translate-y-1/2 -rotate-[8.31deg] bg-[rgba(167,120,250,0.5)] opacity-40 blur-[80px]" />

      <div className="relative z-10 container mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-dm-sans mb-4 text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-bold tracking-tight text-[#1E1F21]">
            {t('title')}
          </h2>
          <p className="font-dm-sans text-[clamp(1rem,2vw,1.125rem)] leading-[1.3] font-normal text-[#667085]">
            {t('subtitle')}
          </p>
        </div>

        {/* Desktop Sticky Header */}
        <div className="sticky top-[80px] z-40 mb-8 hidden grid-cols-4 gap-8 border-b border-gray-200/60 bg-[#FAFAFA]/95 py-6 backdrop-blur-md lg:grid">
          <div className="col-span-1" />
          {processedPlans.map((plan, idx) => (
            <div
              key={idx}
              className="relative col-span-1 flex flex-col items-center"
            >
              {plan.highlight && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 transform rounded-full bg-[#8C52FF] px-4 py-1 text-xs font-bold tracking-wider text-white uppercase shadow-lg shadow-[#8C52FF]/30">
                  {t('popular')}
                </div>
              )}
              <h3 className="mb-0.5 text-xl font-bold text-[#1E1F21]">
                {plan.name}
              </h3>

              <div className="mb-3 flex flex-col items-center">
                {plan.hasDiscount && (
                  <span className="erfan-strikethrough text-[#AEAEAE] text-xs font-medium line-through decoration-slate-400/80 mb-0.5">
                    {plan.regularPriceDisplay}{t('perMonthSuffix')}
                  </span>
                )}
                <span className="text-sm font-medium text-gray-500">
                  {plan.finalPriceDisplay}{t('perMonthSuffix')}
                </span>
              </div>

              <Button
                onClick={() => handleAddToCart(plan)}
                className={cn(
                  'font-dm-sans h-11 w-full max-w-[200px] rounded-full font-bold transition-all duration-300',
                  plan.highlight
                    ? 'bg-[#8C52FF] text-white shadow-lg shadow-[#8C52FF]/20 hover:bg-[#7839EE]'
                    : 'bg-[#F9F6FF] text-[#8C52FF] ring-1 ring-[#8C52FF]/20 hover:bg-[#8C52FF] hover:text-white'
                )}
              >
                {isInCart(`hosting-${plan.id}`) ? 'Added to Cart' : t('getStarted')}
              </Button>
            </div>
          ))}
        </div>

        {/* Mobile Sticky Tabs */}
        <div className="sticky top-[70px] z-40 mb-6 bg-[#FAFAFA] py-3 lg:hidden">
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={handlePrev}
              className="shrink-0 p-1 text-gray-400 hover:text-gray-600"
              disabled={activePlanIdx === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div
              className="scrollbar-hide flex items-center gap-2 overflow-x-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {processedPlans.map((plan, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePlanIdx(idx)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all',
                    idx === activePlanIdx
                      ? 'bg-[#E9D7FE] text-[#1E1F21]'
                      : 'text-gray-500'
                  )}
                >
                  {plan.name}
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              className="shrink-0 p-1 text-gray-400 hover:text-gray-600"
              disabled={activePlanIdx === plans.length - 1}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6 pb-32 lg:pb-0">
          {/* Top Features Section */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-center gap-2">
              <div className="rounded-full bg-gray-100 p-1.5">
                <Star className="h-4 w-4 text-gray-600" fill="currentColor" />
              </div>
              <h3 className="text-lg font-bold text-[#1E1F21]">
                {t('topFeatures')}
              </h3>
            </div>

            <div className="space-y-0">
              {t.raw('topFeaturesList')?.map((row: any, rIdx: number) => (
                <div key={rIdx}>
                  {/* Desktop Row */}
                  <div className="hidden grid-cols-4 items-center gap-4 border-b border-gray-100 py-4 transition-colors last:border-0 hover:bg-gray-50/50 lg:grid">
                    <div className="col-span-1">
                      <span className="cursor-help border-b border-dotted border-gray-300 text-[15px] text-gray-700">
                        {row.feature}
                      </span>
                    </div>
                    {processedPlans.slice(0, 3).map((plan, pIdx) => {
                      const val = pIdx === 0 ? row.plan1 : pIdx === 1 ? row.plan2 : row.plan3;
                      const displayVal = val !== undefined ? val : 'true';
                      return (
                        <div
                          key={pIdx}
                          className="col-span-1 flex justify-center"
                        >
                          {renderCell(displayVal === 'true' ? true : displayVal === 'false' ? false : displayVal)}
                        </div>
                      )
                    })}
                  </div>

                  {/* Mobile Stacked Layout */}
                  <div className="border-b border-gray-100 py-4 last:border-0 lg:hidden">
                    <div className="mb-3 font-medium text-[#1E1F21]">
                      {row.feature}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {processedPlans.slice(0, 3).map((plan, pIdx) => {
                        const val = pIdx === 0 ? row.plan1 : pIdx === 1 ? row.plan2 : row.plan3;
                        const displayVal = val !== undefined ? val : 'true';
                        return (
                          <div
                            key={pIdx}
                            className={cn(
                              'flex flex-col items-center justify-center rounded-xl px-2 py-3 transition-colors',
                              pIdx === activePlanIdx
                                ? 'bg-[#F4EBFF]'
                                : 'bg-transparent'
                            )}
                          >
                            <span
                              className={cn(
                                'mb-1 text-[10px] font-bold uppercase',
                                pIdx === activePlanIdx
                                  ? 'text-[#8C52FF]'
                                  : 'text-[#8C52FF]'
                              )}
                            >
                              {plan.name.split(' ')[1] || plan.name}
                            </span>
                            {renderCell(displayVal === 'true' ? true : displayVal === 'false' ? false : displayVal)}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Accordions */}
          <Accordion type="multiple" className="w-full space-y-4">
            {[
              { id: 'wordpress', title: t('wordpress'), features: t.raw('wordpressFeatures') as { feature: string }[] },
              { id: 'support', title: t('support'), features: t.raw('supportFeatures') as { feature: string }[] },
            ].map((section) => (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="rounded-3xl border border-gray-100 bg-white px-6 py-2 shadow-sm md:px-8"
              >
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-gray-100 p-1.5">
                      {getSectionIcon(section.id)}
                    </div>
                    <span className="text-lg font-bold text-[#1E1F21]">
                      {section.title}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6">
                  {section.features?.map((item: any, rIdx) => (
                    <div key={rIdx}>
                      <div className="hidden grid-cols-4 items-center gap-4 border-b border-gray-100 py-4 last:border-0 lg:grid">
                        <div className="col-span-1">
                          <span className="text-[15px] text-gray-700">
                            {item.feature}
                          </span>
                        </div>
                        {processedPlans.map((_, pIdx) => {
                          const val = pIdx === 0 ? item.plan1 : pIdx === 1 ? item.plan2 : item.plan3;
                          const displayVal = val !== undefined ? val : 'true';
                          return (
                            <div
                              key={pIdx}
                              className="col-span-1 flex justify-center"
                            >
                              {renderCell(displayVal === 'true' ? true : displayVal === 'false' ? false : displayVal)}
                            </div>
                          );
                        })}
                      </div>
                      <div className="border-b border-gray-100 py-4 last:border-0 lg:hidden">
                        <div className="mb-3 font-medium text-[#1E1F21]">
                          {item.feature}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {processedPlans.map((plan, pIdx) => {
                            const val = pIdx === 0 ? item.plan1 : pIdx === 1 ? item.plan2 : item.plan3;
                            const displayVal = val !== undefined ? val : 'true';
                            return (
                              <div
                                key={pIdx}
                                className={cn(
                                  'flex flex-col items-center justify-center rounded-xl px-2 py-3',
                                  pIdx === activePlanIdx
                                    ? 'bg-[#F4EBFF]'
                                    : 'bg-transparent'
                                )}
                              >
                                <span className="mb-1 text-[10px] font-bold text-[#8C52FF] uppercase">
                                  {plan.name.split(' ')[1] || plan.name}
                                </span>
                                {renderCell(displayVal === 'true' ? true : displayVal === 'false' ? false : displayVal)}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      {activePlan && (
        <div
          className={`fixed right-0 bottom-0 left-0 z-[100] border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-transform duration-300 lg:hidden ${isInView ? 'translate-y-0' : 'translate-y-full'}`}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="text-sm text-[#1E1F21] flex flex-col items-center">
              {activePlan.hasDiscount && (
                <span className="erfan-strikethrough text-gray-400 text-xs mb-0.5 line-through decoration-slate-400/80">
                  {activePlan.regularPriceDisplay}{t('perMonthSuffix')}
                </span>
              )}
              <span className="font-bold">{activePlan.finalPriceDisplay}{t('perMonthSuffix')}</span>
            </div>
            <Button
              onClick={() => handleAddToCart(activePlan)}
              className="h-12 w-full rounded-full bg-[#8C52FF] font-bold text-white shadow-lg shadow-[#8C52FF]/20 hover:bg-[#7839EE]"
            >
              {isInCart(`hosting-${activePlan.id}`) ? 'Added to Cart' : `${t('choose')} ${activePlan.name}`}
            </Button>
            <span className="text-xs text-gray-500">{t('cancelAnytime')}</span>
          </div>
        </div>
      )}
    </section>
  );
}

function renderCell(value: string | boolean) {
  if (value === true)
    return <Check className="h-5 w-5 text-[#667085]" strokeWidth={2.5} />;
  if (value === false) return <Minus className="h-5 w-5 text-gray-300" />;
  return <span className="text-sm font-semibold text-[#1E1F21]">{value}</span>;
}

function getSectionIcon(id: string) {
  if (id === 'wordpress')
    return (
      <svg
        className="h-4 w-4 text-gray-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    );
  return (
    <svg
      className="h-4 w-4 text-gray-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
      />
    </svg>
  );
}

