import { whmcsApi } from '@/lib/whmcs';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/actions/admin-auth';
import { AdminClientsClientWrapper } from '@/components/admin/AdminClientsClientWrapper';

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminClientsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/spike/login');

  // Fetch clients data directly without caching for real-time updates
  const [clientsResult] = await Promise.allSettled([
    whmcsApi('GetClients', {
      limitnum: 1000,
      orderby: 'id',
      order: 'asc',
    }),
  ]);

  let clients = [];
  if (clientsResult.status === 'fulfilled') {
    const clientData = clientsResult.value.clients?.client;
    if (clientData) {
      clients = Array.isArray(clientData) ? clientData : [clientData];
    }
  }

  // Calculate stats
  const activeClients = clients.filter(
    (c: any) => c.status?.toLowerCase() === 'active'
  ).length;
  const inactiveClients = clients.filter(
    (c: any) => c.status?.toLowerCase() === 'inactive'
  ).length;

  return (
    <AdminClientsClientWrapper
      admin={admin}
      clients={clients}
      activeClients={activeClients}
      inactiveClients={inactiveClients}
    />
  );
}
