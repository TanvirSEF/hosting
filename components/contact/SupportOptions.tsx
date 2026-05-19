'use client';

import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';

// Icons
const EmailSupportIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="2"
      y="4"
      width="20"
      height="16"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M2 7L12 13L22 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="18"
      cy="6"
      r="4"
      fill="#8C52FF"
      stroke="white"
      strokeWidth="2"
    />
  </svg>
);

const KnowledgeIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 6H16M8 10H14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const TicketIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15 5V7M15 11V13M15 17V19M5 5C3.89543 5 3 5.89543 3 7V10C4.10457 10 5 10.8954 5 12C5 13.1046 4.10457 14 3 14V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V14C19.8954 14 19 13.1046 19 12C19 10.8954 19.8954 10 21 10V7C21 5.89543 20.1046 5 19 5H5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function SupportOptions() {
  const t = useTranslations('contact-page.support');
  const locale = useLocale();
  const router = useRouter();

  const options = [
    {
      id: 'email',
      icon: EmailSupportIcon,
      title: t('email.title'),
      description: t('email.description'),
      action: t('email.action'),
      href: t('email.link') || 'mailto:support@webblyhost.com',
      color: 'from-blue-500 to-blue-600',
      external: false,
    },
    {
      id: 'knowledge',
      icon: KnowledgeIcon,
      title: t('knowledge.title'),
      description: t('knowledge.description'),
      action: t('knowledge.action'),
      href: t('knowledge.link') || '/blog/category/guides',
      color: 'from-emerald-500 to-emerald-600',
      external: false,
    },
    {
      id: 'ticket',
      icon: TicketIcon,
      title: t('ticket.title'),
      description: t('ticket.description'),
      action: t('ticket.action'),
      href: t('ticket.link') || '/dashboard/support',
      color: 'from-orange-500 to-orange-600',
      external: false,
    },
  ];

  const handleTicketClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const { checkUserLoginStatus } = await import('@/actions/domain-order-actions');
    const loginStatus = await checkUserLoginStatus();
    const dashboardHref = options.find((option) => option.id === 'ticket')?.href || '/dashboard/support';
    router.push(loginStatus.isLoggedIn ? dashboardHref : `/${locale}/login`);
  };

  return (
    <section className="bg-white py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="container mx-auto max-w-[1280px] px-4 sm:px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8 text-center sm:mb-10 md:mb-12 lg:mb-16"
        >
          <h2 className="font-dm-sans mb-3 text-[clamp(1.25rem,3vw,2.5rem)] font-bold text-[#1E1F21] sm:mb-4">
            {t('heading')}
          </h2>
          <p className="font-dm-sans mx-auto max-w-[600px] text-sm text-[#667085] sm:text-base md:text-lg">
            {t('subheading')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:gap-8 lg:grid-cols-3">
          {options.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {option.id === 'ticket' ? (
                <button
                  type="button"
                  onClick={handleTicketClick}
                  className="group block h-full w-full rounded-xl border border-gray-100 bg-[#FAFAFA] p-5 text-left transition-all duration-300 hover:border-[#8C52FF]/20 hover:shadow-xl sm:rounded-2xl sm:p-6 md:p-8"
                >
                  <div
                    className={`h-12 w-12 bg-gradient-to-br sm:h-14 sm:w-14 ${option.color} mb-4 flex items-center justify-center rounded-lg text-white transition-transform duration-300 group-hover:scale-110 sm:mb-5 sm:rounded-xl`}
                  >
                    <option.icon />
                  </div>
                  <h3 className="font-dm-sans mb-2 text-lg font-bold text-[#1E1F21] sm:mb-3 sm:text-xl">
                    {option.title}
                  </h3>
                  <p className="font-dm-sans mb-4 text-xs leading-relaxed text-[#667085] sm:mb-5 sm:text-sm">
                    {option.description}
                  </p>
                  <span className="font-dm-sans inline-flex items-center gap-2 text-xs font-semibold text-[#8C52FF] transition-all duration-200 group-hover:gap-3 sm:text-sm">
                    {option.action}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12H19M12 5L19 12L12 19" />
                    </svg>
                  </span>
                </button>
              ) : (
                <Link
                  href={option.href}
                  className="group block h-full rounded-xl border border-gray-100 bg-[#FAFAFA] p-5 transition-all duration-300 hover:border-[#8C52FF]/20 hover:shadow-xl sm:rounded-2xl sm:p-6 md:p-8"
                >
                  <div
                    className={`h-12 w-12 bg-gradient-to-br sm:h-14 sm:w-14 ${option.color} mb-4 flex items-center justify-center rounded-lg text-white transition-transform duration-300 group-hover:scale-110 sm:mb-5 sm:rounded-xl`}
                  >
                    <option.icon />
                  </div>
                  <h3 className="font-dm-sans mb-2 text-lg font-bold text-[#1E1F21] sm:mb-3 sm:text-xl">
                    {option.title}
                  </h3>
                  <p className="font-dm-sans mb-4 text-xs leading-relaxed text-[#667085] sm:mb-5 sm:text-sm">
                    {option.description}
                  </p>
                  <span className="font-dm-sans inline-flex items-center gap-2 text-xs font-semibold text-[#8C52FF] transition-all duration-200 group-hover:gap-3 sm:text-sm">
                    {option.action}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12H19M12 5L19 12L12 19" />
                    </svg>
                  </span>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
