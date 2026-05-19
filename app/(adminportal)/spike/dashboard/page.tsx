import { whmcsApi } from '@/lib/whmcs';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/actions/admin-auth';
import { AdminDashboardClientWrapper } from '@/components/admin/AdminDashboardClientWrapper';

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/spike/login');

  // Fetch admin stats in parallel without caching for real-time updates
  const [clientsResult, servicesResult, domainsResult, invoicesResult] =
    await Promise.allSettled([
      whmcsApi('GetClients', { limitnum: 1, stats: true }),
      whmcsApi('GetClientsProducts', { limitnum: 1, stats: true }),
      whmcsApi('GetClientsDomains', { limitnum: 1, stats: true }),
      whmcsApi('GetInvoices', { limitnum: 1, status: 'Unpaid' }),
    ]);

  // Extract total counts from results
  const totalClients =
    clientsResult.status === 'fulfilled'
      ? clientsResult.value.totalresults || 0
      : 0;
  const totalServices =
    servicesResult.status === 'fulfilled'
      ? servicesResult.value.totalresults || 0
      : 0;
  const totalDomains =
    domainsResult.status === 'fulfilled'
      ? domainsResult.value.totalresults || 0
      : 0;
  const unpaidInvoices =
    invoicesResult.status === 'fulfilled'
      ? invoicesResult.value.totalresults || 0
      : 0;

  const data = {
    totalClients,
    totalServices,
    totalDomains,
    unpaidInvoices,
  };

  return <AdminDashboardClientWrapper admin={admin} data={data} />;
}
