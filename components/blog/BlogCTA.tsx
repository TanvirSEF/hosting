'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Globe } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export default function BlogCTA() {
  const t = useTranslations('blogPage');
  const locale = useLocale();

  const resolveLink = (href: string) =>
    href.startsWith('http') ? href : `/${locale}${href.startsWith('/') ? href : `/${href}`}`;

  const services = [
    {
      key: 'webHosting',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 64 64"
          className="h-12 w-12"
        >
          <path
            fill="#8C52FF"
            d="m64.017,28.614l-11.6-15.472c3.775,5.028,11.6,15.475,11.6,15.475l-7.442.97-.038,17.41c-.451.107-27.394,6.517-27.456,6.5l-21.291-6.419-.069-19.123-6.722.613s12.868-14.141,12.889-14.156,36.5-3.936,36.538-3.912"
            strokeWidth="0"
          />
          <path
            fill="none"
            stroke="#8C52FF"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m50.427,10.503c-.036-.024-36.518,3.9-36.538,3.912S1,28.571,1,28.571l6.722-.613.069,19.123,21.291,6.419c.062.017,27.005-6.393,27.456-6.5l.038-17.41,7.442-.97s-13.551-18.091-13.591-18.117"
          />
          <path
            fill="none"
            stroke="#8C52FF"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m7.723,27.959l.068,19.123,21.289,6.419,27.456-6.5.04-17.415"
          />
          <line
            fill="none"
            stroke="#8C52FF"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            x1="29.079"
            y1="33.31"
            x2="29.079"
            y2="53.501"
          />
        </svg>
      ),
      color: 'from-[#8C52FF]/10 to-[#8C52FF]/5',
    },
    {
      key: 'wordpressHosting',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 64 64"
          className="h-12 w-12"
        >
          <path
            fill="#0073AA"
            d="m32,7c-13.807,0-25,11.193-25,25,0,13.807,11.193,25,25,25,13.807,0,25-11.193,25-25h0c0-13.808-11.192-25-24.999-25h-.001ZM10.082,31.999c-.003-3.074.644-6.114,1.898-8.92l10.455,28.645c-7.556-3.666-12.354-11.327-12.353-19.725Zm21.918,21.919c-2.096,0-4.181-.301-6.192-.893l6.577-19.11,6.74,18.458c.044.105.097.206.157.303-2.339.824-4.801,1.244-7.281,1.242h0Zm3.022-32.198c1.318-.068,2.508-.212,2.508-.212.499-.039.871-.475.833-.973s-.475-.871-.973-.833h0s-3.55.277-5.843.277c-2.154,0-5.772-.277-5.772-.277-.499-.039-.934.334-.973.833s.334.934.833.973c0,0,1.117.139,2.299.212l3.415,9.357-4.797,14.387-7.975-23.748c1.32-.068,2.507-.212,2.507-.212.499-.039.872-.474.833-.973s-.474-.872-.973-.833c0,0-3.551.277-5.843.277-.41,0-.895-.011-1.41-.026,6.644-10.113,20.228-12.926,30.342-6.282.98.643,1.906,1.365,2.77,2.156-.093-.005-.187-.018-.284-.018-2.089.063-3.734,1.802-3.68,3.891,0,1.807,1.042,3.333,2.153,5.14,1.152,1.808,1.778,3.901,1.808,6.045-.127,2.443-.692,4.844-1.668,7.088l-2.188,7.299-7.921-23.549Zm16.211-.237c5.694,10.424,2.052,23.486-8.215,29.46l6.694-19.359c1.063-2.483,1.629-5.15,1.667-7.851.002-.752-.047-1.504-.147-2.25h0Z"
            strokeWidth="0"
          />
        </svg>
      ),
      color: 'from-[#0073AA]/10 to-[#0073AA]/5',
    },
    {
      key: 'vpsHosting',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 64 64"
          className="h-12 w-12"
        >
          <rect
            x="8"
            y="12"
            width="48"
            height="16"
            rx="3"
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
          />
          <rect
            x="8"
            y="36"
            width="48"
            height="16"
            rx="3"
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
          />
          <circle cx="16" cy="20" r="3" fill="#10B981" />
          <circle cx="16" cy="44" r="3" fill="#10B981" />
          <rect
            x="24"
            y="18"
            width="24"
            height="4"
            rx="1"
            fill="#10B981"
            opacity="0.3"
          />
          <rect
            x="24"
            y="42"
            width="24"
            height="4"
            rx="1"
            fill="#10B981"
            opacity="0.3"
          />
        </svg>
      ),
      color: 'from-[#10B981]/10 to-[#10B981]/5',
    },
    {
      key: 'ecommerceHosting',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 64 64"
          className="h-12 w-12"
        >
          <path
            fill="#F59E0B"
            d="M29.6,55.6c0,2-1.6,3.7-3.7,3.7s-3.7-1.6-3.7-3.7,1.6-3.7,3.7-3.7,3.7,1.6,3.7,3.7ZM53.4,55.6c0,2-1.6,3.7-3.7,3.7s-3.7-1.6-3.7-3.7,1.6-3.7,3.7-3.7,3.7,1.6,3.7,3.7Z"
          />
          <path
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M60.8,16.6l-2.9,20.8c0,.2-.2.5-.3.6l-6,5c-.2,0-.4.2-.6.2h-30.7l-1.6,1.7v3.7h37M17.6,48.6v-5.1c0-.3.1-.5.3-.7l1.9-1.9L12.7,8.9,3.9,6.7"
          />
          <path fill="none" stroke="#F59E0B" strokeWidth="2" d="M15,15.6h43.6" />
        </svg>
      ),
      color: 'from-[#F59E0B]/10 to-[#F59E0B]/5',
    },
  ];

  return (
    <section className="bg-[#F8F5FF] py-16 md:py-20">
      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12 xl:px-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <h2 className="font-dm-sans mb-3 text-[clamp(1.75rem,3vw,2.5rem)] font-bold text-[#1E1F21]">
            {t('cta.heading')}
          </h2>
          <p className="font-dm-sans text-[clamp(1rem,1.5vw,1.125rem)] text-[#667085]">
            {t('cta.subheading')}
          </p>
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10 flex items-center justify-center gap-2"
        >
          <Globe className="h-4 w-4 text-[#8C52FF]" />
          <span
            className="font-dm-sans text-sm text-[#667085]"
            dangerouslySetInnerHTML={{ __html: t.raw('cta.trustedBy') }}
          />
        </motion.div>

        {/* Service Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => {
            const title = t(`cta.${service.key}.title`);
            const description = t(`cta.${service.key}.description`);
            const href = resolveLink(t(`cta.${service.key}.link`));
            return (
            <motion.div
              key={service.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                href={href}
                className="group block h-full rounded-2xl border border-[#EAECF0] bg-white p-6 transition-all duration-300 hover:border-[#8C52FF]/30 hover:shadow-lg"
              >
                {/* Icon */}
                <div
                  className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${service.color} mb-5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
                >
                  {service.icon}
                </div>

                {/* Content */}
                <h3 className="font-dm-sans mb-2 text-[clamp(1rem,1.5vw,1.125rem)] font-semibold text-[#1E1F21]">
                  {title}
                </h3>
                <p className="font-dm-sans mb-4 text-[clamp(0.875rem,1.2vw,1rem)] leading-relaxed text-[#667085]">
                  {description}
                </p>

                {/* Link */}
                <div className="flex items-center gap-1.5 text-sm font-medium text-[#8C52FF] transition-all duration-200 group-hover:gap-2.5">
                  <span className="text-xs tracking-wide uppercase">
                    {t('cta.viewPlans')}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            </motion.div>
          );
          })}
        </div>
      </div>
    </section>
  );
}
