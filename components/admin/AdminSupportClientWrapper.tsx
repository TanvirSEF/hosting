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
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';
import { useAdminTranslation } from '@/components/AdminTranslationProvider';
import { TicketsTable } from '@/app/(adminportal)/spike/support/tickets-table';

interface AdminSupportContentProps {
  admin: any;
  tickets: any[];
  openTickets: number;
  answeredTickets: number;
  closedTickets: number;
}

function AdminSupportContent({
  admin,
  tickets,
  openTickets,
  answeredTickets,
  closedTickets,
}: AdminSupportContentProps) {
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
                  {t('support.title')}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {t('support.subtitle')}
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('support.stats.totalTickets')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <MessageSquare className="text-primary h-5 w-5" />
                      {tickets.length}
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('support.stats.totalTicketsDesc')}
                    </div>
                  </CardFooter>
                </Card>

                <Card
                  className={
                    openTickets > 0
                      ? 'border-destructive/50 bg-destructive/5 @container/card'
                      : '@container/card'
                  }
                >
                  <CardHeader>
                    <CardDescription>
                      {t('support.stats.openTickets')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <Clock
                        className={`h-5 w-5 ${openTickets > 0 ? 'text-orange-500' : 'text-primary'}`}
                      />
                      <span
                        className={openTickets > 0 ? 'text-orange-600' : ''}
                      >
                        {openTickets}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('support.stats.openTicketsDesc')}
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('support.status.answered')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <MessageCircle className="h-5 w-5 text-blue-500" />
                      <span className="text-blue-600">{answeredTickets}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('support.stats.answeredTicketsDesc')}
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('support.status.closed')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-green-600">{closedTickets}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('support.stats.closedTicketsDesc')}
                    </div>
                  </CardFooter>
                </Card>
              </div>

              {/* Tickets Table */}
              <div className="px-4 lg:px-6">
                <TicketsTable tickets={tickets} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

interface AdminSupportClientWrapperProps {
  admin: any;
  tickets: any[];
  openTickets: number;
  answeredTickets: number;
  closedTickets: number;
}

export function AdminSupportClientWrapper({
  admin,
  tickets,
  openTickets,
  answeredTickets,
  closedTickets,
}: AdminSupportClientWrapperProps) {
  return (
    <AdminTranslationProvider>
      <AdminSupportContent
        admin={admin}
        tickets={tickets}
        openTickets={openTickets}
        answeredTickets={answeredTickets}
        closedTickets={closedTickets}
      />
    </AdminTranslationProvider>
  );
}
