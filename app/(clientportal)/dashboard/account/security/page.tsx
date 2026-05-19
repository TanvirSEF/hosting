import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SecurityClientWrapper } from '@/components/dashboard/SecurityClientWrapper';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getSecurityData() {
  const cookieStore = cookies();
  const session = (await cookieStore).get('session')?.value;
  if (!session) return { user: null };

  try {
    const { payload } = await jwtVerify(session, JWT_SECRET);
    const userEmail = payload.email as string;
    const userName = payload.name as string;

    return {
      user: {
        name: userName,
        email: userEmail,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=8C52FF&color=fff`,
        firstname: userName.split(' ')[0],
      },
    };
  } catch (error) {
    console.error('Security Fetch Error:', error);
    return { user: null };
  }
}

export default async function SecurityPage() {
  const { user } = await getSecurityData();

  if (!user) {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
    redirect(`/${locale}/login`);
  }

  return <SecurityClientWrapper user={user} />;
}
