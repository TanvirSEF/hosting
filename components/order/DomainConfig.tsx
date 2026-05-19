'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Globe, Shield, Mail, Database, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  checkDomainAvailabilityAction,
  addDomainRegistrationAction,
  addDomainTransferAction,
  addExistingDomainAction,
  calculateDomainPrice,
  validateDomainFormat,
  getExistingDomainPricingAction
} from '@/actions/domain-order-actions';
import { checkDomainAvailability, DomainSearchResult } from '@/actions/domain-search-actions';
import { checkProductFreeDomainAction } from '@/actions/hosting-actions';

interface DomainConfigProps {
  planId: string;
  billingCycle: string;
  onDomainConfigured: (config: DomainConfiguration) => void;
  onFreeDomainInfo?: (info: any) => void;
}

interface DomainConfiguration {
  type: 'register' | 'transfer' | 'existing';
  domain: string;
  price?: number;
  years?: number;
  eppCode?: string;
}

export default function DomainConfig({ planId, billingCycle, onDomainConfigured, onFreeDomainInfo }: DomainConfigProps) {
  const { formatPrice, currency } = useCurrency();

  const [domainType, setDomainType] = useState<'register' | 'transfer' | 'existing'>('register');
  const [domain, setDomain] = useState('');
  const [years, setYears] = useState(1);
  const [eppCode, setEppCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [adding, setAdding] = useState(false);
  const [availability, setAvailability] = useState<any>(null);
  const [pricing, setPricing] = useState<any>(null);
  const [freeDomainInfo, setFreeDomainInfo] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<DomainSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);



  // Check if product has free domain enabled
  useEffect(() => {
    if (planId && billingCycle) {
      const checkFreeDomain = async () => {
        const result = await checkProductFreeDomainAction(parseInt(planId), billingCycle);
        if (result.success) {
          setFreeDomainInfo(result);
          onFreeDomainInfo?.(result);
        } else {
          setFreeDomainInfo(null);
          onFreeDomainInfo?.(null);
        }
      };
      checkFreeDomain();
    }
  }, [planId, billingCycle, onFreeDomainInfo]);

  const isCurrentDomainFreeEligible = (domainValue?: string) => {
    if (!(domainType === 'register' || domainType === 'transfer')) return false;
    if (!freeDomainInfo?.hasFreeDomain || !freeDomainInfo?.qualifiesForFreeDomain) return false;

    const candidateDomain = String(domainValue || domain || '').trim().toLowerCase();

    const domainTld = candidateDomain.includes('.')
      ? `.${candidateDomain.split('.').pop()?.toLowerCase() || ''}`
      : '';

    const freeTlds: string[] = Array.isArray(freeDomainInfo?.freeDomainTlds)
      ? freeDomainInfo.freeDomainTlds
      : [];

    // If WHMCS doesn't return TLD restrictions, rely on cycle/type eligibility only.
    if (freeTlds.length === 0 || !domainTld) return true;

    return freeTlds.includes(domainTld);
  };

  // Fetch existing domain pricing when domain type changes to existing
  // Reset state when domain type changes
  useEffect(() => {
    setDomain('');
    setAvailability(null);
    setPricing(null);
    setEppCode('');
    setYears(1);
    setChecking(false);
    setAdding(false);
  }, [domainType]);

  // Recalculate pricing when free domain info changes
  useEffect(() => {
    if (freeDomainInfo && availability && domain && (domainType === 'register' || domainType === 'transfer')) {
      const recalculatePrice = async () => {
        const isFreeEligible = isCurrentDomainFreeEligible();

        console.log('[DomainConfig] Recalculating price. Free eligible:', isFreeEligible);

        if (isFreeEligible) {
          setPricing({
            registerPrice: 0,
            icannFee: 0,
            grandTotal: 0,
            totalPrice: 0,
          });
        } else {
          const priceResult = await calculateDomainPrice(domain, years, currency);
          if (priceResult.success) {
            setPricing(priceResult.data);
          }
        }
      };
      recalculatePrice();
    }
  }, [freeDomainInfo]);

  // Fetch existing domain pricing when domain is entered and type is existing
  useEffect(() => {
    if (domainType === 'existing' && domain) {
      const fetchExistingDomainPricing = async () => {
        try {
          const result = await getExistingDomainPricingAction(domain, currency);
          if (result.success && result.data?.hasCost) {
            setPricing({
              grandTotal: result.data.totalCost,
              registerPrice: result.data.totalCost,
              icannFee: 0,
              totalPrice: result.data.totalCost,
            });
          } else {
            setPricing(null);
          }
        } catch (error: any) {
          // Silently fail for existing domain pricing
          setPricing(null);
        }
      };

      const timer = setTimeout(() => {
        fetchExistingDomainPricing();
      }, 500); // 500ms debounce

      return () => clearTimeout(timer);
    }
  }, [domainType, domain, currency]);

  const checkAvailability = async () => {
    if (!domain || domain.trim() === '') {
      toast.error('Please enter a domain name');
      return;
    }

    setChecking(true);
    setSearchResults([]);
    setShowSearchResults(false);

    try {
      // Check if domain has a TLD
      const hasTld = domain.includes('.') && domain.split('.').length > 1;

      if (!hasTld) {
        // No TLD provided - search for available TLDs
        const searchResult = await checkDomainAvailability(domain, currency);
        
        if (searchResult.success && searchResult.data) {
          const availableDomains = searchResult.data.results.filter((r: DomainSearchResult) => r.available);
          
          if (availableDomains.length > 0) {
            setSearchResults(availableDomains);
            setShowSearchResults(true);
            toast.success(`Found ${availableDomains.length} available domain(s)`);
          } else {
            toast.error('No available domains found for this name');
          }
        } else {
          toast.error(searchResult.error || 'Failed to search domains');
        }
        setChecking(false);
        return;
      }

      // Has TLD - check single domain availability
      const validation = await validateDomainFormat(domain);
      if (!validation.valid) {
        toast.error(validation.error);
        setChecking(false);
        return;
      }

      const result = await checkDomainAvailabilityAction(domain);

      if (result.success) {
        setAvailability(result.data);

        const status = result.data.status;

        // Handle Transfer Logic:
        // For transfer, 'unavailable' means it is registered and thus POTENTIALLY eligible.
        // 'available' means it is NOT registered, so cannot be transferred.
        let isEligible = false;

        if (domainType === 'transfer') {
          if (status === 'unavailable') {
            isEligible = true;
            result.data.status = 'eligible_for_transfer'; // Custom status for UI
          }
        } else {
          // Register mode
          if (status === 'available') {
            isEligible = true;
          }
        }

        // Calculate price if eligible
        if (isEligible) {
          const isFreeEligible = isCurrentDomainFreeEligible(domain);

          if (isFreeEligible) {
            setPricing({
              registerPrice: 0,
              icannFee: 0,
              grandTotal: 0,
              totalPrice: 0,
            });
          } else {
            const priceResult = await calculateDomainPrice(domain, years, currency);
            if (priceResult.success) {
              setPricing(priceResult.data);
            } else {
              setPricing(null);
            }
          }
        } else {
          // Clear pricing if not eligible
          setPricing(null);
        }
      }
    } catch (error: any) {
      console.error('Check availability error:', error);
      toast.error(error.message);
    } finally {
      setChecking(false);
    }
  };

  const handleAddToCart = async () => {
    if (!domain) {
      toast.error('Please enter a domain name');
      return;
    }

    // Only validate domain format for registration and transfer
    if (domainType !== 'existing') {
      const validation = await validateDomainFormat(domain);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
    }

    if (domainType === 'transfer' && !eppCode) {
      toast.error('EPP code is required for domain transfer');
      return;
    }

    setAdding(true);
    try {
      let result;

      // If we're in a hosting order flow (planId exists), we don't need to create the domain order yet
      // We just pass the configuration up to the parent component
      if (planId) {
        // Validation for transfer is already handled by checking availability above (if needed) or by the form
        // We'll trust the validation logic here and simulate a success response
        result = {
          success: true,
          message: 'Domain configuration saved',
          data: {}
        };
      } else {
        // Standalone domain order - create order immediately (requires login)
        switch (domainType) {
          case 'register':
            result = await addDomainRegistrationAction(domain, {
              years,
            });
            break;
          case 'transfer':
            result = await addDomainTransferAction(domain, eppCode, {
              years,
            });
            break;
          case 'existing':
            result = await addExistingDomainAction(domain);
            break;
        }
      }

      if (result.success) {
        // Show simplified success message for hosting flow
        if (planId) {
          toast.success('Domain selected successfully');
        } else {
          toast.success(result.message || 'Domain added to cart');
        }

        const config: DomainConfiguration = {
          type: domainType,
          domain,
          price: pricing?.grandTotal || 0,
          years: domainType !== 'existing' ? years : undefined,
          eppCode: domainType === 'transfer' ? eppCode : undefined,
        };

        onDomainConfigured(config);
      } else {
        toast.error(result.error);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAdding(false);
    }
  };

  const getDomainStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-50';
      case 'eligible_for_transfer': return 'text-green-600 bg-green-50'; // Green for transfer eligible
      case 'unavailable': return 'text-red-600 bg-red-50';
      case 'transfer': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Domain Configuration</h3>

          {/* Domain Type Selection */}
          <div className="space-y-3">
            <Label>Domain Option</Label>
            <RadioGroup value={domainType} onValueChange={(value: any) => setDomainType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="register" id="register" />
                <Label htmlFor="register" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Register New Domain
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="transfer" id="transfer" />
                <Label htmlFor="transfer" className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Transfer Existing Domain
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing" />
                <Label htmlFor="existing" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Use Existing Domain
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Domain Input */}
        <div className="space-y-2">
          <Label htmlFor="domain">Domain Name</Label>
          <div className="flex gap-2">
            <Input
              id="domain"
              type="text"
              placeholder={domainType === 'existing' ? 'example.com' : 'Search domain (e.g., mywebsite)'}
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
            {domainType !== 'existing' && (
              <Button
                onClick={checkAvailability}
                disabled={checking || !domain}
                variant="outline"
              >
                {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check'}
              </Button>
            )}
          </div>
          {domainType === 'existing' && (
            <div className="text-sm text-gray-600 space-y-3 pt-2">
              <p>Enter your existing domain name. We'll configure it to work with your hosting plan.</p>

              <div className="bg-purple-50 rounded-xl border border-purple-100 p-4">
                <div className="flex items-center gap-2 mb-3 text-purple-900 font-medium">
                  <Shield className="w-4 h-4 text-[#8C52FF]" />
                  <span>Point your domain to our nameservers:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['ns1.webblyhost.com', 'ns2.webblyhost.com'].map((ns) => (
                    <div key={ns} className="flex items-center gap-2 bg-white border border-purple-100 p-2 rounded-lg group hover:border-[#8C52FF] transition-colors">
                      <code className="flex-1 font-mono text-xs text-gray-600 font-medium text-center">{ns}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-gray-400 hover:text-[#8C52FF] hover:bg-purple-50"
                        onClick={() => {
                          navigator.clipboard.writeText(ns);
                          toast.success('Nameserver copied to clipboard');
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Domain Search Results */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Available Domains</Label>
              <span className="text-sm text-gray-500">{searchResults.length} found</span>
            </div>
            <div className="grid gap-2 max-h-[400px] overflow-y-auto">
              {searchResults.map((result) => (
                <div
                  key={result.domain}
                  className="flex items-center justify-between p-3 border rounded-lg hover:border-[#8C52FF] hover:bg-purple-50 transition-all cursor-pointer"
                  onClick={async () => {
                    setDomain(result.domain);
                    setShowSearchResults(false);
                    setSearchResults([]);
                    
                    // Directly check this domain's availability
                    setChecking(true);
                    try {
                      const validation = await validateDomainFormat(result.domain);
                      if (!validation.valid) {
                        toast.error(validation.error);
                        setChecking(false);
                        return;
                      }

                      const availResult = await checkDomainAvailabilityAction(result.domain);
                      
                      if (availResult.success) {
                        setAvailability(availResult.data);
                        const status = availResult.data.status;
                        
                        let isEligible = false;
                        if (domainType === 'transfer') {
                          if (status === 'unavailable') {
                            isEligible = true;
                            availResult.data.status = 'eligible_for_transfer';
                          }
                        } else {
                          if (status === 'available') {
                            isEligible = true;
                          }
                        }
                        
                        if (isEligible) {
                          const isFreeEligible = isCurrentDomainFreeEligible(result.domain);
                          
                          if (isFreeEligible) {
                            setPricing({
                              registerPrice: 0,
                              icannFee: 0,
                              grandTotal: 0,
                              totalPrice: 0,
                            });
                          } else {
                            const priceResult = await calculateDomainPrice(result.domain, years, currency);
                            if (priceResult.success) {
                              setPricing(priceResult.data);
                            } else {
                              setPricing(null);
                            }
                          }
                        } else {
                          setPricing(null);
                        }
                      }
                    } catch (error: any) {
                      console.error('Check availability error:', error);
                      toast.error(error.message);
                    } finally {
                      setChecking(false);
                    }
                  }}
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{result.domain}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {result.tld} domain
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {result.price && (
                      <div className="text-right">
                        <div className="font-semibold text-[#8C52FF]">{result.price}</div>
                        {result.renewalPrice && (
                          <div className="text-xs text-gray-500">Renews at {result.renewalPrice}</div>
                        )}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#8C52FF] text-[#8C52FF] hover:bg-[#8C52FF] hover:text-white"
                    >
                      Select
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Availability Status */}
        {availability && !showSearchResults && (
          <div className="p-3 rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <Badge className={getDomainStatusColor(availability.status)}>
                {availability.status === 'eligible_for_transfer' ? 'Eligible for Transfer' : availability.status}
              </Badge>
            </div>

            {/* Status Messages based on Type and Status */}
            {domainType === 'register' && availability.status === 'unavailable' && (
              <p className="text-sm text-red-600 mt-2">
                This domain is already registered. Try searching for a different one.
              </p>
            )}

            {domainType === 'transfer' && availability.status === 'available' && (
              <p className="text-sm text-red-600 mt-2">
                This domain is not registered yet, so it cannot be transferred. You can register it instead.
              </p>
            )}

            {domainType === 'transfer' && availability.status === 'eligible_for_transfer' && (
              <p className="text-sm text-green-600 mt-2">
                Great! This domain is registered and eligible for transfer.
              </p>
            )}

            {domainType === 'register' && availability.status === 'available' && (
              <p className="text-sm text-green-600 mt-2">
                This domain is available!
              </p>
            )}
          </div>
        )}

        {/* Years Selection */}
        {domainType !== 'existing' && (availability?.status === 'available' || availability?.status === 'eligible_for_transfer') && (
          <div className="space-y-2">
            <Label htmlFor="years">Registration Period</Label>
            <Select value={years.toString()} onValueChange={(value) => setYears(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year} {year === 1 ? 'Year' : 'Years'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* EPP Code for Transfer */}
        {domainType === 'transfer' && (
          <div className="space-y-2">
            <Label htmlFor="eppCode">EPP/Transfer Code</Label>
            <Input
              id="eppCode"
              type="text"
              placeholder="Enter EPP code from current registrar"
              value={eppCode}
              onChange={(e) => setEppCode(e.target.value)}
            />
            <p className="text-sm text-gray-600">
              You can get this code from your current domain registrar.
            </p>
          </div>
        )}

        {/* Pricing Display */}
        {pricing && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Pricing Summary</h4>
              {freeDomainInfo?.hasFreeDomain && freeDomainInfo?.qualifiesForFreeDomain && domainType !== 'existing' && (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  Free Domain
                </Badge>
              )}
            </div>
            <div className="space-y-1 text-sm">
              {domainType === 'existing' ? (
                <>
                  <div className="flex justify-between">
                    <span>Domain Setup:</span>
                    <span>{formatPrice(pricing.grandTotal)}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    This covers the cost to configure your existing domain with our hosting service.
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>Registration ({years} year{years > 1 ? 's' : ''}):</span>
                    <span>{formatPrice(pricing.registerPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ICANN Fee:</span>
                    <span>{formatPrice(pricing.icannFee)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Total:</span>
                    <span>{formatPrice(pricing.grandTotal)}</span>
                  </div>
                  {freeDomainInfo?.hasFreeDomain && freeDomainInfo?.qualifiesForFreeDomain && (
                    <div className="text-xs text-green-600 mt-2 bg-green-50 p-2 rounded">
                      🎉 This domain is included free with your {billingCycle} hosting plan!
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          disabled={adding || (domainType !== 'existing' && !availability) || !domain || (domainType === 'transfer' && availability?.status !== 'eligible_for_transfer') || (domainType === 'register' && availability?.status !== 'available')}
          className="w-full"
        >
          {adding ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Adding to Cart...
            </>
          ) : (
            domainType === 'existing' ? 'Continue with Existing Domain' : (planId ? 'Select Domain' : 'Add to Cart')
          )}
        </Button>
      </div>
    </Card>
  );
}
