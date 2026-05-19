/**
 * Email Bundle Configuration
 * 
 * This module defines the email service plans and their configurations
 * for the hybrid email service offering (Free + Paid upgrades).
 */

// Email plan types
export type EmailPlanType = 'free' | 'pro' | 'business';

// Email plan configuration
export interface EmailPlanConfig {
  id: EmailPlanType;
  name: string;
  description: string;
  maxAccounts: number; // -1 for unlimited
  quotaPerAccountMB: number;
  priceMonthly: number;
  priceAnnually: number;
  features: string[];
  whmcsProductId?: number; // WHMCS product ID (set via env)
  highlighted?: boolean;
}

// Email plans configuration
export const EMAIL_PLANS: Record<EmailPlanType, EmailPlanConfig> = {
  free: {
    id: 'free',
    name: 'Email Basic',
    description: 'Perfect for personal use and small websites',
    maxAccounts: 2,
    quotaPerAccountMB: 1024, // 1 GB
    priceMonthly: 0,
    priceAnnually: 0,
    features: [
      '2 Email Accounts',
      '1 GB Storage Each',
      'Webmail Access',
      'IMAP/POP3/SMTP',
      'Spam Protection',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Email Pro',
    description: 'Ideal for growing businesses',
    maxAccounts: 10,
    quotaPerAccountMB: 5120, // 5 GB
    priceMonthly: 4.99,
    priceAnnually: 49.99,
    features: [
      '10 Email Accounts',
      '5 GB Storage Each',
      'Webmail Access',
      'IMAP/POP3/SMTP',
      'Spam Protection',
      'Email Forwarding',
      'Auto-responders',
      'Priority Support',
    ],
    highlighted: true,
  },
  business: {
    id: 'business',
    name: 'Email Business',
    description: 'For enterprises with advanced needs',
    maxAccounts: -1, // Unlimited
    quotaPerAccountMB: 10240, // 10 GB
    priceMonthly: 9.99,
    priceAnnually: 99.99,
    features: [
      'Unlimited Email Accounts',
      '10 GB Storage Each',
      'Webmail Access',
      'IMAP/POP3/SMTP',
      'Spam Protection',
      'Email Forwarding',
      'Auto-responders',
      'Email Aliases',
      'Mailing Lists',
      'Priority Support',
      'Custom DKIM/SPF',
    ],
  },
};

// Get plan by type
export function getEmailPlan(planType: EmailPlanType): EmailPlanConfig {
  return EMAIL_PLANS[planType];
}

// Get all plans as array
export function getAllEmailPlans(): EmailPlanConfig[] {
  return Object.values(EMAIL_PLANS);
}

// Get upgrade options for a plan
export function getUpgradeOptions(currentPlan: EmailPlanType): EmailPlanConfig[] {
  const plans = getAllEmailPlans();
  const currentIndex = plans.findIndex(p => p.id === currentPlan);
  return plans.slice(currentIndex + 1);
}

// Calculate prorated upgrade price
export function calculateUpgradePrice(
  currentPlan: EmailPlanType,
  newPlan: EmailPlanType,
  daysRemaining: number,
  billingCycle: 'monthly' | 'annually'
): number {
  const current = EMAIL_PLANS[currentPlan];
  const newPlanConfig = EMAIL_PLANS[newPlan];
  
  const currentPrice = billingCycle === 'monthly' 
    ? current.priceMonthly 
    : current.priceAnnually / 12;
  const newPrice = billingCycle === 'monthly' 
    ? newPlanConfig.priceMonthly 
    : newPlanConfig.priceAnnually / 12;
  
  const priceDifference = newPrice - currentPrice;
  const proratedDays = daysRemaining / 30; // Approximate month
  
  return Math.max(0, priceDifference * proratedDays);
}

// Email service status
export type EmailServiceStatus = 'pending' | 'active' | 'suspended' | 'cancelled';

// Email service document (MongoDB)
export interface EmailServiceDocument {
  _id?: string;
  whmcsServiceId: number;           // Hosting service ID
  whmcsEmailServiceId?: number;     // Email service ID in WHMCS (if paid)
  clientId: number;                 // Client's WHMCS ID
  
  // Plan details
  plan: EmailPlanType;
  maxAccounts: number;
  quotaPerAccountMB: number;
  
  // Domain
  domain: string;
  
  // Status
  status: EmailServiceStatus;
  
  // QBoxMail integration
  qboxmailDomainCode?: string;
  
  // Timestamps
  createdAt: Date;
  activatedAt?: Date;
  updatedAt: Date;
  
  // Upgrade tracking
  upgradeFromPlan?: EmailPlanType;
  upgradedAt?: Date;
  
  // Account usage
  accountsUsed: number;
}

// Default free tier configuration
export const DEFAULT_FREE_TIER = {
  maxAccounts: parseInt(process.env.NEXT_PUBLIC_FREE_EMAIL_ACCOUNTS || '2', 10),
  quotaPerAccountMB: parseInt(process.env.NEXT_PUBLIC_FREE_EMAIL_QUOTA || '1024', 10),
};

// Check if email service is available for a hosting plan
export function isEmailServiceAvailableForProduct(productId: number): boolean {
  // Email service is available for all hosting products
  // You can customize this logic based on product groups
  return true;
}

// Get WHMCS product ID for email plan
export function getWhmcsProductIdForPlan(planType: EmailPlanType): number | undefined {
  const envKey = `NEXT_PUBLIC_EMAIL_${planType.toUpperCase()}_PRODUCT_ID`;
  const productId = process.env[envKey];
  return productId ? parseInt(productId, 10) : undefined;
}

// Format storage size for display
export function formatStorageSize(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(0)} GB`;
  }
  return `${mb} MB`;
}

// Format account limit for display
export function formatAccountLimit(maxAccounts: number): string {
  if (maxAccounts === -1) {
    return 'Unlimited';
  }
  return maxAccounts.toString();
}
