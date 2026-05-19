'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Globe,
  Eye,
  Calendar,
  Activity,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Edit,
  Loader2,
  Download,
  MoreVertical,
  CheckCircle2,
  XCircle,
  User,
  RefreshCw,
  Lock,
  Unlock,
  Key,
  ArrowRightLeft,
  Send,
  Server,
  Copy,
  AlertTriangle,
  Clock,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getDomainDetailsAction,
  updateDomainAction,
  renewDomainAction,
  releaseDomainAction,
  transferDomainAction,
  getEppCodeAction,
  getDomainLockStatusAction,
  updateDomainLockStatusAction,
  updateNameserversAction,
  toggleAutoRenewAction,
  updateDNSManagementAction,
  getAllClientsAction,
  getClientNameAction,
} from '@/actions/admin-domain-actions';
import { useAdminTranslation } from '@/components/AdminTranslationProvider';

interface Domain {
  id: string | number;
  domainname: string;
  userid: string | number;
  status: string;
  registrationdate: string;
  nextduedate: string;
  expirydate?: string;
  registrar?: string;
  donotrenew?: string | number;
  dnsmanagement?: string | number;
  emailforwarding?: string | number;
  idprotection?: string | number;
  [key: string]: any;
}

interface DomainsTableProps {
  domains: Domain[];
}

type SortField =
  | 'id'
  | 'domain'
  | 'client'
  | 'registrationdate'
  | 'nextduedate'
  | 'status';
type SortDirection = 'asc' | 'desc';

