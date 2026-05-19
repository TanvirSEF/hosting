'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import React from 'react';

// Rich-text AST node types (formerly rendered by TinaMarkdown)
type TinaNode = {
  type: string;
  text?: string;
  url?: string;
  children?: TinaNode[];
  [key: string]: unknown;
};

function renderTinaNode(node: TinaNode, key: number): React.ReactNode {
  if (node.type === 'text') {
    let el: React.ReactNode = node.text || '';
    if ((node as any).bold) el = <strong key={key}>{el}</strong>;
    if ((node as any).italic) el = <em key={key}>{el}</em>;
    if ((node as any).underline) el = <u key={key}>{el}</u>;
    return el;
  }
  const children = node.children?.map((c, i) => renderTinaNode(c, i));
  switch (node.type) {
    case 'root': return <React.Fragment key={key}>{children}</React.Fragment>;
    case 'p': return <p key={key}>{children}</p>;
    case 'ul': return <ul key={key}>{children}</ul>;
    case 'ol': return <ol key={key}>{children}</ol>;
    case 'li': return <li key={key}>{children}</li>;
    case 'lic': return <React.Fragment key={key}>{children}</React.Fragment>;
    case 'a': return <a key={key} href={node.url} className="text-[#8C52FF] underline hover:text-[#7340DB]">{children}</a>;
    case 'strong': return <strong key={key}>{children}</strong>;
    case 'em': return <em key={key}>{children}</em>;
    case 'blockquote': return <blockquote key={key}>{children}</blockquote>;
    case 'br': return <br key={key} />;
    default: return <React.Fragment key={key}>{children}</React.Fragment>;
  }
}

function TinaRichText({ content }: { content: any }) {
  if (!content) return null;
  if (typeof content === 'string') return <>{content}</>;
  if (content.type === 'root') {
    return <>{content.children?.map((c: TinaNode, i: number) => renderTinaNode(c, i))}</>;
  }
  return <>{String(content)}</>;
}

interface Section {
  title: string;
  content?: any;
  subsections?: {
    title: string;
    content: any;
  }[];
}

interface Breadcrumb {
  home: string;
  legal: string;
}

interface Sidebar {
  title: string;
}

interface Contact {
  title: string;
  description: string;
  button: string;
}

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  introduction: any;
  sections: Section[];
  breadcrumb: Breadcrumb;
  lastUpdatedLabel: string;
  sidebar: Sidebar;
  contact: Contact;
  sidebarLinks?: {
    title: string;
    href: string;
    active?: boolean;
  }[];
}

