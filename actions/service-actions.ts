'use server';

import { whmcsApi } from '@/lib/whmcs';
import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { jwtVerify } from 'jose';
import { z } from 'zod';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Schema for service upgrade
const serviceUpgradeSchema = z.object({
  serviceid: z.string().or(z.number()),
  newproductid: z.string().or(z.number()).optional(),
  newproductbillingcycle: z.string().optional(),
  promocode: z.string().optional(),
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
 * Refresh service data from WHMCS
 */
export async function refreshServiceAction(serviceId: string | number) {
  try {
    const userId = await getUserId();

    // Fetch updated service data
    const response = await whmcsApi('GetClientsProducts', {
      clientid: userId,
      serviceid: serviceId,
    });

    if (response.result === 'success') {
      // Revalidate services page
      revalidatePath('/dashboard/services', 'page');

      const service = response.products?.product;
      const serviceData = Array.isArray(service) ? service[0] : service;

      return {
        success: true,
        message: 'Service data refreshed successfully',
        data: serviceData,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to refresh service data',
      };
    }
  } catch (error: any) {
    console.error('Service Refresh Error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while refreshing service',
    };
  }
}

/**
 * Upgrade a service to a new product
 */
export async function upgradeServiceAction(
  serviceId: string | number,
  newProductId?: string | number,
  billingCycle?: string,
  promoCode?: string
) {
  try {
    await getUserId(); // Verify user is authenticated

    if (!newProductId) {
      return {
        success: false,
        error: 'New product ID is required for upgrade',
      };
    }

    const result = serviceUpgradeSchema.safeParse({
      serviceid: serviceId,
      newproductid: newProductId,
      newproductbillingcycle: billingCycle,
      promocode: promoCode,
    });

    if (!result.success) {
      return {
        success: false,
        error: 'Invalid upgrade parameters',
      };
    }

    const response = await whmcsApi('UpgradeProduct', {
      serviceid: serviceId,
      newproductid: newProductId,
      ...(billingCycle && { newproductbillingcycle: billingCycle }),
      ...(promoCode && { promocode: promoCode }),
    });

    if (response.result === 'success') {
      // Revalidate services page
      revalidatePath('/dashboard/services', 'page');

      return {
        success: true,
        message: 'Service upgrade initiated successfully',
        data: response,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to upgrade service',
      };
    }
  } catch (error: any) {
    console.error('Service Upgrade Error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while upgrading service',
    };
  }
}

/**
 * Get service details
 */
export async function getServiceDetailsAction(serviceId: string | number) {
  try {
    const userId = await getUserId();

    const response = await whmcsApi('GetClientsProducts', {
      clientid: userId,
      serviceid: serviceId,
    });

    if (response.result === 'success' && response.products?.product) {
      const service = response.products.product;
      const serviceData = Array.isArray(service) ? service[0] : service;

      return {
        success: true,
        data: serviceData,
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
 * Suspend/Unsuspend a service
 */
export async function suspendServiceAction(
  serviceId: string | number,
  suspend: boolean
) {
  try {
    await getUserId(); // Verify user is authenticated

    const action = suspend ? 'ModuleSuspend' : 'ModuleUnsuspend';
    const response = await whmcsApi(action, {
      serviceid: serviceId,
    });

    if (response.result === 'success') {
      revalidatePath('/dashboard/services', 'page');

      return {
        success: true,
        message: `Service ${suspend ? 'suspended' : 'unsuspended'} successfully`,
        data: response,
      };
    } else {
      return {
        success: false,
        error:
          response.message ||
          `Failed to ${suspend ? 'suspend' : 'unsuspend'} service`,
      };
    }
  } catch (error: any) {
    console.error('Service Suspend Error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while updating service status',
    };
  }
}

/**
 * Get control panel login URL for Plesk
 */
import { pleskApi } from '@/lib/plesk'; // Import pleskApi

// ... existing code ...

/**
 * Get control panel login URL for Plesk
 */
export async function getControlPanelLoginAction(serviceId: string | number) {
  try {
    const userId = await getUserId(); // Verify user is authenticated

    // 1. Get Service Details from WHMCS to find the username
    const serviceResponse = await whmcsApi('GetClientsProducts', {
      clientid: userId,
      serviceid: serviceId,
    });

    if (serviceResponse.result !== 'success' || !serviceResponse.products?.product) {
      throw new Error('Service not found');
    }

    const service = Array.isArray(serviceResponse.products.product)
      ? serviceResponse.products.product[0]
      : serviceResponse.products.product;

    const username = service.username;

    if (!username) {
      throw new Error('Service username not found');
    }

    // 2. Create Session via Plesk API
    // Get real client IP for better security and audit logs in Plesk
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const userIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '0.0.0.0';

    const token = await pleskApi.createSession(username, userIp);

    // 3. Construct URL dynamically from API URL
    const apiBaseUrl = process.env.PLESK_API_URL || 'https://31.97.193.141:8443/api/v2';
    const pleskHost = new URL(apiBaseUrl).origin;

    // Use /cp/rs_session_init.php as /enterprise/ returned 404 on this server
    const loginUrl = `${pleskHost}/cp/rs_session_init.php?PLESK_SESSION_ID=${token}`;

    return {
      success: true,
      loginUrl: loginUrl,
      message: 'Control panel login URL retrieved successfully',
    };

  } catch (error: any) {
    console.error('Control Panel Login Error:', error);
    return {
      success: false,
      error:
        error.message || 'An error occurred while getting control panel access',
    };
  }
}
