import { whmcsApi } from '@/lib/whmcs';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { SupportClientWrapper } from '@/components/dashboard/SupportClientWrapper';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Cached function to fetch all support data (reduced cache time for real-time updates)
const getCachedSupportData = unstable_cache(
  async (userId: string | number, userEmail: string) => {
    // Fetch user details and tickets in parallel
    const [clientResult, ticketsResult] = await Promise.allSettled([
      whmcsApi('GetClientsDetails', { clientid: userId }),
      whmcsApi('GetTickets', {
        clientid: userId,
        limitnum: 1000,
        ignore_dept_assignments: true,
      }),
    ]);

    const clientData =
      clientResult.status === 'fulfilled' ? clientResult.value : null;

    // Handle tickets data
    let tickets = [];
    if (ticketsResult.status === 'fulfilled') {
      const ticketData = ticketsResult.value.tickets?.ticket;
      if (ticketData) {
        tickets = Array.isArray(ticketData) ? ticketData : [ticketData];
      }
    }

    return {
      user: clientData
        ? {
            name:
              clientData.client.firstname + ' ' + clientData.client.lastname,
            email: userEmail,
            avatar:
              'https://ui-avatars.com/api/?name=User&background=8C52FF&color=fff',
            firstname: clientData.client.firstname,
          }
        : null,
      tickets,
    };
  },
  ['support-page-data'],
  {
    revalidate: 10, // Reduced to 10 seconds for faster updates
    tags: ['support'],
  }
);

async function getSupportData() {
  const cookieStore = cookies();
  const session = (await cookieStore).get('session')?.value;
  if (!session) return { user: null, tickets: [] };

  try {
    const { payload } = await jwtVerify(session, JWT_SECRET);
    const userId = payload.userId as string | number;
    const userEmail = payload.email as string;

    // Get cached data
    return await getCachedSupportData(userId, userEmail);
  } catch (error: any) {
    return { user: null, tickets: [] };
  }
}

export default async function SupportPage() {
  const { user, tickets } = await getSupportData();

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
    <SupportClientWrapper
      user={user}
      tickets={tickets}
      openTickets={openTickets}
      answeredTickets={answeredTickets}
      closedTickets={closedTickets}
    />
  );
}
