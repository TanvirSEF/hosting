/**
 * WHMCS Domain API Functions
 * Following WHMCS API documentation for domain operations
 */

import { whmcsApi } from './whmcs';

/**
 * Check domain availability
 * @param domain - Domain name to check
 * @returns Domain availability information
 */
export async function checkDomainAvailability(domain: string) {
  try {
    const response = await whmcsApi('DomainWhois', {
      domain,
    });

    return {
      success: true,
      data: response,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Add domain to cart for registration
 * @param domain - Domain name to register
 * @param years - Number of years to register
 * @param dnsmanagement - Enable DNS management
 * @param emailforwarding - Enable email forwarding
 * @param idprotection - Enable ID protection
 * @returns Cart response
 */
export async function addDomainToCart(
  domain: string,
  years: number = 1,
  dnsmanagement: boolean = false,
  emailforwarding: boolean = false,
  idprotection: boolean = false
) {
  try {
    const response = await whmcsApi('addorder', {
      domain: domain,
      domaintype: 'register',
      regperiod: years,
      dnsmanagement: dnsmanagement ? 1 : 0,
      emailforwarding: emailforwarding ? 1 : 0,
      idprotection: idprotection ? 1 : 0,
    });

    return {
      success: true,
      data: response,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Add domain transfer to cart
 * @param domain - Domain name to transfer
 * @param eppCode - EPP/Auth code for transfer
 * @param years - Number of years for transfer
 * @param dnsmanagement - Enable DNS management
 * @param emailforwarding - Enable email forwarding
 * @param idprotection - Enable ID protection
 * @returns Cart response
 */
export async function addDomainTransferToCart(
  domain: string,
  eppCode: string,
  years: number = 1,
  dnsmanagement: boolean = false,
  emailforwarding: boolean = false,
  idprotection: boolean = false
) {
  try {
    const response = await whmcsApi('addorder', {
      domain: domain,
      domaintype: 'transfer',
      regperiod: years,
      transfersecret: eppCode,
      dnsmanagement: dnsmanagement ? 1 : 0,
      emailforwarding: emailforwarding ? 1 : 0,
      idprotection: idprotection ? 1 : 0,
    });

    return {
      success: true,
      data: response,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Add existing domain to cart (use with hosting)
 * @param domain - Existing domain name
 * @returns Cart response
 */
export async function addExistingDomainToCart(domain: string) {
  try {
    const response = await whmcsApi('addorder', {
      domain: domain,
      domaintype: 'existing',
    });

    return {
      success: true,
      data: response,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get TLD pricing information
 * @returns TLD pricing data
 */
export async function getTLDPricing() {
  try {
    const response = await whmcsApi('domainpricing');

    return {
      success: true,
      data: response,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Validate domain transfer eligibility
 * @param domain - Domain name to validate
 * @returns Transfer eligibility information
 */
export async function validateDomainTransfer(domain: string) {
  try {
    const response = await whmcsApi('DomainWhois', {
      domain,
    });

    return {
      success: true,
      data: response,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get domain WHOIS information
 * @param domain - Domain name
 * @returns WHOIS information
 */
export async function getDomainWHOIS(domain: string) {
  try {
    const response = await whmcsApi('domainwhois', {
      domain,
    });

    return {
      success: true,
      data: response,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Suggest alternative domains
 * @param domain - Base domain name
 * @param tlds - Array of TLDs to check
 * @returns Domain suggestions
 */
export async function getDomainSuggestions(domain: string, tlds: string[] = ['.com', '.net', '.org']) {
  try {
    const suggestions = [];

    for (const tld of tlds) {
      const domainName = domain.replace(/\.[^.]*$/, '') + tld;
      const response = await whmcsApi('DomainWhois', {
        domain: domainName,
      });

      if (response.status === 'available') {
        suggestions.push({
          domain: domainName,
          status: 'available',
          price: response.price || null,
        });
      }
    }

    return {
      success: true,
      data: suggestions,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
