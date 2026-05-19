'use client';

import { motion, useMotionValue, animate, PanInfo } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';

// Quote Icon using image
const QuoteIcon = () => (
  <div className="relative h-12 w-12">
    <Image
      src="/images/about/quote-icon.png"
      alt="Quote"
      fill
      className="object-contain"
    />
  </div>
);

export default function Testimonials() {
  const t = useTranslations('about.testimonials');
  const originalTestimonials = (t.raw('items') as any[]) || [];

  // Triple the testimonials for seamless infinite scroll
  const testimonials = [
    ...originalTestimonials,
    ...originalTestimonials,
    ...originalTestimonials,
  ];
  const totalOriginal = originalTestimonials.length;

  const containerRef = useRef<HTMLDivElement>(null);
  const cardWidth = 320; // Card width + gap
  const x = useMotionValue(-totalOriginal * cardWidth); // Start in the middle
  const isDragging = useRef(false);

  // Seamless loop check
  useEffect(() => {
    const unsubscribe = x.on('change', (latest) => {
      if (!isDragging.current) {
        const minX = -totalOriginal * 2 * cardWidth;
        const maxX = 0;

        if (latest <= minX) {
          x.set(latest + totalOriginal * cardWidth);
        } else if (latest >= (-totalOriginal * cardWidth) / 2) {
          x.set(latest - totalOriginal * cardWidth);
        }
      }
    });
    return () => unsubscribe();
  }, [x, totalOriginal]);

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    isDragging.current = false;

    // Apply momentum
    const velocity = info.velocity.x;
    const currentX = x.get();

    // Calculate target based on velocity
    const projectedEndpoint = currentX + velocity * 0.3;

    // Snap to nearest card
    const snappedX = Math.round(projectedEndpoint / cardWidth) * cardWidth;

    animate(x, snappedX, {
      type: 'spring',
      stiffness: 400,
      damping: 40,
      mass: 0.5,
    });
  };

  const handleDragStart = () => {
    isDragging.current = true;
  };

  const goToNext = () => {
    const currentX = x.get();
    animate(x, currentX + cardWidth, {
      type: 'spring',
      stiffness: 400,
      damping: 40,
      mass: 0.5,
    });
  };

  const goToPrev = () => {
    const currentX = x.get();
    animate(x, currentX - cardWidth, {
      type: 'spring',
      stiffness: 400,
      damping: 40,
      mass: 0.5,
    });
  };

  return (
    <section className="overflow-hidden bg-[#FAFAFA] py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="container mx-auto max-w-[1280px] px-4 sm:px-6 md:px-12 lg:px-16">
        {/* Header - Just the heading, no subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center md:mb-16"
        >
          <h2 className="font-roboto text-[clamp(1.5rem,4vw,2.5rem)] leading-[120%] font-bold text-[#1E1F21]">
            {t('heading')}
          </h2>
        </motion.div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Arrows */}
          <button
            onClick={goToPrev}
            className="absolute top-1/2 left-0 z-20 flex h-10 w-10 -translate-x-2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#1E1F21] shadow-lg transition-all duration-300 hover:bg-[#8C52FF] hover:text-white sm:h-12 sm:w-12 sm:-translate-x-4"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute top-1/2 right-0 z-20 flex h-10 w-10 translate-x-2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#1E1F21] shadow-lg transition-all duration-300 hover:bg-[#8C52FF] hover:text-white sm:h-12 sm:w-12 sm:translate-x-4"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Draggable Carousel */}
          <div
            ref={containerRef}
            className="mx-4 cursor-grab overflow-hidden select-none active:cursor-grabbing sm:mx-8"
          >
            <motion.div
              className="flex gap-4 will-change-transform sm:gap-6"
              style={{ x }}
              drag="x"
              dragConstraints={{ left: -99999, right: 99999 }}
              dragElastic={0}
              dragMomentum={false}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              dragTransition={{ power: 0.3, timeConstant: 200 }}
            >
              {testimonials.map((testimonial: any, index: number) => (
                <motion.div
                  key={index}
                  className="flex shrink-0 flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:rounded-2xl sm:p-6"
                  style={{ width: cardWidth - 24 }}
                >
                  {/* Quote Icon */}
                  <div className="mb-4">
                    <QuoteIcon />
                  </div>

                  {/* Stars */}
                  <div className="mb-4 flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 sm:h-6 sm:w-6 ${i < testimonial.rating ? 'fill-[#FFC107] text-[#FFC107]' : 'fill-gray-200 text-gray-200'}`}
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="font-roboto mb-6 flex-grow text-sm leading-relaxed text-[#1E1F21]">
                    {testimonial.quote}
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full sm:h-12 sm:w-12">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-roboto text-sm font-semibold text-[#1E1F21]">
                        {testimonial.name}
                      </p>
                      <p className="font-roboto text-xs text-[#667085]">
                        {testimonial.position}, {testimonial.company}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
