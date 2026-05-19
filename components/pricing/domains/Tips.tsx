'use client';

import { useTranslations } from 'next-intl';
import { Type, Hash, Award, Search, MapPin, Zap } from 'lucide-react';

export default function Tips() {
  const t = useTranslations('domains.tips');

  const tips = [
    { icon: Type, key: 'short' },
    { icon: Hash, key: 'simple' },
    { icon: Award, key: 'brand' },
    { icon: Search, key: 'availability' },
    { icon: MapPin, key: 'local' },
    { icon: Zap, key: 'fast' },
  ];

  return (
    <section className="relative overflow-hidden bg-[#FAFAFA] py-20">
      {/* Decorative Blob */}
      <div className="pointer-events-none absolute top-1/2 left-0 -ml-[100px] h-[500px] w-[280px] -translate-y-1/2 -rotate-[8.31deg] bg-[rgba(167,120,250,0.5)] opacity-40 blur-[80px]" />

      <div className="relative z-10 container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="font-dm-sans mb-4 text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-bold text-[#1E1F21]">
            {t('title')}
          </h2>
          <p className="font-dm-sans mx-auto max-w-2xl text-[clamp(1rem,2vw,1.125rem)] leading-[1.3] font-normal text-[#667085]">
            {t('subtitle')}
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tips.map((tip, index) => (
            <div
              key={index}
              className="group rounded-[24px] border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-[#8C52FF]/30 hover:shadow-xl md:p-8"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F9F6FF] transition-colors group-hover:bg-[#8C52FF]/20">
                <tip.icon className="h-6 w-6 text-[#8C52FF]" />
              </div>
              <h3 className="font-dm-sans mb-3 text-lg font-bold text-[#1E1F21]">
                {t(`items.${tip.key}.title`)}
              </h3>
              <p className="font-dm-sans text-sm leading-relaxed text-[#667085]">
                {t(`items.${tip.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
