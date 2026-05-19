'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SortButton } from '@/components/ui/sort-button';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Key,
  Send,
  Package,
  Globe,
  FileText,
  Building2,
  Download,
  MoreVertical,
  RefreshCw,
  Pause,
  Play,
} from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  addClientAction,
  deleteClientAction,
  getClientDetailsAction,
  updateClientAction,
  resetClientPasswordAction,
  sendEmailToClientAction,
  getClientServicesAction,
  getClientDomainsAction,
  getClientInvoicesAction,
} from '@/actions/admin-client-actions';
import { useAdminTranslation } from '@/components/AdminTranslationProvider';

interface Client {
  id: string | number;
  firstname: string;
  lastname: string;
  email: string;
  companyname?: string;
  status: string;
  datecreated: string;
  lastlogin?: string;
  [key: string]: any;
}

interface ClientsTableProps {
  clients: Client[];
}

type SortField = 'id' | 'name' | 'email' | 'company' | 'datecreated' | 'status';
type SortDirection = 'asc' | 'desc';

export function ClientsTable({ clients: initialClients }: ClientsTableProps) {
  const { t } = useAdminTranslation();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] =
    useState(false);
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [clientServices, setClientServices] = useState<any[]>([]);
  const [clientDomains, setClientDomains] = useState<any[]>([]);
  const [clientInvoices, setClientInvoices] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const itemsPerPage = 10;

  // Filter clients
  const filteredClients = useMemo(() => {
    let filtered = [...clients];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          String(client.id).toLowerCase().includes(query) ||
          `${client.firstname} ${client.lastname}`
            .toLowerCase()
            .includes(query) ||
          client.email?.toLowerCase().includes(query) ||
          client.companyname?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (client) => client.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'id':
          aValue = Number(a.id);
          bValue = Number(b.id);
          break;
        case 'name':
          aValue = `${a.firstname} ${a.lastname}`.toLowerCase();
          bValue = `${b.firstname} ${b.lastname}`.toLowerCase();
          break;
        case 'email':
          aValue = a.email?.toLowerCase() || '';
          bValue = b.email?.toLowerCase() || '';
          break;
        case 'company':
          aValue = a.companyname?.toLowerCase() || '';
          bValue = b.companyname?.toLowerCase() || '';
          break;
        case 'datecreated':
          aValue = new Date(a.datecreated).getTime();
          bValue = new Date(b.datecreated).getTime();
          break;
        case 'status':
          aValue = a.status?.toLowerCase() || '';
          bValue = b.status?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [clients, searchQuery, statusFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(start, start + itemsPerPage);
  }, [filteredClients, currentPage, itemsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const handleViewClient = async (client: Client) => {
    setIsLoadingDetails(true);
    setIsDetailModalOpen(true);
    setSelectedClient(client);

    try {
      const [detailsResult, servicesResult, domainsResult, invoicesResult] =
        await Promise.allSettled([
          getClientDetailsAction(client.id),
          getClientServicesAction(client.id),
          getClientDomainsAction(client.id),
          getClientInvoicesAction(client.id),
        ]);

      if (detailsResult.status === 'fulfilled' && detailsResult.value.success) {
        setClientDetails(detailsResult.value.data);
      }

      if (
        servicesResult.status === 'fulfilled' &&
        servicesResult.value.success
      ) {
        setClientServices(servicesResult.value.data || []);
      }

      if (domainsResult.status === 'fulfilled' && domainsResult.value.success) {
        setClientDomains(domainsResult.value.data || []);
      }

      if (
        invoicesResult.status === 'fulfilled' &&
        invoicesResult.value.success
      ) {
        setClientInvoices(invoicesResult.value.data || []);
      }
    } catch (error: any) {
      toast.error(t('clients.toast.loadFailed'));
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsEditModalOpen(true);
  };

  const handleUpdateClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await updateClientAction(formData);

      if (result.success) {
        toast.success(t('clients.toast.updateSuccess'));
        setIsEditModalOpen(false);

        // Update local state immediately for real-time UI update
        const clientId = formData.get('clientid');
        setClients((prevClients) =>
          prevClients.map((client) => {
            if (client.id === clientId) {
              // Update client with new data from form
              return {
                ...client,
                firstname:
                  (formData.get('firstname') as string) || client.firstname,
                lastname:
                  (formData.get('lastname') as string) || client.lastname,
                email: (formData.get('email') as string) || client.email,
                companyname:
                  (formData.get('companyname') as string) || client.companyname,
                status: (formData.get('status') as string) || client.status,
              };
            }
            return client;
          })
        );

        // Also refresh server data in background for consistency
        handleRefresh();
      } else {
        toast.error(result.error || t('clients.toast.updateFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('clients.toast.updateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (clientId: string | number) => {
    try {
      const result = await deleteClientAction(String(clientId));
      if (result.success) {
        toast.success(t('clients.toast.deleteSuccess'));
        setIsDeleteDialogOpen(false);

        // Update local state immediately for real-time UI update
        setClients((prevClients) =>
          prevClients.filter((client) => client.id !== clientId)
        );

        // Also refresh server data in background for consistency
        handleRefresh();
      } else {
        toast.error(result.error || t('clients.toast.deleteFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('clients.toast.deleteFailed'));
    }
  };

  const handleResetPassword = async () => {
    if (!selectedClient) return;
    setIsSubmitting(true);

    try {
      const result = await resetClientPasswordAction(
        selectedClient.id,
        selectedClient.email
      );
      if (result.success) {
        toast.success(t('clients.toast.resetPasswordSuccess'));
        setIsResetPasswordDialogOpen(false);
      } else {
        toast.error(result.error || t('clients.toast.resetPasswordFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('clients.toast.resetPasswordFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !emailSubject || !emailMessage) {
      toast.error(t('clients.toast.fillRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await sendEmailToClientAction(
        selectedClient.id,
        emailSubject,
        emailMessage
      );

      if (result.success) {
        toast.success(t('clients.toast.sendEmailSuccess'));
        setIsSendEmailModalOpen(false);
        setEmailSubject('');
        setEmailMessage('');
      } else {
        toast.error(result.error || t('clients.toast.sendEmailFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('clients.toast.sendEmailFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Use Next.js router to refresh server data (invalidates cache)
    router.refresh();
    // Also update local state after a short delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Auto-refresh functionality (industry standard - 30 seconds)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, 30000); // Refresh every 30 seconds when auto-refresh is enabled

    return () => clearInterval(interval);
  }, [autoRefresh, router]);

  const handleExportClients = () => {
    // Create CSV content
    const headers = [
      'ID',
      'Name',
      'Email',
      'Company',
      'Status',
      'Registration Date',
    ];
    const rows = filteredClients.map((client) => [
      client.id,
      `${client.firstname} ${client.lastname}`,
      client.email,
      client.companyname || '',
      client.status,
      client.datecreated,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(t('clients.toast.exportSuccess'));
  };


  // Get unique statuses for filter
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(clients.map((c) => c.status).filter(Boolean));
    return Array.from(statuses);
  }, [clients]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">
                {t('clients.table.title')}
              </CardTitle>
              <CardDescription className="mt-1">
                {t('clients.table.description')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title={t('clients.table.refreshTooltip')}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                {isRefreshing
                  ? t('clients.table.refreshing')
                  : t('clients.table.refresh')}
              </Button>
              <Button
                variant={autoRefresh ? 'default' : 'outline'}
                onClick={() => setAutoRefresh(!autoRefresh)}
                title={
                  autoRefresh
                    ? t('clients.table.disableAutoRefresh')
                    : t('clients.table.enableAutoRefresh')
                }
              >
                {autoRefresh ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    {t('clients.table.autoRefreshOn')}
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    {t('clients.table.autoRefreshOff')}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleExportClients}>
                <Download className="mr-2 h-4 w-4" />
                {t('clients.table.export')}
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col gap-3 pt-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder={t('clients.table.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t('clients.table.allStatuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('clients.table.allStatuses')}
                </SelectItem>
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status.toLowerCase()}>
                    {t(`clients.status.${status.toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedClients.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <div className="bg-primary/10 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full">
                <Users className="text-primary h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                {clients.length === 0
                  ? t('clients.table.noClientsYet')
                  : t('clients.table.noClientsFound')}
              </h3>
              <p className="text-muted-foreground mx-auto mb-6 max-w-sm">
                {clients.length === 0
                  ? t('clients.table.noClientsRegistered')
                  : t('clients.table.adjustFilters')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">
                      <SortButton<SortField>
                        field="id"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        {t('clients.table.id')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField>
                        field="name"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        {t('clients.table.name')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField>
                        field="email"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        {t('clients.table.email')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField>
                        field="company"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        {t('clients.table.company')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField>
                        field="datecreated"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        {t('clients.table.created')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField>
                        field="status"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        {t('clients.table.status')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      {t('clients.table.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.map((client: Client) => (
                    <TableRow
                      key={client.id}
                      className="group hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="py-4">
                        <div className="text-foreground font-semibold">
                          #{client.id}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-foreground group-hover:text-primary font-semibold transition-colors">
                              {client.firstname} {client.lastname}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="text-muted-foreground h-4 w-4" />
                          <span className="font-medium">{client.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-muted-foreground text-sm">
                          {client.companyname || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="text-muted-foreground h-4 w-4" />
                          <span className="font-medium">
                            {client.datecreated}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <ClientStatusBadge status={client.status} />
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewClient(client)}
                            className="hover:bg-primary/10 hover:text-primary h-8 px-2 transition-colors"
                            title={t('clients.table.viewClient')}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditClient(client)}
                            className="h-8 px-2 transition-colors hover:bg-blue-500/10 hover:text-blue-600"
                            title={t('clients.table.editClient')}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>
                                {t('clients.table.actions')}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedClient(client);
                                  setIsResetPasswordDialogOpen(true);
                                }}
                              >
                                <Key className="mr-2 h-4 w-4" />
                                {t('clients.table.resetPassword')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedClient(client);
                                  setIsSendEmailModalOpen(true);
                                }}
                              >
                                <Send className="mr-2 h-4 w-4" />
                                {t('clients.table.sendEmail')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedClient(client);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('clients.table.deleteClient')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-6 py-4">
            <div className="text-muted-foreground text-sm">
              {t('clients.table.showingResults', {
                start: String((currentPage - 1) * itemsPerPage + 1),
                end: String(
                  Math.min(currentPage * itemsPerPage, filteredClients.length)
                ),
                total: String(filteredClients.length),
              })}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-muted-foreground text-sm">
                {t('clients.table.page')} {currentPage} {t('clients.table.of')}{' '}
                {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Client Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex min-w-0 items-center gap-2">
              <Users className="h-5 w-5 shrink-0" />
              <span className="min-w-0 break-words">
                {t('clients.modal.clientId', {
                  id: String(selectedClient?.id || ''),
                  name: `${selectedClient?.firstname || ''} ${selectedClient?.lastname || ''}`,
                })}
              </span>
            </DialogTitle>
            <DialogDescription>{selectedClient?.email}</DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">
                  {t('clients.modal.details')}
                </TabsTrigger>
                <TabsTrigger value="services">
                  {t('clients.modal.services')} ({clientServices.length})
                </TabsTrigger>
                <TabsTrigger value="domains">
                  {t('clients.modal.domains')} ({clientDomains.length})
                </TabsTrigger>
                <TabsTrigger value="invoices">
                  {t('clients.modal.invoices')} ({clientInvoices.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4 space-y-4">
                {clientDetails && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-xs">
                          {t('clients.form.firstName')}
                        </Label>
                        <p className="text-sm font-medium">
                          {clientDetails.firstname}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">
                          {t('clients.form.lastName')}
                        </Label>
                        <p className="text-sm font-medium">
                          {clientDetails.lastname}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">
                          {t('clients.table.email')}
                        </Label>
                        <p className="text-sm font-medium">
                          {clientDetails.email}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">
                          {t('clients.table.company')}
                        </Label>
                        <p className="text-sm font-medium">
                          {clientDetails.companyname || '-'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">
                          {t('clients.table.status')}
                        </Label>
                        <div className="mt-1">
                          <ClientStatusBadge status={clientDetails.status} />
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">
                          {t('clients.form.registrationDate')}
                        </Label>
                        <p className="text-sm font-medium">
                          {clientDetails.datecreated}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="services" className="mt-4">
                <div className="space-y-2">
                  {clientServices.length > 0 ? (
                    clientServices.map((service: any) => (
                      <div key={service.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {service.productname || service.domain}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {service.domain}
                            </p>
                          </div>
                          <Badge variant="outline">{service.status}</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                      {t('clients.modal.noServicesFound')}
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="domains" className="mt-4">
                <div className="space-y-2">
                  {clientDomains.length > 0 ? (
                    clientDomains.map((domain: any) => (
                      <div key={domain.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{domain.domain}</p>
                            <p className="text-muted-foreground text-sm">
                              Expires: {domain.expirydate}
                            </p>
                          </div>
                          <Badge variant="outline">{domain.status}</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                      {t('clients.modal.noDomainsFound')}
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="invoices" className="mt-4">
                <div className="space-y-2">
                  {clientInvoices.length > 0 ? (
                    clientInvoices.map((invoice: any) => (
                      <div key={invoice.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              Invoice #{invoice.invoicenum || invoice.id}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {invoice.total} - {invoice.status}
                            </p>
                          </div>
                          <Badge variant="outline">{invoice.status}</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                      {t('clients.modal.noInvoicesFound')}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDetailModalOpen(false)}
              className="flex-1"
            >
              {t('clients.modal.close')}
            </Button>
            {selectedClient && (
              <Button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleEditClient(selectedClient);
                }}
                className="flex-1"
              >
                <Edit className="mr-2 h-4 w-4" />
                {t('clients.modal.editClient')}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Client Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('clients.modal.editClientTitle')}</DialogTitle>
            <DialogDescription>
              {t('clients.modal.updateClientFor', {
                id: String(selectedClient?.id || ''),
              })}
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <form onSubmit={handleUpdateClient} className="space-y-4">
              <input type="hidden" name="clientid" value={selectedClient.id} />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstname">
                    {t('clients.form.firstName')}
                  </Label>
                  <Input
                    id="edit-firstname"
                    name="firstname"
                    defaultValue={selectedClient.firstname}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastname">
                    {t('clients.form.lastName')}
                  </Label>
                  <Input
                    id="edit-lastname"
                    name="lastname"
                    defaultValue={selectedClient.lastname}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">{t('clients.table.email')}</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  defaultValue={selectedClient.email}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-companyname">
                  {t('clients.table.company')}
                </Label>
                <Input
                  id="edit-companyname"
                  name="companyname"
                  defaultValue={selectedClient.companyname || ''}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">{t('clients.table.status')}</Label>
                <Select name="status" defaultValue={selectedClient.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">
                      {t('clients.status.active')}
                    </SelectItem>
                    <SelectItem value="Inactive">
                      {t('clients.status.inactive')}
                    </SelectItem>
                    <SelectItem value="Closed">
                      {t('clients.status.closed')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {t('clients.modal.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('clients.modal.updating')}
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      {t('clients.modal.updateClient')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('clients.modal.deleteClient')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('clients.modal.deleteConfirm', {
                name: `${selectedClient?.firstname || ''} ${selectedClient?.lastname || ''}`,
                id: String(selectedClient?.id || ''),
              })}
              <br />
              <br />
              {t('clients.modal.deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('clients.modal.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                selectedClient && handleDeleteClient(selectedClient.id)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('clients.modal.deleteButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <AlertDialog
        open={isResetPasswordDialogOpen}
        onOpenChange={setIsResetPasswordDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('clients.modal.resetPasswordTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('clients.modal.resetPasswordConfirm', {
                email: selectedClient?.email || '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('clients.modal.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleResetPassword();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('clients.modal.sending')}
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  {t('clients.modal.sendResetEmail')}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Email Modal */}
      <Dialog
        open={isSendEmailModalOpen}
        onOpenChange={setIsSendEmailModalOpen}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('clients.modal.sendEmailTitle')}</DialogTitle>
            <DialogDescription>
              {t('clients.modal.sendEmailTo', {
                email: selectedClient?.email || '',
              })}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-subject">{t('clients.form.subject')}</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder={t('clients.email.subjectPlaceholder')}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-message">{t('clients.form.message')}</Label>
              <RichTextEditor
                content={emailMessage}
                onChange={setEmailMessage}
                placeholder={t('clients.email.messagePlaceholder')}
                minHeight="250px"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsSendEmailModalOpen(false);
                  setEmailSubject('');
                  setEmailMessage('');
                }}
                className="flex-1"
                disabled={isSubmitting}
              >
                {t('clients.modal.cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || !emailSubject || !emailMessage}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('clients.modal.sending')}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t('clients.modal.sendEmailButton')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Client Status Badge Component
function ClientStatusBadge({ status }: { status: string }) {
  const { t } = useAdminTranslation();
  const statusLower = status?.toLowerCase() || 'unknown';

  const statusConfig: Record<string, { bg: string; text: string }> = {
    active: {
      bg: 'bg-green-500/10 border-green-500/20',
      text: 'text-green-700 dark:text-green-400',
    },
    inactive: {
      bg: 'bg-gray-500/10 border-gray-500/20',
      text: 'text-gray-700 dark:text-gray-400',
    },
    closed: {
      bg: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-700 dark:text-red-400',
    },
  };

  const config = statusConfig[statusLower] || statusConfig.inactive;
  const label = t(`clients.status.${statusLower}`);

  return (
    <Badge
      variant="outline"
      className={`${config.bg} ${config.text} border px-2.5 py-0.5 font-medium`}
    >
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current"></span>
      {label}
    </Badge>
  );
}
