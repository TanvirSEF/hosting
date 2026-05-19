import type { Metadata } from 'next';
import { CurrencyProvider } from '@/contexts/CurrencyContext';

export const metadata: Metadata = {
  title: "Admin Dashboard - WebblyHosting",
  description: "Manage clients, services, and billing",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CurrencyProvider>
      {children}
    </CurrencyProvider>
  );
}

