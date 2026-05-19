'use client';

import { Button } from '@/components/ui/button';
import { Server, Zap, Cloud, LucideIcon } from 'lucide-react';
import { getVpsPlansAction } from '@/actions/hosting-actions';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

// Define Plan Interface (id is number from WHMCS product pid)
interface PricingPlan {
  id: number;
  name: string;
  tagline?: string;
  description: string;
  price: string;
  unit: string;
  yearly?: string;
  orLabel?: string;
  highlight?: boolean;
  features: string[];
}

interface PlanWithMeta extends PricingPlan {
  performanceLevel: string;
  icon: LucideIcon;
}

// Stable visual level (independent of localized plan names)
function getPerformanceLevel(index: number) {
  if (index >= 2) return 'High';
  if (index === 1) return 'Medium';
  return 'Low';
}

function getIconForPlan(planName: string) {
  const name = planName.toLowerCase();
  if (name.includes('cloud')) return Cloud;
  if (name.includes('business')) return Zap;
  return Server;
}

export default function HostingTypes() {
  const t = useTranslations('vpsHosting.hostingTypes');
  const [plans, setPlans] = useState<PlanWithMeta[]>([]);
  const locale = useLocale();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const result = await getVpsPlansAction(undefined, locale);
        if (result.success && result.data) {
          setPlans(
            result.data.map((plan, idx) => ({
              ...plan,
              performanceLevel: getPerformanceLevel(idx),
              icon: getIconForPlan(plan.name),
            }))
          );
        }
      } catch (error) {
      }
    };
    fetchPlans();
  }, [locale]);

  const getPerformanceLabel = (level: string) => {
    if (level === 'High') return t('performanceLevels.maximum');
    if (level === 'Medium') return t('performanceLevels.increased');
    return t('performanceLevels.standard');
  };

  // Fallback static data if API hasn't loaded or fails (optional, or just return null)
  if (!plans.length) return null;

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
          {plans.map((plan, idx) => {
            // Extract specs from features or description if possible, or use placeholders
            // Since API returns a features array, we might pick key ones or mock for now as requested
            // For perfectly dynamic "Comparison Cards" we'd need structured specs in DB.
            // For now, mapping known plan structures to the visual card format.

            // Extract specific features for display
            const websiteFeature =
              plan.features.find((f: string) => /vcpu|core|cpu/i.test(f)) ||
              t('fallbackValues.websites');
            const storageFeature =
              plan.features.find((f: string) => /storage|ssd|nvme|disk/i.test(f)) ||
              t('fallbackValues.storage');
            const websitesValue = websiteFeature.match(/\d+/)?.[0] || websiteFeature;
            const storageValue = storageFeature.match(/\d+/)?.[0] || storageFeature;
            // Simplified mocks for visual bars if not explicit in API
            const performanceLabel = getPerformanceLabel(plan.performanceLevel);

            return (
              <div
                key={idx}
                className="group relative flex min-h-[400px] flex-col rounded-[24px] border border-transparent bg-white p-6 transition-shadow duration-300 hover:border-purple-100 hover:shadow-xl md:rounded-[32px] md:p-8"
              >
                <div className="mb-8">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F9F6FF] text-[#8C52FF] md:h-12 md:w-12">
                      <plan.icon className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <h3 className="font-dm-sans text-xl leading-tight font-bold text-[#1E1F21] md:text-2xl">
                      {plan.name}
                    </h3>
                  </div>
                </div>

                <div className="flex-1 space-y-5 md:space-y-6">
                  {/* Websites - No Bar */}
                  <div className="flex items-center justify-between border-b border-gray-50 py-2">
                    <span className="font-dm-sans text-sm font-medium text-gray-700">
                      {t('labels.websites')}
                    </span>
                    <span className="font-dm-sans text-sm font-bold text-[#1E1F21]">
                      {websitesValue}
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
                        {storageValue}
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

                  {/* SSL Bar (Always Full) */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-dm-sans text-sm font-medium text-gray-700">
                        {t('labels.ssl')}
                      </span>
                      <span className="font-dm-sans text-sm font-bold text-[#1E1F21]">
                        {t('labels.unlimited')}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-purple-100">
                      <div className="h-full w-full rounded-full bg-[#8C52FF]"></div>
                    </div>
                  </div>
                </div>

                <p className="font-dm-sans mt-6 line-clamp-2 text-sm leading-relaxed text-[#667085] md:text-[15px]">
                  {plan.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center md:mt-16">
          <Button
            asChild
            className="font-dm-sans rounded-full bg-[#8C52FF] px-8 py-3 text-base font-bold text-white shadow-lg shadow-[#8C52FF]/20 transition-transform hover:-translate-y-1 hover:bg-[#7839EE] md:h-14 md:px-12 md:text-lg"
          >
            <Link href="/vps-hosting#pricing">
              {t('getStarted')}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
