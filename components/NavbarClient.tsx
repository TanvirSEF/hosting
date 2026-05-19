'use client';

import * as React from 'react';
import Image from 'next/image';
import { Menu, X, ChevronDown, FileText, Book } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { usePathname } from 'next/navigation';

import { CurrencySwitcher } from './CurrencySwitcher';
import { UserMenu, MobileUserSection } from './UserMenu';
import type { UserSession } from '@/actions/session';
import type { AdminRole } from '@/lib/mongodb';

interface AdminSession {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

interface NavbarClientProps {
  user: UserSession | null;
  admin: AdminSession | null;
}

export default function NavbarClient({ user, admin }: NavbarClientProps) {
  const t = useTranslations('navbar');
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(
    null
  );
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [hasMounted, setHasMounted] = React.useState(false);
  const [bannerHeight, setBannerHeight] = React.useState(0);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Listen for banner height changes
  React.useEffect(() => {
    const updateBannerHeight = () => {
      try {
        const bannerElement = document.querySelector('.promo-banner');
        const height = bannerElement && getComputedStyle(bannerElement).display !== 'none' 
          ? bannerElement.clientHeight 
          : 0;
        
        if (height !== bannerHeight) {
          setBannerHeight(height);
        }
      } catch (error) {
        setBannerHeight(0); // Fallback to 0 if there's an error
      }
    };

    updateBannerHeight();
    
    // Check for banner changes
    const interval = setInterval(updateBannerHeight, 200);

    // Also listen for DOM changes that might affect the banner
    const observer = new MutationObserver(() => {
      setTimeout(updateBannerHeight, 50); // Small delay for DOM to settle
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, [bannerHeight]);

  // Pages that should always show solid navbar (light background pages)
  const solidNavbarPaths = [
    '/login',
    '/register',
    '/order',
    '/vps',
    '/forgot-password',
    '/reset-password',
  ];

  // Check if current path should have solid navbar
  // Remove locale prefix (/en or /sv) to match against solidNavbarPaths
  const pathWithoutLocale = pathname?.replace(/^\/(en|sv)/, '') || '/';
  const shouldBeSolid = solidNavbarPaths.some(
    (path) =>
      pathWithoutLocale === path || pathWithoutLocale.startsWith(path + '/')
  );

  // Check if we're on a 404 page by looking for the 404 page background color
  const [is404Page, setIs404Page] = React.useState(false);

  React.useEffect(() => {
    // Check if the main content has the 404 page background
    const checkFor404 = () => {
      const mainElement = document.querySelector('main');
      if (mainElement) {
        const styles = window.getComputedStyle(mainElement);
        const bgColor = styles.backgroundColor;
        // Check if background matches 404 page style
        setIs404Page(mainElement.textContent?.includes('404') && mainElement.textContent?.includes('Page Not Found'));
      }
    };

    checkFor404();
    // Recheck after a short delay to ensure content is loaded
    const timer = setTimeout(checkFor404, 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleMouseEnter = (dropdown: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 200);
  };

  React.useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  React.useEffect(() => {
    setIsScrolled(window.scrollY > 10);
    setHasMounted(true);
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Use solid navbar style if on specific pages or scrolled or on 404 page
  const showSolidNavbar = shouldBeSolid || isScrolled || is404Page;

  return (
    <>
      <nav
        className={`fixed right-0 left-0 z-50 w-full border-b transition-all duration-300 ease-in-out ${!hasMounted ? 'opacity-0' : 'opacity-100'
          } ${showSolidNavbar
            ? 'border-gray-200 bg-white shadow-sm backdrop-blur'
            : 'border-transparent bg-transparent'
          }`}
        style={{ top: `${bannerHeight}px` }}
      >
        <div className="container mx-auto flex h-16 max-w-[1920px] items-center justify-between px-4 sm:px-6 lg:px-4 xl:px-12">
          {/* Logo and Navigation - Left Side */}
          <div className="flex items-center space-x-4 lg:space-x-2 xl:space-x-8">
            <Link href="/" className="flex items-center">
              <img
                src={
                  showSolidNavbar
                    ? 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/webblymediablack.svg'
                    : 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/webblymediawhite.svg'
                }
                alt="Logo"
                className="h-10 w-auto lg:h-9 xl:h-12"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center space-x-0 lg:flex xl:space-x-1">
              <Link
                href="/pricing"
                className={`rounded-md px-2 lg:px-1.5 xl:px-4 py-2 text-sm lg:text-[13px] xl:text-sm font-medium transition-colors ${showSolidNavbar
                  ? 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  : 'text-white hover:bg-white/10 hover:text-gray-200'
                  }`}
              >
                {t('pricing')}
              </Link>

              <Link
                href="/about"
                className={`rounded-md px-2 xl:px-4 py-2 text-sm font-medium transition-colors ${showSolidNavbar
                  ? 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  : 'text-white hover:bg-white/10 hover:text-gray-200'
                  }`}
              >
                {t('aboutUs')}
              </Link>

              {/* Services Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('services')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className={`flex items-center gap-1 rounded-md px-2 lg:px-1.5 xl:px-4 py-2 text-sm lg:text-[13px] xl:text-sm font-medium transition-colors ${showSolidNavbar
                    ? 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    : 'text-white hover:bg-white/10 hover:text-gray-200'
                    }`}
                  aria-expanded={activeDropdown === 'services'}
                >
                  {t('services.title')}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${activeDropdown === 'services' ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  className={`absolute top-full left-0 w-[520px] bg-transparent pt-1 ${activeDropdown === 'services' ? 'pointer-events-auto' : 'pointer-events-none'}`}
                  onMouseEnter={() => handleMouseEnter('services')}
                  onMouseLeave={handleMouseLeave}
                >
                  <div
                    className={`mt-1 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg transition-all duration-300 ease-out will-change-[transform,opacity] ${activeDropdown === 'services'
                      ? 'translate-y-0 opacity-100'
                      : '-translate-y-2 opacity-0'
                      }`}
                  >
                    <div className="grid grid-cols-2 gap-0">
                      {/* Left Column - Hosting */}
                      <div className="border-r border-gray-100 p-4">
                        <div className="mb-2 px-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                          {t('services.hosting')}
                        </div>
                        <Link
                          href="/shared-hosting"
                          className="group flex items-start gap-3 rounded-md px-3 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <svg
                            className="h-5 w-5 shrink-0 text-[#8A2BE2]"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M16 8.5l1.53 1.53-1.06 1.06L10 4.62l-6.47 6.47-1.06-1.06L10 2.5l4 4V4h2v4.5zm-6-2.46l6 5.99V18H4v-5.97zM12 17v-5H8v5h4z" />
                          </svg>
                          <div>
                            <div className="font-medium text-gray-900 transition-colors group-hover:text-[#8A2BE2]">
                              {t('services.sharedHosting.title')}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                              {t('services.sharedHosting.description')}
                            </p>
                          </div>
                        </Link>
                        <Link
                          href="/vps-hosting"
                          className="group flex items-start gap-3 rounded-md px-3 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <svg
                            className="h-5 w-5 shrink-0 text-[#8A2BE2]"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M14.9 9c1.15.1 2.1 1.03 2.1 2.2 0 1.22-1 2.2-2.2 2.2H5.6c-1.47 0-2.6-1.18-2.6-2.6 0-1.4 1.07-2.53 2.43-2.6C5.9 6.3 7.5 4.5 9.6 4.5c1.75 0 3.23 1.12 3.76 2.68.2-.04.41-.07.64-.07.76 0 1.46.28 2 .74.5-.4 1.14-.65 1.84-.65.45 0 .87.1 1.24.28C18.17 6.27 17.08 5 15.66 5c-.91 0-1.73.42-2.27 1.08-.57-.53-1.33-.86-2.17-.86-1.73 0-3.14 1.36-3.22 3.06-.06-.01-.13-.01-.2-.01-1.92 0-3.47 1.5-3.6 3.38-.04.1-.04.21-.04.32 0 1.95 1.6 3.53 3.6 3.53h8.6c1.77 0 3.2-1.43 3.2-3.2 0-1.64-1.23-2.98-2.82-3.18-.2-1.04-.88-1.92-1.84-2.37z" />
                          </svg>
                          <div>
                            <div className="font-medium text-gray-900 transition-colors group-hover:text-[#8A2BE2]">
                              {t('services.vps.title')}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                              {t('services.vps.description')}
                            </p>
                          </div>
                        </Link>
                        <Link
                          href="/wordpress-hosting"
                          className="group flex items-start gap-3 rounded-md px-3 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8A2BE2]/10">
                            <span className="text-xs font-bold text-[#8A2BE2]">
                              W
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 transition-colors group-hover:text-[#8A2BE2]">
                              {t('services.wordpress.title')}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                              {t('services.wordpress.description')}
                            </p>
                          </div>
                        </Link>
                        <Link
                          href="/ecommerce-hosting"
                          className="group flex items-start gap-3 rounded-md px-3 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <svg
                            className="h-5 w-5 shrink-0 text-[#8A2BE2]"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M4 4h12l-1.5 9H5.5L4 4zm0 0L3 2H1v2h1l1.5 9H15l.5-2H5.5L5 9h10l.5-3H5L4 4zM6 16a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4z" />
                          </svg>
                          <div>
                            <div className="font-medium text-gray-900 transition-colors group-hover:text-[#8A2BE2]">
                              {t('services.ecommerce.title')}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                              {t('services.ecommerce.description')}
                            </p>
                          </div>
                        </Link>
                      </div>

                      {/* Right Column - Domains */}
                      <div className="p-4">
                        <div className="mb-2 px-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                          {t('services.domains')}
                        </div>
                        <Link
                          href="/domain-search"
                          className="group flex items-start gap-3 rounded-md px-3 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <svg
                            className="h-5 w-5 shrink-0 text-[#8A2BE2]"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M12.14 4.18c2.17 2.17 2.49 5.51.96 8.02l3.9 3.9-1.06 1.06-3.9-3.9c-2.51 1.53-5.85 1.21-8.02-.96-2.43-2.43-2.43-6.37 0-8.8s6.37-2.43 8.8 0c.24.24.47.51.68.78l-.36.36v-.46zm-1.41 6.6c1.56-1.56 1.56-4.09 0-5.66-1.56-1.56-4.09-1.56-5.66 0-1.56 1.56-1.56 4.09 0 5.66 1.56 1.56 4.1 1.56 5.66 0z" />
                          </svg>
                          <div>
                            <div className="font-medium text-gray-900 transition-colors group-hover:text-[#8A2BE2]">
                              {t('services.domainSearch.title')}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                              {t('services.domainSearch.description')}
                            </p>
                          </div>
                        </Link>
                        <Link
                          href="/domain-transfer"
                          className="group flex items-start gap-3 rounded-md px-3 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <svg
                            className="h-5 w-5 shrink-0 text-[#8A2BE2]"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M10.2 3.28c3.53 0 6.43 2.61 6.92 6h2.08l-3.5 4-3.5-4h2.32c-.45-1.97-2.21-3.45-4.32-3.45-1.45 0-2.73.71-3.54 1.78L4.97 5.66c1.12-1.44 2.86-2.38 4.83-2.38zm-.4 13.44c-3.52 0-6.43-2.61-6.92-6H.8l3.5-4c1.17 1.33 2.33 2.67 3.5 4H5.48c.45 1.97 2.21 3.45 4.32 3.45 1.45 0 2.73-.71 3.54-1.78l1.69 1.95c-1.12 1.44-2.86 2.38-4.83 2.38z" />
                          </svg>
                          <div>
                            <div className="font-medium text-gray-900 transition-colors group-hover:text-[#8A2BE2]">
                              {t('services.domainTransfer.title')}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                              {t('services.domainTransfer.description')}
                            </p>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact - Single Link */}
              <Link
                href="/contact"
                className={`rounded-md px-2 xl:px-4 py-2 text-sm font-medium transition-colors ${showSolidNavbar
                  ? 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  : 'text-white hover:bg-white/10 hover:text-gray-200'
                  }`}
              >
                {t('support.contact.title')}
              </Link>

              {/* Resources Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('resources')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className={`flex items-center gap-1 rounded-md px-2 lg:px-1.5 xl:px-4 py-2 text-sm lg:text-[13px] xl:text-sm font-medium transition-colors ${showSolidNavbar
                    ? 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    : 'text-white hover:bg-white/10 hover:text-gray-200'
                    }`}
                  aria-expanded={activeDropdown === 'resources'}
                >
                  {t('resources.title')}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${activeDropdown === 'resources' ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  className={`absolute top-full left-0 w-64 bg-transparent pt-1 ${activeDropdown === 'resources' ? 'pointer-events-auto' : 'pointer-events-none'}`}
                  onMouseEnter={() => handleMouseEnter('resources')}
                  onMouseLeave={handleMouseLeave}
                >
                  <div
                    className={`mt-1 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg transition-all duration-300 ease-out will-change-[transform,opacity] ${activeDropdown === 'resources'
                      ? 'translate-y-0 opacity-100'
                      : '-translate-y-2 opacity-0'
                      }`}
                  >
                    <div className="py-2">
                      <Link
                        href="/blog"
                        className="group flex items-start gap-3 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <FileText className="box-content h-5 w-5 shrink-0 rounded bg-[#8A2BE2]/10 p-0.5 text-[#8A2BE2]" />
                        <div>
                          <div className="font-medium text-gray-900 transition-colors group-hover:text-[#8A2BE2]">
                            {t('resources.blog.title')}
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {t('resources.blog.description')}
                          </p>
                        </div>
                      </Link>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Buttons - Right Side */}
          <div className="hidden items-center space-x-2 lg:flex xl:space-x-3">
            <CurrencySwitcher isScrolled={showSolidNavbar} />
            {user ? (
              <UserMenu
                user={{ name: user.name, email: user.email }}
                isScrolled={showSolidNavbar}
                admin={admin ? { name: admin.name, email: admin.email } : null}
                translations={{
                  dashboard: t('userMenu.dashboard'),
                  adminDashboard: t('userMenu.adminDashboard'),
                  settings: t('userMenu.settings'),
                  logout: t('userMenu.logout'),
                }}
              />
            ) : admin ? (
              <UserMenu
                user={{ name: admin.name, email: admin.email }}
                isScrolled={showSolidNavbar}
                admin={{ name: admin.name, email: admin.email }}
                isAdminOnly={true}
                translations={{
                  dashboard: t('userMenu.dashboard'),
                  adminDashboard: t('userMenu.adminDashboard'),
                  settings: t('userMenu.settings'),
                  logout: t('userMenu.logout'),
                }}
              />
            ) : (
              <>
                <Link
                  href="/login"
                  className={`rounded-md px-3 lg:px-2 xl:px-4 py-2 text-sm lg:text-[13px] xl:text-sm font-medium transition-colors ${showSolidNavbar
                    ? 'border border-gray-300 bg-white text-gray-700 hover:border-[#8A2BE2] hover:bg-gray-50 hover:text-[#8A2BE2]'
                    : 'border border-white/30 text-white hover:border-white hover:bg-white/10'
                    }`}
                >
                  {t('auth.signIn')}
                </Link>
                <Link
                  href="/register"
                  className="rounded-md bg-[#8A2BE2] px-3 lg:px-2 xl:px-4 py-2 text-sm lg:text-[13px] xl:text-sm font-medium text-white transition-colors hover:bg-purple-700"
                >
                  {t('auth.getStarted')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button - Right Side */}
          <div className="flex items-center lg:hidden">
            <CurrencySwitcher isScrolled={showSolidNavbar} isMobile={true} />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`rounded-md p-2 transition-colors ${showSolidNavbar
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-white hover:bg-white/10'
                }`}
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`fixed inset-y-0 right-0 z-70 w-full max-w-sm transform bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('mobile.menu')}
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md p-2 transition-colors hover:bg-gray-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="flex flex-col px-4 py-4">
              <Link
                href="/pricing"
                className="rounded-md border-b border-gray-100 px-2 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#8A2BE2]"
                onClick={() => setIsOpen(false)}
              >
                {t('pricing')}
              </Link>

              <Link
                href="/about"
                className="rounded-md border-b border-gray-100 px-2 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#8A2BE2]"
                onClick={() => setIsOpen(false)}
              >
                {t('aboutUs')}
              </Link>

              <MobileDropdown
                title={t('services.title')}
                items={[
                  {
                    title: t('services.sharedHosting.title'),
                    href: '/shared-hosting',
                    description: t('services.sharedHosting.description'),
                  },
                  {
                    title: t('services.vps.title'),
                    href: '/vps-hosting',
                    description: t('services.vps.description'),
                  },
                  {
                    title: t('services.wordpress.title'),
                    href: '/wordpress-hosting',
                    description: t('services.wordpress.description'),
                  },
                  {
                    title: t('services.ecommerce.title'),
                    href: '/ecommerce-hosting',
                    description: t('services.ecommerce.description'),
                  },
                  {
                    title: t('services.domainSearch.title'),
                    href: '/domain-search',
                    description: t('services.domainSearch.description'),
                  },
                  {
                    title: t('services.domainTransfer.title'),
                    href: '/domain-transfer',
                    description: t('services.domainTransfer.description'),
                  },
                ]}
                onItemClick={() => setIsOpen(false)}
              />

              <Link
                href="/contact"
                className="rounded-md border-b border-gray-100 px-2 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#8A2BE2]"
                onClick={() => setIsOpen(false)}
              >
                {t('support.contact.title')}
              </Link>

              <MobileDropdown
                title={t('resources.title')}
                items={[
                  {
                    title: t('resources.blog.title'),
                    href: '/blog',
                    description: t('resources.blog.description'),
                  },

                ]}
                onItemClick={() => setIsOpen(false)}
              />
            </div>
          </div>

          {/* User Section or Auth Buttons */}
          {user ? (
            <MobileUserSection
              user={{ name: user.name, email: user.email }}
              admin={admin ? { name: admin.name, email: admin.email } : null}
              translations={{
                dashboard: t('userMenu.dashboard'),
                adminDashboard: t('userMenu.adminDashboard'),
                settings: t('userMenu.settings'),
                logout: t('userMenu.logout'),
              }}
              onClose={() => setIsOpen(false)}
            />
          ) : admin ? (
            <MobileUserSection
              user={{ name: admin.name, email: admin.email }}
              admin={{ name: admin.name, email: admin.email }}
              isAdminOnly={true}
              translations={{
                dashboard: t('userMenu.dashboard'),
                adminDashboard: t('userMenu.adminDashboard'),
                settings: t('userMenu.settings'),
                logout: t('userMenu.logout'),
              }}
              onClose={() => setIsOpen(false)}
            />
          ) : (
            <div className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-gray-50 p-4">
              <Link
                href="/login"
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                {t('auth.signIn')}
              </Link>
              <Link
                href="/register"
                className="w-full rounded-md bg-[#8A2BE2] px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-purple-700 active:bg-purple-800"
                onClick={() => setIsOpen(false)}
              >
                {t('auth.getStarted')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MobileDropdown({
  title,
  items,
  onItemClick,
}: {
  title: string;
  items: { title: string; href: string; description: string }[];
  onItemClick: () => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md px-2 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#8A2BE2]"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 will-change-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="mr-2 ml-4 flex flex-col space-y-2 py-2">
            {items.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-[#8A2BE2] active:bg-gray-100"
                onClick={onItemClick}
              >
                <div className="font-medium text-gray-900">{item.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
