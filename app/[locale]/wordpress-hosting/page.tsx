import Hero from '@/components/wordpress-hosting/Hero';
import Stats from '@/components/wordpress-hosting/Stats';
import Pricing from '@/components/wordpress-hosting/Pricing';
import WordPressFeatures from '@/components/wordpress-hosting/WordPressFeatures';
import WordPressCreationSteps from '@/components/wordpress-hosting/WordPressCreationSteps';
import WordPressManagement from '@/components/wordpress-hosting/WordPressManagement';
import WordPressWhyChoose from '@/components/wordpress-hosting/WordPressWhyChoose';
import WordPressUseCases from '@/components/wordpress-hosting/WordPressUseCases';
import WordPressFAQ from '@/components/wordpress-hosting/WordPressFAQ';
import WordPressCTA from '@/components/wordpress-hosting/WordPressCTA';
import ContactSection from '@/components/contactSection';

export default function WordPressHosting() {
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
          <WordPressFeatures />
          <WordPressCreationSteps />
          <WordPressManagement />
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
        <WordPressWhyChoose />
      </div>

      <div className="bg-[#FAFAFA]">
        <div className="relative">
          <WordPressUseCases />
        </div>

        <WordPressFAQ />
        <WordPressCTA />
        <ContactSection
          namespace="wordpress-hosting.contact"
          formNamespace="wordpress-hosting.contactForm"
        />
      </div>
    </main>
  );
}
