'use client'

import { useState, useMemo, useEffect } from 'react'
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
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  FileText,
  Eye,
  Calendar,
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
  DollarSign,
  CreditCard,
  Mail,
  Trash2,
  Clock,
  AlertTriangle,
  Receipt
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, getCurrencyPrefixSuffix } from '@/lib/currency-utils'
import {
  getInvoiceDetailsAction,
  updateInvoiceAction,
  markInvoiceAsPaidAction,
  addPaymentAction,
  sendInvoiceEmailAction,
  deleteInvoiceAction,
  getPaymentHistoryAction,
  getInvoicePdfAction,
  getAllClientsAction,
  getClientNameAction
} from '@/actions/admin-invoice-actions'
import { useAdminTranslation } from '@/components/AdminTranslationProvider'
import { useCurrency } from '@/contexts/CurrencyContext'

interface Invoice {
  id: string | number
  invoicenum?: string
  userid: string | number
  date: string
  duedate: string
  total: string | number
  status: string
  paymentmethod?: string
  [key: string]: any
}

interface InvoicesTableProps {
  invoices: Invoice[]
}

type SortField = 'id' | 'invoicenum' | 'client' | 'date' | 'duedate' | 'total' | 'status'
type SortDirection = 'asc' | 'desc'

export function InvoicesTable({ invoices: initialInvoices }: InvoicesTableProps) {
  const { t } = useAdminTranslation()
  const [invoices] = useState<Invoice[]>(initialInvoices)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('id')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientNames, setClientNames] = useState<Record<string | number, string>>({})
  const [allClients, setAllClients] = useState<any[]>([])
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const itemsPerPage = 10

  // Get currency formatting function (no conversion - WHMCS provides native prices)
  const { formatPrice } = useCurrency()

  // Fetch client names and clients list
  useEffect(() => {
    async function fetchClientData() {
      // Get all clients for filter
      const clientsResult = await getAllClientsAction()
      if (clientsResult.success) {
        setAllClients(clientsResult.data || [])
      }

      // Get client names for invoices
      const uniqueClientIds = [...new Set(invoices.map(i => i.userid))]
      const namePromises = uniqueClientIds.map(async (clientId) => {
        const result = await getClientNameAction(clientId)
        if (result.success) {
          return { clientId, name: result.name }
        }
        return { clientId, name: `Client #${clientId}` }
      })

      const names = await Promise.all(namePromises)
      const nameMap: Record<string | number, string> = {}
      names.forEach(({ clientId, name }) => {
        nameMap[clientId] = name || `Client #${clientId}`
      })
      setClientNames(nameMap)
    }

    fetchClientData()
  }, [invoices])

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    let filtered = [...invoices]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(invoice =>
        String(invoice.id).toLowerCase().includes(query) ||
        String(invoice.invoicenum || invoice.id).toLowerCase().includes(query) ||
        clientNames[invoice.userid]?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice =>
        invoice.status?.toLowerCase() === statusFilter.toLowerCase()
      )
    }

    // Client filter
    if (clientFilter !== 'all') {
      filtered = filtered.filter(invoice =>
        String(invoice.userid) === clientFilter
      )
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'id':
          aValue = Number(a.id)
          bValue = Number(b.id)
          break
        case 'invoicenum':
          aValue = String(a.invoicenum || a.id).toLowerCase()
          bValue = String(b.invoicenum || b.id).toLowerCase()
          break
        case 'client':
          aValue = clientNames[a.userid] || String(a.userid)
          bValue = clientNames[b.userid] || String(b.userid)
          break
        case 'date':
          aValue = new Date(a.date).getTime()
          bValue = new Date(b.date).getTime()
          break
        case 'duedate':
          aValue = new Date(a.duedate).getTime()
          bValue = new Date(b.duedate).getTime()
          break
        case 'total':
          aValue = Number(a.total || 0)
          bValue = Number(b.total || 0)
          break
        case 'status':
          aValue = a.status?.toLowerCase() || ''
          bValue = b.status?.toLowerCase() || ''
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [invoices, searchQuery, statusFilter, clientFilter, sortField, sortDirection, clientNames])

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredInvoices.slice(start, start + itemsPerPage)
  }, [filteredInvoices, currentPage, itemsPerPage])

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
    setIsLoadingDetails(true)
    setIsDetailModalOpen(true)
    setSelectedInvoice(invoice)

    try {
      const result = await getInvoiceDetailsAction(invoice.id)
      if (result.success) {
        setSelectedInvoice(result.data)

        // Load payment history
        const historyResult = await getPaymentHistoryAction(invoice.id)
        if (historyResult.success) {
          setPaymentHistory(historyResult.data || [])
        }
      } else {
        toast.error(result.error || t('billing.toast.loadFailed'))
        setIsDetailModalOpen(false)
      }
    } catch (error: any) {
      toast.error(error.message || t('billing.toast.loadFailed'))
      setIsDetailModalOpen(false)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsEditModalOpen(true)
  }

  const handleUpdateInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await updateInvoiceAction(formData)

      if (result.success) {
        toast.success(t('billing.toast.updateSuccess'))
        setIsEditModalOpen(false)
        window.location.reload()
      } else {
        toast.error(result.error || t('billing.toast.updateFailed'))
      }
    } catch (error: any) {
      toast.error(error.message || t('billing.toast.updateFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkAsPaid = async (invoice: Invoice) => {
    try {
      const result = await markInvoiceAsPaidAction(invoice.id)
      if (result.success) {
        toast.success(t('billing.toast.markPaidSuccess'))
        window.location.reload()
      } else {
        toast.error(result.error || t('billing.toast.markPaidFailed'))
      }
    } catch (error: any) {
      toast.error(error.message || t('billing.toast.markPaidFailed'))
    }
  }

  const handleAddPayment = async () => {
    if (!selectedInvoice || !paymentAmount || !paymentMethod) {
      toast.error(t('billing.toast.fillRequired'))
      return
    }

    try {
      const result = await addPaymentAction(
        selectedInvoice.id,
        parseFloat(paymentAmount),
        paymentMethod,
        transactionId.trim() || undefined
      )
      if (result.success) {
        toast.success(t('billing.toast.paymentAdded'))
        setIsAddPaymentModalOpen(false)
        setPaymentAmount('')
        setPaymentMethod('')
        setTransactionId('')
        window.location.reload()
      } else {
        toast.error(result.error || t('billing.toast.paymentFailed'))
      }
    } catch (error: any) {
      toast.error(error.message || t('billing.toast.paymentFailed'))
    }
  }

  const handleSendEmail = async (invoice: Invoice) => {
    try {
      const result = await sendInvoiceEmailAction(invoice.id)
      if (result.success) {
        toast.success(t('billing.toast.emailSent'))
      } else {
        toast.error(result.error || t('billing.toast.emailFailed'))
      }
    } catch (error: any) {
      toast.error(error.message || t('billing.toast.emailFailed'))
    }
  }

  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return

    try {
      const result = await deleteInvoiceAction(selectedInvoice.id)
      if (result.success) {
        toast.success(t('billing.toast.deleteSuccess'))
        setIsDeleteDialogOpen(false)
        window.location.reload()
      } else {
        toast.error(result.error || t('billing.toast.deleteFailed'))
      }
    } catch (error: any) {
      toast.error(error.message || t('billing.toast.deleteFailed'))
    }
  }

  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      toast.info(t('billing.toast.preparingPDF'))
      const result = await getInvoicePdfAction(invoice.id)
      if (result.success && result.pdfUrl) {
        window.open(result.pdfUrl, '_blank')
        toast.success(t('billing.toast.pdfOpened'))
      } else {
        toast.error(result.error || t('billing.toast.pdfFailed'))
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to download invoice PDF')
    }
  }

  const handleExportInvoices = () => {
    // Create CSV content
    const headers = ['Invoice #', 'Client', 'Date', 'Due Date', 'Amount', 'Status', 'Payment Method']
    const rows = filteredInvoices.map(invoice => [
      invoice.invoicenum || invoice.id,
      clientNames[invoice.userid] || `Client #${invoice.userid}`,
      invoice.date,
      invoice.duedate,
      invoice.total,
      invoice.status,
      invoice.paymentmethod || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success(t('billing.toast.exportSuccess'))
  }


  // Get unique values for filters
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(invoices.map(i => i.status).filter(Boolean))
    return Array.from(statuses)
  }, [invoices])

  // Calculate overdue invoices
  const overdueInvoices = useMemo(() => {
    const today = new Date()
    return filteredInvoices.filter(invoice => {
      if (invoice.status?.toLowerCase() !== 'unpaid') return false
      const dueDate = new Date(invoice.duedate)
      return dueDate < today
    }).length
  }, [filteredInvoices])

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">{t('billing.table.title')}</CardTitle>
              <CardDescription className="mt-1">
                {t('billing.table.description')}
                {overdueInvoices > 0 && (
                  <span className="ml-2 text-red-600 font-medium">
                    {t('billing.table.overdueCount', { count: String(overdueInvoices) })}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExportInvoices}
              >
                <Download className="mr-2 h-4 w-4" />
                {t('billing.table.export')}
              </Button>
            </div>
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
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value)
              setCurrentPage(1)
            }}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t('billing.table.allStatuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('billing.table.allStatuses')}</SelectItem>
                {uniqueStatuses.map(status => (
                  <SelectItem key={status} value={status.toLowerCase()}>
                    {t(`billing.status.${status.toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={clientFilter} onValueChange={(value) => {
              setClientFilter(value)
              setCurrentPage(1)
            }}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t('billing.table.allClients')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('billing.table.allClients')}</SelectItem>
                {allClients.map(client => (
                  <SelectItem key={client.id} value={String(client.id)}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedInvoices.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {invoices.length === 0 ? t('billing.table.empty.title') : t('billing.table.empty.noResults')}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {invoices.length === 0
                  ? t('billing.table.empty.description')
                  : t('billing.table.empty.adjustFilters')
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">
                      <SortButton<SortField> field="id" currentSortField={sortField} sortDirection={sortDirection} onSort={handleSort}>{t('billing.table.invoiceId')}</SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField> field="client" currentSortField={sortField} sortDirection={sortDirection} onSort={handleSort}>{t('billing.table.client')}</SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField> field="date" currentSortField={sortField} sortDirection={sortDirection} onSort={handleSort}>{t('billing.table.date')}</SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField> field="duedate" currentSortField={sortField} sortDirection={sortDirection} onSort={handleSort}>{t('billing.table.dueDate')}</SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField> field="total" currentSortField={sortField} sortDirection={sortDirection} onSort={handleSort}>{t('billing.table.total')}</SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField> field="status" currentSortField={sortField} sortDirection={sortDirection} onSort={handleSort}>{t('billing.table.status')}</SortButton>
                    </TableHead>
                    <TableHead className="text-right font-semibold">{t('billing.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInvoices.map((invoice: Invoice) => {
                    const isOverdue = invoice.status?.toLowerCase() === 'unpaid' &&
                      new Date(invoice.duedate) < new Date()
                    const isUnpaid = invoice.status?.toLowerCase() === 'unpaid'

                    return (
                      <TableRow
                        key={invoice.id}
                        className="group hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                #{invoice.invoicenum || invoice.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">
                                {clientNames[invoice.userid] || `Client #${invoice.userid}`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ID: {invoice.userid}
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
                            <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                              {invoice.duedate}
                            </span>
                            {isOverdue && (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-foreground">
                              {formatPrice(
                                typeof invoice.total === 'string' ? parseFloat(invoice.total) : invoice.total
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <InvoiceStatusBadge status={invoice.status} />
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewInvoice(invoice)}
                              className="hover:bg-primary/10 hover:text-primary transition-colors h-8 px-2"
                              title={t('billing.table.viewInvoice')}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditInvoice(invoice)}
                              className="hover:bg-blue-500/10 hover:text-blue-600 transition-colors h-8 px-2"
                              title={t('billing.table.editInvoice')}
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
                                <DropdownMenuLabel>{t('billing.table.actionsLabel')}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDownloadPdf(invoice)}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  {t('billing.table.downloadPdf')}
                                </DropdownMenuItem>
                                {isUnpaid && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedInvoice(invoice)
                                        setIsAddPaymentModalOpen(true)
                                      }}
                                    >
                                      <CreditCard className="mr-2 h-4 w-4" />
                                      {t('billing.table.addPayment')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleMarkAsPaid(invoice)}
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                      {t('billing.table.markPaid')}
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleSendEmail(invoice)}
                                >
                                  <Mail className="mr-2 h-4 w-4" />
                                  {t('billing.table.sendEmail')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedInvoice(invoice)
                                    setIsDeleteDialogOpen(true)
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t('billing.table.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              {t('billing.table.showingResults', {
                start: String((currentPage - 1) * itemsPerPage + 1),
                end: String(Math.min(currentPage * itemsPerPage, filteredInvoices.length)),
                total: String(filteredInvoices.length)
              })}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm text-muted-foreground">
                {t('billing.table.page')} {currentPage} {t('billing.table.of')} {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Invoice Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 min-w-0">
              <FileText className="h-5 w-5 shrink-0" />
              <span className="break-words min-w-0">{t('billing.modal.invoiceId', { id: selectedInvoice?.invoicenum || selectedInvoice?.id })}</span>
            </DialogTitle>
            <DialogDescription>
              {clientNames[selectedInvoice?.userid] || `Client #${selectedInvoice?.userid}`}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedInvoice ? (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">{t('billing.modal.details')}</TabsTrigger>
                <TabsTrigger value="items">{t('billing.modal.items')}</TabsTrigger>
                <TabsTrigger value="payments">{t('billing.modal.payments')}</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('billing.modal.status')}</Label>
                    <div className="mt-1">
                      <InvoiceStatusBadge status={selectedInvoice.status} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('billing.modal.invoiceDate')}</Label>
                    <div className="mt-1 text-sm font-medium">
                      {selectedInvoice.date || '-'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('billing.modal.dueDate')}</Label>
                    <div className="mt-1 text-sm font-medium">
                      {selectedInvoice.duedate || '-'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('billing.modal.paymentMethod')}</Label>
                    <div className="mt-1 text-sm font-medium">
                      {selectedInvoice.paymentmethod || '-'}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">{t('billing.modal.clientInformation')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('billing.modal.client')}</Label>
                      <div className="mt-1 text-sm font-medium">
                        {clientNames[selectedInvoice.userid] || `Client #${selectedInvoice.userid}`}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('billing.modal.clientId')}</Label>
                      <div className="mt-1 text-sm font-medium">
                        #{selectedInvoice.userid}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">{t('billing.modal.amountSummary')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('billing.modal.subtotal')}</Label>
                      <div className="mt-1 text-sm font-medium">
                        {formatPrice(
                          typeof (selectedInvoice.subtotal || selectedInvoice.total) === 'string'
                            ? parseFloat(selectedInvoice.subtotal || selectedInvoice.total)
                            : (selectedInvoice.subtotal || selectedInvoice.total)
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('billing.modal.tax')}</Label>
                      <div className="mt-1 text-sm font-medium">
                        {formatPrice(
                          typeof (selectedInvoice.tax || '0.00') === 'string'
                            ? parseFloat(selectedInvoice.tax || '0.00')
                            : (selectedInvoice.tax || 0)
                        )}
                      </div>
                    </div>
                    {selectedInvoice.discount && parseFloat(selectedInvoice.discount) > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">{t('billing.modal.discount')}</Label>
                        <div className="mt-1 text-sm font-medium text-green-600">
                          -{formatPrice(
                            typeof selectedInvoice.discount === 'string'
                              ? parseFloat(selectedInvoice.discount)
                              : selectedInvoice.discount
                          )}
                        </div>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('billing.modal.credit')}</Label>
                      <div className="mt-1 text-sm font-medium">
                        {formatPrice(
                          typeof (selectedInvoice.credit || '0.00') === 'string'
                            ? parseFloat(selectedInvoice.credit || '0.00')
                            : (selectedInvoice.credit || 0)
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('billing.modal.total')}</Label>
                      <div className="mt-1 text-lg font-bold">
                        {formatPrice(
                          typeof selectedInvoice.total === 'string'
                            ? parseFloat(selectedInvoice.total)
                            : selectedInvoice.total
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{t('billing.modal.notes')}</Label>
                    <div className="p-3 bg-muted rounded-md text-sm">
                      {selectedInvoice.notes}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="items" className="space-y-4 mt-4">
                {selectedInvoice.items?.item ? (
                  <div className="space-y-2">
                    {Array.isArray(selectedInvoice.items.item) ? (
                      selectedInvoice.items.item.map((item: any, index: number) => (
                        <div key={index} className="p-3 border rounded-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{item.description || item.type}</div>
                              <div className="text-sm text-muted-foreground">
                                {t('billing.modal.quantity')}: {item.qty || 1}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">
                                {formatCurrency(
                                  typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount,
                                  {
                                    currencyprefix: selectedInvoice.currencyprefix,
                                    currencysuffix: selectedInvoice.currencysuffix,
                                    currencycode: selectedInvoice.currencycode || 'USD',
                                  }
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 border rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{selectedInvoice.items.item.description || selectedInvoice.items.item.type}</div>
                            <div className="text-sm text-muted-foreground">
                              Quantity: {selectedInvoice.items.item.qty || 1}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {formatCurrency(
                                typeof selectedInvoice.items.item.amount === 'string' ? parseFloat(selectedInvoice.items.item.amount) : selectedInvoice.items.item.amount,
                                {
                                  currencyprefix: selectedInvoice.currencyprefix,
                                  currencysuffix: selectedInvoice.currencysuffix,
                                  currencycode: selectedInvoice.currencycode || 'USD',
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('billing.modal.noItemsFound')}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payments" className="space-y-4 mt-4">
                {paymentHistory.length > 0 ? (
                  <div className="space-y-2">
                    {paymentHistory.map((payment: any, index: number) => (
                      <div key={index} className="p-3 border rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{t('billing.modal.payment')} #{payment.id || index + 1}</div>
                            <div className="text-sm text-muted-foreground">
                              {payment.date || payment.transdate || '-'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {t('billing.modal.method')}: {payment.gateway || payment.paymentmethod || '-'}
                            </div>
                            {payment.transid && (
                              <div className="text-xs text-muted-foreground">
                                {t('billing.modal.transactionId')}: {payment.transid}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              {formatCurrency(
                                parseFloat(payment.amountin || payment.amount || '0.00'),
                                {
                                  currencyprefix: selectedInvoice.currencyprefix,
                                  currencysuffix: selectedInvoice.currencysuffix,
                                  currencycode: selectedInvoice.currencycode || 'USD',
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('billing.modal.noPaymentHistory')}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : null}

          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsDetailModalOpen(false)}
              className="flex-1"
            >
              {t('billing.modal.close')}
            </Button>
            {selectedInvoice && (
              <>
                <Button
                  onClick={() => handleDownloadPdf(selectedInvoice)}
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t('billing.modal.downloadPdf')}
                </Button>
                <Button
                  onClick={() => {
                    setIsDetailModalOpen(false)
                    handleEditInvoice(selectedInvoice)
                  }}
                  className="flex-1"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {t('billing.modal.editInvoice')}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('billing.modal.editInvoiceTitle')}</DialogTitle>
            <DialogDescription>
              {t('billing.modal.updateInvoiceFor', { id: selectedInvoice?.invoicenum || selectedInvoice?.id })}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <form onSubmit={handleUpdateInvoice} className="space-y-4">
              <input type="hidden" name="invoiceid" value={selectedInvoice.id} />

              <div className="space-y-2">
                <Label htmlFor="edit-status">{t('billing.modal.status')}</Label>
                <Select name="status" defaultValue={selectedInvoice.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unpaid">{t('billing.status.unpaid')}</SelectItem>
                    <SelectItem value="Paid">{t('billing.status.paid')}</SelectItem>
                    <SelectItem value="Cancelled">{t('billing.status.cancelled')}</SelectItem>
                    <SelectItem value="Refunded">{t('billing.status.refunded')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">{t('billing.modal.invoiceDate')}</Label>
                  <Input
                    id="edit-date"
                    name="date"
                    type="date"
                    defaultValue={selectedInvoice.date?.split(' ')[0] || ''}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-duedate">{t('billing.modal.dueDate')}</Label>
                  <Input
                    id="edit-duedate"
                    name="duedate"
                    type="date"
                    defaultValue={selectedInvoice.duedate?.split(' ')[0] || ''}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-paymentmethod">{t('billing.modal.paymentMethod')}</Label>
                <Input
                  id="edit-paymentmethod"
                  name="paymentmethod"
                  defaultValue={selectedInvoice.paymentmethod || ''}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">{t('billing.modal.notes')}</Label>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  defaultValue={selectedInvoice.notes || ''}
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
                  {t('billing.modal.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('billing.modal.updating')}
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      {t('billing.modal.updateInvoice')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Payment Modal */}
      <Dialog open={isAddPaymentModalOpen} onOpenChange={setIsAddPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('billing.modal.addPaymentTitle')}</DialogTitle>
            <DialogDescription>
              {t('billing.modal.addPaymentFor', { id: selectedInvoice?.invoicenum || selectedInvoice?.id })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">{t('billing.modal.amount')}</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={t('billing.modal.enterAmount')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-method">{t('billing.modal.paymentMethod')}</Label>
              <Input
                id="payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder={t('billing.modal.paymentMethodPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction-id">{t('billing.modal.transactionIdOptional')}</Label>
              <Input
                id="transaction-id"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder={t('billing.modal.enterTransactionId')}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddPaymentModalOpen(false)
                  setPaymentAmount('')
                  setPaymentMethod('')
                  setTransactionId('')
                }}
                className="flex-1"
              >
                {t('billing.modal.cancel')}
              </Button>
              <Button
                onClick={handleAddPayment}
                className="flex-1"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {t('billing.modal.addPaymentButton')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('billing.modal.deleteInvoice')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('billing.modal.deleteConfirm', { id: selectedInvoice?.invoicenum || selectedInvoice?.id })}
              <br /><br />
              {t('billing.modal.deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('billing.modal.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvoice} className="bg-red-600 hover:bg-red-700">
              <Trash2 className="mr-2 h-4 w-4" />
              {t('billing.modal.deleteButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Invoice Status Badge Component
function InvoiceStatusBadge({ status }: { status: string }) {
  const statusLower = status?.toLowerCase() || 'unknown'

  const statusConfig: Record<string, { bg: string; text: string; label: string; icon?: any }> = {
    paid: {
      bg: 'bg-green-500/10 border-green-500/20',
      text: 'text-green-700 dark:text-green-400',
      label: 'Paid',
      icon: CheckCircle2
    },
    unpaid: {
      bg: 'bg-orange-500/10 border-orange-500/20',
      text: 'text-orange-700 dark:text-orange-400',
      label: 'Unpaid',
      icon: Clock
    },
    cancelled: {
      bg: 'bg-gray-500/10 border-gray-500/20',
      text: 'text-gray-700 dark:text-gray-400',
      label: 'Cancelled',
      icon: XCircle
    },
    refunded: {
      bg: 'bg-blue-500/10 border-blue-500/20',
      text: 'text-blue-700 dark:text-blue-400',
      label: 'Refunded',
      icon: Receipt
    },
  }

  const config = statusConfig[statusLower] || statusConfig.unpaid
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={`${config.bg} ${config.text} border font-medium px-2.5 py-0.5 flex items-center gap-1 w-fit`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  )
}