export default function LegalPageLayout({
  title,
  lastUpdated,
  introduction,
  sections,
  breadcrumb,
  lastUpdatedLabel,
  sidebar,
  contact,
  sidebarLinks = [],
}: LegalPageLayoutProps) {

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  // renderContent function removed as we now use TinaRichText

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      {/* Hero Section with gradient */}
      <section className="relative overflow-hidden bg-[#06010E]">
        {/* Purple glow effect */}
        <div className="pointer-events-none absolute -right-[10%] -bottom-[30%] z-0 h-[400px] w-[400px] bg-[radial-gradient(circle,rgba(140,82,255,0.35)_0%,rgba(6,1,14,0)_70%)] blur-[60px] md:h-[600px] md:w-[600px]" />
        <div className="pointer-events-none absolute -top-[20%] -left-[10%] z-0 h-[300px] w-[300px] bg-[radial-gradient(circle,rgba(140,82,255,0.2)_0%,rgba(6,1,14,0)_70%)] blur-[50px] md:h-[400px] md:w-[400px]" />

        <div className="relative z-10 container mx-auto max-w-[1400px] px-4 pt-32 pb-16 sm:px-6 md:pt-40 md:pb-20 lg:px-12 xl:px-20">
          {/* Breadcrumb - center on mobile */}
          <motion.nav
            {...fadeInUp}
            className="mb-6 flex items-center justify-center gap-2 text-[clamp(0.8rem,1.5vw,0.875rem)] text-white/60 md:justify-start"
          >
            <Link
              href="/"
              className="transition-colors duration-200 hover:text-white"
            >
              {breadcrumb.home}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>{breadcrumb.legal}</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white">{title}</span>
          </motion.nav>

          {/* Title - center on mobile */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-dm-sans mb-4 text-center text-[clamp(2.125rem,5vw,4.375rem)] leading-tight font-bold text-white md:text-left"
          >
            {title}
          </motion.h1>

          {/* Last Updated - center on mobile */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-dm-sans text-center text-[clamp(0.875rem,1.8vw,1rem)] text-white/60 md:text-left"
          >
            {lastUpdatedLabel}: {lastUpdated}
          </motion.p>
        </div>
      </section>

      {/* Content Section */}
      <section className="relative py-12 md:py-20">
        <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12 xl:px-20">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
            {/* Sidebar - Desktop only */}
            {sidebarLinks.length > 0 && (
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="hidden flex-shrink-0 lg:block lg:w-[260px] xl:w-[280px]"
              >
                <div className="sticky top-28 rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
                  <h3 className="font-dm-sans mb-4 text-[clamp(0.9rem,1.5vw,1rem)] font-semibold text-[#1E1F21]">
                    {sidebar.title}
                  </h3>
                  <nav className="flex flex-col gap-1">
                    {sidebarLinks.map((link, index) => (
                      <Link
                        key={index}
                        href={link.href}
                        className={`font-dm-sans rounded-lg px-3 py-2.5 text-[clamp(0.8rem,1.4vw,0.9rem)] transition-colors duration-200 ${link.active
                          ? 'bg-[#8C52FF]/[0.06] font-medium text-[#8C52FF]'
                          : 'text-[#667085] hover:bg-[#F5F5F5] hover:text-[#1E1F21]'
                          }`}
                      >
                        {link.title}
                      </Link>
                    ))}
                  </nav>
                </div>
              </motion.aside>
            )}

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="max-w-4xl flex-1"
            >
              {/* Introduction */}
              <div className="mb-6 rounded-2xl border border-[#EAECF0] bg-white p-6 shadow-sm md:p-8">
                <div className="text-[clamp(0.9rem,1.8vw,1.0625rem)] leading-relaxed text-[#667085]">
                  {introduction && (
                    <div className="font-dm-sans [&>p]:mb-4 [&>p:last-child]:mb-0 [&>ul]:mb-6 [&>ul]:list-disc [&>ul]:space-y-2 [&>ul]:pl-6 [&>ul]:marker:text-[#8C52FF] [&>ul>li]:pl-2">
                      <TinaRichText content={introduction} />
                    </div>
                  )}
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-16">
                {sections.map((section, sectionIndex) => (
                  <motion.div
                    key={sectionIndex}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: sectionIndex * 0.03 }}
                    className="scroll-mt-32"
                    id={`section-${sectionIndex}`}
                  >
                    <h2 className="font-dm-sans mb-6 text-[clamp(1.5rem,2.5vw,1.75rem)] font-bold text-[#1E1F21]">
                      <span className="mr-3 text-[#8C52FF]">{sectionIndex + 1}.</span>
                      {section.title}
                    </h2>

                    {/* Content */}
                    <div className="text-[clamp(1rem,1.5vw,1.125rem)] leading-relaxed text-[#4A4C51] font-dm-sans [&>p]:mb-4 [&>p:last-child]:mb-0 [&>ul]:mb-6 [&>ul]:list-disc [&>ul]:space-y-2 [&>ul]:pl-6 [&>ul]:marker:text-[#8C52FF] [&>ul>li]:pl-2">
                      {section.content && <TinaRichText content={section.content} />}
                    </div>

                    {/* Subsections */}
                    {section.subsections && section.subsections.length > 0 && (
                      <div className="mt-8 space-y-8 pl-4 border-l-2 border-[#EAECF0]">
                        {section.subsections.map((sub, subIndex) => (
                          <div key={subIndex}>
                            <h3 className="font-dm-sans mb-4 text-[clamp(1.125rem,1.8vw,1.25rem)] font-semibold text-[#1E1F21]">
                              {sub.title}
                            </h3>
                            <div className="text-[clamp(0.9375rem,1.5vw,1rem)] leading-relaxed text-[#667085] font-dm-sans [&>p]:mb-4 [&>p:last-child]:mb-0 [&>ul]:mb-6 [&>ul]:list-disc [&>ul]:space-y-2 [&>ul]:pl-6 [&>ul]:marker:text-[#8C52FF] [&>ul>li]:pl-2">
                              {sub.content && <TinaRichText content={sub.content} />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Contact Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl bg-[#8C52FF] p-6 text-white md:p-8"
              >
                <h3 className="font-dm-sans mb-3 text-[clamp(1.1rem,2.2vw,1.375rem)] font-semibold">
                  {contact.title}
                </h3>
                <p className="font-dm-sans mb-5 text-[clamp(0.875rem,1.6vw,1rem)] text-white/85">
                  {contact.description}
                </p>
                <a
                  href={contact.button === "Contact Support" ? "mailto:support@webblyhosting.com" : contact.button === "Contact Data Protection" ? "mailto:dpo@webblyhosting.com" : "mailto:legal@webblyhosting.com"}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-[clamp(0.85rem,1.5vw,0.9375rem)] font-medium text-[#8C52FF] transition-colors duration-200 hover:bg-white/95"
                >
                  {contact.button}
                  <ChevronRight className="h-4 w-4" />
                </a>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
