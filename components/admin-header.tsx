'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { LanguageSwitcherDashboard } from '@/components/LanguageSwitcherDashboard';
import { useAdminTranslation } from '@/components/AdminTranslationProvider';
import { House } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';

export function AdminHeader() {
  const pathname = usePathname();
  const { t } = useAdminTranslation();

  // Get the current page name from pathname with translations
  const getPageName = () => {
    if (pathname === '/spike/dashboard')
      return t('sidebar.navigation.dashboard');
    if (pathname.startsWith('/spike/clients'))
      return t('sidebar.navigation.clients');
    if (pathname.startsWith('/spike/services'))
      return t('sidebar.navigation.services');
    if (pathname.startsWith('/spike/domains'))
      return t('sidebar.navigation.domains');
    if (pathname.startsWith('/spike/billing'))
      return t('sidebar.navigation.billing');
    if (pathname.startsWith('/spike/support'))
      return t('sidebar.navigation.support');
    if (pathname.startsWith('/spike/staff'))
      return t('sidebar.navigation.staff');
    if (pathname.startsWith('/spike/blog')) return t('sidebar.navigation.blog');
    if (pathname.startsWith('/spike/server-status'))
      return t('sidebar.navigation.serverStatus');
    if (pathname.startsWith('/spike/system-logs'))
      return t('sidebar.navigation.systemLogs');
    if (pathname.startsWith('/spike/help')) return t('sidebar.secondary.help');
    return t('sidebar.navigation.dashboard');
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex flex-1 items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/spike/dashboard">
                {t('header.breadcrumb')}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{getPageName()}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-2">
          <NotificationBell mode="admin" t={t} />
          <a
            href="/"
            target="_blank"
            className="bg-primary hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors"
          >
            <House className="h-4 w-4" />
            <span className="hidden sm:inline">{t('header.visitWebsite')}</span>
          </a>
          <LanguageSwitcherDashboard storageKey="admin-locale" />
        </div>
      </div>
    </header>
  );
}
