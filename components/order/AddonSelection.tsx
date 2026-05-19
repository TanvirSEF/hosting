'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { getAddonProductsAction } from '@/actions/addon-actions';
import { useCurrency } from '@/contexts/CurrencyContext';

interface AddonSelectionProps {
    onSelectionChange: (selectedAddons: any[]) => void;
    hasDomain?: boolean;
}

export default function AddonSelection({ onSelectionChange, hasDomain = false }: AddonSelectionProps) {
    const { currency } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [addonGroups, setAddonGroups] = useState<any[]>([]);
    const [selectedAddonIds, setSelectedAddonIds] = useState<Set<number>>(new Set());
    const [selectedCycle, setSelectedCycle] = useState<string>('monthly');

    useEffect(() => {
        async function loadAddons() {
            setLoading(true);
            const result = await getAddonProductsAction(currency);
            if (result.success && result.data) {
                const groupsData = result.data.filter((g: any) => g && g.products) as any[];
                setAddonGroups(groupsData);
            }
            setLoading(false);
        }
        loadAddons();
    }, [currency]);

    const getPriceForCycle = (product: any, cycle: string): string => {
        const cycles = product.pricingCycles || [];
        const found = cycles.find((c: any) => c.cycle === cycle);
        if (found) return found.formatted;

        if (cycles.length > 0) return cycles[0].formatted;

        return product.paytype === 'free' ? 'FREE' : 'Price Unavailable';
    };

    const getPriceValueForCycle = (product: any, cycle: string): number => {
        const cycles = product.pricingCycles || [];
        const found = cycles.find((c: any) => c.cycle === cycle);
        if (found) return found.price;

        if (cycles.length > 0) return cycles[0].price;

        return 0;
    };

    const selectedAddons = useMemo(() => {
        const selected: any[] = [];

        for (const group of addonGroups) {
            for (const product of group.products) {
                if (selectedAddonIds.has(product.id)) {
                    const effectiveCycle = (product.pricingCycles || []).find((c: any) => c.cycle === selectedCycle)
                        ? selectedCycle
                        : (product.pricingCycles?.[0]?.cycle || selectedCycle);

                    const displayPrice = getPriceForCycle(product, effectiveCycle);
                    const priceValue = getPriceValueForCycle(product, effectiveCycle);

                    selected.push({
                        ...product,
                        group: group.name,
                        groupKey: product.groupKey || group.key,
                        selectedCycle: effectiveCycle,
                        formattedPrice: displayPrice,
                        price: priceValue
                    });
                }
            }
        }

        return selected;
    }, [addonGroups, selectedAddonIds, selectedCycle]);

    useEffect(() => {
        onSelectionChange(selectedAddons);
    }, [selectedAddons, onSelectionChange]);

    const toggleAddon = (product: any) => {
        const addonId = product.id;
        
        // Prevent selecting SSL products without a domain
        if (product.groupKey === 'ssl' && !hasDomain) {
            return;
        }
        
        const newSelectedIds = new Set(selectedAddonIds);

        if (newSelectedIds.has(addonId)) {
            newSelectedIds.delete(addonId);
        } else {
            newSelectedIds.add(addonId);
        }

        setSelectedAddonIds(newSelectedIds);
    };

    const getAvailableCycles = () => {
        if (addonGroups.length === 0 || !addonGroups[0].products || addonGroups[0].products.length === 0) {
            return [];
        }
        const firstProduct = addonGroups[0].products[0];
        return firstProduct?.pricingCycles?.map((c: any) => c.cycle) || [];
    };

    const availableCycles = getAvailableCycles();

    if (loading) {
        return (
            <div className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!addonGroups || addonGroups.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Recommended Add-ons</h3>

                {availableCycles.length > 1 && (
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        {availableCycles.map((cycle: string) => (
                            <button
                                key={cycle}
                                onClick={() => setSelectedCycle(cycle)}
                                className={`px-3 py-1.5 text-sm rounded-md transition-colors capitalize ${selectedCycle === cycle
                                        ? 'bg-white text-[#8C52FF] shadow-sm font-medium'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {cycle}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid gap-6">
                {addonGroups.map((group) => (
                    <Card key={group.key} className="p-6 overflow-hidden">
                        <div className="mb-4">
                            <h4 className="text-lg font-bold text-gray-800">{group.name}</h4>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {group.products.map((product: any) => {
                                const isSelected = selectedAddonIds.has(product.id);
                                const displayPrice = getPriceForCycle(product, selectedCycle);
                                const isSSL = product.groupKey === 'ssl';
                                const isDisabled = isSSL && !hasDomain;

                                return (
                                    <div
                                        key={product.id}
                                        className={`border rounded-lg p-4 transition-all relative ${
                                            isDisabled 
                                                ? 'border-gray-200 bg-gray-50 opacity-60'
                                                : isSelected
                                                    ? 'border-[#8C52FF] bg-purple-50 ring-1 ring-[#8C52FF]'
                                                    : 'border-gray-200 hover:border-purple-200 hover:shadow-sm'
                                        }`}
                                    >
                                        {isDisabled && (
                                            <div className="absolute top-2 right-2 group">
                                                <AlertCircle className="w-5 h-5 text-amber-500" />
                                                <div className="hidden group-hover:block absolute right-0 top-6 w-56 bg-gray-900 text-white text-xs rounded p-2 z-10 shadow-lg">
                                                    SSL certificates require a domain. Please scroll down to register or transfer a domain first.
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between items-start mb-2">
                                            <h5 className={`font-bold ${isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
                                                {product.name}
                                            </h5>
                                            {isSelected && <Check className="w-5 h-5 text-[#8C52FF]" />}
                                        </div>

                                        <div className={`text-sm mb-4 h-10 overflow-hidden text-ellipsis line-clamp-2 ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`} dangerouslySetInnerHTML={{ __html: product.description }}></div>

                                        <div className="mt-auto">
                                            <div className={`text-lg font-bold mb-3 ${isDisabled ? 'text-gray-400' : 'text-[#8C52FF]'}`}>
                                                {displayPrice}
                                            </div>

                                            <Button
                                                onClick={() => toggleAddon(product)}
                                                variant={isSelected ? "secondary" : "outline"}
                                                disabled={isDisabled}
                                                className={`w-full ${
                                                    isDisabled
                                                        ? 'cursor-not-allowed opacity-50'
                                                        : isSelected
                                                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-transparent'
                                                            : 'border-[#8C52FF] text-[#8C52FF] hover:bg-[#8C52FF] hover:text-white'
                                                }`}
                                            >
                                                {isDisabled ? 'Domain Required' : isSelected ? 'Selected' : 'Add to Order'}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
