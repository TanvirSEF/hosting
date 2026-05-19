'use server';

import { whmcsApi } from '@/lib/whmcs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Get domain details with client information
 */
export async function getDomainDetailsAction(domainId: string | number) {
  try {
    const response = await whmcsApi('GetClientsDomains', {
      domainid: domainId,
    });

    if (response.result === 'success' && response.domains?.domain) {
      const domain = response.domains.domain;
      const domainData = Array.isArray(domain) ? domain[0] : domain;

      // Get client details
      let clientData = null;
      if (domainData.userid) {
        try {
          const clientResponse = await whmcsApi('GetClientsDetails', {
            clientid: domainData.userid,
          });
          if (clientResponse.result === 'success') {
            clientData = clientResponse.client;
          }
        } catch (error) {
          // Client fetch failed, continue without client data
        }
      }

      return {
        success: true,
        data: domainData,
        client: clientData,
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
 * Update domain information
 */
export async function updateDomainAction(formData: FormData) {
  try {
    const domainId = formData.get('domainid') as string;
    if (!domainId) {
      return {
        success: false,
        error: 'Domain ID is required',
      };
    }

    const updateData: any = {
      domainid: domainId,
    };

    // Only include fields that are provided
    const fields = [
      'domain',
      'regdate',
      'nextduedate',
      'expirydate',
      'status',
      'donotrenew',
      'dnsmanagement',
      'emailforwarding',
      'idprotection',
      'paymentmethod',
      'notes',
      'registrar',
      'regperiod',
    ];

    fields.forEach((field) => {
      const value = formData.get(field);
      if (value !== null && value !== '') {
        if (
          field === 'donotrenew' ||
          field === 'dnsmanagement' ||
          field === 'emailforwarding' ||
          field === 'idprotection'
        ) {
          updateData[field] = value === '1' || value === 'true' ? 1 : 0;
        } else {
          updateData[field] = value;
        }
      }
    });

    const response = await whmcsApi('UpdateClientDomain', updateData);

    if (response.result === 'success') {
      revalidatePath('/spike/domains', 'page');
      return {
        success: true,
        message: 'Domain updated successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to update domain',
      };
    }
  } catch (error: any) {
    console.error('Update Domain Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update domain',
    };
  }
}

/**
 * Renew a domain
 */
export async function renewDomainAction(
  domainId: string | number,
  regPeriod?: number
) {
  try {
    const response = await whmcsApi('DomainRenew', {
      domainid: domainId,
      ...(regPeriod && { regperiod: regPeriod }),
    });

    if (response.result === 'success') {
      revalidatePath('/spike/domains', 'page');
      return {
        success: true,
        message: 'Domain renewal initiated successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to renew domain',
      };
    }
  } catch (error: any) {
    console.error('Renew Domain Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to renew domain',
    };
  }
}

/**
 * Release a domain
 */
export async function releaseDomainAction(
  domainId: string | number,
  newTag: string
) {
  try {
    if (!newTag) {
      return {
        success: false,
        error: 'New tag is required for domain release',
      };
    }

    const response = await whmcsApi('DomainRelease', {
      domainid: domainId,
      newtag: newTag,
    });

    if (response.result === 'success') {
      revalidatePath('/spike/domains', 'page');
      return {
        success: true,
        message: 'Domain release initiated successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to release domain',
      };
    }
  } catch (error: any) {
    console.error('Release Domain Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to release domain',
    };
  }
}

/**
 * Transfer a domain
 */
export async function transferDomainAction(
  domainId: string | number,
  eppCode?: string
) {
  try {
    const response = await whmcsApi('DomainTransfer', {
      domainid: domainId,
      ...(eppCode && { eppcode: eppCode }),
    });

    if (response.result === 'success') {
      revalidatePath('/spike/domains', 'page');
      return {
        success: true,
        message: 'Domain transfer initiated successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to transfer domain',
      };
    }
  } catch (error: any) {
    console.error('Transfer Domain Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to transfer domain',
    };
  }
}

/**
 * Get EPP Code (Authorization Code)
 */
export async function getEppCodeAction(domainId: string | number) {
  try {
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
      error: error.message || 'Failed to retrieve EPP code',
    };
  }
}

/**
 * Get domain lock status
 */
export async function getDomainLockStatusAction(domainId: string | number) {
  try {
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
      error: error.message || 'Failed to retrieve lock status',
    };
  }
}

/**
 * Update domain lock status
 */
export async function updateDomainLockStatusAction(
  domainId: string | number,
  lockStatus: boolean
) {
  try {
    const response = await whmcsApi('DomainUpdateLockingStatus', {
      domainid: domainId,
      lockstatus: lockStatus ? 1 : 0,
    });

    if (response.result === 'success') {
      revalidatePath('/spike/domains', 'page');
      return {
        success: true,
        message: `Domain ${lockStatus ? 'locked' : 'unlocked'} successfully`,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to update lock status',
      };
    }
  } catch (error: any) {
    console.error('Update Domain Lock Status Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update lock status',
    };
  }
}

/**
 * Update nameservers
 */
export async function updateNameserversAction(
  domainId: string | number,
  nameservers: string[]
) {
  try {
    if (!nameservers || nameservers.length === 0) {
      return {
        success: false,
        error: 'At least one nameserver is required',
      };
    }

    const params: any = {
      domainid: domainId,
      updatens: 1,
    };

    nameservers.forEach((ns, index) => {
      if (ns.trim()) {
        params[`ns${index + 1}`] = ns.trim();
      }
    });

    const response = await whmcsApi('UpdateClientDomain', params);

    if (response.result === 'success') {
      revalidatePath('/spike/domains', 'page');
      return {
        success: true,
        message: 'Nameservers updated successfully',
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
      error: error.message || 'Failed to update nameservers',
    };
  }
}

/**
 * Toggle auto-renew
 */
export async function toggleAutoRenewAction(
  domainId: string | number,
  enable: boolean
) {
  try {
    const response = await whmcsApi('UpdateClientDomain', {
      domainid: domainId,
      donotrenew: enable ? 0 : 1,
    });

    if (response.result === 'success') {
      revalidatePath('/spike/domains', 'page');
      return {
        success: true,
        message: `Auto-renew ${enable ? 'enabled' : 'disabled'} successfully`,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to update auto-renew setting',
      };
    }
  } catch (error: any) {
    console.error('Toggle Auto-Renew Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update auto-renew setting',
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
    const response = await whmcsApi('UpdateClientDomain', {
      domainid: domainId,
      dnsmanagement: enable ? 1 : 0,
    });

    if (response.result === 'success') {
      revalidatePath('/spike/domains', 'page');
      return {
        success: true,
        message: `DNS management ${enable ? 'enabled' : 'disabled'} successfully`,
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
      error: error.message || 'Failed to update DNS management setting',
    };
  }
}

/**
 * Get all clients for filter dropdown
 */
export async function getAllClientsAction() {
  try {
    const response = await whmcsApi('GetClients', {
      limitnum: 1000,
    });

    if (response.result === 'success') {
      const clients = response.clients?.client;
      const clientList = Array.isArray(clients)
        ? clients
        : clients
          ? [clients]
          : [];

      return {
        success: true,
        data: clientList.map((c: any) => ({
          id: c.id,
          name: `${c.firstname} ${c.lastname}`,
          email: c.email,
        })),
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to fetch clients',
      };
    }
  } catch (error: any) {
    console.error('Get All Clients Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch clients',
    };
  }
}

/**
 * Get client name by ID
 */
export async function getClientNameAction(clientId: string | number) {
  try {
    const response = await whmcsApi('GetClientsDetails', {
      clientid: clientId,
    });

    if (response.result === 'success') {
      return {
        success: true,
        name: `${response.client.firstname} ${response.client.lastname}`,
        email: response.client.email,
      };
    } else {
      return {
        success: false,
        error: 'Client not found',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch client name',
    };
  }
}
