'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Globe, Shield, Zap } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

export interface CheckboxAddon {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ReactNode;
}

interface DomainConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain: string;
  tld: string;
  yearPrices: Record<number, number>; // Dynamic pricing map from WHMCS
  availableAddons: CheckboxAddon[]; // Dynamic addons
  onAddToCart: (config: {
    domain: string;
    tld: string;
    regPeriod: number;
    price: number;
    addons: { id: string; name: string; price: number }[];
  }) => void;
}

export default function DomainConfigModal({
  isOpen,
  onClose,
  domain,
  tld,
  yearPrices,
  availableAddons,
  onAddToCart,
}: DomainConfigModalProps) {
  // Determine available periods from yearPrices keys
  const availableYears = Object.keys(yearPrices)
    .map(Number)
    .sort((a, b) => a - b);

  // Default to first available year (usually 1)
  const [regPeriod, setRegPeriod] = useState(availableYears[0] || 1);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const { formatPrice } = useCurrency();

  // Get price for selected period (WHMCS price directly)
  const selectedYearPrice = yearPrices[regPeriod] || 0;

  const baseAddonsTotal = selectedAddons.reduce((sum, addonId) => {
    const addon = availableAddons.find((a) => a.id === addonId);
    return sum + (addon ? addon.price * regPeriod : 0);
  }, 0);

  const grandTotal = selectedYearPrice + baseAddonsTotal;

  // Prices are already in selected WHMCS currency
  const domainTotal = selectedYearPrice;
  const addonsTotal = baseAddonsTotal;

  const handleAddToCart = () => {
    
    const selectedAddonObjects = selectedAddons.map((id) => {
      const addon = availableAddons.find((a) => a.id === id)!;
      return {
        id: addon.id,
        name: addon.name,
        price: addon.price,
      };
    });

    const cartData = {
      domain,
      tld,
      regPeriod,
      price: grandTotal, // WHMCS price directly
      addons: selectedAddonObjects,
    };

    onAddToCart(cartData);
    onClose();
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Globe className="h-6 w-6 text-[#8C52FF]" />
            Configure Domain
          </DialogTitle>
          <DialogDescription>
            Customize your domain registration options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Domain Name Display */}
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
            <p className="font-dm-sans text-2xl font-bold text-[#8C52FF]">
              {domain}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {tld.toUpperCase()} domain registration
            </p>
          </div>

          {/* Registration Period */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Registration Period
            </Label>
            <RadioGroup
              value={regPeriod.toString()}
              onValueChange={(val) => setRegPeriod(parseInt(val))}
            >
              {availableYears.map((year) => {
                const price = yearPrices[year];

                return (
                  <div
                    key={year}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:border-[#8C52FF] hover:bg-purple-50"
                    onClick={() => setRegPeriod(year)}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem
                        value={year.toString()}
                        id={`period-${year}`}
                      />
                      <Label
                        htmlFor={`period-${year}`}
                        className="cursor-pointer font-medium"
                      >
                        {year} {year === 1 ? 'Year' : 'Years'}
                      </Label>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#8C52FF]">
                        {formatPrice(price)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Optional Add-ons */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Optional Add-ons</Label>
            <div className="space-y-2">
              {availableAddons.map((addon) => (
                <div
                  key={addon.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:border-[#8C52FF] hover:bg-purple-50"
                  onClick={() => toggleAddon(addon.id)}
                >
                  <Checkbox
                    id={addon.id}
                    checked={selectedAddons.includes(addon.id)}
                    onCheckedChange={() => toggleAddon(addon.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {addon.icon}
                      <Label
                        htmlFor={addon.id}
                        className="cursor-pointer font-medium"
                      >
                        {addon.name}
                      </Label>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {addon.description}
                    </p>
                  </div>
                  <p className="font-semibold whitespace-nowrap text-[#8C52FF]">
                    {formatPrice(addon.price)}/yr
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Price Summary */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Domain ({regPeriod} {regPeriod === 1 ? 'year' : 'years'})
              </span>
              <span className="font-medium">{formatPrice(domainTotal)}</span>
            </div>
            {selectedAddons.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Add-ons ({regPeriod} {regPeriod === 1 ? 'year' : 'years'})
                </span>
                <span className="font-medium">{formatPrice(addonsTotal)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Total</span>
              <span className="text-[#8C52FF]">{formatPrice(grandTotal)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleAddToCart}
              className="flex-1 bg-[#8C52FF] text-white hover:bg-[#7b42ff]"
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
