'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Ticket,
  FileText,
  Server,
  Globe,
  AlertCircle,
  CheckCircle,
  Clock,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  getClientNotificationStats,
  getAdminNotificationStats,
} from '@/actions/notification-actions';
import {
  markAsReadAction,
  markAllAsReadAction
} from '@/actions/notification-read-actions';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'ticket' | 'invoice' | 'service' | 'domain' | 'email' | 'system';
  title: string;
  message: string;
  link: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read?: boolean;
}

interface NotificationBellProps {
  mode: 'client' | 'admin';
  t: (key: string, params?: Record<string, string | number>) => string;
}

// Get icon for notification type
const getNotificationIcon = (type: Notification['type'], priority: Notification['priority']) => {
  const iconClass = `h-4 w-4 ${priority === 'urgent' ? 'text-red-500' :
      priority === 'high' ? 'text-orange-500' :
        priority === 'medium' ? 'text-blue-500' :
          'text-gray-500'
    }`;

  switch (type) {
    case 'ticket':
      return <Ticket className={iconClass} />;
    case 'invoice':
      return <FileText className={iconClass} />;
    case 'service':
      return <Server className={iconClass} />;
    case 'domain':
      return <Globe className={iconClass} />;
    case 'system':
      return <AlertCircle className={iconClass} />;
    default:
      return <Bell className={iconClass} />;
  }
};

// Get badge variant for priority
const getPriorityBadge = (priority: Notification['priority'], t: NotificationBellProps['t']) => {
  const label = t(`support.priority.${priority}`);

  switch (priority) {
    case 'urgent':
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{label}</Badge>;
    case 'high':
      return <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-orange-500">{label}</Badge>;
    case 'medium':
      return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{label}</Badge>;
    default:
      return null;
  }
};

export function NotificationBell({
  mode,
  t,
}: NotificationBellProps) {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const result =
        mode === 'client'
          ? await getClientNotificationStats()
          : await getAdminNotificationStats();

      setCount(result.count);
      setNotifications(result.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setCount(0);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [mode]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      try {
        await markAsReadAction(notification.id, mode);
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
        setCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Navigate to the link
    router.push(notification.link);
  };

  const handleMarkAllAsRead = async () => {
    try {
      setIsMarkingAllAsRead(true);
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

      if (unreadIds.length === 0) {
        toast.info(t('header.allCaughtUp'));
        return;
      }

      const result = await markAllAsReadAction(unreadIds, mode);

      if (result.success) {
        // Update local state
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setCount(0);
        toast.success(t('header.allCaughtUp'));
      } else {
        toast.error(result.error || 'Failed to mark all as read');
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('An error occurred');
    } finally {
      setIsMarkingAllAsRead(false);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return t('header.recently');
    }
  };

  const hasUnreadNotifications = notifications.some((n) => !n.read);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:text-[#8A2BE2]"
          aria-label={t('header.notifications')}
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <>
              <span className="border-background absolute top-0 right-0 h-2.5 w-2.5 animate-pulse rounded-full border-2 bg-red-600" />
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {count > 99 ? '99+' : count}
              </span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[600px] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="text-base font-semibold">{t('header.notifications')}</span>
          {count > 0 && (
            <Badge variant="destructive" className="text-xs">
              {count} {t('header.notificationsNew')}
            </Badge>
          )}
        </DropdownMenuLabel>

        {hasUnreadNotifications && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAllAsRead}
                className="w-full justify-start text-xs h-8"
              >
                <CheckCheck className="mr-2 h-3.5 w-3.5" />
                {isMarkingAllAsRead ? t('header.markingAsRead') : t('header.markAllAsRead')}
              </Button>
            </div>
          </>
        )}

        <DropdownMenuSeparator />

        {isLoading && notifications.length === 0 ? (
          <div className="text-muted-foreground p-8 text-center text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            {t('header.loadingNotifications')}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-muted-foreground p-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">{t('header.allCaughtUp')}</p>
            <p className="text-xs mt-1">{t('header.noNotifications')}</p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`cursor-pointer p-3 focus:bg-accent/50 ${notification.read ? 'opacity-60' : ''
                  }`}
              >
                <div className="flex gap-3 w-full">
                  <div className="shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type, notification.priority)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={`text-sm font-semibold text-foreground line-clamp-1 ${!notification.read ? 'font-bold' : ''
                          }`}>
                          {t(notification.title)}
                        </span>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                      </div>
                      {getPriorityBadge(notification.priority, t)}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimestamp(notification.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}

            {notifications.length > 0 && !hasUnreadNotifications && (
              <>
                <DropdownMenuSeparator />
                <div className="text-center p-2">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {t('header.allCaughtUp')}
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
