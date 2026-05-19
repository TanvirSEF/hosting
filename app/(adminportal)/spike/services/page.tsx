import { whmcsApi } from '@/lib/whmcs';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/actions/admin-auth';
import { AdminServicesClientWrapper } from '@/components/admin/AdminServicesClientWrapper';

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminServicesPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/spike/login');

  // Fetch services data directly without caching for real-time updates
  const [servicesResult] = await Promise.allSettled([
    whmcsApi('GetClientsProducts', {
      limitnum: 1000,
    }),
  ]);

  let services = [];
  if (servicesResult.status === 'fulfilled') {
    const products = servicesResult.value.products?.product;
    if (products) {
      services = Array.isArray(products) ? products : [products];
    }
  }

  // Calculate stats
  const activeServices = services.filter(
    (s: any) => s.status?.toLowerCase() === 'active'
  ).length;
  const totalValue = services.reduce(
    (sum: number, s: any) => sum + parseFloat(s.recurringamount || 0),
    0
  );

  return (
    <AdminServicesClientWrapper
      admin={admin}
      services={services}
      activeServices={activeServices}
      totalValue={totalValue}
    />
  );
}
