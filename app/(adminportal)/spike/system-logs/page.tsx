import { whmcsApi } from '@/lib/whmcs';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/actions/admin-auth';
import { SystemLogsClientWrapper } from '@/components/admin/SystemLogsClientWrapper';

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SystemLogsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/spike/login');

  let logs: any[] = [];

  let apiError: string | null = null;

  try {
    const response = await whmcsApi('GetActivityLog', { limitnum: 50 });

    if (response.result === 'success') {
      if (response.activity?.entry) {
        const entries = response.activity.entry;
        // Ensure it's an array (WHMCS XML-to-JSON quirks sometimes return single object)
        logs = Array.isArray(entries) ? entries : [entries];
      }
    } else {
      // Capture API-level errors
      console.error('WHMCS GetActivityLog error:', response.message);
      if (response.message?.includes('Invalid Permissions')) {
        apiError = `Permission Error: ${response.message}`;
      } else {
        apiError = response.message || 'Failed to fetch logs';
      }
    }
  } catch (error: any) {
    console.error('Failed to fetch system logs:', error);
    apiError = error.message || 'Unknown error occurred';

    if (error.message?.includes('Invalid Permissions')) {
      apiError =
        "WHMCS API Permission Error: Enable 'GetActivityLog' permission.";
    }
  }

  return (
    <SystemLogsClientWrapper admin={admin} logs={logs} apiError={apiError} />
  );
}
