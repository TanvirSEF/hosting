'use client';

import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Check } from 'lucide-react';
import Link from 'next/link';

export default function PricePromise() {
  const t = useTranslations('pricePhilosophy.promise');
  const locale = useLocale();

  const cards = [
    {
      image: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/price-philosophy/growth.webp',
      title: t('cards.0.title'),
      description1: t('cards.0.description1'),
      description2: t('cards.0.description2'),
      footer: t('cards.0.footer'),
    },
    {
      image: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/price-philosophy/dashboard-2.webp',
      title: t('cards.1.title'),
      bullets: t.raw('cards.1.bullets') as string[],
      footer: t('cards.1.footer'),
    },
    {
      image: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/price-philosophy/dashboard-1.webp',
      title: t('cards.2.title'),
      description1: t('cards.2.description1'),
      footer: t('cards.2.footer'),
    },
  ];

  return (
    <section className="relative w-full bg-[#FFFFFF] py-16 sm:py-20 md:py-24 lg:py-32">
      <div className="container mx-auto max-w-[1920px] px-4 sm:px-6 md:px-6 lg:px-12 xl:px-20 2xl:px-32">
        <div className="flex flex-col lg:flex-row lg:items-start gap-12 lg:gap-16 xl:gap-24 relative">
          
          {/* Left Content - Sticky on Desktop */}
          <div className="flex w-full flex-col lg:w-5/12 xl:w-1/2 lg:sticky lg:top-32 lg:self-start z-10 lg:min-h-[100vh]">
            <span className="font-dm-sans mb-4 text-sm font-bold text-[#1A1A1A]">
              {t('tagline')}
            </span>
            
            <h2 className="font-dm-sans mb-6 text-[clamp(2rem,3.5vw,3.5rem)] leading-[1.1] font-bold text-[#1A1A1A]">
              {t('title')}
            </h2>
            
            <div className="font-roboto mb-6 space-y-4 text-base leading-relaxed text-[#4A4A4A] sm:text-lg">
              <p>{t('description1')}</p>
              <p>{t('description2')}</p>
            </div>
            
            <ul className="mb-8 space-y-3 font-roboto text-base text-[#4A4A4A] sm:text-lg">
              {t.raw('bullets').map((bullet: string, i: number) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#4A4A4A]" />
                  {bullet}
                </li>
              ))}
            </ul>
            
            <p className="font-dm-sans mb-10 text-lg font-bold text-[#1A1A1A]">
              {t('footer')}
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href={`/${locale}/pricing`}
                className="inline-flex h-14 items-center justify-center rounded-full bg-[#8C52FF] px-8 font-dm-sans text-sm font-bold text-white transition-all hover:bg-[#7B43E6] hover:shadow-lg"
              >
                {t('cta1')}
              </Link>
              <Link
                href={`/${locale}/pricing`}
                className="inline-flex h-14 items-center justify-center rounded-full border border-[#E5E5E5] bg-transparent px-8 font-dm-sans text-sm font-bold text-[#1A1A1A] transition-all hover:border-[#1A1A1A] hover:bg-[#F9F9F9]"
              >
                {t('cta2')}
              </Link>
            </div>
          </div>

          {/* Right Content - Vertically Stacked Cards */}
          <div className="flex w-full flex-col lg:block lg:w-7/12 xl:w-1/2 relative z-20 lg:pb-[100vh]">
            {cards.map((card, index) => (
              <div 
                key={index} 
                className={`w-full sticky top-24 lg:top-32 flex flex-col bg-white min-h-[50vh] lg:min-h-[100vh] ${
                  index === cards.length - 1 ? 'mb-0' : 'mb-16 lg:mb-0'
                }`}
                style={{ zIndex: 10 + index }}
              >
                <div className="w-full flex flex-col pt-4 pb-8 lg:pb-12 h-full">
                  {/* Image */}
                  <div className="relative mb-8 lg:mb-10 w-full flex-shrink-0 overflow-hidden rounded-[16px] bg-[#F8F9FA] border border-[#E5E5E5] h-[250px] sm:h-[320px] lg:h-[360px] xl:h-[400px]">
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex flex-col flex-grow justify-start">
                    <h3 className="font-dm-sans mb-4 lg:mb-6 text-2xl font-bold text-[#1A1A1A] sm:text-3xl">
                      {card.title}
                    </h3>

                    {card.description1 && (
                      <p className="font-roboto mb-4 text-base text-[#4A4A4A] sm:text-lg">
                        {card.description1}
                      </p>
                    )}
                    {card.description2 && (
                      <p className="font-roboto mb-6 text-base text-[#4A4A4A] sm:text-lg">
                        {card.description2}
                      </p>
                    )}

                    {card.bullets && (
                      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {card.bullets.map((bullet: string, i: number) => (
                          <div key={i} className="flex items-center gap-3">
                            <Check className="h-5 w-5 flex-shrink-0 text-[#8C52FF]" />
                            <span className="font-roboto text-base text-[#4A4A4A] sm:text-lg">
                              {bullet}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 w-full">
                      <p className="font-dm-sans text-base font-bold text-[#1A1A1A] sm:text-lg">
                        {card.footer}
                      </p>
                      
                      {/* Separator Line for all but the last card */}
                      {index !== cards.length - 1 && (
                        <div className="mt-8 lg:mt-10 w-full border-b border-[#1A1A1A]" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
