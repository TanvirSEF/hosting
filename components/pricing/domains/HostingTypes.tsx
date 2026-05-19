'use client';

import { Button } from '@/components/ui/button';
import { Globe, Star, Rocket, LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

interface DomainPlanType {
  key: string;
  iconKey?: 'starter' | 'business' | 'pro';
  performanceLevel: 'Low' | 'Medium' | 'High';
  domains: string;
  storage: string;
}

const DEFAULT_DOMAIN_TYPES: DomainPlanType[] = [
  {
    key: 'starter',
    iconKey: 'starter',
    performanceLevel: 'Low',
    domains: '1',
    storage: '10',
  },
  {
    key: 'business',
    iconKey: 'business',
    performanceLevel: 'Medium',
    domains: '10',
    storage: '50',
  },
  {
    key: 'pro',
    iconKey: 'pro',
    performanceLevel: 'High',
    domains: 'Unlimited',
    storage: '100',
  },
];

export default function HostingTypes() {
  const t = useTranslations('domains.hostingTypes');
  const planMetrics = (() => {
    try {
      const raw = t.raw('planMetrics') as unknown;
      return Array.isArray(raw) ? (raw as DomainPlanType[]) : DEFAULT_DOMAIN_TYPES;
    } catch {
      return DEFAULT_DOMAIN_TYPES;
    }
  })();

  const getIconForPlan = (iconKey?: string): LucideIcon => {
    if (iconKey === 'business') return Star;
    if (iconKey === 'pro') return Rocket;
    return Globe;
  };

  const getPerformanceLabel = (level: string) => {
    if (level === 'High') return t('performanceLevels.maximum');
    if (level === 'Medium') return t('performanceLevels.increased');
    return t('performanceLevels.standard');
  };

  return (
    <section className="relative overflow-hidden bg-[#FAFAFA] py-16 md:py-24">
      {/* Background Blob on the Left */}
      <div className="pointer-events-none absolute top-1/2 left-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8C52FF] opacity-10 blur-[150px]" />

      <div className="relative z-10 container mx-auto px-4">
        <div className="mb-12 text-center md:mb-16">
          <h2 className="font-dm-sans mb-4 text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-bold tracking-tight text-[#1E1F21] md:mb-6">
            {t('title')}
          </h2>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {planMetrics.map((plan, idx) => {
            const performanceLabel = getPerformanceLabel(plan.performanceLevel);
            const IconComponent = getIconForPlan(plan.iconKey || plan.key);

            return (
              <div
                key={idx}
                className="group relative flex min-h-[400px] flex-col rounded-[24px] border border-transparent bg-white p-6 transition-shadow duration-300 hover:border-purple-100 hover:shadow-xl md:rounded-[32px] md:p-8"
              >
                <div className="mb-8">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F9F6FF] text-[#8C52FF] md:h-12 md:w-12">
                      <IconComponent className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <h3 className="font-dm-sans text-xl leading-tight font-bold text-[#1E1F21] md:text-2xl">
                      {t(`plans.${plan.key}.name`)}
                    </h3>
                  </div>
                  <p className="font-dm-sans line-clamp-2 min-h-[50px] text-sm leading-relaxed text-[#667085] md:text-[15px]">
                    {t(`plans.${plan.key}.description`)}
                  </p>
                </div>

                <div className="flex-1 space-y-5 md:space-y-6">
                  {/* Domains - No Bar */}
                  <div className="flex items-center justify-between border-b border-gray-50 py-2">
                    <span className="font-dm-sans text-sm font-medium text-gray-700">
                      {t('labels.domains')}
                    </span>
                    <span className="font-dm-sans text-sm font-bold text-[#1E1F21]">
                      {plan.domains}
                    </span>
                  </div>

                  {/* Performance Bar */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-dm-sans text-sm font-medium text-gray-700">
                        {t('labels.performance')}
                      </span>
                      <span className="font-dm-sans text-sm font-bold text-[#1E1F21]">
                        {performanceLabel}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-purple-100">
                      <div
                        className={`h-full rounded-full bg-[#8C52FF] transition-all duration-500 ${
                          plan.performanceLevel === 'Low'
                            ? 'w-1/3'
                            : plan.performanceLevel === 'Medium'
                              ? 'w-2/3'
                              : 'w-full'
                        } `}
                      ></div>
                    </div>
                  </div>

                  {/* Storage Bar */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-dm-sans text-sm font-medium text-gray-700">
                        {t('labels.storage')}
                      </span>
                      <span className="font-dm-sans text-sm font-bold text-[#1E1F21]">
                        {plan.storage} GB
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-purple-100">
                      <div
                        className={`h-full rounded-full bg-[#8C52FF] transition-all duration-500 ${
                          plan.performanceLevel === 'Low'
                            ? 'w-1/3'
                            : plan.performanceLevel === 'Medium'
                              ? 'w-2/3'
                              : 'w-full'
                        } `}
                      ></div>
                    </div>
                  </div>

                  {/* Privacy Protection Bar (Always Full) */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-dm-sans text-sm font-medium text-gray-700">
                        {t('labels.privacy')}
                      </span>
                      <span className="font-dm-sans text-sm font-bold text-[#1E1F21]">
                        {t('labels.included')}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-purple-100">
                      <div className="h-full w-full rounded-full bg-[#8C52FF]"></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center md:mt-16">
          <Button
            asChild
            className="font-dm-sans rounded-full bg-[#8C52FF] px-8 py-3 text-base font-bold text-white shadow-lg shadow-[#8C52FF]/20 transition-transform hover:-translate-y-1 hover:bg-[#7839EE] md:h-14 md:px-12 md:text-lg"
          >
            <Link href="/domain-search">
              {t('getStarted')}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
