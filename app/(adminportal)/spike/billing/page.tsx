import { whmcsApi } from '@/lib/whmcs';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/actions/admin-auth';
import { AdminBillingClientWrapper } from '@/components/admin/AdminBillingClientWrapper';

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminBillingPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/spike/login');

  // Fetch invoices and currencies in parallel
  const [invoicesResult, currenciesResult] = await Promise.allSettled([
    whmcsApi('GetInvoices', {
      limitnum: 1000,
      orderby: 'id',
      order: 'desc',
    }),
    whmcsApi('GetCurrencies', {}),
  ]);

  // Build currency maps from WHMCS actual data
  const currencyIdToCode: Record<string, string> = {};
  const currencyCodeToInfo: Record<string, { prefix: string; suffix: string }> = {};

  if (currenciesResult.status === 'fulfilled' && currenciesResult.value.result === 'success') {
    const list = Array.isArray(currenciesResult.value.currencies?.currency)
      ? currenciesResult.value.currencies.currency
      : [currenciesResult.value.currencies?.currency];
    list.forEach((c: any) => {
      if (c?.id && c?.code) {
        currencyIdToCode[String(c.id)] = c.code.toUpperCase();
        // Store the actual prefix/suffix from WHMCS
        currencyCodeToInfo[c.code.toUpperCase()] = {
          prefix: c.prefix || '',
          suffix: c.suffix || '',
        };
      }
    });
  }

  let invoices = [];
  if (invoicesResult.status === 'fulfilled') {
    const invoiceData = invoicesResult.value.invoices?.invoice;
    if (invoiceData) {
      const raw = Array.isArray(invoiceData) ? invoiceData : [invoiceData];
      invoices = raw.map((inv: any) => {
        // Get currency code from WHMCS response or from currencyid map
        const currencycode = inv.currencycode || currencyIdToCode[String(inv.currencyid)] || 'USD';
        // Get actual prefix from WHMCS currencies data (no suffix for cleaner display)
        const currencyInfo = currencyCodeToInfo[currencycode] || { prefix: '' };
        return {
          ...inv,
          currencycode,
          // Use WHMCS-provided prefix, or fallback to WHMCS currencies data
          // Note: We don't use suffix for cleaner display (e.g., "€2.97" not "€2.97EURO")
          currencyprefix: inv.currencyprefix || currencyInfo.prefix,
          currencysuffix: '', // Always empty for cleaner display
        };
      });
    }
  }

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
    <AdminBillingClientWrapper
      admin={admin}
      invoices={invoices}
      paidInvoices={paidInvoices}
      unpaidInvoices={unpaidInvoices}
      totalUnpaid={totalUnpaid}
    />
  );
}
