'use client';

import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Comparison() {
  const t = useTranslations('comparison');

  return (
    <section className="relative z-40 w-full bg-[#FAFAFA] py-[112px]">
      <div className="container mx-auto flex max-w-[1360px] flex-col items-center gap-[64px] px-4 md:px-8">
        <div className="flex max-w-[768px] flex-col items-center gap-4 text-center">
          <span className="font-dm-sans text-[clamp(0.875rem,1.5vw,1rem)] leading-[150%] font-semibold text-[#1E1F21]">
            {t('tagline')}
          </span>
          <h2 className="font-dm-sans text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.2] font-bold tracking-[-0.01em] text-[#1E1F21]">
            {t('heading')}
          </h2>
          <p className="font-dm-sans text-[clamp(1rem,1.5vw,1rem)] leading-[150%] font-normal text-[#667085]">
            {t('subheading')}
          </p>
        </div>

        <div className="hidden w-full max-w-[1024px] md:block">
          <div className="grid grid-cols-3 items-end border-b border-gray-100 pb-4">
            <div className="col-span-1 pl-0">
              <h3 className="font-dm-sans text-[clamp(1.125rem,2vw,1.375rem)] leading-[150%] font-bold text-[#1E1F21]">
                {t('tableHeader')}
              </h3>
            </div>
            {t.raw('competitors').map((comp: any, i: number) => (
              <div
                key={i}
                className="col-span-1 flex flex-col items-center justify-end gap-1"
              >
                <h3 className="font-dm-sans text-center text-[clamp(1.125rem,2vw,1.375rem)] leading-[150%] font-bold text-[#1E1F21]">
                  {comp.name}
                </h3>
                <p className="font-inter text-center text-[clamp(0.875rem,1.5vw,1rem)] leading-[150%] font-normal text-[#667085]">
                  {comp.price}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-0">
            {t.raw('features').map((feature: any, i: number) => (
              <div
                key={i}
                className={`grid grid-cols-3 items-center ${i % 2 === 0 ? 'rounded-[12px] bg-white px-6 shadow-[0px_4px_30px_rgba(0,0,0,0.03)]' : 'px-6'}`}
              >
                <div className="col-span-1 flex h-[56px] items-center py-4">
                  <span className="font-inter text-[clamp(0.875rem,1.5vw,1rem)] leading-[150%] font-normal text-[#667085]">
                    {feature.name}
                  </span>
                </div>

                <div className="col-span-1 flex h-[56px] items-center justify-center py-4">
                  {feature.webbly === true || feature.webbly === 'true' ? (
                    <Check className="h-5 w-5 stroke-[2.5] text-[#667085]" />
                  ) : (
                    <span className="font-inter text-[clamp(0.875rem,1.5vw,1rem)] font-semibold text-[#667085]">
                      {feature.webbly}
                    </span>
                  )}
                </div>

                <div className="col-span-1 flex h-[56px] items-center justify-center py-4">
                  {feature.hostinger === true || feature.hostinger === 'true' ? (
                    <Check className="h-5 w-5 stroke-[2.5] text-[#667085]" />
                  ) : feature.hostinger === false || feature.hostinger === 'false' ? (
                    <X className="h-5 w-5 text-[#667085]" />
                  ) : (
                    <span className="font-inter text-[clamp(0.875rem,1.5vw,1rem)] font-semibold text-[#667085]">
                      {feature.hostinger}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-full max-w-[600px] flex-col gap-3 md:hidden">
          {t.raw('features').map((feature: any, i: number) => (
            <div
              key={i}
              className="rounded-[16px] bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.06)]"
            >
              <div className="font-inter mb-4 text-[15px] font-semibold text-[#667085]">
                {feature.name}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <div className="font-dm-sans text-[14px] font-bold text-[#1E1F21]">
                    WebblyHosting
                  </div>
                  <div className="flex items-center gap-2">
                    {feature.webbly === true || feature.webbly === 'true' ? (
                      <Check className="h-5 w-5 stroke-[2.5] text-[#667085]" />
                    ) : (
                      <span className="font-inter text-[14px] font-semibold text-[#667085]">
                        {feature.webbly}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="font-dm-sans text-[14px] font-bold text-[#1E1F21]">
                    Hostinger
                  </div>
                  <div className="flex items-center gap-2">
                    {feature.hostinger === true || feature.hostinger === 'true' ? (
                      <Check className="h-5 w-5 stroke-[2.5] text-[#667085]" />
                    ) : feature.hostinger === false || feature.hostinger === 'false' ? (
                      <X className="h-5 w-5 text-[#667085]" />
                    ) : (
                      <span className="font-inter text-[14px] font-semibold text-[#667085]">
                        {feature.hostinger}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 flex w-full justify-center md:mt-10">
          <Button
            onClick={() => {
              const locale = window.location.pathname.split('/')[1] || 'en';
              const ctaLink = t('ctaLink') || '/pricing';
              window.location.href = `/${locale}${ctaLink}`;
            }}
            className="group font-dm-sans h-auto rounded-full bg-[#8C52FF] px-8 py-3.5 text-[0.875rem] font-semibold tracking-wide text-[#FFFFFF] uppercase shadow-[0_4px_20px_rgba(140,82,255,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#7b42ff] hover:shadow-[0_4px_25px_rgba(140,82,255,0.3)] active:translate-y-0 md:px-9 md:py-4 md:text-[0.925rem] 2xl:px-12 2xl:py-5 2xl:text-[1.125rem]"
          >
            {t('cta')}
          </Button>
        </div>
      </div>
    </section>
  );
}
