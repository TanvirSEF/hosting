'use server';

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getClientsCollection, getHostingOrdersCollection } from '@/lib/db';

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
 * Get the user's locked/default currency (if they have one)
 * Returns null if user is not logged in or hasn't placed an order yet
 */
export async function getUserDefaultCurrency(): Promise<{
  success: boolean;
  currency: string | null;
  isLocked: boolean;
}> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: true, currency: null, isLocked: false };
    }

    const clientsCollection = await getClientsCollection();
    const client = await clientsCollection.findOne(
      { whmcsId: user.userId },
      { projection: { defaultCurrency: 1 } }
    );

    if (client?.defaultCurrency) {
      return { success: true, currency: client.defaultCurrency, isLocked: true };
    }

    // Check if user has any orders (if they do, they should have a locked currency)
    const ordersCollection = await getHostingOrdersCollection();
    const orderCount = await ordersCollection.countDocuments({ clientId: user.userId });

    // If user has orders but no defaultCurrency set, they're not locked yet
    // (this handles existing users who already have orders)
    return { success: true, currency: null, isLocked: orderCount > 0 };
  } catch (error) {
    console.error('Error getting user default currency:', error);
    return { success: false, currency: null, isLocked: false };
  }
}

/**
 * Set the user's default currency after their first order
 * This locks the currency and prevents future changes
 */
export async function setUserDefaultCurrency(
  currencyCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const validCurrency = currencyCode.toUpperCase().trim();
    if (!['USD', 'EUR', 'GBP', 'SEK'].includes(validCurrency)) {
      return { success: false, error: 'Invalid currency code' };
    }

    const clientsCollection = await getClientsCollection();

    // Only set if not already set (lock after first order)
    const client = await clientsCollection.findOne(
      { whmcsId: user.userId },
      { projection: { defaultCurrency: 1 } }
    );

    if (client?.defaultCurrency) {
      // Already locked, don't change
      return { success: true };
    }

    await clientsCollection.updateOne(
      { whmcsId: user.userId },
      {
        $set: {
          defaultCurrency: validCurrency,
          updatedAt: new Date(),
        },
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error setting user default currency:', error);
    return { success: false, error: 'Failed to set default currency' };
  }
}
