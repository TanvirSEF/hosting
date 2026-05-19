'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Search,
  Plus,
  Trash2,
  Key,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Loader2,
  Database,
  Ban,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDashboardTranslation } from '@/components/DashboardTranslationProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createEmailAccountAction, deleteEmailAccountAction, updateEmailPasswordAction } from '@/actions/email-service-actions';

interface EmailAccount {
  _id: string;
  whmcsServiceId: number;
  clientId: number;
  domain: string;
  emailAddress: string;
  emailUsername: string;
  quota: number;
  status: 'Active' | 'Suspended' | 'Terminated';
  createdAt: string;
  storageUsed?: number; // Optional as not always available
}

interface EmailAccountsTableProps {
  emailAccounts: EmailAccount[];
  domains: any[];
}

type SortField = 'emailAddress' | 'status' | 'createdAt' | 'quota';
type SortDirection = 'asc' | 'desc';

export function EmailAccountsTable({
  emailAccounts: initialAccounts,
  domains,
}: EmailAccountsTableProps) {
  const { t } = useDashboardTranslation();
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>(initialAccounts);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('emailAddress');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAccount, setSelectedAccount] = useState<EmailAccount | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Create Form
  const [createForm, setCreateForm] = useState({
    username: '',
    domainId: '', // Product ID (WHMCS Service ID)
    domainName: '',
    password: '',
    quota: '1024',
    firstName: '',
  });

  // Password Form
  const [newPassword, setNewPassword] = useState('');

  const itemsPerPage = 10;

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    let filtered = [...emailAccounts];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (account) =>
          account.emailAddress.toLowerCase().includes(query) ||
          account.domain.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (account) => account.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'emailAddress' || sortField === 'status' || sortField === 'createdAt') {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      } else {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [emailAccounts, searchQuery, statusFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAccounts = filteredAccounts.slice(startIndex, endIndex);

  // Status badge
  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";

    if (s === 'active') variant = "default";
    else if (s === 'suspended') variant = "secondary";
    else if (s === 'terminated') variant = "destructive";
    else variant = "outline";

    return (
      <Badge variant={variant}>{status}</Badge>
    );
  };

  const handleCreateAccount = async () => {
    if (!createForm.username || !createForm.domainId || !createForm.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Find domain name from ID
    const selectedDomain = domains.find(d => String(d.id) === createForm.domainId);
    if (!selectedDomain) {
      toast.error('Invalid domain selected');
      return;
    }

    setIsLoading(true);
    try {
      const result = await createEmailAccountAction(
        parseInt(createForm.domainId), // This should be serviceId
        selectedDomain.domain,
        createForm.username,
        createForm.password,
        createForm.firstName || 'User',
        parseInt(createForm.quota) || 1024
      );

      if (result.success) {
        toast.success(result.message || 'Email account created successfully');
        setIsCreateModalOpen(false);
        // Refresh entire page to update list (simplest for now, or update local state)
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to create email account');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;

    setIsLoading(true);
    try {
      const result = await deleteEmailAccountAction(selectedAccount._id);
      if (result.success) {
        toast.success(result.message || 'Email account deleted');
        setIsDeleteModalOpen(false);
        // Refresh local state without reload if possible, but reload is safer for sync
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to delete email account');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedAccount || !newPassword) return;

    setIsLoading(true);
    try {
      const result = await updateEmailPasswordAction(selectedAccount._id, newPassword);
      if (result.success) {
        toast.success(result.message || 'Password updated successfully');
        setIsPasswordModalOpen(false);
        setNewPassword('');
      } else {
        toast.error(result.error || 'Failed to update password');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const openWebmail = (email: string) => {
    // Generic webmail or specific if known. 
    // QBoxMail typically uses webmail.qboxmail.com
    window.open('https://webmail.qboxmail.com', '_blank');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('emails.table.title')}</CardTitle>
              <CardDescription>{t('emails.table.description')}</CardDescription>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-primary hover:bg-primary/90"
              disabled={domains.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('emails.table.createFirst')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                name="email-search"
                placeholder={t('emails.table.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
                autoComplete="nope"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('emails.table.allStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('emails.table.allStatus')}</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {paginatedAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t('emails.empty.title')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {domains.length === 0
                  ? "You don't have any active email services. Please purchase a plan first."
                  : t('emails.empty.description')}
              </p>
              {domains.length === 0 ? (
                <Link href="/dashboard/services/order">
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Order New Service
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('emails.empty.createFirst')}
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email Address</TableHead>
                    <TableHead>Service / Domain</TableHead>
                    <TableHead>Quota</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAccounts.map((account) => (
                    <TableRow key={account._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {account.emailAddress}
                        </div>
                      </TableCell>
                      <TableCell>{account.domain}</TableCell>
                      <TableCell>{account.quota} MB</TableCell>
                      <TableCell>{getStatusBadge(account.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => openWebmail(account.emailAddress)}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Webmail
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAccount(account);
                                setIsPasswordModalOpen(true);
                              }}
                            >
                              <Key className="mr-2 h-4 w-4" />
                              Change Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAccount(account);
                                setIsDeleteModalOpen(true);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Account Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Email Account</DialogTitle>
            <DialogDescription>
              Create a new email account under your existing services.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="domain">Select Domain/Service</Label>
              <Select
                value={createForm.domainId}
                onValueChange={(value) => {
                  const selected = domains.find(d => String(d.id) === value);
                  setCreateForm({
                    ...createForm,
                    domainId: value,
                    domainName: selected ? selected.domain : ''
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a domain" />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((domain) => (
                    <SelectItem key={domain.id} value={String(domain.id)}>
                      {domain.domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Email Username</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="username"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  placeholder="info"
                  className="flex-1"
                  autoComplete="nope"
                />
                <span className="text-muted-foreground">
                  @{createForm.domainName || 'domain.com'}
                </span>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quota">Quota (MB)</Label>
              <Input
                id="quota"
                type="number"
                value={createForm.quota}
                onChange={(e) => setCreateForm({ ...createForm, quota: e.target.value })}
                placeholder="1024"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name (Optional)</Label>
              <Input
                id="firstName"
                value={createForm.firstName}
                onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                placeholder="John"
                autoComplete="nope"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAccount} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the email account
              <span className="font-semibold"> {selectedAccount?.emailAddress} </span>
              and remove all data associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Password Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter a new password for <span className="font-semibold">{selectedAccount?.emailAddress}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
