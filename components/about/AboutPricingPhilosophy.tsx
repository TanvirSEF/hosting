'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function AboutPricingPhilosophy() {
  const t = useTranslations('about.pricingPhilosophy');
  
  // Safe extraction of bullets array
  const bullets = t.raw('bullets') as string[];

  return (
    <section className="py-16 md:py-24 bg-[#FAFAFA]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1200px]">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Image Column */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="relative w-full max-w-[600px] aspect-[4/3] sm:aspect-[4/3.5] lg:aspect-[1.15/1] rounded-3xl overflow-hidden shadow-md">
              <Image
                src="https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/pricing-philosophy.svg"
                alt="Pricing Philosophy"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Content Column */}
          <div className="w-full lg:w-1/2 flex flex-col items-center text-center lg:items-start lg:text-left">
            <span className="text-[#8C52FF] font-bold mb-3 text-[13px] tracking-wide">
              {t('tagline')}
            </span>
            
            <h2 className="text-[2.2rem] sm:text-[2.75rem] font-bold text-[#1A1A1A] mb-8 leading-[1.2] tracking-tight">
              {t('heading')}
            </h2>
            
            <div className="text-[#4A4A4A] space-y-6 mb-8 text-[15px] sm:text-base leading-relaxed">
              <p>{t('p1')}</p>
              <p>{t.rich('p2', { bold: (chunks) => <strong className="font-bold text-[#1A1A1A]">{chunks}</strong> })}</p>
              <p>{t('p3')}</p>
              <p>{t('p4')}</p>
            </div>

            <ul className="space-y-2 mb-10 w-full flex flex-col items-start ml-0 lg:ml-6">
              {Array.isArray(bullets) && bullets.map((bullet, index) => (
                <li key={index} className="flex items-center gap-3 text-[#1A1A1A] font-medium text-[14px]">
                  <div className="w-1 h-1 rounded-full bg-[#1A1A1A] flex-shrink-0" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <Link 
              href={t('ctaLink')}
              className="inline-flex justify-center items-center bg-[#8C52FF] hover:bg-[#7B42F6] text-white px-8 py-3.5 rounded-full font-semibold text-[13px] transition-all hover:shadow-lg hover:-translate-y-0.5 w-full sm:w-auto"
            >
              {t('cta')}
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
