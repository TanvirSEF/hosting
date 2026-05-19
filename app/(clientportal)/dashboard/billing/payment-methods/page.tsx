import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { PaymentMethodsClientWrapper } from '@/components/dashboard/PaymentMethodsClientWrapper';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getUserData() {
  const cookieStore = cookies();
  const session = (await cookieStore).get('session')?.value;
  if (!session) return null;

  try {
    const { payload } = await jwtVerify(session, JWT_SECRET);
    const userName = payload.name as string;

    return {
      name: userName,
      email: payload.email as string,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=8C52FF&color=fff`,
      firstname: userName.split(' ')[0],
    };
  } catch (error) {
    console.error('User Fetch Error:', error);
    return null;
  }
}

export default async function PaymentMethodsPage() {
  const user = await getUserData();

  return <PaymentMethodsClientWrapper user={user} />;
}
