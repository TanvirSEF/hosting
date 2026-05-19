'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Lock, 
  Loader2, 
  Check, 
  AlertCircle, 
  ArrowRight,
  Shield,
  Globe,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { createEmailAccountAction } from '@/actions/email-service-actions';
import { EMAIL_PLANS, formatStorageSize, type EmailPlanType } from '@/lib/email-bundle';

interface EmailSetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: number;
  domain: string;
  plan: EmailPlanType;
  maxAccounts: number;
  accountsUsed: number;
  onEmailCreated?: () => void;
}

export function EmailSetupWizard({
  open,
  onOpenChange,
  serviceId,
  domain,
  plan,
  maxAccounts,
  accountsUsed,
  onEmailCreated,
}: EmailSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [emailUsername, setEmailUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const planConfig = EMAIL_PLANS[plan];
  const canCreateMore = maxAccounts === -1 || accountsUsed < maxAccounts;
  const remainingAccounts = maxAccounts === -1 ? 'unlimited' : maxAccounts - accountsUsed;

  const resetWizard = () => {
    setStep(1);
    setEmailUsername('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    resetWizard();
    onOpenChange(false);
  };

  const validateEmailUsername = (username: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._-]+$/;
    return emailRegex.test(username) && username.length >= 2 && username.length <= 64;
  };

  const validatePassword = (pwd: string): { valid: boolean; message?: string } => {
    if (pwd.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(pwd)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(pwd)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(pwd)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true };
  };

  const handleStep1Next = () => {
    setError(null);

    if (!emailUsername.trim()) {
      setError('Please enter an email username');
      return;
    }

    if (!validateEmailUsername(emailUsername)) {
      setError('Username can only contain letters, numbers, dots, hyphens, and underscores (2-64 characters)');
      return;
    }

    setStep(2);
  };

  const handleStep2Next = () => {
    setError(null);

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message || 'Invalid password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setStep(3);
  };

  const handleCreateEmail = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await createEmailAccountAction(
        serviceId,
        domain,
        emailUsername.toLowerCase(),
        password,
        firstName || 'User',
        planConfig.quotaPerAccountMB
      );

      if (!result.success) {
        setError(result.error || 'Failed to create email account');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      toast.success('Email account created successfully!');
      
      if (onEmailCreated) {
        onEmailCreated();
      }

      setStep(4);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!canCreateMore && !success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Account Limit Reached
            </DialogTitle>
            <DialogDescription>
              You've reached the maximum number of email accounts for your current plan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Current plan: <Badge variant="secondary">{planConfig.name}</Badge>
              </p>
              <p className="text-sm">
                You've used <span className="font-semibold">{accountsUsed}</span> of{' '}
                <span className="font-semibold">{maxAccounts}</span> accounts
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button onClick={() => {
              // TODO: Open upgrade dialog
              handleClose();
            }}>
              Upgrade Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Create Email Account
          </DialogTitle>
          <DialogDescription>
            Set up your professional email address for {domain}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step >= s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
          ))}
        </div>

        {/* Step 1: Email Username */}
        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email-username">Email Address</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="email-username"
                  placeholder="info"
                  value={emailUsername}
                  onChange={(e) => setEmailUsername(e.target.value.toLowerCase())}
                  className="flex-1"
                  autoFocus
                />
                <span className="text-muted-foreground">@{domain}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Letters, numbers, dots, hyphens, and underscores only
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleStep1Next}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Password */}
        {step === 2 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              
              {/* Password strength indicator */}
              <div className="space-y-1">
                <div className="flex gap-1">
                  {['[A-Z]', '[a-z]', '[0-9]', '.{8,}'].map((regex, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        new RegExp(regex).test(password)
                          ? 'bg-green-500'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Must include: uppercase, lowercase, number, min 8 characters
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleStep2Next}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm & Create */}
        {step === 3 && (
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Review Your Email Account
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email Address:</span>
                  <span className="font-medium">{emailUsername}@{domain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Storage:</span>
                  <span>{formatStorageSize(planConfig.quotaPerAccountMB)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan:</span>
                  <Badge variant="secondary">{planConfig.name}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="first-name">Your Name (Optional)</Label>
              <Input
                id="first-name"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={handleCreateEmail} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Create Email Account
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="space-y-4 py-4">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              
              <div>
                <h3 className="font-semibold text-lg">Email Account Created!</h3>
                <p className="text-muted-foreground">
                  Your email address is ready to use
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-lg font-medium text-primary">
                  {emailUsername}@{domain}
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-left space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Access Your Email
                </h4>
                <p className="text-xs text-muted-foreground">
                  Webmail: <span className="font-medium">https://webmail.{domain}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  You can also configure your email in Outlook, Apple Mail, or any email client using IMAP/POP3/SMTP.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                <Check className="mr-2 h-4 w-4" />
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default EmailSetupWizard;
