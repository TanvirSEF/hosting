'use server';

export interface DomainDiscountDetails {
    success: boolean;
    has_discount: boolean;
    tld?: string;
    percentage?: number;
    promo_code?: string;
    promo_details?: {
        id: number;
        code: string;
        type: string;
        value: number;
        is_active: boolean;
        is_started: boolean;
        is_available: boolean;
        start_date: string | null;
        expiry_date: string | null;
        max_uses: number;
        uses: number;
        remaining_uses: number;
    };
    error?: string;
}

export async function getDomainDiscount(tld: string, years: number = 1): Promise<DomainDiscountDetails> {
    try {
        const whmcsUrl = process.env.WHMCS_URL || 'https://bill.webblyhosting.com';
        const apiUrl = `${whmcsUrl}/modules/addons/discount_by_erfan/domain_api.php?tld=${encodeURIComponent(tld)}&years=${years}`;


        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            return {
                success: false,
                has_discount: false,
                error: 'Failed to fetch domain discount',
            };
        }

        const data = await response.json();
        return data;
    } catch (error: any) {
        return {
            success: false,
            has_discount: false,
            error: error.message || 'Failed to fetch domain discount',
        };
    }
}
