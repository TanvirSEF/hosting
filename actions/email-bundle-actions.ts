'use server';

import { getCurrentUser } from '@/lib/session';
import { getEmailAccountsCollection, getDb } from '@/lib/db';
import { whmcsApi } from '@/lib/whmcs';
import {
  addDomain,
  getDomainCode,
  listEmailAccounts as qboxListEmails
} from '@/lib/qboxmail';
import {
  EMAIL_PLANS,
  DEFAULT_FREE_TIER,
  type EmailPlanType,
  type EmailServiceDocument,
} from '@/lib/email-bundle';
import { revalidatePath } from 'next/cache';
import { ObjectId } from 'mongodb';

// Collection name for email services
const EMAIL_SERVICES_COLLECTION = 'email_services';

/**
 * Get email services collection
 */
async function getEmailServicesCollection() {
  const db = await getDb();
  return db.collection<EmailServiceDocument>(EMAIL_SERVICES_COLLECTION);
}

/**
 * Get email service for a hosting service
 * Returns the email service linked to a specific hosting service
 */
export async function getEmailServiceForHostingAction(
  whmcsServiceId: number
): Promise<{
  success: boolean;
  data?: EmailServiceDocument | null;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Please login to continue' };
    }

    const collection = await getEmailServicesCollection();
    const emailService = await collection.findOne({
      whmcsServiceId,
      clientId: Number(user.userId),
    });

    return { success: true, data: emailService };
  } catch (error: any) {
    console.error('Get email service error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all email services for the current user
 */
export async function getUserEmailServicesAction(): Promise<{
  success: boolean;
  data?: EmailServiceDocument[];
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Please login to continue' };
    }

    const collection = await getEmailServicesCollection();
    const services = await collection
      .find({ clientId: Number(user.userId) })
      .sort({ createdAt: -1 })
      .toArray();

    return { success: true, data: services };
  } catch (error: any) {
    console.error('Get user email services error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create email service when hosting is purchased
 * This is called automatically after hosting order is paid
 */
export async function createEmailServiceAction(params: {
  whmcsServiceId: number;
  clientId: number;
  domain: string;
  plan?: EmailPlanType;
  whmcsEmailServiceId?: number;
}): Promise<{
  success: boolean;
  data?: EmailServiceDocument;
  error?: string;
}> {
  try {
    const {
      whmcsServiceId,
      clientId,
      domain,
      plan = 'free',
      whmcsEmailServiceId
    } = params;

    const planConfig = EMAIL_PLANS[plan];

    // Check if email service already exists for this hosting service
    const collection = await getEmailServicesCollection();
    const existing = await collection.findOne({ whmcsServiceId, clientId });

    if (existing) {
      console.log('[Email Service] Service already exists:', existing._id);
      return { success: true, data: existing };
    }

    // Auto-provision domain in QBoxMail
    let qboxmailDomainCode: string | undefined;
    try {
      const domainInfo = await getDomainCode(domain);
      qboxmailDomainCode = domainInfo.code;
      console.log('[Email Service] QBoxMail domain provisioned:', qboxmailDomainCode);
    } catch (error: any) {
      console.warn('[Email Service] QBoxMail domain setup warning:', error.message);
      // Continue — domain provisioning can be retried on first email creation
    }

    // Create email service document as active immediately
    const emailService: EmailServiceDocument = {
      whmcsServiceId,
      clientId,
      domain,
      plan,
      maxAccounts: planConfig.maxAccounts,
      quotaPerAccountMB: planConfig.quotaPerAccountMB,
      status: 'active',
      accountsUsed: 0,
      createdAt: new Date(),
      activatedAt: new Date(),
      updatedAt: new Date(),
    };

    if (whmcsEmailServiceId) {
      emailService.whmcsEmailServiceId = whmcsEmailServiceId;
    }
    if (qboxmailDomainCode) {
      emailService.qboxmailDomainCode = qboxmailDomainCode;
    }

    const result = await collection.insertOne(emailService);
    emailService._id = result.insertedId.toString();

    console.log('[Email Service] Created (active):', emailService._id);

    return { success: true, data: emailService };
  } catch (error: any) {
    console.error('Create email service error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Activate email service
 * - Adds domain to QBoxMail
 * - Updates status to active
 */
export async function activateEmailServiceAction(
  whmcsServiceId: number
): Promise<{
  success: boolean;
  data?: EmailServiceDocument;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Please login to continue' };
    }

    const collection = await getEmailServicesCollection();
    const emailService = await collection.findOne({
      whmcsServiceId,
      clientId: Number(user.userId),
    });

    if (!emailService) {
      return { success: false, error: 'Email service not found' };
    }

    if (emailService.status === 'active') {
      return { success: true, data: emailService };
    }

    // Add domain to QBoxMail (auto-provisioning)
    let qboxmailDomainCode: string | undefined;
    try {
      const domainInfo = await getDomainCode(emailService.domain);
      qboxmailDomainCode = domainInfo.code;
      console.log('[Email Service] QBoxMail domain code:', qboxmailDomainCode);
    } catch (error: any) {
      console.warn('[Email Service] QBoxMail domain setup warning:', error.message);
      // Continue even if QBoxMail fails - can be retried
    }

    // Update status to active
    const updateResult = await collection.updateOne(
      { whmcsServiceId, clientId: Number(user.userId) },
      {
        $set: {
          status: 'active',
          qboxmailDomainCode,
          activatedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    const updatedService = await collection.findOne({
      whmcsServiceId,
      clientId: Number(user.userId),
    });

    revalidatePath('/dashboard/services', 'page');
    revalidatePath('/dashboard/emails', 'page');

    return { success: true, data: updatedService || undefined };
  } catch (error: any) {
    console.error('Activate email service error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Upgrade email service plan
 */
export async function upgradeEmailServiceAction(params: {
  whmcsServiceId: number;
  newPlan: EmailPlanType;
}): Promise<{
  success: boolean;
  data?: EmailServiceDocument;
  error?: string;
  requiresPayment?: boolean;
  invoiceId?: number;
}> {
  try {
    const { whmcsServiceId, newPlan } = params;

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Please login to continue' };
    }

    const collection = await getEmailServicesCollection();
    const emailService = await collection.findOne({
      whmcsServiceId,
      clientId: Number(user.userId),
    });

    if (!emailService) {
      return { success: false, error: 'Email service not found' };
    }

    // Validate upgrade path
    const planOrder: EmailPlanType[] = ['free', 'pro', 'business'];
    const currentIndex = planOrder.indexOf(emailService.plan);
    const newIndex = planOrder.indexOf(newPlan);

    if (newIndex <= currentIndex) {
      return { success: false, error: 'Invalid upgrade path' };
    }

    const newPlanConfig = EMAIL_PLANS[newPlan];

    // If upgrading to paid plan, create WHMCS order
    if (newPlan !== 'free') {
      // Create order in WHMCS for the upgrade
      const orderResult = await whmcsApi('AddOrder', {
        clientid: user.userId,
        pid: process.env[`NEXT_PUBLIC_EMAIL_${newPlan.toUpperCase()}_PRODUCT_ID`],
        billingcycle: 'monthly',
        paymentmethod: 'stripe',
        domain: emailService.domain,
        customfields: {
          hosting_service_id: whmcsServiceId.toString(),
        },
      });

      if (orderResult.result !== 'success') {
        return {
          success: false,
          error: orderResult.message || 'Failed to create upgrade order'
        };
      }

      const invoiceId = orderResult.invoiceid ? parseInt(orderResult.invoiceid, 10) : undefined;

      return {
        success: true,
        requiresPayment: true,
        invoiceId,
        data: emailService,
      };
    }

    // Update the service plan
    const updateResult = await collection.updateOne(
      { whmcsServiceId, clientId: Number(user.userId) },
      {
        $set: {
          plan: newPlan,
          maxAccounts: newPlanConfig.maxAccounts,
          quotaPerAccountMB: newPlanConfig.quotaPerAccountMB,
          upgradeFromPlan: emailService.plan,
          upgradedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    const updatedService = await collection.findOne({
      whmcsServiceId,
      clientId: Number(user.userId),
    });

    revalidatePath('/dashboard/services', 'page');

    return { success: true, data: updatedService || undefined };
  } catch (error: any) {
    console.error('Upgrade email service error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Complete upgrade after payment
 * Called by webhook when upgrade invoice is paid
 */
export async function completeEmailUpgradeAction(params: {
  whmcsServiceId: number;
  clientId: number;
  newPlan: EmailPlanType;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { whmcsServiceId, clientId, newPlan } = params;
    const newPlanConfig = EMAIL_PLANS[newPlan];

    const collection = await getEmailServicesCollection();

    await collection.updateOne(
      { whmcsServiceId, clientId },
      {
        $set: {
          plan: newPlan,
          maxAccounts: newPlanConfig.maxAccounts,
          quotaPerAccountMB: newPlanConfig.quotaPerAccountMB,
          upgradedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    console.log('[Email Service] Upgrade completed:', { whmcsServiceId, newPlan });

    return { success: true };
  } catch (error: any) {
    console.error('Complete email upgrade error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get email account usage for a service
 */
export async function getEmailAccountsUsageAction(whmcsServiceId: number): Promise<{
  success: boolean;
  data?: {
    maxAccounts: number;
    accountsUsed: number;
    accountsRemaining: number;
    canCreateMore: boolean;
  };
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Please login to continue' };
    }

    // Get email service
    const servicesCollection = await getEmailServicesCollection();
    const emailService = await servicesCollection.findOne({
      whmcsServiceId,
      clientId: Number(user.userId),
    });

    if (!emailService) {
      // Return default free tier limits
      return {
        success: true,
        data: {
          maxAccounts: DEFAULT_FREE_TIER.maxAccounts,
          accountsUsed: 0,
          accountsRemaining: DEFAULT_FREE_TIER.maxAccounts,
          canCreateMore: true,
        },
      };
    }

    // Count actual email accounts
    const accountsCollection = await getEmailAccountsCollection();
    const accountsUsed = await accountsCollection.countDocuments({
      whmcsServiceId,
      status: { $ne: 'Terminated' },
    });

    const maxAccounts = emailService.maxAccounts;
    const accountsRemaining = maxAccounts === -1 ? Infinity : maxAccounts - accountsUsed;
    const canCreateMore = maxAccounts === -1 || accountsUsed < maxAccounts;

    return {
      success: true,
      data: {
        maxAccounts,
        accountsUsed,
        accountsRemaining: accountsRemaining === Infinity ? -1 : accountsRemaining,
        canCreateMore,
      },
    };
  } catch (error: any) {
    console.error('Get email accounts usage error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync email accounts from QBoxMail
 */
export async function syncEmailAccountsFromQboxmailAction(
  whmcsServiceId: number
): Promise<{
  success: boolean;
  synced?: number;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Please login to continue' };
    }

    const servicesCollection = await getEmailServicesCollection();
    const emailService = await servicesCollection.findOne({
      whmcsServiceId,
      clientId: Number(user.userId),
    });

    if (!emailService || !emailService.qboxmailDomainCode) {
      return { success: false, error: 'Email service not configured' };
    }

    // Get accounts from QBoxMail
    const qboxResult = await qboxListEmails(emailService.domain);

    if (!qboxResult.success || !qboxResult.data) {
      return { success: false, error: 'Failed to fetch from QBoxMail' };
    }

    const accountsCollection = await getEmailAccountsCollection();
    let synced = 0;

    for (const account of qboxResult.data) {
      // Check if account exists
      const existing = await accountsCollection.findOne({
        emailAddress: account.email || `${account.name}@${emailService.domain}`,
      });

      if (!existing) {
        // Create account record
        await accountsCollection.insertOne({
          whmcsServiceId,
          clientId: Number(user.userId),
          clientEmail: user.email,
          domain: emailService.domain,
          emailAddress: account.email || `${account.name}@${emailService.domain}`,
          emailUsername: account.name,
          quota: account.max_email_quota || emailService.quotaPerAccountMB,
          status: 'Active',
          createdAt: new Date(),
          lastSyncedAt: new Date(),
        });
        synced++;
      } else {
        // Update last synced
        await accountsCollection.updateOne(
          { _id: existing._id },
          { $set: { lastSyncedAt: new Date() } }
        );
      }
    }

    // Update accounts used count
    await servicesCollection.updateOne(
      { whmcsServiceId },
      {
        $set: {
          accountsUsed: await accountsCollection.countDocuments({ whmcsServiceId }),
          updatedAt: new Date(),
        }
      }
    );

    return { success: true, synced };
  } catch (error: any) {
    console.error('Sync email accounts error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Suspend email service
 */
export async function suspendEmailServiceAction(
  whmcsServiceId: number,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const collection = await getEmailServicesCollection();

    await collection.updateOne(
      { whmcsServiceId },
      {
        $set: {
          status: 'suspended',
          updatedAt: new Date(),
        },
      }
    );

    revalidatePath('/dashboard/services', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('Suspend email service error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cancel email service
 */
export async function cancelEmailServiceAction(
  whmcsServiceId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const collection = await getEmailServicesCollection();

    await collection.updateOne(
      { whmcsServiceId },
      {
        $set: {
          status: 'cancelled',
          updatedAt: new Date(),
        },
      }
    );

    revalidatePath('/dashboard/services', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('Cancel email service error:', error);
    return { success: false, error: error.message };
  }
}
