import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Toaster } from '@/components/ui/sonner';
import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import CookieConsent from '@/components/CookieConsent';
import PromoBanner from '@/components/PromoBanner';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { CartProvider } from '@/contexts/CartContext';
import DomainCartSidebar from '@/components/home/DomainCartSidebar';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('title'),
    description: t('description'),
    icons: {
      icon: 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/favicon.ico',
    },
  };
}

// Script to set lang and dir attributes on the html element
function LocaleScript({ locale }: { locale: string }) {
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.lang="${locale}";document.documentElement.dir="${dir}";`,
      }}
    />
  );
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider messages={messages}>
      <CurrencyProvider>
        <CartProvider>
          <LocaleScript locale={locale} />
          <PromoBanner />
          <Navbar />
          {children}
          <Footer />
          <Toaster position="top-right" />
          <CookieConsent />
          <DomainCartSidebar />
        </CartProvider>
      </CurrencyProvider>
    </NextIntlClientProvider>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
