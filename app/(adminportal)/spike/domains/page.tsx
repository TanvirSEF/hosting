import { whmcsApi } from '@/lib/whmcs';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/actions/admin-auth';
import { AdminDomainsClientWrapper } from '@/components/admin/AdminDomainsClientWrapper';

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDomainsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/spike/login');

  // Fetch domains data directly without caching for real-time updates
  const [domainsResult] = await Promise.allSettled([
    whmcsApi('GetClientsDomains', {
      limitnum: 1000,
    }),
  ]);

  let domains = [];
  if (domainsResult.status === 'fulfilled') {
    const domainData = domainsResult.value.domains?.domain;
    if (domainData) {
      domains = Array.isArray(domainData) ? domainData : [domainData];
    }
  }

  // Calculate stats
  const activeDomains = domains.filter(
    (d: any) => d.status?.toLowerCase() === 'active'
  ).length;
  const autoRenewEnabled = domains.filter(
    (d: any) => d.donotrenew === 0 || d.donotrenew === '0'
  ).length;

  return (
    <AdminDomainsClientWrapper
      admin={admin}
      domains={domains}
      activeDomains={activeDomains}
      autoRenewEnabled={autoRenewEnabled}
    />
  );
}
