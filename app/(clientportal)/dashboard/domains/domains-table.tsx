'use client';

import { useState, useMemo } from 'react';
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
  Globe,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Calendar,
  Eye,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  AlertCircle,
  Clock,
  Info,
  Shield,
  Lock,
  Copy,
  Key,
  MoreVertical,
  Mail,
  RotateCw,
  ShieldCheck,
  ShieldOff,
  ArrowRightLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useDashboardTranslation } from '@/components/DashboardTranslationProvider';
import { format, parseISO } from 'date-fns';
import {
  renewDomainAction,
  toggleAutoRenewAction,
  getDomainDetailsAction,
  updateDNSManagementAction,
  updateNameserversAction,
  getEppCodeAction,
  getDomainLockStatusAction,
  transferDomainAction,
  registerDomainAction,
  releaseDomainAction,
  requestEppCodeAction,
  resendTransferEmailAction,
  synchroniseDomainAction,
  toggleIDProtectAction,
} from '@/actions/domain-actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Domain {
  id: string | number;
  domainname: string;
  registrationdate: string;
  nextduedate: string;
  status: string;
  donotrenew?: number | string;
  registrar?: string;
  dnsmanagement?: number | string;
  idprotection?: number | string;
  ns1?: string;
  ns2?: string;
  ns3?: string;
  ns4?: string;
  isRegistered?: boolean;
  isHostingAssigned?: boolean;
  hasActiveHosting?: boolean;
  [key: string]: any;
}

interface DomainsTableProps {
  domains: Domain[];
}

type SortField = 'domainname' | 'status' | 'nextduedate' | 'registrationdate';
type SortDirection = 'asc' | 'desc';

