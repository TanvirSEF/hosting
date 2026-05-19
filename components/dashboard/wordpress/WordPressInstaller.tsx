'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Loader2, Copy, Check, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WordPressInstallerProps {
    serviceId: string | number;
    domain: string;
    mode?: 'button' | 'compact' | 'menu-item';
    disabled?: boolean;
}

export function WordPressInstaller({ serviceId, domain, mode = 'button', disabled = false }: WordPressInstallerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [credentials, setCredentials] = useState<{ url?: string; username?: string; password?: string } | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const router = useRouter();

    const copyToClipboard = async (text: string) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                setCopied(true);
            } else {
                // Fallback for insecure contexts (http)
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                    setCopied(true);
                } catch (err) {
                    console.error('Fallback: Oops, unable to copy', err);
                    toast.error('Failed to copy to clipboard');
                }
                document.body.removeChild(textArea);
            }
            setTimeout(() => setCopied(false), 2000);
            if (copied) toast.success('Copied to clipboard'); // Logic check: simpler to just toast on success
        } catch (err) {
            console.error('Failed to copy keys: ', err);
            toast.error('Failed to copy to clipboard');
        }
    };

    const handleInstall = async (e?: React.MouseEvent) => {
        if (disabled) return;
        if (e) e.preventDefault(); // Prevent default link behavior or menu closing if needed
        setIsLoading(true);
        try {
            const response = await fetch('/api/plesk/wp-install', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ serviceId }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to install WordPress');
            }

            toast.success('WordPress installed successfully for ' + domain);

            // Try to extract credentials from response
            // Plesk API structure can vary, but we look for common fields
            const installData = result.data;
            if (installData) {
                // Determine admin URL (construct from domain if not provided)
                const adminUrl = installData.loginUrl || `https://${domain}/wp-admin`;

                // Set credentials state to show dialog
                setCredentials({
                    url: adminUrl,
                    username: installData.adminName || 'admin',
                    password: installData.adminPassword || 'Please check your email or use "Reset Password"',
                });
                setIsOpen(true);
            }

            router.refresh();

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };





    return (
        <>
            {mode === 'menu-item' ? (
                <DropdownMenuItem onSelect={(e) => {
                    e.preventDefault(); // Keep menu open or handle manually
                    handleInstall();
                }} disabled={isLoading || disabled} className="cursor-pointer">
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    Install WordPress
                </DropdownMenuItem>
            ) : mode === 'compact' ? (
                <Button
                    onClick={handleInstall}
                    disabled={isLoading || disabled}
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 transition-colors hover:bg-[#21759b]/10 hover:text-[#21759b]"
                    title="Install WordPress"
                >
                    {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Download className="h-3.5 w-3.5" />
                    )}
                </Button>
            ) : (
                <Button
                    onClick={handleInstall}
                    disabled={isLoading || disabled}
                    size="sm"
                    className="bg-[#21759b] hover:bg-[#1a5c7a] text-white" // WP Brand Color
                >
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    Install WordPress
                </Button>
            )}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5 text-[#21759b]" />
                            WordPress Installed Successfully
                        </DialogTitle>
                        <DialogDescription>
                            Your WordPress installation is ready. Please save these credentials immediately as they may not be viewable again.
                        </DialogDescription>
                    </DialogHeader>
                    {credentials && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Admin URL</Label>
                                <div className="flex items-center gap-2">
                                    <Input readOnly value={credentials.url} />
                                    <Button size="icon" variant="ghost" asChild>
                                        <a href={credentials.url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Username</Label>
                                    <Input readOnly value={credentials.username} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Password</Label>
                                    <div className="relative">
                                        <Input readOnly value={credentials.password} type="text" className="pr-10" />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                            onClick={() => credentials.password && copyToClipboard(credentials.password)}
                                        >
                                            {copied ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Copy className="h-4 w-4 text-gray-500" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setIsOpen(false)} className="w-full">
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
