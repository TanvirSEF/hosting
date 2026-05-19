import { whmcsApi } from '@/lib/whmcs';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import EmailServicesClientWrapper from '@/components/dashboard/EmailServicesClientWrapper';
import { redirect } from 'next/navigation';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getServiceDetails(serviceId: string) {
    const cookieStore = cookies();
    const session = (await cookieStore).get('session')?.value;
    if (!session) return null;

    try {
        const { payload } = await jwtVerify(session, JWT_SECRET);
        const userId = payload.userId as string | number;

        const result = await whmcsApi('GetClientsProducts', {
            clientid: userId,
            serviceid: serviceId,
        });

        if (result.result === 'success' && result.products?.product) {
            const product = Array.isArray(result.products.product)
                ? result.products.product[0]
                : result.products.product;

            // Verify ownership
            if (String(product.clientid) !== String(userId)) {
                return null;
            }

            return product;
        }
        return null;
    } catch (error) {
        console.error('Service Fetch Error:', error);
        return null;
    }
}

export default async function EmailServicePage({
    params,
}: {
    params: { id: string };
}) {
    const service = await getServiceDetails(params.id);

    if (!service) {
        redirect('/dashboard/services');
    }

    // Check if this is an email service
    // You might want to verify the GID or type, but for now we assume if they got here via link it's valid
    // or the component will handle empty states/errors.
    // Ideally, valid GID check:
    // const emailServiceGid = process.env.NEXT_PUBLIC_EMAIL_SERVICE_GID || '5';
    // if (String(service.gid) !== emailServiceGid) { ... }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Email Management</h1>
                <p className="text-muted-foreground">
                    Manage email accounts for {service.domain}
                </p>
            </div>

            <EmailServicesClientWrapper
                serviceId={parseInt(params.id)}
                domain={service.domain}
            />
        </div>
    );
}
