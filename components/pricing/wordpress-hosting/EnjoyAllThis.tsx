'use client';

import { Lock, Zap, Shield, RefreshCw, Layers, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function EnjoyAllThis() {
  const t = useTranslations('wordpressHosting.enjoyAllThis');

  const features = [
    { icon: Lock, key: 'ssl' },
    { icon: Zap, key: 'acceleration' },
    { icon: RefreshCw, key: 'backups' },
    { icon: Shield, key: 'security' },
    { icon: Layers, key: 'staging' },
  ];

  return (
    <section className="bg-[#FAFAFA] py-12 md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        {/* Gradient background using theme colors */}
        <div className="relative flex flex-col items-center gap-10 overflow-hidden rounded-[32px] bg-gradient-to-br from-[#06010E] via-[#2E026D] to-[#06010E] p-8 shadow-2xl md:flex-row md:items-start md:gap-16 md:p-12 lg:items-center lg:p-16">
          {/* Background decorations */}
          <div className="pointer-events-none absolute top-0 right-0 -mt-20 -mr-20 h-[400px] w-[400px] rounded-full bg-[#8C52FF] opacity-25 blur-[150px]"></div>
          <div className="pointer-events-none absolute bottom-0 left-0 -mb-20 -ml-20 h-[300px] w-[300px] rounded-full bg-[#8C52FF] opacity-15 blur-[120px]"></div>

          <div className="z-10 w-full flex-1 text-center md:w-auto md:text-left">
            <h2 className="font-dm-sans mb-2 text-3xl font-bold text-white md:text-4xl">
              {t('title1')}
            </h2>
            <h2 className="font-dm-sans text-3xl font-bold text-white/90 md:text-4xl">
              {t('title2')}
            </h2>
          </div>

          <div className="z-10 grid w-full flex-[2] grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-2">
            {features.map((feature, index) => (
              <div key={index} className="group flex items-center gap-4">
                <div className="rounded-xl border border-[#8C52FF]/30 bg-[#8C52FF]/20 p-2.5 transition-all duration-300 group-hover:border-[#8C52FF]/50 group-hover:bg-[#8C52FF]/30">
                  <feature.icon className="h-5 w-5 text-[#8C52FF]" />
                </div>
                <span className="font-dm-sans text-[15px] font-medium text-white/90 md:text-base">
                  {t(`features.${feature.key}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
