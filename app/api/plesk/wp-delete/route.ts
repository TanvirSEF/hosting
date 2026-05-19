
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { whmcsApi } from '@/lib/whmcs';
import { pleskApi } from '@/lib/plesk';

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

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { serviceId } = body;

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

        if (!domainName) {
            return NextResponse.json({ error: 'No domain associated with this service' }, { status: 400 });
        }

        // 2. Find WordPress Instance by Domain
        const instance = await pleskApi.findInstanceByDomain(domainName);

        if (!instance) {
            return NextResponse.json({ error: 'No WordPress installation found for this domain' }, { status: 404 });
        }

        // 3. Delete Installation
        await pleskApi.deleteWordPress(instance.id);

        return NextResponse.json({ success: true, message: 'WordPress deleted successfully' });

    } catch (error: any) {
        console.error('WP Delete Error:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error'
        }, { status: 500 });
    }
}
