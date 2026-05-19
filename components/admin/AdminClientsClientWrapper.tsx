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
import { Users, CheckCircle2, XCircle } from 'lucide-react';
import { useAdminTranslation } from '@/components/AdminTranslationProvider';
import { ClientsTable } from '@/app/(adminportal)/spike/clients/clients-table';
import { AddClientButton } from '@/components/admin-client-buttons';

interface AdminClientsContentProps {
  admin: any;
  clients: any[];
  activeClients: number;
  inactiveClients: number;
}

function AdminClientsContent({
  admin,
  clients,
  activeClients,
  inactiveClients,
}: AdminClientsContentProps) {
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
                  {t('clients.title')}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {t('clients.subtitle')}
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('clients.stats.totalClients')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <Users className="text-primary h-5 w-5" />
                      {clients.length}
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('clients.stats.totalClientsDesc')}
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('clients.stats.activeClients')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-green-600">{activeClients}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('clients.stats.activeClientsDesc')}
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('clients.stats.inactiveClients')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <XCircle className="h-5 w-5 text-gray-500" />
                      <span className="text-gray-600">{inactiveClients}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('clients.stats.inactiveClientsDesc')}
                    </div>
                  </CardFooter>
                </Card>
              </div>

              {/* Clients Table */}
              <div className="px-4 lg:px-6">
                <div className="mb-4 flex justify-end">
                  <AddClientButton />
                </div>
                <ClientsTable clients={clients} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

interface AdminClientsClientWrapperProps {
  admin: any;
  clients: any[];
  activeClients: number;
  inactiveClients: number;
}

export function AdminClientsClientWrapper({
  admin,
  clients,
  activeClients,
  inactiveClients,
}: AdminClientsClientWrapperProps) {
  return (
    <AdminTranslationProvider>
      <AdminClientsContent
        admin={admin}
        clients={clients}
        activeClients={activeClients}
        inactiveClients={inactiveClients}
      />
    </AdminTranslationProvider>
  );
}
