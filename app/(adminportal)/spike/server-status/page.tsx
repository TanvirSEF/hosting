import { whmcsApi } from '@/lib/whmcs';
import axios from 'axios';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/actions/admin-auth';
import { ServerStatusClientWrapper } from '@/components/admin/ServerStatusClientWrapper';

// Force dynamic rendering for real-time status
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ServerStatusPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/spike/login');

  let servers: any[] = [];
  let health: any = null;

  let apiError: string | null = null;

  try {
    const [serversRes, healthRes] = await Promise.allSettled([
      whmcsApi('GetServers', { fetchStatus: true }),
      whmcsApi('GetHealthStatus'),
    ]);

    // Handle Servers
    if (serversRes.status === 'fulfilled') {
      if (
        serversRes.value.result === 'success' &&
        serversRes.value.servers?.server
      ) {
        const serverData = serversRes.value.servers.server;
        servers = Array.isArray(serverData) ? serverData : [serverData];
      } else if (serversRes.value.message) {
        // Capture API level errors like "Invalid Permissions"
        if (serversRes.value.message.includes('Invalid Permissions')) {
          apiError = `WHMCS API Permission Error: ${serversRes.value.message}`;
        }
        console.error(
          'WHMCS GetServers returned error:',
          serversRes.value.message
        );
      }
    } else {
      // Network or other errors
      console.error('Servers fetch failed:', serversRes.reason);
      if (
        axios.isAxiosError(serversRes.reason) &&
        serversRes.reason.response?.status === 403
      ) {
        apiError =
          'Access Denied (403): Check your IP whitelisting in WHMCS automation settings.';
      } else if (
        serversRes.reason?.toString().includes('Invalid Permissions')
      ) {
        apiError =
          'WHMCS API Permission Error: Check your API credentials permissions.';
      }
    }

    // Handle Health
    if (healthRes.status === 'fulfilled') {
      if (healthRes.value.result === 'success') {
        health = {
          status: 'success',
          msg: healthRes.value.msg || 'System is healthy',
          checks: healthRes.value.checks,
        };
      } else {
        console.error('WHMCS GetHealthStatus error:', healthRes.value.message);
      }
    }
  } catch (error: any) {
    console.error('Failed to fetch server status:', error);
    apiError =
      error.message || 'Unknown error occurred while fetching server status.';
  }

  return (
    <ServerStatusClientWrapper
      admin={admin}
      servers={servers}
      health={health}
      apiError={apiError}
    />
  );
}
