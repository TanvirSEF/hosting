import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { EmailsClientWrapper } from '@/components/dashboard/EmailsClientWrapper';
import { getAllUserEmailAccountsAction, getUserEmailDomainsAction } from '@/actions/user-email-actions';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getEmailsData() {
  const cookieStore = cookies();
  const session = (await cookieStore).get('session')?.value;
  if (!session) return { user: null, emailAccounts: [], domains: [] };

  try {
    const { payload } = await jwtVerify(session, JWT_SECRET);
    const userId = payload.userId as string | number;
    const userEmail = payload.email as string;
    const userName = payload.name as string;

    // Fetch all email accounts for this user
    const emailResult = await getAllUserEmailAccountsAction();
    const emailAccounts = emailResult.success && emailResult.data ? emailResult.data : [];

    // Fetch available domains for creating new accounts
    const domainsResult = await getUserEmailDomainsAction();
    const domains = domainsResult.success && domainsResult.data ? domainsResult.data : [];

    return {
      user: {
        name: userName,
        email: userEmail,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=8C52FF&color=fff`,
        firstname: userName.split(' ')[0],
      },
      emailAccounts,
      domains,
    };
  } catch (error) {
    console.error('Emails Fetch Error:', error);
    return { user: null, emailAccounts: [], domains: [] };
  }
}

export default async function EmailsPage() {
  const { user, emailAccounts, domains } = await getEmailsData();

  // Calculate stats
  // @ts-ignore
  const activeAccounts = emailAccounts.filter(
    (acc: any) => acc.status?.toLowerCase() === 'active'
  ).length;

  // @ts-ignore
  const totalStorage = emailAccounts.reduce(
    (sum: number, acc: any) => sum + (parseFloat(acc.quota || 0) * 1024 * 1024), // Assuming quota is in MB, convert to bytes for display logic
    0
  );

  // @ts-ignore
  const totalQuota = emailAccounts.reduce(
    (sum: number, acc: any) => sum + (parseFloat(acc.quota || 0) * 1024 * 1024),
    0
  );

  return (
    <EmailsClientWrapper
      user={user}
      emailAccounts={emailAccounts}
      domains={domains}
      activeAccounts={activeAccounts}
      totalStorage={0} // Actual usage not yet tracked in DB, maybe update later
      totalQuota={totalQuota}
    />
  );
}