export function DomainsTable({ domains: initialDomains }: DomainsTableProps) {
  const { t } = useAdminTranslation();
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>(initialDomains);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [registrarFilter, setRegistrarFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDomain, setSelectedDomain] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isNameserverModalOpen, setIsNameserverModalOpen] = useState(false);
  const [isEppCodeModalOpen, setIsEppCodeModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isUpdatingDNS, setIsUpdatingDNS] = useState(false);
  const [clientNames, setClientNames] = useState<
    Record<string | number, string>
  >({});
  const [allClients, setAllClients] = useState<any[]>([]);
  const [lockStatus, setLockStatus] = useState<boolean | null>(null);
  const [eppCode, setEppCode] = useState<string>('');
  const [regPeriod, setRegPeriod] = useState<string>('1');
  const [newTag, setNewTag] = useState('');
  const [transferEppCode, setTransferEppCode] = useState('');
  const [nameservers, setNameservers] = useState<string[]>(['', '', '', '']);
  const itemsPerPage = 10;

  // Update domains state when initialDomains prop changes (after refresh)
  useEffect(() => {
    setDomains(initialDomains);
  }, [initialDomains]);

  // Fetch client names and clients list
  useEffect(() => {
    async function fetchClientData() {
      // Get all clients for filter
      const clientsResult = await getAllClientsAction();
      if (clientsResult.success) {
        setAllClients(clientsResult.data || []);
      }

      // Get client names for domains
      const uniqueClientIds = [...new Set(domains.map((d) => d.userid))];
      const namePromises = uniqueClientIds.map(async (clientId) => {
        const result = await getClientNameAction(clientId);
        if (result.success) {
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
  }, [domains]);

  // Filter domains
  const filteredDomains = useMemo(() => {
    let filtered = [...domains];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (domain) =>
          String(domain.id).toLowerCase().includes(query) ||
          domain.domainname?.toLowerCase().includes(query) ||
          clientNames[domain.userid]?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (domain) => domain.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Client filter
    if (clientFilter !== 'all') {
      filtered = filtered.filter(
        (domain) => String(domain.userid) === clientFilter
      );
    }

    // Registrar filter
    if (registrarFilter !== 'all') {
      filtered = filtered.filter(
        (domain) =>
          (domain.registrar || '').toLowerCase() ===
          registrarFilter.toLowerCase()
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
        case 'domain':
          aValue = a.domainname?.toLowerCase() || '';
          bValue = b.domainname?.toLowerCase() || '';
          break;
        case 'client':
          aValue = clientNames[a.userid] || String(a.userid);
          bValue = clientNames[b.userid] || String(b.userid);
          break;
        case 'registrationdate':
          aValue = new Date(a.registrationdate).getTime();
          bValue = new Date(b.registrationdate).getTime();
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
    domains,
    searchQuery,
    statusFilter,
    clientFilter,
    registrarFilter,
    sortField,
    sortDirection,
    clientNames,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredDomains.length / itemsPerPage);
  const paginatedDomains = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDomains.slice(start, start + itemsPerPage);
  }, [filteredDomains, currentPage, itemsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleViewDomain = async (domain: Domain) => {
    setIsLoadingDetails(true);
    setIsDetailModalOpen(true);
    setSelectedDomain(domain);

    try {
      const result = await getDomainDetailsAction(domain.id);
      if (result.success) {
        setSelectedDomain(result.data);

        // Get lock status
        const lockResult = await getDomainLockStatusAction(domain.id);
        if (lockResult.success) {
          setLockStatus(
            lockResult.lockstatus === 'locked' || lockResult.lockstatus === true
          );
        }
      } else {
        toast.error(result.error || t('domains.toast.loadFailed'));
        setIsDetailModalOpen(false);
      }
    } catch (error: any) {
      toast.error(error.message || t('domains.toast.loadFailed'));
      setIsDetailModalOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleEditDomain = (domain: Domain) => {
    setSelectedDomain(domain);
    setIsEditModalOpen(true);
  };

  const handleUpdateDomain = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await updateDomainAction(formData);

      if (result.success) {
        toast.success(t('domains.toast.updateSuccess'));
        setIsEditModalOpen(false);
        handleRefresh();
      } else {
        toast.error(result.error || t('domains.toast.updateFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('domains.toast.updateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenew = async () => {
    if (!selectedDomain) return;

    try {
      const result = await renewDomainAction(
        selectedDomain.id,
        parseInt(regPeriod)
      );
      if (result.success) {
        toast.success(t('domains.toast.renewSuccess'));
        setIsRenewModalOpen(false);
        setRegPeriod('1');
        handleRefresh();
      } else {
        toast.error(result.error || t('domains.toast.renewFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('domains.toast.renewFailed'));
    }
  };

  const handleRelease = async () => {
    if (!selectedDomain || !newTag.trim()) {
      toast.error(t('domains.toast.newTagRequired'));
      return;
    }

    try {
      const result = await releaseDomainAction(
        selectedDomain.id,
        newTag.trim()
      );
      if (result.success) {
        toast.success(t('domains.toast.releaseSuccess'));
        setIsReleaseModalOpen(false);
        setNewTag('');
        handleRefresh();
      } else {
        toast.error(result.error || t('domains.toast.releaseFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('domains.toast.releaseFailed'));
    }
  };

  const handleTransfer = async () => {
    if (!selectedDomain) return;

    try {
      const result = await transferDomainAction(
        selectedDomain.id,
        transferEppCode.trim() || undefined
      );
      if (result.success) {
        toast.success(t('domains.toast.transferSuccess'));
        setIsTransferModalOpen(false);
        setTransferEppCode('');
        handleRefresh();
      } else {
        toast.error(result.error || t('domains.toast.transferFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('domains.toast.transferFailed'));
    }
  };

  const handleGetEppCode = async () => {
    if (!selectedDomain) return;

    try {
      const result = await getEppCodeAction(selectedDomain.id);
      if (result.success) {
        setEppCode(result.eppcode);
        toast.success(t('domains.toast.eppCodeSuccess'));
      } else {
        toast.error(result.error || t('domains.toast.eppCodeFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('domains.toast.eppCodeFailed'));
    }
  };

  const handleToggleLock = async (lock: boolean) => {
    if (!selectedDomain) return;

    try {
      const result = await updateDomainLockStatusAction(
        selectedDomain.id,
        lock
      );
      if (result.success) {
        toast.success(
          lock
            ? t('domains.toast.lockSuccess')
            : t('domains.toast.unlockSuccess')
        );
        setLockStatus(lock);
        handleRefresh();
      } else {
        toast.error(result.error || t('domains.toast.lockFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('domains.toast.lockFailed'));
    }
  };

  const handleUpdateNameservers = async () => {
    if (!selectedDomain) return;

    const validNameservers = nameservers.filter((ns) => ns.trim());
    if (validNameservers.length === 0) {
      toast.error(t('domains.toast.atLeastOneNameserver'));
      return;
    }

    try {
      const result = await updateNameserversAction(
        selectedDomain.id,
        validNameservers
      );
      if (result.success) {
        toast.success(t('domains.toast.nameserversSuccess'));
        setIsNameserverModalOpen(false);
        setNameservers(['', '', '', '']);
        handleRefresh();
      } else {
        toast.error(result.error || t('domains.toast.nameserversFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('domains.toast.nameserversFailed'));
    }
  };

  const handleToggleAutoRenew = async (domain: Domain) => {
    const currentAutoRenew =
      domain.donotrenew === 0 || domain.donotrenew === '0';

    try {
      const result = await toggleAutoRenewAction(domain.id, !currentAutoRenew);
      if (result.success) {
        toast.success(t('domains.toast.autoRenewSuccess'));
        handleRefresh();
      } else {
        toast.error(result.error || t('domains.toast.autoRenewFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('domains.toast.autoRenewFailed'));
    }
  };

  const handleToggleDNSManagement = async (domain: Domain) => {
    const currentDNSManagement =
      domain.dnsmanagement === 1 || domain.dnsmanagement === '1';
    const newValue = !currentDNSManagement;

    setIsUpdatingDNS(true);
    try {
      const result = await updateDNSManagementAction(domain.id, newValue);

      if (result.success) {
        toast.success(t('domains.toast.dnsManagementSuccess'));
        // Update selected domain state if it's the same domain
        if (selectedDomain && selectedDomain.id === domain.id) {
          setSelectedDomain({
            ...selectedDomain,
            dnsmanagement: newValue ? 1 : 0,
          });
        }
        handleRefresh();
      } else {
        toast.error(result.error || t('domains.toast.dnsManagementFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('domains.toast.dnsManagementFailed'));
    } finally {
      setIsUpdatingDNS(false);
    }
  };

  // Function to refresh data
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Use Next.js router to refresh server data (invalidates cache)
    router.refresh();
    // Also update local state after a short delay
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success(t('domains.toast.dataRefreshed'));
    }, 1000);
  }, [router, t]);

  // Auto-refresh functionality (industry standard - 30 seconds)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, 30000); // Refresh every 30 seconds when auto-refresh is enabled

    return () => clearInterval(interval);
  }, [autoRefresh, handleRefresh]);

  const handleExportDomains = () => {
    // Create CSV content
    const headers = [
      'ID',
      'Domain Name',
      'Client',
      'Status',
      'Registrar',
      'Registration Date',
      'Next Due Date',
      'Expiry Date',
      'Auto Renew',
    ];
    const rows = filteredDomains.map((domain) => [
      domain.id,
      domain.domainname,
      clientNames[domain.userid] || `Client #${domain.userid}`,
      domain.status,
      domain.registrar || '',
      domain.registrationdate,
      domain.nextduedate,
      domain.expirydate || '',
      domain.donotrenew === 0 || domain.donotrenew === '0' ? 'Yes' : 'No',
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
    a.download = `domains-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(t('domains.toast.exportSuccess'));
  };

  const handleCopyEppCode = () => {
    if (eppCode) {
      navigator.clipboard.writeText(eppCode);
      toast.success(t('domains.toast.eppCodeCopied'));
    }
  };


  // Get unique values for filters
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(domains.map((d) => d.status).filter(Boolean));
    return Array.from(statuses);
  }, [domains]);

  const uniqueRegistrars = useMemo(() => {
    const registrars = new Set(domains.map((d) => d.registrar).filter(Boolean));
    return Array.from(registrars);
  }, [domains]);

  // Calculate expiring soon (within 30 days)
  const expiringSoonDomains = useMemo(() => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return filteredDomains.filter((domain) => {
      if (!domain.nextduedate) return false;
      const dueDate = new Date(domain.nextduedate);
      return dueDate <= thirtyDaysFromNow && dueDate >= new Date();
    }).length;
  }, [filteredDomains]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">
                {t('domains.table.title')}
              </CardTitle>
              <CardDescription className="mt-1">
                {t('domains.table.description')}
                {expiringSoonDomains > 0 && (
                  <span className="ml-2 font-medium text-orange-600">
                    {t('domains.table.expiringSoon', {
                      count: String(expiringSoonDomains),
                    })}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title={t('domains.table.refreshTooltip')}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                {isRefreshing
                  ? t('domains.table.refreshing')
                  : t('domains.table.refresh')}
              </Button>
              <Button
                variant={autoRefresh ? 'default' : 'outline'}
                onClick={() => setAutoRefresh(!autoRefresh)}
                title={
                  autoRefresh
                    ? t('domains.table.disableAutoRefresh')
                    : t('domains.table.enableAutoRefresh')
                }
              >
                {autoRefresh ? (
                  <>
                    <ToggleRight className="mr-2 h-4 w-4" />
                    {t('domains.table.autoRefreshOn')}
                  </>
                ) : (
                  <>
                    <ToggleLeft className="mr-2 h-4 w-4" />
                    {t('domains.table.autoRefreshOff')}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleExportDomains}>
                <Download className="mr-2 h-4 w-4" />
                {t('domains.table.export')}
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col gap-3 pt-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder={t('domains.table.searchPlaceholder')}
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
                <SelectValue placeholder={t('domains.table.allStatuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('domains.table.allStatuses')}
                </SelectItem>
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status.toLowerCase()}>
                    {t(
                      `domains.status.${status.toLowerCase().replace(/\s+/g, '')}`
                    )}
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
                <SelectValue placeholder={t('domains.table.allClients')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('domains.table.allClients')}
                </SelectItem>
                {allClients.map((client) => (
                  <SelectItem key={client.id} value={String(client.id)}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={registrarFilter}
              onValueChange={(value) => {
                setRegistrarFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t('domains.table.allRegistrars')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('domains.table.allRegistrars')}
                </SelectItem>
                {uniqueRegistrars.map((registrar) => (
                  <SelectItem
                    key={registrar}
                    value={(registrar || '').toLowerCase()}
                  >
                    {registrar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedDomains.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <div className="bg-primary/10 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full">
                <Globe className="text-primary h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                {domains.length === 0
                  ? t('domains.table.noDomainsYet')
                  : t('domains.table.noDomainsFound')}
              </h3>
              <p className="text-muted-foreground mx-auto mb-6 max-w-sm">
                {domains.length === 0
                  ? t('domains.table.noDomainsRegistered')
                  : t('domains.table.adjustFilters')}
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
                        {t('domains.table.id')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField>
                        field="domain"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        {t('domains.table.domain')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField>
                        field="client"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        {t('domains.table.client')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField>
                        field="registrationdate"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        {t('domains.table.registrationDate')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField>
                        field="nextduedate"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        {t('domains.table.expiryDate')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="text-center font-semibold">
                      {t('domains.table.autoRenew')}
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField>
                        field="status"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        {t('domains.table.status')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      {t('domains.table.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDomains.map((domain: Domain) => {
                    const autoRenew =
                      domain.donotrenew === 0 || domain.donotrenew === '0';
                    const isExpiringSoon =
                      domain.nextduedate &&
                      new Date(domain.nextduedate) <=
                      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                    return (
                      <TableRow
                        key={domain.id}
                        className="group hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="py-4">
                          <div className="text-foreground font-semibold">
                            #{domain.id}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-start gap-3">
                            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                              <Globe className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-foreground group-hover:text-primary font-semibold transition-colors">
                                {domain.domainname}
                              </div>
                              {domain.registrar && (
                                <div className="text-muted-foreground mt-0.5 text-xs">
                                  {domain.registrar}
                                </div>
                              )}
                              {isExpiringSoon && (
                                <div className="mt-1 flex items-center gap-1 text-xs text-orange-600">
                                  <Clock className="h-3 w-3" />
                                  {t('domains.table.expiringSoonLabel')}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <User className="text-muted-foreground h-4 w-4" />
                            <div>
                              <div className="text-sm font-medium">
                                {clientNames[domain.userid] ||
                                  `Client #${domain.userid}`}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                ID: {domain.userid}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="text-muted-foreground h-4 w-4" />
                            <span className="font-medium">
                              {domain.registrationdate}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="text-muted-foreground h-4 w-4" />
                            <span className="font-medium">
                              {domain.nextduedate}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleToggleAutoRenew(domain)}
                              className="transition-opacity hover:opacity-70"
                              title={
                                autoRenew
                                  ? t('domains.table.disableAutoRenew')
                                  : t('domains.table.enableAutoRenew')
                              }
                            >
                              {autoRenew ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <DomainStatusBadge status={domain.status} />
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDomain(domain)}
                              className="hover:bg-primary/10 hover:text-primary h-8 px-2 transition-colors"
                              title={t('domains.table.viewDomain')}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditDomain(domain)}
                              className="h-8 px-2 transition-colors hover:bg-blue-500/10 hover:text-blue-600"
                              title={t('domains.table.editDomain')}
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
                                  {t('domains.table.actionsLabel')}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDomain(domain);
                                    setIsRenewModalOpen(true);
                                  }}
                                >
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  {t('domains.table.renew')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDomain(domain);
                                    setIsTransferModalOpen(true);
                                  }}
                                >
                                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                                  {t('domains.table.transfer')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDomain(domain);
                                    setIsReleaseModalOpen(true);
                                  }}
                                >
                                  <Send className="mr-2 h-4 w-4" />
                                  {t('domains.table.release')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDomain(domain);
                                    setIsNameserverModalOpen(true);
                                  }}
                                >
                                  <Server className="mr-2 h-4 w-4" />
                                  {t('domains.table.nameservers')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={async () => {
                                    setSelectedDomain(domain);
                                    setIsEppCodeModalOpen(true);
                                    await handleGetEppCode();
                                  }}
                                >
                                  <Key className="mr-2 h-4 w-4" />
                                  {t('domains.table.getEppCode')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={async () => {
                                    setSelectedDomain(domain);
                                    const lockResult =
                                      await getDomainLockStatusAction(
                                        domain.id
                                      );
                                    if (lockResult.success) {
                                      const isLocked =
                                        lockResult.lockstatus === 'locked' ||
                                        lockResult.lockstatus === true;
                                      handleToggleLock(!isLocked);
                                    }
                                  }}
                                >
                                  {lockStatus ? (
                                    <>
                                      <Unlock className="mr-2 h-4 w-4" />
                                      {t('domains.table.unlock')}
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="mr-2 h-4 w-4" />
                                      {t('domains.table.lock')}
                                    </>
                                  )}
                                </DropdownMenuItem>
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
              {t('domains.table.showingResults', {
                start: String((currentPage - 1) * itemsPerPage + 1),
                end: String(
                  Math.min(currentPage * itemsPerPage, filteredDomains.length)
                ),
                total: String(filteredDomains.length),
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
                {t('domains.table.page')} {currentPage} {t('domains.table.of')}{' '}
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

      {/* Domain Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex min-w-0 items-center gap-2">
              <Globe className="h-5 w-5 shrink-0" />
              <span className="min-w-0 break-words">
                {selectedDomain?.domainname}
              </span>
            </DialogTitle>
            <DialogDescription>
              {t('domains.modal.domainId', { id: selectedDomain?.id })}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : selectedDomain ? (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">
                  {t('domains.modal.details')}
                </TabsTrigger>
                <TabsTrigger value="settings">
                  {t('domains.modal.settings')}
                </TabsTrigger>
                <TabsTrigger value="nameservers">
                  {t('domains.modal.nameservers')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      {t('domains.modal.status')}
                    </Label>
                    <div className="mt-1">
                      <DomainStatusBadge status={selectedDomain.status} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      {t('domains.modal.registrar')}
                    </Label>
                    <div className="mt-1 text-sm font-medium">
                      {selectedDomain.registrar || '-'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      {t('domains.modal.lockStatus')}
                    </Label>
                    <div className="mt-1 text-sm font-medium">
                      {lockStatus ? (
                        <Badge
                          variant="outline"
                          className="border-red-500/20 bg-red-500/10 text-red-700"
                        >
                          <Lock className="mr-1 h-3 w-3" />
                          {t('domains.modal.locked')}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-green-500/20 bg-green-500/10 text-green-700"
                        >
                          <Unlock className="mr-1 h-3 w-3" />
                          {t('domains.modal.unlocked')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      {t('domains.modal.autoRenew')}
                    </Label>
                    <div className="mt-1 text-sm font-medium">
                      {selectedDomain.donotrenew === 0 ||
                        selectedDomain.donotrenew === '0' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-foreground border-b pb-2 text-sm font-semibold">
                    {t('domains.modal.clientInformation')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        {t('domains.modal.client')}
                      </Label>
                      <div className="mt-1 text-sm font-medium">
                        {clientNames[selectedDomain.userid] ||
                          `Client #${selectedDomain.userid}`}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        {t('domains.modal.clientId')}
                      </Label>
                      <div className="mt-1 text-sm font-medium">
                        #{selectedDomain.userid}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-foreground border-b pb-2 text-sm font-semibold">
                    {t('domains.modal.domainDates')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        {t('domains.modal.registrationDate')}
                      </Label>
                      <div className="mt-1 text-sm font-medium">
                        {selectedDomain.registrationdate || '-'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        {t('domains.modal.nextDueDate')}
                      </Label>
                      <div className="mt-1 text-sm font-medium">
                        {selectedDomain.nextduedate || '-'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        {t('domains.modal.expiryDate')}
                      </Label>
                      <div className="mt-1 text-sm font-medium">
                        {selectedDomain.expirydate || '-'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        {t('domains.modal.registrationPeriod')}
                      </Label>
                      <div className="mt-1 text-sm font-medium">
                        {selectedDomain.regperiod || '-'}{' '}
                        {t('domains.modal.years')}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedDomain.notes && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">
                      {t('domains.modal.adminNotes')}
                    </Label>
                    <div className="bg-muted rounded-md p-3 text-sm">
                      {selectedDomain.notes}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="settings" className="mt-4 space-y-4">
                {/* DNS Management Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Server className="h-5 w-5" />
                      {t('domains.modal.dnsManagement')}
                    </CardTitle>
                    <CardDescription>
                      {t('domains.modal.enableOrDisable')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {selectedDomain.dnsmanagement === 1 ||
                          selectedDomain.dnsmanagement === '1' ? (
                          <>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium text-green-600">
                                {t('domains.modal.enabled')}
                              </div>
                              <div className="text-muted-foreground text-sm">
                                {t('domains.modal.dnsActive')}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                              <XCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <div className="font-medium text-red-600">
                                {t('domains.modal.disabled')}
                              </div>
                              <div className="text-muted-foreground text-sm">
                                {t('domains.modal.dnsInactive')}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <Button
                        variant={
                          selectedDomain.dnsmanagement === 1 ||
                            selectedDomain.dnsmanagement === '1'
                            ? 'destructive'
                            : 'default'
                        }
                        onClick={() =>
                          handleToggleDNSManagement(selectedDomain)
                        }
                        disabled={isUpdatingDNS}
                      >
                        {isUpdatingDNS ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('domains.modal.updating')}
                          </>
                        ) : selectedDomain.dnsmanagement === 1 ||
                          selectedDomain.dnsmanagement === '1' ? (
                          <>
                            <XCircle className="mr-2 h-4 w-4" />
                            {t('domains.modal.disableDnsManagement')}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {t('domains.modal.enableDnsManagement')}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Other Settings Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        {t('domains.modal.emailForwarding')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        {selectedDomain.emailforwarding === 1 ||
                          selectedDomain.emailforwarding === '1' ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-green-600">
                              {t('domains.modal.enabled')}
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-red-600" />
                            <span className="text-sm font-medium text-red-600">
                              {t('domains.modal.disabled')}
                            </span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        {t('domains.modal.idProtection')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        {selectedDomain.idprotection === 1 ||
                          selectedDomain.idprotection === '1' ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-green-600">
                              {t('domains.modal.enabled')}
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-red-600" />
                            <span className="text-sm font-medium text-red-600">
                              {t('domains.modal.disabled')}
                            </span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        {t('domains.modal.paymentMethod')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-medium">
                        {selectedDomain.paymentmethod || '-'}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="nameservers" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>{t('domains.modal.nameserversLabel')}</Label>
                  <div className="space-y-2">
                    {selectedDomain.ns1 && (
                      <div className="bg-muted rounded p-2 text-sm">
                        {selectedDomain.ns1}
                      </div>
                    )}
                    {selectedDomain.ns2 && (
                      <div className="bg-muted rounded p-2 text-sm">
                        {selectedDomain.ns2}
                      </div>
                    )}
                    {selectedDomain.ns3 && (
                      <div className="bg-muted rounded p-2 text-sm">
                        {selectedDomain.ns3}
                      </div>
                    )}
                    {selectedDomain.ns4 && (
                      <div className="bg-muted rounded p-2 text-sm">
                        {selectedDomain.ns4}
                      </div>
                    )}
                    {!selectedDomain.ns1 && !selectedDomain.ns2 && (
                      <div className="text-muted-foreground text-sm">
                        {t('domains.modal.noNameservers')}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : null}

          <div className="flex gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDetailModalOpen(false)}
              className="flex-1"
            >
              {t('domains.modal.close')}
            </Button>
            {selectedDomain && (
              <Button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleEditDomain(selectedDomain);
                }}
                className="flex-1"
              >
                <Edit className="mr-2 h-4 w-4" />
                {t('domains.modal.editDomain')}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Domain Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('domains.modal.editDomainTitle')}</DialogTitle>
            <DialogDescription>
              {t('domains.modal.updateDomainFor', {
                domain: selectedDomain?.domainname,
              })}
            </DialogDescription>
          </DialogHeader>

          {selectedDomain && (
            <form onSubmit={handleUpdateDomain} className="space-y-4">
              <input type="hidden" name="domainid" value={selectedDomain.id} />

              <div className="space-y-2">
                <Label htmlFor="edit-domain">
                  {t('domains.modal.domainName')}
                </Label>
                <Input
                  id="edit-domain"
                  name="domain"
                  defaultValue={selectedDomain.domainname || ''}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-regdate">
                    {t('domains.modal.registrationDate')}
                  </Label>
                  <Input
                    id="edit-regdate"
                    name="regdate"
                    type="date"
                    defaultValue={
                      selectedDomain.registrationdate?.split(' ')[0] || ''
                    }
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-nextduedate">
                    {t('domains.modal.nextDueDate')}
                  </Label>
                  <Input
                    id="edit-nextduedate"
                    name="nextduedate"
                    type="date"
                    defaultValue={
                      selectedDomain.nextduedate?.split(' ')[0] || ''
                    }
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-expirydate">
                  {t('domains.modal.expiryDate')}
                </Label>
                <Input
                  id="edit-expirydate"
                  name="expirydate"
                  type="date"
                  defaultValue={selectedDomain.expirydate?.split(' ')[0] || ''}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">{t('domains.modal.status')}</Label>
                <Select name="status" defaultValue={selectedDomain.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">
                      {t('domains.status.active')}
                    </SelectItem>
                    <SelectItem value="Pending">
                      {t('domains.status.pending')}
                    </SelectItem>
                    <SelectItem value="Expired">
                      {t('domains.status.expired')}
                    </SelectItem>
                    <SelectItem value="Cancelled">
                      {t('domains.status.cancelled')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-donotrenew">
                    {t('domains.modal.autoRenew')}
                  </Label>
                  <Select
                    name="donotrenew"
                    defaultValue={String(selectedDomain.donotrenew || 0)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">
                        {t('domains.modal.enabled')}
                      </SelectItem>
                      <SelectItem value="1">
                        {t('domains.modal.disabled')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-registrar">
                    {t('domains.modal.registrar')}
                  </Label>
                  <Input
                    id="edit-registrar"
                    name="registrar"
                    defaultValue={selectedDomain.registrar || ''}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">
                  {t('domains.modal.adminNotes')}
                </Label>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  defaultValue={selectedDomain.notes || ''}
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
                  {t('domains.modal.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('domains.modal.updating')}
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      {t('domains.modal.updateDomain')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Renew Domain Modal */}
      <Dialog open={isRenewModalOpen} onOpenChange={setIsRenewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('domains.modal.renewDomain')}</DialogTitle>
            <DialogDescription>
              {t('domains.modal.renewDomainFor', {
                domain: selectedDomain?.domainname,
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-period">
                {t('domains.modal.registrationPeriod')}
              </Label>
              <Select value={regPeriod} onValueChange={setRegPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">
                    1 {t('domains.modal.years')}
                  </SelectItem>
                  <SelectItem value="2">
                    2 {t('domains.modal.years')}
                  </SelectItem>
                  <SelectItem value="3">
                    3 {t('domains.modal.years')}
                  </SelectItem>
                  <SelectItem value="4">
                    4 {t('domains.modal.years')}
                  </SelectItem>
                  <SelectItem value="5">
                    5 {t('domains.modal.years')}
                  </SelectItem>
                  <SelectItem value="10">
                    10 {t('domains.modal.years')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRenewModalOpen(false);
                  setRegPeriod('1');
                }}
                className="flex-1"
              >
                {t('domains.modal.cancel')}
              </Button>
              <Button onClick={handleRenew} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('domains.modal.renewDomainButton')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Release Domain Modal */}
      <Dialog open={isReleaseModalOpen} onOpenChange={setIsReleaseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('domains.modal.releaseDomain')}</DialogTitle>
            <DialogDescription>
              {t('domains.modal.releaseDomainTo', {
                domain: selectedDomain?.domainname,
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-tag">
                {t('domains.modal.newRegistrarTag')}
              </Label>
              <Input
                id="new-tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder={t('domains.modal.enterNewTag')}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsReleaseModalOpen(false);
                  setNewTag('');
                }}
                className="flex-1"
              >
                {t('domains.modal.cancel')}
              </Button>
              <Button onClick={handleRelease} className="flex-1">
                <Send className="mr-2 h-4 w-4" />
                {t('domains.modal.releaseDomainButton')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Domain Modal */}
      <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('domains.modal.transferDomain')}</DialogTitle>
            <DialogDescription>
              {t('domains.modal.initiateTransfer', {
                domain: selectedDomain?.domainname,
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-epp">
                {t('domains.modal.eppCodeOptional')}
              </Label>
              <Input
                id="transfer-epp"
                value={transferEppCode}
                onChange={(e) => setTransferEppCode(e.target.value)}
                placeholder={t('domains.modal.enterEppCode')}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsTransferModalOpen(false);
                  setTransferEppCode('');
                }}
                className="flex-1"
              >
                {t('domains.modal.cancel')}
              </Button>
              <Button onClick={handleTransfer} className="flex-1">
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                {t('domains.modal.transferDomainButton')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nameserver Modal */}
      <Dialog
        open={isNameserverModalOpen}
        onOpenChange={setIsNameserverModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('domains.modal.updateNameservers')}</DialogTitle>
            <DialogDescription>
              {t('domains.modal.updateNameserversFor', {
                domain: selectedDomain?.domainname,
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="space-y-1">
                  <Label htmlFor={`ns${index + 1}`}>
                    {t('domains.modal.nameserver')} {index + 1}
                  </Label>
                  <Input
                    id={`ns${index + 1}`}
                    value={nameservers[index] || ''}
                    onChange={(e) => {
                      const newNameservers = [...nameservers];
                      newNameservers[index] = e.target.value;
                      setNameservers(newNameservers);
                    }}
                    placeholder={`ns${index + 1}.example.com`}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsNameserverModalOpen(false);
                  setNameservers(['', '', '', '']);
                }}
                className="flex-1"
              >
                {t('domains.modal.cancel')}
              </Button>
              <Button onClick={handleUpdateNameservers} className="flex-1">
                <Server className="mr-2 h-4 w-4" />
                {t('domains.modal.updateNameserversButton')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* EPP Code Modal */}
      <Dialog open={isEppCodeModalOpen} onOpenChange={setIsEppCodeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('domains.modal.eppCode')}</DialogTitle>
            <DialogDescription>
              {t('domains.modal.authorizationCode', {
                domain: selectedDomain?.domainname,
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {eppCode ? (
              <div className="space-y-2">
                <Label>{t('domains.modal.eppCode')}</Label>
                <div className="flex gap-2">
                  <Input value={eppCode} readOnly className="font-mono" />
                  <Button variant="outline" onClick={handleCopyEppCode}>
                    <Copy className="h-4 w-4" />
                    {t('domains.modal.copy')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <Loader2 className="text-primary mx-auto mb-4 h-8 w-8 animate-spin" />
                <p className="text-muted-foreground text-sm">
                  {t('domains.modal.retrievingEpp')}
                </p>
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setIsEppCodeModalOpen(false);
                setEppCode('');
              }}
              className="w-full"
            >
              {t('domains.modal.close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Domain Status Badge Component
function DomainStatusBadge({ status }: { status: string }) {
  const statusLower = status?.toLowerCase() || 'unknown';

  const { t } = useAdminTranslation();
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
    expired: {
      bg: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-700 dark:text-red-400',
      icon: XCircle,
    },
    cancelled: {
      bg: 'bg-gray-500/10 border-gray-500/20',
      text: 'text-gray-700 dark:text-gray-400',
      icon: XCircle,
    },
  };

  const config = statusConfig[statusLower] || statusConfig.pending;
  const Icon = config.icon;
  const statusKey = statusLower.replace(/\s+/g, '').replace(/-/g, '');
  const label =
    t(`domains.status.${statusKey}`) || t(`domains.status.${statusLower}`);

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
