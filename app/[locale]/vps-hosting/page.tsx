import Hero from '@/components/vps/Hero';
import Stats from '@/components/vps/Stats';

import Pricing from '@/components/vps/Pricing';
import VPSFeatures from '@/components/vps/VPSFeatures';
import VPSCreationSteps from '@/components/vps/VPSCreationSteps';
import VPSManagement from '@/components/vps/VPSManagement';
import VPSWhyChoose from '@/components/vps/VPSWhyChoose';
import VPSUseCases from '@/components/vps/VPSUseCases';
import VPSFAQ from '@/components/vps/VPSFAQ';
import VPSCTA from '@/components/vps/VPSCTA';

// import FAQ from "@/components/home/FAQ";
// import CTA from "@/components/home/CTA";
import ContactSection from '@/components/contactSection';

export default function VpsHosting() {
  return (
    <main>
      {/* Desktop: flexible height, Mobile: normal flow */}
      <div className="flex flex-col lg:min-h-screen">
        <Hero />
        <Stats />
      </div>

      <Pricing />
      <div className="bg-[#FAFAFA] relative z-20">
        <div className="relative">
          <VPSFeatures />
          <VPSCreationSteps />
          <VPSManagement />
        </div>
      </div>

      <div
        className="relative z-30 bg-[#FAFAFA] isolate transform-gpu pt-px w-full clear-both"
        style={{
          transform: 'translate3d(0,0,0)',
          WebkitTransform: 'translate3d(0,0,0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
      >
        <VPSWhyChoose />
      </div>

      <div className="bg-[#FAFAFA]">
        <div className="relative">
          <VPSUseCases />
        </div>

        <VPSFAQ />
        <VPSCTA />
        <ContactSection
          namespace="vps.contact"
          formNamespace="vps.contactForm"
        />
      </div>
    </main>
  );
}
