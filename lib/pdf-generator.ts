'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function generateInvoicePDF(invoiceId: string | number) {
  try {
    // Fetch invoice data from API
    const response = await fetch(`/api/invoice/pdf?id=${invoiceId}`);
    const data = await response.json();

    if (!data.success || !data.invoice) {
      throw new Error(data.error || 'Failed to fetch invoice data');
    }

    const invoice = data.invoice;

    // Create PDF
    const doc = new jsPDF();

    // Add company header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('WebblyHost', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Web Hosting Services', 105, 28, { align: 'center' });

    // Invoice title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Invoice #${invoice.invoicenum || invoice.invoiceid || invoice.id || invoiceId}`,
      20,
      45
    );

    // Invoice details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const details = [
      ['Invoice Date:', invoice.date || invoice.invoicedate],
      ['Due Date:', invoice.duedate],
      ['Status:', invoice.status],
    ];

    let yPos = 55;
    details.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 60, yPos);
      yPos += 7;
    });

    // Invoice items table
    const items = invoice.items?.item;
    const tableData: any[] = [];

    // Get currency prefix from API response (stamped from WHMCS data)
    // Note: We only use prefix for cleaner display (e.g., "€2.97" not "€2.97EURO")
    const prefix = invoice.currencyprefix || '';

    // Helper to format amount with invoice's native currency
    const formatAmount = (amount: number | string) => {
      const num = typeof amount === 'string' ? parseFloat(amount) : amount;
      const formatted = Number.isFinite(num) ? num.toFixed(2) : '0.00';
      if (prefix) {
        return `${prefix}${formatted}`;
      }
      return formatted;
    };

    if (items) {
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          tableData.push([
            item.description || item.type,
            formatAmount(item.amount),
          ]);
        });
      } else {
        tableData.push([
          items.description || items.type,
          formatAmount(items.amount),
        ]);
      }
    }

    autoTable(doc, {
      startY: yPos + 10,
      head: [['Description', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [140, 82, 255],
        textColor: 255,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
      },
    });

    // Get final Y position after table
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;

    // Payment summary
    const summaryY = finalY + 15;
    doc.setFont('helvetica', 'normal');

    if (invoice.subtotal) {
      doc.text('Subtotal:', 130, summaryY);
      doc.text(
        formatAmount(invoice.subtotal),
        180,
        summaryY,
        { align: 'right' }
      );
    }

    if (invoice.tax && parseFloat(invoice.tax) > 0) {
      doc.text('Tax:', 130, summaryY + 7);
      doc.text(
        formatAmount(invoice.tax),
        180,
        summaryY + 7,
        { align: 'right' }
      );
    }

    if (invoice.credit && parseFloat(invoice.credit) > 0) {
      doc.text('Credit:', 130, summaryY + 14);
      doc.text(
        '-' + formatAmount(invoice.credit),
        180,
        summaryY + 14,
        { align: 'right' }
      );
    }

    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const totalY = summaryY + (invoice.tax || invoice.credit ? 21 : 7);
    doc.text('Total:', 130, totalY);
    doc.text(
      formatAmount(invoice.total),
      180,
      totalY,
      { align: 'right' }
    );

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });

    // Save PDF
    doc.save(
      `Invoice-${invoice.invoicenum || invoice.invoiceid || invoice.id || invoiceId}.pdf`
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
