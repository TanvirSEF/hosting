'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getTLDPricing } from '@/actions/domain-search-actions';
import { useCurrency } from '@/contexts/CurrencyContext';

// Category mapping helper
const getCategoryForTld = (tld: string): string => {
  const categories: Record<string, string> = {
    '.com': 'popular',
    '.net': 'popular',
    '.org': 'popular',
    '.co': 'popular',
    '.io': 'tech',
    '.app': 'tech',
    '.dev': 'tech',
    '.tech': 'tech',
    '.xyz': 'new',
    '.online': 'new',
    '.site': 'new',
    '.store': 'business',
    '.shop': 'business',
    '.biz': 'business',
  };
  return categories[tld] || 'all';
};

const CATEGORIES = [
  { id: 'all', labelKey: 'all' },
  { id: 'popular', labelKey: 'categoryPopular' },
  { id: 'new', labelKey: 'categoryNew' },
  { id: 'tech', labelKey: 'categoryTech' },
  { id: 'business', labelKey: 'categoryBusiness' },
];

interface TldPricing {
  ext: string;
  register: string;
  renew: string;
  transfer: string;
  popular: boolean;
  category: string;
}

export default function PricingTable() {
  const t = useTranslations('domains.pricing');
  const { currency } = useCurrency();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTld, setSearchTld] = useState('');

  const [tlds, setTlds] = useState<TldPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState('$');

  useEffect(() => {
    async function fetchPricing() {
      try {
        const result = await getTLDPricing(currency);

        if (result.success && result.data) {
          // Set currency symbol if available
          if (result.currency && result.currency.prefix) {
            setCurrencySymbol(result.currency.prefix);
          } else if (result.currency && result.currency.suffix) {
            setCurrencySymbol(result.currency.prefix || '$');
          }

          const pricingData = result.data;
          const tldKeys = Object.keys(pricingData);

          const processingPromises = tldKeys.map(async (key) => {
            const tldData = pricingData[key];
            const ext = key.startsWith('.') ? key : `.${key}`;

            const registerPriceRaw = tldData.register?.['1'] || tldData.register;
            const renewPriceRaw = tldData.renew?.['1'] || tldData.renew;
            const transferPriceRaw = tldData.transfer?.['1'] || tldData.transfer;

            const finalRegisterPrice = formatPrice(registerPriceRaw, result.currency?.prefix, result.currency?.suffix);

            return {
              ext,
              register: finalRegisterPrice,
              renew: formatPrice(renewPriceRaw, result.currency?.prefix, result.currency?.suffix),
              transfer: formatPrice(transferPriceRaw, result.currency?.prefix, result.currency?.suffix),
              popular: ['.com', '.net', '.org'].includes(ext),
              category: getCategoryForTld(ext),
            };
          });

          const formattedTlds = await Promise.all(processingPromises);

          // Sort by popularity/priority
          const priority = ['.com', '.net', '.org', '.io', '.co'];
          formattedTlds.sort((a, b) => {
            const idxA = priority.indexOf(a.ext);
            const idxB = priority.indexOf(b.ext);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.ext.localeCompare(b.ext);
          });

          setTlds(formattedTlds);
        }
      } catch (error) {
        console.error('Failed to load TLD pricing', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPricing();
  }, [currency]);

  const formatPrice = (price: any, prefix = '$', suffix = '') => {
    if (!price) return '-';
    // If price is already formatted or just a number
    return `${prefix}${price}${suffix}`;
  };

  const filteredTlds = tlds.filter((tld) => {
    const matchesCategory =
      activeCategory === 'all' || tld.category === activeCategory;
    const matchesSearch = tld.ext
      .toLowerCase()
      .includes(searchTld.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="relative overflow-hidden bg-[#FAFAFA] py-20">
      {/* Decorative Blob */}
      <div className="pointer-events-none absolute top-1/2 right-0 -mr-[100px] h-[500px] w-[280px] -translate-y-1/2 rotate-[8.31deg] bg-[rgba(167,120,250,0.5)] opacity-40 blur-[80px]" />

      <div className="relative z-10 container mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h2 className="font-dm-sans mb-4 text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-bold text-[#1E1F21]">
            {t('title')}
          </h2>
          <p className="font-dm-sans text-[clamp(1rem,2vw,1.125rem)] leading-[1.3] font-normal text-[#667085]">
            {t('subtitle')}
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'font-dm-sans rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300',
                activeCategory === cat.id
                  ? 'bg-[#8C52FF] text-white shadow-lg shadow-[#8C52FF]/20'
                  : 'border border-gray-200 bg-[#FAFAFA] text-[#667085] hover:bg-[#F9F6FF] hover:text-[#8C52FF]'
              )}
            >
              {t(cat.labelKey)}
            </button>
          ))}
        </div>

        {/* Search TLD - Homepage Consistent Style */}
        <div className="mx-auto mb-10 max-w-lg">
          <div className="flex items-center gap-3 rounded-full border border-[#EAECF0] bg-white p-2 pr-2 pl-4 shadow-[0px_4px_35px_rgba(0,0,0,0.08)] transition-all duration-300 hover:shadow-[0px_6px_40px_rgba(0,0,0,0.12)] md:pl-6">
            <div className="flex flex-1 items-center gap-3 overflow-hidden">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 shrink-0 text-[#1E1F21] opacity-80"
              >
                <circle
                  cx="10"
                  cy="10"
                  r="6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14.5 14.5L21 21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                type="text"
                value={searchTld}
                onChange={(e) => setSearchTld(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="font-dm-sans w-full truncate border-none bg-transparent text-[1rem] text-[#1E1F21] outline-none placeholder:text-[#667085]/70"
              />
            </div>
          </div>
        </div>

        {/* Pricing Table */}
        <div className="overflow-x-auto rounded-[24px] border border-gray-200 bg-white shadow-lg">
          <table className="w-full min-w-[700px]">
            <thead className="border-b border-gray-100 bg-[#FAFAFA]">
              <tr>
                <th className="font-dm-sans p-6 text-left font-bold text-[#1E1F21]">
                  {t('tld')}
                </th>
                <th className="font-dm-sans p-6 text-center font-bold text-[#1E1F21]">
                  {t('register')}
                </th>
                <th className="font-dm-sans p-6 text-center font-bold text-[#1E1F21]">
                  {t('renew')}
                </th>
                <th className="font-dm-sans p-6 text-center font-bold text-[#1E1F21]">
                  {t('transfer')}
                </th>
                <th className="p-6"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8C52FF] border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredTlds.length > 0 ? (
                filteredTlds.map((domain, index) => (
                  <tr
                    key={index}
                    className="group border-t border-gray-100 transition-colors hover:bg-[#F9F6FF]/50"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <span className="font-dm-sans text-xl font-bold text-[#1E1F21] transition-colors group-hover:text-[#8C52FF]">
                          {domain.ext}
                        </span>
                        {domain.popular && (
                          <span className="rounded-full bg-[#8C52FF] px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
                            {t('popular')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-dm-sans text-lg font-bold text-[#1E1F21]">
                          {domain.register}
                        </span>
                      </div>
                      <span className="font-dm-sans block text-xs text-gray-400">
                        /{t('year')}
                      </span>
                    </td>
                    <td className="p-6 text-center">
                      <span className="font-dm-sans font-medium text-[#667085]">
                        {domain.renew}
                      </span>
                      <span className="font-dm-sans block text-xs text-gray-400">
                        /{t('year')}
                      </span>
                    </td>
                    <td className="p-6 text-center">
                      <span className="font-dm-sans font-medium text-[#667085]">
                        {domain.transfer}
                      </span>
                      <span className="font-dm-sans block text-xs text-gray-400">
                        /{t('year')}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <Button
                        asChild
                        className="rounded-full bg-[#8C52FF] px-6 font-semibold text-white shadow-lg shadow-[#8C52FF]/20 transition-all hover:-translate-y-0.5 hover:bg-[#7b42ff]"
                      >
                        <Link href="/domain-search">
                          {t('registerBtn')}
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="font-dm-sans p-12 text-center text-gray-500"
                  >
                    {t('noResults')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
