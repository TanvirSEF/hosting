import { whmcsApi } from '@/lib/whmcs';
import { getPromotionalProducts } from '@/lib/whmcs-promotions';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { DashboardClientWrapper } from '@/components/dashboard/DashboardClientWrapper';
import { getEmailAccountsCollection } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Cached function to fetch WHMCS data (reduced cache time for real-time updates)
const getCachedWHMCSData = unstable_cache(
  async (userId: string | number) => {
    // Fetch all data in parallel for better performance
    const [clientResult, servicesResult, domainsResult, invoicesResult] =
      await Promise.allSettled([
        whmcsApi('GetClientsDetails', { clientid: userId, stats: true }),
        whmcsApi('GetClientsProducts', { clientid: userId, limitnum: 25 }),
        whmcsApi('GetClientsDomains', { clientid: userId, limitnum: 1 }),
        whmcsApi('GetInvoices', {
          userid: userId,
          status: 'Unpaid',
          limitnum: 1,
        }),
      ]);

    // Handle client data (required)
    if (clientResult.status === 'rejected') {
      console.error('Failed to fetch client details:', clientResult.reason);
      throw new Error('Failed to fetch client details');
    }
    const clientData = clientResult.value;

    // Handle products data
    let activeServices: any[] = [];
    let serviceCount = 0;
    if (servicesResult.status === 'fulfilled') {
      serviceCount = servicesResult.value.totalresults || 0;
      const productData = servicesResult.value.products?.product;
      if (productData) {
        const products = Array.isArray(productData) ? productData : [productData];
        activeServices = products
          .filter((p: any) => p.status?.toLowerCase() === 'active' && p.domain)
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            domain: p.domain,
            status: p.status,
            groupname: p.groupname,
            regdate: p.regdate,
            nextduedate: p.nextduedate,
          }));
      }
    }

    const domainCount =
      domainsResult.status === 'fulfilled'
        ? domainsResult.value.totalresults || 0
        : 0;

    const unpaidInvoices =
      invoicesResult.status === 'fulfilled'
        ? invoicesResult.value.totalresults || 0
        : 0;

    return {
      clientData,
      serviceCount,
      activeServices,
      domainCount,
      unpaidInvoices,
    };
  },
  ['dashboard-data'],
  {
    revalidate: 10,
    tags: ['dashboard', 'dashboard-stats'],
  }
);

// Fetch data on the server
async function getDashboardData() {
  const cookieStore = cookies();
  const session = (await cookieStore).get('session')?.value;

  if (!session) return null;

  try {
    // 1. Decrypt Token to get User ID
    const { payload } = await jwtVerify(session, JWT_SECRET);
    const userId = payload.userId as string | number;
    const userEmail = payload.email as string;

    // 2. Get cached data
    const data = await getCachedWHMCSData(userId);

    // 3. Fetch promotions (Dynamic, not cached with user data to allow translation context)
    const currency = data.clientData.client?.currency_code || 'EUR';
    const promotions = await getPromotionalProducts(currency);

    // 4. Check if user should see the free email banner
    let showEmailBanner = false;
    if (data.activeServices.length > 0) {
      try {
        const serviceIds = data.activeServices.map((s: any) => Number(s.id));
        const emailAccountsCollection = await getEmailAccountsCollection();
        const emailCount = await emailAccountsCollection.countDocuments({
          whmcsServiceId: { $in: serviceIds },
          status: { $ne: 'Terminated' },
        });
        showEmailBanner = emailCount === 0;
      } catch (e) {
        console.warn('Failed to check email banner eligibility:', e);
      }
    }

    return {
      user: {
        name:
          data.clientData.client.firstname +
          ' ' +
          data.clientData.client.lastname,
        email: userEmail,
        avatar:
          'https://ui-avatars.com/api/?name=User&background=8C52FF&color=fff',
        firstname: data.clientData.client.firstname,
      },
      stats: data.clientData.stats,
      serviceCount: data.serviceCount,
      activeServices: data.activeServices,
      domainCount: data.domainCount,
      unpaidInvoices: data.unpaidInvoices,
      promotions,
      showEmailBanner,
    };
  } catch (error: any) {
    console.error('Dashboard Fetch Error:', error);

    if (
      error.message?.includes('Client Not Found') ||
      error.message?.includes('Failed to fetch client details')
    ) {
      const resolvedCookieStore = await cookieStore;
      const locale = resolvedCookieStore.get('NEXT_LOCALE')?.value || 'en';
      resolvedCookieStore.delete('session');
      redirect(`/${locale}/login`);
    }

    return null;
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return <DashboardClientWrapper data={data} />;
}
