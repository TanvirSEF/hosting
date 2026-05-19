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
import { Package, Activity, DollarSign } from 'lucide-react';
import { useAdminTranslation } from '@/components/AdminTranslationProvider';
import { ServicesTable } from '@/app/(adminportal)/spike/services/services-table';
import { useCurrency } from '@/contexts/CurrencyContext';

interface AdminServicesContentProps {
  admin: any;
  services: any[];
  activeServices: number;
  totalValue: number;
}

function AdminServicesContent({
  admin,
  services,
  activeServices,
  totalValue,
}: AdminServicesContentProps) {
  const { t } = useAdminTranslation();
  const { formatPrice } = useCurrency();

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
                  {t('services.title')}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {t('services.subtitle')}
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
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
                      {t('services.stats.monthlyRevenue')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <DollarSign className="h-5 w-5 text-blue-500" />
                      <span className="text-blue-600">
                        {formatPrice(totalValue)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('services.stats.monthlyRevenueDesc')}
                    </div>
                  </CardFooter>
                </Card>
              </div>

              {/* Services Table */}
              <div className="px-4 lg:px-6">
                <ServicesTable services={services} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

interface AdminServicesClientWrapperProps {
  admin: any;
  services: any[];
  activeServices: number;
  totalValue: number;
}

export function AdminServicesClientWrapper({
  admin,
  services,
  activeServices,
  totalValue,
}: AdminServicesClientWrapperProps) {
  return (
    <AdminTranslationProvider>
      <AdminServicesContent
        admin={admin}
        services={services}
        activeServices={activeServices}
        totalValue={totalValue}
      />
    </AdminTranslationProvider>
  );
}
