'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

export default function WhyChoose() {
  const t = useTranslations('domain-search.whyChoose');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut' as const,
      },
    },
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={containerVariants}
      className="relative w-full overflow-hidden bg-[#FAFAFA] py-20 md:py-[120px]"
    >
      {/* Blob on Left - positioned to not touch top or bottom */}
      <div
        className="pointer-events-none absolute z-0"
        style={{
          width: '812px',
          height: '601px',
          left: '-486px',
          top: '50%',
          transform: 'translateY(-50%) rotate(-59.25deg)',
          background: 'rgba(167, 120, 250, 0.5)',
          opacity: 0.6,
          filter: 'blur(80px)',
          borderRadius: '50%',
        }}
      />

      <div className="relative z-10 container mx-auto flex w-full max-w-[1280px] flex-col items-center gap-12 px-4 sm:px-6 md:gap-16 md:px-12 lg:px-20 xl:px-0">
        {/* Header Section */}
        <div className="flex max-w-[768px] flex-col items-center gap-4 text-center md:gap-6">
          {/* Heading */}
          <motion.h2
            variants={itemVariants}
            className="font-dm-sans text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.2] font-bold text-[#1E1F21] will-change-transform"
          >
            {t('heading')}
          </motion.h2>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="font-roboto text-[clamp(0.875rem,1.5vw,1.125rem)] leading-[1.5] font-normal text-[#667085]"
          >
            {t('description')}
          </motion.p>
        </div>

        {/* Cards Grid */}
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {t.raw('cards').map((card: any, index: number) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex flex-col rounded-[20px] border border-[#DBD5D5] bg-white p-8 transition-all duration-300 hover:border-[#8C52FF] hover:shadow-lg"
            >
              <h3 className="font-dm-sans mb-4 text-xl leading-[1.2] font-bold text-[#1E1F21] md:mb-6 md:text-2xl">
                {card.heading}
              </h3>
              <p className="font-roboto text-sm leading-[1.5] font-normal text-[#667085] md:text-base">
                {card.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
