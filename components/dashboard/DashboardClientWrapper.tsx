'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardTranslationProvider } from '@/components/DashboardTranslationProvider';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Server, Globe, CreditCard, TrendingDown, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDashboardTranslation } from '@/components/DashboardTranslationProvider';
import { PromotionalBanner } from '@/components/dashboard/promotional-banner';
import { FreeEmailBanner } from '@/components/dashboard/free-email-banner';

interface DashboardContentProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    firstname: string;
  };
  serviceCount: number;
  activeServices?: any[];
  domainCount: number;
  unpaidInvoices: number;
  promotions?: any[];
  showEmailBanner?: boolean;
}

function DashboardContent({
  user,
  serviceCount,
  activeServices,
  domainCount,
  unpaidInvoices,
  promotions,
  showEmailBanner,
}: DashboardContentProps) {
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
              {/* Free Email Banner */}
              <div className="px-4 lg:px-6">
                <div className="mx-auto w-full max-w-7xl">
                  <FreeEmailBanner show={showEmailBanner ?? false} />
                </div>
              </div>

              {/* Welcome Section */}
              <div className="px-4 lg:px-6">
                <div className="mx-auto w-full max-w-7xl">
                  <h1 className="text-foreground text-3xl font-bold tracking-tight">
                    {t('dashboard.welcome', { firstname: user.firstname })}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {t('dashboard.subtitle')}
                  </p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="px-4 lg:px-6">
                <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
                  <Card className="@container/card">
                    <CardHeader>
                      <CardDescription>
                        {t('dashboard.stats.activeServices')}
                      </CardDescription>
                      <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        <Server className="text-primary h-5 w-5" />
                        {serviceCount}
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
                        {t('dashboard.stats.domains')}
                      </CardDescription>
                      <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        <Globe className="text-primary h-5 w-5" />
                        {domainCount}
                      </CardTitle>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                      <div className="text-muted-foreground">
                        {t('dashboard.stats.domainsDesc')}
                      </div>
                    </CardFooter>
                  </Card>

                  <Card
                    className={
                      unpaidInvoices > 0
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
                          className={`h-5 w-5 ${unpaidInvoices > 0 ? 'text-destructive' : 'text-primary'}`}
                        />
                        <span
                          className={unpaidInvoices > 0 ? 'text-destructive' : ''}
                        >
                          {unpaidInvoices}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                      {unpaidInvoices > 0 ? (
                        <Badge
                          variant="outline"
                          className="border-destructive/50 text-destructive"
                        >
                          <TrendingDown className="mr-1 h-3 w-3" />
                          {t('dashboard.stats.actionRequired')}
                        </Badge>
                      ) : (
                        <div className="text-muted-foreground">
                          {t('dashboard.stats.allPaid')}
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                </div>
              </div>

              {/* Promotional Banner */}
              <div className="px-4 lg:px-6">
                <PromotionalBanner promotions={promotions} />
              </div>

              {/* Website Portfolio (Your business) */}
              {activeServices && activeServices.length > 0 && (
                <div className="px-4 lg:px-6 mt-2">
                  <div className="mx-auto w-full max-w-7xl">
                    <h2 className="text-xl font-bold mb-4 ml-1">Your business</h2>
                    <div className="flex flex-col gap-3">
                      {activeServices.map((service) => (
                        <div
                          key={service.id}
                          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between group hover:border-primary/50 transition-all duration-300"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm">
                              <img
                                src={`https://s0.wp.com/mshots/v1/https%3A%2F%2F${service.domain}?w=120&h=120`}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to domain initial if mshot fails
                                  (e.target as any).style.display = 'none';
                                  (e.target as any).parentElement.innerHTML = `<span class="text-xs font-bold text-zinc-400 capitalize">${service.domain.charAt(0)}</span>`;
                                }}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <a
                                  href={`https://${service.domain}`}
                                  target="_blank"
                                  className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 hover:text-primary flex items-center gap-2 transition-colors"
                                >
                                  {service.domain}
                                  <ExternalLink className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                                </a>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[10px] h-5 px-2 font-medium flex items-center gap-1">
                                  <div className="w-1 h-1 rounded-full bg-primary" />
                                  Active Hosting
                                </Badge>
                                <span className="text-[10px] text-zinc-400">
                                  {service.name}
                                </span>
                              </div>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

interface DashboardClientWrapperProps {
  data: {
    user: {
      name: string;
      email: string;
      avatar: string;
      firstname: string;
    };
    serviceCount: number;
    activeServices?: any[];
    domainCount: number;
    unpaidInvoices: number;
    promotions?: any[];
    showEmailBanner?: boolean;
  } | null;
}

function ErrorMessage() {
  const { t } = useDashboardTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center">
      {t('dashboard.error.loading')}
    </div>
  );
}

export function DashboardClientWrapper({ data }: DashboardClientWrapperProps) {
  if (!data) {
    return (
      <DashboardTranslationProvider>
        <ErrorMessage />
      </DashboardTranslationProvider>
    );
  }

  return (
    <DashboardTranslationProvider>
      <DashboardContent
        user={data.user}
        serviceCount={data.serviceCount}
        activeServices={data.activeServices}
        domainCount={data.domainCount}
        unpaidInvoices={data.unpaidInvoices}
        promotions={data.promotions}
        showEmailBanner={data.showEmailBanner}
      />
    </DashboardTranslationProvider>
  );
}
