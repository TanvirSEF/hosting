'use server';

import { whmcsApi } from '@/lib/whmcs';
import { getClientsCollection } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
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
 * Get account information from WHMCS
 */
export async function getAccountInfoAction() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const response = await whmcsApi('GetClientsDetails', {
      clientid: user.userId,
      stats: false,
    });

    if (response.result === 'success') {
      return {
        success: true,
        data: response.client,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to fetch account information',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch account information',
    };
  }
}

/**
 * Update client password via WHMCS API and sync to MongoDB
 */
export async function changePasswordAction(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Not authenticated' };
    }

    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return { error: 'All fields are required' };
    }

    if (newPassword.length < 8) {
      return { error: 'Password must be at least 8 characters long' };
    }

    if (newPassword !== confirmPassword) {
      return { error: 'New passwords do not match' };
    }

    // Verify current password from MongoDB
    const collection = await getClientsCollection();
    const client = await collection.findOne({ whmcsId: user.userId });

    if (!client) {
      return { error: 'Client not found' };
    }

    const isValidPassword = await bcrypt.compare(
      currentPassword,
      client.password
    );
    if (!isValidPassword) {
      return { error: 'Current password is incorrect' };
    }

    // Update password in WHMCS using UpdateClient with password2
    // Note: Some WHMCS configurations may require admin permissions for this
    const response = await whmcsApi('UpdateClient', {
      clientid: user.userId,
      password2: newPassword,
    });

    if (response.result !== 'success') {
      return {
        error: response.message || 'Failed to update password in WHMCS',
      };
    }

    // Sync new password to MongoDB (hash it first)
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await collection.updateOne(
      { whmcsId: user.userId },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }
    );

    revalidatePath('/dashboard/account/security');
    return { success: true, message: 'Password updated successfully' };
  } catch (error: any) {
    return {
      error: error.message || 'Failed to change password',
    };
  }
}

/**
 * Get 2FA status from WHMCS (if available)
 */
export async function get2FAStatusAction() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // WHMCS doesn't have a direct 2FA API endpoint in standard API
    // This is a placeholder - actual implementation depends on WHMCS version and plugins
    // Some WHMCS installations use custom fields or plugins for 2FA

    // For now, we'll check if there's a twoFactorAuth field in client details
    const response = await whmcsApi('GetClientsDetails', {
      clientid: user.userId,
    });

    if (response.result === 'success') {
      // Check for 2FA status (this field name may vary)
      const twoFactorEnabled =
        response.client?.twofactorauth === '1' ||
        response.client?.twofactorauth === '1' ||
        false;

      return {
        success: true,
        twoFactorEnabled,
        data: response.client,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to fetch 2FA status',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch 2FA status',
    };
  }
}

/**
 * Enable/Disable 2FA (if supported by WHMCS)
 * Note: Standard WHMCS API doesn't support 2FA management directly
 * This would require custom API endpoints or hooks
 */
export async function toggle2FAAction(enabled: boolean) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // WHMCS standard API doesn't have direct 2FA toggle
    // This would need to be implemented via:
    // 1. Custom API endpoint in WHMCS
    // 2. Database hook
    // 3. Or through admin API with proper permissions

    // For now, return a message that this feature requires custom implementation
    return {
      success: false,
      error:
        '2FA management requires custom WHMCS implementation. Please contact support.',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to toggle 2FA',
    };
  }
}
