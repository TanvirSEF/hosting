import Hero from '@/components/ecommerce-hosting/Hero';
import Stats from '@/components/ecommerce-hosting/Stats';
import Pricing from '@/components/ecommerce-hosting/Pricing';
import EcommerceFeatures from '@/components/ecommerce-hosting/EcommerceFeatures';
import EcommerceCreationSteps from '@/components/ecommerce-hosting/EcommerceCreationSteps';
import EcommerceManagement from '@/components/ecommerce-hosting/EcommerceManagement';
import EcommerceWhyChoose from '@/components/ecommerce-hosting/EcommerceWhyChoose';
import EcommerceUseCases from '@/components/ecommerce-hosting/EcommerceUseCases';
import EcommerceFAQ from '@/components/ecommerce-hosting/EcommerceFAQ';
import EcommerceCTA from '@/components/ecommerce-hosting/EcommerceCTA';
import ContactSection from '@/components/contactSection';

export default function EcommerceHosting() {
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
          <EcommerceFeatures />
          <EcommerceCreationSteps />
          <EcommerceManagement />
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
        <EcommerceWhyChoose />
      </div>

      <div className="bg-[#FAFAFA]">
        <div className="relative">
          <EcommerceUseCases />
        </div>

        <EcommerceFAQ />
        <EcommerceCTA />
        <ContactSection
          namespace="ecommerce-hosting.contact"
          formNamespace="ecommerce-hosting.contactForm"
        />
      </div>
    </main>
  );
}
