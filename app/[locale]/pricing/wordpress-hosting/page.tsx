import Hero from '@/components/pricing/wordpress-hosting/Hero';
import Pricing from '@/components/pricing/wordpress-hosting/Pricing';
import HostingTypes from '@/components/pricing/wordpress-hosting/HostingTypes';
import Comparison from '@/components/pricing/wordpress-hosting/Comparison';
import EnjoyAllThis from '@/components/pricing/wordpress-hosting/EnjoyAllThis';
import FAQ from '@/components/pricing/wordpress-hosting/FAQ';
import ContactSection from '@/components/contactSection';

export default function WordpressHostingPage() {
  return (
    <main>
      <Hero />
      <Pricing />
      <HostingTypes />
      <Comparison />
      <EnjoyAllThis />
      <FAQ />
      <ContactSection namespace="wordpressHosting.contact" formNamespace="wordpressHosting.contactForm" />
    </main>
  );
}
