'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

export interface Country {
    name: string;
    code: string;
    flag: string;
}

export const countries: Country[] = [
    { name: 'Spain', code: 'ES', flag: '🇪🇸' },
    { name: 'Sweden', code: 'SE', flag: '🇸🇪' },
    { name: 'Afghanistan', code: 'AF', flag: '🇦🇫' },
    { name: 'Albania', code: 'AL', flag: '🇦🇱' },
    { name: 'Algeria', code: 'DZ', flag: '🇩🇿' },
    { name: 'Argentina', code: 'AR', flag: '🇦🇷' },
    { name: 'Australia', code: 'AU', flag: '🇦🇺' },
    { name: 'Austria', code: 'AT', flag: '🇦🇹' },
    { name: 'Bangladesh', code: 'BD', flag: '🇧🇩' },
    { name: 'Belgium', code: 'BE', flag: '🇧🇪' },
    { name: 'Brazil', code: 'BR', flag: '🇧🇷' },
    { name: 'Canada', code: 'CA', flag: '🇨🇦' },
    { name: 'China', code: 'CN', flag: '🇨🇳' },
    { name: 'Denmark', code: 'DK', flag: '🇩🇰' },
    { name: 'Egypt', code: 'EG', flag: '🇪🇬' },
    { name: 'Finland', code: 'FI', flag: '🇫🇮' },
    { name: 'France', code: 'FR', flag: '🇫🇷' },
    { name: 'Germany', code: 'DE', flag: '🇩🇪' },
    { name: 'Greece', code: 'GR', flag: '🇬🇷' },
    { name: 'Hong Kong', code: 'HK', flag: '🇭🇰' },
    { name: 'India', code: 'IN', flag: '🇮🇳' },
    { name: 'Indonesia', code: 'ID', flag: '🇮🇩' },
    { name: 'Iran', code: 'IR', flag: '🇮🇷' },
    { name: 'Iraq', code: 'IQ', flag: '🇮🇶' },
    { name: 'Ireland', code: 'IE', flag: '🇮🇪' },
    { name: 'Israel', code: 'IL', flag: '🇮🇱' },
    { name: 'Italy', code: 'IT', flag: '🇮🇹' },
    { name: 'Japan', code: 'JP', flag: '🇯🇵' },
    { name: 'Malaysia', code: 'MY', flag: '🇲🇾' },
    { name: 'Mexico', code: 'MX', flag: '🇲🇽' },
    { name: 'Netherlands', code: 'NL', flag: '🇳🇱' },
    { name: 'New Zealand', code: 'NZ', flag: '🇳🇿' },
    { name: 'Nigeria', code: 'NG', flag: '🇳🇬' },
    { name: 'Norway', code: 'NO', flag: '🇳🇴' },
    { name: 'Pakistan', code: 'PK', flag: '🇵🇰' },
    { name: 'Philippines', code: 'PH', flag: '🇵🇭' },
    { name: 'Poland', code: 'PL', flag: '🇵🇱' },
    { name: 'Portugal', code: 'PT', flag: '🇵🇹' },
    { name: 'Qatar', code: 'QA', flag: '🇶🇦' },
    { name: 'Romania', code: 'RO', flag: '🇷🇴' },
    { name: 'Russia', code: 'RU', flag: '🇷🇺' },
    { name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦' },
    { name: 'Singapore', code: 'SG', flag: '🇸🇬' },
    { name: 'South Africa', code: 'ZA', flag: '🇿🇦' },
    { name: 'South Korea', code: 'KR', flag: '🇰🇷' },
    { name: 'Sri Lanka', code: 'LK', flag: '🇱🇰' },
    { name: 'Switzerland', code: 'CH', flag: '🇨🇭' },
    { name: 'Taiwan', code: 'TW', flag: '🇹🇼' },
    { name: 'Thailand', code: 'TH', flag: '🇹🇭' },
    { name: 'Turkey', code: 'TR', flag: '🇹🇷' },
    { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪' },
    { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
    { name: 'United States', code: 'US', flag: '🇺🇸' },
    { name: 'Vietnam', code: 'VN', flag: '🇻🇳' },
];

interface CountrySelectProps {
    value?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
    className?: string;
    name?: string;
}

export function CountrySelect({
    value,
    onValueChange,
    disabled = false,
    className,
    name,
}: CountrySelectProps) {
    const [open, setOpen] = React.useState(false);

    // Helper to generate flag emoji from country code
    const getCountryFlag = (code: string) => {
        return code
            .toUpperCase()
            .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
    };

    // Helper to get country name
    const getCountryName = (code: string) => {
        try {
            return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code;
        } catch {
            return code;
        }
    };

    const getCountryFromCode = (code: string): Country => {
        const found = countries.find((c) => c.code === code);
        if (found) return found;
        return {
            name: getCountryName(code),
            code: code,
            flag: getCountryFlag(code),
        };
    };

    const [selectedCountry, setSelectedCountry] = React.useState<Country>(
        value ? getCountryFromCode(value) : countries.find(c => c.code === 'ES') || countries[0]
    );

    React.useEffect(() => {
        if (value) {
            setSelectedCountry(getCountryFromCode(value));
        }
    }, [value]);

    // Ensure selected country is always in the list
    const displayCountries = React.useMemo(() => {
        if (countries.some((c) => c.code === selectedCountry.code)) return countries;
        // Insert at the beginning or sort? Just insert at top for visibility
        return [selectedCountry, ...countries];
    }, [selectedCountry, countries]);

    const handleSelect = (country: Country) => {
        setSelectedCountry(country);
        onValueChange?.(country.code);
        setOpen(false);
    };

    return (
        <>
            {/* Hidden input for form submission */}
            <input type="hidden" name={name} value={selectedCountry.code} />

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className={cn(
                            'h-11 w-full justify-between px-3 font-normal',
                            className
                        )}
                    >
                        <span className="flex items-center gap-2 truncate">
                            <span className="text-lg">{selectedCountry.flag}</span>
                            <span className="text-sm font-medium">
                                {selectedCountry.name}
                            </span>
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search country..." className="h-9" />
                        <CommandList>
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup>
                                {displayCountries.map((country) => (
                                    <CommandItem
                                        key={country.code}
                                        value={`${country.name} ${country.code}`}
                                        onSelect={() => handleSelect(country)}
                                        className="cursor-pointer"
                                    >
                                        <span className="flex flex-1 items-center gap-3">
                                            <span className="text-xl">{country.flag}</span>
                                            <span className="flex-1">{country.name}</span>
                                            <span className="text-muted-foreground text-sm">
                                                {country.code}
                                            </span>
                                        </span>
                                        <Check
                                            className={cn(
                                                'ml-2 h-4 w-4',
                                                selectedCountry.code === country.code
                                                    ? 'opacity-100'
                                                    : 'opacity-0'
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </>
    );
}
