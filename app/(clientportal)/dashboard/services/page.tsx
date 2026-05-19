import { whmcsApi } from '@/lib/whmcs';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { ServicesClientWrapper } from '@/components/dashboard/ServicesClientWrapper';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Cached function to fetch all services data (reduced cache time for real-time updates)
const getCachedServicesData = unstable_cache(
  async (userId: string | number, userEmail: string) => {
    // Fetch user details and services in parallel
    const [clientResult, servicesResult] = await Promise.allSettled([
      whmcsApi('GetClientsDetails', { clientid: userId }),
      whmcsApi('GetClientsProducts', {
        clientid: userId,
        limitnum: 1000,
      }),
    ]);

    const clientData =
      clientResult.status === 'fulfilled' ? clientResult.value : null;

    // Handle services data
    let services = [];
    if (servicesResult.status === 'fulfilled') {
      const products = servicesResult.value.products?.product;
      if (products) {
        services = Array.isArray(products) ? products : [products];
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
      services,
    };
  },
  ['services-page-data'],
  {
    revalidate: 10,
    tags: ['services'],
  }
);

async function getServicesData() {
  const cookieStore = cookies();
  const session = (await cookieStore).get('session')?.value;
  if (!session) return { user: null, services: [] };

  try {
    const { payload } = await jwtVerify(session, JWT_SECRET);
    const userId = payload.userId as string | number;
    const userEmail = payload.email as string;

    // Get cached data
    return await getCachedServicesData(userId, userEmail);
  } catch (error) {
    console.error('Services Fetch Error:', error);
    return { user: null, services: [] };
  }
}

// Helper function to check if service is expiring soon
function isExpiringSoon(nextDueDate: string): boolean {
  const dueDate = new Date(nextDueDate);
  const today = new Date();
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 7 && diffDays >= 0;
}

export default async function ServicesPage() {
  const { user, services } = await getServicesData();

  // Fetch installed WordPress instances to determine button states
  let wpDomains: string[] = [];
  try {
    const { pleskApi } = await import('@/lib/plesk');
    const instances = await pleskApi.getInstances();
    // Normalize domains to lowercase for comparison
    wpDomains = instances.map((i) => i.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase());
  } catch (error) {
    console.error('Failed to fetch WP instances:', error);
    // Continue without WP data (buttons might default to enabled or disabled based on UI logic)
  }

  // Calculate stats
  const activeServices = services.filter(
    (s: any) => s.status?.toLowerCase() === 'active'
  ).length;
  const totalValue = services.reduce(
    (sum: number, s: any) => sum + parseFloat(s.recurringamount || 0),
    0,
  );
  const expiringSoon = services.filter((s: any) =>
    isExpiringSoon(s.nextduedate)
  ).length;

  return (
    <ServicesClientWrapper
      user={user}
      services={services}
      activeServices={activeServices}
      totalValue={totalValue}
      expiringSoon={expiringSoon}
      wpDomains={wpDomains}
    />
  );
}
