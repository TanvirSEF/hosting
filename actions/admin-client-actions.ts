'use server';

import { whmcsApi } from '@/lib/whmcs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentAdmin } from '@/actions/admin-auth';

export async function addClientAction(formData: FormData) {
  try {
    const firstname = formData.get('firstname') as string;
    const lastname = formData.get('lastname') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const address1 = formData.get('address1') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const postcode = formData.get('postcode') as string;
    const country = formData.get('country') as string;
    const phonenumber = formData.get('phonenumber') as string;

    // Sanitize phone number - remove + and other special characters, keep only digits and dashes
    const sanitizedPhone = phonenumber
      ? phonenumber.trim().replace(/[^0-9-]/g, '') // Remove everything except digits and dashes
      : '';

    // Call WHMCS AddClient API
    const response = await whmcsApi('AddClient', {
      firstname,
      lastname,
      email,
      address1,
      city,
      state,
      postcode,
      country,
      phonenumber: sanitizedPhone !== '' ? sanitizedPhone : '000-000-0000', // Use default if empty
      password2: password,
      clientip: '127.0.0.1',
      noemail: 1, // Don't send welcome email
    });

    if (response.result === 'success') {
      // Revalidate the clients page
      revalidatePath('/spike/clients', 'page');

      return {
        success: true,
        message: 'Client added successfully!',
        clientId: response.clientid,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to add client',
      };
    }
  } catch (error: any) {
    console.error('Add Client Error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while adding client',
    };
  }
}

export async function deleteClientAction(clientId: string) {
  try {
    // Call WHMCS DeleteClient API
    const response = await whmcsApi('DeleteClient', {
      clientid: clientId,
      deleteusers: true, // Delete associated user accounts
      deletetransactions: true, // Delete transactions
    });

    if (response.result === 'success') {
      // Also delete from MongoDB to keep database in sync
      try {
        const { getClientsCollection } = await import('@/lib/db');
        const collection = await getClientsCollection();
        await collection.deleteOne({ whmcsId: parseInt(clientId) });
        console.log(`Client ${clientId} deleted from MongoDB`);
      } catch (mongoError) {
        // Log error but don't fail the operation since WHMCS deletion succeeded
        console.error('MongoDB deletion error:', mongoError);
      }

      // Revalidate the clients page
      revalidatePath('/spike/clients', 'page');

      return {
        success: true,
        message: 'Client deleted successfully!',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to delete client',
      };
    }
  } catch (error: any) {
    console.error('Delete Client Error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while deleting client',
    };
  }
}

/**
 * Get detailed client information
 */
export async function getClientDetailsAction(clientId: string | number) {
  try {
    const response = await whmcsApi('GetClientsDetails', {
      clientid: clientId,
      stats: true,
    });

    if (response.result === 'success') {
      return {
        success: true,
        data: response.client,
        stats: response.stats || {},
      };
    } else {
      return {
        success: false,
        error: response.message || 'Client not found',
      };
    }
  } catch (error: any) {
    console.error('Get Client Details Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch client details',
    };
  }
}

/**
 * Update client information
 */
export async function updateClientAction(formData: FormData) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    if (admin.role !== 'SUPER_ADMIN') {
      return {
        success: false,
        error: 'Only super admins can edit client contacts',
      };
    }

    const clientId = formData.get('clientid') as string;
    if (!clientId) {
      return {
        success: false,
        error: 'Client ID is required',
      };
    }

    const updateData: any = {
      clientid: clientId,
    };

    // Only include fields that are provided
    const fields = [
      'firstname',
      'lastname',
      'email',
      'address1',
      'address2',
      'city',
      'state',
      'postcode',
      'country',
      'phonenumber',
      'companyname',
      'status',
    ];

    fields.forEach((field) => {
      const value = formData.get(field);
      if (value) {
        updateData[field] = value;
      }
    });

    const response = await whmcsApi('UpdateClient', updateData);

    if (response.result === 'success') {
      // Also update in MongoDB to keep database in sync
      try {
        const { getClientsCollection } = await import('@/lib/db');
        const collection = await getClientsCollection();

        const mongoUpdate: any = {
          updatedAt: new Date(),
          lastSyncedAt: new Date(),
        };

        // Update only the fields that were changed
        if (updateData.firstname) mongoUpdate.firstname = updateData.firstname;
        if (updateData.lastname) mongoUpdate.lastname = updateData.lastname;
        if (updateData.email)
          mongoUpdate.email = updateData.email.toLowerCase();
        if (updateData.companyname)
          mongoUpdate.companyname = updateData.companyname;
        if (updateData.status) mongoUpdate.status = updateData.status;
        if (updateData.phonenumber)
          mongoUpdate.phonenumber = updateData.phonenumber;

        await collection.updateOne(
          { whmcsId: parseInt(clientId) },
          { $set: mongoUpdate }
        );
        console.log(`Client ${clientId} updated in MongoDB`);
      } catch (mongoError) {
        // Log error but don't fail the operation since WHMCS update succeeded
        console.error('MongoDB update error:', mongoError);
      }

      revalidatePath('/spike/clients', 'page');
      return {
        success: true,
        message: 'Client updated successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to update client',
      };
    }
  } catch (error: any) {
    console.error('Update Client Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update client',
    };
  }
}

