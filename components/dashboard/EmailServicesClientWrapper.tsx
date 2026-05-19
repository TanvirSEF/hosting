'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import { Mail, Plus, Trash2, Key, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    getServiceEmailAccountsAction,
    createEmailAccountAction,
    deleteEmailAccountAction,
    updateEmailPasswordAction,
} from '@/actions/email-service-actions';

interface EmailAccount {
    _id: string;
    emailAddress: string;
    emailUsername: string;
    domain: string;
    quota: number;
    status: 'Active' | 'Suspended' | 'Terminated';
    createdAt: string;
}

interface EmailServicesClientWrapperProps {
    serviceId: number;
    domain: string;
}

export default function EmailServicesClientWrapper({
    serviceId,
    domain,
}: EmailServicesClientWrapperProps) {
    const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

    // Create email form
    const [emailUsername, setEmailUsername] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [quota, setQuota] = useState('1024');
    const [creating, setCreating] = useState(false);

    // Password update form
    const [newPassword, setNewPassword] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        loadEmailAccounts();
    }, [serviceId]);

    const loadEmailAccounts = async () => {
        setLoading(true);
        const result = await getServiceEmailAccountsAction(serviceId);
        if (result.success && result.data) {
            setEmailAccounts(result.data as unknown as EmailAccount[]);
        } else {
            toast.error(result.error || 'Failed to load email accounts');
        }
        setLoading(false);
    };

    const handleCreateEmail = async () => {
        if (!emailUsername || !password) {
            toast.error('Email username and password are required');
            return;
        }

        setCreating(true);
        const result = await createEmailAccountAction(
            serviceId,
            domain,
            emailUsername,
            password,
            firstName || 'User',
            parseInt(quota) || 1024
        );

        if (result.success) {
            toast.success(result.message || 'Email account created successfully');
            setCreateDialogOpen(false);
            setEmailUsername('');
            setPassword('');
            setFirstName('');
            setQuota('1024');
            loadEmailAccounts();
        } else {
            toast.error(result.error || 'Failed to create email account');
        }
        setCreating(false);
    };

    const handleDeleteEmail = async (accountId: string) => {
        const result = await deleteEmailAccountAction(accountId);
        if (result.success) {
            toast.success(result.message || 'Email account deleted');
            loadEmailAccounts();
        } else {
            toast.error(result.error || 'Failed to delete email account');
        }
    };

    const handleUpdatePassword = async () => {
        if (!selectedAccountId || !newPassword) {
            toast.error('New password is required');
            return;
        }

        setUpdating(true);
        const result = await updateEmailPasswordAction(selectedAccountId, newPassword);

        if (result.success) {
            toast.success(result.message || 'Password updated successfully');
            setPasswordDialogOpen(false);
            setNewPassword('');
            setSelectedAccountId(null);
        } else {
            toast.error(result.error || 'Failed to update password');
        }
        setUpdating(false);
    };

    const openPasswordDialog = (accountId: string) => {
        setSelectedAccountId(accountId);
        setPasswordDialogOpen(true);
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                Email Accounts
                            </CardTitle>
                            <CardDescription>
                                Manage email accounts for {domain}
                            </CardDescription>
                        </div>
                        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Email
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create Email Account</DialogTitle>
                                    <DialogDescription>
                                        Create a new email account for {domain}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="emailUsername">Email Username</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="emailUsername"
                                                placeholder="info"
                                                value={emailUsername}
                                                onChange={(e) => setEmailUsername(e.target.value)}
                                            />
                                            <span className="text-sm text-muted-foreground">@{domain}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name (Optional)</Label>
                                        <Input
                                            id="firstName"
                                            placeholder="John"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="quota">Storage Quota (MB)</Label>
                                        <Input
                                            id="quota"
                                            type="number"
                                            placeholder="1024"
                                            value={quota}
                                            onChange={(e) => setQuota(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setCreateDialogOpen(false)}
                                        disabled={creating}
                                    >
                                        Cancel
                                    </Button>
                                    <Button onClick={handleCreateEmail} disabled={creating}>
                                        {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {emailAccounts.length === 0 ? (
                        <div className="text-center py-12">
                            <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <h3 className="mt-4 text-lg font-semibold">No email accounts</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                Create your first email account to get started
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {emailAccounts.map((account) => (
                                <div
                                    key={account._id}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        <Mail className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{account.emailAddress}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Quota: {account.quota} MB
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={
                                                account.status === 'Active'
                                                    ? 'default'
                                                    : account.status === 'Suspended'
                                                        ? 'secondary'
                                                        : 'destructive'
                                            }
                                        >
                                            {account.status}
                                        </Badge>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openPasswordDialog(account._id)}
                                        >
                                            <Key className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Email Account</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to delete {account.emailAddress}? This
                                                        action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDeleteEmail(account._id)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Password Update Dialog */}
            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Password</DialogTitle>
                        <DialogDescription>
                            Enter a new password for this email account
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setPasswordDialogOpen(false);
                                setNewPassword('');
                                setSelectedAccountId(null);
                            }}
                            disabled={updating}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleUpdatePassword} disabled={updating}>
                            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
