'use server';

import { whmcsApi } from '@/lib/whmcs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import {
  getClientsCollection,
  getPasswordResetTokensCollection,
} from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

/**
 * Forgot password action - generates reset token and sends email via custom SMTP
 * @param prevState - Previous state from useActionState
 * @param formData - Form data containing email
 * @returns Success or error state
 */
export async function forgotPasswordAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;

  // Validate email
  const result = forgotPasswordSchema.safeParse({ email });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const validatedEmail = result.data.email.toLowerCase();

  try {
    // Check if client exists in MongoDB or WHMCS
    const collection = await getClientsCollection();
    let client = await collection.findOne({ email: validatedEmail });

    // If not in MongoDB, check WHMCS
    if (!client) {
      const { getClientByEmail } = await import('@/lib/whmcs');
      const whmcsClient = await getClientByEmail(validatedEmail);

      if (!whmcsClient || !whmcsClient.userid) {
        return {
          error:
            'No account found with this email address. Please check your email or create a new account.',
        };
      }

      // Client exists in WHMCS, use their details
      client = {
        _id: undefined,
        whmcsId: parseInt(whmcsClient.userid),
        email: validatedEmail,
        firstname: whmcsClient.firstname,
        lastname: whmcsClient.lastname,
      } as any;
    }

    // Generate reset token (JWT with 1 hour expiry)
    const resetToken = await new SignJWT({
      email: validatedEmail,
      purpose: 'password_reset',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(JWT_SECRET);

    // Ensure client exists (defensive check for TypeScript)
    if (!client) {
      return {
        error:
          'Unable to process request. Please try again or contact support.',
      };
    }

    // Store token in database
    const tokenCollection = await getPasswordResetTokensCollection();
    await tokenCollection.insertOne({
      email: validatedEmail,
      token: resetToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      used: false,
      createdAt: new Date(),
    });

    // Send password reset email via custom email service (Resend)
    const { sendPasswordResetEmail } = await import('@/lib/email');
    await sendPasswordResetEmail(
      validatedEmail,
      resetToken,
      `${client.firstname} ${client.lastname}`
    );

    // Return success state
    return {
      success: true,
      email: validatedEmail,
      message: 'Password reset email sent successfully',
    };
  } catch (error: any) {

    return {
      error:
        'Unable to send password reset email. Please try again later or contact support.',
    };
  }
}

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const returnUrl = formData.get('returnUrl') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const result = loginSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  // The 'email' and 'password' variables are already extracted above.
  // We can use the validated data from 'result.data' for consistency and type safety.
  const validatedEmail = result.data.email;
  const validatedPassword = result.data.password;

  const emailLower = validatedEmail.toLowerCase();

  try {
    let collection;
    try {
      collection = await getClientsCollection();
    } catch (error: any) {
      console.error('[loginAction] Failed to get MongoDB collection', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
      });
      throw error;
    }

    // Check if client exists in MongoDB
    let client = await collection.findOne({ email: emailLower });

    if (client) {
      // Client exists - verify password from MongoDB
      const isValid = await bcrypt.compare(password, client.password);

      if (!isValid) {
        return { error: 'Invalid credentials. Please try again.' };
      }

      // Sync latest data from WHMCS in background (non-blocking)
    } else {
      // First time login - validate with WHMCS
      const response = await whmcsApi('ValidateLogin', {
        email: emailLower,
        password2: password,
      });

      if (response.result !== 'success') {
        return { error: 'Invalid credentials. Please try again.' };
      }

      // Get full client details from WHMCS
      const clientDetails = await whmcsApi('GetClientsDetails', {
        clientid: response.userid,
      });

      if (!clientDetails.client) {
        return { error: 'Account not found. Please contact support.' };
      }

      // Hash password and save to MongoDB
      const hashedPassword = await bcrypt.hash(password, 10);
      const now = new Date();

      const insertResult = await collection.insertOne({
        whmcsId: parseInt(response.userid),
        email: emailLower,
        password: hashedPassword,
        firstname: clientDetails.client.firstname,
        lastname: clientDetails.client.lastname,
        companyname: clientDetails.client.companyname || undefined,
        status: clientDetails.client.status,
        createdAt: now,
        updatedAt: now,
        lastSyncedAt: now,
      });

      client = {
        _id: insertResult.insertedId,
        whmcsId: parseInt(response.userid),
        email: emailLower,
        password: hashedPassword,
        firstname: clientDetails.client.firstname,
        lastname: clientDetails.client.lastname,
        companyname: clientDetails.client.companyname || undefined,
        status: clientDetails.client.status,
        createdAt: now,
        updatedAt: now,
        lastSyncedAt: now,
      };
    }

    // Generate JWT token
    const token = await new SignJWT({
      mongoId: client!._id?.toString(),
      userId: client!.whmcsId,
      email: emailLower,
      name: `${client!.firstname} ${client!.lastname}`,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    (await cookies()).set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    // Revalidate all dashboard cache to show fresh data after login
    revalidatePath('/dashboard', 'page');
    revalidatePath('/dashboard/services', 'page');
    revalidatePath('/dashboard/domains', 'page');
    revalidatePath('/dashboard/billing', 'page');
    revalidatePath('/dashboard/support', 'page');
  } catch (error: any) {
    console.error('[loginAction] Login failed', {
      email: emailLower,
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    });
    return { error: 'Something went wrong. Please try again later.' };
  }

  // Redirect to returnUrl if provided, otherwise to dashboard
  redirect(returnUrl || '/dashboard');
}

// Background sync function
async function syncClientFromWHMCS(whmcsId: number, collection: any) {
  try {
    const clientDetails = await whmcsApi('GetClientsDetails', {
      clientid: whmcsId,
    });

    if (clientDetails.client) {
      await collection.updateOne(
        { whmcsId },
        {
          $set: {
            firstname: clientDetails.client.firstname,
            lastname: clientDetails.client.lastname,
            companyname: clientDetails.client.companyname || undefined,
            status: clientDetails.client.status,
            updatedAt: new Date(),
            lastSyncedAt: new Date(),
          },
        }
      );
    }
  } catch (error) {
  }
}

export async function logoutAction() {
  (await cookies()).delete('session');
  // Redirect to localized login page (default locale: en)
  redirect('/en/login');
}
