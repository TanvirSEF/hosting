'use client';

import * as React from 'react';
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
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  Check,
  X,
  AlertCircle,
  Search,
  Globe,
  ArrowRight,
  Shield,
  Mail,
  Zap,
  Clock,
  Lock,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { useState, useTransition } from 'react';
import {
  checkDomainAvailabilityAction,
  getTLDPricingAction,
  createDomainOrderAction,
} from '@/actions/domain-order-actions';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useDashboardTranslation } from '@/components/DashboardTranslationProvider';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface DomainTransferClientWrapperProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    firstname: string;
  } | null;
}

interface TransferCheckResult {
  domain: string;
  tld: string;
  eligible: boolean;
  status: string;
  reason?: string;
}

function DomainTransferContent({ user }: DomainTransferClientWrapperProps) {
  const { t } = useDashboardTranslation();
  const { formatPrice, currency } = useCurrency();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [transferResult, setTransferResult] = useState<TransferCheckResult | null>(null);

  const [eppCode, setEppCode] = useState('');
  const [selectedAddons, setSelectedAddons] = useState({
    dnsmanagement: false,
    emailforwarding: false,
    idprotection: false,
  });

  const [isTransferring, startTransfer] = useTransition();
  const [unlockGuideOpen, setUnlockGuideOpen] = useState(false);

  const [whmcsPricing, setWhmcsPricing] = useState<Record<string, any> | null>(null);

  React.useEffect(() => {
    const fetchPricing = async () => {
      try {
        const pricingResult = await getTLDPricingAction(currency);
        if (pricingResult.success && pricingResult.data) {
          setWhmcsPricing(pricingResult.data);
        }
      } catch {
        // Error fetching pricing
      }
    };
    fetchPricing();
  }, [currency]);

  const normalizeDomainInput = (value: string) => {
    return (value || '')
      .toLowerCase()
      .trim()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .replace(/\/$/, '')
      .replace(/\.+$/, '');
  };

  const getPriceFromBlock = (pricingData: any, kind: string): number => {
    const block = pricingData?.[kind];
    if (!block) return 0;

    let candidate = null;

    if (typeof block === 'object') {
      candidate = block['1'] ?? block[1] ?? block['1.00'] ?? block['1.0'];
    } else {
      candidate = block;
    }

    if (candidate != null) {
      const raw = typeof candidate === 'object'
        ? (candidate as any).price ?? (candidate as any).amount ?? candidate
        : candidate;
      const cleaned = String(raw).replace(/\b[A-Z]{3}\b/g, '').replace(/[^\d.]/g, '');
      const parsed = parseFloat(cleaned);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }

    return 0;
  };

  const getTransferPrice = (tld: string): number => {
    if (!whmcsPricing) return 0;

    const tldKey = tld.startsWith('.') ? tld.substring(1) : tld;
    const tldWithDot = tld.startsWith('.') ? tld : `.${tld}`;
    const pricingData =
      whmcsPricing[tld] || whmcsPricing[tldKey] || whmcsPricing[tldWithDot];

    if (!pricingData) return 0;

    // Try transfer price first, then renew, then register (same fallback as landing page Hero)
    return getPriceFromBlock(pricingData, 'transfer')
      || getPriceFromBlock(pricingData, 'renew')
      || getPriceFromBlock(pricingData, 'register')
      || 0;
  };

  const getAvailableAddons = (
    tld: string
  ): { id: string; name: string; price: number }[] => {
    if (!whmcsPricing) return [];

    const tldKey = tld.startsWith('.') ? tld.substring(1) : tld;
    const tldWithDot = tld.startsWith('.') ? tld : `.${tld}`;
    const pricingData =
      whmcsPricing[tld] || whmcsPricing[tldKey] || whmcsPricing[tldWithDot];

    const addonsData = pricingData?.addons || {};
    const addons: { id: string; name: string; price: number }[] = [];

    const getAddonPrice = (addonKey: string): number => {
      const addonData = addonsData[addonKey];
      if (!addonData) return 0;
      if (addonData.pricing && addonData.pricing[1]) {
        return parseFloat(addonData.pricing[1]) || 0;
      }
      if (typeof addonData === 'number') {
        return addonData;
      }
      return 0;
    };

    if (addonsData.dns || addonsData.dnsmanagement) {
      addons.push({
        id: 'dnsmanagement',
        name: t('domainTransfer.addons.dnsManagement'),
        price: getAddonPrice('dnsmanagement') || getAddonPrice('dns'),
      });
    }

    if (addonsData.email || addonsData.emailforwarding) {
      addons.push({
        id: 'emailforwarding',
        name: t('domainTransfer.addons.emailForwarding'),
        price: getAddonPrice('emailforwarding') || getAddonPrice('email'),
      });
    }

    if (addonsData.idprotect || addonsData.idprotection) {
      addons.push({
        id: 'idprotection',
        name: t('domainTransfer.addons.idProtection'),
        price: getAddonPrice('idprotection') || getAddonPrice('idprotect'),
      });
    }

    return addons;
  };

  const handleCheckTransfer = () => {
    const cleanedTerm = normalizeDomainInput(searchTerm);

    if (!cleanedTerm) {
      setError(t('domainTransfer.error.empty'));
      return;
    }

    const domainPart = cleanedTerm.split('.')[0];
    if (
      !domainPart ||
      !/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*$/.test(domainPart)
    ) {
      setError(t('domainTransfer.error.invalid'));
      return;
    }

    if (!cleanedTerm.includes('.')) {
      setError(t('domainTransfer.error.invalid'));
      return;
    }

    setError(null);
    setTransferResult(null);
    setEppCode('');
    setSelectedAddons({
      dnsmanagement: false,
      emailforwarding: false,
      idprotection: false,
    });

    startTransition(async () => {
      const response = await checkDomainAvailabilityAction(cleanedTerm);

      if (response.success && response.data) {
        const status = response.data.status;
        const tld = '.' + cleanedTerm.split('.').slice(1).join('.');

        if (status === 'available') {
          setTransferResult({
            domain: cleanedTerm,
            tld,
            eligible: false,
            status: 'available',
            reason: t('domainTransfer.result.available'),
          });
        } else {
          setTransferResult({
            domain: cleanedTerm,
            tld,
            eligible: true,
            status: 'registered',
          });
        }
      } else {
        setError(response.error || t('domainTransfer.error.failed'));
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCheckTransfer();
    }
  };

  const handleTransfer = () => {
    if (!transferResult) return;

    const trimmedEpp = (eppCode || '').trim();
    if (!trimmedEpp) {
      toast.error(t('domainTransfer.epp.required'));
      return;
    }

    if (trimmedEpp.length < 4 || trimmedEpp.length > 255) {
      toast.error(t('domainTransfer.epp.invalid'));
      return;
    }

    if (!/^[!-~]+$/.test(trimmedEpp)) {
      toast.error(t('domainTransfer.epp.invalid'));
      return;
    }

    startTransfer(async () => {
      const addons: { id: string; name: string; price: number }[] = [];
      const availableAddons = getAvailableAddons(transferResult.tld);

      for (const addon of availableAddons) {
        if (selectedAddons[addon.id as keyof typeof selectedAddons]) {
          addons.push(addon);
        }
      }

      const result = await createDomainOrderAction({
        domain: transferResult.domain,
        years: 1,
        currency,
        domainType: 'transfer',
        eppCode: trimmedEpp,
        addons: addons.length > 0 ? addons : undefined,
      });

      if (result.success) {
        toast.success(t('domainTransfer.order.success'));
        const invoiceId = result.invoiceId;
        if (invoiceId) {
          setTimeout(() => {
            router.push(
              `/dashboard/billing?invoice=${invoiceId}&highlight=true`
            );
          }, 1500);
        }
      } else {
        toast.error(result.error || t('domainTransfer.order.error'));
      }
    });
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setTransferResult(null);
    setError(null);
    setEppCode('');
    setSelectedAddons({
      dnsmanagement: false,
      emailforwarding: false,
      idprotection: false,
    });
  };

  if (!user) {
    return null;
  }

  const transferPrice = transferResult
    ? getTransferPrice(transferResult.tld)
    : 0;
  const availableAddons = transferResult
    ? getAvailableAddons(transferResult.tld)
    : [];
  const addonsTotal = availableAddons
    .filter((a) => selectedAddons[a.id as keyof typeof selectedAddons])
    .reduce((sum, a) => sum + a.price, 0);
  const totalPrice = transferPrice + addonsTotal;

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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Header */}
              <div className="px-4 lg:px-6">
                <h1 className="text-foreground text-3xl font-bold tracking-tight">
                  {t('domainTransfer.title')}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {t('domainTransfer.subtitle')}
                </p>
              </div>

              <div className="space-y-6 px-4 lg:px-6">
                {/* Search Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      {t('domainTransfer.search.title')}
                    </CardTitle>
                    <CardDescription>
                      {t('domainTransfer.search.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                          placeholder={t(
                            'domainTransfer.search.placeholder'
                          )}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="pl-9"
                        />
                      </div>
                      <Button
                        onClick={handleCheckTransfer}
                        disabled={isPending}
                        className="px-6"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('domainTransfer.search.searching')}
                          </>
                        ) : (
                          <>
                            <Search className="mr-2 h-4 w-4" />
                            {t('domainTransfer.search.button')}
                          </>
                        )}
                      </Button>
                    </div>

                    {error && (
                      <div className="text-destructive bg-destructive/10 mt-4 flex items-center gap-2 rounded-md p-3 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Transfer Result Card */}
                {transferResult && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          {transferResult.eligible ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <X className="h-5 w-5 text-red-600" />
                          )}
                          {transferResult.domain}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearSearch}
                        >
                          {t('domainTransfer.result.checkAgain')}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {transferResult.eligible ? (
                        <>
                          {/* Eligible banner */}
                          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
                            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium text-green-800 dark:text-green-200">
                              {t('domainTransfer.result.eligible')}
                            </span>
                          </div>

                          {/* Features */}
                          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            <div className="flex items-center gap-2 rounded-lg border p-3">
                              <Clock className="h-4 w-4 text-purple-500" />
                              <span className="text-xs font-medium">
                                {t(
                                  'domainTransfer.features.freeYear'
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border p-3">
                              <Shield className="h-4 w-4 text-purple-500" />
                              <span className="text-xs font-medium">
                                {t(
                                  'domainTransfer.features.whoisPrivacy'
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border p-3">
                              <Zap className="h-4 w-4 text-purple-500" />
                              <span className="text-xs font-medium">
                                {t(
                                  'domainTransfer.features.dnsManagement'
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border p-3">
                              <Mail className="h-4 w-4 text-purple-500" />
                              <span className="text-xs font-medium">
                                {t(
                                  'domainTransfer.features.support'
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Transfer Price */}
                          <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                              <span className="text-sm font-medium">
                                {t(
                                  'domainTransfer.result.transferPrice'
                                )}
                              </span>
                              <span className="text-muted-foreground ml-2 text-xs">
                                {t(
                                  'domainTransfer.result.perYear'
                                )}
                              </span>
                            </div>
                            {transferPrice > 0 ? (
                              <span className="text-2xl font-bold">
                                {formatPrice(transferPrice)}
                              </span>
                            ) : !whmcsPricing ? (
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            ) : (
                              <span className="text-muted-foreground text-lg">-</span>
                            )}
                          </div>

                          {/* EPP Code */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              {t('domainTransfer.epp.label')}
                            </label>
                            <Input
                              placeholder={t(
                                'domainTransfer.epp.placeholder'
                              )}
                              value={eppCode}
                              onChange={(e) => setEppCode(e.target.value)}
                              type="text"
                            />
                            <p className="text-muted-foreground text-xs">
                              {t('domainTransfer.epp.help')}
                            </p>
                          </div>

                          {/* Add-ons */}
                          {availableAddons.length > 0 && (
                            <div className="space-y-3">
                              <h3 className="text-sm font-medium">
                                {t(
                                  'domainTransfer.addons.title'
                                )}
                              </h3>
                              {availableAddons.map((addon) => (
                                <div
                                  key={addon.id}
                                  className="flex items-center justify-between rounded-lg border p-3"
                                >
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      id={addon.id}
                                      checked={
                                        selectedAddons[
                                          addon.id as keyof typeof selectedAddons
                                        ]
                                      }
                                      onCheckedChange={(checked) =>
                                        setSelectedAddons(
                                          (prev) => ({
                                            ...prev,
                                            [addon.id]: !!checked,
                                          })
                                        )
                                      }
                                    />
                                    <label
                                      htmlFor={addon.id}
                                      className="cursor-pointer text-sm font-medium"
                                    >
                                      {addon.name}
                                    </label>
                                  </div>
                                  {addon.price > 0 && (
                                    <span className="text-sm font-medium">
                                      {formatPrice(addon.price)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Order Summary */}
                          <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                            <h3 className="text-sm font-semibold">
                              {t(
                                'domainTransfer.order.summary'
                              )}
                            </h3>
                            <div className="flex items-center justify-between text-sm">
                              <span>
                                {t(
                                  'domainTransfer.order.domain'
                                )}
                              </span>
                              <span>
                                {transferResult.domain}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>
                                {t(
                                  'domainTransfer.order.period'
                                )}
                              </span>
                              <span>{t('domainTransfer.order.oneYear')}</span>
                            </div>
                            {addonsTotal > 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span>
                                  {t(
                                    'domainTransfer.addons.title'
                                  )}
                                </span>
                                <span>
                                  {formatPrice(addonsTotal)}
                                </span>
                              </div>
                            )}
                            <div className="border-t pt-2">
                              <div className="flex items-center justify-between font-semibold">
                                <span>
                                  {t(
                                    'domainTransfer.order.total'
                                  )}
                                </span>
                                <span>
                                  {formatPrice(totalPrice)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Transfer Button */}
                          <Button
                            onClick={handleTransfer}
                            disabled={
                              isTransferring || !eppCode.trim() || transferPrice <= 0
                            }
                            className="w-full bg-[#8C52FF] hover:bg-[#7b42ff]"
                            size="lg"
                          >
                            {isTransferring ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t(
                                  'domainTransfer.order.processing'
                                )}
                              </>
                            ) : (
                              <>
                                <ArrowRight className="mr-2 h-4 w-4" />
                                {t(
                                  'domainTransfer.order.button'
                                )}
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        /* Not eligible */
                        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
                          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          <span className="text-sm text-amber-800 dark:text-amber-200">
                            {transferResult.reason ||
                              t(
                                'domainTransfer.result.notEligible'
                              )}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Unlock Guide Card */}
                <Collapsible
                  open={unlockGuideOpen}
                  onOpenChange={setUnlockGuideOpen}
                >
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <Lock className="h-4 w-4" />
                            {t(
                              'domainTransfer.unlockModal.title'
                            )}
                          </CardTitle>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              unlockGuideOpen
                                ? 'rotate-180'
                                : ''
                            }`}
                          />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          {[
                            t('domainTransfer.unlockModal.step1'),
                            t('domainTransfer.unlockModal.step2'),
                            t('domainTransfer.unlockModal.step3'),
                            t('domainTransfer.unlockModal.step4'),
                            t('domainTransfer.unlockModal.step5'),
                          ].map((title, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3"
                            >
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                                {idx + 1}
                              </div>
                              <span className="text-sm">{title}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t pt-4">
                          <h4 className="mb-3 text-sm font-medium">
                            {t(
                              'domainTransfer.unlockModal.registrars'
                            )}
                          </h4>
                          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                            {[
                              {
                                name: 'GoDaddy',
                                url: 'https://www.godaddy.com/help/unlock-my-domain-for-transfer-410',
                              },
                              {
                                name: 'Namecheap',
                                url: 'https://www.namecheap.com/support/knowledgebase/article.aspx/9476/83/how-to-unlock-a-domain',
                              },
                              {
                                name: 'Google Domains',
                                url: 'https://support.google.com/domains/answer/3251176',
                              },
                              {
                                name: 'Cloudflare',
                                url: 'https://developers.cloudflare.com/registrar/get-started/transfer-in/',
                              },
                              {
                                name: 'Name.com',
                                url: 'https://www.name.com/support/articles/205934345-unlocking-your-domain-name',
                              },
                              {
                                name: 'ENOM',
                                url: 'https://help.enom.com/hc/en-us/articles/206141017',
                              },
                            ].map((registrar) => (
                              <a
                                key={registrar.name}
                                href={registrar.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {registrar.name}
                              </a>
                            ))}
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <p className="text-muted-foreground text-xs">
                            {t(
                              'domainTransfer.unlockModal.needHelpDesc'
                            )}
                          </p>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function DomainTransferClientWrapper({
  user,
}: DomainTransferClientWrapperProps) {
  return (
    <DashboardTranslationProvider>
      <DomainTransferContent user={user} />
    </DashboardTranslationProvider>
  );
}
