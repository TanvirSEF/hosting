'use server';

import { whmcsApi, getCurrencies } from '@/lib/whmcs';
import { formatCurrencyWithSymbol } from '@/lib/currency-utils';
import { z } from 'zod';

// Schema for domain search
const domainSearchSchema = z.object({
  domain: z.string().min(1, 'Domain name is required'),
});

// Popular TLDs to check
const DEFAULT_TLDS = [
  '.com',
  '.net',
  '.org',
  '.io',
  '.co',
  '.xyz',
  '.online',
  '.store',
];


export interface DomainSearchResult {
  domain: string;
  tld: string;
  available: boolean;
  price?: string;
  renewalPrice?: string;
  status: string; // 'available', 'registered', 'reserved', 'unknown'
  nameservers?: string[]; // Added for DNS-based check
  registrationDate?: string; // Full registration date (e.g., "2023-01-15")
  registrationYear?: number; // Registration year (e.g., 2023)
}

async function whmcsDomainWhois(domain: string): Promise<{
  available: boolean;
  status: 'available' | 'registered' | 'unknown';
}> {
  try {
    const response = await whmcsApi('DomainWhois', { domain });
    if (response?.result === 'success') {
      const status = String(response.status || '').toLowerCase();
      if (status === 'available') {
        return { available: true, status: 'available' };
      }
      if (status === 'unavailable') {
        return { available: false, status: 'registered' };
      }
    }
    return { available: false, status: 'unknown' };
  } catch (error: any) {
    // If WHMCS fails, try Spaceship API as fallback
    try {
      const { spaceshipApi } = await import('@/lib/spaceship');
      const spaceshipResult = await spaceshipApi.checkAvailability(domain);

      if (spaceshipResult?.domains && spaceshipResult.domains.length > 0) {
        const domainResult = spaceshipResult.domains[0];
        const result = String(domainResult.result || '').toLowerCase();

        if (result === 'available') {
          return { available: true, status: 'available' };
        }
        if (result === 'registered' || result === 'unavailable') {
          return { available: false, status: 'registered' };
        }
      }
    } catch (spaceshipError) {
      // Spaceship also failed, return unknown
      console.error(`Both WHMCS and Spaceship failed for ${domain}`);
    }

    return { available: false, status: 'unknown' };
  }
}

/**
 * Search for domain availability using WHMCS DomainWhois
 * Also adds pricing from WHMCS (GetTLDPricing)
 */
export async function checkDomainAvailability(
  domainName: string,
  currencyCode: string = 'USD'
) {
  try {
    // Validate input
    const validatedData = domainSearchSchema.parse({ domain: domainName });
    let searchDomain = validatedData.domain.toLowerCase().trim();

    // Remove http://, https://, www.
    searchDomain = searchDomain
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .replace(/\/$/, '')
      .replace(/\.$/, ''); // Remove trailing dots

    // Extract domain and TLD if provided
    let baseDomain = searchDomain;
    let providedTld = '';

    // Check if user provided a TLD
    const parts = searchDomain.split('.');
    if (parts.length > 1 && parts[parts.length - 1]) {
      // Only treat as TLD if the last part is not empty (not a trailing dot)
      const lastPart = '.' + parts[parts.length - 1];
      if (
        DEFAULT_TLDS.includes(lastPart) ||
        (parts.length === 2 && parts[1].length >= 2)
      ) {
        // If it's a known TLD or looks like a complete domain (TLD has at least 2 chars)
        providedTld = lastPart;
        baseDomain = parts.slice(0, -1).join('.');
      }
    }

    // Validate base domain - must have at least one character
    if (!baseDomain || baseDomain.length === 0) {
      return {
        success: false,
        error: 'Please enter a valid domain name',
      };
    }

    const currencyUpper = (currencyCode || '').trim().toUpperCase() || 'USD';

    const toMoney = (value: unknown): string | undefined => {
      const raw =
        typeof value === 'object' && value !== null
          ? (value as any).price ?? (value as any).amount ?? value
          : value;
      // Remove only currency codes (3-letter uppercase like EUR, USD, SEK) but keep currency names
      const cleanValue = String(raw).replace(/\b[A-Z]{3}\b/g, '').replace(/[^\d.]/g, '');
      const n = Number.parseFloat(cleanValue);
      return Number.isFinite(n) ? n.toFixed(2) : undefined;
    };

    const getYearPrice = (
      tldPricing: any,
      kind: 'register' | 'renew'
    ): string | undefined => {
      const block = tldPricing?.[kind];
      const candidate =
        block?.['1'] ?? block?.[1] ?? block?.['1.00'] ?? block?.['1.0'];
      return toMoney(candidate);
    };

    // First fetch pricing to get all available TLDs from WHMCS
    const pricingResult = await getTLDPricing(currencyUpper);

    // Determine which TLDs to check from WHMCS pricing.
    // We keep ordering stable: provided TLD first, then popular TLDs, then the rest.
    let tldsToCheck: string[] = [];
    const popularTlds = ['.com', '.net', '.org', '.io', '.co', '.xyz', '.online', '.store'];

    if (pricingResult?.success && pricingResult.data) {
      const pricedTlds = Object.keys(pricingResult.data).map((tldKey) =>
        tldKey.startsWith('.') ? tldKey : `.${tldKey}`
      );

      const pricedSet = new Set(pricedTlds);

      const orderedPopular = popularTlds.filter((tld) => pricedSet.has(tld));
      const orderedRest = pricedTlds.filter((tld) => !popularTlds.includes(tld));
      tldsToCheck = [...orderedPopular, ...orderedRest];

      if (providedTld) {
        tldsToCheck = [providedTld, ...tldsToCheck.filter((tld) => tld !== providedTld)];
      }
    } else {
      // Fallback to default TLDs if pricing fetch fails
      tldsToCheck = [...DEFAULT_TLDS];
      if (providedTld && !DEFAULT_TLDS.includes(providedTld)) {
        tldsToCheck = [providedTld, ...DEFAULT_TLDS];
      } else if (providedTld && DEFAULT_TLDS.includes(providedTld)) {
        tldsToCheck = [
          providedTld,
          ...DEFAULT_TLDS.filter((tld) => tld !== providedTld),
        ];
      }
    }

    // Check availability for all TLDs
    const availabilityResults = await Promise.allSettled(
      tldsToCheck.map(async (tld) => {
        const fullDomain = baseDomain + tld;
        const whois = await whmcsDomainWhois(fullDomain);
        return {
          domain: fullDomain,
          tld,
          available: whois.available,
          status: whois.status,
        };
      })
    );

    const pricingCurrencyCode =
      pricingResult?.success && pricingResult.currency?.code
        ? String(pricingResult.currency.code).toUpperCase()
        : currencyUpper;

    const pricingMap: Record<string, { register?: string; renew?: string }> = {};
    if (pricingResult?.success && pricingResult.data) {
      for (const [tldKeyRaw, tldPricing] of Object.entries(
        pricingResult.data as any
      )) {
        const tldKey = tldKeyRaw.startsWith('.')
          ? tldKeyRaw
          : `.${tldKeyRaw}`;
        const reg = getYearPrice(tldPricing, 'register');
        const ren = getYearPrice(tldPricing, 'renew');
        if (reg) pricingMap[tldKey] = { register: reg, renew: ren ?? reg };
      }
    }

    const domainResults: DomainSearchResult[] = availabilityResults
      .filter((r) => r.status === 'fulfilled')
      .map((r) => {
        const value = (r as PromiseFulfilledResult<any>).value as {
          domain: string;
          tld: string;
          available: boolean;
          status: string;
          nameservers?: string[];
        };
        const p = pricingMap[value.tld];
        const price =
          value.available && p?.register
            ? formatCurrencyWithSymbol(p.register, pricingCurrencyCode)
            : undefined;
        const renewalPrice =
          value.available && p?.renew
            ? formatCurrencyWithSymbol(p.renew, pricingCurrencyCode)
            : undefined;

        return {
          ...value,
          price,
          renewalPrice,
        } as DomainSearchResult;
      });

    // Sort results: taken (registered) first, then available
    domainResults.sort((a, b) => {
      if (!a.available && b.available) return -1;
      if (a.available && !b.available) return 1;
      return a.domain.localeCompare(b.domain);
    });

    return {
      success: true,
      data: {
        searchTerm: baseDomain,
        results: domainResults,
      },
    };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || 'Invalid domain name',
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to check domain availability',
    };
  }
}

