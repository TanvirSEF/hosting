import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { whmcsApi } from '@/lib/whmcs';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Cached function to fetch WHMCS stats (60 second cache)
const getCachedStats = unstable_cache(
  async (userId: string | number) => {
    const [servicesResult, domainsResult, invoicesResult] =
      await Promise.allSettled([
        whmcsApi('GetClientsProducts', { clientid: userId, limitnum: 1 }),
        whmcsApi('GetClientsDomains', { clientid: userId, limitnum: 1 }),
        whmcsApi('GetInvoices', {
          userid: userId,
          status: 'Unpaid',
          limitnum: 1,
        }),
      ]);

    const serviceCount =
      servicesResult.status === 'fulfilled'
        ? servicesResult.value.totalresults || 0
        : 0;

    const domainCount =
      domainsResult.status === 'fulfilled'
        ? domainsResult.value.totalresults || 0
        : 0;

    const unpaidInvoices =
      invoicesResult.status === 'fulfilled'
        ? invoicesResult.value.totalresults || 0
        : 0;

    return {
      serviceCount,
      domainCount,
      unpaidInvoices,
    };
  },
  ['dashboard-stats'],
  {
    revalidate: 60,
    tags: ['dashboard-stats'],
  }
);

export async function GET() {
  try {
    const cookieStore = cookies();
    const session = (await cookieStore).get('session')?.value;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(session, JWT_SECRET);
    const userId = payload.userId as string | number;

    const stats = await getCachedStats(userId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
