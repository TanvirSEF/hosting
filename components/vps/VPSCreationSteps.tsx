'use client';

import { useTranslations } from 'next-intl';
import { motion, Variants } from 'framer-motion';

export default function VPSCreationSteps() {
  const t = useTranslations('vps.creationSteps');

  const steps = [
    {
      number: '01',
      title: t('steps.0.title'),
      description: t('steps.0.description'),
    },
    {
      number: '02',
      title: t('steps.1.title'),
      description: t('steps.1.description'),
    },
    {
      number: '03',
      title: t('steps.2.title'),
      description: t('steps.2.description'),
    },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 50,
        damping: 20,
      },
    },
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#FAFAFA] py-[120px]">
      {/* Right Side Glow/Blob - Mirrored from VPSFeatures */}
      <div className="pointer-events-none absolute top-[150px] -right-[100px] z-0 h-[300px] w-[200px] rounded-full bg-[rgba(167,120,250,0.5)] opacity-60 blur-[60px] md:h-[350px] md:blur-[80px] lg:-right-[150px] lg:h-[450px] lg:w-[300px] xl:-right-[200px] xl:h-[550px] xl:w-[400px]" />

      <div className="relative z-10 container mx-auto flex w-full max-w-[900px] flex-col items-center gap-16 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex max-w-[768px] flex-col items-center gap-4 text-center will-change-[transform,opacity]"
        >
          <span className="font-roboto text-sm font-semibold tracking-wide text-[#1E1F21] uppercase sm:text-base">
            {t('tagline')}
          </span>
          <h2 className="font-dm-sans text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.2] font-bold text-[#1E1F21]">
            {t('heading')}
          </h2>
        </motion.div>

        {/* Steps List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="flex w-full flex-col"
        >
          <div className="h-[1px] w-full bg-[#1E1F21]/10" />

          {steps.map((step, index) => (
            <div key={index} className="group">
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-start gap-4 py-8 sm:flex-row sm:items-center sm:gap-8 sm:py-10"
              >
                <span className="font-dm-sans text-4xl leading-none font-bold text-[#8C52FF] opacity-90 sm:text-5xl">
                  {step.number}
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="font-dm-sans text-xl font-bold text-[#1E1F21] sm:text-2xl">
                    {step.title}
                  </h3>
                  <p className="font-roboto max-w-xl text-base font-normal text-[#667085]">
                    {step.description}
                  </p>
                </div>
              </motion.div>
              <div className="h-[1px] w-full bg-[#1E1F21]/10 group-last:hidden" />
            </div>
          ))}

          <div className="h-[1px] w-full bg-[#1E1F21]/10" />
        </motion.div>
      </div>
    </section>
  );
}
