'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Mail, Users, HardDrive, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  EMAIL_PLANS,
  getAllEmailPlans,
  formatStorageSize,
  formatAccountLimit,
  type EmailPlanType,
} from '@/lib/email-bundle';

interface EmailServiceSelectorProps {
  domain?: string;
  selectedPlan: EmailPlanType;
  onPlanChange: (plan: EmailPlanType) => void;
  currency?: string;
  className?: string;
}

export function EmailServiceSelector({
  domain,
  selectedPlan,
  onPlanChange,
  currency = 'USD',
  className,
}: EmailServiceSelectorProps) {
  const plans = getAllEmailPlans();
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Professional Email Service
          </h3>
          <p className="text-sm text-muted-foreground">
            Get custom email addresses for your domain
            {domain && <span className="font-medium"> ({domain})</span>}
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Free tier included
        </Badge>
      </div>

      <RadioGroup
        value={selectedPlan}
        onValueChange={(value) => onPlanChange(value as EmailPlanType)}
        className="grid gap-4 md:grid-cols-3"
      >
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              'relative rounded-lg border-2 transition-all cursor-pointer',
              selectedPlan === plan.id
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-muted hover:border-muted-foreground/30',
              plan.highlighted && 'ring-2 ring-primary/30'
            )}
            onClick={() => onPlanChange(plan.id)}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Popular
                </Badge>
              </div>
            )}

            <RadioGroupItem
              value={plan.id}
              id={`email-plan-${plan.id}`}
              className="sr-only"
            />

            <Label
              htmlFor={`email-plan-${plan.id}`}
              className="cursor-pointer block p-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-base">{plan.name}</span>
                  {plan.priceMonthly === 0 ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      FREE
                    </Badge>
                  ) : (
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {currencySymbol}{plan.priceMonthly}
                        <span className="text-xs font-normal text-muted-foreground">/mo</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        or {currencySymbol}{plan.priceAnnually}/yr
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">{plan.description}</p>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {formatAccountLimit(plan.maxAccounts)} {plan.maxAccounts === 1 ? 'account' : 'accounts'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span>{formatStorageSize(plan.quotaPerAccountMB)} each</span>
                  </div>
                </div>

                <ul className="space-y-1">
                  {plan.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-xs">
                      <Check className="h-3 w-3 text-green-500 shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 4 && (
                    <li className="text-xs text-muted-foreground pl-5">
                      +{plan.features.length - 4} more features
                    </li>
                  )}
                </ul>

                {selectedPlan === plan.id && (
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="w-full"
                      asChild
                    >
                      <span>
                        Selected
                        <Check className="ml-2 h-4 w-4" />
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>

      {selectedPlan !== 'free' && (
        <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Email Service Addon</p>
            <p className="text-xs text-muted-foreground">
              The email service charge will be added to your hosting invoice. You can upgrade or downgrade anytime.
            </p>
          </div>
        </div>
      )}

      {selectedPlan === 'free' && domain && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 flex items-start gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Free Email Included!
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">
              You'll get 2 free email accounts (e.g., info@{domain}, admin@{domain}) with your hosting plan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for sidebar/cart summary
export function EmailServiceSummary({
  plan,
  domain,
  currency = 'USD',
}: {
  plan: EmailPlanType;
  domain?: string;
  currency?: string;
}) {
  const planConfig = EMAIL_PLANS[plan];
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;

  return (
    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">{planConfig.name}</span>
        </div>
        {planConfig.priceMonthly > 0 ? (
          <span className="text-sm font-semibold">
            {currencySymbol}{planConfig.priceMonthly}/mo
          </span>
        ) : (
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            FREE
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{formatAccountLimit(planConfig.maxAccounts)} accounts</span>
        <span>•</span>
        <span>{formatStorageSize(planConfig.quotaPerAccountMB)} each</span>
      </div>
      {domain && (
        <p className="text-xs text-muted-foreground">
          Domain: <span className="font-medium">{domain}</span>
        </p>
      )}
    </div>
  );
}

export default EmailServiceSelector;
