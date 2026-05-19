'use server';

import { jwtVerify } from 'jose';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import {
  getClientsCollection,
  getPasswordResetTokensCollection,
} from '@/lib/db';
import { updateClientPassword } from '@/lib/whmcs';
import { redirect } from 'next/navigation';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Verify reset token and get associated email
 * @param token - JWT reset token
 * @returns Email address or null if invalid
 */
export async function verifyResetToken(token: string) {
  try {
    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.purpose !== 'password_reset') {
      return null;
    }

    const email = payload.email as string;

    // Check if token exists in database and is not used
    const tokenCollection = await getPasswordResetTokensCollection();
    const tokenDoc = await tokenCollection.findOne({
      token,
      email,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      return null;
    }

    return email;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Reset password action - updates password in both WHMCS and MongoDB
 * @param prevState - Previous state
 * @param formData - Form data with token, password, confirmPassword
 * @returns Success or error state
 */
export async function resetPasswordAction(prevState: any, formData: FormData) {
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // Validate passwords
  const result = resetPasswordSchema.safeParse({ password, confirmPassword });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    // Verify token and get email
    const email = await verifyResetToken(token);

    if (!email) {
      return {
        error:
          'Invalid or expired reset link. Please request a new password reset.',
      };
    }

    const validatedPassword = result.data.password;

    // Update password in WHMCS first
    await updateClientPassword(email, validatedPassword);

    // Hash password for MongoDB
    const hashedPassword = await bcrypt.hash(validatedPassword, 10);

    // Update or create client in MongoDB
    const clientsCollection = await getClientsCollection();
    await clientsCollection.updateOne(
      { email },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      },
      { upsert: false }
    );

    // Mark token as used
    const tokenCollection = await getPasswordResetTokensCollection();
    await tokenCollection.updateOne({ token }, { $set: { used: true } });

    // Success - redirect will happen in the component
    return {
      success: true,
      message: 'Password reset successfully',
    };
  } catch (error: any) {
    console.error('Reset password error:', error);
    return {
      error: 'Failed to reset password. Please try again or contact support.',
    };
  }
}
