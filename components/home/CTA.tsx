'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import styles from './CTA.module.css';

// 20 unique website preview images for showcase - no repetition
const WEBSITE_IMAGES = [
  { src: '/images/home/cta-ecommerce.png', alt: 'E-commerce Website' },
  { src: '/images/home/cta-saas.png', alt: 'SaaS Website' },
  { src: '/images/home/cta-restaurant.png', alt: 'Restaurant Website' },
  { src: '/images/home/cta-portfolio.png', alt: 'Portfolio Website' },
  { src: '/images/home/cta-blog.png', alt: 'Blog Website' },
  { src: '/images/home/cta-fitness.png', alt: 'Fitness Website' },
  { src: '/images/home/cta-realestate.png', alt: 'Real Estate Website' },
  { src: '/images/home/cta-agency.png', alt: 'Agency Website' },
  { src: '/images/home/cta-photography.png', alt: 'Photography Website' },
  { src: '/images/home/cta-law.png', alt: 'Law Firm Website' },
  { src: '/images/home/cta-medical.png', alt: 'Medical Clinic Website' },
  { src: '/images/home/cta-education.png', alt: 'Education Website' },
  { src: '/images/home/cta-travel.png', alt: 'Travel Website' },
  { src: '/images/home/cta-music.png', alt: 'Music Website' },
  { src: '/images/home/cta-nonprofit.png', alt: 'Nonprofit Website' },
  { src: '/images/home/cta-beauty.png', alt: 'Beauty Spa Website' },
  { src: '/images/home/cta-architecture.png', alt: 'Architecture Website' },
  { src: '/images/home/cta-gaming.png', alt: 'Gaming Website' },
  { src: '/images/home/cta-pet.png', alt: 'Pet Store Website' },
  { src: '/images/home/cta-bakery.png', alt: 'Bakery Website' },
];

export default function CTA({ namespace = 'cta' }: { namespace?: string }) {
  const t = useTranslations(namespace);

  // Image component with optimized loading
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

  // Column component with animation - each column has 4 unique images
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
  }) => {
    return (
      <div
        className={`h-full min-w-0 flex-1 overflow-hidden ${className || ''}`}
      >
        <div className={`flex flex-col gap-2 md:gap-4 ${animationClass}`}>
          {/* First set of images */}
          {imageIndices.map((idx, i) => (
            <ScrollImage
              key={`first-${i}`}
              {...WEBSITE_IMAGES[idx]}
              className="h-[140px] rounded-lg md:h-[454px]"
            />
          ))}
          {/* Duplicate set for seamless loop */}
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
  };

  return (
    <section className="relative flex min-h-[500px] w-full items-center justify-center overflow-hidden bg-[#FAFAFA] py-20 md:min-h-[900px]">
      <div className="absolute top-0 left-1/2 flex h-full w-full min-w-full -translate-x-1/2 items-center justify-center gap-2 overflow-hidden px-4 md:gap-4">
        {/* Column 1 - 4 unique images (xl only) */}
        <ScrollColumn
          direction="down"
          className="hidden xl:block"
          animationClass={`${styles.scrollDown} will-change-transform transform-gpu backface-hidden`}
          imageIndices={[0, 1, 2, 3]}
        />

        {/* Column 2 - 4 unique images */}
        <ScrollColumn
          direction="up"
          animationClass={`${styles.scrollUp} will-change-transform transform-gpu backface-hidden`}
          imageIndices={[4, 5, 6, 7]}
        />

        {/* Column 3 - 4 unique images */}
        <ScrollColumn
          direction="down"
          animationClass={`${styles.scrollDownFast} will-change-transform transform-gpu backface-hidden`}
          imageIndices={[8, 9, 10, 11]}
        />

        {/* Column 4 - 4 unique images */}
        <ScrollColumn
          direction="up"
          animationClass={`${styles.scrollUpFast} will-change-transform transform-gpu backface-hidden`}
          imageIndices={[12, 13, 14, 15]}
        />

        {/* Column 5 - 4 unique images (xl only) */}
        <ScrollColumn
          direction="down"
          className="hidden xl:block"
          animationClass={`${styles.scrollDown} will-change-transform transform-gpu backface-hidden`}
          imageIndices={[16, 17, 18, 19]}
        />
      </div>

      <div className="absolute inset-0 z-10 bg-black/50" />

      <div className="relative z-20 container mx-auto flex flex-col items-center gap-8 px-4 text-center md:gap-14">
        <div className="flex max-w-[768px] flex-col items-center gap-6 md:gap-8">
          <h2 className="font-dm-sans text-[clamp(1.75rem,3vw,2.5rem)] leading-[120%] font-bold text-white">
            {t('heading')}
          </h2>
          <p className="font-dm-sans text-[clamp(1rem,1.5vw,1rem)] leading-[150%] font-normal text-white">
            {t('subheading')}
          </p>
        </div>

        <div className="flex w-full justify-center">
          <Button
            asChild
            className="group font-dm-sans h-auto rounded-full bg-[#8C52FF] px-8 py-3.5 text-[0.875rem] font-semibold tracking-wide text-[#FFFFFF] uppercase shadow-[0_4px_20px_rgba(140,82,255,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#7b42ff] hover:shadow-[0_4px_25px_rgba(140,82,255,0.3)] active:translate-y-0 md:px-9 md:py-4 md:text-[0.925rem] 2xl:px-12 2xl:py-5 2xl:text-[1.125rem]"
          >
            <a href={t('buttonLink') || '#pricing'}>{t('button')}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
