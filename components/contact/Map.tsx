'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function Map() {
  const t = useTranslations('contact-page.map');

  return (
    <section className="relative w-full bg-white py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="container mx-auto max-w-[1280px] px-4 sm:px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8 text-center sm:mb-10 md:mb-12"
        >
          <h2 className="font-dm-sans mb-3 text-[clamp(1.25rem,3vw,2rem)] font-bold text-[#1E1F21] sm:mb-4">
            {t('heading')}
          </h2>
          <p className="font-dm-sans mx-auto max-w-[500px] text-sm text-[#667085] sm:text-base">
            {t('subheading')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative h-[250px] w-full overflow-hidden rounded-xl border border-gray-200 shadow-lg sm:h-[300px] sm:rounded-2xl md:h-[400px] lg:h-[450px]"
        >
          {/* Google Maps Embed */}
          <iframe
            src={t('embedUrl') || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d51237.587824854!2d-4.678737525317771!3d36.60251147551066!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd72e161048e47bf%3A0x62913e843640b37!2sMijas%2C%20M%C3%A1laga%2C%20Spain!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0"
            title="WebblyHosting Location"
          />
        </motion.div>
      </div>
    </section>
  );
}
