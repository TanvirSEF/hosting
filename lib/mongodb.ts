import { ObjectId } from 'mongodb';

// Role types for admin users
export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';

// Admin/Staff user in MongoDB
export interface AdminUser {
  _id?: ObjectId;
  email: string;
  password: string;
  name: string;
  role: AdminRole;
  createdAt: Date;
  updatedAt: Date;
}

// Client synced from WHMCS
export interface Client {
  _id?: ObjectId;
  whmcsId: number;
  email: string;
  password: string; // bcrypt hashed
  firstname: string;
  lastname: string;
  companyname?: string;
  phonenumber?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  /** Stripe customer id for saved cards / payments */
  stripeCustomerId?: string;
  /** Cached Stripe saved payment methods */
  stripePaymentMethods?: {
    id: string;
    type: 'card' | string;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    cardholderName?: string;
    createdAt?: string;
  }[];
  stripePaymentMethodsLastSyncedAt?: Date;
  /** Default payment method ID for quick checkout */
  defaultPaymentMethodId?: string;
  /** Default currency locked after first order (e.g., 'USD', 'EUR') */
  defaultCurrency?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date;
}

// Hosting order tracking
export interface HostingOrder {
  _id?: ObjectId;
  whmcsOrderId: number;
  whmcsInvoiceId: number;
  whmcsServiceId?: number;
  clientId: number;
  clientEmail: string;
  productId: number;
  productName: string;
  billingCycle: string; // monthly, quarterly, semiannually, annually, biennially, triennially
  domain?: string;
  addons: { id: number; name: string; price: number }[];
  basePrice: number;
  totalPrice: number;
  status: 'Pending' | 'Active' | 'Suspended' | 'Terminated' | 'Cancelled';
  createdAt: Date;
  activatedAt?: Date;
  nextDueDate?: Date;
}

// Invoice tracking for quick access
export interface Invoice {
  _id?: ObjectId;
  whmcsInvoiceId: number;
  clientId: number;
  total: number;
  subtotal: number;
  tax: number;
  status: 'Unpaid' | 'Paid' | 'Cancelled' | 'Refunded';
  dueDate: Date;
  paidDate?: Date;
  items: { type: string; description: string; amount: number }[];
  createdAt: Date;
  updatedAt: Date;
}

// Support action tracking
export interface SupportAction {
  _id?: ObjectId;
  staffId: ObjectId;
  staffName: string;
  action: string;
  ticketId?: number;
  details?: string;
  timestamp: Date;
}

// Blog post
export interface BlogPost {
  _id?: ObjectId;
  title: string;
  slug: string; // URL-friendly unique identifier
  content: string; // HTML content from TipTap editor
  excerpt: string; // Short description
  locale?: string; // Language code (en, sv) - defaults to 'en' for backward compatibility
  featuredImage?: {
    url: string; // R2 URL
    alt: string;
    width?: number;
    height?: number;
  };
  category: string; // Category slug
  tags: string[];
  author: {
    id: ObjectId; // Admin user ID
    name: string;
  };
  status: 'draft' | 'published';
  publishedAt?: Date;
  views: number;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Blog category
export interface BlogCategory {
  _id?: ObjectId;
  name: string; // Display name (e.g., "WordPress")
  slug: string; // URL-friendly (e.g., "wordpress")
  description?: string;
  icon?: string; // Icon name or emoji
  order: number; // Display order
  postCount: number; // Number of published posts
  createdAt: Date;
  updatedAt: Date;
}

// Payment method (cached from WHMCS)
export interface PaymentMethod {
  _id?: ObjectId;
  whmcsPayMethodId: number;
  clientId: number;
  type: 'RemoteCreditCard' | 'CreditCard' | 'BankAccount' | 'RemoteBankAccount';
  description?: string;
  gatewayName?: string;
  lastFour: string;
  cardType?: string; // visa, mastercard, amex, discover, etc.
  expiryDate?: string; // MM/YY format
  isDefault: boolean;
  remoteToken?: string; // Gateway payment method token (e.g. Revolut)
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date;
}

// Password reset token for forgot password flow
export interface PasswordResetToken {
  _id?: ObjectId;
  email: string;
  token: string; // JWT token
  expiresAt: Date;
  used: boolean;
  requestedByIp?: string;
  createdAt: Date;
}

// Contact form submission
export interface ContactSubmission {
  _id?: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: Date;
  updatedAt: Date;
}

// Email account tracking for email services
export interface EmailAccount {
  _id?: ObjectId;
  whmcsServiceId: number; // Associated WHMCS service
  clientId: number; // Client WHMCS ID
  clientEmail: string; // Client's main email
  domain: string; // Email domain (e.g., example.com)
  emailAddress: string; // Full email address (e.g., info@example.com)
  emailUsername: string; // Email username part (e.g., info)
  quota: number; // Storage quota in MB
  status: 'Active' | 'Suspended' | 'Terminated';
  createdAt: Date;
  suspendedAt?: Date;
  terminatedAt?: Date;
  lastSyncedAt?: Date;
}

/** Per-locale translatable content for a product plan */
export interface ProductPlanContent {
  name: string;
  tagline?: string;
  description?: string;
  features: string[];
}

/** Product plan synced from WHMCS, with optional translations per locale */
export interface ProductPlan {
  _id?: ObjectId;
  whmcsProductId: number;
  gid: number;
  groupKey: 'shared' | 'wordpress' | 'vps' | 'ecommerce';
  /** Default content from WHMCS (English) */
  defaultContent: ProductPlanContent;
  /** Per-locale overrides (e.g. sv: { name, tagline, description, features }) */
  translations?: Record<string, Partial<ProductPlanContent>>;
  /** Pricing by currency from WHMCS */
  pricing: Record<string, { monthly?: string; annually?: string;[key: string]: string | undefined }>;
  order: number;
  highlight: boolean;
  lastSyncedAt: Date;
  updatedAt: Date;
}

// Collection names
export const COLLECTIONS = {
  ADMIN_USERS: 'admin_users',
  CLIENTS: 'clients',
  SUPPORT_ACTIONS: 'support_actions',
  HOSTING_ORDERS: 'hosting_orders',
  INVOICES: 'invoices',
  BLOG_POSTS: 'blog_posts',
  BLOG_CATEGORIES: 'blog_categories',
  PAYMENT_METHODS: 'payment_methods',
  PASSWORD_RESET_TOKENS: 'password_reset_tokens',
  CONTACT_SUBMISSIONS: 'contact_submissions',
  PRODUCT_PLANS: 'product_plans',
  EMAIL_ACCOUNTS: 'email_accounts',
  NOTIFICATION_READS: 'notification_reads',
  EMAIL_SERVICES: 'email_services',
} as const;

export interface NotificationRead {
  _id?: ObjectId;
  userId: string | number;
  notificationId: string;
  readAt: Date;
  mode: 'client' | 'admin';
}
