'use client';

import { resetPasswordAction, verifyResetToken } from '@/actions/resetPassword';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Loader2,
  Lock,
  Server,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// Submit button component
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
          Resetting password...
        </>
      ) : (
        <>
          <Lock className="mr-2 h-4 w-4" />
          Reset Password
        </>
      )}
    </Button>
  );
}

export function ResetPasswordClient({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const router = useRouter();
  const routeParams = useParams();
  const locale = (routeParams.locale as string) || 'en';

  // Verify token on mount
  useEffect(() => {
    const checkToken = async () => {
      try {
        const email = await verifyResetToken(token);
        setIsValidToken(!!email);
      } catch (error) {
        setIsValidToken(false);
      } finally {
        setIsValidating(false);
      }
    };

    checkToken();
  }, [token]);

  // Redirect to login after successful password reset
  useEffect(() => {
    if (state?.success) {
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 3000);
    }
  }, [state?.success, router, locale]);

  if (isValidating) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-4">
        <div className="space-y-4 text-center">
          <Loader2 className="text-primary mx-auto h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-4 py-12 pt-20">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Header */}
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="bg-destructive flex h-14 w-14 items-center justify-center rounded-2xl shadow-md">
                <XCircle className="h-7 w-7 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-foreground text-3xl font-bold tracking-tight">
                Invalid Reset Link
              </h1>
              <p className="text-muted-foreground">
                This password reset link is invalid or has expired
              </p>
            </div>
          </div>

          {/* Error Card */}
          <Card className="border-border shadow-sm">
            <CardContent className="space-y-5 pt-6 pb-6">
              <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-lg border p-3.5 text-sm">
                The password reset link you're using is either invalid, expired,
                or has already been used.
              </div>

              <Link
                href={`/${locale}/forgot-password`}
                className="block w-full"
              >
                <Button variant="default" className="h-11 w-full">
                  Request New Reset Link
                </Button>
              </Link>

              <div className="text-center">
                <Link
                  href={`/${locale}/login`}
                  className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4 py-12 pt-20">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="bg-primary flex h-14 w-14 items-center justify-center rounded-2xl shadow-md">
              <Server className="text-primary-foreground h-7 w-7" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-foreground text-3xl font-bold tracking-tight">
              Set New Password
            </h1>
            <p className="text-muted-foreground">
              Enter your new password below
            </p>
          </div>
        </div>

        {/* Reset Password Card */}
        <Card className="border-border shadow-sm">
          {state?.success ? (
            // Success State
            <CardContent className="space-y-6 pt-6 pb-6">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-foreground text-lg font-semibold">
                    Password Reset Successfully!
                  </h3>
                  <p className="text-muted-foreground max-w-sm text-sm">
                    Your password has been updated. You can now login with your
                    new password.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-muted-foreground text-center text-xs">
                  Redirecting to login page in 3 seconds...
                </p>
                <Link href={`/${locale}/login`} className="block w-full">
                  <Button variant="default" className="h-11 w-full">
                    Go to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          ) : (
            // Form State
            <form action={action}>
              {/* Hidden token field */}
              <input type="hidden" name="token" value={token} />

              <CardContent className="space-y-5 pt-6 pb-6">
                {/* Error Message */}
                {state?.error && (
                  <div className="bg-destructive border-destructive/20 rounded-lg border p-3.5 text-sm text-white">
                    {state.error}
                  </div>
                )}

                {/* Info Message */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3.5 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-100">
                  Password must be at least 8 characters long.
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="h-11 pr-10 pl-10"
                      autoFocus
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

                {/* Confirm Password Input */}
                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="h-11 pr-10 pl-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <SubmitButton />
              </CardContent>
            </form>
          )}
        </Card>

        {/* Footer */}
        <p className="text-muted-foreground text-center text-sm">
          © 2025 WebblyHosting. All rights reserved.
        </p>
      </div>
    </div>
  );
}
