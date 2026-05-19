import { Zap, Shield, Layers, Code, HardDrive, Globe } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Features() {
  const t = useTranslations('wordpressHosting.features');

  // Icon mapping logic could be dynamic, hardcoded for visual appeal for now
  const features = [
    {
      icon: Zap,
      key: 'staging',
      title: t('staging.title'),
      desc: t('staging.description'),
    },
    {
      icon: Shield,
      key: 'security',
      title: t('security.title'),
      desc: t('security.description'),
    },
    // Added generic placeholders that match translation structure/intent or use fallback
    {
      icon: Layers,
      title: 'Managed WordPress',
      desc: 'We handle the technical stuff so you can focus on your content.',
    },
    {
      icon: Code,
      title: 'Developer Friendly',
      desc: 'Access WP-CLI, SSH, Git, and PHP version control easily.',
    },
    {
      icon: HardDrive,
      title: 'NVMe Storage',
      desc: 'Ultra-fast NVMe storage ensures your WordPress site loads instantly.',
    },
    {
      icon: Globe,
      title: 'Global CDN',
      desc: 'Content delivered from the closest server to your visitors.',
    },
  ];

  return (
    <section className="bg-[#FAFAFA] py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#1E1F21]">
            {t('title')}
          </h2>
          <p className="text-[#667085]">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-100 bg-white p-8 transition-all duration-300 hover:border-[#8C52FF]/30 hover:shadow-lg"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F9F6FF] text-[#8C52FF]">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-[#1E1F21]">
                {feature.title}
              </h3>
              <p className="leading-relaxed text-[#667085]">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
