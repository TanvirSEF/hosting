'use client';

import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { LanguageSwitcherDashboard } from '@/components/LanguageSwitcherDashboard';
import { NotificationBell } from '@/components/NotificationBell';
import { useDashboardTranslation } from '@/components/DashboardTranslationProvider';
import { House } from 'lucide-react';

export function SiteHeader() {
  const pathname = usePathname();
  const { t } = useDashboardTranslation();

  // Get the current page name from pathname with translations
  const getPageName = () => {
    if (pathname === '/dashboard') return t('sidebar.navigation.dashboard');
    if (pathname.startsWith('/dashboard/services'))
      return t('sidebar.navigation.services');
    if (pathname.startsWith('/dashboard/domains'))
      return t('sidebar.navigation.domains');
    if (pathname.startsWith('/dashboard/billing'))
      return t('sidebar.navigation.billing');
    if (pathname.startsWith('/dashboard/support'))
      return t('sidebar.navigation.support');
    return t('sidebar.navigation.dashboard');
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex items-center gap-1 lg:gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">{t('header.home')}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{getPageName()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell mode="client" t={t} />
          <a
            href="/"
            target="_blank"
            className="bg-primary hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors"
          >
            <House className="h-4 w-4" />
            <span className="hidden sm:inline">{t('header.visitWebsite')}</span>
          </a>
          <LanguageSwitcherDashboard storageKey="dashboard-locale" />
        </div>
      </div>
    </header>
  );
}
