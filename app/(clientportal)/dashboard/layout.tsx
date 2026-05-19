import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { CartProvider } from '@/contexts/CartContext';
import { Toaster } from '@/components/ui/sonner';
import DomainCartSidebar from '@/components/home/DomainCartSidebar';

export const metadata: Metadata = {
  title: "Client Dashboard - WebblyHosting",
  description: "Manage your hosting services and domains",
  icons: {
    icon: '/images/favicon.ico',
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check session (Middleware already protects this, but extra safety)
  const cookieStore = await cookies();
  const session = cookieStore.get('session');
  if (!session) {
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
    redirect(`/${locale}/login`);
  }

  return (
    <CurrencyProvider>
      <CartProvider>
        {children}
        <DomainCartSidebar />
        <Toaster position="top-right" />
      </CartProvider>
    </CurrencyProvider>
  );
}
