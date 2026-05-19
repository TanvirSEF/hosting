'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Mail,
  Plus,
  Users,
  HardDrive,
  ArrowUpRight,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { EmailSetupWizard } from '@/components/emails/EmailSetupWizard';
import { EmailUpgradeDialog } from '@/components/dashboard/EmailUpgradeDialog';
import {
  EMAIL_PLANS,
  formatStorageSize,
  formatAccountLimit,
  type EmailPlanType,
} from '@/lib/email-bundle';

interface EmailServiceCardProps {
  whmcsServiceId: number;
  domain: string;
  plan: EmailPlanType;
  maxAccounts: number;
  quotaPerAccountMB: number;
  accountsUsed: number;
  status: 'pending' | 'active' | 'suspended' | 'cancelled';
  onRefresh?: () => void;
}

export function EmailServiceCard({
  whmcsServiceId,
  domain,
  plan,
  maxAccounts,
  quotaPerAccountMB,
  accountsUsed,
  status,
  onRefresh,
}: EmailServiceCardProps) {
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const planConfig = EMAIL_PLANS[plan];
  const canCreateMore = maxAccounts === -1 || accountsUsed < maxAccounts;
  const usagePercent = maxAccounts === -1 ? 0 : (accountsUsed / maxAccounts) * 100;
  const isPaidPlan = plan !== 'free';

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Check className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Pending
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Suspended
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {status}
          </Badge>
        );
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Service
              </CardTitle>
              <CardDescription>
                Professional email for {domain}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <Badge variant={isPaidPlan ? 'default' : 'secondary'}>
                {planConfig.name}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Usage Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs">Email Accounts</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{accountsUsed}</span>
                <span className="text-sm text-muted-foreground">
                  / {formatAccountLimit(maxAccounts)}
                </span>
              </div>
              {maxAccounts !== -1 && (
                <Progress value={usagePercent} className="h-1 mt-2" />
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <HardDrive className="h-4 w-4" />
                <span className="text-xs">Storage Each</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  {formatStorageSize(quotaPerAccountMB)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Per account
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCreateWizard(true)}
              disabled={!canCreateMore || status !== 'active'}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Email
            </Button>

            {plan === 'free' && (
              <Button
                variant="outline"
                onClick={() => setShowUpgradeDialog(true)}
                className="flex-1"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade
              </Button>
            )}
          </div>

          {/* Upgrade CTA for Free Plan */}
          {plan === 'free' && (
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">
                    Need more email accounts?
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upgrade to Pro for 10 accounts or Business for unlimited
                  </p>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setShowUpgradeDialog(true)}
                  className="text-primary"
                >
                  View Plans
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Webmail Access */}
          {status === 'active' && (
            <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
              <div>
                <p className="text-sm font-medium">Webmail Access</p>
                <p className="text-xs text-muted-foreground">
                  Access your emails from anywhere
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={`https://webmail.${domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Webmail
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          )}

          {/* Account Limit Warning */}
          {!canCreateMore && status === 'active' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Account Limit Reached
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  You've used all {maxAccounts} email accounts. Upgrade your plan to create more.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Email Wizard */}
      <EmailSetupWizard
        open={showCreateWizard}
        onOpenChange={setShowCreateWizard}
        serviceId={whmcsServiceId}
        domain={domain}
        plan={plan}
        maxAccounts={maxAccounts}
        accountsUsed={accountsUsed}
        onEmailCreated={onRefresh}
      />

      {/* Upgrade Dialog */}
      <EmailUpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        whmcsServiceId={whmcsServiceId}
        currentPlan={plan}
        domain={domain}
        onUpgraded={onRefresh}
      />
    </>
  );
}

export default EmailServiceCard;