/**
 * Get TLD pricing from WHMCS
 */
export async function getTLDPricing(currencyCode: string) {
  try {
    const requestedCurrency = (currencyCode || '').trim().toUpperCase();
    if (!requestedCurrency) {
      return {
        success: false,
        error: 'Currency code is required for TLD pricing',
      };
    }

    const currenciesResult = await getCurrencies();
    if (!currenciesResult.success || !currenciesResult.data) {
      return {
        success: false,
        error: 'Failed to load currencies from WHMCS',
      };
    }

    const resolveCurrencyId = (code: string): number | null => {
      const c = currenciesResult.data.find(
        (x: any) => x.code && String(x.code).toUpperCase() === code
      );
      if (!c) return null;
      const id = parseInt(c.id, 10);
      return Number.isFinite(id) && id > 0 ? id : null;
    };

    const fetchPricingByCode = async (code: string) => {
      const currencyId = resolveCurrencyId(code);
      if (!currencyId) return null;
      const response = await whmcsApi('GetTLDPricing', { currencyid: currencyId });
      if (response?.result === 'success') return response;
      return null;
    };

    const preferred = await fetchPricingByCode(requestedCurrency);
    if (preferred) {
      return {
        success: true,
        data: preferred.pricing,
        currency: preferred.currency,
      };
    }

    // If selected currency isn't configured in WHMCS, fall back to USD pricing (no conversion)
    const usd = requestedCurrency === 'USD' ? null : await fetchPricingByCode('USD');
    if (usd) {
      return {
        success: true,
        data: usd.pricing,
        currency: usd.currency,
      };
    }

    return {
      success: false,
      error: `Currency ${requestedCurrency} is not configured in WHMCS and USD fallback is unavailable`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch TLD pricing',
    };
  }
}

/**
 * Get domain suggestions (alternative spellings, different TLDs)
 */
export async function getDomainSuggestions(baseDomain: string) {
  try {
    // Simple suggestion algorithm
    const suggestions: string[] = [];
    const alternativeTlds = [
      '.com',
      '.net',
      '.org',
      '.io',
      '.co',
      '.online',
      '.tech',
      '.store',
      '.shop',
    ];

    // Add different TLDs
    alternativeTlds.forEach((tld) => {
      suggestions.push(baseDomain + tld);
    });

    // Add common prefixes/suffixes
    const modifiers = ['get', 'my', 'the', 'app', 'hq', 'hub', 'lab', 'zone'];
    modifiers.forEach((modifier) => {
      suggestions.push(modifier + baseDomain + '.com');
      suggestions.push(baseDomain + modifier + '.com');
    });

    return {
      success: true,
      data: suggestions.slice(0, 10), // Return top 10
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to generate suggestions',
    };
  }
}
