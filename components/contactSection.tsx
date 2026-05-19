'use client';

import Link from 'next/link';
import {
  Mail,
} from 'lucide-react';
import ContactForm from './contactForm';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import React from 'react';

export default function ContactSection({
  namespace = 'contact',
  formNamespace = 'contactForm',
}: {
  namespace?: string;
  formNamespace?: string;
} = {}) {
  const t = useTranslations(namespace);

  const handleShare = async (platform: string) => {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://webblyhost.com';

    switch (platform) {
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          '_blank',
          'noopener,noreferrer'
        );
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent('Check out WebblyHosting!')}`,
          '_blank',
          'noopener,noreferrer'
        );
        break;
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
          '_blank',
          'noopener,noreferrer'
        );
        break;
      case 'instagram':
        // Mobile: Try native share first
        if (typeof navigator !== 'undefined' && navigator.share) {
          try {
            await navigator.share({
              title: 'WebblyHosting',
              text: 'Check out WebblyHosting!',
              url,
            });
            return;
          } catch (error) {
          }
        }

        // Desktop/Fallback: Copy link to clipboard
        try {
          await navigator.clipboard.writeText(url);
          toast.success('Länk kopierad till urklipp', {
            style: {
              background: '#13191d',
              color: '#ffffff',
              border: '1px solid #333333',
              fontFamily: 'inherit',
            },
            description: 'Dela den på Instagram!',
          });
        } catch (err) {
          toast.error('Misslyckades att kopiera länk');
        }
        break;
      default:
        break;
    }
  };

  return (
    <section className="bg-gray-100 px-4 py-16">
      <div className="container mx-auto max-w-7xl">
        {/* Heading */}
        <h2 className="font-dm-sans mb-18 text-center text-[clamp(1.75rem,3vw,2.5rem)] leading-[52px] font-bold text-[#1E1F21]">
          {t('heading')}
        </h2>

        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
          {/* Left Section - Information */}
          <div className="space-y-8">
            <div>
              <h3 className="mb-4 text-2xl font-bold text-gray-900">
                {t('subheading')}
              </h3>
              <div className="space-y-4 leading-relaxed text-gray-700">
                <p>{t('description1')}</p>
                <p>{t('description2')}</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#8C52FF]" />
                <div>
                  <span className="font-medium text-gray-700">
                    {t('emailLabel')}{' '}
                  </span>
                  <a
                    href={`mailto:${t('email')}`}
                    className="text-[#8C52FF] transition-colors hover:text-[#7b42ff]"
                  >
                    {t('email')}
                  </a>
                </div>
              </div>

            </div>

            {/* Social Media Share Buttons */}
            <div className="pt-4">
              <h4 className="mb-4 font-bold text-gray-900">
                {t('info.social.title')}
              </h4>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {['facebook', 'instagram', 'twitter', 'linkedin'].map(
                  (platform) => (
                    <button
                      key={platform}
                      onClick={() => handleShare(platform)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-all duration-200 hover:border-[#8C52FF]/30 hover:bg-[#F9F5FF] hover:text-[#8C52FF] sm:h-10 sm:w-10"
                      aria-label={`Share on ${platform}`}
                    >
                      <SocialIcon platform={platform} />
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Right Section - Contact Form */}
          <div className="rounded-xl bg-white p-8 shadow-lg">
            <ContactForm namespace={formNamespace} />
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialIcon({ platform }: { platform: string }) {
  const icons: Record<string, React.ReactNode> = {
    facebook: (
      <svg
        width="16"
        height="16"
        className="sm:h-[18px] sm:w-[18px]"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    instagram: (
      <svg
        width="16"
        height="16"
        className="sm:h-[18px] sm:w-[18px]"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    twitter: (
      <svg
        width="16"
        height="16"
        className="sm:h-[18px] sm:w-[18px]"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    linkedin: (
      <svg
        width="16"
        height="16"
        className="sm:h-[18px] sm:w-[18px]"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  };
  return icons[platform] || null;
}
