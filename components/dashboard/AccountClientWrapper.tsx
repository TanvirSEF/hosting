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
  CardContent,
} from '@/components/ui/card';
import { User, Mail, Phone, MapPin, Building, Calendar } from 'lucide-react';
import { useDashboardTranslation } from '@/components/DashboardTranslationProvider';

interface AccountContentProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    firstname: string;
  } | null;
  accountData: any | null;
}

function AccountContent({ user, accountData }: AccountContentProps) {
  const { t } = useDashboardTranslation();

  if (!user) {
    return null;
  }

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
                  {t('account.title')}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {t('account.subtitle')}
                </p>
              </div>

              {/* Account Information Card */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {t('account.personalInfo')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {accountData ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-1">
                          <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                            <User className="h-4 w-4" />
                            {t('account.fields.fullName')}
                          </div>
                          <div className="text-base">
                            {accountData.firstname} {accountData.lastname}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                            <Mail className="h-4 w-4" />
                            {t('account.fields.email')}
                          </div>
                          <div className="text-base">{accountData.email}</div>
                        </div>

                        {accountData.phonenumber && (
                          <div className="space-y-1">
                            <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                              <Phone className="h-4 w-4" />
                              {t('account.fields.phone')}
                            </div>
                            <div className="text-base">
                              {accountData.phonenumber}
                            </div>
                          </div>
                        )}

                        {accountData.companyname && (
                          <div className="space-y-1">
                            <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                              <Building className="h-4 w-4" />
                              {t('account.fields.company')}
                            </div>
                            <div className="text-base">
                              {accountData.companyname}
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                            <Calendar className="h-4 w-4" />
                            {t('account.fields.status')}
                          </div>
                          <div className="text-base">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                accountData.status === 'Active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {accountData.status}
                            </span>
                          </div>
                        </div>

                        {(accountData.address1 ||
                          accountData.city ||
                          accountData.state ||
                          accountData.postcode ||
                          accountData.country) && (
                          <div className="space-y-1 md:col-span-2">
                            <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                              <MapPin className="h-4 w-4" />
                              {t('account.fields.address')}
                            </div>
                            <div className="text-base">
                              {[
                                accountData.address1,
                                accountData.address2,
                                accountData.city,
                                accountData.state,
                                accountData.postcode,
                                accountData.country,
                              ]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-muted-foreground py-8 text-center">
                        {t('account.error.loadFailed')}
                      </div>
                    )}
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

export function AccountClientWrapper({
  user,
  accountData,
}: AccountContentProps) {
  return (
    <DashboardTranslationProvider>
      <AccountContent user={user} accountData={accountData} />
    </DashboardTranslationProvider>
  );
}
