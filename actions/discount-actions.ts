'use server';

import { whmcsApi } from '@/lib/whmcs';

/**
 * Fetch discount rules from the discount_by_erfan module
 * This is a server action to avoid CORS issues
 */
export async function getDiscountRulesAction() {
    try {
        // Use WHMCS direct database query for better performance
        // Alternatively, if you have API access to the custom module

        const response = await whmcsApi('ModuleCustom', {
            module: 'discount_by_erfan',
            action: 'GetRules',
        });

        if (response.result === 'success') {
            return {
                success: true,
                rules: response.rules || {},
                css: response.css || '',
            };
        }

        return {
            success: false,
            rules: {},
            css: '',
            error: 'Failed to fetch discount rules',
        };
    } catch (error: any) {
        console.error('Get discount rules error:', error);
        return {
            success: false,
            rules: {},
            css: '',
            error: error.message,
        };
    }
}

/**
 * Alternative: Direct database query for better performance
 * This bypasses WHMCS API and directly queries the module's tables
 */
// Hardcoded WHMCS URL as fallback to ensure it always works
const WHMCS_BASE_URL = 'https://bill.webblyhosting.com';

export async function getDiscountRulesDirectAction() {
    try {
        // This would require database access configuration
        // For now, we'll use a fetch to the module's API endpoint
        // Use environment variable if available, otherwise use hardcoded URL
        const whmcsUrl = process.env.WHMCS_URL || process.env.NEXT_PUBLIC_WHMCS_URL || WHMCS_BASE_URL;


        if (!whmcsUrl) {
            throw new Error('WHMCS URL not configured');
        }

        // Remove trailing slash and construct API URL
        const baseUrl = whmcsUrl.replace(/\/$/, '');
        const apiUrl = `${baseUrl}/modules/addons/discount_by_erfan/api.php`;


        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });


        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            return {
                success: true,
                rules: data.rules || {},
                rules_detailed: data.rules_detailed || {},
                css: data.css || '',
                timestamp: data.timestamp,
            };
        }

        return {
            success: false,
            rules: {},
            css: '',
            error: data.error || 'Failed to fetch discount data',
        };
    } catch (error: any) {
        return {
            success: false,
            rules: {},
            css: '',
            error: error.message,
        };
    }
}
