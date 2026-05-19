'use server';

import { whmcsApi } from '@/lib/whmcs';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { z } from 'zod';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Schema for domain renewal
const domainRenewalSchema = z.object({
  domainid: z.string().or(z.number()),
  regperiod: z.number().optional(),
});

// Schema for auto-renew toggle
const autoRenewSchema = z.object({
  domainid: z.string().or(z.number()),
  donotrenew: z.boolean(),
});

// Verify user session and get userId
async function getUserId() {
  const cookieStore = cookies();
  const session = (await cookieStore).get('session')?.value;
  if (!session) {
    throw new Error('Unauthorized');
  }
  const { payload } = await jwtVerify(session, JWT_SECRET);
  return payload.userId as string | number;
}

/**
 * Renew a domain using WHMCS API
 */
export async function renewDomainAction(
  domainId: string | number,
  regPeriod?: number
) {
  try {
    await getUserId(); // Verify user is authenticated

    const result = domainRenewalSchema.safeParse({
      domainid: domainId,
      regperiod: regPeriod,
    });
    if (!result.success) {
      return {
        success: false,
        error: 'Invalid domain ID provided',
      };
    }

    const response = await whmcsApi('DomainRenew', {
      domainid: domainId,
      ...(regPeriod && { regperiod: regPeriod }),
    });

    if (response.result === 'success') {
      // Revalidate domains page to show updated data
      revalidatePath('/dashboard/domains', 'page');

      return {
        success: true,
        message: 'Domain renewal initiated successfully',
        data: response,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to renew domain',
      };
    }
  } catch (error: any) {
    console.error('Domain Renewal Error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while renewing the domain',
    };
  }
}

/**
 * Toggle auto-renew for a domain
 */
export async function toggleAutoRenewAction(
  domainId: string | number,
  enable: boolean
) {
  try {
    await getUserId(); // Verify user is authenticated

    const result = autoRenewSchema.safeParse({
      domainid: domainId,
      donotrenew: !enable,
    });
    if (!result.success) {
      return {
        success: false,
        error: 'Invalid parameters provided',
      };
    }

    const response = await whmcsApi('UpdateClientDomain', {
      domainid: domainId,
      donotrenew: enable ? 0 : 1,
    });

    if (response.result === 'success') {
      // Revalidate domains page
      revalidatePath('/dashboard/domains', 'page');

      return {
        success: true,
        message: `Auto-renew ${enable ? 'enabled' : 'disabled'} successfully`,
        data: response,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to update auto-renew setting',
      };
    }
  } catch (error: any) {
    console.error('Auto-Renew Toggle Error:', error);
    return {
      success: false,
      error:
        error.message || 'An error occurred while updating auto-renew setting',
    };
  }
}

/**
 * Get domain details including DNS records
 */
export async function getDomainDetailsAction(domainId: string | number) {
  try {
    await getUserId(); // Verify user is authenticated

    const response = await whmcsApi('GetClientsDomains', {
      domainid: domainId,
    });

    if (response.result === 'success' && response.domains?.domain) {
      const domain = Array.isArray(response.domains.domain)
        ? response.domains.domain[0]
        : response.domains.domain;

      return {
        success: true,
        data: domain,
      };
    } else {
      return {
        success: false,
        error: 'Domain not found',
      };
    }
  } catch (error: any) {
    console.error('Get Domain Details Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch domain details',
    };
  }
}

/**
 * Update DNS management setting for a domain
 */
export async function updateDNSManagementAction(
  domainId: string | number,
  enable: boolean
) {
  try {
    await getUserId(); // Verify user is authenticated

    const response = await whmcsApi('UpdateClientDomain', {
      domainid: domainId,
      dnsmanagement: enable ? 1 : 0,
    });

    if (response.result === 'success') {
      revalidatePath('/dashboard/domains', 'page');

      return {
        success: true,
        message: `DNS management ${enable ? 'enabled' : 'disabled'} successfully`,
        data: response,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to update DNS management setting',
      };
    }
  } catch (error: any) {
    console.error('DNS Management Update Error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while updating DNS management',
    };
  }
}

/**
 * Update nameservers for a domain
 */
export async function updateNameserversAction(
  domainId: string | number,
  nameservers: string[]
) {
  try {
    await getUserId(); // Verify user is authenticated

    if (!nameservers || nameservers.length === 0) {
      return {
        success: false,
        error: 'At least one nameserver is required',
      };
    }

    const params: any = { domainid: domainId };
    nameservers.forEach((ns, index) => {
      params[`ns${index + 1}`] = ns;
    });

    const response = await whmcsApi('UpdateClientDomain', params);

    if (response.result === 'success') {
      revalidatePath('/dashboard/domains', 'page');

      return {
        success: true,
        message: 'Nameservers updated successfully',
        data: response,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to update nameservers',
      };
    }
  } catch (error: any) {
    console.error('Update Nameservers Error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while updating nameservers',
    };
  }
}

/**
 * Get EPP Code (Authorization Code) for domain transfer
 */
export async function getEppCodeAction(domainId: string | number) {
  try {
    await getUserId(); // Verify user is authenticated

    const response = await whmcsApi('DomainGetEppCode', {
      domainid: domainId,
    });

    if (response.result === 'success') {
      return {
        success: true,
        eppcode: response.eppcode,
        message: 'EPP code retrieved successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to retrieve EPP code',
      };
    }
  } catch (error: any) {
    console.error('Get EPP Code Error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while retrieving EPP code',
    };
  }
}

