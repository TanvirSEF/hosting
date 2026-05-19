import { MongoClient, Db, Collection, MongoClientOptions } from 'mongodb';
import {
  AdminUser,
  Client,
  SupportAction,
  HostingOrder,
  Invoice,
  BlogPost,
  BlogCategory,
  PaymentMethod,
  PasswordResetToken,
  ContactSubmission,
  ProductPlan,
  EmailAccount,
  NotificationRead,
  COLLECTIONS,
} from './mongodb';
import { EmailServiceDocument } from './email-bundle';

let cachedUri: string | null = null;

function getMongoUri(): string {
  if (!cachedUri) {
    cachedUri = process.env.DATABASE_URL || '';
    if (!cachedUri) {
      throw new Error('DATABASE_URL environment variable is not defined');
    }
  }
  return cachedUri;
}

const clientOptions: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  waitQueueTimeoutMS: 5000,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true,
};

function getTlsOptions(uri: string): MongoClientOptions {
  if (uri.includes('mongodb+srv://') || uri.includes('tls=true')) {
    return { tls: true };
  }
  return {};
}

function getMongoClientPromise(): Promise<MongoClient> {
  if (globalThis._mongoClientPromise) {
    return globalThis._mongoClientPromise;
  }

  const uri = getMongoUri();
  const options = { ...clientOptions, ...getTlsOptions(uri) };
  const client = new MongoClient(uri, options);

  globalThis._mongoClientPromise = client.connect().catch((error) => {
    globalThis._mongoClientPromise = undefined;
    console.error('[MongoDB] Connection failed:', error.message);
    throw error;
  });

  return globalThis._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClientPromise();
  return client.db();
}

export async function getClient(): Promise<MongoClient> {
  return getMongoClientPromise();
}

export async function isConnected(): Promise<boolean> {
  try {
    const client = await getMongoClientPromise();
    await client.db().admin().ping();
    return true;
  } catch {
    return false;
  }
}

export async function closeConnection(): Promise<void> {
  try {
    const client = await getMongoClientPromise();
    await client.close();
    globalThis._mongoClientPromise = undefined;
    console.log('[MongoDB] Connection closed gracefully');
  } catch (error) {
    console.error('[MongoDB] Error closing connection:', error);
  }
}

export async function getAdminUsersCollection(): Promise<
  Collection<AdminUser>
> {
  const db = await getDb();
  return db.collection<AdminUser>(COLLECTIONS.ADMIN_USERS);
}

export async function getClientsCollection(): Promise<Collection<Client>> {
  const db = await getDb();
  return db.collection<Client>(COLLECTIONS.CLIENTS);
}

export async function getSupportActionsCollection(): Promise<
  Collection<SupportAction>
> {
  const db = await getDb();
  return db.collection<SupportAction>(COLLECTIONS.SUPPORT_ACTIONS);
}

export async function getHostingOrdersCollection(): Promise<
  Collection<HostingOrder>
> {
  const db = await getDb();
  return db.collection<HostingOrder>(COLLECTIONS.HOSTING_ORDERS);
}

export async function getInvoicesCollection(): Promise<Collection<Invoice>> {
  const db = await getDb();
  return db.collection<Invoice>(COLLECTIONS.INVOICES);
}

export async function getBlogPostsCollection(): Promise<Collection<BlogPost>> {
  const db = await getDb();
  return db.collection<BlogPost>(COLLECTIONS.BLOG_POSTS);
}

export async function getBlogCategoriesCollection(): Promise<
  Collection<BlogCategory>
> {
  const db = await getDb();
  return db.collection<BlogCategory>(COLLECTIONS.BLOG_CATEGORIES);
}

export async function getPaymentMethodsCollection(): Promise<
  Collection<PaymentMethod>
> {
  const db = await getDb();
  return db.collection<PaymentMethod>(COLLECTIONS.PAYMENT_METHODS);
}

export async function getPasswordResetTokensCollection(): Promise<
  Collection<PasswordResetToken>
> {
  const db = await getDb();
  return db.collection<PasswordResetToken>(COLLECTIONS.PASSWORD_RESET_TOKENS);
}

export async function getContactSubmissionsCollection(): Promise<
  Collection<ContactSubmission>
> {
  const db = await getDb();
  return db.collection<ContactSubmission>(COLLECTIONS.CONTACT_SUBMISSIONS);
}

export async function getProductPlansCollection(): Promise<
  Collection<ProductPlan>
> {
  const db = await getDb();
  return db.collection<ProductPlan>(COLLECTIONS.PRODUCT_PLANS);
}

export async function getEmailAccountsCollection(): Promise<
  Collection<EmailAccount>
> {
  const db = await getDb();
  return db.collection<EmailAccount>(COLLECTIONS.EMAIL_ACCOUNTS);
}

export async function getNotificationReadsCollection(): Promise<
  Collection<NotificationRead>
> {
  const db = await getDb();
  return db.collection<NotificationRead>(COLLECTIONS.NOTIFICATION_READS);
}

export async function getEmailServicesCollection(): Promise<Collection<EmailServiceDocument>> {
  const db = await getDb();
  return db.collection<EmailServiceDocument>(COLLECTIONS.EMAIL_SERVICES);
}

export default getDb;
