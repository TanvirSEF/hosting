'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface BlogHeroProps {
  title?: string;
  description?: string;
}

export default function BlogHero({ title, description }: BlogHeroProps) {
  const t = useTranslations('blogPage');

  return (
    <section className="relative overflow-hidden bg-[#06010E]">
      {/* Purple glow effect - same as legal pages */}
      <div className="pointer-events-none absolute -right-[10%] -bottom-[30%] z-0 h-[400px] w-[400px] bg-[radial-gradient(circle,rgba(140,82,255,0.35)_0%,rgba(6,1,14,0)_70%)] blur-[60px] md:h-[600px] md:w-[600px]" />
      <div className="pointer-events-none absolute -top-[20%] -left-[10%] z-0 h-[300px] w-[300px] bg-[radial-gradient(circle,rgba(140,82,255,0.2)_0%,rgba(6,1,14,0)_70%)] blur-[50px] md:h-[400px] md:w-[400px]" />

      <div className="relative z-10 container mx-auto max-w-[1400px] px-4 pt-32 pb-16 sm:px-6 md:pt-40 md:pb-20 lg:px-12 xl:px-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h1 className="font-dm-sans mb-4 text-[clamp(2.125rem,5vw,4.375rem)] leading-tight font-bold text-white">
            {title || t('hero.title')}
          </h1>
          <p className="font-dm-sans text-[clamp(1rem,2vw,1.25rem)] leading-relaxed text-white/70">
            {description || t('hero.description')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
