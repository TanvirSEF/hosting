import Hero from '@/components/pricing/web-hosting/Hero';
import Pricing from '@/components/pricing/web-hosting/Pricing';
import HostingTypes from '@/components/pricing/web-hosting/HostingTypes';
import Comparison from '@/components/pricing/web-hosting/Comparison';
import EnjoyAllThis from '@/components/pricing/web-hosting/EnjoyAllThis';
import FAQ from '@/components/pricing/web-hosting/FAQ';
import ContactSection from '@/components/contactSection';

export default function PricingPage() {
  return (
    <main>
      <Hero />
      <Pricing />
      <HostingTypes />
      <Comparison />
      <EnjoyAllThis />
      <FAQ />
      <ContactSection namespace="webHosting.contact" formNamespace="webHosting.contactForm" />
    </main>
  );
}
