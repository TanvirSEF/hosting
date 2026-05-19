'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function PricingPhilosophySection() {
  const t = useTranslations('pricingPhilosophy');
  
  // Safe extraction of bullets array
  const bullets = t.raw('bullets') as string[];

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          
          {/* Image Column */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="relative w-full max-w-[550px] aspect-[4/3] sm:aspect-video lg:aspect-[1.1/1] rounded-[2rem] overflow-hidden shadow-md">
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
            <span className="text-[#8C52FF] font-semibold mb-3 text-sm md:text-base tracking-wide">
              {t('tagline')}
            </span>
            
            <h2 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-bold text-[#1A1A1A] mb-6 leading-[1.2] tracking-tight">
              {t('heading')}
            </h2>
            
            <div className="text-[#4A4A4A] space-y-5 mb-8 text-base leading-relaxed">
              <p>{t('p1')}</p>
              <p>{t.rich('p2', { bold: (chunks) => <strong className="font-bold text-[#1A1A1A]">{chunks}</strong> })}</p>
              <p>{t('p3')}</p>
            </div>

            <ul className="space-y-2.5 mb-10 w-full flex flex-col items-center lg:items-start">
              {Array.isArray(bullets) && bullets.map((bullet, index) => (
                <li key={index} className="flex items-center gap-3 text-[#4A4A4A] text-sm sm:text-base">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4A4A4A] flex-shrink-0" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <Link 
              href={t('ctaLink')}
              className="inline-flex justify-center items-center bg-[#8C52FF] hover:bg-[#7B42F6] text-white px-8 py-3.5 rounded-full font-semibold text-sm transition-all hover:shadow-lg hover:-translate-y-0.5 w-full sm:w-auto"
            >
              {t('cta')}
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
