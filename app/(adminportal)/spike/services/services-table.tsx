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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Server,
  Eye,
  Package,
  Calendar,
  Activity,
  DollarSign,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Edit,
  Loader2,
  Download,
  MoreVertical,
  Ban,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Globe,
  CreditCard,
  FileText,
  Settings,
  RefreshCw,
  Pause,
  Play,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  getServiceDetailsAction,
  updateServiceAction,
  suspendServiceAction,
  unsuspendServiceAction,
  terminateServiceAction,
  getAllClientsAction,
  getClientNameAction,
} from '@/actions/admin-service-actions';
import { useAdminTranslation } from '@/components/AdminTranslationProvider';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Service {
  id: string | number;
  name: string;
  domain?: string;
  clientid: string | number;
  status: string;
  recurringamount: string | number;
  currencycode?: string;
  billingcycle?: string;
  nextduedate: string;
  [key: string]: any;
}

interface ServicesTableProps {
  services: Service[];
}

type SortField = 'id' | 'name' | 'client' | 'price' | 'nextduedate' | 'status';
type SortDirection = 'asc' | 'desc';

export function ServicesTable({
  services: initialServices,
}: ServicesTableProps) {
  const { t } = useAdminTranslation();
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>(initialServices);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [billingCycleFilter, setBillingCycleFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientNames, setClientNames] = useState<
    Record<string | number, string>
  >({});
  const [allClients, setAllClients] = useState<any[]>([]);
  const [suspendReason, setSuspendReason] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const itemsPerPage = 10;

  // Fetch client names and clients list
  useEffect(() => {
    async function fetchClientData() {
      // Get all clients for filter
      const clientsResult = await getAllClientsAction();
      if (clientsResult.success) {
        setAllClients(clientsResult.data || []);
      }

      // Get client names for services
      const uniqueClientIds = [...new Set(services.map((s) => s.clientid))];
      const namePromises = uniqueClientIds.map(async (clientId) => {
        const result = await getClientNameAction(clientId);
        if (result.success && result.name) {
          return { clientId, name: result.name };
        }
        return { clientId, name: `Client #${clientId}` };
      });

      const names = await Promise.all(namePromises);
      const nameMap: Record<string | number, string> = {};
      names.forEach(({ clientId, name }) => {
        nameMap[clientId] = name || `Client #${clientId}`;
      });
      setClientNames(nameMap);
    }

    fetchClientData();
  }, [services]);

  // Filter services
  const filteredServices = useMemo(() => {
    let filtered = [...services];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          String(service.id).toLowerCase().includes(query) ||
          service.name?.toLowerCase().includes(query) ||
          service.domain?.toLowerCase().includes(query) ||
          clientNames[service.clientid]?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (service) =>
          service.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Client filter
    if (clientFilter !== 'all') {
      filtered = filtered.filter(
        (service) => String(service.clientid) === clientFilter
      );
    }

    // Billing cycle filter
    if (billingCycleFilter !== 'all') {
      filtered = filtered.filter(
        (service) =>
          service.billingcycle?.toLowerCase() ===
          billingCycleFilter.toLowerCase()
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
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'client':
          aValue = clientNames[a.clientid] || String(a.clientid);
          bValue = clientNames[b.clientid] || String(b.clientid);
          break;
        case 'price':
          aValue = parseFloat(String(a.recurringamount || 0));
          bValue = parseFloat(String(b.recurringamount || 0));
          break;
        case 'nextduedate':
          aValue = new Date(a.nextduedate).getTime();
          bValue = new Date(b.nextduedate).getTime();
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
  }, [
    services,
    searchQuery,
    statusFilter,
    clientFilter,
    billingCycleFilter,
    sortField,
    sortDirection,
    clientNames,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredServices.slice(start, start + itemsPerPage);
  }, [filteredServices, currentPage, itemsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleViewService = async (service: Service) => {
    setIsLoadingDetails(true);
    setIsDetailModalOpen(true);
    setSelectedService(service);

    try {
      const result = await getServiceDetailsAction(service.id);
      if (result.success) {
        setSelectedService(result.data);
      } else {
        toast.error(result.error || t('services.toast.loadFailed'));
        setIsDetailModalOpen(false);
      }
    } catch (error: any) {
      toast.error(error.message || t('services.toast.loadFailed'));
      setIsDetailModalOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsEditModalOpen(true);
  };

  const handleUpdateService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await updateServiceAction(formData);

      if (result.success) {
        toast.success(t('services.toast.updateSuccess'));
        setIsEditModalOpen(false);
        // Refresh data immediately after update (industry standard)
        handleRefresh();
      } else {
        toast.error(result.error || t('services.toast.updateFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('services.toast.updateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuspend = async () => {
    if (!selectedService) return;

    try {
      const result = await suspendServiceAction(
        selectedService.id,
        suspendReason
      );
      if (result.success) {
        toast.success(t('services.toast.suspendSuccess'));
        setIsSuspendDialogOpen(false);
        setSuspendReason('');
        // Refresh data immediately after suspend (industry standard)
        handleRefresh();
      } else {
        toast.error(result.error || t('services.toast.suspendFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('services.toast.suspendFailed'));
    }
  };

  const handleUnsuspend = async (serviceId: string | number) => {
    try {
      const result = await unsuspendServiceAction(serviceId);
      if (result.success) {
        toast.success(t('services.toast.unsuspendSuccess'));
        // Refresh data immediately after unsuspend (industry standard)
        handleRefresh();
      } else {
        toast.error(result.error || t('services.toast.unsuspendFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('services.toast.unsuspendFailed'));
    }
  };

  const handleTerminate = async () => {
    if (!selectedService) return;

    try {
      const result = await terminateServiceAction(selectedService.id, false);
      if (result.success) {
        toast.success(t('services.toast.terminateSuccess'));
        setIsTerminateDialogOpen(false);
        // Refresh data immediately after terminate (industry standard)
        handleRefresh();
      } else {
        toast.error(result.error || t('services.toast.terminateFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('services.toast.terminateFailed'));
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

  const handleExportServices = () => {
    // Create CSV content
    const headers = [
      'ID',
      'Service Name',
      'Domain',
      'Client',
      'Status',
      'Amount',
      'Billing Cycle',
      'Next Due Date',
    ];
    const rows = filteredServices.map((service) => [
      service.id,
      service.name,
      service.domain || '',
      clientNames[service.clientid] || `Client #${service.clientid}`,
      service.status,
      service.recurringamount,
      service.billingcycle || '',
      service.nextduedate,
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
    a.download = `services-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(t('services.toast.exportSuccess'));
  };


  // Get unique values for filters
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(services.map((s) => s.status).filter(Boolean));
    return Array.from(statuses);
  }, [services]);

  const uniqueBillingCycles = useMemo(() => {
    const cycles = new Set(
      services.map((s) => s.billingcycle).filter((c): c is string => Boolean(c))
    );
    return Array.from(cycles);
  }, [services]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">
                {t('services.table.title')}
              </CardTitle>
              <CardDescription className="mt-1">
                {t('services.table.description')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title={t('services.table.refreshTooltip')}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                {isRefreshing
                  ? t('services.table.refreshing')
                  : t('services.table.refresh')}
              </Button>
              <Button
                variant={autoRefresh ? 'default' : 'outline'}
                onClick={() => setAutoRefresh(!autoRefresh)}
                title={
                  autoRefresh
                    ? t('services.table.disableAutoRefresh')
                    : t('services.table.enableAutoRefresh')
                }
              >
                {autoRefresh ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    {t('services.table.autoRefreshOn')}
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    {t('services.table.autoRefreshOff')}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleExportServices}>
                <Download className="mr-2 h-4 w-4" />
                {t('services.table.export')}
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col gap-3 pt-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder={t('services.table.searchPlaceholder')}
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
                <SelectValue placeholder={t('services.table.allStatuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('services.table.allStatuses')}
                </SelectItem>
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status.toLowerCase()}>
                    {t(`services.status.${status.toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={clientFilter}
              onValueChange={(value) => {
                setClientFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t('services.table.allClients')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('services.table.allClients')}
                </SelectItem>
                {allClients.map((client) => (
                  <SelectItem key={client.id} value={String(client.id)}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={billingCycleFilter}
              onValueChange={(value) => {
                setBillingCycleFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue
                  placeholder={t('services.table.allBillingCycles')}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('services.table.allBillingCycles')}
                </SelectItem>
                {uniqueBillingCycles.map((cycle) => (
                  <SelectItem key={cycle} value={cycle.toLowerCase()}>
                    {t(
                      `services.modal.${cycle.toLowerCase().replace(/\s+/g, '').replace(/-/g, '')}`
                    ) || cycle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedServices.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <div className="bg-primary/10 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full">
                <Server className="text-primary h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                {services.length === 0
                  ? t('services.table.noServicesYet')
                  : t('services.table.noServicesFound')}
              </h3>
              <p className="text-muted-foreground mx-auto mb-6 max-w-sm">
                {services.length === 0
                  ? t('services.table.noServicesCreated')
                  : t('services.table.adjustFilters')}
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
                        {t('services.table.id')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField>
                        field="name"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        {t('services.table.product')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField>
                        field="client"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        {t('services.table.client')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField>
                        field="price"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        {t('services.table.amount')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField>
                        field="nextduedate"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        {t('services.table.nextDue')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField>
                        field="status"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        {t('services.table.status')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      {t('services.table.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedServices.map((service: Service) => {
                    const isSuspended =
                      service.status?.toLowerCase() === 'suspended';
                    const isTerminated =
                      service.status?.toLowerCase() === 'terminated';

                    return (
                      <TableRow
                        key={service.id}
                        className="group hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="py-4">
                          <div className="text-foreground font-semibold">
                            #{service.id}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-start gap-3">
                            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                              <Server className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-foreground group-hover:text-primary font-semibold transition-colors">
                                {service.name}
                              </div>
                              <div className="text-muted-foreground mt-0.5 text-sm">
                                {service.domain || t('services.table.noDomain')}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <User className="text-muted-foreground h-4 w-4" />
                            <div>
                              <div className="text-sm font-medium">
                                {clientNames[service.clientid] ||
                                  `Client #${service.clientid}`}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                ID: {service.clientid}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-baseline gap-1">
                            <span className="text-foreground text-lg font-bold">
                              {formatPrice(
                                parseFloat(String(service.recurringamount))
                              )}
                            </span>
                          </div>
                          <div className="text-muted-foreground mt-0.5 text-xs capitalize">
                            {service.billingcycle
                              ?.replace(/([A-Z])/g, ' $1')
                              .trim() || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="text-muted-foreground h-4 w-4" />
                            <span className="font-medium">
                              {service.nextduedate}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <ServiceStatusBadge status={service.status} />
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewService(service)}
                              className="hover:bg-primary/10 hover:text-primary h-8 px-2 transition-colors"
                              title={t('services.table.viewService')}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditService(service)}
                              className="h-8 px-2 transition-colors hover:bg-blue-500/10 hover:text-blue-600"
                              title={t('services.table.editService')}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            {(String(service.gid) === (process.env.NEXT_PUBLIC_EMAIL_SERVICE_GID || '5') || service.groupname === 'Email Service') && (
                              <Link href={`/spike/services/${service.id}/email`}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-2 transition-colors hover:bg-orange-500/10 hover:text-orange-600"
                                  title="Manage Email"
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            )}
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
                                  {t('services.table.actionsLabel')}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {isSuspended ? (
                                  <DropdownMenuItem
                                    onClick={() => handleUnsuspend(service.id)}
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    {t('services.table.unsuspend')}
                                  </DropdownMenuItem>
                                ) : !isTerminated ? (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedService(service);
                                      setIsSuspendDialogOpen(true);
                                    }}
                                  >
                                    <Ban className="mr-2 h-4 w-4" />
                                    {t('services.table.suspend')}
                                  </DropdownMenuItem>
                                ) : null}
                                {!isTerminated && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedService(service);
                                        setIsTerminateDialogOpen(true);
                                      }}
                                      className="text-red-600"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      {t('services.table.terminate')}
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-6 py-4">
            <div className="text-muted-foreground text-sm">
              {t('services.table.showingResults', {
                start: String((currentPage - 1) * itemsPerPage + 1),
                end: String(
                  Math.min(currentPage * itemsPerPage, filteredServices.length)
                ),
                total: String(filteredServices.length),
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
                {t('services.table.page')} {currentPage}{' '}
                {t('services.table.of')} {totalPages}
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

      {/* Service Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex min-w-0 items-center gap-2">
              <Server className="h-5 w-5 shrink-0" />
              <span className="min-w-0 break-words">
                {t('services.modal.serviceId', {
                  id: selectedService?.id,
                  name: selectedService?.name,
                })}
              </span>
            </DialogTitle>
            <DialogDescription>
              {selectedService?.domain || t('services.modal.noDomainAssigned')}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : selectedService ? (
            <div className="space-y-6">
              {/* Service Info */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <Label className="text-muted-foreground text-xs">
                    {t('services.modal.status')}
                  </Label>
                  <div className="mt-1">
                    <ServiceStatusBadge status={selectedService.status} />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">
                    {t('services.modal.billingCycle')}
                  </Label>
                  <div className="mt-1 text-sm font-medium">
                    {selectedService.billingcycle || '-'}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">
                    {t('services.modal.nextDueDate')}
                  </Label>
                  <div className="mt-1 text-sm font-medium">
                    {selectedService.nextduedate}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">
                    {t('services.modal.amount')}
                  </Label>
                  <div className="mt-1 text-sm font-medium">
                    {selectedService.recurringamount}{' '}
                    {selectedService.currencycode || 'USD'}
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div className="space-y-3">
                <h3 className="text-foreground border-b pb-2 text-sm font-semibold">
                  {t('services.modal.clientInformation')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      {t('services.modal.client')}
                    </Label>
                    <div className="mt-1 text-sm font-medium">
                      {clientNames[selectedService.clientid] ||
                        `Client #${selectedService.clientid}`}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      {t('services.modal.clientId')}
                    </Label>
                    <div className="mt-1 text-sm font-medium">
                      #{selectedService.clientid}
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="space-y-3">
                <h3 className="text-foreground border-b pb-2 text-sm font-semibold">
                  {t('services.modal.serviceDetailsTitle')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      {t('services.modal.domain')}
                    </Label>
                    <div className="mt-1 text-sm font-medium">
                      {selectedService.domain || t('services.table.noDomain')}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      {t('services.modal.username')}
                    </Label>
                    <div className="mt-1 text-sm font-medium">
                      {selectedService.username || '-'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      {t('services.modal.registrationDate')}
                    </Label>
                    <div className="mt-1 text-sm font-medium">
                      {selectedService.regdate || '-'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      {t('services.modal.paymentMethod')}
                    </Label>
                    <div className="mt-1 text-sm font-medium">
                      {selectedService.paymentmethod || '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedService.notes && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">
                    {t('services.modal.adminNotes')}
                  </Label>
                  <div className="bg-muted rounded-md p-3 text-sm">
                    {selectedService.notes}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className="flex gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDetailModalOpen(false)}
              className="flex-1"
            >
              {t('services.modal.close')}
            </Button>
            {selectedService && (
              <Button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleEditService(selectedService);
                }}
                className="flex-1"
              >
                <Edit className="mr-2 h-4 w-4" />
                {t('services.modal.editService')}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Service Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('services.modal.editServiceTitle')}</DialogTitle>
            <DialogDescription>
              {t('services.modal.updateServiceFor', {
                id: selectedService?.id,
              })}
            </DialogDescription>
          </DialogHeader>

          {selectedService && (
            <form onSubmit={handleUpdateService} className="space-y-4">
              <input
                type="hidden"
                name="serviceid"
                value={selectedService.id}
              />

              <div className="space-y-2">
                <Label htmlFor="edit-domain">
                  {t('services.modal.domain')}
                </Label>
                <Input
                  id="edit-domain"
                  name="domain"
                  defaultValue={selectedService.domain || ''}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-username">
                    {t('services.modal.username')}
                  </Label>
                  <Input
                    id="edit-username"
                    name="username"
                    defaultValue={selectedService.username || ''}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-password">
                    {t('services.modal.password')}
                  </Label>
                  <Input
                    id="edit-password"
                    name="password"
                    type="password"
                    placeholder={t('services.modal.leaveBlank')}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-billingcycle">
                  {t('services.modal.billingCycle')}
                </Label>
                <Select
                  name="billingcycle"
                  defaultValue={selectedService.billingcycle}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="One Time">
                      {t('services.modal.oneTime')}
                    </SelectItem>
                    <SelectItem value="Monthly">
                      {t('services.modal.monthly')}
                    </SelectItem>
                    <SelectItem value="Quarterly">
                      {t('services.modal.quarterly')}
                    </SelectItem>
                    <SelectItem value="Semi-Annually">
                      {t('services.modal.semiAnnually')}
                    </SelectItem>
                    <SelectItem value="Annually">
                      {t('services.modal.annually')}
                    </SelectItem>
                    <SelectItem value="Biennially">
                      {t('services.modal.biennially')}
                    </SelectItem>
                    <SelectItem value="Triennially">
                      {t('services.modal.triennially')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-nextduedate">
                  {t('services.modal.nextDueDate')}
                </Label>
                <Input
                  id="edit-nextduedate"
                  name="nextduedate"
                  type="date"
                  defaultValue={
                    selectedService.nextduedate?.split(' ')[0] || ''
                  }
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">
                  {t('services.modal.status')}
                </Label>
                <Select name="status" defaultValue={selectedService.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">
                      {t('services.status.active')}
                    </SelectItem>
                    <SelectItem value="Pending">
                      {t('services.status.pending')}
                    </SelectItem>
                    <SelectItem value="Suspended">
                      {t('services.status.suspended')}
                    </SelectItem>
                    <SelectItem value="Terminated">
                      {t('services.status.terminated')}
                    </SelectItem>
                    <SelectItem value="Cancelled">
                      {t('services.status.cancelled')}
                    </SelectItem>
                    <SelectItem value="Fraud">
                      {t('services.status.fraud')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">
                  {t('services.modal.adminNotes')}
                </Label>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  defaultValue={selectedService.notes || ''}
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {t('services.modal.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('services.modal.updating')}
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      {t('services.modal.updateService')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Suspend Confirmation Dialog */}
      <AlertDialog
        open={isSuspendDialogOpen}
        onOpenChange={setIsSuspendDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('services.modal.suspendService')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('services.modal.suspendConfirm', { id: selectedService?.id })}
              <div className="mt-4 space-y-2">
                <Label htmlFor="suspend-reason">
                  {t('services.modal.reasonOptional')}
                </Label>
                <Textarea
                  id="suspend-reason"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder={t('services.modal.enterReason')}
                  rows={3}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSuspendReason('')}>
              {t('services.modal.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspend}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Ban className="mr-2 h-4 w-4" />
              {t('services.modal.suspendServiceButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Terminate Confirmation Dialog */}
      <AlertDialog
        open={isTerminateDialogOpen}
        onOpenChange={setIsTerminateDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('services.modal.terminateService')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('services.modal.terminateConfirm', {
                id: selectedService?.id,
              })}
              <br />
              <br />
              {t('services.modal.terminateWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('services.modal.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTerminate}
              className="bg-red-600 hover:bg-red-700"
            >
              <XCircle className="mr-2 h-4 w-4" />
              {t('services.modal.terminateServiceButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Service Status Badge Component
function ServiceStatusBadge({ status }: { status: string }) {
  const { t } = useAdminTranslation();
  const statusLower = status?.toLowerCase() || 'unknown';

  const statusConfig: Record<string, { bg: string; text: string; icon?: any }> =
  {
    active: {
      bg: 'bg-green-500/10 border-green-500/20',
      text: 'text-green-700 dark:text-green-400',
      icon: CheckCircle2,
    },
    pending: {
      bg: 'bg-yellow-500/10 border-yellow-500/20',
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: Clock,
    },
    suspended: {
      bg: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-700 dark:text-red-400',
      icon: Ban,
    },
    terminated: {
      bg: 'bg-gray-500/10 border-gray-500/20',
      text: 'text-gray-700 dark:text-gray-400',
      icon: XCircle,
    },
    cancelled: {
      bg: 'bg-gray-500/10 border-gray-500/20',
      text: 'text-gray-700 dark:text-gray-400',
      icon: XCircle,
    },
    fraud: {
      bg: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-700 dark:text-red-400',
      icon: AlertTriangle,
    },
  };

  const config = statusConfig[statusLower] || statusConfig.pending;
  const Icon = config.icon;
  const label = t(`services.status.${statusLower}`);

  return (
    <Badge
      variant="outline"
      className={`${config.bg} ${config.text} flex w-fit items-center gap-1 border px-2.5 py-0.5 font-medium`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </Badge>
  );
}