export function DomainsTable({ domains: initialDomains }: DomainsTableProps) {
  const { t } = useDashboardTranslation();
  const [domains] = useState<Domain[]>(initialDomains);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRenewFilter, setAutoRenewFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('nextduedate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDNSModalOpen, setIsDNSModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [transferEppCode, setTransferEppCode] = useState('');
  const [releaseTag, setReleaseTag] = useState('');
  const [isRenewing, setIsRenewing] = useState(false);
  const [isTogglingAutoRenew, setIsTogglingAutoRenew] = useState(false);
  const [isUpdatingDNS, setIsUpdatingDNS] = useState(false);
  const [isUpdatingNameservers, setIsUpdatingNameservers] = useState(false);
  const [nameservers, setNameservers] = useState<string[]>(['', '', '', '']);
  const [eppCode, setEppCode] = useState<string | null>(null);
  const [lockStatus, setLockStatus] = useState<string | null>(null);
  const [isLoadingEppCode, setIsLoadingEppCode] = useState(false);
  const [isLoadingLockStatus, setIsLoadingLockStatus] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isRequestingEpp, setIsRequestingEpp] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [isSynchronising, setIsSynchronising] = useState(false);
  const [isTogglingIDProtect, setIsTogglingIDProtect] = useState(false);
  const itemsPerPage = 10;

  // Filter domains
  const filteredDomains = useMemo(() => {
    let filtered = [...domains];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (domain) =>
          domain.domainname?.toLowerCase().includes(query) ||
          domain.registrar?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (domain) => domain.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Auto-renew filter
    if (autoRenewFilter !== 'all') {
      const autoRenew = autoRenewFilter === 'enabled';
      filtered = filtered.filter((domain) => {
        const hasAutoRenew =
          domain.donotrenew === 0 || domain.donotrenew === '0';
        return autoRenew ? hasAutoRenew : !hasAutoRenew;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'domainname') {
        aValue = (aValue || '').toLowerCase();
        bValue = (bValue || '').toLowerCase();
      } else if (
        sortField === 'nextduedate' ||
        sortField === 'registrationdate'
      ) {
        // Handle 'N/A' or invalid dates for sorting
        const aDate = new Date(aValue || 0);
        const bDate = new Date(bValue || 0);
        aValue = isNaN(aDate.getTime()) ? 0 : aDate.getTime();
        bValue = isNaN(bDate.getTime()) ? 0 : bDate.getTime();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [
    domains,
    searchQuery,
    statusFilter,
    autoRenewFilter,
    sortField,
    sortDirection,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredDomains.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDomains = filteredDomains.slice(startIndex, endIndex);

  // Get unique statuses
  const statuses = useMemo(() => {
    const stats = new Set<string>();
    domains.forEach((domain) => {
      if (domain.status) stats.add(domain.status.toLowerCase());
    });
    return Array.from(stats);
  }, [domains]);

  // Helper functions
  const isExpiringSoon = (nextDueDate: string): boolean => {
    const dueDate = new Date(nextDueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

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
    setSelectedDomain(domain);
    setIsDetailModalOpen(true);

    // Fetch latest domain details
    try {
      const result = await getDomainDetailsAction(domain.id);
      if (result.success && result.data) {
        setSelectedDomain(result.data as Domain);
      }
    } catch (error) {
      console.error('Failed to fetch domain details:', error);
    }
  };

  const handleRenew = async (domain: Domain) => {
    setIsRenewing(true);
    try {
      toast.info(`Renewing domain: ${domain.domainname}`, {
        description: 'Processing your renewal request...',
      });

      const result = await renewDomainAction(domain.id);

      if (result.success) {
        toast.success(
          result.message || 'Domain renewal initiated successfully'
        );
        // Refresh the page data
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to renew domain');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to renew domain');
    } finally {
      setIsRenewing(false);
    }
  };

  const handleDNSSettings = async (domain: Domain) => {
    setSelectedDomain(domain);
    setIsDNSModalOpen(true);

    // Fetch latest domain details
    try {
      const result = await getDomainDetailsAction(domain.id);
      if (result.success && result.data) {
        const domainData = result.data as Domain;
        setSelectedDomain(domainData);

        // Extract nameservers from domain data
        const ns: string[] = [];
        for (let i = 1; i <= 4; i++) {
          const nsKey = `ns${i}` as keyof Domain;
          if (domainData[nsKey]) {
            ns.push(String(domainData[nsKey]));
          }
        }
        // Fill remaining slots with empty strings
        while (ns.length < 4) {
          ns.push('');
        }
        setNameservers(ns);
      }
    } catch (error) {
      console.error('Failed to fetch domain details:', error);
    }
  };

  const handleToggleDNSManagement = async (domain: Domain) => {
    const currentDNSManagement =
      domain.dnsmanagement === 1 || domain.dnsmanagement === '1';
    const newValue = !currentDNSManagement;

    setIsUpdatingDNS(true);
    try {
      toast.info(
        `${newValue ? 'Enabling' : 'Disabling'} DNS management for ${domain.domainname}`
      );

      const result = await updateDNSManagementAction(domain.id, newValue);

      if (result.success) {
        toast.success(
          result.message ||
          `DNS management ${newValue ? 'enabled' : 'disabled'} successfully`
        );
        // Update domain in state
        setSelectedDomain((prev) =>
          prev ? { ...prev, dnsmanagement: newValue ? 1 : 0 } : null
        );
        // Refresh the page data
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to update DNS management setting');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update DNS management setting');
    } finally {
      setIsUpdatingDNS(false);
    }
  };

  const handleUpdateNameservers = async (domain: Domain) => {
    setIsUpdatingNameservers(true);
    try {
      // Filter out empty nameservers
      const validNameservers = nameservers.filter((ns) => ns.trim() !== '');

      if (validNameservers.length === 0) {
        toast.error('At least one nameserver is required');
        setIsUpdatingNameservers(false);
        return;
      }

      toast.info(`Updating nameservers for ${domain.domainname}`);

      const result = await updateNameserversAction(domain.id, validNameservers);

      if (result.success) {
        toast.success(result.message || 'Nameservers updated successfully');
        // Refresh the page data
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to update nameservers');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update nameservers');
    } finally {
      setIsUpdatingNameservers(false);
    }
  };

  const handleGetEppCode = async (domain: Domain) => {
    setIsLoadingEppCode(true);
    try {
      const result = await getEppCodeAction(domain.id);

      if (result.success && result.eppcode) {
        setEppCode(result.eppcode);
        toast.success('EPP code retrieved successfully');
      } else {
        toast.error(result.error || 'Failed to retrieve EPP code');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to retrieve EPP code');
    } finally {
      setIsLoadingEppCode(false);
    }
  };

  const handleGetLockStatus = async (domain: Domain) => {
    setIsLoadingLockStatus(true);
    try {
      const result = await getDomainLockStatusAction(domain.id);

      if (result.success && result.lockstatus !== undefined) {
        setLockStatus(result.lockstatus);
        toast.success('Lock status retrieved successfully');
      } else {
        toast.error(result.error || 'Failed to retrieve lock status');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to retrieve lock status');
    } finally {
      setIsLoadingLockStatus(false);
    }
  };

  const handleOpenTransferModal = (domain: Domain) => {
    setSelectedDomain(domain);
    setTransferEppCode('');
    setIsTransferModalOpen(true);
  };

  const handleTransferDomain = async () => {
    if (!selectedDomain) return;

    setIsTransferring(true);
    try {
      toast.info(`Initiating transfer for ${selectedDomain.domainname}`);

      const result = await transferDomainAction(
        selectedDomain.id,
        transferEppCode || undefined
      );

      if (result.success) {
        toast.success(
          result.message || 'Domain transfer initiated successfully'
        );
        setIsTransferModalOpen(false);
        setTransferEppCode('');
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to initiate domain transfer');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate domain transfer');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleOpenReleaseModal = (domain: Domain) => {
    setSelectedDomain(domain);
    setReleaseTag('');
    setIsReleaseModalOpen(true);
  };

  const handleReleaseDomain = async () => {
    if (!selectedDomain) return;

    if (!releaseTag.trim()) {
      toast.error('Registrar tag is required');
      return;
    }

    setIsReleasing(true);
    try {
      toast.info(`Releasing ${selectedDomain.domainname} to new registrar`);

      const result = await releaseDomainAction(
        selectedDomain.id,
        releaseTag.trim()
      );

      if (result.success) {
        toast.success(
          result.message || 'Domain release initiated successfully'
        );
        setIsReleaseModalOpen(false);
        setReleaseTag('');
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to release domain');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to release domain');
    } finally {
      setIsReleasing(false);
    }
  };

  const handleRegisterDomain = async (domain: Domain) => {
    try {
      toast.info(`Registering domain: ${domain.domainname}`);

      const result = await registerDomainAction(domain.id);

      if (result.success) {
        toast.success(
          result.message || 'Domain registration initiated successfully'
        );
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to register domain');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to register domain');
    }
  };

  const handleToggleAutoRenew = async (domain: Domain) => {
    const currentAutoRenew =
      domain.donotrenew === 0 || domain.donotrenew === '0';
    const newValue = !currentAutoRenew;

    setIsTogglingAutoRenew(true);
    try {
      toast.info(
        `${newValue ? 'Enabling' : 'Disabling'} auto-renew for ${domain.domainname}`
      );

      const result = await toggleAutoRenewAction(domain.id, newValue);

      if (result.success) {
        toast.success(
          result.message ||
          `Auto-renew ${newValue ? 'enabled' : 'disabled'} successfully`
        );
        // Update domain in state
        setSelectedDomain((prev) =>
          prev ? { ...prev, donotrenew: newValue ? 0 : 1 } : null
        );
        // Refresh the page data
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to update auto-renew setting');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update auto-renew setting');
    } finally {
      setIsTogglingAutoRenew(false);
    }
  };

  const handleRequestEppCode = async (domain: Domain) => {
    setIsRequestingEpp(true);
    try {
      toast.info(`Requesting EPP code for ${domain.domainname}`);
      const result = await requestEppCodeAction(domain.id);

      if (result.success) {
        toast.success(
          result.message || 'EPP code request email sent successfully'
        );
      } else {
        toast.error(result.error || 'Failed to request EPP code');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to request EPP code');
    } finally {
      setIsRequestingEpp(false);
    }
  };

  const handleResendTransferEmail = async (domain: Domain) => {
    setIsResendingEmail(true);
    try {
      toast.info(`Resending transfer email for ${domain.domainname}`);
      const result = await resendTransferEmailAction(domain.id);

      if (result.success) {
        toast.success(
          result.message || 'Transfer confirmation email sent successfully'
        );
      } else {
        toast.error(result.error || 'Failed to resend transfer email');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend transfer email');
    } finally {
      setIsResendingEmail(false);
    }
  };

  const handleSynchroniseDomain = async (domain: Domain) => {
    setIsSynchronising(true);
    try {
      toast.info(`Synchronising ${domain.domainname} with registrar`);
      const result = await synchroniseDomainAction(domain.id);

      if (result.success) {
        toast.success(result.message || 'Domain synchronised successfully');
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to synchronise domain');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to synchronise domain');
    } finally {
      setIsSynchronising(false);
    }
  };

  const handleToggleIDProtect = async (domain: Domain) => {
    // Check current ID protect status (assuming it's in domain data)
    const currentStatus =
      domain.idprotection === 1 || domain.idprotection === '1';
    const newValue = !currentStatus;

    setIsTogglingIDProtect(true);
    try {
      toast.info(
        `${newValue ? 'Enabling' : 'Disabling'} ID protection for ${domain.domainname}`
      );
      const result = await toggleIDProtectAction(domain.id, newValue);

      if (result.success) {
        toast.success(
          result.message ||
          `ID protection ${newValue ? 'enabled' : 'disabled'} successfully`
        );
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to toggle ID protection');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle ID protection');
    } finally {
      setIsTogglingIDProtect(false);
    }
  };


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
              </CardDescription>
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
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border-input focus:ring-ring h-9 rounded-md border bg-transparent px-3 py-1 text-sm focus:ring-2 focus:outline-none"
            >
              <option value="all">{t('domains.table.allStatus')}</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {t(`domains.status.${status.toLowerCase()}`)}
                </option>
              ))}
            </select>
            <select
              value={autoRenewFilter}
              onChange={(e) => {
                setAutoRenewFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border-input focus:ring-ring h-9 rounded-md border bg-transparent px-3 py-1 text-sm focus:ring-2 focus:outline-none"
            >
              <option value="all">{t('domains.table.allAutoRenew')}</option>
              <option value="enabled">
                {t('domains.table.autoRenewEnabled')}
              </option>
              <option value="disabled">
                {t('domains.table.autoRenewDisabled')}
              </option>
            </select>
          </div>

          {/* Results count */}
          <div className="text-muted-foreground text-sm">
            {t('domains.table.showingResults', {
              start: String(startIndex + 1),
              end: String(Math.min(endIndex, filteredDomains.length)),
              total: String(filteredDomains.length),
            })}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedDomains.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <div className="bg-primary/10 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full">
                <Globe className="text-primary h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">No Domains Found</h3>
              <p className="text-muted-foreground mx-auto mb-6 max-w-sm">
                {searchQuery ||
                  statusFilter !== 'all' ||
                  autoRenewFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : "You haven't registered any domains with us yet. Secure your brand identity today."}
              </p>
              {!searchQuery &&
                statusFilter === 'all' &&
                autoRenewFilter === 'all' && (
                  <Link href="/dashboard/domain-register">
                    <Button className="bg-primary hover:bg-primary/90">
                      <Globe className="mr-2 h-4 w-4" />
                      Search for a Domain
                    </Button>
                  </Link>
                )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold">
                        <SortButton<SortField>
                          field="domainname"
                          currentSortField={sortField}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                        >
                          {t('domains.table.domain')}
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
                    {paginatedDomains.map((domain) => {
                      const expiring = isExpiringSoon(domain.nextduedate);
                      const autoRenew =
                        domain.donotrenew === 0 || domain.donotrenew === '0';

                      return (
                        <TableRow
                          key={domain.id}
                          className={`group hover:bg-muted/30 transition-colors ${expiring ? 'bg-orange-50/50 dark:bg-orange-950/10' : ''}`}
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                                <Globe className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <a
                                    href={`https://${domain.domainname}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-foreground group-hover:text-primary flex items-center gap-2 font-semibold transition-colors"
                                  >
                                    {domain.domainname}
                                    <ExternalLink className="h-3 w-3 opacity-50" />
                                  </a>
                                  {domain.isHostingAssigned && (
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] h-5 px-1.5 flex items-center gap-1">
                                      <ShieldCheck className="h-3 w-3" />
                                      Hosting
                                    </Badge>
                                  )}
                                  {!domain.isRegistered && (
                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] h-5 px-1.5 flex items-center gap-1">
                                      <ExternalLink className="h-3 w-3" />
                                      External
                                    </Badge>
                                  )}
                                </div>
                                {domain.registrar && (
                                  <p className="text-muted-foreground mt-0.5 text-xs">
                                    {domain.registrar}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="text-muted-foreground h-4 w-4" />
                              <span className="font-medium text-foreground">
                                {domain.registrationdate && domain.registrationdate !== 'N/A' ? (
                                  (() => {
                                    try {
                                      return format(parseISO(domain.registrationdate), 'MMM d, yyyy');
                                    } catch (e) {
                                      return domain.registrationdate;
                                    }
                                  })()
                                ) : (
                                  <span className="text-muted-foreground italic font-normal text-xs">
                                    Not Available
                                  </span>
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="text-muted-foreground h-4 w-4" />
                              <span className="font-medium">
                                {domain.nextduedate ? (
                                  (() => {
                                    try {
                                      return format(parseISO(domain.nextduedate), 'MMM d, yyyy');
                                    } catch (e) {
                                      return domain.nextduedate;
                                    }
                                  })()
                                ) : (
                                  <span className="text-muted-foreground italic font-normal text-xs">
                                    N/A
                                  </span>
                                )}
                              </span>
                            </div>
                            {expiring && (
                              <div className="mt-1 flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                                <AlertCircle className="h-3 w-3" />
                                Expiring within 30 days
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex justify-center">
                              {autoRenew ? (
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                  <CheckCircle2 className="h-5 w-5" />
                                  <span className="text-xs font-medium">
                                    Enabled
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                  <XCircle className="h-5 w-5" />
                                  <span className="text-xs font-medium">
                                    Disabled
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <DomainStatusBadge status={domain.status} />
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Common Actions - Separate Buttons */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewDomain(domain)}
                                className="hover:bg-primary/10 hover:text-primary h-8 px-2 transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRenew(domain)}
                                disabled={isRenewing || !domain.isRegistered}
                                className="hover:bg-primary/10 hover:text-primary h-8 px-2 transition-colors"
                                title={domain.isRegistered ? "Renew Domain" : "Cannot renew here (External)"}
                              >
                                <RefreshCw
                                  className={`h-3.5 w-3.5 ${isRenewing ? 'animate-spin' : ''}`}
                                />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDNSSettings(domain)}
                                disabled={!domain.isRegistered}
                                className="hover:bg-primary/10 hover:text-primary h-8 px-2 transition-colors"
                                title={domain.isRegistered ? "DNS Settings" : "Cannot manage DNS here (External)"}
                              >
                                <Settings className="h-3.5 w-3.5" />
                              </Button>

                              {/* Advanced Actions - Dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="hover:bg-primary/10 hover:text-primary h-8 px-2 transition-colors"
                                    title="More Actions"
                                  >
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-56"
                                >
                                  <DropdownMenuLabel>
                                    More Actions
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleToggleAutoRenew(domain)
                                    }
                                    disabled={isTogglingAutoRenew || !domain.isRegistered}
                                  >
                                    <RefreshCw
                                      className={`mr-2 h-4 w-4 ${isTogglingAutoRenew ? 'animate-spin' : ''}`}
                                    />
                                    {domain.donotrenew === 0 ||
                                      domain.donotrenew === '0'
                                      ? 'Disable'
                                      : 'Enable'}{' '}
                                    Auto-Renew
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    onClick={() => handleGetEppCode(domain)}
                                    disabled={isLoadingEppCode || !domain.isRegistered}
                                  >
                                    <Key
                                      className={`mr-2 h-4 w-4 ${isLoadingEppCode ? 'animate-spin' : ''}`}
                                    />
                                    Get EPP Code
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => handleRequestEppCode(domain)}
                                    disabled={isRequestingEpp || !domain.isRegistered}
                                  >
                                    <Mail
                                      className={`mr-2 h-4 w-4 ${isRequestingEpp ? 'animate-spin' : ''}`}
                                    />
                                    Request EPP via Email
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => handleGetLockStatus(domain)}
                                    disabled={isLoadingLockStatus || !domain.isRegistered}
                                  >
                                    <Lock
                                      className={`mr-2 h-4 w-4 ${isLoadingLockStatus ? 'animate-spin' : ''}`}
                                    />
                                    Check Lock Status
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleOpenTransferModal(domain)
                                    }
                                    disabled={!domain.isRegistered}
                                  >
                                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                                    Transfer Domain
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleOpenReleaseModal(domain)
                                    }
                                    disabled={!domain.isRegistered}
                                  >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Release Domain
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleResendTransferEmail(domain)
                                    }
                                    disabled={isResendingEmail}
                                  >
                                    <Mail
                                      className={`mr-2 h-4 w-4 ${isResendingEmail ? 'animate-spin' : ''}`}
                                    />
                                    Resend Transfer Email
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => handleRegisterDomain(domain)}
                                  >
                                    <Globe className="mr-2 h-4 w-4" />
                                    {t('domains.table.registerDomain')}
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleSynchroniseDomain(domain)
                                    }
                                    disabled={isSynchronising}
                                  >
                                    <RotateCw
                                      className={`mr-2 h-4 w-4 ${isSynchronising ? 'animate-spin' : ''}`}
                                    />
                                    Sync with Registrar
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleToggleIDProtect(domain)
                                    }
                                    disabled={isTogglingIDProtect}
                                  >
                                    {domain.idprotection === 1 ||
                                      domain.idprotection === '1' ? (
                                      <>
                                        <ShieldOff
                                          className={`mr-2 h-4 w-4 ${isTogglingIDProtect ? 'animate-spin' : ''}`}
                                        />
                                        Disable ID Protection
                                      </>
                                    ) : (
                                      <>
                                        <ShieldCheck
                                          className={`mr-2 h-4 w-4 ${isTogglingIDProtect ? 'animate-spin' : ''}`}
                                        />
                                        Enable ID Protection
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <div className="text-muted-foreground text-sm">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Domain Detail Modal */}
      <Dialog
        open={isDetailModalOpen}
        onOpenChange={(open) => {
          setIsDetailModalOpen(open);
          if (!open) {
            setEppCode(null);
            setLockStatus(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selectedDomain && (
            <>
              <DialogHeader>
                <DialogTitle className="flex min-w-0 items-center gap-2">
                  <Globe className="text-primary h-5 w-5 shrink-0" />
                  <span className="min-w-0 break-words">
                    {selectedDomain.domainname}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  Complete domain details and management options
                </DialogDescription>
              </DialogHeader>
              <div className="min-w-0 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-sm font-medium">
                      Status
                    </div>
                    <DomainStatusBadge status={selectedDomain.status} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-sm font-medium">
                      Auto-Renew
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedDomain.donotrenew === 0 ||
                        selectedDomain.donotrenew === '0' ? (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm font-medium">Enabled</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Disabled</span>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleAutoRenew(selectedDomain)}
                        disabled={isTogglingAutoRenew}
                        className="ml-2 h-7 text-xs"
                      >
                        {isTogglingAutoRenew ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : selectedDomain.donotrenew === 0 ||
                          selectedDomain.donotrenew === '0' ? (
                          'Disable'
                        ) : (
                          'Enable'
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-sm font-medium">
                      Domain ID
                    </div>
                    <div className="font-mono text-sm">{selectedDomain.id}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-sm font-medium">
                      Registrar
                    </div>
                    <div className="text-sm">
                      {selectedDomain.registrar || 'Managed Domain'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-sm font-medium">
                      Registration Date
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-muted-foreground h-4 w-4" />
                      <span className="font-medium">
                        {selectedDomain.registrationdate && selectedDomain.registrationdate !== 'N/A' ? (
                          (() => {
                            try {
                              return format(parseISO(selectedDomain.registrationdate), 'MMM d, yyyy');
                            } catch (e) {
                              return selectedDomain.registrationdate;
                            }
                          })()
                        ) : (
                          <span className="text-muted-foreground italic font-normal">
                            Not Available
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-sm font-medium">
                      Next Due Date
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-muted-foreground h-4 w-4" />
                      <span>
                        {selectedDomain.nextduedate ? (
                          (() => {
                            try {
                              return format(parseISO(selectedDomain.nextduedate), 'MMM d, yyyy');
                            } catch (e) {
                              return selectedDomain.nextduedate;
                            }
                          })()
                        ) : (
                          'N/A'
                        )}
                      </span>
                      {isExpiringSoon(selectedDomain.nextduedate) && (
                        <Badge
                          variant="outline"
                          className="border-orange-200 text-orange-600"
                        >
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Expiring Soon
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <a
                    href={`https://${selectedDomain.domainname}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary flex items-center gap-2 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Visit Website
                  </a>
                </div>

                {/* EPP Code Section */}
                <Card className="border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {t('domains.details.eppCode')}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {t('domains.details.eppCodeDesc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {eppCode ? (
                      <div className="space-y-2">
                        <div className="bg-muted flex items-center gap-2 rounded-md p-3">
                          <Lock className="text-primary h-4 w-4" />
                          <code className="flex-1 font-mono text-sm break-all">
                            {eppCode}
                          </code>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(eppCode);
                            toast.success('EPP code copied to clipboard');
                          }}
                          className="w-full"
                        >
                          Copy EPP Code
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => handleGetEppCode(selectedDomain)}
                        disabled={isLoadingEppCode}
                        className="w-full"
                      >
                        {isLoadingEppCode ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Retrieving...
                          </>
                        ) : (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Get EPP Code
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Lock Status Section */}
                <Card className="border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {t('domains.details.lockStatus')}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {t('domains.details.lockStatusDesc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {lockStatus !== null ? (
                      <div className="bg-muted flex items-center gap-2 rounded-md p-3">
                        <Shield className="text-primary h-4 w-4" />
                        <span className="font-medium">
                          {lockStatus === 'locked' || lockStatus === '1'
                            ? t('domains.details.locked')
                            : t('domains.details.unlocked')}
                        </span>
                        <Badge
                          variant={
                            lockStatus === 'locked' || lockStatus === '1'
                              ? 'default'
                              : 'outline'
                          }
                        >
                          {lockStatus === 'locked' || lockStatus === '1'
                            ? 'Protected'
                            : 'Transferable'}
                        </Badge>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => handleGetLockStatus(selectedDomain)}
                        disabled={isLoadingLockStatus}
                        className="w-full"
                      >
                        {isLoadingLockStatus ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          <>
                            <Shield className="mr-2 h-4 w-4" />
                            Check Lock Status
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Domain Actions */}
                <div className="grid grid-cols-2 gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => handleDNSSettings(selectedDomain)}
                    className="flex-1"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    DNS Settings
                  </Button>
                  <Button
                    onClick={() => handleRenew(selectedDomain)}
                    disabled={isRenewing}
                    className="bg-primary hover:bg-primary/90 flex-1"
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${isRenewing ? 'animate-spin' : ''}`}
                    />
                    Renew
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleOpenTransferModal(selectedDomain)}
                    className="flex-1"
                  >
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Transfer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleRegisterDomain(selectedDomain)}
                    className="flex-1"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Register
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DNS Management Modal */}
      <Dialog open={isDNSModalOpen} onOpenChange={setIsDNSModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {selectedDomain && (
            <>
              <DialogHeader>
                <DialogTitle className="flex min-w-0 items-center gap-2">
                  <Settings className="text-primary h-5 w-5 shrink-0" />
                  DNS Management - {selectedDomain.domainname}
                </DialogTitle>
                <DialogDescription>
                  Manage DNS settings and nameservers for your domain
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* DNS Management Toggle */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {t('domains.details.dnsManagement')}
                    </CardTitle>
                    <CardDescription>
                      {t('domains.details.dnsManagementDesc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {t('domains.details.dnsManagementStatus')}
                        </div>
                        <div className="text-muted-foreground mt-1 text-sm">
                          {selectedDomain.dnsmanagement === 1 ||
                            selectedDomain.dnsmanagement === '1'
                            ? t('domains.details.dnsManagementEnabled')
                            : t('domains.details.dnsManagementDisabled')}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleToggleDNSManagement(selectedDomain)
                        }
                        disabled={isUpdatingDNS}
                      >
                        {isUpdatingDNS ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : selectedDomain.dnsmanagement === 1 ||
                          selectedDomain.dnsmanagement === '1' ? (
                          t('domains.details.disableDNSManagement')
                        ) : (
                          t('domains.details.enableDNSManagement')
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Nameservers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {t('domains.details.nameservers')}
                    </CardTitle>
                    <CardDescription>
                      {t('domains.details.nameserversDesc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {nameservers.map((ns, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          placeholder={t(
                            'domains.details.nameserverPlaceholder',
                            { number: String(index + 1) }
                          )}
                          value={ns}
                          onChange={(e) => {
                            const newNS = [...nameservers];
                            newNS[index] = e.target.value;
                            setNameservers(newNS);
                          }}
                          className="flex-1"
                        />
                      </div>
                    ))}
                    <Button
                      onClick={() => handleUpdateNameservers(selectedDomain)}
                      disabled={isUpdatingNameservers}
                      className="w-full"
                    >
                      {isUpdatingNameservers ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          {t('domains.details.updatingNameservers')}
                        </>
                      ) : (
                        <>
                          <Settings className="mr-2 h-4 w-4" />
                          {t('domains.details.updateNameservers')}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* DNS Records Info - Currently Not Available */}
                <Card className="border-dashed opacity-75">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {t('domains.details.dnsRecords')}
                    </CardTitle>
                    <CardDescription>
                      {t('domains.details.dnsRecordsDesc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Info className="text-muted-foreground mt-0.5 h-5 w-5" />
                        <div className="flex-1">
                          <div className="text-muted-foreground mb-1 font-medium">
                            DNS Records Management
                          </div>
                          <div className="text-muted-foreground text-sm">
                            DNS records management (A, AAAA, CNAME, MX, TXT,
                            etc.) is currently not available. You can manage DNS
                            records through your domain registrar's control
                            panel or contact support for assistance.
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Nameservers Display */}
                {(selectedDomain.ns1 || selectedDomain.ns2) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Current Nameservers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((i) => {
                          const nsKey = `ns${i}` as keyof Domain;
                          const nsValue = selectedDomain[nsKey];
                          if (!nsValue) return null;
                          return (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Globe className="text-muted-foreground h-4 w-4" />
                              <span className="font-mono">
                                {String(nsValue)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Domain Modal */}
      <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex min-w-0 items-center gap-2">
              <ArrowRightLeft className="text-primary h-5 w-5 shrink-0" />
              Transfer Domain
            </DialogTitle>
            <DialogDescription>
              Transfer {selectedDomain?.domainname} to another registrar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="transferEppCode">
                {t('domains.details.eppCode')}
              </Label>
              <Input
                id="transferEppCode"
                placeholder={t('domains.details.eppCodePlaceholder')}
                value={transferEppCode}
                onChange={(e) => setTransferEppCode(e.target.value)}
                disabled={isTransferring}
              />
              <p className="text-muted-foreground text-xs">
                {t('domains.details.eppCodeHelp')}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsTransferModalOpen(false);
                  setTransferEppCode('');
                }}
                disabled={isTransferring}
              >
                Cancel
              </Button>
              <Button
                onClick={handleTransferDomain}
                disabled={isTransferring}
                className="bg-primary hover:bg-primary/90"
              >
                {isTransferring ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Initiate Transfer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Release Domain Modal */}
      <Dialog open={isReleaseModalOpen} onOpenChange={setIsReleaseModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex min-w-0 items-center gap-2">
              <ExternalLink className="text-primary h-5 w-5 shrink-0" />
              Release Domain
            </DialogTitle>
            <DialogDescription>
              Release {selectedDomain?.domainname} to a new registrar tag (for
              .uk domains)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="releaseTag">
                {t('domains.details.newRegistrarTag')} *
              </Label>
              <Input
                id="releaseTag"
                placeholder={t('domains.details.registrarTagPlaceholder')}
                value={releaseTag}
                onChange={(e) => setReleaseTag(e.target.value)}
                disabled={isReleasing}
                required
              />
              <p className="text-muted-foreground text-xs">
                Enter the registrar tag of the new registrar where you want to
                transfer the domain.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsReleaseModalOpen(false);
                  setReleaseTag('');
                }}
                disabled={isReleasing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReleaseDomain}
                disabled={isReleasing || !releaseTag.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                {isReleasing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Releasing...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Release Domain
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Domain Status Badge Component
function DomainStatusBadge({ status }: { status: string }) {
  const { t } = useDashboardTranslation();
  const statusLower = status?.toLowerCase() || 'unknown';

  const statusConfig: Record<string, { bg: string; text: string }> = {
    active: {
      bg: 'bg-green-500/10 border-green-500/20',
      text: 'text-green-700 dark:text-green-400',
    },
    pending: {
      bg: 'bg-yellow-500/10 border-yellow-500/20',
      text: 'text-yellow-700 dark:text-yellow-400',
    },
    'pending transfer': {
      bg: 'bg-blue-500/10 border-blue-500/20',
      text: 'text-blue-700 dark:text-blue-400',
    },
    expired: {
      bg: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-700 dark:text-red-400',
    },
    cancelled: {
      bg: 'bg-gray-500/10 border-gray-500/20',
      text: 'text-gray-700 dark:text-gray-400',
    },
    fraud: {
      bg: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-700 dark:text-red-400',
    },
  };

  const config = statusConfig[statusLower] || statusConfig.pending;
  const statusKey = statusLower.replace(/\s+/g, '').replace(/-/g, '');
  const label =
    t(`domains.status.${statusKey}`) || t(`domains.status.${statusLower}`);

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
