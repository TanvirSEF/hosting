'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect, useCallback } from 'react';

interface Category {
  id: string;
  name: string;
}

interface BlogNavProps {
  categories: Category[];
  activeCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
}

export default function BlogNav({
  categories,
  activeCategory = 'all',
  onCategoryChange,
}: BlogNavProps) {
  const t = useTranslations('blogPage');
  const locale = useLocale();
  const blogBase = t('routes.blogBase') || '/blog';
  const categoryBase = t('routes.categoryBase') || '/blog/category';
  const resolveLink = (href: string) =>
    href.startsWith('http') ? href : `/${locale}${href.startsWith('/') ? href : `/${href}`}`;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // All categories including "all"
  const allCategories = [
    { id: 'all', name: t('categories.all') },
    ...categories,
  ];

  // Check scroll position to show/hide arrows
  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  // Initialize scroll check
  useEffect(() => {
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, [checkScrollPosition]);

  // Scroll to a specific direction
  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 150;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Scroll to center the clicked category
  const scrollToCenter = (element: HTMLElement) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    const scrollOffset =
      elementRect.left -
      containerRect.left -
      containerRect.width / 2 +
      elementRect.width / 2;

    container.scrollBy({
      left: scrollOffset,
      behavior: 'smooth',
    });
  };

  // Handle category click
  const handleCategoryClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    categoryId: string
  ) => {
    const target = e.currentTarget;
    scrollToCenter(target);
    onCategoryChange?.(categoryId);
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-[72px] z-40 border-b border-[#EAECF0] bg-white"
    >
      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12 xl:px-20">
        <div className="relative flex items-center py-4">
          {/* Left Arrow - Mobile only */}
          <button
            onClick={() => scroll('left')}
            className={`absolute left-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#EAECF0] bg-white/95 text-[#667085] shadow-md backdrop-blur-sm transition-all hover:text-[#8C52FF] md:hidden ${
              showLeftArrow ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Scrollable Categories Container */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScrollPosition}
            className="scrollbar-hide mx-auto flex items-center gap-2 overflow-x-auto scroll-smooth md:justify-center"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {allCategories.map((category, index) => (
              <Link
                key={category.id}
                href={
                  category.id === 'all'
                    ? resolveLink(blogBase)
                    : resolveLink(`${categoryBase}/${category.id}`)
                }
                onClick={(e) => handleCategoryClick(e, category.id)}
                className={`font-dm-sans flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeCategory === category.id
                    ? 'bg-[#8C52FF] text-white'
                    : 'text-[#667085] hover:bg-[#F5F5F5] hover:text-[#1E1F21]'
                }`}
              >
                {category.name}
              </Link>
            ))}
          </div>

          {/* Right Arrow - Mobile only */}
          <button
            onClick={() => scroll('right')}
            className={`absolute right-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#EAECF0] bg-white/95 text-[#667085] shadow-md backdrop-blur-sm transition-all hover:text-[#8C52FF] md:hidden ${
              showRightArrow ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
