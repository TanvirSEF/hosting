'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminTranslationProvider } from '@/components/AdminTranslationProvider';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminHeader } from '@/components/admin-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Server, Globe, CreditCard, Users } from 'lucide-react';
import { useAdminTranslation } from '@/components/AdminTranslationProvider';
import Link from 'next/link';

interface AdminDashboardContentProps {
  admin: any;
  data: {
    totalClients: number;
    totalServices: number;
    totalDomains: number;
    unpaidInvoices: number;
  };
}

function AdminDashboardContent({ admin, data }: AdminDashboardContentProps) {
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
                  {t('dashboard.title')}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {t('dashboard.welcome')}
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:grid-cols-4 lg:px-6">
                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('dashboard.stats.totalClients')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <Users className="text-primary h-5 w-5" />
                      {data.totalClients}
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('dashboard.stats.totalClientsDesc')}
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('dashboard.stats.activeServices')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <Server className="text-primary h-5 w-5" />
                      {data.totalServices}
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('dashboard.stats.activeServicesDesc')}
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('dashboard.stats.totalDomains')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <Globe className="text-primary h-5 w-5" />
                      {data.totalDomains}
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('dashboard.stats.totalDomainsDesc')}
                    </div>
                  </CardFooter>
                </Card>

                <Card
                  className={
                    data.unpaidInvoices > 0
                      ? 'border-destructive/50 bg-destructive/5 @container/card'
                      : '@container/card'
                  }
                >
                  <CardHeader>
                    <CardDescription>
                      {t('dashboard.stats.unpaidInvoices')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <CreditCard
                        className={`h-5 w-5 ${data.unpaidInvoices > 0 ? 'text-destructive' : 'text-primary'}`}
                      />
                      <span
                        className={
                          data.unpaidInvoices > 0 ? 'text-destructive' : ''
                        }
                      >
                        {data.unpaidInvoices}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('dashboard.stats.unpaidInvoicesDesc')}
                    </div>
                  </CardFooter>
                </Card>
              </div>

              {/* Quick Actions Section */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('dashboard.quickActions.title')}</CardTitle>
                    <CardDescription>
                      {t('dashboard.quickActions.subtitle')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <Link href="/spike/clients">
                        <div className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors">
                          <div className="bg-primary/10 rounded-lg p-2">
                            <Users className="text-primary h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-semibold">
                              {t('dashboard.quickActions.manageClients')}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {t('dashboard.quickActions.manageClientsDesc')}
                            </div>
                          </div>
                        </div>
                      </Link>

                      <Link href="/spike/services">
                        <div className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors">
                          <div className="bg-primary/10 rounded-lg p-2">
                            <Server className="text-primary h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-semibold">
                              {t('dashboard.quickActions.services')}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {t('dashboard.quickActions.servicesDesc')}
                            </div>
                          </div>
                        </div>
                      </Link>

                      <Link href="/spike/billing">
                        <div className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors">
                          <div className="bg-primary/10 rounded-lg p-2">
                            <CreditCard className="text-primary h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-semibold">
                              {t('dashboard.quickActions.invoices')}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {t('dashboard.quickActions.invoicesDesc')}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

interface AdminDashboardClientWrapperProps {
  admin: any;
  data: {
    totalClients: number;
    totalServices: number;
    totalDomains: number;
    unpaidInvoices: number;
  };
}

export function AdminDashboardClientWrapper({
  admin,
  data,
}: AdminDashboardClientWrapperProps) {
  return (
    <AdminTranslationProvider>
      <AdminDashboardContent admin={admin} data={data} />
    </AdminTranslationProvider>
  );
}