/**
 * Reset client password
 */
import { SignJWT } from 'jose';
import { getPasswordResetTokensCollection } from '@/lib/db';

/**
 * Reset client password
 */
export async function resetClientPasswordAction(
  clientId: string | number,
  email: string
) {
  try {
    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

    // 1. Generate JWT Token
    const token = await new SignJWT({ email, purpose: 'password_reset' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(JWT_SECRET);

    // 2. Store token in MongoDB
    const tokenCollection = await getPasswordResetTokensCollection();
    await tokenCollection.insertOne({
      token,
      email,
      used: false,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      requestedByIp: 'Admin Action', // Track that admin requested it
      createdAt: new Date(),
    });

    // 3. Fetch Client Name for Email
    let clientName = 'Valued Client';
    try {
      const clientDetails = await whmcsApi('GetClientsDetails', {
        clientid: clientId,
        stats: false,
      });
      if (clientDetails.result === 'success' && clientDetails.client) {
        clientName =
          clientDetails.client.firstname ||
          clientDetails.client.lastname ||
          'Valued Client';
      }
    } catch (err) {
      console.warn('Could not fetch client name for email, using default.');
    }

    // 4. Send Email via Resend (lib/email.ts)
    const { sendPasswordResetEmail } = await import('@/lib/email');
    const emailResult = await sendPasswordResetEmail(email, token, clientName);

    if (emailResult.success) {
      return {
        success: true,
        message: 'Password reset link sent to client email (via Resend)',
      };
    } else {
      return {
        success: false,
        error: 'Failed to send reset email',
      };
    }
  } catch (error: any) {
    console.error('Reset Password Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to initiate password reset',
    };
  }
}

/**
 * Send email to client
 */
export async function sendEmailToClientAction(
  clientId: string | number,
  subject: string,
  message: string
) {
  try {
    // 1. Fetch Client Email & Name
    let email = '';
    let clientName = 'Valued Client';

    const clientDetails = await whmcsApi('GetClientsDetails', {
      clientid: clientId,
      stats: false,
    });
    if (clientDetails.result === 'success' && clientDetails.client) {
      email = clientDetails.client.email;
      clientName =
        clientDetails.client.firstname ||
        clientDetails.client.lastname ||
        'Valued Client';
    } else {
      return {
        success: false,
        error: 'Client not found or API error',
      };
    }

    if (!email) {
      return {
        success: false,
        error: 'Client email address not found in WHMCS',
      };
    }

    // 2. Send Custom Email via Resend
    const { sendCustomEmail } = await import('@/lib/email');
    const emailResult = await sendCustomEmail(
      email,
      subject,
      message,
      clientName
    );

    if (emailResult.success) {
      return {
        success: true,
        message: 'Email sent successfully',
      };
    } else {
      return {
        success: false,
        error: 'Failed to send email via Resend',
      };
    }
  } catch (error: any) {
    console.error('Send Email Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Get client services
 */
export async function getClientServicesAction(clientId: string | number) {
  try {
    const response = await whmcsApi('GetClientsProducts', {
      clientid: clientId,
      limitnum: 1000,
    });

    if (response.result === 'success') {
      const products = response.products?.product;
      const productList = Array.isArray(products)
        ? products
        : products
          ? [products]
          : [];

      return {
        success: true,
        data: productList,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to fetch services',
      };
    }
  } catch (error: any) {
    console.error('Get Client Services Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch services',
    };
  }
}

/**
 * Get client domains
 */
export async function getClientDomainsAction(clientId: string | number) {
  try {
    const response = await whmcsApi('GetClientsDomains', {
      clientid: clientId,
      limitnum: 1000,
    });

    if (response.result === 'success') {
      const domains = response.domains?.domain;
      const domainList = Array.isArray(domains)
        ? domains
        : domains
          ? [domains]
          : [];

      return {
        success: true,
        data: domainList,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to fetch domains',
      };
    }
  } catch (error: any) {
    console.error('Get Client Domains Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch domains',
    };
  }
}

/**
 * Get client invoices
 */
export async function getClientInvoicesAction(clientId: string | number) {
  try {
    const response = await whmcsApi('GetInvoices', {
      userid: clientId,
      limitnum: 1000,
    });

    if (response.result === 'success') {
      const invoices = response.invoices?.invoice;
      const invoiceList = Array.isArray(invoices)
        ? invoices
        : invoices
          ? [invoices]
          : [];

      return {
        success: true,
        data: invoiceList,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to fetch invoices',
      };
    }
  } catch (error: any) {
    console.error('Get Client Invoices Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch invoices',
    };
  }
}
