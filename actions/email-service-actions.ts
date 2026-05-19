'use server';

import { getEmailAccountsCollection } from '@/lib/db';
import { getEmailServicesCollection } from '@/lib/db';
import {
    createEmailAccount as qboxCreateEmail,
    deleteEmailAccount as qboxDeleteEmail,
    updateEmailPassword as qboxUpdatePassword,
    getEmailAccountInfo as qboxGetEmailInfo,
    listEmailAccounts as qboxListEmails,
} from '@/lib/qboxmail';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/session';
import { DEFAULT_FREE_TIER, EMAIL_PLANS, type EmailPlanType } from '@/lib/email-bundle';

/**
 * Get all email services for the current user
 */
export async function getEmailServicesAction() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return {
                success: false,
                error: 'Please login to continue',
                requiresLogin: true,
            };
        }

        const emailAccountsCollection = await getEmailAccountsCollection();
        const emailAccounts = await emailAccountsCollection
            .find({ clientId: Number(user.userId) })
            .sort({ createdAt: -1 })
            .toArray();

        return {
            success: true,
            data: emailAccounts,
        };
    } catch (error: any) {
        console.error('Get email services error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get email accounts for a specific service
 */
export async function getServiceEmailAccountsAction(serviceId: number) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return {
                success: false,
                error: 'Please login to continue',
                requiresLogin: true,
            };
        }

        const emailAccountsCollection = await getEmailAccountsCollection();
        const emailAccounts = await emailAccountsCollection
            .find({
                clientId: Number(user.userId),
                whmcsServiceId: serviceId,
            })
            .sort({ createdAt: -1 })
            .toArray();

        return {
            success: true,
            data: emailAccounts,
        };
    } catch (error: any) {
        console.error('Get service email accounts error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create a new email account
 */
export async function createEmailAccountAction(
    serviceId: number,
    domain: string,
    emailUsername: string,
    password: string,
    firstName: string = 'User',
    quota: number = 1024
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

        // Enforce plan limits from hybrid email service (fallback to free-tier defaults)
        const emailServicesCollection = await getEmailServicesCollection();
        const emailService = await emailServicesCollection.findOne({
            whmcsServiceId: serviceId,
            clientId: Number(user.userId),
        });

        const effectivePlan = (emailService?.plan || 'free') as EmailPlanType;
        const effectiveMaxAccounts = Number(
            emailService?.maxAccounts ?? DEFAULT_FREE_TIER.maxAccounts
        );
        const effectiveQuotaCap = Number(
            emailService?.quotaPerAccountMB ?? DEFAULT_FREE_TIER.quotaPerAccountMB
        );

        const accountsUsed = await emailAccountsCollection.countDocuments({
            whmcsServiceId: serviceId,
            clientId: Number(user.userId),
            status: { $ne: 'Terminated' },
        });

        if (effectiveMaxAccounts !== -1 && accountsUsed >= effectiveMaxAccounts) {
            if (effectivePlan === 'free') {
                return {
                    success: false,
                    error: `Free plan allows only ${effectiveMaxAccounts} accounts`,
                };
            }

            const planName = EMAIL_PLANS[effectivePlan]?.name || 'Current';
            return {
                success: false,
                error: `${planName} allows only ${effectiveMaxAccounts} accounts`,
            };
        }

        if (!Number.isFinite(quota) || quota <= 0) {
            return {
                success: false,
                error: 'Invalid quota value',
            };
        }

        if (quota > effectiveQuotaCap) {
            return {
                success: false,
                error: `Quota exceeds your plan limit (${effectiveQuotaCap} MB per account)`,
            };
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
            const errMsg = qboxResult.error || 'Failed to create email account in QBoxMail';
            console.error('[Email Create] Qboxmail error for', domain, '/', emailUsername, ':', errMsg);

            // Domain needs DNS ownership verification in Qboxmail
            if (errMsg.includes('DOMAIN_NEEDS_VERIFICATION:')) {
                try {
                    const parts = errMsg.split('DOMAIN_NEEDS_VERIFICATION:')[1];
                    const colonIdx = parts.indexOf(':');
                    const domainName = parts.substring(0, colonIdx);
                    const info = JSON.parse(parts.substring(colonIdx + 1));
                    const possessionCode = info.possession_code || 'N/A';

                    return {
                        success: false,
                        error: `Domain ${domainName} needs DNS verification. Add A record: ${possessionCode}.${domainName} → 185.97.217.16, then verify in Qboxmail. Contact support for help.`,
                    };
                } catch {
                    // Fallback if parsing fails
                }
                return {
                    success: false,
                    error: `Domain ${domain} needs DNS verification in Qboxmail before email accounts can be created. Please contact support.`,
                };
            }

            if (errMsg.includes('DOMAIN_NOT_ACTIVE')) {
                return {
                    success: false,
                    error: `Domain ${domain} is not active in QBoxMail. It may have been removed. Please contact support.`,
                };
            }

            // "domain is not active" from Qboxmail API — try auto-DNS retry
            if (errMsg.toLowerCase().includes('not active') ||
                errMsg.toLowerCase().includes('ownership')) {
                try {
                    const { autoSetupQboxmailDns } = await import('@/lib/auto-dns');
                    const dnsResult = await autoSetupQboxmailDns(domain);
                    console.log('[Email Create] Retry auto-DNS:', dnsResult.message);
                } catch { /* ignore */ }

                return {
                    success: false,
                    error: `Domain ${domain} is still being verified in Qboxmail. DNS record has been set up — please wait 2-5 minutes and try again.`,
                };
            }

            return {
                success: false,
                error: errMsg,
            };
        }

        // Save to MongoDB
        await emailAccountsCollection.insertOne({
            whmcsServiceId: serviceId,
            clientId: Number(user.userId),
            clientEmail: user.email,
            domain,
            emailAddress: fullEmail,
            emailUsername,
            quota,
            status: 'Active',
            createdAt: new Date(),
            lastSyncedAt: new Date(),
        });

        revalidatePath('/dashboard/services', 'page');

        return {
            success: true,
            message: 'Email account created successfully',
            data: {
                emailAddress: fullEmail,
            },
        };
    } catch (error: any) {
        console.error('Create email account error:', error);
        return {
            success: false,
            error: error.message || 'Failed to create email account',
        };
    }
}

/**
 * Delete an email account
 */
export async function deleteEmailAccountAction(accountId: string) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return {
                success: false,
                error: 'Please login to continue',
                requiresLogin: true,
            };
        }

        const emailAccountsCollection = await getEmailAccountsCollection();
        const { ObjectId } = await import('mongodb');

        // Get email account
        const emailAccount = await emailAccountsCollection.findOne({
            _id: new ObjectId(accountId),
            clientId: Number(user.userId),
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

        revalidatePath('/dashboard/services', 'page');

        return {
            success: true,
            message: 'Email account deleted successfully',
        };
    } catch (error: any) {
        console.error('Delete email account error:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete email account',
        };
    }
}

