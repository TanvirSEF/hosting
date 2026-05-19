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
import { Mail, HardDrive, Database, Activity } from 'lucide-react';
import { useDashboardTranslation } from '@/components/DashboardTranslationProvider';
import { EmailAccountsTable } from '@/app/(clientportal)/dashboard/emails/email-accounts-table';

interface EmailsContentProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    firstname: string;
  };
  emailAccounts: any[];
  domains: any[];
  activeAccounts: number;
  totalStorage: number;
  totalQuota: number;
}

function EmailsContent({
  user,
  emailAccounts,
  domains,
  activeAccounts,
  totalStorage,
  totalQuota,
}: EmailsContentProps) {
  const { t } = useDashboardTranslation();

  // Format storage size
  const formatStorage = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  };

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
                  {t('emails.title')}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {t('emails.subtitle')}
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('emails.stats.totalAccounts')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <Mail className="text-primary h-5 w-5" />
                      {emailAccounts.length}
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('emails.stats.totalAccountsDesc')}
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('emails.stats.activeAccounts')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <Activity className="h-5 w-5 text-green-500" />
                      <span className="text-green-600">{activeAccounts}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('emails.stats.activeAccountsDesc')}
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('emails.stats.storageUsed')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <HardDrive className="h-5 w-5 text-blue-500" />
                      <span className="text-blue-600">
                        {formatStorage(totalStorage)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('emails.stats.storageUsedDesc')}
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('emails.stats.totalStorage')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <Database className="h-5 w-5 text-purple-500" />
                      <span className="text-purple-600">
                        {formatStorage(totalQuota)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('emails.stats.totalStorageDesc')}
                    </div>
                  </CardFooter>
                </Card>
              </div>

              {/* Email Accounts Table */}
              <div className="px-4 lg:px-6">
                <EmailAccountsTable
                  emailAccounts={emailAccounts}
                  domains={domains}
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

interface EmailsClientWrapperProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    firstname: string;
  } | null;
  emailAccounts: any[];
  domains: any[];
  activeAccounts: number;
  totalStorage: number;
  totalQuota: number;
}

function EmailsErrorMessage() {
  const { t } = useDashboardTranslation();
  return (
    <div className="flex items-center justify-center min-h-screen">
      {t('emails.error.loginRequired')}
    </div>
  );
}

export function EmailsClientWrapper({
  user,
  emailAccounts,
  domains,
  activeAccounts,
  totalStorage,
  totalQuota,
}: EmailsClientWrapperProps) {
  if (!user) {
    return (
      <DashboardTranslationProvider>
        <EmailsErrorMessage />
      </DashboardTranslationProvider>
    );
  }

  return (
    <DashboardTranslationProvider>
      <EmailsContent
        user={user}
        emailAccounts={emailAccounts}
        domains={domains}
        activeAccounts={activeAccounts}
        totalStorage={totalStorage}
        totalQuota={totalQuota}
      />
    </DashboardTranslationProvider>
  );
}

