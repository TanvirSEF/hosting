'use client';

import { useEffect, useState } from 'react';
import { getProductsAction } from '@/actions/hosting-actions';
import { HOSTING_PLANS } from '@/lib/config/hosting-plans';
import {
  Check,
  Server,
  Zap,
  Shield,
  Globe,
  HardDrive,
  Gauge,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCurrency } from '@/contexts/CurrencyContext';

interface HostingPlan {
  id: number;
  name: string;
  description: string;
  pricing: {
    monthly?: string;
    annually?: string;
  };
  features: string[];
  recommended?: boolean;
}

export default function HostingPage() {
  const [plans, setPlans] = useState<HostingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>(
    'annually'
  );
  const { formatPrice, currencyInfo } = useCurrency();

  useEffect(() => {
    async function loadPlans() {
      const sharedGid = parseInt(HOSTING_PLANS.shared.gid || '0', 10);
      const result = await getProductsAction(sharedGid || undefined);

      if (result.success && result.data) {
        // Merge WHMCS data with default features
        const defaultFeatures: Record<
          number,
          { description: string; features: string[] }
        > = {
          2: {
            // Starter
            description: 'Perfect for personal websites',
            features: [
              '10 GB SSD Storage',
              '100 GB Bandwidth',
              '1 Website',
              'Free SSL Certificate',
              '24/7 Support',
              'Daily Backups',
            ],
          },
          3: {
            // Pro
            description: 'Great for growing businesses',
            features: [
              '50 GB SSD Storage',
              'Unlimited Bandwidth',
              '5 Websites',
              'Free SSL Certificate',
              '24/7 Priority Support',
              'Daily Backups',
              'Free cPanel',
              'Free Domain (1 year)',
            ],
          },
          4: {
            // Business
            description: 'For high-traffic websites',
            features: [
              '100 GB SSD Storage',
              'Unlimited Bandwidth',
              'Unlimited Websites',
              'Free SSL Certificate',
              '24/7 Priority Support',
              'Daily Backups',
              'Free cPanel',
              'Free Domain (1 year)',
              'Dedicated IP',
              'Advanced Security',
            ],
          },
        };

        const enhancedPlans = result.data.slice(0, 3).map((plan: any) => ({
          ...plan,
          description:
            plan.description || defaultFeatures[plan.id]?.description || '',
          features:
            plan.features?.length > 0
              ? plan.features
              : defaultFeatures[plan.id]?.features || [],
        }));

        setPlans(enhancedPlans);
      }
      setLoading(false);
    }

    loadPlans();
  }, []);

  // Default plans if WHMCS not configured yet
  const defaultPlans: HostingPlan[] = [
    {
      id: 2,
      name: 'Starter',
      description: 'Perfect for personal websites',
      pricing: { monthly: '3.99', annually: '39.99' },
      features: [
        '10 GB SSD Storage',
        '100 GB Bandwidth',
        '1 Website',
        'Free SSL Certificate',
        '24/7 Support',
        'Daily Backups',
      ],
    },
    {
      id: 3,
      name: 'Pro',
      description: 'Great for growing businesses',
      pricing: { monthly: '7.99', annually: '79.99' },
      features: [
        '50 GB SSD Storage',
        'Unlimited Bandwidth',
        '5 Websites',
        'Free SSL Certificate',
        '24/7 Priority Support',
        'Daily Backups',
        'Free cPanel',
        'Free Domain (1 year)',
      ],
      recommended: true,
    },
    {
      id: 4,
      name: 'Business',
      description: 'For high-traffic websites',
      pricing: { monthly: '14.99', annually: '149.99' },
      features: [
        '100 GB SSD Storage',
        'Unlimited Bandwidth',
        'Unlimited Websites',
        'Free SSL Certificate',
        '24/7 Priority Support',
        'Daily Backups',
        'Free cPanel',
        'Free Domain (1 year)',
        'Dedicated IP',
        'Advanced Security',
      ],
    },
  ];

  const displayPlans = plans.length > 0 ? plans : defaultPlans;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 pt-20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="bg-gradient-to-r from-[#8C52FF] to-purple-600 bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
            Choose Your Perfect Hosting Plan
          </h1>
          <p className="text-xl text-gray-600">
            Powerful, reliable hosting with 99.9% uptime guarantee. Start your
            website today!
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-full px-6 py-2 font-medium transition-all ${billingCycle === 'monthly'
                ? 'bg-[#8C52FF] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annually')}
              className={`rounded-full px-6 py-2 font-medium transition-all ${billingCycle === 'annually'
                ? 'bg-[#8C52FF] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
            >
              Annually
              <span className="ml-2 rounded-full bg-green-500 px-2 py-0.5 text-xs text-white">
                Save 15%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-16">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {displayPlans.map((plan) => {
            const hasMonthly = parseFloat(plan.pricing.monthly || '0') > 0;
            const hasAnnually = parseFloat(plan.pricing.annually || '0') > 0;

            const price =
              billingCycle === 'monthly'
                ? (hasMonthly ? plan.pricing.monthly : (hasAnnually ? (parseFloat(plan.pricing.annually!) / 12).toFixed(2) : '0'))
                : plan.pricing.annually;
            const monthlyPrice =
              billingCycle === 'annually'
                ? (parseFloat(price || '0') / 12).toFixed(2)
                : price;

            return (
              <Card
                key={plan.id}
                className={`relative p-8 transition-all hover:shadow-2xl ${plan.recommended
                  ? 'scale-105 border-2 border-[#8C52FF] shadow-xl'
                  : 'border-gray-200 hover:border-[#8C52FF]'
                  }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#8C52FF] to-purple-600 px-4 py-1 text-sm font-semibold text-white">
                    Most Popular
                  </div>
                )}

                <div className="mb-6 text-center">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                </div>

                <div className="mb-8 text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-gray-900">
                      {formatPrice(parseFloat(monthlyPrice || '0'))}
                    </span>
                    <span className="text-gray-600">/mo</span>
                  </div>
                  {billingCycle === 'annually' && (
                    <p className="mt-2 text-sm text-gray-500">
                      Billed {formatPrice(parseFloat(price || '0'))}/year
                    </p>
                  )}
                </div>

                <Link
                  href={`/order/hosting?plan=${plan.id}&cycle=${billingCycle}`}
                >
                  <Button
                    className={`h-12 w-full text-base font-semibold ${plan.recommended
                      ? 'bg-[#8C52FF] hover:bg-purple-700'
                      : 'bg-purple-600 hover:bg-[#8C52FF]'
                      }`}
                  >
                    Order Now
                  </Button>
                </Link>

                <div className="mt-8 space-y-3">
                  {plan.description && (
                    <div className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#8C52FF]" />
                      <span className="text-sm text-gray-700">
                        {plan.description}
                      </span>
                    </div>
                  )}
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#8C52FF]" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
            Why Choose Our Hosting?
          </h2>

          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-4">
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <Zap className="h-8 w-8 text-[#8C52FF]" />
              </div>
              <h3 className="text-lg font-semibold">Lightning Fast</h3>
              <p className="text-sm text-gray-600">
                SSD storage and optimized servers for maximum speed
              </p>
            </div>

            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <Shield className="h-8 w-8 text-[#8C52FF]" />
              </div>
              <h3 className="text-lg font-semibold">Secure & Protected</h3>
              <p className="text-sm text-gray-600">
                Free SSL, daily backups, and advanced security
              </p>
            </div>

            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <Clock className="h-8 w-8 text-[#8C52FF]" />
              </div>
              <h3 className="text-lg font-semibold">99.9% Uptime</h3>
              <p className="text-sm text-gray-600">
                Guaranteed uptime with enterprise infrastructure
              </p>
            </div>

            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <Globe className="h-8 w-8 text-[#8C52FF]" />
              </div>
              <h3 className="text-lg font-semibold">24/7 Support</h3>
              <p className="text-sm text-gray-600">
                Expert support team available anytime you need
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Money-Back Guarantee */}
      <section className="bg-gradient-to-r from-[#8C52FF] to-purple-600 py-12">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="mb-4 text-3xl font-bold">
            30-Day Money-Back Guarantee
          </h2>
          <p className="mx-auto max-w-2xl text-lg opacity-90">
            Try our hosting risk-free. If you're not satisfied within the first
            30 days, we'll refund your money—no questions asked.
          </p>
        </div>
      </section>
    </div>
  );
}
