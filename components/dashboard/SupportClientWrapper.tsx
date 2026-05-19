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
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';
import { useDashboardTranslation } from '@/components/DashboardTranslationProvider';
import { TicketsTable } from '@/app/(clientportal)/dashboard/support/tickets-table';

interface SupportContentProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    firstname: string;
  };
  tickets: any[];
  openTickets: number;
  answeredTickets: number;
  closedTickets: number;
}

function SupportContent({
  user,
  tickets,
  openTickets,
  answeredTickets,
  closedTickets,
}: SupportContentProps) {
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

interface SupportClientWrapperProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    firstname: string;
  } | null;
  tickets: any[];
  openTickets: number;
  answeredTickets: number;
  closedTickets: number;
}

function SupportErrorMessage() {
  const { t } = useDashboardTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center">
      {t('support.error.loginRequired')}
    </div>
  );
}

export function SupportClientWrapper({
  user,
  tickets,
  openTickets,
  answeredTickets,
  closedTickets,
}: SupportClientWrapperProps) {
  if (!user) {
    return (
      <DashboardTranslationProvider>
        <SupportErrorMessage />
      </DashboardTranslationProvider>
    );
  }

  return (
    <DashboardTranslationProvider>
      <SupportContent
        user={user}
        tickets={tickets}
        openTickets={openTickets}
        answeredTickets={answeredTickets}
        closedTickets={closedTickets}
      />
    </DashboardTranslationProvider>
  );
}
