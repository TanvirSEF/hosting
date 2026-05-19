'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SortButton } from '@/components/ui/sort-button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FileText,
  Download,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  Eye,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ExternalLink,
  Receipt,
  Building2,
  Mail,
  Phone,
  MapPin,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getInvoiceDetailsAction,
  getInvoicePdfAction,
  initiatePaymentAction,
  getPaymentHistoryAction,
  getInvoicePaymentUrlAction,
  deleteInvoiceAction
} from '@/actions/invoice-actions'
import { PaymentModal } from '@/components/payment-modal'
import { useDashboardTranslation } from '@/components/DashboardTranslationProvider'
import { formatCurrency, formatCurrencyWithSymbol, getCurrencyPrefixSuffix } from '@/lib/currency-utils'
import { useCurrency } from '@/contexts/CurrencyContext'
import type { GA4UserInfo } from '@/lib/ga4'

interface Invoice {
  id: string | number
  invoicenum?: string
  date: string
  duedate: string
  total: string | number
  status: string
  subtotal?: string | number
  tax?: string | number
  credit?: string | number
  [key: string]: any
}

interface InvoicesTableProps {
  invoices: Invoice[]
}

type SortField = 'invoicenum' | 'date' | 'duedate' | 'total' | 'status'
type SortDirection = 'asc' | 'desc'

