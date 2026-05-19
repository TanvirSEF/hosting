import { LegalPageLayout } from '@/components/legal';
import { getLegalPage } from '@/lib/legal-pages';
import { notFound } from 'next/navigation';

interface TermsOfServicePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function TermsOfServicePage({ params }: TermsOfServicePageProps) {
  const { locale } = await params;
  const pageData = await getLegalPage('terms-of-service', locale);

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
      active: true,
    },
    {
      title: pageData.links.cookiePolicy,
      href: `/${locale}/legal/cookie-policy`,
      active: false,
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
