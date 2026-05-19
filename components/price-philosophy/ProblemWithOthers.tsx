'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function ProblemWithOthers({ namespace = 'pricePhilosophy.problem' }: { namespace?: string }) {
  const t = useTranslations(namespace);
  
  return (
    <section className="relative w-full bg-gradient-to-br from-[#F5F1FF] to-[#FFFFFF] py-16 sm:py-20 md:py-24 lg:py-32 overflow-hidden">
      {/* Top Left Glow/Blop */}
      <div className="pointer-events-none absolute top-[150px] -left-[100px] z-0 h-[400px] w-[200px] rounded-full bg-[rgba(167,120,250,0.5)] opacity-60 blur-[60px] md:h-[500px] md:blur-[80px] lg:-left-[150px] lg:h-[600px] lg:w-[300px] xl:-left-[200px] xl:h-[700px] xl:w-[400px]" />

      <div className="relative z-10 container mx-auto max-w-[1920px] px-4 sm:px-6 md:px-6 lg:px-12 xl:px-20 2xl:px-32">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-16 xl:gap-24">
          
          {/* Left Content */}
          <div className="flex w-full flex-1 flex-col items-center text-center lg:items-start lg:text-left lg:max-w-xl xl:max-w-2xl">
            <span className="font-dm-sans mb-4 text-xs font-bold tracking-widest text-[#8C52FF] uppercase sm:text-sm">
              {t('tagline')}
            </span>
            
            <h2 className="font-dm-sans mb-6 text-[clamp(2rem,4vw,3rem)] leading-[1.1] font-bold tracking-tight text-[#1A1A1A]">
              {t('heading')}<br />
              <span className="text-[#8C52FF]">{t('headingGradient')}</span>
            </h2>
            
            <div className="font-dm-sans space-y-6 text-base leading-relaxed text-[#4A4A4A] sm:text-lg">
              <p>
                {t('paragraph1')}
              </p>
              <p>
                {t('paragraph2')}
              </p>
            </div>
          </div>

          {/* Right Image & Floating Card */}
          <div className="relative w-full flex-1">
            <div className="relative mx-auto aspect-[4/3] w-full max-w-[500px] overflow-visible lg:max-w-none">
              
              {/* Main Image */}
              <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[#0044E4] shadow-2xl">
                <Image
                  src="https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/price-philosophy/container.svg"
                  alt="Problem with other hosting companies"
                  fill
                  className="object-cover"
                />
              </div>


              
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
