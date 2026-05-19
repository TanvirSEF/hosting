<?php
/**
 * Force remove Level 2 Tax to prevent double taxation

 */

if (!defined("WHMCS")) {
    die("This file cannot be accessed directly");
}

use WHMCS\Database\Capsule;

// Hook on Invoice Creation
add_hook('InvoiceCreated', 1, function ($vars) {
    try {
        $invoiceId = $vars['invoiceid'];

        // Use localAPI to update the invoice and set taxrate2 to 0
        $command = 'UpdateInvoice';
        $postData = array(
            'invoiceid' => $invoiceId,
            'taxrate2' => '0.00',  // Force level 2 tax to 0
        );

        $results = localAPI($command, $postData);

        if ($results['result'] == 'success') {
            logActivity("Tax Fix Hook: Removed taxrate2 for invoice #$invoiceId");
        } else {
            logActivity("Tax Fix Hook: Failed to remove taxrate2 for invoice #$invoiceId - " . $results['message']);
        }

    } catch (Exception $e) {
        logActivity("Tax Fix Hook Error (InvoiceCreated): " . $e->getMessage());
    }
});

// Hook on Invoice Generation (covering automated recurring invoices)
add_hook('AfterInvoicingGenerateInvoiceItems', 1, function ($vars) {
    try {
        $invoiceId = $vars['invoiceid'];

        $command = 'UpdateInvoice';
        $postData = array(
            'invoiceid' => $invoiceId,
            'taxrate2' => '0.00', // Force level 2 tax to 0
        );

        $results = localAPI($command, $postData);

        if ($results['result'] == 'success') {
            logActivity("Tax Fix Hook: Removed taxrate2 for recurring invoice #$invoiceId");
        }

    } catch (Exception $e) {
        logActivity("Tax Fix Hook Error (AfterInvoicingGenerateInvoiceItems): " . $e->getMessage());
    }
});
