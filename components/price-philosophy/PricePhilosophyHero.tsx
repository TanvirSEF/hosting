'use client';

import { Button } from '@/components/ui/button';
import { Check, ShieldCheck } from 'lucide-react';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function PricePhilosophyHero({ namespace = 'pricePhilosophy.hero' }: { namespace?: string }) {
  const t = useTranslations(namespace);
  return (
    <section className="relative flex flex-1 flex-col justify-center overflow-hidden bg-[#06010E]">
      {/* Glow */}
      <div className="pointer-events-none absolute -right-[20%] -bottom-[40%] z-0 h-[300px] w-[300px] bg-[radial-gradient(circle,rgba(140,82,255,0.4)_0%,rgba(6,1,14,0)_70%)] opacity-60 mix-blend-screen blur-[50px] md:-right-[5%] md:h-[600px] md:w-[600px] md:opacity-100 md:blur-[90px] lg:h-[900px] lg:w-[900px]" />
      <div className="h-[60px] w-full"></div>
      <div className="relative z-10 container mx-auto flex h-full w-full max-w-[1920px] flex-col items-center justify-center gap-8 px-4 pt-28 pb-12 sm:px-6 md:gap-8 md:px-6 md:py-6 lg:flex-row lg:justify-between lg:gap-10 lg:px-12 lg:py-8 xl:gap-16 xl:px-20 xl:py-10 2xl:gap-24 2xl:px-32">
        {/* Text */}
        <div className="flex w-full max-w-xl flex-1 flex-col items-center text-center lg:max-w-lg lg:items-start lg:text-left xl:max-w-2xl 2xl:max-w-4xl">
          <div className="mb-6 w-full space-y-3 md:mb-3 md:space-y-1.5 lg:mb-4 lg:space-y-2">
            <h2 className="font-dm-sans text-sm font-semibold tracking-wider text-[#8C52FF] uppercase sm:text-base md:text-base lg:text-base xl:text-lg 2xl:text-xl">
              {t('brandName')}
            </h2>
            <h1 className="font-dm-sans text-[clamp(2.125rem,4vw,3.5rem)] leading-[1.2] font-bold tracking-tight text-white xl:text-5xl 2xl:text-6xl">
              {t('mainTitle')}
            </h1>
          </div>

          <div className="mb-6 flex w-full flex-col items-center md:mb-4 lg:mb-5 lg:items-start">
            <p className="font-dm-sans mb-4 text-base leading-relaxed font-light text-[#F9F6FF] opacity-90 sm:text-lg md:mb-3 md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl">
              {t('paragraph1')}
            </p>
            <p className="font-dm-sans mb-6 text-base leading-relaxed font-light text-[#F9F6FF] opacity-80 sm:text-lg md:mb-5 md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl">
              {t('paragraph2')}
            </p>

            <div className="mb-6 flex flex-wrap justify-center gap-4 text-sm font-light text-[#F9F6FF] opacity-90 sm:gap-5 sm:text-base md:gap-5 md:text-base lg:justify-start lg:gap-6 lg:text-base xl:gap-8 xl:text-lg 2xl:text-xl">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 stroke-[3] text-[#8C52FF] sm:h-5 sm:w-5 md:h-5 md:w-5 lg:h-5 lg:w-5 xl:h-6 xl:w-6 2xl:h-7 2xl:w-7" />
                <span className="font-dm-sans whitespace-nowrap">
                  {t('features.feature1')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 stroke-[3] text-[#8C52FF] sm:h-5 sm:w-5 md:h-5 md:w-5 lg:h-5 lg:w-5 xl:h-6 xl:w-6 2xl:h-7 2xl:w-7" />
                <span className="font-dm-sans whitespace-nowrap">
                  {t('features.feature2')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 stroke-[3] text-[#8C52FF] sm:h-5 sm:w-5 md:h-5 md:w-5 lg:h-5 lg:w-5 xl:h-6 xl:w-6 2xl:h-7 2xl:w-7" />
                <span className="font-dm-sans whitespace-nowrap">
                  {t('features.feature3')}
                </span>
              </div>
            </div>
            
            <p className="font-dm-sans mb-8 text-base leading-relaxed font-normal text-[#F9F6FF] sm:text-lg md:mb-6 md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl">
              {t('conclusion')}
            </p>
          </div>

          <div className="flex w-full flex-col items-center gap-4 md:gap-3 lg:items-start lg:gap-4">
            <Link href={t('ctaLink') || '/pricing'}>
              <Button className="group font-dm-sans h-auto rounded-full bg-[#8C52FF] px-6 py-3 text-xs font-medium tracking-wide text-[#FFFFFF] uppercase shadow-[0_4px_30px_rgba(140,82,255,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#7b42ff] hover:shadow-[0_6px_40px_rgba(140,82,255,0.6)] active:translate-y-0 sm:px-7 sm:py-3.5 sm:text-sm md:px-7 md:py-3.5 md:text-sm lg:px-8 lg:py-4 lg:text-sm xl:px-9 xl:py-4.5 xl:text-base 2xl:px-12 2xl:py-5 2xl:text-lg">
                {t('cta')}
              </Button>
            </Link>

            <div className="flex items-center gap-2 text-[#FFFFFF]">
              <ShieldCheck className="h-4 w-4 stroke-[1.5] text-white opacity-90 sm:h-5 sm:w-5 md:h-5 md:w-5 lg:h-5 lg:w-5 xl:h-6 xl:w-6 2xl:h-7 2xl:w-7" />
              <span className="font-dm-sans text-xs font-light tracking-normal opacity-90 sm:text-sm md:text-sm lg:text-sm xl:text-base 2xl:text-lg">
                {t('guarantee')}
              </span>
            </div>
          </div>
        </div>

        {/* Static SVG Image */}
        <div className="relative hidden w-full flex-1 justify-end lg:flex">
          <div className="relative aspect-square w-full max-w-[400px] sm:max-w-[450px] md:max-w-[500px] lg:max-w-[550px] xl:max-w-[650px] 2xl:max-w-[850px]">
            <Image 
              src="/images/price-philosophy/hero.svg" 
              alt="Pricing Philosophy Illustration" 
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
