'use server';

import { getEmailAccountsCollection } from '@/lib/db';
import { whmcsApi } from '@/lib/whmcs';
import { getCurrentUser } from '@/lib/session';

/**
 * Get all email accounts for the current user
 * Aggregates across all services
 */
export async function getAllUserEmailAccountsAction() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Not authenticated',
            };
        }

        // Get client details from WHMCS to verify identity
        const clientResponse = await whmcsApi('GetClientsDetails', {
            clientid: user.userId,
            email: user.email,
        });

        if (clientResponse.result !== 'success') {
            return {
                success: false,
                error: 'Failed to verify client identity',
            };
        }

        const clientId = parseInt(user.userId as string);

        // Fetch all email accounts for this client from MongoDB
        const emailAccountsCollection = await getEmailAccountsCollection();
        const emailAccounts = await emailAccountsCollection
            .find({ clientId })
            .sort({ createdAt: -1 })
            .toArray();

        // Serialize MongoDB objects
        const serializedAccounts = emailAccounts.map(account => ({
            ...account,
            _id: account._id.toString(),
        }));

        return {
            success: true,
            data: serializedAccounts,
        };
    } catch (error: any) {
        console.error('Get all user email accounts error:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch email accounts',
        };
    }
}

/**
 * Get all active email services (domains) for the current user
 * Used for the "Create Account" dropdown to select which domain to create an email on
 */
export async function getUserEmailDomainsAction() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Not authenticated',
            };
        }

        const clientId = parseInt(user.userId as string);
        const emailServiceGid = process.env.NEXT_PUBLIC_EMAIL_SERVICE_GID || '5';

        // Get all products for the client
        const response = await whmcsApi('GetClientsProducts', {
            clientid: clientId,
            limitnum: 1000,
        });

        if (response.result === 'success' && response.products?.product) {
            const products = Array.isArray(response.products.product)
                ? response.products.product
                : [response.products.product];

            // Filter for active email services (case-insensitive)
            const emailServices = products.filter(
                (p: any) => {
                    const gidMatch = String(p.gid) === emailServiceGid;
                    const groupName = (p.groupname || '').toLowerCase();
                    const status = (p.status || '').toLowerCase();

                    return (gidMatch || groupName === 'email service' || groupName.includes('email')) &&
                        status === 'active';
                }
            );

            const domains = emailServices.map((s: any) => ({
                id: s.id,
                domain: s.domain,
                status: s.status,
            }));

            // Build a set of active domain names from WHMCS (case-insensitive)
            // for cross-referencing MongoDB hybrid services
            const activeWhmcsDomains = new Set(
                products
                    .filter((p: any) => {
                        const status = (p.status || '').toLowerCase();
                        return status === 'active' && p.domain;
                    })
                    .map((p: any) => (p.domain as string).toLowerCase().trim())
            );

            // Also include active hosting services with domains as eligible for email creation
            const hostingDomains = products
                .filter((p: any) => {
                    const status = (p.status || '').toLowerCase();
                    const isEmailService = String(p.gid) === emailServiceGid ||
                        (p.groupname || '').toLowerCase().includes('email');
                    return status === 'active' && p.domain && !isEmailService;
                })
                .map((s: any) => ({
                    id: s.id,
                    domain: s.domain,
                    status: s.status,
                    isHosting: true,
                }));

            // FETCH HYBRID EMAIL SERVICES (From Hosting)
            try {
                const { getEmailServicesCollection } = await import('@/lib/db');
                const servicesCollection = await getEmailServicesCollection();
                // Include both active and pending — pending services are auto-activated on first use
                let hybridServices = await servicesCollection
                    .find({
                        clientId: clientId,
                        status: { $in: ['active', 'pending'] }
                    })
                    .toArray();

                // AUTO-PROVISION: Create email_services for active hosting products without one
                const existingServiceIds = new Set(
                    hybridServices.map((s: any) => String(s.whmcsServiceId))
                );

                const hostingProducts = products.filter(
                    (p: any) => {
                        const gidMatch = String(p.gid) === emailServiceGid;
                        const status = (p.status || '').toLowerCase();
                        return !gidMatch && status === 'active' && p.domain;
                    }
                );

                const needsProvisioning = hostingProducts.filter(
                    (p: any) => !existingServiceIds.has(String(p.id))
                );

                if (needsProvisioning.length > 0) {
                    try {
                        const { createEmailServiceAction } = await import('./email-bundle-actions');
                        for (const product of needsProvisioning) {
                            await createEmailServiceAction({
                                whmcsServiceId: parseInt(product.id),
                                clientId: clientId,
                                domain: product.domain,
                                plan: 'free',
                            });
                        }
                        // Re-fetch after auto-provisioning (include both active and pending)
                        hybridServices = await servicesCollection
                            .find({ clientId: clientId, status: { $in: ['active', 'pending'] } })
                            .toArray();
                    } catch (provisionErr) {
                        console.error('[Email Auto-Provision] Error:', provisionErr);
                    }
                }

                // Only include hybrid domains that have a matching active WHMCS product
                // This filters out stale MongoDB entries from cancelled/expired services
                const hybridDomains = hybridServices
                    .filter((s: any) => activeWhmcsDomains.has((s.domain as string).toLowerCase().trim()))
                    .map((s: any) => ({
                        id: s.whmcsServiceId.toString(),
                        domain: s.domain,
                        status: s.status === 'pending' ? 'active' : s.status,
                        isHybrid: true
                    }));

                // Merge and deduplicate by domain name (case-insensitive)
                const allDomains = [...domains, ...hostingDomains, ...hybridDomains];
                const uniqueDomains = Array.from(
                    new Map(allDomains.map(item => [item.domain.toLowerCase().trim(), item])).values()
                );

                return {
                    success: true,
                    data: uniqueDomains
                };

            } catch (err) {
                console.error('Failed to fetch hybrid services:', err);
                // Return WHMCS + hosting domains if hybrid fails
                const allDomains = [...domains, ...hostingDomains];
                const uniqueDomains = Array.from(
                    new Map(allDomains.map(item => [item.domain.toLowerCase().trim(), item])).values()
                );
                return {
                    success: true,
                    data: uniqueDomains,
                };
            }
        }

        return {
            success: true,
            data: [],
        };
    } catch (error: any) {
        console.error('Get user email domains error:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch domains',
        };
    }
}
