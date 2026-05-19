import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { whmcsApi, getCurrencies } from '@/lib/whmcs';
import { getCurrencyPrefixSuffix } from '@/lib/currency-utils';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(request: NextRequest) {
  try {
    // Get invoice ID from query params
    const searchParams = request.nextUrl.searchParams;
    const invoiceId = searchParams.get('id');

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const session = request.cookies.get('session')?.value;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(session, JWT_SECRET);
    const userId = payload.userId as string | number;

    // Fetch invoice details, invoice list (for currency), and currencies in parallel
    // Note: WHMCS GetInvoice returns NULL for currency fields, but GetInvoices returns them
    const [invoiceResponse, invoicesListResponse, currenciesResponse] = await Promise.all([
      whmcsApi('GetInvoice', { invoiceid: invoiceId }),
      whmcsApi('GetInvoices', { userid: userId, limitnum: 100 }),
      getCurrencies(),
    ]);

    if (invoiceResponse.result !== 'success') {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if invoice belongs to the user
    if (
      invoiceResponse.userid !== String(userId) &&
      invoiceResponse.userid !== userId
    ) {
      return NextResponse.json(
        { error: 'Unauthorized access to invoice' },
        { status: 403 }
      );
    }

    // Try to get currency info from GetInvoices API (which returns currency fields)
    let currencycode: string | null = null;
    let currencyprefix: string | null = null;
    let currencysuffix: string | null = null;

    if (invoicesListResponse.result === 'success' && invoicesListResponse.invoices?.invoice) {
      const invoicesList = Array.isArray(invoicesListResponse.invoices.invoice)
        ? invoicesListResponse.invoices.invoice
        : [invoicesListResponse.invoices.invoice];
      const invoiceFromList = invoicesList.find(
        (inv: any) => String(inv.id) === String(invoiceId) || String(inv.invoicenum) === String(invoiceId)
      );
      if (invoiceFromList) {
        currencycode = invoiceFromList.currencycode;
        currencyprefix = invoiceFromList.currencyprefix;
        currencysuffix = invoiceFromList.currencysuffix;
      }
    }

    // If still no currency info, try WHMCS currencies data by currency code
    if (!currencycode && currenciesResponse.success && currenciesResponse.data) {
      // Build currencyId → currencyInfo map
      const list = Array.isArray(currenciesResponse.data)
        ? currenciesResponse.data
        : [currenciesResponse.data];

      // Try to get from invoice's currencyid if available
      if (invoiceResponse.currencyid) {
        const currency = list.find(
          (c: any) => String(c.id) === String(invoiceResponse.currencyid)
        );
        if (currency) {
          currencycode = currency.code;
          currencyprefix = currency.prefix;
          currencysuffix = currency.suffix;
        }
      }
    }

    // If still no currency code, try client's profile
    if (!currencycode) {
      try {
        const clientResponse = await whmcsApi('GetClientsDetails', {
          clientid: userId,
          stats: false,
        });
        if (clientResponse.result === 'success' && clientResponse.client) {
          currencycode = clientResponse.client.currencycode;
        }
      } catch {
        // Ignore errors
      }
    }

    // If we have currency code but no prefix/suffix, get from WHMCS currencies
    if (currencycode && (!currencyprefix || !currencysuffix) && currenciesResponse.success && currenciesResponse.data) {
      const list = Array.isArray(currenciesResponse.data)
        ? currenciesResponse.data
        : [currenciesResponse.data];
      const currency = list.find(
        (c: any) => c.code.toUpperCase() === (currencycode as string).toUpperCase()
      );
      if (currency) {
        currencyprefix = currencyprefix || currency.prefix;
        currencysuffix = currencysuffix || currency.suffix;
      }
    }

    // Final fallback: use the currency code to derive prefix/suffix
    currencycode = currencycode || 'USD';
    if (!currencyprefix && !currencysuffix) {
      const derived = getCurrencyPrefixSuffix(currencycode);
      currencyprefix = derived.prefix;
      currencysuffix = derived.suffix;
    }

    // Return invoice data with stamped currency info for PDF generation
    return NextResponse.json({
      success: true,
      invoice: {
        ...invoiceResponse,
        currencycode,
        currencyprefix: currencyprefix || '',
        currencysuffix: currencysuffix || '',
      },
    });
  } catch (error: any) {
    console.error('Invoice Data Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get invoice data' },
      { status: 500 }
    );
  }
}
