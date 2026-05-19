'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

import { motion, AnimatePresence } from 'framer-motion';

export default function WordPressFeatures() {
  const t = useTranslations('wordpress-hosting.features');
  const [activeTab, setActiveTab] = useState<
    'performance' | 'ease' | 'security'
  >('performance');

  const tabs = [
    { id: 'performance', label: t('tabs.performance') },
    { id: 'ease', label: t('tabs.ease') },
    { id: 'security', label: t('tabs.security') },
  ] as const;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' as const },
    },
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#FAFAFA] py-[120px]">
      {/* Top Left Glow/Blop */}
      <div className="pointer-events-none absolute top-[150px] -left-[100px] z-0 h-[400px] w-[200px] rounded-full bg-[rgba(167,120,250,0.5)] opacity-60 blur-[60px] md:h-[500px] md:blur-[80px] lg:-left-[150px] lg:h-[600px] lg:w-[300px] xl:-left-[200px] xl:h-[700px] xl:w-[400px]" />

      <div className="relative z-10 container mx-auto flex w-full max-w-[1280px] flex-col items-center gap-16 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex max-w-[768px] flex-col items-center gap-8 text-center will-change-[transform,opacity]"
        >
          <div className="flex flex-col items-center gap-4">
            <span className="font-roboto text-center text-sm font-semibold tracking-wide text-[#1E1F21] uppercase sm:text-base">
              {t('tagline')}
            </span>
            <div className="flex flex-col items-center gap-6">
              <h2 className="font-dm-sans text-center text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.2] font-bold text-[#1E1F21]">
                {t('heading')}
              </h2>
              <p className="font-dm-sans max-w-[768px] text-center text-[clamp(1rem,1.5vw,1.125rem)] leading-[1.6] font-normal text-[#667085]">
                {t('description')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs Menu */}
        <div className="mb-8 flex w-full max-w-[800px] flex-wrap justify-center gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'font-roboto relative pb-2 text-base font-normal whitespace-nowrap transition-colors duration-300',
                activeTab === tab.id
                  ? '-mb-[1px] border-b-2 border-[#8C52FF] text-[#1E1F21]'
                  : 'text-[#667085] hover:text-[#1E1F21]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Features Grid - Wrapped with min-height to prevent layout collapse during tab transitions */}
        <div className="w-full min-h-[600px] sm:min-h-[500px] md:min-h-[400px] lg:min-h-[280px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
              className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 will-change-[transform,opacity]"
            >
              {t
                .raw(`content.${activeTab}`)
                .map((feature: any, index: number) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className={cn(
                      'flex h-full flex-col rounded-[20px] border border-[#DBD5D5] bg-white p-8 transition-all duration-300 hover:border-[#8C52FF] hover:shadow-[0px_4px_15px_rgba(0,0,0,0.05)] will-change-[transform,opacity] transform-gpu'
                    )}
                  >
                    <div className="flex flex-col gap-6">
                      <h3 className="font-dm-sans text-2xl leading-[1.2] font-bold text-[#1E1F21]">
                        {feature.title}
                      </h3>
                      <p className="font-roboto text-base leading-[1.5] font-normal text-[#667085]">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
