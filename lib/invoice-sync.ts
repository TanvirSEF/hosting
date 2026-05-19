import { whmcsApi } from '@/lib/whmcs';

/**
 * Sync invoice from WHMCS to MongoDB
 * This ensures invoices appear immediately in the client portal
 *
 * @param invoiceId - WHMCS invoice ID
 * @param clientId - WHMCS client ID
 * @param collection - MongoDB invoices collection
 */
export async function syncInvoiceToMongoDB(
  invoiceId: number | string,
  clientId: number | string,
  collection: any
) {
  try {
    const response = await whmcsApi('GetInvoice', { invoiceid: invoiceId });

    if (response.result === 'success') {
      const invoice = response;

      await collection.updateOne(
        { whmcsInvoiceId: Number(invoiceId) },
        {
          $set: {
            whmcsInvoiceId: Number(invoiceId),
            clientId: Number(clientId),
            total: parseFloat(invoice.total || '0'),
            subtotal: parseFloat(invoice.subtotal || '0'),
            tax: parseFloat(invoice.tax || '0'),
            status: invoice.status,
            dueDate: new Date(invoice.duedate),
            paidDate: invoice.datepaid ? new Date(invoice.datepaid) : undefined,
            items: (() => {
              const rawItems = invoice.items?.item;
              if (!rawItems) return [];
              const itemArray = Array.isArray(rawItems) ? rawItems : [rawItems];
              return itemArray.map((item: any) => ({
                type: item.type,
                description: item.description,
                amount: parseFloat(item.amount || '0'),
              }));
            })(),
            createdAt: new Date(invoice.date),
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      console.log(
        `Invoice ${invoiceId} synced to MongoDB for client ${clientId}`
      );
    } else {
      console.error(
        `Failed to fetch invoice ${invoiceId} from WHMCS:`,
        response.message
      );
    }
  } catch (error) {
    console.error(`Invoice sync error for invoice ${invoiceId}:`, error);
    // Don't throw - sync failure shouldn't break order creation
  }
}
