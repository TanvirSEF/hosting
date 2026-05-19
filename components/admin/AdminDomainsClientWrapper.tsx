'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminTranslationProvider } from '@/components/AdminTranslationProvider';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminHeader } from '@/components/admin-header';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Globe, Activity, RefreshCw } from 'lucide-react';
import { useAdminTranslation } from '@/components/AdminTranslationProvider';
import { DomainsTable } from '@/app/(adminportal)/spike/domains/domains-table';

interface AdminDomainsContentProps {
  admin: any;
  domains: any[];
  activeDomains: number;
  autoRenewEnabled: number;
}

function AdminDomainsContent({
  admin,
  domains,
  activeDomains,
  autoRenewEnabled,
}: AdminDomainsContentProps) {
  const { t } = useAdminTranslation();

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AdminSidebar variant="inset" user={admin} />
      <SidebarInset>
        <AdminHeader />
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
              <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
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

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('domains.stats.autoRenew')}
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

interface AdminDomainsClientWrapperProps {
  admin: any;
  domains: any[];
  activeDomains: number;
  autoRenewEnabled: number;
}

export function AdminDomainsClientWrapper({
  admin,
  domains,
  activeDomains,
  autoRenewEnabled,
}: AdminDomainsClientWrapperProps) {
  return (
    <AdminTranslationProvider>
      <AdminDomainsContent
        admin={admin}
        domains={domains}
        activeDomains={activeDomains}
        autoRenewEnabled={autoRenewEnabled}
      />
    </AdminTranslationProvider>
  );
}
