'use client';

import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// Terminal Block Variants (Desktop)
const terminalVariants = {
  hidden: {
    opacity: 0,
    clipPath: 'inset(0 100% 0 0)',
  },
  visible: {
    opacity: 1,
    clipPath: 'inset(0 0 0 0)',
    transition: {
      duration: 0.3,
      ease: [0, 0, 1, 1] as any,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1 },
  },
};

export default function Services() {
  const t = useTranslations('services');
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<number>(-1); // -1 = All

  const categories = t.raw('categories');
  const allCards = t.raw('cards');

  // Filter cards based on active category
  const filteredCards =
    activeCategory === -1 ? allCards : [allCards[activeCategory]];

  const handleViewPlans = (card: any) => {
    const locale = window.location.pathname.split('/')[1] || 'en';
    // Use buttonLink from card data, fallback to default
    const route = card?.buttonLink || '/pricing';
    // Add #pricing if route doesn't already have a hash
    const finalRoute = route.includes('#') ? route : `${route}#pricing`;
    router.push(`/${locale}${finalRoute}`);
  };

  return (
    <section className="relative w-full bg-transparent py-16 md:py-[120px]">
      <div className="pointer-events-none absolute top-[57px] -right-[100px] h-[300px] w-[200px] rounded-full bg-[#A778FA]/40 opacity-60 blur-[60px] transform-gpu md:-right-[200px] md:h-[600px] md:w-[400px] md:blur-[80px]" />

      <div className="pointer-events-none absolute -bottom-[100px] -left-[100px] h-[300px] w-[200px] rounded-full bg-[#A778FA]/40 opacity-60 blur-[60px] transform-gpu md:-bottom-[250px] md:-left-[150px] md:h-[500px] md:w-[300px] md:blur-[80px]" />

      <div className="relative z-10 container mx-auto flex w-full max-w-[1920px] flex-col items-center gap-12 px-4 sm:px-6 md:gap-[64px] md:px-12 lg:px-20 xl:px-32">
        <div className="flex max-w-[800px] flex-col items-center gap-6 text-center">
          <span className="font-dm-sans text-[clamp(1rem,1.5vw,1.125rem)] leading-tight font-semibold text-[#1E1F21]">
            {t('tagline')}
          </span>
          <h2 className="font-dm-sans text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.3] font-bold text-[#1E1F21]">
            {t('heading')}
          </h2>
          <p className="font-dm-sans max-w-[664px] text-[clamp(1rem,1.5vw,1.125rem)] leading-[1.4] font-normal text-[#667085]">
            {t('description')}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {/* All Button */}
          <div
            onClick={() => setActiveCategory(-1)}
            className={cn(
              'group cursor-pointer rounded-full px-6 py-3 transition-all duration-300',
              'shadow-[0px_0px_30px_rgba(0,0,0,0.07)] hover:shadow-[0px_10px_40px_rgba(0,0,0,0.08)]',
              activeCategory === -1 ? 'bg-[#8C52FF]' : 'bg-white'
            )}
          >
            <span
              className={cn(
                'font-dm-sans whitespace-nowrap transition-colors',
                'text-[clamp(0.875rem,2vw,1.125rem)]',
                activeCategory === -1
                  ? 'font-semibold text-white'
                  : 'font-normal text-[#1E1F21] group-hover:text-[#8C52FF]'
              )}
            >
              All
            </span>
          </div>

          {/* Category Buttons */}
          {categories.map((cat: string, i: number) => (
            <div
              key={i}
              onClick={() => setActiveCategory(i)}
              className={cn(
                'group cursor-pointer rounded-full px-6 py-3 transition-all duration-300',
                'shadow-[0px_0px_30px_rgba(0,0,0,0.07)] hover:shadow-[0px_10px_40px_rgba(0,0,0,0.08)]',
                activeCategory === i ? 'bg-[#8C52FF]' : 'bg-white'
              )}
            >
              <span
                className={cn(
                  'font-dm-sans whitespace-nowrap transition-colors',
                  'text-[clamp(0.875rem,2vw,1.125rem)]',
                  activeCategory === i
                    ? 'font-semibold text-white'
                    : 'font-normal text-[#1E1F21] group-hover:text-[#8C52FF]'
                )}
              >
                {cat}
              </span>
            </div>
          ))}
        </div>

        {/* Filtered Cards with Terminal Animation */}
        <div className="flex w-full max-w-[1170px] flex-wrap justify-center gap-8">
          <AnimatePresence mode="wait">
            {filteredCards.map((service: any, index: number) => (
              <motion.div
                key={`${activeCategory}-${index}`}
                variants={terminalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{
                  delay: index * 0.05, // Tight stagger
                }}
                style={{ willChange: 'clip-path, opacity, transform' }}
                className="group flex w-full max-w-[364px] flex-col rounded-[20px] border border-gray-100 bg-white p-8 shadow-[0px_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0px_20px_40px_rgba(0,0,0,0.08)] transform-gpu md:p-10"
              >
                <h3 className="font-dm-sans mb-8 min-h-[66px] text-[clamp(1.25rem,1.5vw,1.375rem)] leading-[1.5] font-semibold text-[#1E1F21] transition-colors group-hover:text-[#8C52FF]">
                  {service.title}
                </h3>

                <div className="mb-10 flex flex-grow flex-col gap-3">
                  {service.features.map((feature: string, fIndex: number) => (
                    <div key={fIndex} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                        <Check
                          className="h-5 w-5 text-[#8C52FF]"
                          strokeWidth={2.5}
                        />
                      </span>
                      <span className="font-dm-sans text-[clamp(0.875rem,2vw,1rem)] font-normal text-[#667085]">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handleViewPlans(service)}
                  className="font-dm-sans h-[45px] w-full rounded-full bg-[#8C52FF] px-6 text-[16px] font-semibold text-white transition-all duration-300 hover:bg-[#7b42ff] hover:shadow-[0_4px_15px_rgba(140,82,255,0.35)]"
                >
                  {service?.buttonText || t('cta')}
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