/**
 * Get domain locking status
 */
export async function getDomainLockStatusAction(domainId: string | number) {
  try {
    await getUserId(); // Verify user is authenticated

    const response = await whmcsApi('DomainGetLockingStatus', {
      domainid: domainId,
    });

    if (response.result === 'success') {
      return {
        success: true,
        lockstatus: response.lockstatus,
        message: 'Lock status retrieved successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to retrieve lock status',
      };
    }
  } catch (error: any) {
    console.error('Get Domain Lock Status Error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while retrieving lock status',
    };
  }
}

/**
 * Initiate domain transfer
 */
export async function transferDomainAction(
  domainId: string | number,
  eppCode?: string
) {
  try {
    await getUserId(); // Verify user is authenticated

    const params: any = { domainid: domainId };
    if (eppCode) {
      params.eppcode = eppCode;
    }

    const response = await whmcsApi('DomainTransfer', params);

    if (response.result === 'success') {
      revalidatePath('/dashboard/domains', 'page');

      return {
        success: true,
        message: 'Domain transfer initiated successfully',
        data: response,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to initiate domain transfer',
      };
    }
  } catch (error: any) {
    console.error('Domain Transfer Error:', error);
    return {
      success: false,
      error:
        error.message || 'An error occurred while initiating domain transfer',
    };
  }
}

/**
 * Register a domain
 */
export async function registerDomainAction(domainId: string | number) {
  try {
    await getUserId(); // Verify user is authenticated

    const response = await whmcsApi('DomainRegister', {
      domainid: domainId,
    });

    if (response.result === 'success') {
      revalidatePath('/dashboard/domains', 'page');

      return {
        success: true,
        message: 'Domain registration initiated successfully',
        data: response,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to register domain',
      };
    }
  } catch (error: any) {
    console.error('Domain Registration Error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while registering domain',
    };
  }
}

/**
 * Release domain to new registrar tag (for .uk domains)
 */
export async function releaseDomainAction(
  domainId: string | number,
  newTag: string
) {
  try {
    await getUserId(); // Verify user is authenticated

    if (!newTag || newTag.trim() === '') {
      return {
        success: false,
        error: 'Registrar tag is required',
      };
    }

    const response = await whmcsApi('DomainRelease', {
      domainid: domainId,
      newtag: newTag,
    });

    if (response.result === 'success') {
      revalidatePath('/dashboard/domains', 'page');
      return {
        success: true,
        message: 'Domain release initiated successfully',
        data: response,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to release domain',
      };
    }
  } catch (error: any) {
    console.error('Domain Release Error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while releasing domain',
    };
  }
}

/**
 * Request EPP code via email
 */
export async function requestEppCodeAction(domainId: string | number) {
  try {
    await getUserId(); // Verify user is authenticated

    const response = await whmcsApi('DomainRequestEPP', {
      domainid: domainId,
    });

    if (response.result === 'success') {
      return {
        success: true,
        message: 'EPP code request email sent successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to request EPP code',
      };
    }
  } catch (error: any) {
    console.error('Request EPP Code Error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while requesting EPP code',
    };
  }
}

/**
 * Resend transfer confirmation email
 */
export async function resendTransferEmailAction(domainId: string | number) {
  try {
    await getUserId(); // Verify user is authenticated

    const response = await whmcsApi('DomainResendTransferEmail', {
      domainid: domainId,
    });

    if (response.result === 'success') {
      return {
        success: true,
        message: 'Transfer confirmation email sent successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to resend transfer email',
      };
    }
  } catch (error: any) {
    console.error('Resend Transfer Email Error:', error);
    return {
      success: false,
      error:
        error.message || 'An error occurred while resending transfer email',
    };
  }
}

/**
 * Synchronise domain with registrar
 */
export async function synchroniseDomainAction(domainId: string | number) {
  try {
    await getUserId(); // Verify user is authenticated

    const response = await whmcsApi('DomainSynchronise', {
      domainid: domainId,
    });

    if (response.result === 'success') {
      revalidatePath('/dashboard/domains', 'page');
      return {
        success: true,
        message: 'Domain synchronised successfully',
        data: response,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to synchronise domain',
      };
    }
  } catch (error: any) {
    console.error('Domain Synchronise Error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while synchronising domain',
    };
  }
}

/**
 * Toggle ID protection for domain
 */
export async function toggleIDProtectAction(
  domainId: string | number,
  enable: boolean
) {
  try {
    await getUserId(); // Verify user is authenticated

    const response = await whmcsApi('DomainToggleIDProtect', {
      domainid: domainId,
      status: enable ? 'on' : 'off',
    });

    if (response.result === 'success') {
      revalidatePath('/dashboard/domains', 'page');
      return {
        success: true,
        message: `ID protection ${enable ? 'enabled' : 'disabled'} successfully`,
        data: response,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to toggle ID protection',
      };
    }
  } catch (error: any) {
    console.error('Toggle ID Protect Error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while toggling ID protection',
    };
  }
}

/**
 * Get domain pricing information
 */
export async function getDomainPricingAction(tld?: string) {
  try {
    await getUserId(); // Verify user is authenticated

    const params: any = {};
    if (tld) {
      params.tld = tld;
    }

    const response = await whmcsApi('GetTLDPricing', params);

    if (response.result === 'success') {
      return {
        success: true,
        data: response.pricing || {},
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to fetch domain pricing',
      };
    }
  } catch (error: any) {
    console.error('Get Domain Pricing Error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching domain pricing',
    };
  }
}
