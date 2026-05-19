'use client';

import * as React from 'react';
import { Link } from '@/i18n/routing';
import NextLink from 'next/link';
import { logoutAction } from '@/actions/auth';
import { adminLogoutAction } from '@/actions/admin-auth';
import { LayoutDashboard, LogOut, ChevronDown, Shield } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserMenuProps {
  user: {
    name: string;
    email: string;
  };
  admin?: {
    name: string;
    email: string;
  } | null;
  isScrolled?: boolean;
  isAdminOnly?: boolean;
  translations: {
    dashboard: string;
    adminDashboard: string;
    settings: string;
    logout: string;
  };
}

export function UserMenu({
  user,
  admin,
  isScrolled = false,
  isAdminOnly = false,
  translations,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleLogout = async () => {
    if (isAdminOnly) {
      await adminLogoutAction();
    } else {
      await logoutAction();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Button */}
      <button
        className={`flex items-center gap-2 rounded-full p-1 pr-2 transition-all duration-200 outline-none ${isScrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'
          }`}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <Avatar
          className={`h-8 w-8 ${isAdminOnly ? 'ring-2 ring-orange-500' : ''}`}
        >
          <AvatarImage src="" alt={user.name} />
          <AvatarFallback
            className={`${isAdminOnly ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-[#8A2BE2] to-purple-600'} text-xs font-medium text-white`}
          >
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <ChevronDown
          className={`h-4 w-4 transition-all duration-200 ${isOpen ? 'rotate-180' : ''
            } ${isScrolled ? 'text-gray-600' : 'text-white/80'}`}
        />
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute top-full right-0 w-64 pt-2 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
      >
        <div
          className={`rounded-xl border border-gray-100/80 bg-white p-1 shadow-xl transition-all duration-200 ease-out ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
            }`}
        >
          {/* User Info Header */}
          <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100/50 px-3 py-3">
            <Avatar
              className={`h-10 w-10 ${isAdminOnly ? 'ring-2 ring-orange-500' : ''}`}
            >
              <AvatarImage src="" alt={user.name} />
              <AvatarFallback
                className={`${isAdminOnly ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-[#8A2BE2] to-purple-600'} text-sm font-medium text-white`}
              >
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="flex items-center gap-1 truncate text-sm font-semibold text-gray-900">
                {user.name}
                {isAdminOnly && <Shield className="h-3 w-3 text-orange-500" />}
              </span>
              <span className="truncate text-xs text-gray-500">
                {user.email}
              </span>
            </div>
          </div>

          <div className="my-1 h-px bg-gray-100" />

          {/* Menu Items */}
          <div className="py-1">
            {/* Admin Dashboard Link - shows if admin is logged in */}
            {admin && (
              <NextLink
                href="/spike/dashboard"
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-700 transition-colors hover:bg-orange-50 hover:text-orange-600"
              >
                <div className="rounded-md bg-orange-50 p-1.5 transition-colors group-hover:bg-orange-100">
                  <Shield className="h-4 w-4 text-orange-500" />
                </div>
                <span className="font-medium">
                  {translations.adminDashboard}
                </span>
              </NextLink>
            )}

            {/* Client Dashboard - only show if not admin-only mode */}
            {!isAdminOnly && (
              <NextLink
                href="/dashboard"
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#8A2BE2]"
              >
                <div className="rounded-md bg-purple-50 p-1.5 transition-colors group-hover:bg-purple-100">
                  <LayoutDashboard className="h-4 w-4 text-[#8A2BE2]" />
                </div>
                <span className="font-medium">{translations.dashboard}</span>
              </NextLink>
            )}
          </div>

          <div className="my-1 h-px bg-gray-100" />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <div className="rounded-md bg-gray-100 p-1.5 transition-colors group-hover:bg-red-100">
              <LogOut className="h-4 w-4 text-gray-500 group-hover:text-red-500" />
            </div>
            <span className="font-medium">{translations.logout}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Mobile version - Collapsible section with click to expand
export function MobileUserSection({
  user,
  admin,
  isAdminOnly = false,
  translations,
  onClose,
}: {
  user: {
    name: string;
    email: string;
  };
  admin?: {
    name: string;
    email: string;
  } | null;
  isAdminOnly?: boolean;
  translations: {
    dashboard: string;
    adminDashboard: string;
    settings: string;
    logout: string;
  };
  onClose: () => void;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    if (isAdminOnly) {
      await adminLogoutAction();
    } else {
      await logoutAction();
    }
  };

  return (
    <div className="shrink-0 border-t border-gray-200 bg-gray-50">
      {/* Clickable User Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-3 px-4 py-4 transition-colors hover:bg-gray-100"
        aria-expanded={isExpanded}
      >
        <Avatar
          className={`h-10 w-10 ${isAdminOnly ? 'ring-2 ring-orange-500' : ''}`}
        >
          <AvatarImage src="" alt={user.name} />
          <AvatarFallback
            className={`${isAdminOnly ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-[#8A2BE2] to-purple-600'} text-sm font-semibold text-white`}
          >
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-col overflow-hidden text-left">
          <span className="flex items-center gap-1 truncate text-sm font-semibold text-gray-900">
            {user.name}
            {isAdminOnly && <Shield className="h-3 w-3 text-orange-500" />}
          </span>
          <span className="truncate text-xs text-gray-500">{user.email}</span>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
            }`}
        />
      </button>

      {/* Expandable Actions */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="flex flex-col gap-2 px-4 pb-4">
          {/* Admin Dashboard Link */}
          {admin && (
            <NextLink
              href="/spike/dashboard"
              onClick={onClose}
              className="group flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm transition-colors hover:bg-orange-50"
            >
              <div className="rounded-lg bg-orange-50 p-2 transition-colors group-hover:bg-orange-100">
                <Shield className="h-5 w-5 text-orange-500" />
              </div>
              <span className="font-medium text-gray-700 group-hover:text-orange-600">
                {translations.adminDashboard}
              </span>
            </NextLink>
          )}

          {/* Client Dashboard - only show if not admin-only mode */}
          {!isAdminOnly && (
            <NextLink
              href="/dashboard"
              onClick={onClose}
              className="group flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm transition-colors hover:bg-purple-50"
            >
              <div className="rounded-lg bg-purple-50 p-2 transition-colors group-hover:bg-purple-100">
                <LayoutDashboard className="h-5 w-5 text-[#8A2BE2]" />
              </div>
              <span className="font-medium text-gray-700 group-hover:text-[#8A2BE2]">
                {translations.dashboard}
              </span>
            </NextLink>
          )}

          <button
            onClick={handleLogout}
            className="group flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm transition-colors hover:bg-red-50"
          >
            <div className="rounded-lg bg-gray-100 p-2 transition-colors group-hover:bg-red-100">
              <LogOut className="h-5 w-5 text-gray-500 group-hover:text-red-500" />
            </div>
            <span className="font-medium text-gray-700 group-hover:text-red-600">
              {translations.logout}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
