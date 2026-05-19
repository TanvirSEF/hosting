'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import {
  FileText,
  Briefcase,
  Image as ImageIcon,
  ShoppingCart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Card Component
function UseCaseCard({
  card,
  index,
  progress,
  total,
}: {
  card: any;
  index: number;
  progress: MotionValue<number>;
  total: number;
}) {
  // Range for THIS card to animate away.
  const step = 1 / total;
  const start = index * step;
  const end = (index + 1) * step;

  // Transforms
  const y = useTransform(
    progress,
    [start, end],
    [0, -800] // Fly UP substantially
  );

  const opacity = useTransform(
    progress,
    [start, start + 0.1],
    [1, 0] // Faster fade out
  );

  const scale = useTransform(
    progress,
    [start, end],
    [1, 0.95] // Reduced scale range
  );

  // Dynamic Z-Index: Index 0 (Top visual) must have highest z-index
  const zIndex = total - index;

  // Rotation: Static messy stack
  const rotation = index * 3;

  return (
    <motion.div
      style={{
        zIndex,
        y,
        scale,
        rotate: rotation,
        opacity: 1,
        transform: 'translateZ(0)',
        willChange: 'transform',
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
        WebkitPerspective: 1000,
        perspective: 1000,
        WebkitTransform: 'translateZ(0)',
      }}
      className={cn(
        'absolute top-0 left-0 w-full max-w-[580px] origin-center',
        'h-auto min-h-[266px] border border-[#DBD5D5] bg-white p-8',
        'transform-gpu rounded-[20px] shadow-sm opacity-100'
      )}
      transition={{
        duration: 0.3,
        ease: 'easeOut',
      }}
    >
      <div className="flex flex-col gap-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F9F6FF] text-[#8C52FF]">
          {getIcon(index)}
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="font-dm-sans text-2xl font-bold break-words hyphens-auto text-[#1E1F21]">
            {card.title}
          </h3>
          <p className="font-roboto text-base font-normal break-words hyphens-auto text-[#667085]">
            {card.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function getIcon(index: number) {
  const icons = [FileText, Briefcase, ImageIcon, ShoppingCart];
  const Icon = icons[index % icons.length];
  return <Icon className="h-6 w-6" />;
}

export default function EcommerceUseCases() {
  const t = useTranslations('ecommerce-hosting.useCases');
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const cards = t.raw('cards') as any[];

  return (
    <section
      ref={containerRef}
      className="relative h-[200vh] w-full bg-[#FAFAFA]"
      style={{
        contain: 'layout style paint',
        isolation: 'isolate',
      }}
    >
      <div
        className="sticky top-0 flex h-screen flex-col justify-start overflow-hidden pt-20 pb-10 lg:justify-center lg:pt-0 lg:pb-0"
        style={{
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      >
        <div className="pointer-events-none absolute top-[5%] -right-[150px] z-0 h-[300px] w-[300px] rounded-full bg-[rgba(167,120,250,0.4)] opacity-60 blur-[100px] lg:top-[12%] lg:-right-[200px] lg:h-[650px] lg:w-[600px]" />

        <div className="relative z-10 container mx-auto flex h-full w-full max-w-[1280px] flex-col items-center justify-start gap-12 px-4 lg:flex-row lg:justify-between lg:gap-20">
          {/* Left Side: Text */}
          <div className="flex w-full flex-shrink-0 flex-col gap-8 pt-0 lg:w-1/2 lg:pt-0">
            <div className="mx-auto flex max-w-[500px] flex-col gap-4 text-center lg:mx-0 lg:text-left">
              <h2 className="font-dm-sans text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.2] font-bold break-words hyphens-auto text-[#1E1F21]">
                {t('heading')}
              </h2>
              <p className="font-dm-sans text-[clamp(1rem,1.5vw,1.125rem)] leading-[1.6] font-normal break-words hyphens-auto text-[#667085]">
                {t('description')}
              </p>
            </div>
          </div>

          {/* Right Side: Card Stack */}
          <div className="relative flex min-h-[400px] w-full items-start justify-center pb-20 lg:h-auto lg:w-1/2 lg:items-center lg:pb-0">
            <div className="relative min-h-[300px] w-full max-w-[340px] sm:max-w-[580px]">
              {cards.map((card, index) => (
                <UseCaseCard
                  key={index}
                  card={card}
                  index={index}
                  progress={scrollYProgress}
                  total={cards.length}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
