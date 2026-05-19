'use client';

import { Link } from '@/i18n/routing';
import {
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  Github,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full">
      {/* Upper Footer Section - Light Grey Background */}
      <div className="bg-gray-100 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
            {/* Column 1: Hosting */}
            <div>
              <h3
                className="mb-6"
                style={{
                  fontFamily: 'var(--font-poppins)',
                  fontSize: '20px',
                  fontWeight: 600,
                  lineHeight: 'normal',
                  color: '#1E1F21',
                }}
              >
                {t('hosting.title')}
              </h3>
              <ul className="space-y-4">
                {[
                  {
                    href: t('hosting.sharedHostingLink'),
                    label: t('hosting.sharedHosting'),
                  },
                  {
                    href: t('hosting.wordpressHostingLink'),
                    label: t('hosting.wordpressHosting'),
                  },
                  { href: t('hosting.vpsHostingLink'), label: t('hosting.vpsHosting') },
                  {
                    href: t('hosting.ecommerceHostingLink'),
                    label: t('hosting.ecommerceHosting'),
                  },
                  { href: t('hosting.pricingLink'), label: t('hosting.pricing') },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="transition-opacity hover:opacity-80"
                      style={{
                        fontFamily: 'var(--font-poppins)',
                        fontSize: '16px',
                        fontWeight: 500,
                        lineHeight: '30px',
                        color: '#667085',
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Domains */}
            <div>
              <h3
                className="mb-6"
                style={{
                  fontFamily: 'var(--font-poppins)',
                  fontSize: '20px',
                  fontWeight: 600,
                  lineHeight: 'normal',
                  color: '#1E1F21',
                }}
              >
                {t('domains.title')}
              </h3>
              <ul className="space-y-4">
                {[
                  { href: t('domains.domainSearchLink'), label: t('domains.domainSearch') },
                  {
                    href: t('domains.domainTransferLink'),
                    label: t('domains.domainTransfer'),
                  },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="transition-opacity hover:opacity-80"
                      style={{
                        fontFamily: 'var(--font-poppins)',
                        fontSize: '16px',
                        fontWeight: 500,
                        lineHeight: '30px',
                        color: '#667085',
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Our Services */}
            <div>
              <h3
                className="mb-6"
                style={{
                  fontFamily: 'var(--font-poppins)',
                  fontSize: '20px',
                  fontWeight: 600,
                  lineHeight: 'normal',
                  color: '#1E1F21',
                }}
              >
                {t('ourServices.title')}
              </h3>
              <ul className="space-y-4">
                {[
                  { href: t('ourServices.vpnLink'), label: t('ourServices.vpn') },
                  { href: t('ourServices.seoToolLink'), label: t('ourServices.seoTool') },
                  { href: t('ourServices.sitebuilderLink'), label: t('ourServices.sitebuilder') },
                  { href: t('ourServices.sslLink'), label: t('ourServices.ssl') },
                ].map((item, index) => (
                  <li key={index}>
                    <Link
                      href={item.href}
                      className="transition-opacity hover:opacity-80"
                      style={{
                        fontFamily: 'var(--font-poppins)',
                        fontSize: '16px',
                        fontWeight: 500,
                        lineHeight: '30px',
                        color: '#667085',
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Support */}
            <div>
              <h3
                className="mb-6"
                style={{
                  fontFamily: 'var(--font-poppins)',
                  fontSize: '20px',
                  fontWeight: 600,
                  lineHeight: 'normal',
                  color: '#1E1F21',
                }}
              >
                {t('support.title')}
              </h3>
              <ul className="space-y-4">
                {[
                  { href: t('support.aboutLink'), label: t('support.about') },
                  { href: t('support.contactLink'), label: t('support.contact') },
                  { href: t('support.blogLink'), label: t('support.blog') },
                  { href: t('support.pricePhilosophyLink'), label: t('support.pricePhilosophy') },
                ].map((item) => (
                  <li key={item.href + item.label}>
                    <Link
                      href={item.href}
                      className="transition-opacity hover:opacity-80"
                      style={{
                        fontFamily: 'var(--font-poppins)',
                        fontSize: '16px',
                        fontWeight: 500,
                        lineHeight: '30px',
                        color: '#667085',
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Footer Section - Darker Grey Background */}
      <div className="bg-[#667085] py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            {/* Policy Links */}
            <div className="flex flex-col items-start gap-4 md:flex-row md:gap-8">
              {[
                { href: t('policy.legalLink'), label: t('policy.legal') },
                { href: t('policy.privacyLink'), label: t('policy.privacy') },
                { href: t('policy.termsLink'), label: t('policy.terms') },
                { href: t('policy.cookieLink'), label: t('policy.cookie') },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition-opacity hover:opacity-80"
                  style={{
                    fontFamily: 'var(--font-poppins)',
                    fontSize: '16px',
                    fontWeight: 500,
                    lineHeight: '30px',
                    color: '#ffffff',
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Copyright */}
            <p
              style={{
                fontFamily: 'var(--font-poppins)',
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '30px',
                color: '#ffffff',
              }}
            >
              {t('copyright', { year: currentYear })}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
