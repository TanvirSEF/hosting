'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardTranslationProvider } from '@/components/DashboardTranslationProvider';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Globe, RefreshCw, Activity, Clock } from 'lucide-react';
import { useDashboardTranslation } from '@/components/DashboardTranslationProvider';
import { DomainsTable } from '@/app/(clientportal)/dashboard/domains/domains-table';

interface DomainsContentProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    firstname: string;
  };
  domains: any[];
  activeDomains: number;
  expiringSoon: number;
  autoRenewEnabled: number;
}

function DomainsContent({
  user,
  domains,
  activeDomains,
  expiringSoon,
  autoRenewEnabled,
}: DomainsContentProps) {
  const { t } = useDashboardTranslation();

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Header Section */}
              <div className="px-4 lg:px-6">
                <h1 className="text-foreground text-3xl font-bold tracking-tight">
                  {t('domains.title')}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {t('domains.subtitle')}
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('domains.stats.totalDomains')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <Globe className="text-primary h-5 w-5" />
                      {domains.length}
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('domains.stats.totalDomainsDesc')}
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('domains.stats.activeDomains')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <Activity className="h-5 w-5 text-green-500" />
                      <span className="text-green-600">{activeDomains}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('domains.stats.activeDomainsDesc')}
                    </div>
                  </CardFooter>
                </Card>

                <Card
                  className={
                    expiringSoon > 0
                      ? 'border-destructive/50 bg-destructive/5 @container/card'
                      : '@container/card'
                  }
                >
                  <CardHeader>
                    <CardDescription>
                      {t('domains.stats.expiringDomains')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <Clock
                        className={`h-5 w-5 ${expiringSoon > 0 ? 'text-orange-500' : 'text-primary'}`}
                      />
                      <span
                        className={expiringSoon > 0 ? 'text-orange-600' : ''}
                      >
                        {expiringSoon}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('domains.stats.expiringDomainsDesc')}
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('domains.table.autoRenew')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <RefreshCw className="h-5 w-5 text-blue-500" />
                      <span className="text-blue-600">{autoRenewEnabled}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('domains.stats.autoRenewDesc')}
                    </div>
                  </CardFooter>
                </Card>
              </div>

              {/* Domains Table */}
              <div className="px-4 lg:px-6">
                <DomainsTable domains={domains} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

interface DomainsClientWrapperProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    firstname: string;
  } | null;
  domains: any[];
  activeDomains: number;
  expiringSoon: number;
  autoRenewEnabled: number;
}

function DomainsErrorMessage() {
  const { t } = useDashboardTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center">
      {t('domains.error.loginRequired')}
    </div>
  );
}

export function DomainsClientWrapper({
  user,
  domains,
  activeDomains,
  expiringSoon,
  autoRenewEnabled,
}: DomainsClientWrapperProps) {
  if (!user) {
    return (
      <DashboardTranslationProvider>
        <DomainsErrorMessage />
      </DashboardTranslationProvider>
    );
  }

  return (
    <DashboardTranslationProvider>
      <DomainsContent
        user={user}
        domains={domains}
        activeDomains={activeDomains}
        expiringSoon={expiringSoon}
        autoRenewEnabled={autoRenewEnabled}
      />
    </DashboardTranslationProvider>
  );
}