/**
 * Update email account password
 */
export async function updateEmailPasswordAction(
    accountId: string,
    newPassword: string
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

        const emailAccountsCollection = await getEmailAccountsCollection();
        const { ObjectId } = await import('mongodb');

        // Get email account
        const emailAccount = await emailAccountsCollection.findOne({
            _id: new ObjectId(accountId),
            clientId: Number(user.userId),
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
        console.error('Update email password error:', error);
        return {
            success: false,
            error: error.message || 'Failed to update password',
        };
    }
}

/**
 * Get email account details
 */
export async function getEmailAccountDetailsAction(accountId: string) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return {
                success: false,
                error: 'Please login to continue',
                requiresLogin: true,
            };
        }

        const emailAccountsCollection = await getEmailAccountsCollection();
        const { ObjectId } = await import('mongodb');

        // Get email account from MongoDB
        const emailAccount = await emailAccountsCollection.findOne({
            _id: new ObjectId(accountId),
            clientId: Number(user.userId),
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
        console.error('Get email account details error:', error);
        return {
            success: false,
            error: error.message || 'Failed to get email account details',
        };
    }
}

/**
 * Suspend an email account (Admin only)
 */
export async function suspendEmailAccountAction(accountId: string) {
    try {
        const emailAccountsCollection = await getEmailAccountsCollection();
        const { ObjectId } = await import('mongodb');

        await emailAccountsCollection.updateOne(
            { _id: new ObjectId(accountId) },
            {
                $set: {
                    status: 'Suspended',
                    suspendedAt: new Date(),
                },
            }
        );

        revalidatePath('/spike', 'layout');

        return {
            success: true,
            message: 'Email account suspended',
        };
    } catch (error: any) {
        console.error('Suspend email account error:', error);
        return {
            success: false,
            error: error.message || 'Failed to suspend email account',
        };
    }
}

/**
 * Unsuspend an email account (Admin only)
 */
export async function unsuspendEmailAccountAction(accountId: string) {
    try {
        const emailAccountsCollection = await getEmailAccountsCollection();
        const { ObjectId } = await import('mongodb');

        await emailAccountsCollection.updateOne(
            { _id: new ObjectId(accountId) },
            {
                $set: {
                    status: 'Active',
                    suspendedAt: undefined,
                },
            }
        );

        revalidatePath('/spike', 'layout');

        return {
            success: true,
            message: 'Email account unsuspended',
        };
    } catch (error: any) {
        console.error('Unsuspend email account error:', error);
        return {
            success: false,
            error: error.message || 'Failed to unsuspend email account',
        };
    }
}
