'use client';
import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface TabContent {
  id: number;
  title: string;
  description: string;
  image: string;
}

interface FeatureBlockProps {
  content: {
    tagline: string;
    heading: string;
    subheading: string;
    tabs: TabContent[];
  };
  reversed?: boolean;
  isMobile?: boolean;
}

// Feature block content
function FeatureBlockContent({
  content,
  reversed = false,
  isMobile = false,
}: FeatureBlockProps) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-[1440px] flex-col items-center px-4 sm:px-6 md:px-12 lg:px-20',
        isMobile
          ? 'gap-10 py-16'
          : 'h-full justify-center gap-8 py-8 lg:gap-12 lg:py-10'
      )}
    >
      {/* Header */}
      <div className="z-10 flex max-w-[800px] flex-col items-center gap-4 text-center lg:gap-6">
        <span className="font-dm-sans text-[clamp(1rem,1.5vw,1.125rem)] leading-tight font-semibold text-[#1E1F21]">
          {content.tagline}
        </span>
        <div className="flex flex-col gap-4">
          <h2 className="font-dm-sans text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.3] font-bold tracking-[-0.01em] text-[#1E1F21]">
            {content.heading}
          </h2>
          <p className="font-dm-sans mx-auto max-w-[664px] text-[clamp(1rem,1.5vw,1.125rem)] leading-[1.4] font-normal text-[#667085]">
            {content.subheading}
          </p>
        </div>
      </div>

      {/* Content */}
      <div
        className={cn(
          'relative z-10 flex w-full max-w-[1360px] flex-col-reverse items-center',
          isMobile ? 'gap-10' : 'gap-8 lg:gap-12',
          reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'
        )}
      >
        {/* Tabs */}
        <div className="flex w-full flex-col items-start lg:w-[50%] xl:w-[616px]">
          {content.tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                'flex w-full flex-col gap-3 border-b border-[rgba(102,112,133,0.3)] text-left last:border-0',
                isMobile ? 'py-5' : 'py-4 lg:py-5'
              )}
            >
              <h3 className="font-dm-sans text-[clamp(1.25rem,1.5vw,1.375rem)] leading-[1.5] font-semibold tracking-[-0.01em] text-[#1E1F21]">
                {tab.title}
              </h3>
              <p className="font-dm-sans text-[clamp(0.875rem,2vw,1rem)] leading-[1.5] font-normal text-[#667085]">
                {tab.description}
              </p>
            </div>
          ))}
        </div>

        {/* Image */}
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-[20px] bg-[#F2F4F7] shadow-sm lg:w-[50%] xl:w-[664px]',
            isMobile ? 'h-[300px]' : 'h-[40vh] max-h-[420px] min-h-[280px]'
          )}
        >
          <Image
            src={content.tabs[0].image}
            alt={content.tabs[0].title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 664px"
          />
        </div>
      </div>
    </div>
  );
}

