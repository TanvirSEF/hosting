import { whmcsApi } from '@/lib/whmcs';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { DomainsClientWrapper } from '@/components/dashboard/DomainsClientWrapper';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Cached function to fetch all domains data (reduced cache time for real-time updates)
const getCachedDomainsData = unstable_cache(
  async (userId: string | number, userEmail: string) => {
    // Fetch user details, domains, and products (to get assigned domains) in parallel
    const [clientResult, domainsResult, productsResult] = await Promise.allSettled([
      whmcsApi('GetClientsDetails', { clientid: userId }),
      whmcsApi('GetClientsDomains', {
        clientid: userId,
        limitnum: 1000,
        stats: true,
      }),
      whmcsApi('GetClientsProducts', {
        clientid: userId,
        limitnum: 1000,
      }),
    ]);

    const clientData =
      clientResult.status === 'fulfilled' ? clientResult.value : null;

    // Handle registered domains
    let domains: any[] = [];
    const registeredDomainNames = new Set<string>();

    if (domainsResult.status === 'fulfilled') {
      const domainData = domainsResult.value.domains?.domain;
      if (domainData) {
        const rawDomains = Array.isArray(domainData) ? domainData : [domainData];
        domains = rawDomains.map(d => {
          // Fallback logic for registration date if the module (e.g. Spaceship) doesn't provide it
          const registrationDate = (d.registrationdate && d.registrationdate !== '0000-00-00')
            ? d.registrationdate
            : (d.regdate || d.date || 'N/A');

          return { 
            ...d, 
            registrationdate: registrationDate,
            isRegistered: true 
          };
        });
        rawDomains.forEach(d => {
          if (d.domainname) registeredDomainNames.add(d.domainname.toLowerCase());
        });
      }
    }

    // Handle hosting assigned domains
    if (productsResult.status === 'fulfilled') {
      const productData = productsResult.value.products?.product;
      if (productData) {
        const products = Array.isArray(productData) ? productData : [productData];
        products.forEach((p: any) => {
          if (p.domain && !registeredDomainNames.has(p.domain.toLowerCase())) {
            domains.push({
              id: `hosting-${p.id}`,
              domainname: p.domain,
              registrationdate: p.regdate,
              nextduedate: p.nextduedate,
              status: p.status,
              isHostingAssigned: true,
              registrar: p.groupname || 'Hosting',
              isRegistered: false,
            });
            registeredDomainNames.add(p.domain.toLowerCase());
          } else if (p.domain && registeredDomainNames.has(p.domain.toLowerCase())) {
            // Mark existing domain as also being hosting assigned
            const index = domains.findIndex(d => d.domainname?.toLowerCase() === p.domain.toLowerCase());
            if (index !== -1) {
              domains[index].isHostingAssigned = true;
              domains[index].hasActiveHosting = p.status?.toLowerCase() === 'active';
            }
          }
        });
      }
    }

    return {
      user: clientData
        ? {
          name:
            clientData.client.firstname + ' ' + clientData.client.lastname,
          email: userEmail,
          avatar:
            'https://ui-avatars.com/api/?name=User&background=8C52FF&color=fff',
          firstname: clientData.client.firstname,
        }
        : null,
      domains,
    };
  },
  ['domains-page-data'],
  {
    revalidate: 10, // Reduced to 10 seconds for faster updates
    tags: ['domains'],
  }
);

async function getDomainsData() {
  const cookieStore = cookies();
  const session = (await cookieStore).get('session')?.value;
  if (!session) return { user: null, domains: [] };

  try {
    const { payload } = await jwtVerify(session, JWT_SECRET);
    const userId = payload.userId as string | number;
    const userEmail = payload.email as string;

    // Get cached data
    return await getCachedDomainsData(userId, userEmail);
  } catch (error) {
    console.error('Domains Fetch Error:', error);
    return { user: null, domains: [] };
  }
}

// Helper function to check if domain is expiring soon
function isExpiringSoon(nextDueDate: string): boolean {
  const dueDate = new Date(nextDueDate);
  const today = new Date();
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 30 && diffDays >= 0; // 30 days for domains
}

export default async function DomainsPage() {
  const { user, domains } = await getDomainsData();

  // Calculate stats
  const activeDomains = domains.filter(
    (d: any) => d.status?.toLowerCase() === 'active'
  ).length;
  const expiringSoon = domains.filter((d: any) =>
    isExpiringSoon(d.nextduedate)
  ).length;
  const autoRenewEnabled = domains.filter(
    (d: any) => d.donotrenew === 0 || d.donotrenew === '0'
  ).length;

  return (
    <DomainsClientWrapper
      user={user}
      domains={domains}
      activeDomains={activeDomains}
      expiringSoon={expiringSoon}
      autoRenewEnabled={autoRenewEnabled}
    />
  );
}
