'use server';

import { whmcsApi } from '@/lib/whmcs';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

/**
 * Get user's currency information from WHMCS
 */
export async function getUserCurrency() {
  try {
    const cookieStore = cookies();
    const session = (await cookieStore).get('session')?.value;

    if (!session) {
      return {
        currencyid: 1,
        currencycode: 'USD',
        currencyprefix: '$',
        currencysuffix: ' USD',
      };
    }

    try {
      const { payload } = await jwtVerify(session, JWT_SECRET);
      const userId = payload.userId as string | number;

      const response = await whmcsApi('GetClientsDetails', {
        clientid: userId,
        stats: false,
      });

      if (response.result === 'success' && response.client) {
        return {
          currencyid:
            response.client.currency || response.client.currencyid || 1,
          currencycode: response.client.currencycode || 'USD',
          currencyprefix: response.client.currencyprefix || '$',
          currencysuffix: response.client.currencysuffix || ' USD',
        };
      }
    } catch (error) {
      // Error fetching user currency
    }

    // Default fallback
    return {
      currencyid: 1,
      currencycode: 'USD',
      currencyprefix: '$',
      currencysuffix: ' USD',
    };
  } catch (error) {
    return {
      currencyid: 1,
      currencycode: 'USD',
      currencyprefix: '$',
      currencysuffix: ' USD',
    };
  }
}
