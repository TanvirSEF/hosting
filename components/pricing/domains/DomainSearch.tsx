'use client';

import { Button } from '@/components/ui/button';
import { useState, useEffect, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  checkDomainAvailability,
  type DomainSearchResult,
} from '@/actions/domain-search-actions';
import { Loader2, Check, X, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export default function DomainSearch() {
  const t = useTranslations('domains.search');
  const router = useRouter();
  const suggestions = (() => {
    try {
      const raw = t.raw('suggestions') as unknown;
      return Array.isArray(raw) ? (raw as string[]) : [];
    } catch {
      return [];
    }
  })();
  const popularTlds = (() => {
    try {
      const raw = t.raw('popularTlds') as unknown;
      return Array.isArray(raw) ? (raw as string[]) : [];
    } catch {
      return [];
    }
  })();
  const [placeholder, setPlaceholder] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<DomainSearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

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

  // Handle search
  const handleSearch = () => {
    // Clean the search term - remove trailing dots and whitespace
    const cleanedTerm = searchTerm.trim().replace(/\.+$/, '');

    if (!cleanedTerm) {
      setError(t('errorEmpty'));
      return;
    }

    // Validate domain format - must contain at least one alphanumeric character
    const domainPart = cleanedTerm.split('.')[0];
    if (
      !domainPart ||
      !/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*$/.test(domainPart)
    ) {
      setError(
        t('errorInvalid')
      );
      return;
    }

    setError(null);
    setShowResults(true);

    startTransition(async () => {
      const response = await checkDomainAvailability(cleanedTerm);

      if (response.success && response.data) {
        setResults(response.data.results);
      } else {
        setError(response.error || t('errorFailed'));
        setResults([]);
      }
    });
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle register domain
  const handleRegister = (domain: string) => {
    router.push(`/order?domain=${encodeURIComponent(domain)}`);
  };

  return (
    <section className="w-full bg-[#FAFAFA] py-12 text-[#1E1F21] md:py-16">
      <div className="relative z-10 container mx-auto flex w-full max-w-[1920px] flex-col items-center gap-8 px-4 sm:px-6 md:gap-12 md:px-12 lg:px-20 xl:px-32">
        {/* Header */}
        <div className="flex w-full max-w-[800px] flex-col items-center gap-4 text-center md:gap-6">
          <h2 className="font-dm-sans text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-bold text-[#1E1F21]">
            {t('heading')}
          </h2>
          <p className="font-dm-sans max-w-[634px] text-center text-[clamp(1rem,2vw,1.125rem)] leading-[1.3] font-normal text-[#667085] 2xl:max-w-[800px]">
            {t('description')}
          </p>
        </div>

        {/* Search Box - Consistent Homepage Style */}
        <div className="w-full max-w-[698px] 2xl:max-w-[900px]">
          <div className="flex items-center gap-3 rounded-full border border-[#EAECF0] bg-white p-2 pr-2 pl-4 shadow-[0px_4px_35px_rgba(0,0,0,0.08)] transition-all duration-300 hover:shadow-[0px_6px_40px_rgba(0,0,0,0.12)] md:gap-4 md:pl-8">
            <div className="flex flex-1 items-center gap-3 overflow-hidden md:gap-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 shrink-0 text-[#1E1F21] opacity-80 md:h-6 md:w-6 2xl:h-8 2xl:w-8"
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
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder || t('placeholder')}
                disabled={isPending}
                className="font-dm-sans w-full truncate border-none bg-transparent text-[1rem] text-[#1E1F21] outline-none placeholder:text-[#667085]/70 disabled:opacity-50 md:text-[1.125rem]"
              />
            </div>

            <Button
              onClick={handleSearch}
              disabled={isPending || !searchTerm.trim()}
              className="font-dm-sans h-[40px] shrink-0 rounded-full bg-[#8C52FF] px-6 py-2.5 text-[0.875rem] font-semibold text-white transition-all duration-300 hover:bg-[#7b42ff] disabled:opacity-50 md:h-[45px] md:px-8 md:py-3 md:text-[1rem] 2xl:px-12"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('searching')}
                </>
              ) : (
                t('button')
              )}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Popular TLDs */}
          {popularTlds.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm font-medium">
              {popularTlds.map((tld, index) => (
                <span
                  key={`${tld}-${index}`}
                  className={index % 2 === 0 ? 'text-[#667085]' : 'text-[#8C52FF]'}
                >
                  {tld}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Results Section */}
        {showResults && (
          <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-[900px] duration-500">
            {isPending ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-xl border border-[#EAECF0] bg-white p-6"
                  >
                    <div className="mb-2 h-6 w-3/4 rounded bg-gray-200"></div>
                    <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-[#1E1F21]">
                  {t('resultsFor')} &quot;
                  {results[0]?.domain
                    ? results[0].domain.substring(
                        0,
                        results[0].domain.lastIndexOf('.')
                      )
                    : searchTerm.replace(/\.$/, '')}
                  &quot;
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`group rounded-xl border-2 bg-white p-6 transition-all duration-300 hover:shadow-lg ${
                        result.available
                          ? 'border-green-200 hover:border-green-400'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-lg font-semibold text-[#1E1F21] transition-colors group-hover:text-[#8C52FF]">
                            {result.domain}
                          </h4>
                          <p className="mt-1 text-sm text-[#667085]">
                            {result.available ? t('available') : t('taken')}
                          </p>
                          {result.price && (
                            <p className="mt-2 text-lg font-bold text-[#8C52FF]">
                              {result.price}/{t('year')}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {result.available ? (
                            <Badge className="border-green-300 bg-green-100 text-green-700 hover:bg-green-200">
                              <Check className="mr-1 h-4 w-4" />
                              {t('availableBadge')}
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-gray-100 text-gray-700"
                            >
                              <X className="mr-1 h-4 w-4" />
                              {t('takenBadge')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {result.available && (
                        <Button
                          className="mt-4 w-full rounded-full bg-[#8C52FF] text-white hover:bg-[#7b42ff]"
                          onClick={() => handleRegister(result.domain)}
                        >
                          {t('registerNow')}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#EAECF0] bg-white py-12 text-center">
                <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="text-lg text-gray-600">{t('noResults')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
