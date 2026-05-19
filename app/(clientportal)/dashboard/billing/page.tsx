import { whmcsApi } from '@/lib/whmcs';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { BillingClientWrapper } from '@/components/dashboard/BillingClientWrapper';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Disable caching for real-time billing data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getBillingData() {
  const cookieStore = cookies();
  const session = (await cookieStore).get('session')?.value;
  if (!session) return { user: null, invoices: [] };

  try {
    const { payload } = await jwtVerify(session, JWT_SECRET);
    const userId = payload.userId as string | number;
    const userEmail = payload.email as string;
    const userName = payload.name as string;

    // Fetch invoices and currency list in parallel
    const [invoicesResult, currenciesResult] = await Promise.all([
      whmcsApi('GetInvoices', {
        userid: userId,
        limitnum: 50,
        orderby: 'date',
        order: 'desc',
      }),
      whmcsApi('GetCurrencies', {}),
    ]);

    // Build currency maps from WHMCS actual data
    const currencyIdToCode: Record<string, string> = {};
    const currencyCodeToInfo: Record<string, { prefix: string; suffix: string }> = {};

    if (currenciesResult.result === 'success' && currenciesResult.currencies?.currency) {
      const list = Array.isArray(currenciesResult.currencies.currency)
        ? currenciesResult.currencies.currency
        : [currenciesResult.currencies.currency];
      list.forEach((c: any) => {
        if (c.id && c.code) {
          currencyIdToCode[String(c.id)] = c.code.toUpperCase();
          // Store the actual prefix/suffix from WHMCS
          currencyCodeToInfo[c.code.toUpperCase()] = {
            prefix: c.prefix || '',
            suffix: c.suffix || '',
          };
        }
      });
    }

    // Handle invoices data — inject currencycode and currencyprefix from WHMCS data
    let invoices: any[] = [];
    if (invoicesResult.result === 'success') {
      const invoiceData = invoicesResult.invoices?.invoice;
      if (invoiceData) {
        const raw = Array.isArray(invoiceData) ? invoiceData : [invoiceData];
        invoices = raw.map((inv: any) => {
          // Get currency code from WHMCS response or from currencyid map
          const currencycode = inv.currencycode || currencyIdToCode[String(inv.currencyid)] || 'USD';
          // Get actual prefix from WHMCS currencies data (no suffix for cleaner display)
          const currencyInfo = currencyCodeToInfo[currencycode] || { prefix: '' };
          return {
            ...inv,
            // Stamp currencycode
            currencycode,
            // Use WHMCS-provided prefix, or fallback to WHMCS currencies data
            // Note: We don't use suffix for cleaner display (e.g., "€2.97" not "€2.97EURO")
            currencyprefix: inv.currencyprefix || currencyInfo.prefix,
            currencysuffix: '', // Always empty for cleaner display
          };
        });
      }
    }

    return {
      user: {
        name: userName,
        email: userEmail,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=8C52FF&color=fff`,
        firstname: userName.split(' ')[0],
      },
      invoices,
    };
  } catch (error) {
    console.error('Billing Fetch Error:', error);
    return { user: null, invoices: [] };
  }
}


export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; invoice_id?: string }>;
}) {
  const { user, invoices } = await getBillingData();
  const params = await searchParams;

  // Calculate stats
  const paidInvoices = invoices.filter(
    (i: any) => i.status?.toLowerCase() === 'paid'
  ).length;
  const unpaidInvoices = invoices.filter(
    (i: any) => i.status?.toLowerCase() === 'unpaid'
  ).length;
  const totalUnpaid = invoices
    .filter((i: any) => i.status?.toLowerCase() === 'unpaid')
    .reduce((sum: number, i: any) => sum + parseFloat(i.total || 0), 0);

  return (
    <BillingClientWrapper
      user={user}
      invoices={invoices}
      paidInvoices={paidInvoices}
      unpaidInvoices={unpaidInvoices}
      totalUnpaid={totalUnpaid}
      paymentSuccess={params.payment === 'success'}
      paymentInvoiceId={params.invoice_id}
    />
  );
}
