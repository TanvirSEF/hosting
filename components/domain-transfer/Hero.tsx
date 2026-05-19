'use client';

import { Loader2, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useCurrency } from '@/contexts/CurrencyContext';

// Custom SVG Icons - Professional & Related
const SearchIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 shrink-0 text-[#1E1F21] opacity-80 md:h-6 md:w-6"
  >
    <circle
      cx="10"
      cy="10"
      r="6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.5 14.5L21 21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TransferIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-[#8C52FF]"
  >
    <path
      d="M7 16L3 12M3 12L7 8M3 12H16M17 8L21 12M21 12L17 16M21 12H8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LockIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
  >
    <rect
      x="3"
      y="11"
      width="18"
      height="11"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const UnlockIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
  >
    <rect
      x="3"
      y="11"
      width="18"
      height="11"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M7 11V7C7 4.23858 9.23858 2 12 2C14.0503 2 15.8124 3.2341 16.584 5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const GlobeIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-7 w-7 text-[#8C52FF]"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M2 12H22"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M12 2C14.5 4.5 16 8 16 12C16 16 14.5 19.5 12 22C9.5 19.5 8 16 8 12C8 8 9.5 4.5 12 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

const CalendarPlusIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-[#8C52FF]"
  >
    <rect
      x="3"
      y="4"
      width="18"
      height="18"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M16 2V6M8 2V6M3 10H21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M12 14V18M10 16H14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-[#8C52FF]"
  >
    <path
      d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 12L11 14L15 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DnsIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-[#8C52FF]"
  >
    <rect
      x="2"
      y="3"
      width="20"
      height="6"
      rx="1"
      stroke="currentColor"
      strokeWidth="2"
    />
    <rect
      x="2"
      y="15"
      width="20"
      height="6"
      rx="1"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="6" cy="6" r="1" fill="currentColor" />
    <circle cx="6" cy="18" r="1" fill="currentColor" />
    <path
      d="M10 6H18M10 18H18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const SupportIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-[#8C52FF]"
  >
    <path
      d="M3 18V12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12V18"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M21 16V18C21 19.1046 20.1046 20 19 20H18C16.8954 20 16 19.1046 16 18V15C16 13.8954 16.8954 13 18 13H21V16Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M3 16V18C3 19.1046 3.89543 20 5 20H6C7.10457 20 8 19.1046 8 18V15C8 13.8954 7.10457 13 6 13H3V16Z"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

const AlertIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
  >
    <path
      d="M12 9V13M12 17H12.01"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.56 20.74C2.86 20.92 3.21 21.01 3.56 21H20.44C20.79 21.01 21.14 20.92 21.44 20.74C21.74 20.56 22 20.3 22.18 20C22.36 19.7 22.45 19.36 22.45 19C22.45 18.64 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.27 3.32 12.96 3.15C12.65 2.98 12.31 2.89 11.96 2.89C11.61 2.89 11.27 2.98 10.96 3.15C10.65 3.32 10.39 3.56 10.21 3.86H10.29Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckCircleIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path
      d="M8 12L11 15L16 9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RefreshIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mr-2 h-4 w-4"
  >
    <path
      d="M1 4V10H7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M23 20V14H17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20.49 9C19.9828 7.56678 19.1209 6.28539 17.9845 5.27542C16.8482 4.26546 15.4745 3.55976 13.9917 3.22426C12.5089 2.88875 10.9652 2.93434 9.50481 3.35677C8.04437 3.77921 6.71475 4.5643 5.64 5.64L1 10M23 14L18.36 18.36C17.2853 19.4357 15.9556 20.2208 14.4952 20.6432C13.0348 21.0657 11.4911 21.1112 10.0083 20.7757C8.52547 20.4402 7.1518 19.7345 6.01547 18.7246C4.87913 17.7146 4.01717 16.4332 3.51 15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const GiftIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-[#8C52FF]"
  >
    <rect
      x="3"
      y="8"
      width="18"
      height="14"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path d="M12 8V22M3 12H21" stroke="currentColor" strokeWidth="2" />
    <path
      d="M12 8C12 8 12 5 9 5C7.5 5 6 6 6 7.5C6 8 12 8 12 8Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M12 8C12 8 12 5 15 5C16.5 5 18 6 18 7.5C18 8 12 8 12 8Z"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

interface TransferResult {
  domain: string;
  registrar: string;
  locked: boolean;
  expiry: string;
  transferable: boolean;
  price: number;
  originalPrice: number;
}

// Unlock Modal Component
function UnlockModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const t = useTranslations('domain-transfer.hero.modal');
  const unlockSteps =
    (t.raw('unlockSteps') as {
      step: number;
      title: string;
      description: string;
    }[]) || [];
  const registrars =
    (t.raw('registrars') as { name: string; url: string }[]) || [];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#8C52FF]/10 p-2.5">
                <UnlockIcon />
              </div>
              <h2 className="font-dm-sans text-xl font-bold text-[#1E1F21] md:text-2xl">
                {t('title')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 transition-colors hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6 p-6">
            {/* Steps */}
            <div className="space-y-4">
              {unlockSteps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="font-dm-sans flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8C52FF] to-[#6B3FC7] font-bold text-white shadow-lg shadow-[#8C52FF]/20">
                    {step.step}
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="font-dm-sans mb-1 font-semibold text-[#1E1F21]">
                      {step.title}
                    </h3>
                    <p className="font-dm-sans text-sm leading-relaxed text-[#667085]">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reference Image */}
            <div className="relative h-48 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100 md:h-64">
              <Image
                src="/images/domain-transfer-unlock.png"
                alt="Domain Lock Settings Example"
                fill
                className="object-contain"
              />
            </div>

            {/* Popular Registrars */}
            <div className="space-y-3">
              <h3 className="font-dm-sans font-semibold text-[#1E1F21]">
                {t('registrarGuides')}
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {registrars.map((registrar, index) => (
                  <a
                    key={index}
                    href={registrar.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-[#8C52FF]/30 hover:bg-[#8C52FF]/5"
                  >
                    <span className="font-dm-sans text-sm font-medium text-[#1E1F21] transition-colors group-hover:text-[#8C52FF]">
                      {registrar.name}
                    </span>
                    <ExternalLink className="ml-auto h-3.5 w-3.5 text-gray-400 transition-colors group-hover:text-[#8C52FF]" />
                  </a>
                ))}
              </div>
            </div>

            {/* Help Text */}
            <div className="rounded-xl border border-[#E9D7FE] bg-[#F9F5FF] p-4">
              <p className="font-dm-sans text-sm text-[#667085]">
                <span className="font-semibold text-[#1E1F21]">
                  {t('needHelp')}
                </span>{' '}
                {t('needHelpDesc')}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 border-t border-gray-100 bg-gray-50 p-6">
            <Button
              onClick={onClose}
              className="font-dm-sans h-12 w-full rounded-full bg-[#8C52FF] font-semibold text-white transition-all duration-300 hover:bg-[#7B42EE]"
            >
              {t('gotIt')}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Hero() {
  const t = useTranslations('domain-transfer.hero');
  const pathname = usePathname();
  const router = useRouter();
  const { currency, formatPrice } = useCurrency();
  const suggestions = (t.raw('suggestions') as string[]) || [];
  const demoRegistrars =
    (t.raw('demoRegistrars') as {
      domain: string;
      registrar: string;
      locked: boolean;
      expiry: string;
    }[]) || [];
  const demoRegistrarMap = Object.fromEntries(
    demoRegistrars.map((entry) => [entry.domain, entry])
  ) as Record<
    string,
    { registrar: string; locked: boolean; expiry: string }
  >;
  const domainSearchLink = t('domainSearchLink') || '/domain-search';
  const locale = pathname.split('/')[1] || 'en';
  const resolvedDomainSearchLink = domainSearchLink.startsWith('http')
    ? domainSearchLink
    : `/${locale}${domainSearchLink.startsWith('/') ? domainSearchLink : `/${domainSearchLink}`}`;

  // Auto-typing states
  const [placeholder, setPlaceholder] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [result, setResult] = useState<TransferResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eppCode, setEppCode] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [whmcsPricing, setWhmcsPricing] = useState<Record<string, any> | null>(null);

  // Modal state
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  // Fetch WHMCS TLD pricing when currency changes
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const { getTLDPricing: fetchTLDPricing } = await import(
          '@/actions/domain-search-actions'
        );
        const result = await fetchTLDPricing(currency);
        if (result.success && result.data) {
          const pricingMap: Record<string, any> = {};
          Object.keys(result.data).forEach((key) => {
            const normalizedKey = key.startsWith('.') ? key : `.${key}`;
            pricingMap[normalizedKey] = (result.data as any)[key];
          });
          setWhmcsPricing(pricingMap);
        }
      } catch (e) {
        // Silent fail - will fall back to translation defaults
      }
    };
    fetchPricing();
  }, [currency]);

  // Typing animation effect
  useEffect(() => {
    const handleType = () => {
      if (!suggestions.length) return;
      const i = loopNum % suggestions.length;
      const fullText = suggestions[i];

      setPlaceholder(
        isDeleting
          ? fullText.substring(0, placeholder.length - 1)
          : fullText.substring(0, placeholder.length + 1)
      );

      let speed = 150;
      if (isDeleting) speed = 50;

      if (!isDeleting && placeholder === fullText) {
        speed = 2000;
        setIsDeleting(true);
      } else if (isDeleting && placeholder === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        speed = 500;
      }

      setTypingSpeed(speed);
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [placeholder, isDeleting, loopNum, typingSpeed, suggestions]);

  const toMoney = (value: unknown): number | null => {
    const raw =
      typeof value === 'object' && value !== null
        ? (value as any).price ?? (value as any).amount ?? value
        : value;
    const cleaned = String(raw).replace(/\b[A-Z]{3}\b/g, '').replace(/[^\d.]/g, '');
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const getYearPrice = (
    tldPricing: any,
    kind: 'transfer' | 'register' | 'renew'
  ): number | null => {
    const block = tldPricing?.[kind];
    const candidate =
      block?.['1'] ?? block?.[1] ?? block?.['1.00'] ?? block?.['1.0'] ?? block;
    return toMoney(candidate);
  };

  const getDeterministicLockStatus = (domain: string): boolean => {
    let hash = 0;
    for (let i = 0; i < domain.length; i += 1) {
      hash = (hash << 5) - hash + domain.charCodeAt(i);
      hash |= 0;
    }
    // Same domain => same lock status every time
    return Math.abs(hash) % 2 === 0;
  };

  // Helper function to get dynamic pricing for a domain
  const getDomainPricing = (domain: string): { price: number; originalPrice: number } => {
    // Extract TLD from domain
    const parts = domain.split('.');
    const tld = parts.length > 1 ? `.${parts[parts.length - 1]}` : '.com';
    const fullTld = `.${parts.slice(1).join('.')}`;

    if (whmcsPricing) {
      // Try to find pricing for the full TLD (e.g., .co.uk)
      let pricing = whmcsPricing[fullTld] || whmcsPricing[tld];

      // If no specific pricing found, try common TLDs
      if (!pricing) {
        pricing = whmcsPricing['.com'];
      }

      if (pricing) {
        const transferPrice = getYearPrice(pricing, 'transfer');
        const renewPrice = getYearPrice(pricing, 'renew');
        const registerPrice = getYearPrice(pricing, 'register');

        const finalPrice =
          transferPrice !== null && transferPrice > 0
            ? transferPrice
            : renewPrice !== null && renewPrice > 0
              ? renewPrice
              : registerPrice !== null && registerPrice > 0
                ? registerPrice
                : null;

        if (finalPrice !== null) {
          const originalPrice =
            registerPrice !== null && registerPrice > 0
              ? registerPrice
              : finalPrice * 2;
          return {
            price: finalPrice,
            originalPrice,
          };
        }
      }
    }

    // Fallback to translation defaults
    const fallbackPrice = toMoney(t('defaultPrice')) ?? 9.99;
    const fallbackOriginalPrice =
      toMoney(t('defaultOriginalPrice')) ?? fallbackPrice * 2;
    return {
      price: fallbackPrice,
      originalPrice: fallbackOriginalPrice,
    };
  };

  useEffect(() => {
    if (!result || !whmcsPricing) return;
    const nextPricing = getDomainPricing(result.domain);
    if (
      nextPricing.price !== result.price ||
      nextPricing.originalPrice !== result.originalPrice
    ) {
      setResult((prev) =>
        prev
          ? {
              ...prev,
              price: nextPricing.price,
              originalPrice: nextPricing.originalPrice,
            }
          : prev
      );
    }
  }, [whmcsPricing, result?.domain]);

  // Demo check transfer eligibility
  const checkTransfer = async () => {
    if (!searchTerm.trim()) {
      setError(t('errorEmpty'));
      return;
    }

    // Clean domain name
    let domain = searchTerm.trim().toLowerCase();
    if (!domain.includes('.')) {
      domain = domain + '.com';
    }

    setError(null);
    setEppCode('');
    setIsLoading(true);
    setShowResults(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Check if we have demo data for this domain
    const demoData = demoRegistrarMap[domain];
    const pricing = getDomainPricing(domain);

    if (demoData) {
      setResult({
        domain,
        registrar: demoData.registrar,
        locked: demoData.locked,
        expiry: demoData.expiry,
        transferable: !demoData.locked,
        price: pricing.price,
        originalPrice: pricing.originalPrice,
      });
    } else {
      // Deterministic status for unknown domains (no random flip on re-check)
      const isLocked = getDeterministicLockStatus(domain);
      setResult({
        domain,
        registrar: t('defaultRegistrar'),
        locked: isLocked,
        expiry: t('defaultExpiry'),
        transferable: !isLocked,
        price: pricing.price,
        originalPrice: pricing.originalPrice,
      });
    }

    setIsLoading(false);
  };

  const handleTransferCheckout = async () => {
    if (!result) return;

    if (!result.transferable) {
      setError(t('unlockBeforeTransfer'));
      return;
    }

    const trimmedEpp = eppCode.trim();
    if (!trimmedEpp) {
      setError(t('errorEppRequired'));
      return;
    }

    const isValidEppCode =
      trimmedEpp.length >= 4 &&
      trimmedEpp.length <= 255 &&
      /^[!-~]+$/.test(trimmedEpp);

    if (!isValidEppCode) {
      setError(t('errorEppInvalid'));
      return;
    }

    setError(null);
    setIsSubmittingTransfer(true);

    try {
      const {
        checkUserLoginStatus,
        createDomainOrderAction,
      } = await import('@/actions/domain-order-actions');

      const loginStatus = await checkUserLoginStatus();

      const pendingDomainOrder = {
        domain: result.domain,
        regPeriod: 1,
        currency,
        domainType: 'transfer',
        eppCode: trimmedEpp,
      };

      if (!loginStatus.isLoggedIn) {
        localStorage.setItem('pendingDomainOrder', JSON.stringify(pendingDomainOrder));
        const loginReturnUrl = encodeURIComponent('/dashboard/processing');
        router.push(`/${locale}/login?returnUrl=${loginReturnUrl}`);
        return;
      }

      const createResult = await createDomainOrderAction({
        domain: result.domain,
        years: 1,
        currency,
        domainType: 'transfer',
        eppCode: trimmedEpp,
      });

      if (!createResult.success) {
        setError(createResult.error || t('errorFailed'));
        return;
      }

      if (createResult.invoiceId) {
        router.push(`/dashboard/billing?invoice=${createResult.invoiceId}&highlight=true`);
      } else {
        router.push('/dashboard/billing');
      }
    } catch (transferError: any) {
      setError(transferError?.message || t('errorFailed'));
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      checkTransfer();
    }
  };

  return (
    <>
      <section id="transfer-hero" className="relative flex flex-1 items-center overflow-hidden bg-[#06010E]">
        {/* Blob Glow Right */}
        <div className="pointer-events-none absolute top-[10%] -right-[10%] z-0 h-[400px] w-[400px] rounded-full bg-[radial-gradient(48.52%_49.86%_at_50%_50.14%,#8C52FF_35.58%,#000000_100%)] opacity-30 blur-[80px] md:h-[600px] md:w-[600px] lg:h-[824px] lg:w-[849px]" />

        <div className="relative z-10 container mx-auto flex h-full w-full max-w-[1920px] flex-col items-center justify-center gap-6 px-4 pt-24 pb-8 sm:px-6 md:gap-8 md:px-6 md:py-6 lg:gap-12 lg:px-12 lg:py-8 xl:gap-16 xl:px-20 xl:py-10 2xl:px-32">
          <div className="flex w-full max-w-[900px] flex-col items-center gap-8 md:gap-10 lg:gap-[60px]">
            {/* Top Content */}
            <div className="flex w-full max-w-[734px] flex-col items-center gap-4 text-center md:gap-6">
              {/* Header Text */}
              <div className="w-full space-y-3 md:space-y-4">
                <h1 className="font-dm-sans text-[clamp(2.125rem,5vw,4.375rem)] leading-[1.1] font-bold tracking-tight text-white">
                  {t('title')}
                </h1>
                <p className="font-dm-sans text-[clamp(0.875rem,1.5vw,1.125rem)] leading-normal font-normal text-white/60">
                  {t('subtitle')}
                </p>
              </div>

              {/* Search Box - Same as Homepage */}
              <div className="flex w-full max-w-[698px] items-center gap-3 rounded-full border border-[#EAECF0] bg-white p-2 pl-4 shadow-[0px_4px_35px_rgba(0,0,0,0.09)] transition-all duration-300 hover:shadow-[0px_6px_40px_rgba(0,0,0,0.12)] md:gap-4 md:pl-6">
                <div className="flex flex-1 items-center gap-3 overflow-hidden md:gap-4">
                  <SearchIcon />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder || t('searchPlaceholder')}
                    disabled={isLoading}
                    className="font-dm-sans min-w-0 flex-1 bg-transparent text-sm font-normal text-[#667085]/70 outline-none placeholder:text-[#667085]/70 disabled:opacity-50 sm:text-base md:text-lg"
                  />
                </div>
                <Button
                  onClick={checkTransfer}
                  disabled={isLoading || !searchTerm.trim()}
                  className="font-dm-sans h-[40px] shrink-0 rounded-full bg-[#8C52FF] px-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#7b42ff] disabled:opacity-50 sm:h-[45px] sm:px-6 sm:text-base"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    t('searchButton')
                  )}
                </Button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex w-full max-w-[698px] items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/20 p-4 text-red-300">
                  <AlertIcon />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Transfer Results */}
            <AnimatePresence mode="wait">
              {showResults && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="w-full max-w-[700px]"
                >
                  {isLoading ? (
                    <div className="rounded-xl border border-[#EAECF0] bg-white p-8">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-[#8C52FF]" />
                        <p className="font-dm-sans text-[#667085]">
                          {t('checking')}
                        </p>
                      </div>
                    </div>
                  ) : result ? (
                    <div className="space-y-4">
                      {/* Status Alert */}
                      <div
                        className={`flex items-start gap-3 rounded-xl border p-4 ${result.locked
                            ? 'border-amber-200 bg-amber-50'
                            : 'border-emerald-200 bg-emerald-50'
                          }`}
                      >
                        <div
                          className={`mt-0.5 ${result.locked ? 'text-amber-600' : 'text-emerald-600'}`}
                        >
                          {result.locked ? <AlertIcon /> : <CheckCircleIcon />}
                        </div>
                        <p
                          className={`font-dm-sans text-sm ${result.locked
                              ? 'text-amber-800'
                              : 'text-emerald-800'
                            }`}
                        >
                          {result.locked
                            ? t('statusLocked')
                            : t('statusUnlocked')}
                        </p>
                      </div>

                      {/* Transfer Details Card */}
                      <div className="overflow-hidden rounded-xl border border-[#EAECF0] bg-white">
                        {/* Registrar Info */}
                        <div className="border-b border-[#EAECF0] p-6">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                              <p className="font-dm-sans mb-1 text-sm text-[#667085]">
                                {t('currentRegistrar')}
                              </p>
                              <p className="font-dm-sans font-semibold text-[#1E1F21]">
                                {result.registrar}
                              </p>
                            </div>
                            <div>
                              <p className="font-dm-sans mb-1 text-sm text-[#667085]">
                                {t('registrarLock')}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                {result.locked ? (
                                  <>
                                    <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600">
                                      <LockIcon />
                                      LOCKED
                                    </span>
                                    <button
                                      onClick={() => setShowUnlockModal(true)}
                                      className="font-dm-sans text-sm text-[#8C52FF] hover:underline"
                                    >
                                      {t('unlockSteps')}
                                    </button>
                                  </>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                                    <UnlockIcon />
                                    UNLOCKED
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Domain & Price */}
                        <div className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
                          <div className="flex items-center gap-3">
                            <GlobeIcon />
                            <span className="font-dm-sans text-lg font-bold text-[#1E1F21]">
                              {result.domain}
                            </span>
                          </div>
                          <div className="flex w-full items-center gap-4 sm:w-auto">
                            <div className="text-right">
                              <p className="font-dm-sans text-sm text-[#667085] line-through">
                                {formatPrice(result.originalPrice)}
                              </p>
                              <p className="font-dm-sans text-xl font-bold text-[#1E1F21]">
                                {formatPrice(result.price)}
                              </p>
                            </div>
                            <Button
                              onClick={checkTransfer}
                              disabled={isSubmittingTransfer}
                              className="font-dm-sans rounded-full bg-[#8C52FF] px-6 py-2 font-semibold text-white hover:bg-[#7b42ff]"
                            >
                              <RefreshIcon />
                              {t('checkAgain')}
                            </Button>
                          </div>
                        </div>

                        {/* Transfer Form */}
                        <div className="border-t border-[#EAECF0] px-6 py-5">
                          <div className="space-y-3">
                            <label className="font-dm-sans block text-sm font-semibold text-[#1E1F21]">
                              {t('eppCodeLabel')}
                            </label>
                            <input
                              type="text"
                              value={eppCode}
                              onChange={(e) => setEppCode(e.target.value)}
                              placeholder={t('eppCodePlaceholder')}
                              disabled={isSubmittingTransfer}
                              className="font-dm-sans h-11 w-full rounded-lg border border-[#D0D5DD] px-3 text-sm text-[#1E1F21] outline-none transition focus:border-[#8C52FF] focus:ring-2 focus:ring-[#8C52FF]/20 disabled:cursor-not-allowed disabled:bg-gray-50"
                            />
                            <p className="font-dm-sans text-xs text-[#667085]">
                              {t('eppCodeHelp')}
                            </p>

                            {!result.transferable && (
                              <p className="font-dm-sans text-xs font-medium text-red-600">
                                {t('unlockBeforeTransfer')}
                              </p>
                            )}

                            <Button
                              onClick={handleTransferCheckout}
                              disabled={isSubmittingTransfer || !result.transferable}
                              className="font-dm-sans h-11 w-full rounded-full bg-[#8C52FF] font-semibold text-white hover:bg-[#7b42ff] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isSubmittingTransfer ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {t('transferring')}
                                </>
                              ) : (
                                t('transferNow')
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Info Banner */}
                        <div className="px-6 pb-6">
                          <div className="flex items-start gap-3 rounded-lg border border-[#E9D7FE] bg-[#F9F5FF] p-4">
                            <GiftIcon />
                            <p className="font-dm-sans text-sm text-[#667085]">
                              <span className="font-semibold text-[#1E1F21]">
                                {t('whyTransfer')}
                              </span>{' '}
                              {t('whyTransferDesc')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Link to Domain Checker */}
                      <div className="pt-4 text-center">
                        <p className="font-dm-sans text-sm text-white/60">
                          {t('lookingForNew')}{' '}
                          <Link
                            href={resolvedDomainSearchLink}
                            className="font-semibold text-[#8C52FF] hover:underline"
                          >
                            {t('tryDomainChecker')}
                          </Link>
                        </p>
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Feature Cards - Only show when no results */}
            {!showResults && (
              <div className="grid w-full max-w-[800px] grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                {[
                  { Icon: CalendarPlusIcon, key: 'freeYear' },
                  { Icon: ShieldCheckIcon, key: 'whoisPrivacy' },
                  { Icon: DnsIcon, key: 'easyManagement' },
                  { Icon: SupportIcon, key: 'support' },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:bg-white/10 md:p-5"
                  >
                    <div className="rounded-lg bg-[#8C52FF]/10 p-2.5">
                      <feature.Icon />
                    </div>
                    <span className="font-dm-sans text-center text-xs font-medium text-white md:text-sm">
                      {t(`features.${feature.key}`)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Unlock Modal */}
      <UnlockModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
      />
    </>
  );
}
