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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Package,
  Calendar,
  Eye,
  AlertCircle,
  Clock,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ExternalLink,
  Info,
  DollarSign,
  Globe,
  Activity,
  Monitor,
  Mail,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import {

  getServiceDetailsAction,
  getControlPanelLoginAction,
} from '@/actions/service-actions';
import { useDashboardTranslation } from '@/components/DashboardTranslationProvider';
import { WordPressInstaller } from '@/components/dashboard/wordpress/WordPressInstaller';
import { WordPressSSO } from '@/components/dashboard/wordpress/WordPressSSO';
import { WordPressUninstaller } from '@/components/dashboard/wordpress/WordPressUninstaller';

interface Service {
  id: string | number;
  name: string;
  domain?: string;
  groupname?: string;
  recurringamount: string | number;
  currencycode?: string;
  billingcycle?: string;
  regdate: string;
  nextduedate: string;
  status: string;
  [key: string]: any;
}

interface ServicesTableProps {
  services: Service[];
  wpDomains?: string[]; // Optional to avoid breaking other usages if any
}

type SortField =
  | 'name'
  | 'status'
  | 'nextduedate'
  | 'recurringamount'
  | 'regdate';
type SortDirection = 'asc' | 'desc';

export function ServicesTable({
  services: initialServices,
  wpDomains = [],
}: ServicesTableProps) {
  const { t } = useDashboardTranslation();
  const [services] = useState<Service[]>(initialServices);
  // ... (rest of state hooks)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('nextduedate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;

  // ... (existing code for filters, pagination, etc.)

  // Filter services
  const filteredServices = useMemo(() => {
    let filtered = [...services];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.name?.toLowerCase().includes(query) ||
          service.domain?.toLowerCase().includes(query) ||
          service.groupname?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (service) =>
          service.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(
        (service) => service.groupname === categoryFilter
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'name') {
        aValue = (aValue || '').toLowerCase();
        bValue = (bValue || '').toLowerCase();
      } else if (sortField === 'recurringamount') {
        aValue = parseFloat(aValue || 0);
        bValue = parseFloat(bValue || 0);
      } else if (sortField === 'nextduedate' || sortField === 'regdate') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [
    services,
    searchQuery,
    statusFilter,
    categoryFilter,
    sortField,
    sortDirection,
  ]);

  // ... (rest of logic up to return or render)
  // Re-declare variables needed that were skipped in ... above to make the tool call valid if replacing whole function start
  // Actually, I should just replace the interface and component signature and then patch the button rendering part.
  // But wait, replace_file_content needs contiguous block. 
  // I will replace the component start to include prop destructuring.

  // Pagination
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedServices = filteredServices.slice(startIndex, endIndex);

  // ... (useMemo for categories/statuses)
  const categories = useMemo(() => {
    const cats = new Set<string>();
    services.forEach((service) => {
      if (service.groupname) cats.add(service.groupname);
    });
    return Array.from(cats);
  }, [services]);

  const statuses = useMemo(() => {
    const stats = new Set<string>();
    services.forEach((service) => {
      if (service.status) stats.add(service.status.toLowerCase());
    });
    return Array.from(stats);
  }, [services]);

  // Helper functions
  const isExpiringSoon = (nextDueDate: string): boolean => {
    const dueDate = new Date(nextDueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  // ... (handleSort, handleViewService, handleControlPanel, SortButton, return JSX start)
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const handleViewService = async (service: Service) => {
    setSelectedService(service);
    setIsDetailModalOpen(true);

    // Fetch latest service details
    try {
      const result = await getServiceDetailsAction(service.id);
      if (result.success && result.data) {
        setSelectedService(result.data as Service);
      }
    } catch (error) {
      console.error('Failed to fetch service details:', error);
    }
  };

  const handleControlPanel = async (service: Service) => {
    // Open a new tab immediately to avoid popup blockers
    const newWindow = window.open('', '_blank');

    // Set a loading state in the new tab
    if (newWindow) {
      newWindow.document.write(`
              <html>
                  <head>
                      <title>Connecting to Control Panel...</title>
                      <style>
                          body { font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb; color: #111827; }
                          .loader { border: 4px solid #e5e7eb; border-top: 4px solid #8B5CF6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
                          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                          h2 { margin-bottom: 8px; }
                          p { color: #6b7280; }
                      </style>
                  </head>
                  <body>
                      <div class="loader"></div>
                      <h2>Connecting to Control Panel</h2>
                      <p>Please wait while we redirect you to Plesk...</p>
                  </body>
              </html>
          `);
    }

    toast.info('Opening control panel...');

    try {
      const result = await getControlPanelLoginAction(service.id);

      if (result.success && result.loginUrl) {
        if (newWindow) {
          newWindow.location.href = result.loginUrl;
        } else {
          // Fallback if window failed to open (rare but possible)
          window.open(result.loginUrl, '_blank', 'noopener,noreferrer');
        }
        toast.success('Control panel opened successfully');
      } else {
        if (newWindow) newWindow.close();
        toast.error(result.error || 'Failed to access control panel', {
          description: 'Please contact support if this issue persists.',
        });
      }
    } catch (error: any) {
      if (newWindow) newWindow.close();
      toast.error('Failed to access control panel', {
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };


  return (
    <>
      <Card>
        <CardHeader>
          {/* ... Header content ... */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">
                {t('services.table.activeProducts')}
              </CardTitle>
              <CardDescription className="mt-1">
                {t('services.table.activeProductsDesc')}
              </CardDescription>
            </div>
            <Link href="/dashboard/services/order">
              <Button className="bg-primary hover:bg-primary/90">
                <Package className="mr-2 h-4 w-4" />
                {t('services.table.orderNewService')}
              </Button>
            </Link>
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
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border-input focus:ring-ring h-9 rounded-md border bg-transparent px-3 py-1 text-sm focus:ring-2 focus:outline-none"
            >
              <option value="all">{t('services.table.allStatus')}</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {t(`services.status.${status.toLowerCase()}`)}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border-input focus:ring-ring h-9 rounded-md border bg-transparent px-3 py-1 text-sm focus:ring-2 focus:outline-none"
            >
              <option value="all">{t('services.table.allCategories')}</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Results count */}
          <div className="text-muted-foreground text-sm">
            {t('services.table.showingResults', {
              start: String(startIndex + 1),
              end: String(Math.min(endIndex, filteredServices.length)),
              total: String(filteredServices.length),
            })}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedServices.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <div className="bg-primary/10 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full">
                <Server className="text-primary h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                {t('services.table.noServicesFound')}
              </h3>
              <p className="text-muted-foreground mx-auto mb-6 max-w-sm">
                {searchQuery ||
                  statusFilter !== 'all' ||
                  categoryFilter !== 'all'
                  ? t('services.table.adjustFilters')
                  : t('services.empty')}
              </p>
              {!searchQuery &&
                statusFilter === 'all' &&
                categoryFilter === 'all' && (
                  <Link href="/dashboard/services/order">
                    <Button className="bg-primary hover:bg-primary/90">
                      <Package className="mr-2 h-4 w-4" />
                      {t('services.table.browsePlans')}
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
                          field="name"
                          currentSortField={sortField}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                        >
                          {t('services.table.product')}
                        </SortButton>
                      </TableHead>
                      <TableHead className="font-semibold">
                        {t('services.table.category')}
                      </TableHead>
                      <TableHead className="font-semibold">
                        <SortButton<SortField>
                          field="recurringamount"
                          currentSortField={sortField}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                        >
                          {t('services.table.pricing')}
                        </SortButton>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <SortButton<SortField>
                          field="regdate"
                          currentSortField={sortField}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                        >
                          {t('services.table.registration')}
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
                    {paginatedServices.map((service) => {
                      const expiring = isExpiringSoon(service.nextduedate);
                      const isInstalled = service.domain && wpDomains.includes(service.domain.toLowerCase());

                      return (
                        <TableRow
                          key={service.id}
                          className={`group hover:bg-muted/30 transition-colors ${expiring ? 'bg-orange-50/50 dark:bg-orange-950/10' : ''}`}
                        >
                          <TableCell className="py-4">
                            <div className="flex items-start gap-3">
                              <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                                <Server className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="text-foreground group-hover:text-primary font-semibold transition-colors">
                                  {service.name}
                                </div>
                                <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-sm">
                                  <span className="bg-muted-foreground/40 inline-block h-1.5 w-1.5 rounded-full"></span>
                                  {service.domain || 'No domain assigned'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <ProductCategory productGroup={service.groupname} />
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-baseline gap-1">
                              <span className="text-foreground text-lg font-bold">
                                {service.recurringamount}
                              </span>
                              <span className="text-muted-foreground text-sm">
                                {service.currencycode}
                              </span>
                            </div>
                            <div className="text-muted-foreground mt-0.5 text-xs capitalize">
                              {service.billingcycle
                                ?.replace(/([A-Z])/g, ' $1')
                                .trim()}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="text-muted-foreground h-4 w-4" />
                              <span className="font-medium">
                                {service.regdate}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="text-muted-foreground h-4 w-4" />
                              <span className="font-medium">
                                {service.nextduedate}
                              </span>
                            </div>
                            {expiring && (
                              <div className="mt-1 flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                                <AlertCircle className="h-3 w-3" />
                                Expiring soon
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <StatusBadge status={service.status} />
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0 cursor-pointer"
                                >
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                {service.status?.toLowerCase() === 'active' ? (
                                  <DropdownMenuItem onClick={() => handleViewService(service)} className="cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem disabled>
                                    <Eye className="mr-2 h-4 w-4 opacity-50" />
                                    View Details
                                  </DropdownMenuItem>
                                )}
                                {service.status?.toLowerCase() === 'active' ? (
                                  <DropdownMenuItem onClick={() => handleControlPanel(service)} className="cursor-pointer">
                                    <Monitor className="mr-2 h-4 w-4" />
                                    Control Panel
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem disabled>
                                    <Monitor className="mr-2 h-4 w-4 opacity-50" />
                                    Control Panel
                                  </DropdownMenuItem>
                                )}
                                {(String(service.gid) === (process.env.NEXT_PUBLIC_EMAIL_SERVICE_GID || '5') || service.groupname === 'Email Service') && (
                                  service.status?.toLowerCase() === 'active' ? (
                                    <DropdownMenuItem asChild className="cursor-pointer">
                                      <Link href={`/dashboard/services/${service.id}/email`}>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Manage Email
                                      </Link>
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem disabled>
                                      <Mail className="mr-2 h-4 w-4 opacity-50" />
                                      Manage Email
                                    </DropdownMenuItem>
                                  )
                                )}
                                {(service.groupname === 'Shared Hosting' || service.groupname === 'WordPress Hosting' || service.groupname === 'Web Hosting') && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <WordPressSSO
                                      serviceId={service.id}
                                      mode="menu-item"
                                      disabled={service.status?.toLowerCase() !== 'active' || !isInstalled}
                                    />
                                    <WordPressInstaller
                                      serviceId={service.id}
                                      domain={service.domain || ''}
                                      mode="menu-item"
                                      disabled={service.status?.toLowerCase() !== 'active' || !!isInstalled}
                                    />
                                    <WordPressUninstaller
                                      serviceId={service.id}
                                      domain={service.domain || ''}
                                      mode="menu-item"
                                      disabled={service.status?.toLowerCase() !== 'active' || !isInstalled}
                                    />
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
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

      {/* Service Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle className="flex min-w-0 items-center gap-2">
                  <Server className="text-primary h-5 w-5" />
                  {selectedService.name}
                </DialogTitle>
                <DialogDescription>
                  Complete service details and information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-sm font-medium">
                      Status
                    </div>
                    <StatusBadge status={selectedService.status} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-sm font-medium">
                      Category
                    </div>
                    <ProductCategory productGroup={selectedService.groupname} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-sm font-medium">
                      Domain
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="text-muted-foreground h-4 w-4" />
                      <span>
                        {selectedService.domain || 'No domain assigned'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-sm font-medium">
                      Service ID
                    </div>
                    <div className="font-mono text-sm">
                      {selectedService.id}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-sm font-medium">
                      Pricing
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold">
                        {selectedService.recurringamount}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {selectedService.currencycode}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-xs capitalize">
                      {selectedService.billingcycle
                        ?.replace(/([A-Z])/g, ' $1')
                        .trim()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-sm font-medium">
                      Billing Cycle
                    </div>
                    <div className="capitalize">
                      {selectedService.billingcycle
                        ?.replace(/([A-Z])/g, ' $1')
                        .trim() || 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-sm font-medium">
                      Registration Date
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-muted-foreground h-4 w-4" />
                      <span>{selectedService.regdate}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-sm font-medium">
                      Next Due Date
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-muted-foreground h-4 w-4" />
                      <span>{selectedService.nextduedate}</span>
                      {isExpiringSoon(selectedService.nextduedate) && (
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
                {selectedService.notes && (
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-sm font-medium">
                      Notes
                    </div>
                    <div className="bg-muted rounded-md p-3 text-sm">
                      {selectedService.notes}
                    </div>
                  </div>
                )}

                {/* WordPress Tools */}
                {(selectedService.groupname === 'Shared Hosting' || selectedService.groupname === 'WordPress Hosting' || selectedService.groupname === 'Web Hosting') && (
                  <div className="space-y-2 pt-4 border-t">
                    <div className="text-sm font-medium">WordPress Tools</div>
                    <div className="flex flex-wrap gap-2">
                      <WordPressInstaller
                        serviceId={selectedService.id}
                        domain={selectedService.domain || ''}
                        disabled={selectedService.status?.toLowerCase() !== 'active' || !!(selectedService.domain && wpDomains.includes(selectedService.domain.toLowerCase()))}
                      />
                      <WordPressSSO
                        serviceId={selectedService.id}
                        disabled={selectedService.status?.toLowerCase() !== 'active' || !!!(selectedService.domain && wpDomains.includes(selectedService.domain.toLowerCase()))}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleControlPanel(selectedService)}
                    className="flex-1"
                  >
                    <Monitor className="mr-2 h-4 w-4" />
                    Control Panel
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog >
    </>
  );
}

// Helper component for product category badges
function ProductCategory({ productGroup }: { productGroup?: string }) {
  const category = productGroup || 'Other';

  const categoryConfig: Record<
    string,
    { bg: string; text: string; icon: any }
  > = {
    'Shared Hosting': {
      bg: 'bg-blue-500/10 border-blue-500/20',
      text: 'text-blue-700 dark:text-blue-400',
      icon: Server,
    },
    VPS: {
      bg: 'bg-purple-500/10 border-purple-500/20',
      text: 'text-purple-700 dark:text-purple-400',
      icon: Server,
    },
    'Dedicated Server': {
      bg: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-700 dark:text-red-400',
      icon: Server,
    },
    'Reseller Hosting': {
      bg: 'bg-green-500/10 border-green-500/20',
      text: 'text-green-700 dark:text-green-400',
      icon: Package,
    },
  };

  const config = categoryConfig[category] || {
    bg: 'bg-gray-500/10 border-gray-500/20',
    text: 'text-gray-700 dark:text-gray-400',
    icon: Package,
  };

  return (
    <Badge
      variant="outline"
      className={`${config.bg} ${config.text} border px-2 py-0.5 text-xs font-medium`}
    >
      {category}
    </Badge>
  );
}

// Helper component for status badges
function StatusBadge({ status }: { status: string }) {
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
    suspended: {
      bg: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-700 dark:text-red-400',
    },
    terminated: {
      bg: 'bg-gray-500/10 border-gray-500/20',
      text: 'text-gray-700 dark:text-gray-400',
    },
    cancelled: {
      bg: 'bg-gray-500/10 border-gray-500/20',
      text: 'text-gray-700 dark:text-gray-400',
    },
  };

  const config = statusConfig[statusLower] || statusConfig.pending;
  const label = t(`services.status.${statusLower}`);

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
