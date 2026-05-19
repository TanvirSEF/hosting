'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function Hero() {
  const t = useTranslations('about.hero');

  return (
    <section className="relative overflow-hidden bg-[#06010E]">
      {/* Purple glow effect - same as legal pages */}
      <div className="pointer-events-none absolute -right-[10%] -bottom-[30%] z-0 h-[400px] w-[400px] bg-[radial-gradient(circle,rgba(140,82,255,0.35)_0%,rgba(6,1,14,0)_70%)] blur-[60px] md:h-[600px] md:w-[600px]" />
      <div className="pointer-events-none absolute -top-[20%] -left-[10%] z-0 h-[300px] w-[300px] bg-[radial-gradient(circle,rgba(140,82,255,0.2)_0%,rgba(6,1,14,0)_70%)] blur-[50px] md:h-[400px] md:w-[400px]" />

      <div className="relative z-10 container mx-auto max-w-[1400px] px-4 pt-32 pb-16 sm:px-6 md:pt-40 md:pb-20 lg:px-12 xl:px-20">
        <div className="flex flex-col items-center text-center">
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-dm-sans mb-4 text-[clamp(2.125rem,5vw,4.375rem)] leading-tight font-bold text-white"
          >
            {t('title')}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-dm-sans max-w-[700px] text-[clamp(0.875rem,1.8vw,1.125rem)] text-white/60"
          >
            {t('subtitle')}
          </motion.p>
        </div>
      </div>
    </section>
  );
}
