'use client';

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Users,
  Server,
  Globe,
  CreditCard,
  MessageSquare,
  LayoutDashboard,
  UserCog,
  BookOpen,
  ScrollText,
  Activity,
  Settings,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { AdminNavUser } from '@/components/admin-nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAdminTranslation } from '@/components/AdminTranslationProvider';

type AdminNavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  newTab?: boolean;
};

// Navigation items with role requirements
const getAdminNavMain = (role: string, t: (key: string) => string) => {
  const items: AdminNavItem[] = [
    {
      title: t('sidebar.navigation.dashboard'),
      url: '/spike/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: t('sidebar.navigation.clients'),
      url: '/spike/clients',
      icon: Users,
    },
    {
      title: t('sidebar.navigation.services'),
      url: '/spike/services',
      icon: Server,
    },
    {
      title: t('sidebar.navigation.domains'),
      url: '/spike/domains',
      icon: Globe,
    },
    {
      title: t('sidebar.navigation.support'),
      url: '/spike/support',
      icon: MessageSquare,
    },
    {
      title: t('sidebar.navigation.blog'),
      url: '/spike/blog',
      icon: BookOpen,
    },
    {
      title: 'System Logs',
      url: '/spike/system-logs',
      icon: ScrollText,
    },
    {
      title: 'Server Status',
      url: '/spike/server-status',
      icon: Activity,
    },
  ];

  // Add billing for SUPER_ADMIN and ADMIN only
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    items.push({
      title: t('sidebar.navigation.billing'),
      url: '/spike/billing',
      icon: CreditCard,
    });
  }

  // Add Staff for SUPER_ADMIN only
  if (role === 'SUPER_ADMIN') {
    items.push({
      title: t('sidebar.navigation.staff'),
      url: '/spike/staff',
      icon: UserCog,
    });
    items.push({
      title: t('sidebar.navigation.tinaCms'),
      url: '/admin',
      newTab: true,
      icon: Settings,
    });
  }

  return items;
};

export function AdminSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: any }) {
  const { t } = useAdminTranslation();
  const role = user?.role || 'MODERATOR';
  const navMain = getAdminNavMain(role, t);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/spike/dashboard">
                <div className="flex h-16 w-full items-center justify-start overflow-hidden px-1">
                  <img
                    src="/images/webblymediablack.svg"
                    alt="Logo"
                    className="h-10 w-auto object-contain dark:hidden lg:h-12"
                  />
                  <img
                    src="/images/webblymediawhite.svg"
                    alt="Logo"
                    className="hidden h-10 w-auto object-contain dark:block lg:h-12"
                  />
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <AdminNavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
