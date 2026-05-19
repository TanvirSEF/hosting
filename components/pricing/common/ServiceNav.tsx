'use client';

import { Link } from '@/i18n/routing';
import { usePathname } from 'next/navigation';
import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type ServiceNavItem = {
  name: string;
  href: string;
  popular?: boolean;
};

const defaultServices: ServiceNavItem[] = [
  {
    name: 'Web Hosting',
    href: '/pricing',
    popular: false,
  },
  {
    name: 'VPS Hosting',
    href: '/pricing/vps-hosting',
    popular: false,
  },
  {
    name: 'WordPress Hosting',
    href: '/pricing/wordpress-hosting',
    popular: true,
  },
  {
    name: 'Domains',
    href: '/pricing/domains',
    popular: false,
  },
];

export default function ServiceNav({ items }: { items?: ServiceNavItem[] }) {
  const pathname = usePathname();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const services = Array.isArray(items) && items.length > 0 ? items : defaultServices;

  const isActive = (href: string) => {
    if (href === '/pricing') {
      return pathname?.endsWith('/pricing');
    }
    return pathname?.includes(href);
  };

  // Auto-scroll active item to center on mobile
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeLink = container.querySelector(
        '[data-active="true"]'
      ) as HTMLElement;

      if (activeLink) {
        const containerWidth = container.offsetWidth;
        const activeWidth = activeLink.offsetWidth;
        const activeLeft = activeLink.offsetLeft;

        // Calculate scroll position to center the active item
        const scrollPosition =
          activeLeft - containerWidth / 2 + activeWidth / 2;

        container.scrollTo({
          left: scrollPosition,
          behavior: 'smooth',
        });
      }
    }
  }, [pathname]);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -120, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 120, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative z-20 mt-12 mb-8 flex w-full justify-center px-4">
      {/* Mobile: With visible arrows */}
      <div className="flex w-full items-center gap-1 lg:hidden">
        <button
          onClick={handleScrollLeft}
          className="shrink-0 p-1 text-white/70 transition-colors hover:text-white"
          aria-label="Scroll left"
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div
          ref={scrollContainerRef}
          className="flex flex-1 items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-md"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {services.map((service) => {
            const active = isActive(service.href);
            return (
              <Link
                key={service.name}
                href={service.href}
                data-active={active}
                className={cn(
                  'font-dm-sans relative shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap transition-all duration-300',
                  active
                    ? 'bg-[#8C52FF] text-white shadow-lg shadow-[#8C52FF]/25'
                    : 'text-white/70 hover:text-white'
                )}
              >
                {service.name}
                {service.popular && !active && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8C52FF] opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8C52FF]"></span>
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <button
          onClick={handleScrollRight}
          className="shrink-0 p-1 text-white/70 transition-colors hover:text-white"
          aria-label="Scroll right"
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Desktop: Clean centered bar */}
      <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1.5 shadow-2xl shadow-purple-900/20 backdrop-blur-md lg:inline-flex">
        {services.map((service) => {
          const active = isActive(service.href);
          return (
            <Link
              key={service.name}
              href={service.href}
              className={cn(
                'font-dm-sans relative rounded-full px-6 py-3 text-sm font-medium whitespace-nowrap transition-all duration-300',
                active
                  ? 'bg-[#8C52FF] text-white shadow-lg shadow-[#8C52FF]/25'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              )}
            >
              {service.name}
              {service.popular && !active && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8C52FF] opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#8C52FF]"></span>
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
