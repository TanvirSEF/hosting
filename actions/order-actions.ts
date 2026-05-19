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
 * Create hosting order for promotional offers
 */
export async function createHostingOrder(
    pid: number,
    billingCycle: string = 'monthly'
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

        // Create order in WHMCS
        const orderData: any = {
            clientid: user.userId,
            pid: pid,
            billingcycle: billingCycle,
            paymentmethod: process.env.WHMCS_ORDER_PAYMENT_METHOD || 'stripe', // Default to stripe or configured method
        };

        const response = await whmcsApi('AddOrder', orderData);

        if (response.result !== 'success') {
            return {
                success: false,
                error: response.message || 'Failed to create order',
            };
        }

        const orderId = parseInt(response.orderid);
        const invoiceId = parseInt(response.invoiceid);
        const serviceId = response.productids
            ? parseInt(response.productids)
            : undefined;

        // Background sync to MongoDB (best effort)
        try {
            // Get product details for syncing
            const productResponse = await whmcsApi('GetProducts', { pid: pid });
            let productName = 'Hosting Product';
            let productPrice = 0;

            if (productResponse.result === 'success' && productResponse.products?.product) {
                const products = Array.isArray(productResponse.products.product)
                    ? productResponse.products.product
                    : [productResponse.products.product];
                const product = products.find((p: any) => parseInt(p.pid) === pid);
                if (product) {
                    productName = product.name;
                    const pricing = product.pricing?.USD || product.pricing || {};
                    productPrice = parseFloat(pricing[billingCycle] || pricing.monthly || 0);
                }
            }

            const ordersCollection = await getHostingOrdersCollection();
            await ordersCollection.insertOne({
                whmcsOrderId: orderId,
                whmcsInvoiceId: invoiceId,
                whmcsServiceId: serviceId,
                clientId: user.userId,
                clientEmail: user.email,
                productId: pid,
                productName: productName,
                billingCycle,
                addons: [],
                basePrice: productPrice,
                totalPrice: productPrice,
                status: 'Pending',
                createdAt: new Date(),
            });

            // Sync invoice to MongoDB
            const invoicesCollection = await getInvoicesCollection();
            await syncInvoiceToMongoDB(invoiceId, user.userId, invoicesCollection);
        } catch (syncError) {
            console.error('Order sync error:', syncError);
            // Continue even if sync fails, as the order is in WHMCS
        }

        // Revalidate pages
        revalidatePath('/dashboard/billing');
        revalidatePath('/dashboard/services');

        return {
            success: true,
            orderId,
            invoiceId,
            message: 'Order created successfully!',
        };
    } catch (error: any) {
        console.error('Create hosting order error:', error);
        return { success: false, error: error.message || 'Failed to create order' };
    }
}
