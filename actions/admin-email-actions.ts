'use server';

import { getEmailAccountsCollection } from '@/lib/db';
import {
    createEmailAccount as qboxCreateEmail,
    deleteEmailAccount as qboxDeleteEmail,
    updateEmailPassword as qboxUpdatePassword,
    getEmailAccountInfo as qboxGetEmailInfo,
    setEmailQuota as qboxUpdateQuota,
} from '@/lib/qboxmail';
import { revalidatePath } from 'next/cache';
import { whmcsApi } from '@/lib/whmcs';

/**
 * Get email accounts for a specific service (Admin)
 */
export async function getAdminServiceEmailAccountsAction(serviceId: number) {
    try {
        const emailAccountsCollection = await getEmailAccountsCollection();
        const emailAccounts = await emailAccountsCollection
            .find({
                whmcsServiceId: serviceId,
            })
            .sort({ createdAt: -1 })
            .toArray();

        return {
            success: true,
            data: emailAccounts,
        };
    } catch (error: any) {
        console.error('Get admin service email accounts error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create a new email account (Admin)
 */
export async function createAdminEmailAccountAction(
    serviceId: number,
    clientId: number,
    domain: string,
    emailUsername: string,
    password: string,
    firstName: string = 'User',
    quota: number = 1024
) {
    try {
        // Validate email username
        const emailRegex = /^[a-zA-Z0-9._-]+$/;
        if (!emailRegex.test(emailUsername)) {
            return {
                success: false,
                error: 'Invalid email username. Use only letters, numbers, dots, hyphens, and underscores.',
            };
        }

        const fullEmail = `${emailUsername}@${domain}`;

        // Check if email already exists in our database
        const emailAccountsCollection = await getEmailAccountsCollection();
        const existingEmail = await emailAccountsCollection.findOne({
            emailAddress: fullEmail,
        });

        if (existingEmail) {
            return {
                success: false,
                error: 'This email address already exists',
            };
        }

        // Get client details for email creation
        let clientEmail = '';
        try {
            const clientResponse = await whmcsApi('GetClientsDetails', {
                clientid: clientId,
            });
            if (clientResponse.result === 'success') {
                clientEmail = clientResponse.client.email;
            }
        } catch (error) {
            console.warn('Failed to fetch client email:', error);
        }

        // Create email account in QBoxMail
        const qboxResult = await qboxCreateEmail(
            domain,
            emailUsername,
            password,
            firstName,
            quota
        );

        if (!qboxResult.success) {
            return {
                success: false,
                error: qboxResult.error || 'Failed to create email account in QBoxMail',
            };
        }

        // Save to MongoDB
        await emailAccountsCollection.insertOne({
            whmcsServiceId: serviceId,
            clientId: clientId,
            clientEmail: clientEmail,
            domain,
            emailAddress: fullEmail,
            emailUsername,
            quota,
            status: 'Active',
            createdAt: new Date(),
            lastSyncedAt: new Date(),
        });

        revalidatePath('/spike/services', 'page');

        return {
            success: true,
            message: 'Email account created successfully',
            data: {
                emailAddress: fullEmail,
            },
        };
    } catch (error: any) {
        console.error('Create admin email account error:', error);
        return {
            success: false,
            error: error.message || 'Failed to create email account',
        };
    }
}

/**
 * Delete an email account (Admin)
 */
export async function deleteAdminEmailAccountAction(accountId: string) {
    try {
        const emailAccountsCollection = await getEmailAccountsCollection();
        const { ObjectId } = await import('mongodb');

        // Get email account
        const emailAccount = await emailAccountsCollection.findOne({
            _id: new ObjectId(accountId),
        });

        if (!emailAccount) {
            return {
                success: false,
                error: 'Email account not found',
            };
        }

        // Delete from QBoxMail
        const qboxResult = await qboxDeleteEmail(
            emailAccount.domain,
            emailAccount.emailUsername
        );

        if (!qboxResult.success) {
            console.warn('QBoxMail deletion warning:', qboxResult.error);
            // Continue with MongoDB deletion even if QBoxMail fails
        }

        // Delete from MongoDB
        await emailAccountsCollection.deleteOne({
            _id: new ObjectId(accountId),
        });

        revalidatePath('/spike/services', 'page');

        return {
            success: true,
            message: 'Email account deleted successfully',
        };
    } catch (error: any) {
        console.error('Delete admin email account error:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete email account',
        };
    }
}

/**
 * Update email account password (Admin)
 */
export async function updateAdminEmailPasswordAction(
    accountId: string,
    newPassword: string
) {
    try {
        const emailAccountsCollection = await getEmailAccountsCollection();
        const { ObjectId } = await import('mongodb');

        // Get email account
        const emailAccount = await emailAccountsCollection.findOne({
            _id: new ObjectId(accountId),
        });

        if (!emailAccount) {
            return {
                success: false,
                error: 'Email account not found',
            };
        }

        // Update password in QBoxMail
        const qboxResult = await qboxUpdatePassword(
            emailAccount.domain,
            emailAccount.emailUsername,
            newPassword
        );

        if (!qboxResult.success) {
            return {
                success: false,
                error: qboxResult.error || 'Failed to update password in QBoxMail',
            };
        }

        // Update last synced time in MongoDB
        await emailAccountsCollection.updateOne(
            { _id: new ObjectId(accountId) },
            {
                $set: {
                    lastSyncedAt: new Date(),
                },
            }
        );

        return {
            success: true,
            message: 'Password updated successfully',
        };
    } catch (error: any) {
        console.error('Update admin email password error:', error);
        return {
            success: false,
            error: error.message || 'Failed to update password',
        };
    }
}

/**
 * Update email account quota (Admin)
 */
export async function updateAdminEmailQuotaAction(
    accountId: string,
    newQuota: number
) {
    try {
        const emailAccountsCollection = await getEmailAccountsCollection();
        const { ObjectId } = await import('mongodb');

        // Get email account
        const emailAccount = await emailAccountsCollection.findOne({
            _id: new ObjectId(accountId),
        });

        if (!emailAccount) {
            return {
                success: false,
                error: 'Email account not found',
            };
        }

        // Update quota in QBoxMail
        const qboxResult = await qboxUpdateQuota(
            emailAccount.domain,
            emailAccount.emailUsername,
            newQuota
        );

        if (!qboxResult.success) {
            return {
                success: false,
                error: qboxResult.error || 'Failed to update quota in QBoxMail',
            };
        }

        // Update quota in MongoDB
        await emailAccountsCollection.updateOne(
            { _id: new ObjectId(accountId) },
            {
                $set: {
                    quota: newQuota,
                    lastSyncedAt: new Date(),
                },
            }
        );

        revalidatePath('/spike/services', 'page');

        return {
            success: true,
            message: 'Quota updated successfully',
        };
    } catch (error: any) {
        console.error('Update admin email quota error:', error);
        return {
            success: false,
            error: error.message || 'Failed to update quota',
        };
    }
}

/**
 * Get email account details (Admin)
 */
export async function getAdminEmailAccountDetailsAction(accountId: string) {
    try {
        const emailAccountsCollection = await getEmailAccountsCollection();
        const { ObjectId } = await import('mongodb');

        // Get email account from MongoDB
        const emailAccount = await emailAccountsCollection.findOne({
            _id: new ObjectId(accountId),
        });

        if (!emailAccount) {
            return {
                success: false,
                error: 'Email account not found',
            };
        }

        // Get details from QBoxMail
        const qboxResult = await qboxGetEmailInfo(
            emailAccount.domain,
            emailAccount.emailUsername
        );

        return {
            success: true,
            data: {
                ...emailAccount,
                qboxInfo: qboxResult.success ? qboxResult.data : null,
            },
        };
    } catch (error: any) {
        console.error('Get admin email account details error:', error);
        return {
            success: false,
            error: error.message || 'Failed to get email account details',
        };
    }
}
