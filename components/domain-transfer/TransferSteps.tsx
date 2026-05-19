'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

// Custom professional icons for each step
const Step1Icon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="48" height="48" rx="12" fill="#F9F5FF" />
    <path
      d="M24 14V18M24 30V34M14 24H18M30 24H34M17.05 17.05L19.88 19.88M28.12 28.12L30.95 30.95M17.05 30.95L19.88 28.12M28.12 19.88L30.95 17.05"
      stroke="#8C52FF"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="24" cy="24" r="4" stroke="#8C52FF" strokeWidth="2" />
  </svg>
);

const Step2Icon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="48" height="48" rx="12" fill="#F9F5FF" />
    <path
      d="M16 20H32M16 24H32M16 28H26"
      stroke="#8C52FF"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <rect
      x="14"
      y="14"
      width="20"
      height="20"
      rx="2"
      stroke="#8C52FF"
      strokeWidth="2"
    />
  </svg>
);

const Step3Icon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="48" height="48" rx="12" fill="#F9F5FF" />
    <rect
      x="16"
      y="22"
      width="16"
      height="12"
      rx="2"
      stroke="#8C52FF"
      strokeWidth="2"
    />
    <path
      d="M20 22V18C20 15.79 21.79 14 24 14C26.21 14 28 15.79 28 18V22"
      stroke="#8C52FF"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="24" cy="28" r="2" fill="#8C52FF" />
  </svg>
);

const Step4Icon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="48" height="48" rx="12" fill="#F9F5FF" />
    <path
      d="M32 22L22 32L16 26"
      stroke="#8C52FF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="24" cy="24" r="10" stroke="#8C52FF" strokeWidth="2" />
  </svg>
);

const STEP_ICONS = [Step1Icon, Step2Icon, Step3Icon, Step4Icon];

// Card that stacks on top of previous cards
function StackingCard({
  index,
  step,
  Icon,
  totalSteps,
  scrollYProgress,
}: {
  index: number;
  step: { heading: string; text: string };
  Icon: any;
  totalSteps: number;
  scrollYProgress: any;
}) {
  // Use a slightly larger range for smoother transitions
  const stepSize = 1 / totalSteps;
  const start = Math.max(0, index * stepSize - 0.05); // Start slightly earlier for smoother entry
  const end = Math.min(1, (index + 1) * stepSize);

  // Smooth Y transition
  // We use a spring to dampen the mechanical feel of direct scroll mapping
  const inputY = useTransform(
    scrollYProgress,
    [start, end],
    ['120%', '0%']
  );

  const smoothY = useSpring(inputY, {
    stiffness: 400, // Higher stiffness for responsiveness
    damping: 40,    // Good damping to prevent overshoot but keep it buttery
    mass: 1
  });

  const opacity = useTransform(
    scrollYProgress,
    [start, start + 0.1], // Fade in quicker
    [0, 1]
  );

  // Scale effect for previous cards to create depth
  // Only scale nicely when covered, but keep top aligned
  // We use transformOrigin 'top center' in styles to ensure top stays fixed
  const scale = useTransform(
    scrollYProgress,
    [end, 1],
    [1, 1 - (totalSteps - index - 1) * 0.05]
  );

  return (
    <motion.div
      style={{
        y: smoothY,
        opacity,
        scale,
        zIndex: index + 1,
        transformOrigin: "top center" // Crucial: scale from top to keep header aligned
      }}
      className="absolute inset-0 flex flex-col gap-4 rounded-2xl border border-[#DBD5D5] bg-white p-6 shadow-lg md:p-8"
    >
      <Icon />
      <h3 className="font-roboto text-xl leading-[140%] font-bold text-[#1E1F21] md:text-2xl">
        {step.heading}
      </h3>
      <p className="font-roboto text-sm leading-[150%] font-normal text-[#1E1F21] md:text-base">
        {step.text}
      </p>
    </motion.div>
  );
}

