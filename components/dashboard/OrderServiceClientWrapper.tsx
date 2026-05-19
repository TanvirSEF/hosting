'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardTranslationProvider } from '@/components/DashboardTranslationProvider';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useDashboardTranslation } from '@/components/DashboardTranslationProvider';
import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Server,
  Loader2,
  Check,
  Package,
  Layers,
  Cloud,
  Database,
  Mail,
  Cpu,
  Globe,
  Shield,
  Gamepad2,
  Radio,
  MoreHorizontal
} from 'lucide-react';
import {
  createServiceOrderAction,
  calculateServicePriceAction,
} from '@/actions/service-order-actions';
import { getOrderProductsForCurrencyAction } from '@/actions/hosting-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrency } from '@/contexts/CurrencyContext';
import { PromotionalBanner } from '@/components/dashboard/promotional-banner';
import { selectDiscountRuleForCycle } from '@/lib/discount-module';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface OrderServiceContentProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    firstname: string;
  };
  products: any[];
  groups: any[];
  promotions: any[];
  discountRules: any;
}

// Icon mapping for categories by ID (from env)
const GID_ICONS: Record<string, any> = {
  [process.env.NEXT_PUBLIC_SHARED_HOSTING_GID || '1']: Layers,
  [process.env.NEXT_PUBLIC_WORDPRESS_HOSTING_GID || '3']: Globe,
  [process.env.NEXT_PUBLIC_VPS_HOSTING_GID || '2']: Cloud,
  [process.env.NEXT_PUBLIC_ECOMMERCE_HOSTING_GID || '4']: Package,
  [process.env.NEXT_PUBLIC_EMAIL_SERVICE_GID || '7']: Mail,
};

// Name mapping for categories by ID (from env)
const GID_NAMES: Record<string, string> = {
  [process.env.NEXT_PUBLIC_SHARED_HOSTING_GID || '1']: 'Shared Hosting',
  [process.env.NEXT_PUBLIC_WORDPRESS_HOSTING_GID || '3']: 'WordPress Hosting',
  [process.env.NEXT_PUBLIC_VPS_HOSTING_GID || '2']: 'VPS Hosting',
  [process.env.NEXT_PUBLIC_ECOMMERCE_HOSTING_GID || '4']: 'Ecommerce Hosting',
  [process.env.NEXT_PUBLIC_EMAIL_SERVICE_GID || '7']: 'Email Service',
};

// Fallback name-based mapping
const NAME_ICONS: Record<string, any> = {
  'Dedicated Servers': Database,
  'Reseller Hosting': Package,
  'Email Hosting': Mail,
  'Radio Hosting': Radio,
  'Game Servers': Gamepad2,
  'Website & Security': Shield,
  'Other Products': MoreHorizontal,
};

function getCategoryIcon(group: { id: number | string, name?: string }) {
  // 1. Try matching by GID
  const gid = String(group.id);
  if (GID_ICONS[gid]) {
    return GID_ICONS[gid];
  }

  // 2. Try matching by Name
  if (group.name) {
    const normalized = Object.keys(NAME_ICONS).find(key => group.name!.toLowerCase().includes(key.toLowerCase()));
    if (normalized) {
      return NAME_ICONS[normalized];
    }
  }

  // 3. Fallback
  return Package;
}

const DEFAULT_FEATURES = [
  'Free SSL Certificate',
  'cPanel Control Panel',
  '1-Click App Installs',
  'LiteSpeed Cache Optimization',
  '99.9% Uptime Guarantee',
  'Unlimited Bandwidth',
  'Fast NVMe Storage',
  'Free Website Migration',
];

function parseFeatures(description: string): string[] {
  if (!description) return DEFAULT_FEATURES;

  // Robust parsing matching Home page logic
  // Normalize HTML line breaks to newlines
  const withNewlines = description
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n')
    .replace(/<li>/gi, '\n') // Handle list items as new lines
    .replace(/<\/li>/gi, '');

  const lines = withNewlines.split('\n');

  const features = lines
    .map((line) => {
      // Strip tags and decode entities
      let text = line.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      text = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
      return text;
    })
    .filter((text) => text.length > 2); // Filter out empty or too short lines

  return features.length > 0 ? features.slice(0, 10) : DEFAULT_FEATURES;
}

