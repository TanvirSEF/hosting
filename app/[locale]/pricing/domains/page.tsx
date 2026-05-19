import Hero from '@/components/pricing/domains/Hero';
import DomainSearch from '@/components/pricing/domains/DomainSearch';
import PricingTable from '@/components/pricing/domains/PricingTable';
import WhyChoose from '@/components/pricing/domains/WhyChoose';
import Tips from '@/components/pricing/domains/Tips';
import FAQ from '@/components/pricing/domains/FAQ';
import ContactSection from '@/components/contactSection';

export default function DomainsPage() {
  return (
    <main>
      <Hero />
      <DomainSearch />
      <PricingTable />
      <WhyChoose />
      <Tips />
      <FAQ />
      <ContactSection namespace="domains.contact" formNamespace="domains.contactForm" />
    </main>
  );
}
