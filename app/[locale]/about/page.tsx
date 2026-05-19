import Hero from '@/components/about/Hero';
import ContentSections from '@/components/about/ContentSections';
import AboutPricingPhilosophy from '@/components/about/AboutPricingPhilosophy';
import Testimonials from '@/components/about/Testimonials';
import CTA from '@/components/home/CTA';
import ContactSection from '@/components/contactSection';

export default function AboutPage() {
  return (
    <main>
      <Hero />
      <ContentSections />
      <AboutPricingPhilosophy />
      <Testimonials />
      <CTA namespace="about.cta" />
      <ContactSection />
    </main>
  );
}
