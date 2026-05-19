'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  IconServer,
  IconGlobe,
  IconCreditCard,
  IconLifebuoy,
  IconDashboard,
  IconUser,
  IconLock,
  IconMail,
} from '@tabler/icons-react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useDashboardTranslation } from '@/components/DashboardTranslationProvider';

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { t } = useDashboardTranslation();
  const { state } = useSidebar();

  const navMain = [
    {
      title: t('sidebar.navigation.dashboard'),
      url: '/dashboard',
      icon: IconDashboard,
    },
    {
      title: t('sidebar.navigation.services'),
      url: '/dashboard/services',
      icon: IconServer,
      items: [
        {
          title: t('sidebar.navigation.allServices'),
          url: '/dashboard/services',
        },
        {
          title: t('sidebar.navigation.orderNewService'),
          url: '/dashboard/services/order',
        },
      ],
    },
    {
      title: t('sidebar.navigation.billing'),
      url: '/dashboard/billing',
      icon: IconCreditCard,
      items: [
        {
          title: t('sidebar.navigation.invoices'),
          url: '/dashboard/billing',
        },
        {
          title: t('sidebar.navigation.paymentMethods'),
          url: '/dashboard/billing/payment-methods',
        },
      ],
    },
    {
      title: t('sidebar.navigation.support'),
      url: '/dashboard/support',
      icon: IconLifebuoy,
    },
    {
      title: t('sidebar.navigation.emails'),
      url: '/dashboard/emails',
      icon: IconMail,
    },
    {
      title: t('sidebar.navigation.domains'),
      url: '/dashboard/domains',
      icon: IconGlobe,
      items: [
        {
          title: t('sidebar.navigation.myDomains'),
          url: '/dashboard/domains',
        },
        {
          title: t('sidebar.navigation.registerDomain'),
          url: '/dashboard/domain-register',
        },
        {
          title: t('sidebar.navigation.transferDomain'),
          url: '/dashboard/domain-transfer',
        },
      ],
    },
    {
      title: t('sidebar.navigation.account'),
      url: '/dashboard/account',
      icon: IconUser,
      items: [
        {
          title: t('sidebar.navigation.accountInformation'),
          url: '/dashboard/account',
        },
        {
          title: t('sidebar.navigation.security'),
          url: '/dashboard/account/security',
        },
      ],
    },
  ];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {state === 'expanded' && (
        <>
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="data-[slot=sidebar-menu-button]:p-1.5!"
                >
                  <a href="/dashboard">
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
            <NavUser user={user} />
          </SidebarFooter>
        </>
      )}
    </Sidebar>
  );
}
