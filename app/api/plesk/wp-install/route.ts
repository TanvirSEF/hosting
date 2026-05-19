
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { whmcsApi } from '@/lib/whmcs';
import { pleskApi } from '@/lib/plesk';
import crypto from 'crypto';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function getUserId() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return null;

    try {
        const { payload } = await jwtVerify(session, JWT_SECRET);
        return payload.userId as string | number;
    } catch {
        return null;
    }
}

// Helper to generate strong password (alphanumeric only to avoid CLI escaping issues)
function generateStrongPassword(length = 16) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(crypto.randomInt(0, charset.length));
    }
    return password;
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { serviceId } = body;

        console.log(`[WP Install] Received request for serviceId: ${serviceId}, userId: ${userId}`);

        if (!serviceId) {
            return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
        }

        // 1. Verify ownership and get domain name from WHMCS
        const response = await whmcsApi('GetClientsProducts', {
            clientid: userId,
            serviceid: serviceId,
        });

        if (response.result !== 'success' || !response.products?.product) {
            return NextResponse.json({ error: 'Service not found or access denied' }, { status: 403 });
        }

        const service = Array.isArray(response.products.product)
            ? response.products.product[0]
            : response.products.product;

        const domainName = service.domain;
        const clientEmail = (await whmcsApi('GetClientsDetails', { clientid: userId })).email; // Optimistic fetch

        if (!domainName) {
            return NextResponse.json({ error: 'No domain associated with this service' }, { status: 400 });
        }

        // 2. Find Plesk Domain ID
        const domains = await pleskApi.getDomains(domainName);
        const pleskDomain = domains.find((d: any) => d.name === domainName);

        if (!pleskDomain) {
            return NextResponse.json({ error: 'Domain not found in Plesk' }, { status: 404 });
        }

        if (pleskDomain.hosting_type === 'none') {
            return NextResponse.json({
                error: 'Hosting is not yet provisioned for this domain. Please wait or contact support.'
            }, { status: 400 });
        }

        // 3. Generate Credentials
        const adminPassword = generateStrongPassword();
        const adminEmail = clientEmail || `admin@${domainName}`;
        const adminName = 'admin';

        // 4. Trigger Installation 
        // We pass adminName to force 'admin' username. We do NOT pass password here as it requires env var.
        console.log(`[WP Install] Starting installation for domain ${domainName}...`);
        const installResult = await pleskApi.installWordPress(pleskDomain.id, {
            adminEmail,
            adminName
        });

        console.log('[WP Install] Install Result:', JSON.stringify(installResult));

        // 5. Get Instance ID (try to find it from result or query)
        let instanceId = installResult.id; // Usually in the response

        if (!instanceId) {
            console.log('[WP Install] ID not found in install result. Searching by domain...');
            // Fallback: find by domain
            const newInstance = await pleskApi.findInstanceByDomain(domainName);
            if (newInstance) {
                instanceId = newInstance.id;
                console.log(`[WP Install] Found instance ID by domain: ${instanceId}`);
            } else {
                console.log('[WP Install] Could not find instance by domain.');
            }
        }

        if (instanceId) {
            // 6. Set Password explicitly via WP-CLI
            console.log(`[WP Install] Setting password for instance ${instanceId}...`);
            const pwdResult = await pleskApi.changeAdminPassword(instanceId, adminPassword, adminName);
            console.log(`[WP Install] Password set result:`, pwdResult);
        } else {
            console.warn('[WP Install] Could not determine instance ID to set password. User may need to reset it manually.');
        }

        // 7. Structure the response
        const responseData = {
            ...installResult,
            adminPassword: adminPassword,
            adminName: adminName,
            loginUrl: `https://${domainName}/wp-admin`
        };

        return NextResponse.json({ success: true, data: responseData });

    } catch (error: any) {
        console.error('WP Install Error:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error'
        }, { status: 500 });
    }
}