export default function TransferSteps() {
  const t = useTranslations('domain-transfer.steps');
  const ctaLink = t('ctaLink') || '#transfer-hero';
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const [prevScroll, setPrevScroll] = useState(0);

  useEffect(() => {
    return scrollYProgress.on('change', (latest) => {
      const diff = latest - prevScroll;
      if (Math.abs(diff) > 0.001) { // Threshold to avoid jitter
        setScrollDirection(diff > 0 ? 'down' : 'up');
      }
      setPrevScroll(latest);
    });
  }, [scrollYProgress, prevScroll]);

  // Determine hint text based on direction and position
  // If at very top (0), only show "Scroll down"
  // If at very bottom (1), only show "Scroll up"
  // Otherwise, react to direction
  const hintText = useTransform(scrollYProgress, (latest) => {
    if (latest < 0.05) return t('scrollHint');
    if (latest > 0.95) return t('scrollHintUp');
    return scrollDirection === 'down' ? t('scrollHint') : t('scrollHintUp');
  });

  const arrowRotation = useTransform(scrollYProgress, (latest) => {
    if (latest < 0.05) return 0;
    if (latest > 0.95) return 180;
    return scrollDirection === 'down' ? 0 : 180;
  });

  const steps = t.raw('cards');

  return (
    <div
      ref={containerRef}
      className="relative bg-[#FAFAFA]"
      style={{ height: `${(steps.length + 1) * 60}vh` }} // Increased height for better scroll resolution
    >
      {/* Blob on Left - Fixed position so always visible */}
      <div
        className="pointer-events-none fixed z-0 hidden lg:block"
        style={{
          width: '812px',
          height: '601px',
          left: '-400px',
          top: '50%',
          transform: 'translateY(-50%) rotate(-59.25deg)',
          background: 'rgba(167, 120, 250, 0.5)',
          opacity: 0.6,
          filter: 'blur(80px)',
          borderRadius: '50%',
        }}
      />

      {/* Sticky container - page stops here while cards stack */}
      {/* Sticky container - page stops here while cards stack */}
      <div className="sticky top-0 flex min-h-screen items-center py-4 md:py-20 lg:overflow-visible">
        <div className="relative z-10 container mx-auto w-full max-w-[1280px] px-4 sm:px-6 md:px-12 lg:px-16 xl:px-0">
          <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-start lg:gap-20">
            {/* Left Content */}
            <div className="flex w-full flex-col items-start gap-4 lg:w-[45%] lg:gap-8">
              <div className="flex flex-col items-start gap-4 lg:gap-6">
                <h2 className="font-roboto text-[clamp(1.75rem,4vw,3.5rem)] leading-[1.2] font-bold text-[#1E1F21]">
                  {t('heading')}
                </h2>
                <p className="font-roboto text-base leading-[1.6] font-normal text-[#1E1F21] md:text-lg">
                  {t('description')}
                </p>
              </div>

              <Link href={ctaLink}>
                <Button className="font-dm-sans h-[56px] rounded-full bg-[#8C52FF] px-8 text-sm font-semibold tracking-wide text-white uppercase shadow-lg shadow-[#8C52FF]/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#7B42EE] hover:shadow-[#8C52FF]/30 md:h-[60px] md:px-10 md:text-base">
                  {t('cta')}
                </Button>
              </Link>

              {/* Scroll Indicator - Mobile Only */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                className="mt-2 flex flex-col items-center gap-2 text-[#8C52FF] lg:hidden"
              >
                {/* Text Container */}
                <span
                  className="font-roboto min-w-[140px] text-center text-sm font-medium tracking-wide"
                >
                  <motion.span>{hintText}</motion.span>
                </span>

                <motion.div style={{ rotate: arrowRotation }}>
                  <ArrowDown className="h-6 w-6" />
                </motion.div>
              </motion.div>
            </div>

            {/* Right Content - Cards stack on top of each other */}
            <div className="relative h-[320px] w-full md:h-[300px] lg:w-[55%]">
              {steps.map((step: any, index: number) => {
                const Icon = STEP_ICONS[index];
                return (
                  <StackingCard
                    key={index}
                    index={index}
                    step={step}
                    Icon={Icon}
                    totalSteps={steps.length}
                    scrollYProgress={scrollYProgress}
                  />
                );
              })}

              {/* Scroll Indicator - Desktop Only */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                className="absolute -bottom-24 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-[#8C52FF] lg:flex lg:-bottom-32"
              >
                {/* Text Container with Min Width to prevent layout shifts */}
                <motion.span
                  className="font-roboto min-w-[140px] text-center text-sm font-medium tracking-wide"
                >
                  <motion.span>{hintText}</motion.span>
                </motion.span>

                <motion.div style={{ rotate: arrowRotation }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
                  <ArrowDown className="h-6 w-6" />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
