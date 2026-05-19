'use server';

import { whmcsApi } from '@/lib/whmcs';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getHostingOrdersCollection, getInvoicesCollection } from '@/lib/db';
import { syncInvoiceToMongoDB } from '@/lib/invoice-sync';
import { revalidatePath } from 'next/cache';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

/**
 * Get current user from JWT session
 */
async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return null;
    }

    const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET);
    return payload as { userId: number; email: string; mongoId: string };
  } catch {
    return null;
  }
}

/**
 * Get all available services (excluding domain registration)
 */
export async function getAllServicesAction() {
  try {
    const response = await whmcsApi('GetProducts', {});

    if (response.result === 'success' && response.products) {
      const products = Array.isArray(response.products.product)
        ? response.products.product
        : [response.products.product];

      // Filter out domain registration products
      const services = products.filter((product: any) => {
        const productType = (product.type || '').toLowerCase();
        const productName = (product.name || '').toLowerCase();
        return (
          productType !== 'domain' &&
          !productName.includes('domain registration') &&
          !productName.includes('domain transfer')
        );
      });

      // Format products with pricing
      const formattedServices = services.map((product: any) => ({
        id: parseInt(product.pid),
        groupId: parseInt(product.gid),
        name: product.name,
        description: product.description || '',
        type: product.type,
        pricing: product.pricing?.USD || product.pricing || {},
        groupName: product.group_name || `Group ${product.gid}`,
      }));

      return {
        success: true,
        data: formattedServices,
      };
    }

    return { success: false, error: 'No services found' };
  } catch (error: any) {
    console.error('Get all services error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Calculate service price
 */
export async function calculateServicePriceAction(
  productId: number,
  billingCycle: string
) {
  try {
    const response = await whmcsApi('GetProducts', { pid: productId });

    if (response.result === 'success' && response.products?.product) {
      const products = Array.isArray(response.products.product)
        ? response.products.product
        : [response.products.product];

      const product = products.find((p: any) => parseInt(p.pid) === productId);

      if (!product) {
        return { success: false, error: 'Product not found' };
      }

      const pricing = product.pricing?.USD || product.pricing || {};
      const price = pricing[billingCycle] || pricing.monthly || 0;

      return {
        success: true,
        data: {
          basePrice: parseFloat(price),
          total: parseFloat(price),
          billingCycle,
        },
      };
    }

    return { success: false, error: 'Failed to calculate price' };
  } catch (error: any) {
    console.error('Calculate price error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create service order
 */
export async function createServiceOrderAction(
  productId: number,
  billingCycle: string,
  domain?: string // Optional domain for email services
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: 'Please login to continue',
        requiresLogin: true,
      };
    }

    // Get product details
    const productResponse = await whmcsApi('GetProducts', { pid: productId });
    if (
      productResponse.result !== 'success' ||
      !productResponse.products?.product
    ) {
      return { success: false, error: 'Product not found' };
    }

    const products = Array.isArray(productResponse.products.product)
      ? productResponse.products.product
      : [productResponse.products.product];
    const product = products.find((p: any) => parseInt(p.pid) === productId);

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    // Calculate price
    const priceResult = await calculateServicePriceAction(
      productId,
      billingCycle
    );
    if (!priceResult.success || !priceResult.data) {
      return { success: false, error: 'Failed to calculate pricing' };
    }

    // Create order in WHMCS
    const orderData: any = {
      clientid: user.userId,
      pid: productId,
      billingcycle: billingCycle,
      paymentmethod: 'stripe', // Hardcoded fix process.env.WHMCS_ORDER_PAYMENT_METHOD || 'banktransfer',
    };

    // Handle domain requirements for different service types
    const gid = String(product.gid);
    const emailServiceGid = process.env.NEXT_PUBLIC_EMAIL_SERVICE_GID || '7';
    const hostingGids = [
      process.env.NEXT_PUBLIC_SHARED_HOSTING_GID || '1',
      process.env.NEXT_PUBLIC_VPS_HOSTING_GID || '2',
      process.env.NEXT_PUBLIC_WORDPRESS_HOSTING_GID || '3',
      process.env.NEXT_PUBLIC_ECOMMERCE_HOSTING_GID || '4',
    ];

    // Email services require a domain
    if (gid === emailServiceGid) {
      if (!domain) {
        return {
          success: false,
          error: 'Domain is required for email services',
        };
      }
      orderData.domain = domain;
      orderData.domaintype = 'owndomain';
    }
    // Hosting products require a domain (use placeholder if not provided)
    else if (hostingGids.includes(gid)) {
      orderData.domain = domain || `service-${user.userId}-${Date.now()}.host`;
      orderData.regtype = 'register';
    }

    const response = await whmcsApi('AddOrder', orderData);

    if (response.result !== 'success') {
      return {
        success: false,
        error: response.message || 'Failed to create order',
      };
    }

    const orderId = parseInt(response.orderid);
    const invoiceId = response.invoiceid ? parseInt(response.invoiceid) : 0;
    const serviceId = response.productids
      ? parseInt(response.productids)
      : undefined;

    if (!invoiceId) {
      console.warn(`[CreateOrder] Warning: No invoiceId returned for order ${orderId}`);
    }

    // Sync to MongoDB
    const ordersCollection = await getHostingOrdersCollection();
    await ordersCollection.insertOne({
      whmcsOrderId: orderId,
      whmcsInvoiceId: invoiceId,
      whmcsServiceId: serviceId,
      clientId: user.userId,
      clientEmail: user.email,
      productId,
      productName: product.name,
      billingCycle,
      addons: [],
      basePrice: priceResult.data.basePrice,
      totalPrice: priceResult.data.total,
      status: 'Pending',
      createdAt: new Date(),
    });

    // Sync invoice to MongoDB if it exists
    if (invoiceId > 0) {
      const invoicesCollection = await getInvoicesCollection();
      await syncInvoiceToMongoDB(invoiceId, user.userId, invoicesCollection);
    }

    // Revalidate pages
    revalidatePath('/dashboard/billing', 'page');
    revalidatePath('/dashboard/services', 'page');

    return {
      success: true,
      orderId,
      invoiceId,
      message: invoiceId > 0
        ? 'Order and invoice created successfully!'
        : 'Order created, but invoice generation is pending. Please check back soon.',
    };
  } catch (error: any) {
    console.error('Create service order error:', error);
    return { success: false, error: error.message || 'Failed to create order' };
  }
}
