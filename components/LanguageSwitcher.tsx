'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Flag Components
const GBFlag = () => (
  <svg viewBox="0 0 640 480" className="h-4 w-6 shrink-0">
    <path fill="#012169" d="M0 0h640v480H0z" />
    <path
      fill="#FFF"
      d="M75 0l244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"
    />
    <path
      fill="#C8102E"
      d="M424 281l216 159v40L369 281h55zm-184 20l6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"
    />
    <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z" />
    <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z" />
  </svg>
);

const SEFlag = () => (
  <svg viewBox="0 0 640 480" className="h-4 w-6 shrink-0">
    <path fill="#006aa7" d="M0 0h640v480H0z" />
    <path fill="#fecc00" d="M176 0v480h96V0h-96zM0 192v96h640v-96H0z" />
  </svg>
);

const LANGUAGES = [
  {
    code: 'en',
    label: 'English',
    mobileLabel: 'EN',
    flag: GBFlag,
  },
  {
    code: 'sv',
    label: 'Svenska',
    mobileLabel: 'SV',
    flag: SEFlag,
  },
];

interface LanguageSwitcherProps {
  isScrolled?: boolean;
  isMobile?: boolean;
  className?: string;
}

export function LanguageSwitcher({
  isScrolled,
  isMobile,
  className,
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const currentLanguage =
    LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (newLocale: string) => {
    setIsOpen(false);
    router.replace(pathname, { locale: newLocale });
  };

  const textColorClass = isMobile
    ? isScrolled
      ? 'text-gray-700'
      : 'text-white'
    : isScrolled
      ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 bg-transparent border-transparent'
      : 'text-white hover:text-gray-200 hover:bg-white/10 bg-transparent border-transparent';

  return (
    <div
      className={cn('relative', className)}
      ref={dropdownRef}
      onMouseEnter={() => !isMobile && setIsOpen(true)}
      onMouseLeave={() => !isMobile && setIsOpen(false)}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center rounded-md text-sm font-medium transition-all duration-300',
          isMobile ? 'gap-0.5 px-1.5 py-1.5' : 'gap-2 px-3 py-2',
          textColorClass,
          isOpen && !isMobile && 'bg-gray-50 text-gray-900'
        )}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-1.5">
          <currentLanguage.flag />
          {!isMobile && (
            <span className="hidden md:inline">{currentLanguage.label}</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'transition-transform duration-300',
            isMobile ? 'h-3 w-3' : 'h-4 w-4',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <div
        className={cn(
          'absolute top-full right-0 z-50 w-48 pt-2 transition-all duration-300 ease-out',
          isOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-2 opacity-0'
        )}
      >
        <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-xl ring-1 ring-black/5">
          <div className="py-1">
            {LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className="group flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50"
              >
                <span className="flex flex-1 items-center gap-3">
                  <language.flag />
                  <span
                    className={cn(
                      'font-medium transition-colors',
                      locale === language.code
                        ? 'text-gray-900'
                        : 'text-gray-600 group-hover:text-gray-900'
                    )}
                  >
                    {language.label}
                  </span>
                </span>
                {locale === language.code && (
                  <Check className="h-4 w-4 text-[#8A2BE2]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
