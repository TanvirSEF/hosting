import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { whmcsApi } from '@/lib/whmcs';
import { DomainRegisterClientWrapper } from '@/components/dashboard/DomainRegisterClientWrapper';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getDomainRegisterData() {
  const cookieStore = cookies();
  const session = (await cookieStore).get('session')?.value;
  if (!session) return { user: null };

  try {
    const { payload } = await jwtVerify(session, JWT_SECRET);
    const userId = payload.userId as string | number;
    const userEmail = payload.email as string;
    const userName = payload.name as string;

    // Fetch client details from WHMCS
    const clientResult = await whmcsApi('GetClientsDetails', {
      clientid: userId,
      stats: false,
    });

    if (clientResult.result !== 'success' || !clientResult.client) {
      return { user: null };
    }

    return {
      user: {
        name: userName,
        email: userEmail,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=8C52FF&color=fff`,
        firstname: clientResult.client.firstname || userName.split(' ')[0],
      },
    };
  } catch (error) {
    console.error('Domain Register Fetch Error:', error);
    return { user: null };
  }
}

export default async function DomainRegisterPage() {
  const { user } = await getDomainRegisterData();

  if (!user) {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
    redirect(`/${locale}/login`);
  }

  return <DomainRegisterClientWrapper user={user} />;
}
