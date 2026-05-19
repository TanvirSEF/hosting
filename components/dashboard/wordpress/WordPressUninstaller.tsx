'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WordPressUninstallerProps {
    serviceId: string | number;
    domain: string;
    disabled?: boolean;
    mode?: 'button' | 'menu-item';
}

export function WordPressUninstaller({ serviceId, domain, disabled = false, mode = 'button' }: WordPressUninstallerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (confirmText !== 'DELETE') return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/plesk/wp-delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ serviceId }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete WordPress');
            }

            toast.success('WordPress deleted successfully');
            setIsOpen(false);
            setConfirmText('');
            router.refresh();

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const trigger = mode === 'menu-item' ? (
        <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            disabled={disabled}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
        >
            <Trash2 className="mr-2 h-4 w-4" />
            Reset WordPress
        </DropdownMenuItem>
    ) : (
        <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
        >
            <Trash2 className="mr-2 h-4 w-4" />
            Reset WordPress
        </Button>
    );

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                {trigger}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Reset WordPress Installation?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This will <strong>permanently delete</strong> the WordPress installation for <strong>{domain}</strong>.
                        All data, posts, and media will be lost accurately. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-4 space-y-3">
                    <Label>Type <span className="font-mono font-bold">DELETE</span> to confirm:</Label>
                    <Input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="DELETE"
                        className="border-red-200 focus-visible:ring-red-500"
                    />
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={confirmText !== 'DELETE' || isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete & Reset
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
