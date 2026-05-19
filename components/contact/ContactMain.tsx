'use client';

import ContactForm from './ContactForm';
import ContactInfo from './ContactInfo';

export default function ContactMain() {
  return (
    <section className="relative overflow-hidden bg-[#FAFAFA] py-12 sm:py-16 md:py-20 lg:py-24">
      {/* Decorative blob */}
      <div
        className="pointer-events-none absolute z-0 hidden md:block"
        style={{
          width: '500px',
          height: '500px',
          right: '-250px',
          top: '100px',
          background: 'rgba(167, 120, 250, 0.3)',
          opacity: 0.5,
          filter: 'blur(100px)',
          borderRadius: '50%',
        }}
      />

      <div className="relative z-10 container mx-auto max-w-[1280px] px-4 sm:px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 items-start gap-8 sm:gap-10 md:gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left - Contact Info */}
          <ContactInfo />

          {/* Right - Contact Form */}
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
