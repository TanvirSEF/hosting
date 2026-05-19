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
import { Users, Shield, UserCog, UserCheck } from 'lucide-react';
import { useAdminTranslation } from '@/components/AdminTranslationProvider';
import { StaffTable } from '@/app/(adminportal)/spike/staff/staff-table';

interface AdminStaffContentProps {
  admin: any;
  staff: any[];
  superAdmins: number;
  admins: number;
  moderators: number;
  currentUserId: string;
}

function AdminStaffContent({
  admin,
  staff,
  superAdmins,
  admins,
  moderators,
  currentUserId,
}: AdminStaffContentProps) {
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
      <AdminSidebar user={admin} />
      <SidebarInset>
        <AdminHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Header */}
              <div className="px-4 lg:px-6">
                <h1 className="text-foreground text-3xl font-bold tracking-tight">
                  {t('staff.title')}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {t('staff.subtitle')}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('staff.stats.totalStaff')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <Users className="text-primary h-5 w-5" />
                      {staff?.length || 0}
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('staff.stats.totalStaffDesc')}
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('staff.stats.superAdmins')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <Shield className="h-5 w-5 text-red-500" />
                      <span className="text-red-600">{superAdmins}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('staff.stats.superAdminsDesc')}
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>{t('staff.stats.admins')}</CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <UserCog className="h-5 w-5 text-blue-500" />
                      <span className="text-blue-600">{admins}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('staff.stats.adminsDesc')}
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>
                      {t('staff.stats.moderators')}
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <UserCheck className="h-5 w-5 text-green-500" />
                      <span className="text-green-600">{moderators}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                      {t('staff.stats.moderatorsDesc')}
                    </div>
                  </CardFooter>
                </Card>
              </div>

              {/* Staff Table */}
              <div className="px-4 lg:px-6">
                <StaffTable staff={staff || []} currentUserId={currentUserId} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

interface AdminStaffClientWrapperProps {
  admin: any;
  staff: any[];
  superAdmins: number;
  admins: number;
  moderators: number;
  currentUserId: string;
}

export function AdminStaffClientWrapper({
  admin,
  staff,
  superAdmins,
  admins,
  moderators,
  currentUserId,
}: AdminStaffClientWrapperProps) {
  return (
    <AdminTranslationProvider>
      <AdminStaffContent
        admin={admin}
        staff={staff}
        superAdmins={superAdmins}
        admins={admins}
        moderators={moderators}
        currentUserId={currentUserId}
      />
    </AdminTranslationProvider>
  );
}
