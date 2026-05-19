import { whmcsApi } from '@/lib/whmcs';
import { unstable_cache } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/actions/admin-auth';
import { AdminSupportClientWrapper } from '@/components/admin/AdminSupportClientWrapper';

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Cached function to fetch all tickets data (reduced cache time for real-time updates)
const getCachedTicketsData = unstable_cache(
  async () => {
    const [ticketsResult] = await Promise.allSettled([
      whmcsApi('GetTickets', {
        limitnum: 1000,
        ignore_dept_assignments: true,
      }),
    ]);

    let tickets = [];
    if (ticketsResult.status === 'fulfilled') {
      const ticketData = ticketsResult.value.tickets?.ticket;
      if (ticketData) {
        tickets = Array.isArray(ticketData) ? ticketData : [ticketData];
      }
    }

    return { tickets };
  },
  ['admin-tickets-data'],
  {
    revalidate: 10, // Reduced to 10 seconds for faster updates
    tags: ['admin-tickets'],
  }
);

export default async function AdminSupportPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/spike/login');

  const { tickets } = await getCachedTicketsData();

  // Calculate stats
  const openTickets = tickets.filter((t: any) =>
    ['open', 'customer-reply'].includes(t.status?.toLowerCase())
  ).length;
  const answeredTickets = tickets.filter(
    (t: any) => t.status?.toLowerCase() === 'answered'
  ).length;
  const closedTickets = tickets.filter(
    (t: any) => t.status?.toLowerCase() === 'closed'
  ).length;

  return (
    <AdminSupportClientWrapper
      admin={admin}
      tickets={tickets}
      openTickets={openTickets}
      answeredTickets={answeredTickets}
      closedTickets={closedTickets}
    />
  );
}