export function InvoicesTable({ invoices: initialInvoices }: InvoicesTableProps) {
  const { t } = useDashboardTranslation()
  const { formatPrice } = useCurrency()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [isLoadingPaymentHistory, setIsLoadingPaymentHistory] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedPaymentInvoice, setSelectedPaymentInvoice] = useState<Invoice | null>(null)
  const [highlightedInvoiceId, setHighlightedInvoiceId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null)
  const [isDeletingInvoice, setIsDeletingInvoice] = useState(false)
  const itemsPerPage = 10

  // GA4: Fetch user info once for payment tracking
  const [ga4UserInfo, setGa4UserInfo] = useState<GA4UserInfo | undefined>(undefined)
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { checkUserLoginStatus, getUserFullProfile } = await import('@/actions/domain-order-actions')
        const loginStatus = await checkUserLoginStatus()
        if (loginStatus.isLoggedIn) {
          const profile = await getUserFullProfile()
          setGa4UserInfo({
            user_id: loginStatus.userId || undefined,
            user_email: loginStatus.userEmail || undefined,
            user_name: loginStatus.userName || undefined,
            user_phone: profile?.phone || undefined,
            user_address: profile?.address1 || undefined,
            user_city: profile?.city || undefined,
            user_country: profile?.country || undefined,
          })
        }
      } catch {
        // Non-critical — tracking will still work, just without user info
      }
    }
    fetchUserInfo()
  }, [])

  const toAmount = (value: string | number | undefined | null) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0
    const parsed = parseFloat(String(value || '0'))
    return Number.isFinite(parsed) ? parsed : 0
  }

  /**
   * Format an invoice amount using the invoice's native currency from WHMCS.
   * No conversion is performed - WHMCS already provides amounts in the correct currency.
   * Note: We only use prefix for cleaner display (e.g., "€2.97" not "€2.97EURO")
   */
  const formatInvoiceAmount = (
    amount: string | number | undefined | null,
    invoiceLike?: any
  ) => {
    const source = invoiceLike || selectedInvoice || {}
    const rawAmount = toAmount(amount)

    // Get the invoice's native currency prefix from WHMCS
    let prefix = source.currencyprefix || source.currencyPrefix || ''
    const code = source.currencycode || source.currencyCode || 'USD'

    // If prefix not provided, derive from currency code
    if (!prefix) {
      const derived = getCurrencyPrefixSuffix(code)
      prefix = derived.prefix
    }

    // Format with the invoice's native currency (no conversion, no suffix)
    const formattedAmount = rawAmount.toFixed(2)

    if (prefix) {
      return `${prefix}${formattedAmount}`
    }
    return formattedAmount
  }

  // Handle invoice highlight from URL parameter
  useEffect(() => {
    const invoiceId = searchParams.get('invoice')
    const highlight = searchParams.get('highlight')

    if (invoiceId && highlight === 'true') {
      setHighlightedInvoiceId(invoiceId)

      // Find and scroll to the invoice
      setTimeout(() => {
        const invoiceRow = document.getElementById(`invoice-${invoiceId}`)
        if (invoiceRow) {
          invoiceRow.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Remove highlight after 3 seconds
          setTimeout(() => {
            setHighlightedInvoiceId(null)
            // Clean URL
            router.replace('/dashboard/billing', { scroll: false })
          }, 3000)
        }
      }, 100)
    }
  }, [searchParams, router])

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    let filtered = [...invoices]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(invoice =>
        String(invoice.invoicenum || invoice.id).toLowerCase().includes(query) ||
        String(invoice.total).toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice =>
        invoice.status?.toLowerCase() === statusFilter.toLowerCase()
      )
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === 'invoicenum') {
        aValue = String(aValue || a.id).toLowerCase()
        bValue = String(bValue || b.id).toLowerCase()
      } else if (sortField === 'total') {
        aValue = parseFloat(aValue || 0)
        bValue = parseFloat(bValue || 0)
      } else if (sortField === 'date' || sortField === 'duedate') {
        aValue = new Date(aValue || 0).getTime()
        bValue = new Date(bValue || 0).getTime()
      } else if (sortField === 'status') {
        aValue = (aValue || '').toLowerCase()
        bValue = (bValue || '').toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [invoices, searchQuery, statusFilter, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex)

  // Get unique statuses
  const statuses = useMemo(() => {
    const stats = new Set<string>()
    invoices.forEach(invoice => {
      if (invoice.status) stats.add(invoice.status.toLowerCase())
    })
    return Array.from(stats)
  }, [invoices])

  // Helper functions
  const isOverdue = (dueDate: string, status: string): boolean => {
    if (status.toLowerCase() !== 'unpaid') return false
    const due = new Date(dueDate)
    const today = new Date()
    return due < today
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
    setCurrentPage(1)
  }

  const handleViewInvoice = async (invoice: Invoice) => {
    // Set initial invoice data (has currency info from GetInvoices API)
    setSelectedInvoice(invoice)
    setIsDetailModalOpen(true)
    setIsLoadingInvoice(true)

    try {
      const result = await getInvoiceDetailsAction(invoice.id)
      if (result.success && result.data) {
        // Merge detailed data with original currency info
        // IMPORTANT: Use original invoice's currency info (from GetInvoices API)
        // The GetInvoices API returns correct currency fields, but GetInvoice returns null
        setSelectedInvoice({
          ...result.data,
          // Preserve the id field (WHMCS returns invoiceid, but we use id)
          id: result.data.invoiceid || invoice.id,
          // Always prefer original invoice's currency info from GetInvoices API
          currencycode: invoice.currencycode || result.data.currencycode,
          currencyprefix: invoice.currencyprefix || result.data.currencyprefix,
          currencysuffix: invoice.currencysuffix || result.data.currencysuffix,
          currencyid: invoice.currencyid || result.data.currencyid,
        })

        // Load payment history for this invoice
        setIsLoadingPaymentHistory(true)
        const historyResult = await getPaymentHistoryAction(invoice.id)
        if (historyResult.success && historyResult.data) {
          setPaymentHistory(historyResult.data)
        }
        setIsLoadingPaymentHistory(false)
      }
    } catch (error) {
      console.error('Failed to fetch invoice details:', error)
    } finally {
      setIsLoadingInvoice(false)
    }
  }

  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      toast.info('Generating PDF...')

      const { generateInvoicePDF } = await import('@/lib/pdf-generator')
      const result = await generateInvoicePDF(invoice.id)

      if (result.success) {
        toast.success('Invoice PDF downloaded!')
      } else {
        toast.error(result.error || 'Failed to generate PDF')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate PDF')
    }
  }

  // Sync state with props
  useEffect(() => {
    setInvoices(initialInvoices)
  }, [initialInvoices])

  const handlePayNow = async (invoice: Invoice) => {
    // Open payment modal instead of redirecting to WHMCS
    setSelectedPaymentInvoice(invoice)
    setIsPaymentModalOpen(true)
  }

  // Handle pay_invoice param from URL (e.g. from One-Click Order)
  useEffect(() => {
    const payInvoiceId = searchParams.get('pay_invoice')
    if (payInvoiceId && invoices.length > 0) {
      const invoice = invoices.find(i => String(i.id) === payInvoiceId || String(i.invoiceid) === payInvoiceId)
      if (invoice) {
        // slight delay to ensure modal logic works
        setTimeout(() => {
          handlePayNow(invoice)
          // Clean URL
          const params = new URLSearchParams(searchParams.toString())
          params.delete('pay_invoice')
          router.replace(`/dashboard/billing?${params.toString()}`, { scroll: false })
        }, 500)
      }
    }
  }, [searchParams, invoices, router])

  const handlePaymentSuccess = () => {
    // Refresh the page to show updated invoice status
    window.location.reload()
  }

  const handlePayAllUnpaid = async () => {
    const unpaidInvoices = invoices.filter((i: any) => i.status?.toLowerCase() === 'unpaid')
    if (unpaidInvoices.length === 0) {
      toast.info('No unpaid invoices to pay')
      return
    }

    if (unpaidInvoices.length === 1) {
      // Single unpaid invoice - pay it directly
      await handlePayNow(unpaidInvoices[0])
    } else {
      // Multiple unpaid invoices - show info and pay the first one
      toast.info('Multiple Unpaid Invoices', {
        description: `You have ${unpaidInvoices.length} unpaid invoices. Paying the oldest one first.`,
      })
      // Pay the first (oldest) unpaid invoice
      await handlePayNow(unpaidInvoices[0])
    }
  }

  const handleDeleteInvoice = async (invoice: Invoice) => {
    setInvoiceToDelete(invoice)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return

    setIsDeletingInvoice(true)
    try {
      const result = await deleteInvoiceAction(invoiceToDelete.id)
      if (result.success) {
        toast.success('Invoice deleted successfully')
        // Remove from local state
        setInvoices(invoices.filter(inv => inv.id !== invoiceToDelete.id))
        setIsDeleteDialogOpen(false)
        setInvoiceToDelete(null)
      } else {
        toast.error(result.error || 'Failed to delete invoice')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete invoice')
    } finally {
      setIsDeletingInvoice(false)
    }
  }


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">{t('billing.table.invoiceHistory')}</CardTitle>
              <CardDescription className="mt-1">
                {t('billing.table.invoiceHistoryDesc')}
              </CardDescription>
            </div>
            {invoices.filter((i: any) => i.status?.toLowerCase() === 'unpaid').length > 0 && (
              <Button
                onClick={handlePayAllUnpaid}
                className="bg-primary hover:bg-primary/90"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {t('billing.table.payAllUnpaid')}
              </Button>
            )}
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col gap-3 pt-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('billing.table.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">{t('billing.table.allStatus')}</option>
              {statuses.map(status => (
                <option key={status} value={status}>
                  {t(`billing.status.${status.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            {t('billing.table.showingResults', {
              start: String(startIndex + 1),
              end: String(Math.min(endIndex, filteredInvoices.length)),
              total: String(filteredInvoices.length)
            })}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedInvoices.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Invoices Found</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'You don\'t have any invoices yet. Invoices will appear here when you make purchases.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold">
                        <SortButton<SortField> field="invoicenum" currentSortField={sortField} sortDirection={sortDirection} onSort={handleSort}>{t('billing.table.invoiceId')}</SortButton>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <SortButton<SortField> field="date" currentSortField={sortField} sortDirection={sortDirection} onSort={handleSort}>{t('billing.table.date')}</SortButton>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <SortButton<SortField> field="duedate" currentSortField={sortField} sortDirection={sortDirection} onSort={handleSort}>{t('billing.table.dueDate')}</SortButton>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <SortButton<SortField> field="total" currentSortField={sortField} sortDirection={sortDirection} onSort={handleSort}>{t('billing.table.amount')}</SortButton>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <SortButton<SortField> field="status" currentSortField={sortField} sortDirection={sortDirection} onSort={handleSort}>{t('billing.table.status')}</SortButton>
                      </TableHead>
                      <TableHead className="text-right font-semibold">{t('billing.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInvoices.map((invoice) => {
                      const overdue = isOverdue(invoice.duedate, invoice.status)
                      const unpaid = invoice.status?.toLowerCase() === 'unpaid'

                      const isHighlighted = highlightedInvoiceId === String(invoice.id) || highlightedInvoiceId === String(invoice.invoicenum)

                      return (
                        <TableRow
                          id={`invoice-${invoice.id}`}
                          key={invoice.id}
                          className={`group hover:bg-muted/30 transition-colors ${overdue ? 'bg-red-50/50 dark:bg-red-950/10' : ''
                            } ${isHighlighted ? 'bg-primary/20 border-l-4 border-l-primary animate-pulse' : ''
                            }`}
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">
                                  #{invoice.invoicenum || invoice.invoiceid || invoice.id}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  ID: {invoice.invoiceid || invoice.id}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{invoice.date}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{invoice.duedate}</span>
                            </div>
                            {overdue && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-red-600 dark:text-red-400">
                                <AlertCircle className="h-3 w-3" />
                                Overdue
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-bold text-foreground">
                                {formatInvoiceAmount(invoice.total, invoice)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <InvoiceStatusBadge status={invoice.status} />
                          </TableCell>
                          <TableCell className="text-right py-4">
                            <div className="flex items-center justify-end gap-1">
                              {unpaid && (
                                <Button
                                  size="sm"
                                  onClick={() => handlePayNow(invoice)}
                                  className="bg-primary hover:bg-primary/90 h-8 text-xs px-3"
                                >
                                  <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                                  Pay
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewInvoice(invoice)}
                                className="hover:bg-primary/10 hover:text-primary transition-colors h-8 px-2"
                                title="View Invoice"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownloadPdf(invoice)}
                                className="hover:bg-blue-500/10 hover:text-blue-600 transition-colors h-8 px-2"
                                title="Download PDF"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                              {invoice.status?.toLowerCase() !== 'paid' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteInvoice(invoice)}
                                  className="hover:bg-red-500/10 hover:text-red-600 transition-colors h-8 px-2"
                                  title="Delete Invoice"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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

      {/* Invoice Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={(open) => {
        setIsDetailModalOpen(open)
        if (!open) {
          setSelectedInvoice(null)
          setPaymentHistory([])
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedInvoice && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl min-w-0">
                  <Receipt className="h-5 w-5 text-primary shrink-0" />
                  <span className="break-words min-w-0">Invoice #{selectedInvoice.invoicenum || selectedInvoice.invoiceid || selectedInvoice.id}</span>
                </DialogTitle>
                <DialogDescription>
                  Invoice details and payment information
                </DialogDescription>
              </DialogHeader>

              {isLoadingInvoice ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4 min-w-0">
                  {/* Status and Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Status</div>
                      <InvoiceStatusBadge status={selectedInvoice.status} />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Invoice Date</div>
                      <div className="text-sm font-medium">{selectedInvoice.date || selectedInvoice.invoicedate}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Due Date</div>
                      <div className="text-sm font-medium">{selectedInvoice.duedate}</div>
                    </div>
                  </div>

                  {/* Invoice Items */}
                  {selectedInvoice.items?.item && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Items
                      </h3>
                      <div className="space-y-2">
                        {(() => {
                          // Safely extract items array
                          const rawItems = selectedInvoice.items?.item
                            ? (Array.isArray(selectedInvoice.items.item) ? selectedInvoice.items.item : [selectedInvoice.items.item])
                            : [];

                          const displayItems = rawItems.filter((item: any) => {
                            const desc = (item.description || '').toLowerCase();
                            const amount = parseFloat(item.amount || '0');

                            // Always show non-zero items (ignoring tiny rounding errors)
                            if (amount >= 0.01) return true;

                            // Hide $0 WHMCS product configoption items (Addon Domains, Sub Domains, etc.)
                            if (amount === 0 && (
                              desc.includes('addon domains') ||
                              desc.includes('sub domains') ||
                              desc.includes('subdomains') ||
                              desc.includes('addon domain')
                            )) return false;

                            // Hide $0 items that look like WHMCS breakdown lines (contain " - ")
                            if (amount === 0 && desc.includes(' - ')) return false;

                            return true;
                          }); if (displayItems.length === 0) return <div className="text-sm text-muted-foreground italic">No visible items</div>;

                          return displayItems.map((item: any, index: number) => (
                            <div key={index} className="flex flex-col sm:flex-row sm:justify-between gap-2 py-2 border-b last:border-0">
                              <span className="text-sm break-words min-w-0 flex-1">{item.description || item.type}</span>
                              <span className="text-sm font-medium whitespace-nowrap sm:ml-4">
                                {formatInvoiceAmount(item.amount, selectedInvoice)}
                              </span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Payment Summary */}
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="space-y-2">
                      {selectedInvoice.subtotal && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>
                            {formatInvoiceAmount(selectedInvoice.subtotal, selectedInvoice)}
                          </span>
                        </div>
                      )}
                      {selectedInvoice.tax && parseFloat(selectedInvoice.tax) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tax</span>
                          <span>
                            {formatInvoiceAmount(selectedInvoice.tax, selectedInvoice)}
                          </span>
                        </div>
                      )}
                      {selectedInvoice.discount && parseFloat(selectedInvoice.discount) > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount</span>
                          <span>
                            -{formatInvoiceAmount(selectedInvoice.discount, selectedInvoice)}
                          </span>
                        </div>
                      )}
                      {selectedInvoice.credit && parseFloat(selectedInvoice.credit) > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Credit</span>
                          <span>
                            -{formatInvoiceAmount(selectedInvoice.credit, selectedInvoice)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t font-bold text-lg">
                        <span>Total</span>
                        <span>
                          {formatInvoiceAmount(selectedInvoice.total, selectedInvoice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment History */}
                  {paymentHistory.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Payments
                      </h3>
                      <div className="space-y-2">
                        {paymentHistory.map((payment: any, index: number) => (
                          <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2 border-b last:border-0">
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium break-words">{payment.date || 'N/A'}</div>
                              <div className="text-xs text-muted-foreground break-words">{payment.gateway || 'Payment'}</div>
                            </div>
                            <div className="text-sm font-semibold text-green-600 whitespace-nowrap sm:ml-4">
                              {formatInvoiceAmount(
                                payment.amountin || payment.amount || '0.00',
                                selectedInvoice
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {selectedInvoice.status?.toLowerCase() === 'unpaid' && (
                      <Button
                        onClick={() => {
                          setIsDetailModalOpen(false)
                          handlePayNow(selectedInvoice)
                        }}
                        className="flex-1 bg-primary hover:bg-primary/90"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay Now
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadPdf(selectedInvoice)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      {selectedPaymentInvoice && (
        <PaymentModal
          open={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
          invoiceId={selectedPaymentInvoice.id}
          invoiceNum={selectedPaymentInvoice.invoicenum}
          amount={parseFloat(String(selectedPaymentInvoice.total || 0))}
          currency={
            selectedPaymentInvoice.currencycode ||
            selectedPaymentInvoice.currency
          }
          currencyprefix={selectedPaymentInvoice.currencyprefix}
          currencysuffix={selectedPaymentInvoice.currencysuffix}
          onSuccess={handlePaymentSuccess}
          userInfo={ga4UserInfo}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Delete Invoice
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {invoiceToDelete && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-2">
                  Invoice #{invoiceToDelete.invoicenum || invoiceToDelete.id}
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(
                    typeof invoiceToDelete.total === 'string' ? parseFloat(invoiceToDelete.total) : invoiceToDelete.total,
                    {
                      currencyprefix: invoiceToDelete.currencyprefix ?? '',
                      currencysuffix: invoiceToDelete.currencysuffix ?? '',
                      currencycode: invoiceToDelete.currencycode ?? '',
                    }
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Due: {invoiceToDelete.duedate}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isDeletingInvoice}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteInvoice}
                  disabled={isDeletingInvoice}
                  className="flex-1"
                >
                  {isDeletingInvoice ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Invoice
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// Invoice Status Badge Component
function InvoiceStatusBadge({ status }: { status: string }) {
  const { t } = useDashboardTranslation()
  const statusLower = status?.toLowerCase() || 'unknown'

  const statusConfig: Record<string, { bg: string; text: string; icon?: any }> = {
    paid: {
      bg: 'bg-green-500/10 border-green-500/20',
      text: 'text-green-700 dark:text-green-400',
      icon: CheckCircle2
    },
    unpaid: {
      bg: 'bg-orange-500/10 border-orange-500/20',
      text: 'text-orange-700 dark:text-orange-400',
      icon: Clock
    },
    cancelled: {
      bg: 'bg-gray-500/10 border-gray-500/20',
      text: 'text-gray-700 dark:text-gray-400',
      icon: XCircle
    },
    refunded: {
      bg: 'bg-blue-500/10 border-blue-500/20',
      text: 'text-blue-700 dark:text-blue-400'
    },
    collections: {
      bg: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-700 dark:text-red-400',
      icon: AlertCircle
    },
  }

  const config = statusConfig[statusLower] || statusConfig.unpaid
  const Icon = config.icon
  const label = t(`billing.status.${statusLower}`)

  return (
    <Badge
      variant="outline"
      className={`${config.bg} ${config.text} border font-medium px-2.5 py-0.5 flex items-center gap-1 w-fit`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </Badge>
  )
}
