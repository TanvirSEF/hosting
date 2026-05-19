'use client';

import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useConvertPrice } from '@/hooks/useConvertPrice';

export default function Pricing() {
  const t = useTranslations('domain-search.pricing');
  const { formatPlan } = useConvertPrice();
  const ctaLink = t('ctaLink') || '/domain-search';

  // Format translation prices with current currency symbol (no conversion)
  const plans = t.raw('plans').map((plan: any) => formatPlan(plan));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut' as const,
      },
    },
  };

  return (
    <motion.section
      id="pricing"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={containerVariants}
      className="flex w-full flex-col items-center bg-[#FAFAFA] py-16 text-[#1E1F21] md:py-[120px]"
    >
      <div className="container mx-auto flex w-full max-w-[1920px] flex-col items-center gap-16 px-4 sm:px-6 md:px-12 lg:px-20 xl:px-32">
        <div className="flex max-w-[800px] flex-col items-center gap-6 text-center">
          <motion.h2
            variants={itemVariants}
            className="font-dm-sans text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.5] font-bold text-[#1E1F21] capitalize"
          >
            {t('heading')}
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="font-dm-sans text-[clamp(1rem,1.5vw,1.125rem)] leading-tight font-normal text-[#667085]"
          >
            {t('subheading')}
          </motion.p>
        </div>

        <div className="grid w-full max-w-[1360px] grid-cols-1 gap-8 lg:grid-cols-3 xl:gap-[70px]">
          {plans.map((plan: any, index: number) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className={cn(
                'group relative flex flex-col rounded-[20px] border bg-white p-8 transition-all duration-300',
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

              <div className="mb-8 flex flex-col gap-1">
                <h3 className="font-roboto text-[clamp(1.125rem,1.5vw,1.25rem)] leading-[1.4] font-bold text-[#1E1F21]">
                  {plan.name}
                </h3>
              </div>

              <div className="mb-8 h-[1px] w-full bg-[#AEAEAE]" />

              <div className="mb-8 flex flex-col gap-2">
                <div className="flex items-end gap-1">
                  <span className="font-roboto text-[clamp(2.5rem,4vw,3.5rem)] leading-[1.2] font-bold text-[#1E1F21]">
                    {plan.price}
                  </span>
                  <span className="font-roboto mb-2 text-[clamp(0.875rem,1.2vw,1rem)] leading-[1.5] font-normal text-[#1E1F21]">
                    {plan.unit}
                  </span>
                </div>
                <p className="font-roboto text-[clamp(0.875rem,1.2vw,1rem)] leading-[1.5] font-normal text-[#1E1F21]">
                  {plan.orLabel} {plan.yearly}
                </p>
              </div>

              <Button
                asChild
                className={cn(
                  'font-dm-sans mb-8 h-[45px] w-full rounded-full text-[16px] font-semibold transition-all duration-300',
                  plan.highlight
                    ? 'bg-[#8C52FF] text-white hover:bg-[#7b42ff] hover:shadow-[0_4px_15px_rgba(140,82,255,0.35)]'
                    : 'border border-[#8C52FF] bg-[#F9F6FF] text-[#8C52FF] hover:bg-[#8C52FF] hover:text-white hover:shadow-[0_4px_15px_rgba(140,82,255,0.35)]'
                )}
              >
                <a href={ctaLink}>{t('cta')}</a>
              </Button>

              <div className="mb-8 h-[1px] w-full bg-[#AEAEAE]" />

              <div className="flex flex-col gap-4">
                {plan.description && (
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
                      {plan.description}
                    </span>
                  </div>
                )}
                {plan.features.map((feature: string, i: number) => (
                  <div key={i} className="flex items-start gap-4">
                    <div
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                        plan.highlight ? 'bg-transparent' : 'bg-transparent'
                      )}
                    >
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
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
