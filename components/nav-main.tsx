'use client';

import { type LucideIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    newTab?: boolean;
    icon?: LucideIcon;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const hasSubItems = item.items && item.items.length > 0;

            // Check if any sub-item is active
            const isSubItemActive =
              hasSubItems &&
              item.items?.some((subItem) => pathname === subItem.url);

            // Parent is active only if:
            // 1. Exact match (for items without sub-items like Dashboard)
            // 2. Has sub-items and one is active (for Billing when on Invoices/Payment Methods)
            // Note: We removed the pathname.startsWith check to prevent /dashboard matching /dashboard/billing
            const isActive = hasSubItems
              ? pathname === item.url || isSubItemActive
              : pathname === item.url;

            if (hasSubItems) {
              return (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={isActive || isSubItemActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isActive}
                        style={
                          isActive
                            ? { backgroundColor: '#8C52FF', color: 'white' }
                            : {}
                        }
                        className={
                          isActive
                            ? 'hover:bg-[#8C52FF]! hover:text-white!'
                            : ''
                        }
                      >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          const isSubActive = pathname === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubActive}
                                style={
                                  isSubActive
                                    ? {
                                        backgroundColor: '#8C52FF',
                                        color: 'white',
                                      }
                                    : {}
                                }
                                className={
                                  isSubActive
                                    ? 'hover:bg-[#8C52FF]! hover:text-white!'
                                    : ''
                                }
                              >
                                <a href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  asChild
                  isActive={isActive}
                  style={
                    isActive
                      ? { backgroundColor: '#8C52FF', color: 'white' }
                      : {}
                  }
                  className={
                    isActive ? 'hover:bg-[#8C52FF]! hover:text-white!' : ''
                  }
                >
                  <a
                    href={item.url}
                    target={item.newTab ? '_blank' : undefined}
                    rel={item.newTab ? 'noreferrer' : undefined}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
