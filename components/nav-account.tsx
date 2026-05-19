'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { IconUser, IconChevronDown, IconLock } from '@tabler/icons-react';
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export function NavAccount() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(
    pathname?.startsWith('/dashboard/account') || false
  );

  const isAccountActive = pathname === '/dashboard/account';
  const isSecurityActive = pathname === '/dashboard/account/security';

  return (
    <SidebarMenuItem>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip="Account Information"
            isActive={isAccountActive || isSecurityActive}
            style={
              isAccountActive || isSecurityActive
                ? { backgroundColor: '#8C52FF', color: 'white' }
                : {}
            }
            className={
              isAccountActive || isSecurityActive
                ? 'hover:bg-[#8C52FF]! hover:text-white!'
                : ''
            }
          >
            <IconUser />
            <span>Account Information</span>
            <IconChevronDown
              className={`ml-auto transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton asChild isActive={isAccountActive}>
                <a href="/dashboard/account">
                  <IconUser />
                  <span>Account Information</span>
                </a>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton asChild isActive={isSecurityActive}>
                <a href="/dashboard/account/security">
                  <IconLock />
                  <span>Security</span>
                </a>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
