'use server';

import { whmcsApi } from '@/lib/whmcs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Get service details with client information
 */
export async function getServiceDetailsAction(serviceId: string | number) {
  try {
    const response = await whmcsApi('GetClientsProducts', {
      serviceid: serviceId,
    });

    if (response.result === 'success' && response.products?.product) {
      const service = response.products.product;
      const serviceData = Array.isArray(service) ? service[0] : service;

      // Get client details
      let clientData = null;
      if (serviceData.clientid) {
        try {
          const clientResponse = await whmcsApi('GetClientsDetails', {
            clientid: serviceData.clientid,
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
        data: serviceData,
        client: clientData,
      };
    } else {
      return {
        success: false,
        error: 'Service not found',
      };
    }
  } catch (error: any) {
    console.error('Get Service Details Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch service details',
    };
  }
}

/**
 * Update service information
 */
export async function updateServiceAction(formData: FormData) {
  try {
    const serviceId = formData.get('serviceid') as string;
    if (!serviceId) {
      return {
        success: false,
        error: 'Service ID is required',
      };
    }

    const updateData: any = {
      serviceid: serviceId,
    };

    // Only include fields that are provided
    const fields = [
      'domain',
      'username',
      'password',
      'notes',
      'paymentmethod',
      'billingcycle',
      'nextduedate',
      'status',
    ];

    fields.forEach((field) => {
      const value = formData.get(field);
      if (value) {
        updateData[field] = value;
      }
    });

    const response = await whmcsApi('UpdateClientProduct', updateData);

    if (response.result === 'success') {
      revalidatePath('/spike/services', 'page');
      return {
        success: true,
        message: 'Service updated successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to update service',
      };
    }
  } catch (error: any) {
    console.error('Update Service Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update service',
    };
  }
}

/**
 * Suspend a service
 */
export async function suspendServiceAction(
  serviceId: string | number,
  reason?: string
) {
  try {
    const response = await whmcsApi('ModuleSuspend', {
      serviceid: serviceId,
      ...(reason && { suspendreason: reason }),
    });

    if (response.result === 'success') {
      revalidatePath('/spike/services', 'page');
      return {
        success: true,
        message: 'Service suspended successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to suspend service',
      };
    }
  } catch (error: any) {
    console.error('Suspend Service Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to suspend service',
    };
  }
}

/**
 * Unsuspend a service
 */
export async function unsuspendServiceAction(serviceId: string | number) {
  try {
    const response = await whmcsApi('ModuleUnsuspend', {
      serviceid: serviceId,
    });

    if (response.result === 'success') {
      revalidatePath('/spike/services', 'page');
      return {
        success: true,
        message: 'Service unsuspended successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to unsuspend service',
      };
    }
  } catch (error: any) {
    console.error('Unsuspend Service Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to unsuspend service',
    };
  }
}

/**
 * Terminate a service
 */
export async function terminateServiceAction(
  serviceId: string | number,
  immediate: boolean = false
) {
  try {
    const response = await whmcsApi('TerminateService', {
      serviceid: serviceId,
      immediate: immediate ? 1 : 0,
    });

    if (response.result === 'success') {
      revalidatePath('/spike/services', 'page');
      return {
        success: true,
        message: 'Service terminated successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to terminate service',
      };
    }
  } catch (error: any) {
    console.error('Terminate Service Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to terminate service',
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
