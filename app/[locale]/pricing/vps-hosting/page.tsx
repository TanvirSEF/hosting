import Hero from '@/components/pricing/vps-hosting/Hero';
import Pricing from '@/components/pricing/vps-hosting/Pricing';
import HostingTypes from '@/components/pricing/vps-hosting/HostingTypes';
import Comparison from '@/components/pricing/vps-hosting/Comparison';
import EnjoyAllThis from '@/components/pricing/vps-hosting/EnjoyAllThis';
import FAQ from '@/components/pricing/vps-hosting/FAQ';
import ContactSection from '@/components/contactSection';

export default function VpsPricingPage() {
  return (
    <main>
      <Hero />
      <Pricing />
      <HostingTypes />
      <Comparison />
      <EnjoyAllThis />
      <FAQ />
      <ContactSection namespace="vpsHosting.contact" formNamespace="vpsHosting.contactForm" />
    </main>
  );
}
