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
import { Package, DollarSign, Activity, Clock } from 'lucide-react';
import { useDashboardTranslation } from '@/components/DashboardTranslationProvider';
import { ServicesTable } from '@/app/(clientportal)/dashboard/services/services-table';
import { formatCurrency } from '@/lib/currency-utils';
import { useEffect, useState } from 'react';
import { getUserCurrency } from '@/lib/currency';

interface ServicesContentProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    firstname: string;
  };
  services: any[];
  activeServices: number;
  totalValue: number;
  expiringSoon: number;
  wpDomains: string[];
}

function ServicesContent({
  user,
  services,
  activeServices,
  totalValue,
  expiringSoon,
  wpDomains,
}: ServicesContentProps) {
  const { t } = useDashboardTranslation();
  const [currencyInfo, setCurrencyInfo] = useState<{
    currencyprefix?: string;
    currencysuffix?: string;
    currencycode?: string;
  } | null>(null);

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const currency = await getUserCurrency();
        setCurrencyInfo(currency);
      } catch (error) {
        // Error fetching currency
      }
    };
    fetchCurrency();
  }, []);

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
                  {t('services.allServicesTitle')}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {t('services.subtitle')}
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('services.stats.totalServices')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <Package className="text-primary h-5 w-5" />
                      {services.length}
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('services.stats.totalServicesDesc')}
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('services.stats.activeServices')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <Activity className="h-5 w-5 text-green-500" />
                      <span className="text-green-600">{activeServices}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('services.stats.activeServicesDesc')}
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('services.stats.monthlyValue')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <DollarSign className="h-5 w-5 text-blue-500" />
                      <span className="text-blue-600">
                        {currencyInfo
                          ? formatCurrency(totalValue, currencyInfo)
                          : '...'}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('services.stats.monthlyValueDesc')}
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
                      {t('services.stats.expiringSoon')}
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
                      {t('services.stats.expiringSoonDesc')}
                    </div>
                  </CardFooter>
                </Card>
              </div>

              {/* Services Table */}
              <div className="px-4 lg:px-6">
                <ServicesTable services={services} wpDomains={wpDomains} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

interface ServicesClientWrapperProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    firstname: string;
  } | null;
  services: any[];
  activeServices: number;
  totalValue: number;
  expiringSoon: number;
  wpDomains: string[];
}

function ServicesErrorMessage() {
  const { t } = useDashboardTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center">
      {t('services.error.loginRequired')}
    </div>
  );
}

export function ServicesClientWrapper({
  user,
  services,
  activeServices,
  totalValue,
  expiringSoon,
  wpDomains,
}: ServicesClientWrapperProps) {
  if (!user) {
    return (
      <DashboardTranslationProvider>
        <ServicesErrorMessage />
      </DashboardTranslationProvider>
    );
  }

  return (
    <DashboardTranslationProvider>
      <ServicesContent
        user={user}
        services={services}
        activeServices={activeServices}
        totalValue={totalValue}
        expiringSoon={expiringSoon}
        wpDomains={wpDomains}
      />
    </DashboardTranslationProvider>
  );
}
