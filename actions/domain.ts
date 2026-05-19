'use server';

import { whmcsApi } from '@/lib/whmcs';
import { z } from 'zod';

const domainSchema = z.object({
  domain: z
    .string()
    .min(3)
    .regex(/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/, 'Invalid domain format'),
});

export async function checkDomainAvailability(formData: FormData) {
  const domain = formData.get('domain') as string;

  // Validation
  const result = domainSchema.safeParse({ domain });
  if (!result.success) {
    return { error: 'Please enter a valid domain (e.g. webbly.com)' };
  }

  try {
    // WHMCS DomainWhois API Call
    const response = await whmcsApi('DomainWhois', { domain });

    // WHMCS Response handling
    if (response.status === 'available') {
      return { status: 'available', domain };
    } else if (response.status === 'unavailable') {
      return { status: 'unavailable', domain };
    } else {
      return { error: 'Could not check domain. Try again.' };
    }
  } catch (error) {
    return { error: 'Search failed. Please try later.' };
  }
}
