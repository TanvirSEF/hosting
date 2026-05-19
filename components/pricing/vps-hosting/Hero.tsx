import { useTranslations } from 'next-intl';
import ServiceNav from '../common/ServiceNav';

export default function Hero() {
  const t = useTranslations('vpsHosting.hero');
  let navItems: { name: string; href: string; popular?: boolean }[] = [];
  try {
    const raw = t.raw('navigationItems') as unknown;
    if (Array.isArray(raw)) {
      navItems = raw as { name: string; href: string; popular?: boolean }[];
    }
  } catch {
    navItems = [];
  }

  return (
    <section className="relative flex min-h-[60vh] flex-col justify-center overflow-hidden bg-[#06010E] pt-32 pb-24">
      {/* Background Glow Effects matching Homepage */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-full w-full max-w-[1400px] -translate-x-1/2">
        <div className="absolute top-[-20%] left-[20%] h-[600px] w-[600px] bg-[radial-gradient(circle,rgba(140,82,255,0.15)_0%,rgba(6,1,14,0)_70%)] mix-blend-screen blur-[80px]" />
        <div className="absolute right-[-5%] bottom-[-10%] h-[500px] w-[500px] bg-[radial-gradient(circle,rgba(140,82,255,0.1)_0%,rgba(6,1,14,0)_70%)] mix-blend-screen blur-[60px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Title - Consistent with VPS Page 'brandName' size */}
        <h1
          className="font-dm-sans mb-6 text-[clamp(2.125rem,5vw,4.375rem)] leading-[1.1] font-bold tracking-tight text-white drop-shadow-2xl"
          dangerouslySetInnerHTML={{ __html: t.raw('title') }}
        />

        {/* Subtitle */}
        <p className="font-dm-sans mx-auto mb-10 max-w-2xl text-[clamp(1rem,2vw,1.25rem)] leading-relaxed font-normal text-[#E0E0E0]/80">
          {t('subtitle')}
        </p>

        {/* Service Navigation - The "Floating" Section */}
        <ServiceNav items={navItems} />
      </div>
    </section>
  );
}
