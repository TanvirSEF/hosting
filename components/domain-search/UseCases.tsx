'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function UseCases() {
  const t = useTranslations('domain-search.useCases');

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

  const cards = t.raw('cards') as {
    tagline: string;
    heading: string;
    text: string;
    image?: string;
  }[];

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={containerVariants}
      className="relative w-full overflow-hidden bg-[#FAFAFA] py-20 md:py-[112px]"
    >
      {/* Blob on Right - positioned to not touch top or bottom */}
      <div
        className="pointer-events-none absolute z-0"
        style={{
          width: '812px',
          height: '601px',
          right: '-400px',
          top: '50%',
          transform: 'translateY(-50%) rotate(-59.25deg)',
          background: 'rgba(167, 120, 250, 0.5)',
          opacity: 0.6,
          filter: 'blur(80px)',
          borderRadius: '50%',
        }}
      />

      <div className="relative z-10 container mx-auto flex w-full max-w-[1280px] flex-col items-center gap-12 px-4 sm:px-6 md:gap-20 md:px-12 lg:px-16 xl:px-0">
        {/* Section Title */}
        <div className="flex max-w-[768px] flex-col items-center gap-4 text-center md:gap-6">
          {/* Heading */}
          <motion.h2
            variants={itemVariants}
            className="font-roboto text-[clamp(1.75rem,4vw,3rem)] leading-[1.2] font-bold text-[#1E1F21] will-change-transform"
          >
            {t('heading')}
          </motion.h2>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="font-roboto text-[clamp(0.875rem,1.5vw,1.125rem)] leading-[1.5] font-normal text-[#1E1F21]"
          >
            {t('description')}
          </motion.p>
        </div>

        {/* Cards Grid */}
        <div className="flex w-full flex-col gap-6 md:gap-8">
          {/* First Row: 2 small cards + 1 horizontal card */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            {/* Small Card 1 */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col overflow-hidden rounded-[20px] border border-[#DBD5D5] bg-white transition-all duration-300 hover:border-[#8C52FF] hover:shadow-lg lg:col-span-1"
            >
              <div className="relative h-[171px] w-full bg-gray-100">
                <Image
                  src={cards[0]?.image || '/images/domain-search/image1.png'}
                  alt={cards[0].heading}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-2 p-6">
                <span className="font-roboto text-base font-semibold text-[#1E1F21]">
                  {cards[0].tagline}
                </span>
                <h3 className="font-roboto text-xl leading-[1.4] font-bold text-[#1E1F21] md:text-2xl">
                  {cards[0].heading}
                </h3>
                <p className="font-roboto text-sm leading-[1.5] font-normal text-[#667085] md:text-base">
                  {cards[0].text}
                </p>
              </div>
            </motion.div>

            {/* Small Card 2 */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col overflow-hidden rounded-[20px] border border-[#DBD5D5] bg-white transition-all duration-300 hover:border-[#8C52FF] hover:shadow-lg lg:col-span-1"
            >
              <div className="relative h-[171px] w-full bg-gray-100">
                <Image
                  src={cards[1]?.image || '/images/domain-search/image2.png'}
                  alt={cards[1].heading}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-2 p-6">
                <span className="font-roboto text-base font-semibold text-[#1E1F21]">
                  {cards[1].tagline}
                </span>
                <h3 className="font-roboto text-xl leading-[1.4] font-bold text-[#1E1F21] md:text-2xl">
                  {cards[1].heading}
                </h3>
                <p className="font-roboto text-sm leading-[1.5] font-normal text-[#667085] md:text-base">
                  {cards[1].text}
                </p>
              </div>
            </motion.div>

            {/* Horizontal Card (2 cols on lg) */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col overflow-hidden rounded-[20px] border border-[#DBD5D5] bg-white transition-all duration-300 hover:border-[#8C52FF] hover:shadow-lg md:flex-row lg:col-span-2"
            >
              <div className="relative h-[200px] min-h-[200px] w-full bg-gray-100 md:h-auto md:w-1/2">
                <Image
                  src={cards[2]?.image || '/images/domain-search/image3.png'}
                  alt={cards[2].heading}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col justify-center gap-2 p-6 md:w-1/2">
                <span className="font-roboto text-base font-semibold text-[#1E1F21]">
                  {cards[2].tagline}
                </span>
                <h3 className="font-roboto text-xl leading-[1.4] font-bold text-[#1E1F21] md:text-2xl">
                  {cards[2].heading}
                </h3>
                <p className="font-roboto text-sm leading-[1.5] font-normal text-[#667085] md:text-base">
                  {cards[2].text}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Second Row: 2 wide cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {/* Wide Card 1 */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col overflow-hidden rounded-[20px] border border-[#DBD5D5] bg-white transition-all duration-300 hover:border-[#8C52FF] hover:shadow-lg"
            >
              <div className="relative h-[171px] w-full bg-gray-100">
                <Image
                  src={cards[3]?.image || '/images/domain-search/image4.png'}
                  alt={cards[3].heading}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-2 p-6">
                <span className="font-roboto text-base font-semibold text-[#1E1F21]">
                  {cards[3].tagline}
                </span>
                <h3 className="font-roboto text-xl leading-[1.4] font-bold text-[#1E1F21] md:text-2xl">
                  {cards[3].heading}
                </h3>
                <p className="font-roboto text-sm leading-[1.5] font-normal text-[#667085] md:text-base">
                  {cards[3].text}
                </p>
              </div>
            </motion.div>

            {/* Wide Card 2 */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col overflow-hidden rounded-[20px] border border-[#DBD5D5] bg-white transition-all duration-300 hover:border-[#8C52FF] hover:shadow-lg"
            >
              <div className="relative h-[171px] w-full bg-gray-100">
                <Image
                  src={cards[4]?.image || '/images/domain-search/image5.png'}
                  alt={cards[4].heading}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-2 p-6">
                <span className="font-roboto text-base font-semibold text-[#1E1F21]">
                  {cards[4].tagline}
                </span>
                <h3 className="font-roboto text-xl leading-[1.4] font-bold text-[#1E1F21] md:text-2xl">
                  {cards[4].heading}
                </h3>
                <p className="font-roboto text-sm leading-[1.5] font-normal text-[#667085] md:text-base">
                  {cards[4].text}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
