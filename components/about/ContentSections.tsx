'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function ContentSections() {
  const t = useTranslations('about.sections');
  const sections = t.raw('items');

  return (
    <div className="bg-[#FAFAFA]">
      {sections.map((section: any, index: number) => {
        const isReversed = index % 2 === 1;

        return (
          <section key={index} className="py-12 sm:py-16 md:py-20">
            <div className="container mx-auto max-w-[1440px] px-4 sm:px-6 md:px-12 lg:px-20">
              <div
                className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-10 md:gap-16 lg:gap-20`}
              >
                {/* Content */}
                <motion.div
                  initial={{ opacity: 0, x: isReversed ? 30 : -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="flex w-full flex-col items-start gap-6 lg:w-1/2"
                >
                  <div className="flex flex-col items-start gap-4 lg:gap-6">
                    <h2 className="font-dm-sans text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.3] font-bold tracking-[-0.01em] text-[#1E1F21]">
                      {section.heading}
                    </h2>
                    <p className="font-dm-sans text-[clamp(1rem,1.5vw,1.125rem)] leading-[1.5] font-normal text-[#667085]">
                      {section.description}
                    </p>
                  </div>
                </motion.div>

                {/* Image */}
                <motion.div
                  initial={{ opacity: 0, x: isReversed ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="w-full lg:w-1/2"
                >
                  <div className="relative h-[300px] w-full overflow-hidden rounded-xl sm:h-[400px] sm:rounded-2xl md:h-[500px] lg:h-[640px]">
                    <Image
                      src={section.image}
                      alt={section.heading}
                      fill
                      className="object-cover"
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
