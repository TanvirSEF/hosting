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
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Check, Sparkles, Loader2, ArrowRight, Users, HardDrive } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  EMAIL_PLANS,
  getUpgradeOptions,
  formatStorageSize,
  formatAccountLimit,
  type EmailPlanType,
} from '@/lib/email-bundle';
import { upgradeEmailServiceAction } from '@/actions/email-bundle-actions';
import { cn } from '@/lib/utils';

interface EmailUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  whmcsServiceId: number;
  currentPlan: EmailPlanType;
  domain: string;
  onUpgraded?: () => void;
}

export function EmailUpgradeDialog({
  open,
  onOpenChange,
  whmcsServiceId,
  currentPlan,
  domain,
  onUpgraded,
}: EmailUpgradeDialogProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<EmailPlanType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const upgradeOptions = getUpgradeOptions(currentPlan);
  const currentPlanConfig = EMAIL_PLANS[currentPlan];

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    setIsLoading(true);

    try {
      const result = await upgradeEmailServiceAction({
        whmcsServiceId,
        newPlan: selectedPlan,
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to upgrade email service');
        setIsLoading(false);
        return;
      }

      if (result.requiresPayment && result.invoiceId) {
        toast.success('Upgrade order created! Please complete the payment.');
        onOpenChange(false);
        router.push(`/dashboard/billing?invoice=${result.invoiceId}`);
      } else {
        toast.success('Email service upgraded successfully!');
        onOpenChange(false);
        if (onUpgraded) {
          onUpgraded();
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (upgradeOptions.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>You're on the highest plan!</DialogTitle>
            <DialogDescription>
              Your email service is already on the Business plan with unlimited accounts.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Upgrade Email Service
          </DialogTitle>
          <DialogDescription>
            Get more email accounts and storage for {domain}
          </DialogDescription>
        </DialogHeader>

        {/* Current Plan */}
        <div className="bg-muted/30 rounded-lg p-4 mb-4">
          <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{currentPlanConfig.name}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {formatAccountLimit(currentPlanConfig.maxAccounts)} accounts
                </span>
                <span className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  {formatStorageSize(currentPlanConfig.quotaPerAccountMB)} each
                </span>
              </div>
            </div>
            <Badge variant="secondary">{currentPlan}</Badge>
          </div>
        </div>

        {/* Upgrade Options */}
        <RadioGroup
          value={selectedPlan || ''}
          onValueChange={(value) => setSelectedPlan(value as EmailPlanType)}
          className="space-y-3"
        >
          {upgradeOptions.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'relative rounded-lg border-2 transition-all cursor-pointer',
                selectedPlan === plan.id
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/30',
                plan.highlighted && 'ring-2 ring-primary/30'
              )}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.highlighted && (
                <div className="absolute -top-2 left-4">
                  <Badge className="bg-primary text-primary-foreground text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Best Value
                  </Badge>
                </div>
              )}

              <RadioGroupItem
                value={plan.id}
                id={`upgrade-plan-${plan.id}`}
                className="sr-only"
              />

              <Label
                htmlFor={`upgrade-plan-${plan.id}`}
                className="cursor-pointer block p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{plan.name}</span>
                      {selectedPlan === plan.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {formatAccountLimit(plan.maxAccounts)} accounts
                      </span>
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-4 w-4" />
                        {formatStorageSize(plan.quotaPerAccountMB)} each
                      </span>
                    </div>

                    <ul className="space-y-1">
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <Check className="h-3 w-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="text-xs text-muted-foreground pl-5">
                          +{plan.features.length - 3} more features
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-xl">
                      ${plan.priceMonthly}
                      <span className="text-sm font-normal text-muted-foreground">
                        /mo
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      or ${plan.priceAnnually}/yr
                    </div>
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={!selectedPlan || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Upgrade Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EmailUpgradeDialog;
