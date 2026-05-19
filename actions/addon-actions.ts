'use server';

import { whmcsApi } from '@/lib/whmcs';
import { getCurrencies } from '@/lib/whmcs';
import { formatCurrencyWithSymbol } from '@/lib/currency-utils';

/**
 * Fetch products from specific groups (MarketGo, NordVPN, SSL, WebBuilder)
 * Returns ALL pricing data from WHMCS - fully dynamic
 * @param currencyCode - Currency code (default: USD)
 */
export async function getAddonProductsAction(currencyCode: string = 'USD') {
    try {
        const marketGoGid = process.env.NEXT_PUBLIC_MARKETGO || '5';
        const nordVpnGid = process.env.NEXT_PUBLIC_NORDVPN || '6';
        const sslGid = process.env.NEXT_PUBLIC_SSL || '8';
        const webBuilderGid = process.env.NEXT_PUBLIC_WEBBUILDER || '9';

        const groups = [
            { id: marketGoGid, key: 'marketgo', name: 'MarketGo' },
            { id: nordVpnGid, key: 'nordvpn', name: 'NordVPN' },
            { id: sslGid, key: 'ssl', name: 'SSL Certificates' },
            { id: webBuilderGid, key: 'webbuilder', name: 'Website Builder' }
        ];

        // Get currency info
        const currenciesResponse = await getCurrencies();
        let currencyId = 1;
        let currencyPrefix = '$';
        let currencySuffix = ' USD';

        if (currenciesResponse.success && currenciesResponse.data.length > 0) {
            const currency = currenciesResponse.data.find(
                (c: any) => c.code.toUpperCase() === currencyCode.toUpperCase()
            );
            if (currency) {
                currencyId = parseInt(currency.id);
                currencyPrefix = currency.prefix;
                currencySuffix = currency.suffix;
            }
        }

        const results = await Promise.all(
            groups.map(async (group) => {
                if (!group.id) return null;

                try {
                    // Fetch products with currency - WHMCS returns pricing for all currencies
                    const response = await whmcsApi('GetProducts', {
                        gid: group.id,
                        currency: currencyId
                    });

                    if (response.result === 'success' && response.products) {
                        const products = Array.isArray(response.products.product)
                            ? response.products.product
                            : [response.products.product];

                        // Filter out disabled/hidden products
                        const activeProducts = products.filter((p: any) => {
                            // WHMCS returns hidden=0 for visible products, hidden=1 for hidden
                            const isVisible = !p.hidden || p.hidden === '0' || p.hidden === 0;
                            return isVisible;
                        });

                        const mappedProducts = activeProducts.map((p: any) => {
                            // Get the full pricing object from WHMCS
                            const pricingObj = p.pricing || {};

                            // Get currency code key (uppercase)
                            const currencyCodeKey = currencyCode.toUpperCase();

                            // Get pricing for selected currency, fallback to USD
                            const currencyPricing = pricingObj[currencyCodeKey] || pricingObj['USD'] || {};

                            // Build all available cycles from WHMCS data
                            const availableCycles: Array<{
                                cycle: string;
                                price: number;
                                formatted: string;
                                isAvailable: boolean;
                            }> = [];

                            const cycleConfig = [
                                { key: 'monthly', label: 'Monthly', suffix: '/mo' },
                                { key: 'quarterly', label: 'Quarterly', suffix: '/qtr' },
                                { key: 'semiannually', label: 'Semi-Annually', suffix: '/6mo' },
                                { key: 'annually', label: 'Annually', suffix: '/yr' },
                                { key: 'biennially', label: 'Biennially', suffix: '/2yr' },
                                { key: 'triennially', label: 'Triennially', suffix: '/3yr' }
                            ];


                            for (const config of cycleConfig) {
                                const rawVal = currencyPricing[config.key];
                                // -1 means not available
                                if (rawVal && parseFloat(rawVal) >= 0 && parseFloat(rawVal) !== -1) {
                                    const price = parseFloat(rawVal);

                                    // Use centralized formatting instead of manual concatenation
                                    const formattedPrice = formatCurrencyWithSymbol(price, currencyCode);

                                    availableCycles.push({
                                        cycle: config.key,
                                        price: price,
                                        formatted: `${formattedPrice} ${config.suffix}`,
                                        isAvailable: true
                                    });
                                }
                            }

                            // Determine primary display price (first available cycle or free)
                            let primaryPrice = 'Price Unavailable';
                            let primaryCycle = 'monthly';

                            if (p.paytype === 'free') {
                                primaryPrice = 'FREE';
                                primaryCycle = 'free';
                            } else if (availableCycles.length > 0) {
                                // Use the first available cycle (WHMCS typically returns in order: monthly -> annually)
                                primaryPrice = availableCycles[0].formatted;
                                primaryCycle = availableCycles[0].cycle;
                            }

                            return {
                                id: parseInt(p.pid),
                                name: p.name,
                                description: p.description,
                                paytype: p.paytype,
                                groupKey: group.key,
                                // Primary price for display
                                price: availableCycles.length > 0 ? availableCycles[0].price : 0,
                                formattedPrice: primaryPrice,
                                cycle: primaryCycle,
                                // All pricing cycles from WHMCS - fully dynamic
                                pricingCycles: availableCycles,
                                // Raw pricing object for reference
                                rawPricing: pricingObj
                            };
                        });

                        return {
                            key: group.key,
                            name: group.name,
                            products: mappedProducts
                        };
                    }
                } catch (e) {
                    console.error(`Error fetching group ${group.key}:`, e);
                }
                return null;
            })
        );

        return {
            success: true,
            data: results.filter(Boolean)
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
