'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import styles from '@/components/home/CTA.module.css';
import { usePathname } from 'next/navigation';

// 20 unique website preview images
const WEBSITE_IMAGES = [
  {
    src: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/domain-transfer/cta-ecommerce.webp',
    alt: 'E-commerce Website',
  },
  { src: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/domain-transfer/cta-saas.webp', alt: 'SaaS Website' },
  {
    src: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/domain-transfer/cta-restaurant.webp',
    alt: 'Restaurant Website',
  },
  {
    src: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/domain-transfer/cta-portfolio.webp',
    alt: 'Portfolio Website',
  },
  { src: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/domain-transfer/cta-blog.webp', alt: 'Blog Website' },
  { src: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/domain-transfer/cta-fitness.webp', alt: 'Fitness Website' },
  {
    src: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/domain-transfer/cta-realestate.webp',
    alt: 'Real Estate Website',
  },
  { src: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/domain-transfer/cta-agency.webp', alt: 'Agency Website' },
  {
    src: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/domain-transfer/cta-photography.webp',
    alt: 'Photography Website',
  },
  { src: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/domain-transfer/cta-law.webp', alt: 'Law Firm Website' },
  {
    src: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/domain-transfer/cta-medical.webp',
    alt: 'Medical Clinic Website',
  },
  {
    src: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/domain-transfer/cta-education.webp',
    alt: 'Education Website',
  },
  { src: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/domain-transfer/cta-travel.webp', alt: 'Travel Website' },
  { src: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/domain-transfer/cta-music.webp', alt: 'Music Website' },
  {
    src: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/domain-transfer/cta-nonprofit.webp',
    alt: 'Nonprofit Website',
  },
  { src: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/domain-transfer/cta-beauty.webp', alt: 'Beauty Spa Website' },
  {
    src: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/domain-transfer/cta-architecture.webp',
    alt: 'Architecture Website',
  },
  { src: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/domain-transfer/cta-gaming.webp', alt: 'Gaming Website' },
  { src: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/domain-transfer/cta-pet.webp', alt: 'Pet Store Website' },
  { src: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/domain-transfer/cta-bakery.webp', alt: 'Bakery Website' },
];

export default function CTA() {
  const t = useTranslations('domain-transfer.cta');
  const pathname = usePathname();
  const buttonLink = t('buttonLink') || '#transfer-hero';
  const locale = pathname.split('/')[1] || 'en';
  const resolvedButtonLink = buttonLink.startsWith('#')
    ? buttonLink
    : buttonLink.startsWith('http')
      ? buttonLink
      : `/${locale}${buttonLink.startsWith('/') ? buttonLink : `/${buttonLink}`}`;

  const ScrollImage = ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => (
    <div className={`relative w-full shrink-0 overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="rounded-lg object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 20vw"
      />
    </div>
  );

  const ScrollColumn = ({
    direction,
    className,
    animationClass,
    imageIndices,
  }: {
    direction: 'up' | 'down';
    className?: string;
    animationClass: string;
    imageIndices: number[];
  }) => (
    <div className={`h-full min-w-0 flex-1 overflow-hidden ${className || ''}`}>
      <div className={`flex flex-col gap-2 md:gap-4 ${animationClass}`}>
        {imageIndices.map((idx, i) => (
          <ScrollImage
            key={`first-${i}`}
            {...WEBSITE_IMAGES[idx]}
            className="h-[140px] rounded-lg md:h-[454px]"
          />
        ))}
        {imageIndices.map((idx, i) => (
          <ScrollImage
            key={`second-${i}`}
            {...WEBSITE_IMAGES[idx]}
            className="h-[140px] rounded-lg md:h-[454px]"
          />
        ))}
      </div>
    </div>
  );

  return (
    <section className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden bg-[#FAFAFA] py-20 md:min-h-[600px] lg:min-h-[900px]">
      <div className="absolute top-0 left-1/2 flex h-full w-full min-w-full -translate-x-1/2 items-center justify-center gap-2 overflow-hidden px-4 md:gap-4">
        <ScrollColumn
          direction="down"
          className="hidden xl:block"
          animationClass={styles.scrollDown}
          imageIndices={[0, 1, 2, 3]}
        />
        <ScrollColumn
          direction="up"
          animationClass={styles.scrollUp}
          imageIndices={[4, 5, 6, 7]}
        />
        <ScrollColumn
          direction="down"
          animationClass={styles.scrollDownFast}
          imageIndices={[8, 9, 10, 11]}
        />
        <ScrollColumn
          direction="up"
          animationClass={styles.scrollUpFast}
          imageIndices={[12, 13, 14, 15]}
        />
        <ScrollColumn
          direction="down"
          className="hidden xl:block"
          animationClass={styles.scrollDown}
          imageIndices={[16, 17, 18, 19]}
        />
      </div>

      <div className="absolute inset-0 z-10 bg-black/50" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-20 container mx-auto flex flex-col items-center gap-6 px-4 text-center md:gap-10 lg:gap-14"
      >
        <div className="flex max-w-[768px] flex-col items-center gap-4 md:gap-6 lg:gap-8">
          <h2 className="font-dm-sans text-[clamp(1.5rem,4vw,3.5rem)] leading-[120%] font-bold text-white">
            {t('heading')}
          </h2>
          <p className="font-dm-sans text-[clamp(0.875rem,2vw,1.125rem)] leading-[150%] font-normal text-white/90">
            {t('subheading')}
          </p>
        </div>

        <div className="flex w-full justify-center">
          <Button
            asChild
            className="group font-dm-sans h-auto rounded-full bg-[#8C52FF] px-6 py-3 text-sm font-semibold tracking-wide text-[#FFFFFF] uppercase shadow-[0_4px_20px_rgba(140,82,255,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#7b42ff] hover:shadow-[0_4px_25px_rgba(140,82,255,0.3)] active:translate-y-0 md:px-9 md:py-4 md:text-base 2xl:px-12 2xl:py-5 2xl:text-lg"
          >
            <a href={resolvedButtonLink}>{t('button')}</a>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
