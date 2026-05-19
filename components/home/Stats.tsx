'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

// Counter animation hook
function useCounter(
  end: number,
  duration: number = 2000,
  start: boolean = false
) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      setCount(Math.floor(progress * end));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [end, duration, start]);

  return count;
}

export default function Stats({ namespace = 'stats' }: { namespace?: string }) {
  const t = useTranslations(namespace);
  const [hasViewed, setHasViewed] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasViewed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const stats = [
    {
      number: parseInt(t('clients.number')),
      suffix: t('clients.suffix'),
      label: t('clients.label'),
    },
    {
      number: parseInt(t('countries.number')),
      suffix: t('countries.suffix'),
      label: t('countries.label'),
    },
    {
      number: parseInt(t('experience.number')),
      suffix: t('experience.suffix'),
      label: t('experience.label'),
    },
    {
      number: parseInt(t('websites.number')),
      suffix: t('websites.suffix'),
      label: t('websites.label'),
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="flex w-full shrink-0 items-center bg-[#8C52FF] py-6 sm:py-8 md:py-8 lg:h-[140px] lg:py-0 xl:h-[160px] 2xl:h-[172px]"
    >
      <div className="relative container mx-auto w-full max-w-[1920px] px-4 sm:px-6 md:px-6 lg:px-12 xl:px-20 2xl:px-32">
        <div className="grid grid-cols-2 items-center gap-4 text-center sm:gap-6 md:grid-cols-4 md:gap-3 lg:gap-4 xl:gap-6 2xl:gap-8">
          {stats.map((stat, index) => (
            <StatItem
              key={index}
              target={stat.number}
              suffix={stat.suffix}
              label={stat.label}
              start={hasViewed}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatItem({
  target,
  suffix,
  label,
  start,
}: {
  target: number;
  suffix: string;
  label: string;
  start: boolean;
}) {
  const count = useCounter(target, 2000, start);

  return (
    <div className="flex flex-col items-center justify-center p-1">
      <div className="font-dm-sans mb-1 text-3xl leading-tight font-bold text-[#FFFFFF] sm:text-4xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl">
        {count}
        {suffix}
      </div>
      <div className="font-dm-sans text-xs font-normal text-[#FFFFFF] opacity-95 sm:text-sm md:text-sm lg:text-base xl:text-lg 2xl:text-xl">
        {label}
      </div>
    </div>
  );
}
