'use client';

import { adminLoginAction } from '@/actions/admin-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useFormStatus } from 'react-dom';
import { useState, useActionState } from 'react';
import {
  ShieldAlert,
  Lock,
  Shield,
  AlertTriangle,
  Eye,
  EyeOff,
  Mail,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      className="w-full bg-[#8C52FF] font-semibold text-white transition-colors hover:bg-[#7a47e6]"
      type="submit"
      disabled={pending}
    >
      {pending ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
          Verifying Access...
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Access Dashboard
        </div>
      )}
    </Button>
  );
}

export default function AdminLoginPage() {
  const [state, action] = useActionState(adminLoginAction, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 pt-8 text-center">
          <div className="flex justify-center">
            <div className="rounded-full border border-[#8C52FF]/20 bg-[#8C52FF]/10 p-4">
              <ShieldAlert className="h-10 w-10 text-[#8C52FF]" />
            </div>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
            <CardDescription className="font-medium">
              Restricted Access - Authorized Personnel Only
            </CardDescription>
          </div>
        </CardHeader>

        <form action={action}>
          <CardContent className="space-y-4 px-6 pb-8">
            {/* Error Message */}
            {state?.error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    {state.error}
                  </p>
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4 text-[#8C52FF]" />
                Email Address
              </label>
              <div className="relative">
                <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  name="email"
                  type="email"
                  placeholder="admin@webblyhost.com"
                  required
                  className="h-12 pl-10 focus-visible:ring-[#8C52FF]"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Lock className="h-4 w-4 text-[#8C52FF]" />
                Password
              </label>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  required
                  className="h-12 pr-10 pl-10 focus-visible:ring-[#8C52FF]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer transition-colors hover:text-[#8C52FF]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <SubmitButton />

            {/* Security Notice */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <p className="text-muted-foreground text-xs font-medium">
                Secure Connection Established
              </p>
            </div>
          </CardContent>
        </form>

        {/* Footer */}
        <div className="bg-muted/30 border-t">
          <div className="space-y-3 p-4 text-center">
            <Link
              href="/"
              className="text-muted-foreground inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#8C52FF]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div className="text-muted-foreground flex items-center justify-center gap-2 text-xs">
              <Shield className="h-3 w-3" />
              <span>IP Address Logged for Security Monitoring</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
