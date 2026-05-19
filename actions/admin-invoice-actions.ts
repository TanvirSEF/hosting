'use server';

import { whmcsApi } from '@/lib/whmcs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Get invoice details with client information
 */
export async function getInvoiceDetailsAction(invoiceId: string | number) {
  try {
    const response = await whmcsApi('GetInvoice', {
      invoiceid: invoiceId,
    });

    if (response.result === 'success') {
      // Get client details
      let clientData = null;
      if (response.userid) {
        try {
          const clientResponse = await whmcsApi('GetClientsDetails', {
            clientid: response.userid,
          });
          if (clientResponse.result === 'success') {
            clientData = clientResponse.client;
          }
        } catch (error) {
          // Client fetch failed, continue without client data
        }
      }

      return {
        success: true,
        data: response,
        client: clientData,
      };
    } else {
      return {
        success: false,
        error: 'Invoice not found',
      };
    }
  } catch (error: any) {
    console.error('Get Invoice Details Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch invoice details',
    };
  }
}

/**
 * Get invoice PDF download URL
 */
export async function getInvoicePdfAction(invoiceId: string | number) {
  try {
    const whmcsUrl =
      process.env.WHMCS_URL ||
      process.env.API_ENDPOINT?.replace('/includes/api.php', '') ||
      '';

    if (!whmcsUrl) {
      return {
        success: false,
        error: 'WHMCS URL not configured',
      };
    }

    const pdfUrl = `${whmcsUrl}/dl.php?type=i&id=${invoiceId}`;

    return {
      success: true,
      pdfUrl,
      invoiceId: invoiceId,
      message: 'Invoice PDF ready for download',
    };
  } catch (error: any) {
    console.error('Get Invoice PDF Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get invoice PDF',
    };
  }
}

/**
 * Update invoice information
 */
export async function updateInvoiceAction(formData: FormData) {
  try {
    const invoiceId = formData.get('invoiceid') as string;
    if (!invoiceId) {
      return {
        success: false,
        error: 'Invoice ID is required',
      };
    }

    const updateData: any = {
      invoiceid: invoiceId,
    };

    // Only include fields that are provided
    const fields = ['status', 'duedate', 'date', 'paymentmethod', 'notes'];

    fields.forEach((field) => {
      const value = formData.get(field);
      if (value !== null && value !== '') {
        updateData[field] = value;
      }
    });

    const response = await whmcsApi('UpdateInvoice', updateData);

    if (response.result === 'success') {
      revalidatePath('/spike/billing', 'page');
      return {
        success: true,
        message: 'Invoice updated successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to update invoice',
      };
    }
  } catch (error: any) {
    console.error('Update Invoice Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update invoice',
    };
  }
}

/**
 * Mark invoice as paid
 */
export async function markInvoiceAsPaidAction(invoiceId: string | number) {
  try {
    const response = await whmcsApi('UpdateInvoice', {
      invoiceid: invoiceId,
      status: 'Paid',
    });

    if (response.result === 'success') {
      revalidatePath('/spike/billing', 'page');
      return {
        success: true,
        message: 'Invoice marked as paid successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to mark invoice as paid',
      };
    }
  } catch (error: any) {
    console.error('Mark Invoice as Paid Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to mark invoice as paid',
    };
  }
}

/**
 * Add payment to invoice
 */
export async function addPaymentAction(
  invoiceId: string | number,
  amount: number,
  paymentMethod: string,
  transactionId?: string,
  date?: string
) {
  try {
    if (!amount || amount <= 0) {
      return {
        success: false,
        error: 'Payment amount must be greater than 0',
      };
    }

    const response = await whmcsApi('AddInvoicePayment', {
      invoiceid: invoiceId,
      amount: amount,
      paymentmethod: paymentMethod,
      ...(transactionId && { transid: transactionId }),
      ...(date && { date: date }),
    });

    if (response.result === 'success') {
      revalidatePath('/spike/billing', 'page');
      return {
        success: true,
        message: 'Payment added successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to add payment',
      };
    }
  } catch (error: any) {
    console.error('Add Payment Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to add payment',
    };
  }
}

/**
 * Send invoice email to client
 */
export async function sendInvoiceEmailAction(invoiceId: string | number) {
  try {
    const response = await whmcsApi('SendEmail', {
      messagename: 'Invoice Created',
      id: invoiceId,
    });

    if (response.result === 'success') {
      return {
        success: true,
        message: 'Invoice email sent successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to send invoice email',
      };
    }
  } catch (error: any) {
    console.error('Send Invoice Email Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send invoice email',
    };
  }
}

/**
 * Delete invoice
 */
export async function deleteInvoiceAction(invoiceId: string | number) {
  try {
    const response = await whmcsApi('DeleteInvoice', {
      invoiceid: invoiceId,
    });

    if (response.result === 'success') {
      revalidatePath('/spike/billing', 'page');
      return {
        success: true,
        message: 'Invoice deleted successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to delete invoice',
      };
    }
  } catch (error: any) {
    console.error('Delete Invoice Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete invoice',
    };
  }
}

/**
 * Get payment history for an invoice
 */
export async function getPaymentHistoryAction(invoiceId: string | number) {
  try {
    const response = await whmcsApi('GetTransactions', {
      invoiceid: invoiceId,
    });

    if (response.result === 'success') {
      const transactions = response.transactions?.transaction;
      const transactionList = Array.isArray(transactions)
        ? transactions
        : transactions
          ? [transactions]
          : [];

      return {
        success: true,
        data: transactionList,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to fetch payment history',
      };
    }
  } catch (error: any) {
    console.error('Get Payment History Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch payment history',
    };
  }
}

/**
 * Get all clients for filter dropdown
 */
export async function getAllClientsAction() {
  try {
    const response = await whmcsApi('GetClients', {
      limitnum: 1000,
    });

    if (response.result === 'success') {
      const clients = response.clients?.client;
      const clientList = Array.isArray(clients)
        ? clients
        : clients
          ? [clients]
          : [];

      return {
        success: true,
        data: clientList.map((c: any) => ({
          id: c.id,
          name: `${c.firstname} ${c.lastname}`,
          email: c.email,
        })),
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to fetch clients',
      };
    }
  } catch (error: any) {
    console.error('Get All Clients Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch clients',
    };
  }
}

/**
 * Get client name by ID
 */
export async function getClientNameAction(clientId: string | number) {
  try {
    const response = await whmcsApi('GetClientsDetails', {
      clientid: clientId,
    });

    if (response.result === 'success') {
      return {
        success: true,
        name: `${response.client.firstname} ${response.client.lastname}`,
        email: response.client.email,
      };
    } else {
      return {
        success: false,
        error: 'Client not found',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch client name',
    };
  }
}
