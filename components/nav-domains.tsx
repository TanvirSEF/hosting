'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { IconGlobe, IconChevronDown } from '@tabler/icons-react';
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

export function NavDomains() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(
    pathname?.startsWith('/dashboard/domains') ||
      pathname?.startsWith('/dashboard/domain-register') ||
      pathname?.startsWith('/dashboard/domain-transfer') ||
      false
  );

  const isDomainsActive = pathname === '/dashboard/domains';
  const isRegisterActive = pathname === '/dashboard/domain-register';
  const isTransferActive = pathname === '/dashboard/domain-transfer';

  return (
    <SidebarMenuItem>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip="Domains"
            isActive={isDomainsActive || isRegisterActive || isTransferActive}
            style={
              isDomainsActive || isRegisterActive || isTransferActive
                ? { backgroundColor: '#8C52FF', color: 'white' }
                : {}
            }
            className={
              isDomainsActive || isRegisterActive || isTransferActive
                ? 'hover:bg-[#8C52FF]! hover:text-white!'
                : ''
            }
          >
            <IconGlobe />
            <span>Domains</span>
            <IconChevronDown
              className={`ml-auto transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton asChild isActive={isDomainsActive}>
                <a href="/dashboard/domains">
                  <IconGlobe />
                  <span>My Domains</span>
                </a>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton asChild isActive={isRegisterActive}>
                <a href="/dashboard/domain-register">
                  <IconGlobe />
                  <span>Register New Domain</span>
                </a>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton asChild isActive={isTransferActive}>
                <a href="/dashboard/domain-transfer">
                  <IconGlobe />
                  <span>Transfer Domain</span>
                </a>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
