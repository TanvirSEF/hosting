'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ExternalLink } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface WordPressSSOProps {
    serviceId: string | number;
    mode?: 'button' | 'compact' | 'menu-item';
    disabled?: boolean;
}

export function WordPressSSO({ serviceId, mode = 'button', disabled = false }: WordPressSSOProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e?: React.MouseEvent) => {
        if (disabled) return;
        if (e) e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch(`/api/plesk/wp-login?serviceId=${serviceId}`);
            const data = await response.json();

            console.log('API Response:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get login URL');
            }

            // Check if URL contains credentials for auto-login
            if (data.url.includes('log=') && data.url.includes('pwd=')) {
                console.log('Using auto-login method');
                
                // Create a hidden form for auto-submit
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = data.url.split('?')[0];
                form.target = '_blank';
                
                const urlParams = new URLSearchParams(data.url.split('?')[1]);
                
                // Add username field
                const logInput = document.createElement('input');
                logInput.type = 'hidden';
                logInput.name = 'log';
                logInput.value = urlParams.get('log') || '';
                form.appendChild(logInput);
                
                // Add password field
                const pwdInput = document.createElement('input');
                pwdInput.type = 'hidden';
                pwdInput.name = 'pwd';
                pwdInput.value = urlParams.get('pwd') || '';
                form.appendChild(pwdInput);
                
                // Add remember me
                const rememberInput = document.createElement('input');
                rememberInput.type = 'hidden';
                rememberInput.name = 'rememberme';
                rememberInput.value = 'forever';
                form.appendChild(rememberInput);
                
                document.body.appendChild(form);
                
                // Try to submit and handle popup blocker
                try {
                    form.submit();
                    toast.success('Auto-logging into WordPress Admin...');
                } catch (error) {
                    console.log('Popup blocked, trying alternative');
                    // Fallback: open URL directly
                    window.open(data.url, '_blank');
                    toast.success('Opening WordPress Admin...');
                }
                
                // Clean up form after a delay
                setTimeout(() => {
                    if (document.body.contains(form)) {
                        document.body.removeChild(form);
                    }
                }, 1000);
                
            } else {
                console.log('Using standard login method');
                // Standard SSO URL or fallback
                window.open(data.url, '_blank');
                toast.success('Opening WordPress Admin...');
            }

        } catch (error: any) {
            console.error('Login Error:', error);
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (mode === 'menu-item') {
        return (
            <DropdownMenuItem onSelect={(e) => {
                e.preventDefault();
                handleLogin();
            }} disabled={isLoading || disabled} className="cursor-pointer">
                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                )}
                WP Admin SSO
            </DropdownMenuItem>
        );
    }

    if (mode === 'compact') {
        return (
            <Button
                onClick={handleLogin}
                disabled={isLoading || disabled}
                size="sm"
                variant="ghost"
                className="h-8 px-2 transition-colors hover:bg-[#21759b]/10 hover:text-[#21759b]"
                title="WP Admin SSO"
            >
                {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <ExternalLink className="h-3.5 w-3.5" />
                )}
            </Button>
        );
    }

    return (
        <Button
            onClick={handleLogin}
            disabled={isLoading || disabled}
            size="sm"
            variant="outline"
            className="border-[#21759b] text-[#21759b] hover:bg-[#21759b]/10"
        >
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
            )}
            WP Admin
        </Button>
    );
}
