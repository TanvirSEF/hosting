'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardTranslationProvider } from '@/components/DashboardTranslationProvider';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Key, Eye, EyeOff } from 'lucide-react';
import { useDashboardTranslation } from '@/components/DashboardTranslationProvider';
import {
  changePasswordAction,
  get2FAStatusAction,
} from '@/actions/account-actions';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useFormStatus } from 'react-dom';

interface SecurityContentProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    firstname: string;
  } | null;
}

function SubmitButton() {
  const { t } = useDashboardTranslation();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full md:w-auto">
      {pending
        ? t('security.password.updating')
        : t('security.password.update')}
    </Button>
  );
}

function SecurityContent({ user }: SecurityContentProps) {
  const { t } = useDashboardTranslation();
  const [state, formAction] = useActionState(changePasswordAction, null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading2FA, setLoading2FA] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Load 2FA status
    get2FAStatusAction().then((result) => {
      if (result.success) {
        setTwoFactorEnabled(result.twoFactorEnabled || false);
      }
      setLoading2FA(false);
    });
  }, []);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || t('security.password.success'));
      // Reset form
      const form = document.getElementById(
        'change-password-form'
      ) as HTMLFormElement;
      form?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Header Section */}
              <div className="px-4 lg:px-6">
                <h1 className="text-foreground text-3xl font-bold tracking-tight">
                  {t('security.title')}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {t('security.subtitle')}
                </p>
              </div>

              <div className="space-y-6 px-4 lg:px-6">
                {/* Change Password Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      {t('security.password.title')}
                    </CardTitle>
                    <CardDescription>
                      {t('security.password.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      id="change-password-form"
                      action={formAction}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">
                          {t('security.password.current')}
                        </Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            name="currentPassword"
                            type={showCurrentPassword ? 'text' : 'password'}
                            required
                            placeholder={t(
                              'security.password.currentPlaceholder'
                            )}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowCurrentPassword(!showCurrentPassword)
                            }
                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                            tabIndex={-1}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">
                          {t('security.password.new')}
                        </Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            name="newPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            placeholder={t('security.password.newPlaceholder')}
                            minLength={8}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                            tabIndex={-1}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                          {t('security.password.confirm')}
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            placeholder={t(
                              'security.password.confirmPlaceholder'
                            )}
                            minLength={8}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <SubmitButton />
                    </form>
                  </CardContent>
                </Card>

                {/* Two-Factor Authentication Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {t('security.twoFactor.title')}
                    </CardTitle>
                    <CardDescription>
                      {t('security.twoFactor.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading2FA ? (
                      <div className="text-muted-foreground py-4 text-center">
                        {t('security.twoFactor.loading')}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {t('security.twoFactor.label')}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {twoFactorEnabled
                                ? t('security.twoFactor.enabled')
                                : t('security.twoFactor.disabled')}
                            </div>
                          </div>
                          <div
                            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                              twoFactorEnabled
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {twoFactorEnabled
                              ? t('security.twoFactor.statusEnabled')
                              : t('security.twoFactor.statusDisabled')}
                          </div>
                        </div>
                        <div className="text-muted-foreground rounded-md border border-blue-200 bg-blue-50 p-4 text-sm">
                          <p className="mb-1 font-medium text-blue-900">
                            {t('security.twoFactor.note')}:
                          </p>
                          <p className="text-blue-800">
                            {t('security.twoFactor.noteText')}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function SecurityClientWrapper({ user }: SecurityContentProps) {
  return (
    <DashboardTranslationProvider>
      <SecurityContent user={user} />
    </DashboardTranslationProvider>
  );
}
