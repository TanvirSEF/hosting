import { Check, X, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Define interface for spec rows
interface SpecRow {
  name: string;
  standard: string | boolean;
  pro: string | boolean;
  business: string | boolean;
  tip?: string;
}

interface SpecCategory {
  title: string;
  rows: SpecRow[];
}

export default function TechnicalSpecs() {
  // This could also be internationalized, keeping hardcoded for speed as per user "mock" style or just detailed constants
  const categories: SpecCategory[] = [
    {
      title: 'Performance',
      rows: [
        {
          name: 'NVMe Storage',
          standard: '50 GB',
          pro: '100 GB',
          business: '200 GB',
          tip: 'Ultra-fast storage for quicker load times.',
        },
        {
          name: 'RAM',
          standard: '1 GB',
          pro: '2 GB',
          business: '4 GB',
          tip: 'Dedicated memory for your processes.',
        },
        {
          name: 'CPU Cores',
          standard: '1 Core',
          pro: '2 Cores',
          business: '4 Cores',
        },
        {
          name: 'Bandwidth',
          standard: 'Unlimited',
          pro: 'Unlimited',
          business: 'Unlimited',
        },
      ],
    },
    {
      title: 'Security',
      rows: [
        { name: 'SSL Certificate', standard: true, pro: true, business: true },
        { name: 'DDoS Protection', standard: true, pro: true, business: true },
        { name: 'Daily Backups', standard: false, pro: true, business: true },
        {
          name: 'Web Application Firewall',
          standard: true,
          pro: true,
          business: true,
        },
      ],
    },
    {
      title: 'Email',
      rows: [
        {
          name: 'Email Accounts',
          standard: '10',
          pro: '100',
          business: 'Unlimited',
        },
        {
          name: 'Mailbox Size',
          standard: '1 GB',
          pro: '1 GB',
          business: '5 GB',
        },
        { name: 'Webmail Access', standard: true, pro: true, business: true },
      ],
    },
    {
      title: 'Developer Features',
      rows: [
        {
          name: 'PHP Version Control',
          standard: true,
          pro: true,
          business: true,
        },
        { name: 'SSH Access', standard: false, pro: true, business: true },
        { name: 'Git Integration', standard: false, pro: true, business: true },
        { name: 'WP-CLI', standard: false, pro: true, business: true },
      ],
    },
  ];

  const renderValue = (val: string | boolean) => {
    if (typeof val === 'boolean') {
      return val ? (
        <Check className="mx-auto h-5 w-5 text-green-500" />
      ) : (
        <X className="mx-auto h-5 w-5 text-gray-300" />
      );
    }
    return <span className="font-medium text-[#1E1F21]">{val}</span>;
  };

  return (
    <section className="bg-[#FAFAFA] py-24" id="specs">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#1E1F21] md:text-4xl">
            Technical Specifications
          </h2>
          <p className="text-lg text-[#667085]">
            Detailed breakdown of all features included in our plans.
          </p>
        </div>

        <div className="space-y-12">
          {categories.map((category, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h3 className="text-xl font-bold text-[#1E1F21]">
                  {category.title}
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {category.rows.map((row, rIdx) => (
                  <div
                    key={rIdx}
                    className="grid grid-cols-2 items-center p-4 transition-colors hover:bg-gray-50/50 md:grid-cols-4"
                  >
                    <div className="col-span-2 mb-2 flex items-center gap-2 md:col-span-1 md:mb-0">
                      <span className="font-medium text-gray-700">
                        {row.name}
                      </span>
                      {row.tip && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-gray-400 hover:text-[#8C52FF]" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{row.tip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    {/* Mobile view usually stacks, here we act as if it's a 3-plan comparo */}
                    {/* In a real scenario, we might hide columns on mobile or use a slider. For now, using grid layout. */}
                    <div className="border-r border-gray-100 pt-2 text-center text-sm md:border-none md:pt-0 md:text-base">
                      <span className="mb-1 block text-xs text-gray-400 md:hidden">
                        Standard
                      </span>
                      {renderValue(row.standard)}
                    </div>
                    <div className="border-r border-gray-100 pt-2 text-center text-sm md:border-none md:pt-0 md:text-base">
                      <span className="mb-1 block text-xs text-gray-400 md:hidden">
                        Pro
                      </span>
                      {renderValue(row.pro)}
                    </div>
                    <div className="pt-2 text-center text-sm md:pt-0 md:text-base">
                      <span className="mb-1 block text-xs text-gray-400 md:hidden">
                        Business
                      </span>
                      {renderValue(row.business)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
