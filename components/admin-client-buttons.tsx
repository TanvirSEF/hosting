'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CountrySelect } from '@/components/ui/country-select';
import { UserPlus, Eye, Trash2, Loader2 } from 'lucide-react';
import {
  addClientAction,
  deleteClientAction,
} from '@/actions/admin-client-actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAdminTranslation } from '@/components/AdminTranslationProvider';

export function AddClientButton() {
  const { t } = useAdminTranslation();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget; // Store form reference before async

    startTransition(async () => {
      const result = await addClientAction(formData);

      if (result.success) {
        toast.success(t('clients.addClient.success'), {
          description: t('clients.addClient.clientId', { id: result.clientId }),
        });

        // Reset form
        form.reset();

        // Close dialog and refresh
        setOpen(false);

        // Force refresh the page to show new client
        setTimeout(() => {
          router.refresh();
          window.location.reload();
        }, 100);
      } else {
        setError(result.error || t('clients.addClient.failed'));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <UserPlus className="mr-2 h-4 w-4" />
          {t('clients.addClient.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('clients.addClient.title')}</DialogTitle>
            <DialogDescription>
              {t('clients.addClient.description')}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">
                  {t('clients.addClient.firstName')} *
                </Label>
                <Input
                  id="firstname"
                  name="firstname"
                  placeholder={t('clients.addClient.firstNamePlaceholder')}
                  required
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname">
                  {t('clients.addClient.lastName')} *
                </Label>
                <Input
                  id="lastname"
                  name="lastname"
                  placeholder={t('clients.addClient.lastNamePlaceholder')}
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('clients.addClient.email')} *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t('clients.addClient.emailPlaceholder')}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {t('clients.addClient.password')} *
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={t('clients.addClient.passwordPlaceholder')}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address1">
                {t('clients.addClient.address')} *
              </Label>
              <Input
                id="address1"
                name="address1"
                placeholder={t('clients.addClient.addressPlaceholder')}
                required
                disabled={isPending}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">{t('clients.addClient.city')} *</Label>
                <Input
                  id="city"
                  name="city"
                  placeholder={t('clients.addClient.cityPlaceholder')}
                  required
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">{t('clients.addClient.state')} *</Label>
                <Input
                  id="state"
                  name="state"
                  placeholder={t('clients.addClient.statePlaceholder')}
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postcode">
                  {t('clients.addClient.postcode')} *
                </Label>
                <Input
                  id="postcode"
                  name="postcode"
                  placeholder={t('clients.addClient.postcodePlaceholder')}
                  required
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">
                  {t('clients.addClient.country')} *
                </Label>
                <CountrySelect name="country" disabled={isPending} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phonenumber">
                {t('clients.addClient.phoneNumber')}
              </Label>
              <Input
                id="phonenumber"
                name="phonenumber"
                type="tel"
                placeholder={t('clients.addClient.phoneNumberPlaceholder')}
                disabled={isPending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              {t('clients.addClient.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('clients.addClient.creating')}
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t('clients.addClient.createButton')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ViewClientButton({ client }: { client: any }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="hover:bg-primary/10 hover:text-primary h-8 px-2 transition-colors"
          title="View Client"
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-full p-2">
              <Eye className="text-primary h-5 w-5" />
            </div>
            Client Details
          </DialogTitle>
          <DialogDescription>
            Complete information for client #{client.id}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Personal Information */}
          <div className="space-y-3">
            <h3 className="text-foreground border-b pb-2 text-sm font-semibold">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">
                  First Name
                </Label>
                <p className="text-sm font-medium">{client.firstname}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">
                  Last Name
                </Label>
                <p className="text-sm font-medium">{client.lastname}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Email</Label>
                <p className="text-sm font-medium">{client.email}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Company</Label>
                <p className="text-sm font-medium">
                  {client.companyname || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="text-foreground border-b pb-2 text-sm font-semibold">
              Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Address</Label>
                <p className="text-sm font-medium">{client.address1 || '-'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">City</Label>
                <p className="text-sm font-medium">{client.city || '-'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">State</Label>
                <p className="text-sm font-medium">{client.state || '-'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">
                  Postcode
                </Label>
                <p className="text-sm font-medium">{client.postcode || '-'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Country</Label>
                <p className="text-sm font-medium">{client.country || '-'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Phone</Label>
                <p className="text-sm font-medium">
                  {client.phonenumber || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-3">
            <h3 className="text-foreground border-b pb-2 text-sm font-semibold">
              Account Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">
                  Client ID
                </Label>
                <p className="text-sm font-medium">#{client.id}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Status</Label>
                <div className="flex items-center gap-2">
                  <ClientStatusBadge status={client.status} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">
                  Registration Date
                </Label>
                <p className="text-sm font-medium">{client.datecreated}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">
                  Last Login
                </Label>
                <p className="text-sm font-medium">
                  {client.lastlogin || 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Client Status Badge Component (moved here for ViewClientButton to use)
function ClientStatusBadge({ status }: { status: string }) {
  const statusLower = status?.toLowerCase() || 'unknown';

  const statusConfig: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    active: {
      bg: 'bg-green-500/10 border-green-500/20',
      text: 'text-green-700 dark:text-green-400',
      label: 'Active',
    },
    inactive: {
      bg: 'bg-gray-500/10 border-gray-500/20',
      text: 'text-gray-700 dark:text-gray-400',
      label: 'Inactive',
    },
    closed: {
      bg: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-700 dark:text-red-400',
      label: 'Closed',
    },
  };

  const config = statusConfig[statusLower] || statusConfig.inactive;

  return (
    <Badge
      variant="outline"
      className={`${config.bg} ${config.text} border px-2.5 py-0.5 font-medium`}
    >
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current"></span>
      {config.label}
    </Badge>
  );
}

export function DeleteClientButton({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteClientAction(clientId);

      if (result.success) {
        setOpen(false);
        router.refresh();
        // Show success message
        toast.success('Client deleted successfully!');
      } else {
        toast.error('Failed to delete client', {
          description: result.error,
        });
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 transition-colors hover:bg-red-500/10 hover:text-red-600"
          title="Delete Client"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <div className="rounded-full bg-red-500/10 p-2">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            Delete Client
          </AlertDialogTitle>
          <AlertDialogDescription className="pt-2">
            Are you sure you want to delete{' '}
            <span className="text-foreground font-semibold">
              "{clientName}"
            </span>{' '}
            (ID: {clientId})?
            <br />
            <br />
            This action cannot be undone. All client data, services, and
            invoices will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Client
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
