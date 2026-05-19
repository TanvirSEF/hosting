import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { whmcsApi } from '@/lib/whmcs';
import { AccountClientWrapper } from '@/components/dashboard/AccountClientWrapper';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getAccountData() {
  const cookieStore = cookies();
  const session = (await cookieStore).get('session')?.value;
  if (!session) return { user: null, accountData: null };

  try {
    const { payload } = await jwtVerify(session, JWT_SECRET);
    const userId = payload.userId as string | number;
    const userEmail = payload.email as string;
    const userName = payload.name as string;

    // Fetch account details from WHMCS
    const accountResult = await whmcsApi('GetClientsDetails', {
      clientid: userId,
      stats: false,
    });

    if (accountResult.result !== 'success' || !accountResult.client) {
      return { user: null, accountData: null };
    }

    return {
      user: {
        name: userName,
        email: userEmail,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=8C52FF&color=fff`,
        firstname: userName.split(' ')[0],
      },
      accountData: accountResult.client,
    };
  } catch (error) {
    console.error('Account Fetch Error:', error);
    return { user: null, accountData: null };
  }
}

export default async function AccountPage() {
  const { user, accountData } = await getAccountData();

  if (!user) {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
    redirect(`/${locale}/login`);
  }

  return <AccountClientWrapper user={user} accountData={accountData} />;
}
