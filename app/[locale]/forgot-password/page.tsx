'use client';

import { forgotPasswordAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Mail, Server, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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
          Sending reset link...
        </>
      ) : (
        <>
          <Mail className="mr-2 h-4 w-4" />
          Send Reset Link
        </>
      )}
    </Button>
  );
}

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(forgotPasswordAction, null);
  const params = useParams();
  const locale = params.locale || 'en';

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
              Reset Password
            </h1>
            <p className="text-muted-foreground">
              Enter your email address and we'll send you a password reset link
            </p>
          </div>
        </div>

        {/* Forgot Password Card */}
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
                    Check Your Email
                  </h3>
                  <p className="text-muted-foreground max-w-sm text-sm">
                    We've sent a password reset link to{' '}
                    <span className="text-foreground font-medium">
                      {state.email}
                    </span>
                    . Please check your inbox and follow the instructions to
                    reset your password.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Link href={`/${locale}/login`} className="block w-full">
                  <Button variant="default" className="h-11 w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>

                <p className="text-muted-foreground text-center text-xs">
                  Didn't receive the email? Check your spam folder or try again
                  in a few minutes.
                </p>
              </div>
            </CardContent>
          ) : (
            // Form State
            <form action={action}>
              <CardContent className="space-y-5 pt-6 pb-6">
                {/* Error Message */}
                {state?.error && (
                  <div className="bg-destructive border-destructive/20 rounded-lg border p-3.5 text-sm text-white">
                    {state.error}
                  </div>
                )}

                {/* Info Message */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3.5 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-100">
                  Enter the email address associated with your account and we'll
                  send you a secure link to reset your password.
                </div>

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
                      autoFocus
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <SubmitButton />

                {/* Back to Login Link */}
                <div className="text-center">
                  <Link
                    href={`/${locale}/login`}
                    className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-sm font-medium transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Login
                  </Link>
                </div>
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
