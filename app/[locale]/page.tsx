import { Suspense } from 'react';
import Hero from '@/components/home/Hero';
import Stats from '@/components/home/Stats';
import DomainSearch from '@/components/home/DomainSearch';
import Pricing from '@/components/home/Pricing';
import Services from '@/components/home/Services';
import SpeedSection from '@/components/home/SpeedSection';
import FeaturesTabs from '@/components/home/FeaturesTabs';
import Blog from '@/components/home/Blog';
import Comparison from '@/components/home/Comparison';
import PricingPhilosophySection from '@/components/home/PricingPhilosophySection';
import FAQ from '@/components/home/FAQ';
import CTA from '@/components/home/CTA';
import ContactSection from '@/components/contactSection';
import { AutoCheckout } from '@/components/AutoCheckout';

export default function Home() {
  return (
    <main>
      {/* Desktop: flexible height, Mobile: normal flow */}
      <div className="flex flex-col lg:min-h-screen">
        <Hero />
        <Stats />
      </div>
      <DomainSearch />
      <Pricing />
      <div className="bg-[#FAFAFA]">
        <div className="relative overflow-hidden">
          <Services />
          <SpeedSection />
        </div>
        <Blog />
        <FeaturesTabs />
        <PricingPhilosophySection />
        <Comparison />
        <FAQ />
        <CTA />
        <ContactSection />
      </div>

      {/* Auto Checkout After Login - Suspense avoids useSearchParams() hydration mismatch */}
      <Suspense fallback={null}>
        <AutoCheckout />
      </Suspense>
    </main>
  );
}
