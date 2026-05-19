import { getTranslations } from 'next-intl/server';
import LegalPageClient from '@/components/legal/LegalPageClient';
import { Shield, FileText, Cookie } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return {
    title: 'Legal',
    description: 'Access all our legal documents and policies in one place',
  };
}

export default async function LegalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const legalDocuments = [
    {
      title: "Privacy Policy",
      description: "Learn how we collect, use, and protect your personal information",
      href: `/${locale}/legal/privacy-policy`,
      iconName: "Shield",
      color: 'bg-blue-500',
    },
    {
      title: "Terms of Service",
      description: "Read the terms and conditions that govern your use of our services",
      href: `/${locale}/legal/terms-of-service`,
      iconName: "FileText",
      color: 'bg-green-500',
    },
    {
      title: "Cookie Policy",
      description: "Understand how we use cookies and similar tracking technologies",
      href: `/${locale}/legal/cookie-policy`,
      iconName: "Cookie",
      color: 'bg-orange-500',
    },
  ];

  return <LegalPageClient locale={locale} legalDocuments={legalDocuments} />;
}
