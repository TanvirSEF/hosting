import PricePhilosophyHero from '@/components/price-philosophy/PricePhilosophyHero';
import ProblemWithOthers from '@/components/price-philosophy/ProblemWithOthers';
import PricePromise from '@/components/price-philosophy/PricePromise';
import Stats from '@/components/home/Stats';
import CTA from '@/components/home/CTA';
import ContactSection from '@/components/contactSection';

export default function PricePhilosophy() {
  return (
    <main>
      <div className="flex flex-col lg:min-h-screen">
        <PricePhilosophyHero />
        <Stats namespace="pricePhilosophy.stats" />
      </div>
      <ProblemWithOthers />
      <PricePromise />
      <CTA namespace="pricePhilosophy.cta" />
      <ContactSection namespace="pricePhilosophy.contact" />
    </main>
  );
}
