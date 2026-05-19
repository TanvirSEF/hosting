import Hero from '@/components/shared-hosting/Hero';
import Stats from '@/components/shared-hosting/Stats';
import Pricing from '@/components/shared-hosting/Pricing';
import SharedFeatures from '@/components/shared-hosting/SharedFeatures';
import SharedCreationSteps from '@/components/shared-hosting/SharedCreationSteps';
import SharedManagement from '@/components/shared-hosting/SharedManagement';
import SharedWhyChoose from '@/components/shared-hosting/SharedWhyChoose';
import SharedUseCases from '@/components/shared-hosting/SharedUseCases';
import SharedFAQ from '@/components/shared-hosting/SharedFAQ';
import SharedCTA from '@/components/shared-hosting/SharedCTA';
import ContactSection from '@/components/contactSection';

export default function SharedHosting() {
  return (
    <main>
      {/* Desktop: flexible height, Mobile: normal flow */}
      <div className="flex flex-col lg:min-h-screen">
        <Hero />
        <Stats />
      </div>

      <Pricing />
      <div className="bg-[#FAFAFA] relative z-20">
        <div className="relative flex flex-col">
          <SharedFeatures />
          <SharedCreationSteps />
          <SharedManagement />
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
        <SharedWhyChoose />
      </div>

      <div className="bg-[#FAFAFA]">
        <div className="relative flex flex-col">
          <SharedUseCases />
        </div>

        <SharedFAQ />
        <SharedCTA />
        <ContactSection
          namespace="shared-hosting.contact"
          formNamespace="shared-hosting.contactForm"
        />
      </div>
    </main>
  );
}
