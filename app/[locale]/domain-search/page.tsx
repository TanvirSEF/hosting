import {
  Hero,
  Stats,
  Pricing,
  WhyChoose,
  UseCases,
  FAQ,
  CTA,
} from '@/components/domain-search';
import ContactSection from '@/components/contactSection';

export default function DomainSearch() {
  return (
    <main>
      {/* Desktop: flexible height, Mobile: normal flow */}
      <div className="flex flex-col lg:min-h-screen">
        <Hero />
        <Stats />
      </div>

      <WhyChoose />

      <UseCases />

      <FAQ />

      <CTA />

      <div className="bg-[#FAFAFA]">
        <ContactSection
          namespace="domain-search.contact"
          formNamespace="domain-search.contactForm"
        />
      </div>

    </main>
  );
}
