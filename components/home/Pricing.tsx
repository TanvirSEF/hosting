'use client';

import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { getSharedHostingPlansForHomeAction } from '@/actions/hosting-actions';
import { getDiscountRulesDirectAction } from '@/actions/discount-actions';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import type { DiscountRule } from '@/lib/discount-module';
import { trackAddToCart } from '@/lib/ga4';

export default function Pricing() {
  const { currency, formatPrice } = useCurrency();
  const [plans, setPlans] = useState<any[] | null>(null);
  const [discounts, setDiscounts] = useState<Record<number, number>>({});
  const [customCss, setCustomCss] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations('pricing');
  const locale = useLocale();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const plansResult = await getSharedHostingPlansForHomeAction(currency, locale);

      try {
        const json = await getDiscountRulesDirectAction();

        if (json.success && json.rules_detailed) {
          const { selectDiscountRuleForCycle } = await import('@/lib/discount-module');

          const discountMap: Record<number, number> = {};
          for (const [pidStr, rules] of Object.entries(json.rules_detailed)) {
            const pid = parseInt(pidStr);

            const selectedRule = selectDiscountRuleForCycle(rules as DiscountRule | DiscountRule[], 'annually');

            if (selectedRule && selectedRule.percentage) {
              discountMap[pid] = selectedRule.percentage;
            }
          }

          setDiscounts(discountMap);
          if (json.css) setCustomCss(json.css);
        }
      } catch (error) {
      }

      if (plansResult.success && plansResult.data) {
        setPlans(plansResult.data);
      } else {
        setPlans(null);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [currency, locale]);

  if (isLoading) {
    return (
      <section className="flex w-full flex-col items-center bg-[#FAFAFA] py-16 text-[#1E1F21] md:py-[120px]">
        <div className="container mx-auto flex w-full max-w-[1920px] flex-col items-center gap-16 px-4 sm:px-6 md:px-12 lg:px-20 xl:px-32">
          <div className="flex h-[400px] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#8C52FF]"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="flex w-full flex-col items-center bg-[#FAFAFA] py-16 text-[#1E1F21] md:py-[120px]">
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
      <div className="container mx-auto flex w-full max-w-[1920px] flex-col items-center gap-16 px-4 sm:px-6 md:px-12 lg:px-20 xl:px-32">
        <PricingContent plans={plans} discountRules={discounts} />
      </div>
    </section>
  );
}

function PricingContent({ plans, discountRules }: { plans: any[] | null, discountRules: Record<number, number> }) {
  const t = useTranslations('pricing');
  const { currency, formatPrice } = useCurrency();
  const { addToCart, isInCart } = useCart();

  const handleAddToCart = (plan: any) => {
    const itemId = `hosting-${plan.id}`;
    if (isInCart(itemId)) {
      toast.info('This plan is already in your cart');
      return;
    }
    const regularPriceRaw = plan.rawAnnualPrice ?? parseFloat(plan.price.replace(/[^0-9.]/g, ''));
    const pid = parseInt(plan.id);
    const discountPercent = pid && discountRules[pid] ? discountRules[pid] : 0;
    const price = discountPercent > 0 ? regularPriceRaw * (1 - discountPercent / 100) : regularPriceRaw;

    addToCart({
      type: 'hosting',
      productId: pid,
      productName: plan.name,
      billingCycle: 'annually',
      price,
      addons: [],
    });
    toast.success(`${plan.name} added to cart!`);

    trackAddToCart({
      currency,
      value: price,
      items: [{
        item_id: `hosting-${pid}`,
        item_name: plan.name,
        price,
        quantity: 1,
      }],
    });
  };

  if (!plans || plans.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Unable to load pricing plans</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex max-w-[800px] flex-col items-center gap-6 text-center">
        <h2 className="font-dm-sans text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.5] font-bold text-[#1E1F21] capitalize">
          {t('heading')}
        </h2>
        <p className="font-dm-sans text-[clamp(1rem,1.5vw,1.125rem)] leading-tight font-normal text-[#667085]">
          {t('subheading')}
        </p>
      </div>

      <div className="w-full max-w-[1360px] relative px-4 sm:px-12">
        <Carousel
          opts={{
            align: 'start',
            loop: false,
          }}
          className="w-full"
        >
          <CarouselContent className="md:-ml-4 xl:-ml-[70px] pt-4 pb-4">
            {plans.map((plan: any, index: number) => {

          const pid = plan.id ? parseInt(plan.id) : null;
          const discountPercent = pid && discountRules[pid] ? discountRules[pid] : 0;
          const hasDiscount = discountPercent > 0;


          const regularPriceRaw = parseFloat(plan.price.replace(/[^0-9.]/g, ''));
          const discountedPriceRaw = hasDiscount ? (regularPriceRaw * (1 - (discountPercent / 100))) : regularPriceRaw;

          const oldPriceDisplay = regularPriceRaw.toFixed(2);
          const finalPriceDisplay = discountedPriceRaw.toFixed(2);


          return (
            <CarouselItem key={plan.id || index} className="pl-4 md:pl-8 xl:pl-[70px] md:basis-1/2 lg:basis-1/3">
              <div
                className={cn(
                  'erfan-card group relative flex flex-col h-full rounded-[20px] border bg-white p-6 sm:p-8 transition-all duration-300',
                  plan.highlight
                    ? 'border-[#8C52FF] shadow-[0px_4px_15px_rgba(0,0,0,0.05)]'
                    : 'border-[#DBD5D5] hover:border-[#8C52FF] hover:shadow-[0px_4px_15px_rgba(0,0,0,0.05)]'
                )}
              >
              {plan.highlight && (
                <div className="font-dm-sans absolute -top-4 left-1/2 z-10 -translate-x-1/2 transform rounded-full bg-[#8C52FF] px-6 py-1.5 text-[14px] font-semibold tracking-wide whitespace-nowrap text-white shadow-lg shadow-[#8C52FF]/30">
                  {t('mostPopular')}
                </div>
              )}

              <div className="mb-4 flex flex-col gap-1">
                <h3 className="font-roboto text-[clamp(1.125rem,1.5vw,1.25rem)] leading-[1.4] font-bold text-[#1E1F21]">
                  {plan.name}
                </h3>
              </div>

              <div className="flex justify-between items-center h-8 mb-2">
                <div className="erfan-strikethrough text-[#AEAEAE] text-lg font-medium line-through decoration-[#AEAEAE]">
                  {hasDiscount && (
                    <>{formatPrice(parseFloat(oldPriceDisplay))}/{plan.unit.replace('/', '')}</>
                  )}
                </div>

                {hasDiscount && (
                  <div className="erfan-badge bg-[#8C52FF] text-white text-xs font-bold px-3 py-1.5 rounded-md">
                    {t('youSave')} {discountPercent}%
                  </div>
                )}
              </div>

              <div className="mb-2 flex flex-col gap-1">
                <div className="flex items-baseline gap-1">
                  <span className="erfan-price font-roboto text-[clamp(2.5rem,4vw,3.5rem)] leading-[1.2] font-bold text-[#1E1F21]">
                    {formatPrice(parseFloat(finalPriceDisplay))}
                  </span>
                  <span className="font-roboto text-xl font-medium text-[#1E1F21]">
                    <span className="text-base font-normal text-[#667085] ml-1">
                      /{plan.unit.replace('/', '')}
                    </span>
                  </span>
                </div>
              </div>

              <div className="erfan-first-year mb-6 flex flex-col gap-1">
                <span className="text-[#8C52FF] font-bold text-[18px]">
                  {t('firstYear')}
                </span>
                <div className="flex flex-col text-[15px] leading-snug text-[#4b5563]">
                  <span>
                    {t('from')} {formatPrice(parseFloat(oldPriceDisplay))}/{plan.unit.replace('/', '')}
                  </span>
                  <span>
                    {t('billedAnnually')}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => handleAddToCart(plan)}
                className={cn(
                  'erfan-btn font-dm-sans mb-8 h-[45px] w-full rounded-full text-[16px] font-semibold transition-all duration-300',
                  plan.highlight
                    ? 'bg-[#8C52FF] text-white hover:bg-[#7b42ff] hover:shadow-[0_4px_15px_rgba(140,82,255,0.35)]'
                    : 'border border-[#8C52FF] bg-[#F9F6FF] text-[#8C52FF] hover:bg-[#8C52FF] hover:text-white hover:shadow-[0_4px_15px_rgba(140,82,255,0.35)]'
                )}
              >
                {isInCart(`hosting-${plan.id}`) ? 'Added to Cart' : t('cta')}
              </Button>

              <div className="mb-8 h-[1px] w-full bg-[#AEAEAE]" />

              <div className="flex flex-col gap-4">
                {(plan.tagline ?? plan.description) && (
                  <div className="flex items-start gap-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                      <Check
                        className={cn(
                          'h-6 w-6',
                          plan.highlight
                            ? 'text-[#8C52FF]'
                            : 'text-[#1E1F21] transition-colors group-hover:text-[#8C52FF]'
                        )}
                        strokeWidth={2}
                      />
                    </div>
                    <span className="font-roboto text-[clamp(0.875rem,1.2vw,1rem)] leading-[1.5] font-normal text-[#1E1F21]">
                      {plan.tagline ?? plan.description}
                    </span>
                  </div>
                )}
                {plan.features.map((feature: string, i: number) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                      <Check
                        className={cn(
                          'h-6 w-6',
                          plan.highlight
                            ? 'text-[#8C52FF]'
                            : 'text-[#1E1F21] transition-colors group-hover:text-[#8C52FF]'
                        )}
                        strokeWidth={2}
                      />
                    </div>
                    <span className="font-roboto text-[clamp(0.875rem,1.2vw,1rem)] leading-[1.5] font-normal text-[#1E1F21]">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            </CarouselItem>
          );
        })}
          </CarouselContent>
          <div className="hidden sm:block">
            <CarouselPrevious className="-left-4 sm:-left-12 xl:-left-16" />
            <CarouselNext className="-right-4 sm:-right-12 xl:-right-16" />
          </div>
        </Carousel>
      </div>
    </>
  );
}