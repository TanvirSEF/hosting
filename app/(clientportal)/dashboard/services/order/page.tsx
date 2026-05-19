import { whmcsApi } from '@/lib/whmcs';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { OrderServiceClientWrapper } from '@/components/dashboard/OrderServiceClientWrapper';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getOrderServiceData() {
  const cookieStore = cookies();
  const session = (await cookieStore).get('session')?.value;
  if (!session) {
    const resolvedCookieStore = await cookieStore;
    const locale = resolvedCookieStore.get('NEXT_LOCALE')?.value || 'en';
    redirect(`/${locale}/login`);
  }

  try {
    const { payload } = await jwtVerify(session, JWT_SECRET);
    const userId = payload.userId as string | number;
    const userEmail = payload.email as string;

    // Get client details
    let clientData = null;
    try {
      const clientResult = await whmcsApi('GetClientsDetails', {
        clientid: userId,
      });
      if (clientResult.result === 'success') {
        clientData = clientResult;
      }
    } catch (error) {
      console.error('Failed to fetch client details:', error);
    }

    // Map group IDs based on environment variables
    const GID_MAP: Record<string, { key: string; name: string }> = {
      [process.env.NEXT_PUBLIC_SHARED_HOSTING_GID || '1']: {
        key: 'shared',
        name: 'Shared Hosting',
      },
      [process.env.NEXT_PUBLIC_VPS_HOSTING_GID || '2']: {
        key: 'vps',
        name: 'VPS Hosting',
      },
      [process.env.NEXT_PUBLIC_WORDPRESS_HOSTING_GID || '3']: {
        key: 'wordpress',
        name: 'WordPress Hosting',
      },
      [process.env.NEXT_PUBLIC_ECOMMERCE_HOSTING_GID || '4']: {
        key: 'ecommerce',
        name: 'Ecommerce Hosting',
      },
      [process.env.NEXT_PUBLIC_EMAIL_SERVICE_GID || '5']: {
        key: 'email',
        name: 'Email Service',
      },
    };

    // Get all products (excluding domain registration)
    let allProducts: any[] = [];
    try {
      const productsResult = await whmcsApi('GetProducts', {});
      if (productsResult.result === 'success' && productsResult.products) {
        const products = Array.isArray(productsResult.products.product)
          ? productsResult.products.product
          : [productsResult.products.product];

        // Filter out domain registration products
        allProducts = products.filter((product: any) => {
          const productType = (product.type || '').toLowerCase();
          const productName = (product.name || '').toLowerCase();
          return (
            productType !== 'domain' &&
            !productName.includes('domain registration') &&
            !productName.includes('domain transfer')
          );
        });

        // Initialize plan translation mapping
        const { getTranslationMap } = await import(
          '@/lib/product-plans'
        );
        const locales = ['en']; // Default to English for now

        // Fetch translations for all groups
        const groupsToFetch = ['shared', 'vps', 'wordpress', 'ecommerce'] as const;
        const translationsByGroup = new Map<string, Map<number, any>>();

        for (const groupKey of groupsToFetch) {
          const planMap = await getTranslationMap(groupKey, 'en');
          translationsByGroup.set(groupKey, planMap);
        }

        // Apply overrides to products
        allProducts = allProducts.map((product: any) => {
          const gid = String(product.gid);
          const groupInfo = GID_MAP[gid];

          // Ensure product has a standard numeric ID for the component
          const baseProduct = {
            ...product,
            id: Number(product.pid)
          };

          if (groupInfo) {
            const planMap = translationsByGroup.get(groupInfo.key);
            const translatedPlan = planMap?.get(parseInt(product.pid));

            if (translatedPlan) {
              return {
                ...baseProduct,
                name: translatedPlan.name || product.name,
                tagline: translatedPlan.tagline || '',
                description: translatedPlan.description || product.description,
                features: translatedPlan.features || [],
              };
            }
          }
          return baseProduct;
        });
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }

    // Generate groups map for the sidebar
    const groupsMap = new Map();
    allProducts.forEach((product: any) => {
      const gid = String(product.gid);
      if (!groupsMap.has(gid)) {
        const groupInfo = GID_MAP[gid];
        groupsMap.set(gid, {
          id: gid,
          name: groupInfo?.name || product.group_name || `Group ${product.gid}`,
        });
      }
    });

    // Fetch promotions and discount rules
    const [promotions, discountRulesResult] = await Promise.all([
      import('@/lib/whmcs-promotions').then(mod => mod.getPromotionalProducts(clientData?.client?.currency_code || 'USD')),
      import('@/actions/discount-actions').then(mod => mod.getDiscountRulesDirectAction())
    ]);

    const discountRules = discountRulesResult.success ? discountRulesResult.rules_detailed : {};

    return {
      user:
        clientData && clientData.client
          ? {
            name:
              clientData.client.firstname + ' ' + clientData.client.lastname,
            email: userEmail,
            avatar:
              'https://ui-avatars.com/api/?name=User&background=8C52FF&color=fff',
            firstname: clientData.client.firstname,
          }
          : null,
      products: allProducts,
      groups: Array.from(groupsMap.values()),
      promotions,
      discountRules,
    };
  } catch (error) {
    console.error('Order Service Fetch Error:', error);
    return { user: null, products: [], groups: [], promotions: [], discountRules: {} };
  }
}

export default async function OrderServicePage() {
  const { user, products, groups, promotions, discountRules } = await getOrderServiceData();

  return (
    <OrderServiceClientWrapper
      user={user}
      products={products}
      groups={groups}
      promotions={promotions}
      discountRules={discountRules}
    />
  );
}