const EMAIL_DEFAULT_FEATURES = [
  'Professional Email Address',
  'Secure & Reliable',
  'Mobile & Desktop Sync',
  'Spam & Virus Protection',
  'Webmail Access',
  'Calendar & Contacts',
  'Ad-free Experience',
  '99.9% Uptime'
];

function getFeaturesForProduct(product: any, isEmailGroup: boolean) {
  if (product.features && product.features.length > 0) {
    return product.features;
  }

  const parsed = parseFeatures(product.description || '');
  // If parsed features are just the default ones, and we are in email group, return email defaults
  if (isEmailGroup && (parsed === DEFAULT_FEATURES || product.description?.length < 10)) {
    return EMAIL_DEFAULT_FEATURES;
  }

  return parsed;
}

function OrderServiceContent({
  user,
  products,
  groups,
  promotions,
  discountRules,
}: OrderServiceContentProps) {
  const { t } = useDashboardTranslation();
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const billingCycle: 'monthly' | 'annually' = 'annually';
  const [domain, setDomain] = useState<string>('');
  const [loadingOrders, setLoadingOrders] = useState<Record<number, boolean>>({});
  const { currency, formatPrice } = useCurrency();
  // Map of pid → pricing object for the selected currency (fetched from WHMCS)
  const [currencyPricing, setCurrencyPricing] = useState<Record<number, any> | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const fetchedCurrencyRef = useRef<string | null>(null);

  // Re-fetch WHMCS pricing when currency changes — no fallback, clear stale data
  useEffect(() => {
    if (!currency) return;
    if (fetchedCurrencyRef.current === currency) return;

    const fetchPricing = async () => {
      setIsLoadingPricing(true);
      // Clear stale data immediately so no wrong-currency prices flash
      setCurrencyPricing(null);
      try {
        const result = await getOrderProductsForCurrencyAction(currency);
        if (result.success && result.data) {
          setCurrencyPricing(result.data as Record<number, any>);
          fetchedCurrencyRef.current = currency;
        }
      } catch (e) {
        console.error('Failed to fetch pricing for currency', currency, e);
      } finally {
        setIsLoadingPricing(false);
      }
    };
    fetchPricing();
  }, [currency]);

  // Set initial group
  useEffect(() => {
    if (groups.length > 0 && !selectedGroup) {
      setSelectedGroup(String(groups[0].id));
    }
  }, [groups, selectedGroup]);

  // Filter products by selected group
  const displayedProducts = useMemo(() => {
    if (!selectedGroup) return [];
    return products.filter((p) => String(p.gid) === selectedGroup);
  }, [products, selectedGroup]);

  const handleOrderClick = (product: any) => {
    // Redirect to public hosting order page with plan ID
    // Default to 'en' locale - you can enhance this to get actual user locale
    router.push(`/en/order/hosting?plan=${product.id}`);
  };


  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-6 max-w-[1600px] mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Category Sidebar */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-card rounded-xl border shadow-sm p-4 sticky top-6">
                <h3 className="font-semibold mb-4 px-2">Categories</h3>
                <div className="space-y-1">
                  {(() => {
                    // Define desired order using env GIDs
                    const sharedGid = process.env.NEXT_PUBLIC_SHARED_HOSTING_GID || '1';
                    const vpsGid = process.env.NEXT_PUBLIC_VPS_HOSTING_GID || '2';
                    const wpGid = process.env.NEXT_PUBLIC_WORDPRESS_HOSTING_GID || '3';
                    const ecomGid = process.env.NEXT_PUBLIC_ECOMMERCE_HOSTING_GID || '4';
                    const emailGid = process.env.NEXT_PUBLIC_EMAIL_SERVICE_GID || '7';

                    const desiredOrder = [sharedGid, vpsGid, wpGid, ecomGid, emailGid];

                    // Filter groups to only include desired ones and sort them
                    const sortedGroups = groups
                      .filter(g => desiredOrder.includes(String(g.id)))
                      .sort((a, b) => {
                        return desiredOrder.indexOf(String(a.id)) - desiredOrder.indexOf(String(b.id));
                      });

                    return sortedGroups.map((group) => {
                      const Icon = getCategoryIcon(group);
                      const isActive = String(group.id) === selectedGroup;
                      // @ts-ignore
                      const displayName = GID_NAMES[String(group.id)] || group.name;

                      return (
                        <button
                          key={group.id}
                          onClick={() => setSelectedGroup(String(group.id))}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {displayName}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-9 space-y-6">
              <div className="flex items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
                <h2 className="text-xl font-bold">
                  {(() => {
                    const group = groups.find(g => String(g.id) === selectedGroup);
                    if (!group) return 'Products';
                    // @ts-ignore
                    return GID_NAMES[String(group.id)] || group.name;
                  })()}
                </h2>
              </div>

              {/* Domain Input for Email Services */}
              {selectedGroup === (process.env.NEXT_PUBLIC_EMAIL_SERVICE_GID || '7') && (
                <div className="bg-card p-4 rounded-xl border shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium">Domain Name</h3>
                    <Link href="/dashboard/domain-register" className="text-xs text-primary hover:underline">
                      Don&apos;t have a domain? Register one
                    </Link>
                  </div>
                  <div className="flex gap-4">
                    <Input
                      placeholder="Enter your domain (e.g. example.com)"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="max-w-md"
                    />
                    <div className="text-sm text-muted-foreground self-center">
                      * Required for email services
                    </div>
                  </div>
                </div>
              )}

              <Carousel
                opts={{
                  align: 'start',
                }}
                className="w-full relative px-12"
              >
                <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2" />
                <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2" />
                <CarouselContent className="-ml-3 pb-4">
                  {/* Skeleton state — shown while correct-currency pricing is loading */}
                  {(isLoadingPricing || currencyPricing === null) &&
                    Array.from({ length: Math.max(displayedProducts.length, 3) }).map((_, i) => (
                      <CarouselItem key={i} className="pl-3 md:basis-1/2 xl:basis-1/3">
                        <div className="animate-pulse flex h-full flex-col bg-card rounded-2xl border overflow-hidden">
                          <div className="p-6 flex-1 flex flex-col gap-4">
                            {/* Title */}
                            <div className="h-5 w-1/2 rounded bg-muted" />
                            {/* Subtitle */}
                            <div className="h-3 w-3/4 rounded bg-muted/70" />
                            {/* Price block */}
                            <div className="mt-2 space-y-2">
                              <div className="h-3 w-20 rounded bg-muted/60" />
                              <div className="h-9 w-32 rounded bg-muted" />
                              <div className="h-3 w-24 rounded bg-muted/50" />
                            </div>
                            {/* Features */}
                            <div className="space-y-2 mt-2">
                              {[1, 2, 3, 4, 5, 6].map((j) => (
                                <div key={j} className="flex items-center gap-3">
                                  <div className="h-4 w-4 rounded-full bg-muted shrink-0" />
                                  <div className="h-3 rounded bg-muted/60" style={{ width: `${50 + j * 7}%` }} />
                                </div>
                              ))}
                            </div>
                            {/* Button */}
                            <div className="mt-auto pt-4 h-11 w-full rounded-xl bg-muted" />
                          </div>
                        </div>
                      </CarouselItem>
                    ))}

                {/* Real cards — only when pricing confirmed for current currency */}
                {!isLoadingPricing &&
                  currencyPricing !== null &&
                  displayedProducts.map((product) => {
                    const productPricing = currencyPricing[product.pid] || currencyPricing[product.id];

                    // Skip this product if no pricing found for this currency
                    if (!productPricing) return null;

                    let displayPrice = 0;
                    const cycleSuffix = '/mo';

                    const annualPrice = parseFloat(productPricing.annually || '0');
                    if (annualPrice > 0) {
                      displayPrice = annualPrice / 12;
                    } else {
                      displayPrice = parseFloat(productPricing.monthly || '0');
                    }

                    if (displayPrice <= 0) return null;

                    const isEmailGroup =
                      String(product.gid) === (process.env.NEXT_PUBLIC_EMAIL_SERVICE_GID || '7');
                    const features = getFeaturesForProduct(product, isEmailGroup);

                    let discountPercentage = 0;
                    if (discountRules && discountRules[product.id]) {
                      const rule = selectDiscountRuleForCycle(discountRules[product.id], billingCycle);
                      if (rule && rule.percentage) discountPercentage = rule.percentage;
                    }

                    const hasDiscount = discountPercentage > 0;
                    const finalPrice = hasDiscount
                      ? displayPrice * (1 - discountPercentage / 100)
                      : displayPrice;

                    const tagline =
                      product.tagline ||
                      product.description?.split('\n')[0].replace(/<[^>]+>/g, '').trim() ||
                      '';

                    const isOrdering = loadingOrders[product.id];

                    return (
                      <CarouselItem key={product.pid} className="pl-3 md:basis-1/2 xl:basis-1/3">
                        <div
                          className="group relative flex h-full flex-col bg-card rounded-2xl border transition-all duration-300 hover:border-primary/50 hover:shadow-lg overflow-hidden"
                        >
                          {hasDiscount && (
                            <div className="absolute top-4 right-4 z-10">
                              <Badge className="bg-[#8C52FF] hover:bg-[#7b46e0] text-white font-bold px-3 py-1 text-xs uppercase tracking-wider">
                                Save {discountPercentage}%
                              </Badge>
                            </div>
                          )}

                          <div className="p-6 flex-1 flex flex-col">
                            <h3 className="font-bold text-lg uppercase tracking-tight">{product.name}</h3>
                            {tagline && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{tagline}</p>
                            )}

                            <div className="mt-4 mb-6">
                              <p className="text-sm text-muted-foreground">Starting from</p>
                              <div className="flex flex-col">
                                {hasDiscount && (
                                  <span className="text-muted-foreground line-through text-sm font-medium">
                                    {formatPrice(displayPrice)}{cycleSuffix}
                                  </span>
                                )}
                                <div className="flex items-baseline gap-1">
                                  <span className="text-3xl font-extrabold tracking-tight">
                                    {formatPrice(finalPrice)}
                                  </span>
                                  <span className="text-muted-foreground font-medium text-sm">{cycleSuffix}</span>
                                </div>
                                {billingCycle === 'annually' && (
                                  <p className="text-xs text-muted-foreground mt-1">Billed Annually</p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-3 mb-6 flex-1">
                              {features.slice(0, 8).map((feature: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-3 text-sm">
                                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                  <span className="text-muted-foreground leading-snug">{feature}</span>
                                </div>
                              ))}
                            </div>

                            <Button
                              onClick={() => handleOrderClick(product)}
                              disabled={isOrdering}
                              className="w-full rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 h-11"
                            >
                              {isOrdering ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                'ORDER NOW'
                              )}
                            </Button>
                          </div>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
              </Carousel>

              {displayedProducts.length === 0 && (
                <div className="text-center py-20 bg-card rounded-xl border border-dashed">
                  <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <h3 className="text-lg font-medium">No products found</h3>
                  <p className="text-muted-foreground">Select a different category to view products.</p>
                </div>
              )}
            </div>

          </div>
        </div>



      </SidebarInset>
    </SidebarProvider >
  );
}

interface OrderServiceClientWrapperProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    firstname: string;
  } | null;
  products: any[];
  groups: any[];
  promotions: any[];
  discountRules: any;
}

function OrderServiceErrorMessage() {
  const { t } = useDashboardTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center">
      {t('services.error.loginRequired')}
    </div>
  );
}

export function OrderServiceClientWrapper({
  user,
  products,
  groups,
  promotions,
  discountRules,
}: OrderServiceClientWrapperProps) {
  if (!user) {
    return (
      <DashboardTranslationProvider>
        <OrderServiceErrorMessage />
      </DashboardTranslationProvider>
    );
  }

  return (
    <DashboardTranslationProvider>
      <OrderServiceContent
        user={user}
        products={products}
        groups={groups}
        promotions={promotions}
        discountRules={discountRules}
      />
    </DashboardTranslationProvider>
  );
}
