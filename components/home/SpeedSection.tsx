'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function SpeedSection() {
  const t = useTranslations('speed');
  const MAX_TIME = 2.2;

  return (
    <section className="relative -mt-[10px] w-full bg-transparent py-16 md:pt-[200px] md:pb-[120px]">
      <div className="pointer-events-none absolute -top-[100px] -left-[100px] h-[300px] w-[200px] rounded-full bg-[#A778FA]/40 opacity-60 mix-blend-multiply blur-[60px] md:-top-[250px] md:-left-[150px] md:h-[500px] md:w-[300px] md:blur-[80px]" />

      <div className="relative z-10 container mx-auto flex w-full max-w-[1360px] flex-col items-center justify-between gap-12 px-4 sm:px-6 md:px-12 lg:flex-row lg:gap-[30px] lg:px-20 xl:px-0">
        <div className="flex max-w-[587px] flex-col gap-6 text-center lg:text-left">
          <h2 className="font-dm-sans text-[clamp(1.75rem,2.5vw,2.5rem)] leading-[1.3] font-bold text-[#1E1F21]">
            {t('heading')}
          </h2>
          <p className="font-dm-sans text-justify text-[clamp(0.875rem,1.2vw,1rem)] leading-[1.5] font-normal hyphens-auto text-[#667085]">
            {t('description')}
          </p>
        </div>

        <div className="relative flex w-full max-w-[665px] flex-col gap-8 rounded-[20px] bg-[#8C52FF]/[0.08] p-6 sm:p-8">
          <div className="flex w-full flex-col gap-[15px]">
            {t.raw('competitors').map((comp: any, index: number) => {
              const widthPercent = (comp.time / MAX_TIME) * 100;
              const isShortBar = index < 3;
              const mobileMinWidth = isShortBar
                ? 90 + (comp.time - 0.35) * 150
                : 0;

              return (
                <div
                  key={index}
                  className={cn(
                    'relative flex h-[30px] w-full items-center overflow-visible rounded-[4px] bg-white',
                    comp.highlight ? 'border border-[#8C52FF]' : ''
                  )}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{
                      width: isShortBar
                        ? `max(${widthPercent}%, ${mobileMinWidth}px)`
                        : `${widthPercent}%`,
                    }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 1,
                      ease: 'easeOut',
                      delay: index * 0.1,
                    }}
                    className={cn(
                      'absolute top-0 left-0 z-10 h-full rounded-[4px] will-change-[width]',
                      comp.highlight ? 'bg-[#8C52FF]' : 'bg-[#F9F5FD]'
                    )}
                  />

                  <span
                    className={cn(
                      'font-dm-sans relative z-20 ml-3 text-[10px]',
                      comp.highlight
                        ? 'font-medium text-white'
                        : 'font-normal text-[#1E1F21]'
                    )}
                  >
                    {comp.name}
                  </span>

                  <motion.span
                    initial={{ opacity: 0, left: 0 }}
                    whileInView={{
                      opacity: 1,
                      left: isShortBar
                        ? `calc(max(${widthPercent}%, ${mobileMinWidth}px) + 10px)`
                        : `calc(${widthPercent}% + 10px)`,
                    }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 1,
                      ease: 'easeOut',
                      delay: index * 0.1,
                    }}
                    className="font-dm-sans absolute z-20 text-[8px] font-normal text-[#1E1F21] sm:text-[10px] will-change-[left,opacity]"
                  >
                    {comp.time}s
                  </motion.span>
                </div>
              );
            })}
          </div>

          <div className="relative mt-2 w-full border-t border-[#1E1F21] pt-2">
            <div className="absolute top-[-5px] left-0 flex w-full justify-between px-1">
              {Array.from({ length: 13 }).map((_, i) => {
                const val = (i * 0.2).toFixed(1);
                if (parseFloat(val) > MAX_TIME) return null;

                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="h-[5px] w-[1px] bg-[#1E1F21]" />
                    <span className="font-dm-sans text-[8px] text-[#1E1F21] sm:text-[10px]">
                      {val}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="font-dm-sans text-[14px] font-semibold text-[#667085] sm:text-[18px] md:text-[24px]">
              {t('legend')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
