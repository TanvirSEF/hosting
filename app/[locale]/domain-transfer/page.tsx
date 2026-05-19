import { Hero, TransferSteps, FAQ, CTA } from '@/components/domain-transfer';
import ContactSection from '@/components/contactSection';

export default function DomainTransfer() {
  return (
    <main>
      {/* Desktop: flexible height, Mobile: normal flow */}
      <div className="flex flex-col lg:min-h-screen">
        <Hero />
      </div>

      <TransferSteps />

      <FAQ />

      <CTA />

      <div className="bg-[#FAFAFA]">
        <ContactSection
          namespace="domain-transfer.contact"
          formNamespace="domain-transfer.contactForm"
        />
      </div>
    </main>
  );
}
