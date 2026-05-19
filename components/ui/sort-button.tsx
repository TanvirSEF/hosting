'use client';

import { ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SortButtonProps<T extends string> {
    field: T;
    currentSortField: T;
    sortDirection: 'asc' | 'desc';
    onSort: (field: T) => void;
    children: React.ReactNode;
    className?: string;
}

export function SortButton<T extends string>({
    field,
    currentSortField,
    sortDirection,
    onSort,
    children,
    className,
}: SortButtonProps<T>) {
    return (
        <button
            onClick={() => onSort(field)}
            className={cn(
                'flex items-center gap-1 hover:text-primary transition-colors',
                className
            )}
        >
            {children}
            <ArrowUpDown className="h-3 w-3 opacity-50" />
            {currentSortField === field && (
                <span className="text-xs">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
            )}
        </button>
    );
}
