'use client';

import { loginAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

// Submit button component to handle loading state
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="h-11 w-full cursor-pointer"
      type="submit"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          <Lock className="mr-2 h-4 w-4" />
          Sign In
        </>
      )}
    </Button>
  );
}

export default function LoginPage() {
  const [state, action] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const returnUrl = searchParams.get('returnUrl') || '';

  // Get current locale from URL pathname
  const locale =
    typeof window !== 'undefined'
      ? window.location.pathname.split('/')[1] || 'en'
      : 'en';

  // Auto-inject returnUrl if pending order exists (only on mount)
  useEffect(() => {
    // Only check once when component mounts and no returnUrl is set
    if (returnUrl) return;

    const pendingDomain = localStorage.getItem('pendingDomainOrder');
    const pendingHosting = localStorage.getItem('pendingHostingOrder');
    const universalCart = localStorage.getItem('universal_cart');
    let hasCartItems = false;

    try {
      if (universalCart) {
        const cart = JSON.parse(universalCart);
        hasCartItems = Array.isArray(cart) && cart.length > 0;
      }
    } catch (e) {
      // Ignore parse error
    }

    // Only set returnUrl if there's actually something pending
    if (hasCartItems || pendingDomain || pendingHosting) {
      const newParams = new URLSearchParams(searchParams.toString());
      const pathname = window.location.pathname;
      const locale = pathname.split('/')[1] || 'en';

      if (hasCartItems) {
        newParams.set('returnUrl', `/${locale}/?autoCheckout=true`);
      } else if (pendingDomain || pendingHosting) {
        newParams.set('returnUrl', '/dashboard/processing');
      }

      router.replace(`${pathname}?${newParams.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4 py-12 pt-20">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex h-[clamp(72px,14vw,160px)] w-[clamp(72px,14vw,160px)] items-center justify-center">
              <Image
                src="https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/favicon.webp"
                alt="WebblyHosting"
                width={160}
                height={160}
                className="h-[clamp(56px,12vw,128px)] w-[clamp(56px,12vw,128px)]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-foreground text-3xl font-bold tracking-tight">
              WebblyHosting
            </h1>
            <p className="text-muted-foreground">
              Sign in to your client portal
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-border shadow-sm">
          <form action={action}>
            {/* Hidden returnUrl field */}
            <input type="hidden" name="returnUrl" value={returnUrl} />

            <CardContent className="space-y-5 pt-6 pb-2">
              {/* Error Message */}
              {state?.error && (
                <div className="bg-destructive border-destructive/20 rounded-lg border p-3.5 text-sm text-white">
                  {state.error}
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    className="h-11 pl-10"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link
                    href={`/${locale}/forgot-password`}
                    className="text-primary hover:text-primary/80 cursor-pointer text-sm font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    className="h-11 pr-10 pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pb-6">
              <SubmitButton />

              {/* Divider */}
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <div className="border-border w-full border-t"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card text-muted-foreground px-2">
                    Don't have an account?
                  </span>
                </div>
              </div>

              {/* Register Link */}
              <Link href="/register" className="w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full border-[#8C52FF] text-[#8C52FF] transition-colors hover:bg-[#8C52FF] hover:text-white"
                >
                  Create Account
                </Button>
              </Link>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-muted-foreground text-center text-sm">
          © 2025 WebblyHosting. All rights reserved.
        </p>
      </div>
    </div>
  );
}
