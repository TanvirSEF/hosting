'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight, FileText, Shield, Cookie } from 'lucide-react';

interface LegalDocument {
  title: string;
  description: string;
  href: string;
  iconName: string;
  color: string;
}

interface LegalPageClientProps {
  locale: string;
  legalDocuments: LegalDocument[];
}

const iconMap = {
  Shield,
  FileText,
  Cookie,
};

export default function LegalPageClient({ locale, legalDocuments }: LegalPageClientProps) {
  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      {/* Hero Section with gradient */}
      <section className="relative overflow-hidden bg-[#06010E]">
        {/* Purple glow effect */}
        <div className="pointer-events-none absolute -right-[10%] -bottom-[30%] z-0 h-[400px] w-[400px] bg-[radial-gradient(circle,rgba(140,82,255,0.35)_0%,rgba(6,1,14,0)_70%)] blur-[60px] md:h-[600px] md:w-[600px]" />
        <div className="pointer-events-none absolute -top-[20%] -left-[10%] z-0 h-[300px] w-[300px] bg-[radial-gradient(circle,rgba(140,82,255,0.2)_0%,rgba(6,1,14,0)_70%)] blur-[50px] md:h-[400px] md:w-[400px]" />

        <div className="relative z-10 container mx-auto max-w-[1400px] px-4 pt-32 pb-16 sm:px-6 md:pt-40 md:pb-20 lg:px-12 xl:px-20">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex items-center justify-center gap-2 text-[clamp(0.8rem,1.5vw,0.875rem)] text-white/60 md:justify-start"
          >
            <Link
              href="/"
              className="transition-colors duration-200 hover:text-white"
            >
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white">Legal</span>
          </motion.nav>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-dm-sans mb-6 text-center text-[clamp(2.125rem,5vw,4.375rem)] leading-tight font-bold text-white md:text-left"
          >
            Legal
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-dm-sans text-center text-[clamp(1rem,2vw,1.25rem)] text-white/80 md:text-left max-w-3xl"
          >
            Access all our legal documents and policies in one place
          </motion.p>
        </div>
      </section>

      {/* Legal Documents Grid */}
      <section className="relative py-16 md:py-24">
        <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12 xl:px-20">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {legalDocuments.map((doc, index) => {
              const Icon = iconMap[doc.iconName as keyof typeof iconMap];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group"
                >
                  <Link
                    href={doc.href}
                    className="block h-full rounded-2xl border border-[#EAECF0] bg-white p-8 shadow-sm transition-all duration-300 hover:border-[#8C52FF] hover:shadow-lg"
                  >
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#8C52FF]/[0.1] group-hover:bg-[#8C52FF]/[0.2] transition-colors duration-300">
                      <Icon className="h-8 w-8 text-[#8C52FF]" />
                    </div>
                    
                    <h3 className="font-dm-sans mb-3 text-[clamp(1.25rem,2vw,1.5rem)] font-semibold text-[#1E1F21] group-hover:text-[#8C52FF] transition-colors duration-300">
                      {doc.title}
                    </h3>
                    
                    <p className="font-dm-sans text-[clamp(0.9rem,1.5vw,1rem)] leading-relaxed text-[#667085] mb-4">
                      {doc.description}
                    </p>
                    
                    <div className="flex items-center gap-2 text-[#8C52FF] font-medium text-sm">
                      <span>Read More</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="relative py-16 md:py-24 bg-[#8C52FF]">
        <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12 xl:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="font-dm-sans mb-4 text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-white">
              Questions About Our Legal Documents?
            </h2>
            <p className="font-dm-sans mb-8 text-[clamp(1rem,2vw,1.25rem)] text-white/85 max-w-2xl mx-auto">
              If you have any questions or concerns about our legal policies, please don't hesitate to reach out to our team.
            </p>
            <a
              href="mailto:support@webblyhosting.com"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-[clamp(0.9rem,1.5vw,1rem)] font-medium text-[#8C52FF] transition-colors duration-200 hover:bg-white/95"
            >
              Contact Legal Team
              <ChevronRight className="h-4 w-4" />
            </a>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