export default function FeaturesTabs() {
  const t = useTranslations('features');
  const [isMobile, setIsMobile] = useState(false);
  const block2Ref = useRef(null);
  const block3Ref = useRef(null);

  const FEATURES_TABS_CONTENT = {
    tagline: t('performance.tagline'),
    heading: t('performance.heading'),
    subheading: t('performance.subheading'),
    tabs: t.raw('performance.tabs'),
  };

  const DEVELOPMENT_TABS_CONTENT = {
    tagline: t('development.tagline'),
    heading: t('development.heading'),
    subheading: t('development.subheading'),
    tabs: t.raw('development.tabs'),
  };

  const SECURITY_TABS_CONTENT = {
    tagline: t('security.tagline'),
    heading: t('security.heading'),
    subheading: t('security.subheading'),
    tabs: t.raw('security.tabs'),
  };

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };

  const { scrollYProgress: scrollYProgress2 } = useScroll({
    target: block2Ref,
    offset: ['start end', 'start start'],
  });
  const smoothProgress2 = useSpring(scrollYProgress2, springConfig);

  const { scrollYProgress: scrollYProgress3 } = useScroll({
    target: block3Ref,
    offset: ['start end', 'start start'],
  });
  const smoothProgress3 = useSpring(scrollYProgress3, springConfig);

  const opacity1 = useTransform(smoothProgress2, [0, 1], [0, 0.6]);
  const opacity2 = useTransform(smoothProgress3, [0, 1], [0, 0.6]);

  // Mobile: stacked layout
  if (isMobile) {
    return (
      <section className="relative w-full bg-[#FAFAFA]">
        {/* Performance */}
        <div className="relative w-full overflow-hidden bg-[#FAFAFA]">
          <div className="pointer-events-none absolute top-0 left-0 h-[400px] w-[300px] -translate-x-1/3 -translate-y-1/4 rotate-[8.31deg] bg-[rgba(167,120,250,0.15)] opacity-60 blur-[80px]" />
          <FeatureBlockContent
            content={FEATURES_TABS_CONTENT}
            isMobile={true}
          />
        </div>

        {/* Development */}
        <div className="relative w-full overflow-hidden bg-[#FAFAFA]">
          <div className="pointer-events-none absolute top-1/2 right-0 h-[400px] w-[300px] translate-x-1/3 -translate-y-1/2 rotate-[-12deg] bg-[rgba(167,120,250,0.15)] opacity-60 blur-[80px]" />
          <FeatureBlockContent
            content={DEVELOPMENT_TABS_CONTENT}
            reversed={true}
            isMobile={true}
          />
        </div>

        {/* Security */}
        <div className="relative w-full overflow-hidden bg-[#FAFAFA]">
          <div className="pointer-events-none absolute top-0 left-0 h-[400px] w-[300px] -translate-x-1/3 -translate-y-1/4 rotate-[8.31deg] bg-[rgba(167,120,250,0.15)] opacity-60 blur-[80px]" />
          <FeatureBlockContent
            content={SECURITY_TABS_CONTENT}
            isMobile={true}
          />
        </div>
      </section>
    );
  }

  // Desktop: sticky scroll animation
  return (
    <section className="relative w-full bg-[#FAFAFA]">
      {/* Performance */}
      <div className="panel relative sticky top-0 z-10 flex h-screen w-full items-center justify-center overflow-hidden rounded-b-[40px] bg-[#FAFAFA]">
        <motion.div
          style={{ opacity: opacity1, willChange: 'opacity' }}
          className="pointer-events-none absolute inset-0 z-[5] bg-black"
        />
        <div className="pointer-events-none absolute top-0 left-0 h-[600px] w-[400px] -translate-x-1/3 -translate-y-1/4 rotate-[8.31deg] bg-[rgba(167,120,250,0.2)] opacity-60 blur-[100px]" />
        <FeatureBlockContent content={FEATURES_TABS_CONTENT} />
      </div>

      {/* Development */}
      <div
        ref={block2Ref}
        className="panel relative sticky top-0 z-20 flex h-screen w-full items-center justify-center overflow-hidden rounded-b-[40px] bg-[#FAFAFA]"
      >
        <motion.div
          style={{ opacity: opacity2, willChange: 'opacity' }}
          className="pointer-events-none absolute inset-0 z-[5] bg-black"
        />
        <div className="pointer-events-none absolute top-1/2 right-0 h-[600px] w-[400px] translate-x-1/3 -translate-y-1/2 rotate-[-12deg] bg-[rgba(167,120,250,0.2)] opacity-60 blur-[100px]" />
        <FeatureBlockContent
          content={DEVELOPMENT_TABS_CONTENT}
          reversed={true}
        />
      </div>

      {/* Security */}
      <div
        ref={block3Ref}
        className="panel relative sticky top-0 z-30 flex h-screen w-full items-center justify-center overflow-hidden bg-[#FAFAFA]"
      >
        <div className="pointer-events-none absolute top-0 left-0 h-[600px] w-[400px] -translate-x-1/3 -translate-y-1/4 rotate-[8.31deg] bg-[rgba(167,120,250,0.2)] opacity-60 blur-[100px]" />
        <FeatureBlockContent content={SECURITY_TABS_CONTENT} />
      </div>
    </section>
  );
}
