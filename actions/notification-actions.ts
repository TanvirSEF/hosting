'use server';

import { whmcsApi } from '@/lib/whmcs';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getReadNotificationIds } from '@/lib/notification-store';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function getUserId() {
  const cookieStore = cookies();
  const session = (await cookieStore).get('session')?.value;
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, JWT_SECRET);
    return payload.userId as string | number;
  } catch {
    return null;
  }
}

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

/**
 * Get all notifications for client dashboard
 */
export async function getClientNotificationStats() {
  try {
    const userId = await getUserId();
    if (!userId) return { count: 0, notifications: [] };

    const notifications: Notification[] = [];

    // 1. Support Ticket Notifications (Admin Replied)
    try {
      const ticketRes = await whmcsApi('GetTickets', {
        clientid: userId,
        status: 'Answered',
        limitnum: 10,
      });

      if (ticketRes.result === 'success' && ticketRes.tickets?.ticket) {
        const tickets = Array.isArray(ticketRes.tickets.ticket)
          ? ticketRes.tickets.ticket
          : [ticketRes.tickets.ticket];

        tickets.forEach((ticket: any) => {
          notifications.push({
            id: `ticket-${ticket.tid || ticket.id}`,
            type: 'ticket',
            title: 'header.notificationAdminReplied',
            message: `#${ticket.tid} - ${ticket.subject}`,
            link: '/dashboard/support',
            timestamp: ticket.lastreply ? new Date(ticket.lastreply) : new Date(),
            priority: 'high',
          });
        });
      }
    } catch (error) {
      console.error('Ticket notification error:', error);
    }

    // 2. Unpaid Invoice Notifications
    try {
      const invoiceRes = await whmcsApi('GetInvoices', {
        userid: userId,
        status: 'Unpaid',
        limitnum: 5,
      });

      if (invoiceRes.result === 'success' && invoiceRes.invoices?.invoice) {
        const invoices = Array.isArray(invoiceRes.invoices.invoice)
          ? invoiceRes.invoices.invoice
          : [invoiceRes.invoices.invoice];

        invoices.forEach((invoice: any) => {
          const dueDate = new Date(invoice.duedate);
          const today = new Date();
          const isOverdue = dueDate < today;

          notifications.push({
            id: `invoice-${invoice.id}`,
            type: 'invoice',
            title: isOverdue ? 'header.notificationInvoiceOverdue' : 'header.notificationInvoiceUnpaid',
            message: `Invoice #${invoice.invoicenum} - ${invoice.total} ${invoice.currencycode}`,
            link: `/dashboard/billing?pay_invoice=${invoice.id}`,
            timestamp: new Date(invoice.duedate),
            priority: isOverdue ? 'urgent' : 'high',
          });
        });
      }
    } catch (error) {
      console.error('Invoice notification error:', error);
    }

    // 3. Expiring Domain Notifications
    try {
      const domainRes = await whmcsApi('GetClientsDomains', {
        clientid: userId,
        limitnum: 20,
      });

      if (domainRes.result === 'success' && domainRes.domains?.domain) {
        const domains = Array.isArray(domainRes.domains.domain)
          ? domainRes.domains.domain
          : [domainRes.domains.domain];

        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

        domains.forEach((domain: any) => {
          const expiryDate = new Date(domain.nextduedate || domain.expirydate);

          if (expiryDate <= thirtyDaysFromNow && expiryDate > today) {
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            notifications.push({
              id: `domain-${domain.id}`,
              type: 'domain',
              title: 'header.notificationDomainExpiring',
              message: `${domain.domain} expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`,
              link: '/dashboard/domains',
              timestamp: expiryDate,
              priority: daysUntilExpiry <= 7 ? 'urgent' : daysUntilExpiry <= 14 ? 'high' : 'medium',
            });
          }
        });
      }
    } catch (error) {
      console.error('Domain notification error:', error);
    }

    // 4. Service Renewal Notifications
    try {
      const serviceRes = await whmcsApi('GetClientsProducts', {
        clientid: userId,
        limitnum: 20,
      });

      if (serviceRes.result === 'success' && serviceRes.products?.product) {
        const products = Array.isArray(serviceRes.products.product)
          ? serviceRes.products.product
          : [serviceRes.products.product];

        const today = new Date();
        const fourteenDaysFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

        products.forEach((product: any) => {
          const nextDueDate = new Date(product.nextduedate);
          const status = String(product.domainstatus || product.status || '').toLowerCase();

          // Service renewals due within 14 days
          if (status === 'active' && nextDueDate <= fourteenDaysFromNow && nextDueDate > today) {
            const daysUntilRenewal = Math.ceil((nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            notifications.push({
              id: `service-${product.id}`,
              type: 'service',
              title: 'header.notificationServiceRenewal',
              message: `${product.name || product.productname} renews in ${daysUntilRenewal} day${daysUntilRenewal !== 1 ? 's' : ''}`,
              link: '/dashboard/services',
              timestamp: nextDueDate,
              priority: daysUntilRenewal <= 3 ? 'urgent' : daysUntilRenewal <= 7 ? 'high' : 'medium',
            });
          }

          // Suspended services
          if (status === 'suspended') {
            notifications.push({
              id: `service-suspended-${product.id}`,
              type: 'service',
              title: 'header.notificationServiceSuspended',
              message: `${product.name || product.productname} has been suspended`,
              link: '/dashboard/services',
              timestamp: new Date(),
              priority: 'urgent',
            });
          }
        });
      }
    } catch (error) {
      console.error('Service notification error:', error);
    }

    // Sort notifications by priority and timestamp
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    notifications.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    // Get read notification IDs
    const readIds = await getReadNotificationIds(userId, 'client');
    const readIdsSet = new Set(readIds);

    // Mark notifications as read/unread
    const notificationsWithReadStatus = notifications.map((notif) => ({
      ...notif,
      read: readIdsSet.has(notif.id),
    }));

    // Count only unread notifications
    const unreadCount = notificationsWithReadStatus.filter((n) => !n.read).length;

    return {
      count: unreadCount,
      notifications: notificationsWithReadStatus.slice(0, 10),
    };
  } catch (error) {
    console.error('Client notification error:', error);
    return { count: 0, notifications: [] };
  }
}

/**
 * Get Notification Stats for Admin
 */
export async function getAdminNotificationStats() {
  try {
    const cookieStore = cookies();
    const isAdmin = (await cookieStore).get('admin_session')?.value;
    if (!isAdmin) return { count: 0, notifications: [] };

    const notifications: Notification[] = [];

    // 1. Open Tickets
    try {
      const openRes = await whmcsApi('GetTickets', {
        status: 'Open',
        limitnum: 10,
        ignore_dept: true,
      });

      if (openRes.result === 'success' && openRes.tickets?.ticket) {
        const tickets = Array.isArray(openRes.tickets.ticket)
          ? openRes.tickets.ticket
          : [openRes.tickets.ticket];

        tickets.forEach((ticket: any) => {
          notifications.push({
            id: `ticket-open-${ticket.tid || ticket.id}`,
            type: 'ticket',
            title: 'header.notificationNewTicket',
            message: `#${ticket.tid} - ${ticket.subject} (${ticket.name || ticket.email})`,
            link: '/spike/support',
            timestamp: ticket.lastreply ? new Date(ticket.lastreply) : new Date(),
            priority: 'high',
          });
        });
      }
    } catch (error) {
      console.error('Open ticket error:', error);
    }

    // 2. Customer Replied Tickets
    try {
      const replyRes = await whmcsApi('GetTickets', {
        status: 'Customer-Reply',
        limitnum: 10,
        ignore_dept: true,
      });

      if (replyRes.result === 'success' && replyRes.tickets?.ticket) {
        const tickets = Array.isArray(replyRes.tickets.ticket)
          ? replyRes.tickets.ticket
          : [replyRes.tickets.ticket];

        tickets.forEach((ticket: any) => {
          notifications.push({
            id: `ticket-reply-${ticket.tid || ticket.id}`,
            type: 'ticket',
            title: 'header.notificationClientReplied',
            message: `#${ticket.tid} - ${ticket.subject} (${ticket.name || ticket.email})`,
            link: '/spike/support',
            timestamp: ticket.lastreply ? new Date(ticket.lastreply) : new Date(),
            priority: 'high',
          });
        });
      }
    } catch (error) {
      console.error('Reply ticket error:', error);
    }

    // 3. Recent Orders (Last 24 hours)
    try {
      const ordersRes = await whmcsApi('GetOrders', {
        limitnum: 10,
      });

      if (ordersRes.result === 'success' && ordersRes.orders?.order) {
        const orders = Array.isArray(ordersRes.orders.order)
          ? ordersRes.orders.order
          : [ordersRes.orders.order];

        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

        orders.forEach((order: any) => {
          const orderDate = new Date(order.date);
          if (orderDate >= yesterday) {
            notifications.push({
              id: `order-${order.id}`,
              type: 'system',
              title: 'header.notificationNewOrder',
              message: `Order #${order.id} - ${order.amount} ${order.currencycode} (${order.status})`,
              link: '/spike/orders',
              timestamp: orderDate,
              priority: 'medium',
            });
          }
        });
      }
    } catch (error) {
      console.error('Orders notification error:', error);
    }

    // Sort by timestamp (newest first)
    notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Get userId for admin (we need to track per admin user)
    const userId = await getUserId();
    if (!userId) {
      return { count: 0, notifications: [] };
    }

    // Get read notification IDs
    const readIds = await getReadNotificationIds(userId, 'admin');
    const readIdsSet = new Set(readIds);

    // Mark notifications as read/unread
    const notificationsWithReadStatus = notifications.map((notif) => ({
      ...notif,
      read: readIdsSet.has(notif.id),
    }));

    // Count only unread notifications
    const unreadCount = notificationsWithReadStatus.filter((n) => !n.read).length;

    return {
      count: unreadCount,
      notifications: notificationsWithReadStatus.slice(0, 15),
    };
  } catch (error) {
    console.error('Admin notification error:', error);
    return { count: 0, notifications: [] };
  }
}
