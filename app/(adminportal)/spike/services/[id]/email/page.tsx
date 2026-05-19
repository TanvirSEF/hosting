import { whmcsApi } from '@/lib/whmcs';
import AdminEmailServicesClientWrapper from '@/components/admin/AdminEmailServicesClientWrapper';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getServiceDetails(serviceId: string) {
    try {
        const result = await whmcsApi('GetClientsProducts', {
            serviceid: serviceId,
        });

        if (result.result === 'success' && result.products?.product) {
            const product = Array.isArray(result.products.product)
                ? result.products.product[0]
                : result.products.product;

            return product;
        }
        return null;
    } catch (error) {
        console.error('Service Fetch Error:', error);
        return null;
    }
}

export default async function AdminEmailServicePage({
    params,
}: {
    params: { id: string };
}) {
    const service = await getServiceDetails(params.id);

    if (!service) {
        redirect('/spike/services');
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Email Management</h1>
                <p className="text-muted-foreground">
                    Manage email accounts for service #{service.id} ({service.domain}) - Client ID: {service.clientid}
                </p>
            </div>

            <AdminEmailServicesClientWrapper
                serviceId={parseInt(params.id)}
                clientId={parseInt(service.clientid)}
                domain={service.domain}
            />
        </div>
    );
}
