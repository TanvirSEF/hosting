import { Hero, ContactMain, Map, SupportOptions } from '@/components/contact';

export default function ContactPage() {
  return (
    <main>
      <Hero />
      <ContactMain />
      <Map />
      <SupportOptions />
      {/* Note: ContactSection is NOT included here since we have a full form on this page */}
    </main>
  );
}
