import { LegalPageLayout } from '@/components/legal';
import { getLegalPage } from '@/lib/legal-pages';
import { notFound } from 'next/navigation';

interface CookiePolicyPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function CookiePolicyPage({ params }: CookiePolicyPageProps) {
  const { locale } = await params;
  const pageData = await getLegalPage('cookie-policy', locale);

  if (!pageData) {
    notFound();
  }

  const sidebarLinks = [
    {
      title: pageData.links.privacyPolicy,
      href: `/${locale}/legal/privacy-policy`,
      active: false,
    },
    {
      title: pageData.links.termsOfService,
      href: `/${locale}/legal/terms-of-service`,
      active: false,
    },
    {
      title: pageData.links.cookiePolicy,
      href: `/${locale}/legal/cookie-policy`,
      active: true,
    },
  ];

  return (
    <LegalPageLayout
      title={pageData.title}
      lastUpdated={pageData.pageLastUpdated}
      introduction={pageData.introduction}
      sections={pageData.sections}
      breadcrumb={pageData.breadcrumb}
      lastUpdatedLabel={pageData.lastUpdated}
      sidebar={pageData.sidebar}
      contact={pageData.contact}
      sidebarLinks={sidebarLinks}
    />
  );
}
