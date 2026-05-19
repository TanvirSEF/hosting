'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  MessageSquare,
  Plus,
  Eye,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Send,
  X,
  Loader2,
  FileText,
  User,
  Tag,
  Building2,
  Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getTicketDetailsAction,
  createTicketAction,
  replyTicketAction,
  closeTicketAction,
  reopenTicketAction,
  getSupportDepartmentsAction,
  getTicketAttachmentAction,
} from '@/actions/ticket-actions';
import { useDashboardTranslation } from '@/components/DashboardTranslationProvider';

interface Ticket {
  id: string | number;
  tid?: string;
  subject: string;
  department?: string; // May not be present from GetTickets
  deptid?: string | number; // WHMCS GetTickets returns this
  deptname?: string; // WHMCS GetTicket returns this
  status: string;
  priority?: string;
  lastreply: string;
  date: string;
  [key: string]: any;
}

interface TicketsTableProps {
  tickets: Ticket[];
}

type SortField =
  | 'tid'
  | 'subject'
  | 'department'
  | 'status'
  | 'lastreply'
  | 'date';
type SortDirection = 'asc' | 'desc';

export function TicketsTable({ tickets: initialTickets }: TicketsTableProps) {
  const { t } = useDashboardTranslation();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);

  // Sync state with props when server data changes
  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  // Auto-refresh every 15s for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 15000);
    return () => clearInterval(interval);
  }, [router]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('lastreply');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Create Ticket Attachments State
  const [createAttachments, setCreateAttachments] = useState<File[]>([]);
  const createFileInputRef = React.useRef<HTMLInputElement>(null);
  const [createTicketMessage, setCreateTicketMessage] = useState('');
  const [attachmentPreviews, setAttachmentPreviews] = useState<
    Record<string, { url: string; contentType?: string }>
  >({});
  const [imagePreviewModal, setImagePreviewModal] = useState<{
    isOpen: boolean;
    url: string;
    filename: string;
  }>({ isOpen: false, url: '', filename: '' });
  const itemsPerPage = 10;

  // Fetch departments on mount
  useEffect(() => {
    async function fetchDepartments() {
      const result = await getSupportDepartmentsAction();
      if (result.success) {
        setDepartments(result.data || []);
      }
    }
    fetchDepartments();
  }, []);

  // Filter tickets
  const filteredTickets = useMemo(() => {
    let filtered = [...tickets];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          String(ticket.tid || ticket.id)
            .toLowerCase()
            .includes(query) ||
          ticket.subject?.toLowerCase().includes(query) ||
          ticket.department?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (ticket) => ticket.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(
        (ticket) =>
          ticket.department?.toLowerCase() === departmentFilter.toLowerCase()
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'tid':
          aValue = String(a.tid || a.id);
          bValue = String(b.tid || b.id);
          break;
        case 'subject':
          aValue = a.subject?.toLowerCase() || '';
          bValue = b.subject?.toLowerCase() || '';
          break;
        case 'department':
          aValue = a.department?.toLowerCase() || '';
          bValue = b.department?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.status?.toLowerCase() || '';
          bValue = b.status?.toLowerCase() || '';
          break;
        case 'lastreply':
          aValue = new Date(a.lastreply || a.date).getTime();
          bValue = new Date(b.lastreply || b.date).getTime();
          break;
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
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
    tickets,
    searchQuery,
    statusFilter,
    departmentFilter,
    sortField,
    sortDirection,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(start, start + itemsPerPage);
  }, [filteredTickets, currentPage, itemsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const handleViewTicket = async (ticket: Ticket) => {
    setIsLoadingTicket(true);
    setIsDetailModalOpen(true);

    try {
      const result = await getTicketDetailsAction(ticket.id);
      if (result.success) {
        setSelectedTicket(result.data);
      } else {
        toast.error(result.error || 'Failed to load ticket details');
        setIsDetailModalOpen(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load ticket details');
      setIsDetailModalOpen(false);
    } finally {
      setIsLoadingTicket(false);
    }
  };

  const handleReply = (ticket: Ticket) => {
    setSelectedTicket({ ticket });
    setReplyMessage('');
    setReplyAttachments([]);
    setIsReplyModalOpen(true);
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data:*/*;base64, prefix
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const decodeHtml = (value: string) => {
    if (!value) return '';
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    return textarea.value;
  };

  const parseAttachments = (attachments: any): string[] => {
    if (!attachments) return [];

    // Handle array of attachments
    if (Array.isArray(attachments)) {
      return attachments.map((item) => {
        // If item is an object, try to extract filename
        if (typeof item === 'object' && item !== null) {
          return item.filename || item.name || item.file || String(item);
        }
        return String(item);
      }).filter(Boolean);
    }

    // Handle string (comma or pipe separated)
    if (typeof attachments === 'string') {
      return attachments
        .split(/[|,]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    // Handle object with 'attachment' property
    if (typeof attachments === 'object') {
      const list = (attachments as any).attachment;
      if (Array.isArray(list)) {
        return list.map((item) => {
          if (typeof item === 'object' && item !== null) {
            return item.filename || item.name || item.file || String(item);
          }
          return String(item);
        }).filter(Boolean);
      }
      if (list) {
        if (typeof list === 'object') {
          return [list.filename || list.name || list.file || String(list)];
        }
        return [String(list)];
      }

      // Handle single attachment object
      if (attachments.filename || attachments.name || attachments.file) {
        return [attachments.filename || attachments.name || attachments.file];
      }
    }

    return [];
  };

  const isImageFile = (filename: string) => {
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(filename);
  };

  const buildPreviewKey = (
    type: 'ticket' | 'reply',
    relatedId: string | number,
    index: number
  ) => `${type}-${relatedId}-${index}`;

  const fetchAttachmentPreview = async (
    ticketId: string | number,
    relatedId: string | number,
    index: number,
    type: 'ticket' | 'reply',
    filename: string
  ) => {
    const key = buildPreviewKey(type, relatedId, index);
    if (attachmentPreviews[key]) return attachmentPreviews[key];

    const result = await getTicketAttachmentAction(
      ticketId,
      relatedId,
      index,
      type
    );

    if (!result.success || !result.data) {
      toast.error(result.error || 'Failed to load attachment');
      return null;
    }

    const byteCharacters = atob(result.data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const contentType =
      result.contentType ||
      (isImageFile(filename) ? 'image/*' : 'application/octet-stream');
    const blob = new Blob([byteArray], { type: contentType });
    const url = window.URL.createObjectURL(blob);

    const preview = { url, contentType };
    setAttachmentPreviews((prev) => ({ ...prev, [key]: preview }));
    return preview;
  };

  const handleOpenAttachment = async (
    ticketId: string | number,
    relatedId: string | number,
    index: number,
    type: 'ticket' | 'reply',
    filename: string
  ) => {
    const preview = await fetchAttachmentPreview(
      ticketId,
      relatedId,
      index,
      type,
      filename
    );
    if (!preview?.url) return;

    // Check if it's an image file
    if (isImageFile(filename)) {
      // Open in modal viewer for images
      setImagePreviewModal({
        isOpen: true,
        url: preview.url,
        filename: filename,
      });
    } else {
      // Download non-image files
      const link = document.createElement('a');
      link.href = preview.url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderAttachments = (
    attachments: any,
    ticketId: string | number,
    relatedId: string | number,
    type: 'ticket' | 'reply'
  ) => {
    const files = parseAttachments(attachments);
    if (files.length === 0) return null;

    return (
      <div className="mt-3 flex flex-wrap gap-3">
        {files.map((filename, index) => {
          const key = buildPreviewKey(type, relatedId, index);
          const preview = attachmentPreviews[key];
          const imageFile = isImageFile(filename);

          if (imageFile && !preview) {
            void fetchAttachmentPreview(
              ticketId,
              relatedId,
              index,
              type,
              filename
            );
          }

          return (
            <button
              type="button"
              key={`${key}-${filename}`}
              onClick={() =>
                handleOpenAttachment(ticketId, relatedId, index, type, filename)
              }
              className="border-border hover:border-primary/50 flex items-center gap-2 rounded-lg border bg-background px-2 py-1.5 text-xs transition-colors"
            >
              {imageFile ? (
                preview?.url ? (
                  <img
                    src={preview.url}
                    alt={filename}
                    className="h-12 w-12 rounded-md object-cover"
                  />
                ) : (
                  <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-md text-[10px]">
                    Preview
                  </div>
                )
              ) : (
                <FileText className="text-muted-foreground h-4 w-4" />
              )}
              <span className="max-w-[140px] truncate">{filename}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Max 5 files, max 500KB each
      const newFiles = Array.from(files)
        .filter((file) => {
          if (file.size > 500 * 1024) {
            toast.error(`${file.name} is too large. Maximum size is 500KB.`);
            return false;
          }
          return true;
        })
        .slice(0, 5 - replyAttachments.length);

      setReplyAttachments((prev) => [...prev, ...newFiles].slice(0, 5));
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setReplyAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Create Ticket Attachment Handlers
  const handleCreateFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Max 5 files, max 500KB each
      const newFiles = Array.from(files)
        .filter((file) => {
          if (file.size > 500 * 1024) {
            toast.error(`${file.name} is too large. Maximum size is 500KB.`);
            return false;
          }
          return true;
        })
        .slice(0, 5 - createAttachments.length);

      setCreateAttachments((prev) => [...prev, ...newFiles].slice(0, 5));
    }
    // Reset input
    if (createFileInputRef.current) {
      createFileInputRef.current.value = '';
    }
  };

  const removeCreateAttachment = (index: number) => {
    setCreateAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();

    const ticketId = selectedTicket?.ticket?.ticketid || selectedTicket?.ticket?.tid || selectedTicket?.ticket?.id;

    if (!ticketId) {
      toast.error('No ticket selected');
      return;
    }

    // Check if message is empty (rich text editor returns HTML, so check for actual content)
    if (!replyMessage || replyMessage === '<p></p>' || replyMessage === '<p><br></p>') {
      toast.error('Please enter a reply message');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('ticketid', String(ticketId));
      formData.append('message', replyMessage);

      // Process attachments if any
      if (replyAttachments.length > 0) {
        const attachmentsData = await Promise.all(
          replyAttachments.map(async (file) => ({
            name: file.name,
            data: await fileToBase64(file),
          }))
        );
        formData.append('attachments', JSON.stringify(attachmentsData));
      }

      const result = await replyTicketAction(formData);

      if (result.success) {
        toast.success('Reply sent successfully');
        setIsReplyModalOpen(false);
        setReplyMessage('');
        setReplyAttachments([]);

        // Refresh ticket details to show new reply
        const refreshTicketId = selectedTicket?.ticket?.ticketid || selectedTicket?.ticket?.tid || selectedTicket?.ticket?.id;
        if (refreshTicketId) {
          setIsRefreshing(true);
          await handleViewTicket({ id: refreshTicketId } as Ticket);
          setIsRefreshing(false);
        }

        // Refresh the tickets list
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to send reply');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseTicket = async (ticketId: string | number) => {
    try {
      const result = await closeTicketAction(ticketId);
      if (result.success) {
        toast.success('Ticket closed successfully');

        // Update the ticket status in local state immediately
        setTickets(prevTickets =>
          prevTickets.map(ticket =>
            String(ticket.id) === String(ticketId)
              ? { ...ticket, status: 'Closed' }
              : ticket
          )
        );

        // Close the modal
        setIsDetailModalOpen(false);

        // Refresh from server to get latest data
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to close ticket');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to close ticket');
    }
  };

  const handleReopenTicket = async (ticketId: string | number) => {
    try {
      const result = await reopenTicketAction(ticketId);
      if (result.success) {
        toast.success('Ticket reopened successfully');

        // Update the ticket status in local state immediately
        setTickets(prevTickets =>
          prevTickets.map(ticket =>
            String(ticket.id) === String(ticketId)
              ? { ...ticket, status: 'Open' }
              : ticket
          )
        );

        // Close the modal
        setIsDetailModalOpen(false);

        // Refresh from server to get latest data
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to reopen ticket');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to reopen ticket');
    }
  };

  const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check if message is empty (rich text editor returns HTML)
    if (!createTicketMessage || createTicketMessage === '<p></p>' || createTicketMessage === '<p><br></p>') {
      toast.error('Please enter a message for your ticket');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);

      // Add message from rich text editor
      formData.append('message', createTicketMessage);

      // Handle attachments
      if (createAttachments.length > 0) {
        const attachmentsData = await Promise.all(
          createAttachments.map(async (file) => ({
            name: file.name,
            data: await fileToBase64(file),
          }))
        );
        const attachmentsJson = JSON.stringify(attachmentsData);
        formData.append('attachments', attachmentsJson);
      }

      const result = await createTicketAction(formData);

      if (result.success) {
        toast.success('Ticket created successfully');
        setIsCreateModalOpen(false);
        setCreateAttachments([]); // Clear attachments
        setCreateTicketMessage(''); // Clear message

        // Add new ticket to local state for instant update
        if (result.ticket) {
          const updatedTickets = [result.ticket, ...tickets];
          setTickets(updatedTickets);
        }

        // Show refreshing indicator and refresh after delay
        setIsRefreshing(true);
        setTimeout(() => {
          router.refresh();
          setIsRefreshing(false);
        }, 500);
      } else {
        toast.error(result.error || 'Failed to create ticket');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };


  // Get unique departments and statuses for filters
  const uniqueDepartments = useMemo(() => {
    const depts = new Set(tickets.map((t) => t.department).filter(Boolean));
    return Array.from(depts);
  }, [tickets]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(tickets.map((t) => t.status).filter(Boolean));
    return Array.from(statuses);
  }, [tickets]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">
                  {t('support.table.title')}
                </CardTitle>
                {isRefreshing && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <CardDescription className="mt-1">
                {t('support.table.description')}
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('support.newTicket')}
            </Button>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col gap-3 pt-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder={t('support.table.searchPlaceholder')}
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
                <SelectValue placeholder={t('support.table.allStatuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('support.table.allStatuses')}
                </SelectItem>
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status.toLowerCase()}>
                    {t(
                      `support.status.${status.toLowerCase().replace(' ', '')}`
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={departmentFilter}
              onValueChange={(value) => {
                setDepartmentFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t('support.table.allDepartments')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('support.table.allDepartments')}
                </SelectItem>
                {departments.map((dept: any) => (
                  <SelectItem
                    key={dept.id}
                    value={dept.name?.toLowerCase() || ''}
                  >
                    {dept.name || `Dept #${dept.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedTickets.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <div className="bg-primary/10 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full">
                <MessageSquare className="text-primary h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                {tickets.length === 0
                  ? 'No Support Tickets'
                  : 'No Tickets Found'}
              </h3>
              <p className="text-muted-foreground mx-auto mb-6 max-w-sm">
                {tickets.length === 0
                  ? 'Everything seems to be running smoothly! If you need help, open a new ticket.'
                  : "Try adjusting your filters to find what you're looking for."}
              </p>
              {tickets.length === 0 && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Open New Ticket
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">
                      <SortButton<SortField>
                        field="tid"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        {t('support.table.ticketId')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField>
                        field="subject"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        {t('support.table.subject')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField>
                        field="department"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        {t('support.table.department')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField>
                        field="lastreply"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        {t('support.table.lastReply')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortButton<SortField>
                        field="status"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        {t('support.table.status')}
                      </SortButton>
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      {t('support.table.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTickets.map((ticket: Ticket) => {
                    const needsAttention = ['answered'].includes(
                      ticket.status?.toLowerCase()
                    );
                    const isClosed = ticket.status?.toLowerCase() === 'closed';

                    return (
                      <TableRow
                        key={ticket.id}
                        className={`group hover:bg-muted/30 transition-colors ${needsAttention ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''}`}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                              <MessageSquare className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-foreground font-semibold">
                                #{ticket.tid || ticket.id}
                              </div>
                              {ticket.priority && (
                                <div className="text-muted-foreground mt-0.5 text-xs">
                                  {ticket.priority}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-foreground group-hover:text-primary max-w-md font-semibold transition-colors">
                            {ticket.subject}
                          </div>
                          {needsAttention && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                              <AlertCircle className="h-3 w-3" />
                              New response available
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="py-4">
                          {(() => {
                            // Try to get department name in order of preference:
                            // 1. Direct department name fields
                            let deptName =
                              ticket.deptname || ticket.department || null;

                            // 2. If we have deptid, map it to department name from departments list
                            if (!deptName && ticket.deptid) {
                              if (departments.length > 0) {
                                const dept = departments.find(
                                  (d) => String(d.id) === String(ticket.deptid)
                                );
                                if (dept?.name) {
                                  deptName = dept.name;
                                }
                              }
                            }

                            // 3. Final fallback - show department ID if we have it but no name
                            if (!deptName && ticket.deptid) {
                              deptName = `Dept #${ticket.deptid}`;
                            }

                            return <DepartmentBadge department={deptName} />;
                          })()}
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="text-muted-foreground flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4" />
                            <span>{ticket.lastreply || ticket.date}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <TicketStatusBadge status={ticket.status} />
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewTicket(ticket)}
                              className="hover:bg-primary/10 hover:text-primary h-8 px-2 transition-colors"
                              title="View Ticket"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
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
              {t('support.table.showingResults', {
                start: String((currentPage - 1) * itemsPerPage + 1),
                end: String(
                  Math.min(currentPage * itemsPerPage, filteredTickets.length)
                ),
                total: String(filteredTickets.length),
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
                Page {currentPage} of {totalPages}
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

      {/* Ticket Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex min-w-0 items-center gap-2">
              <MessageSquare className="h-5 w-5 shrink-0" />
              <span className="min-w-0 break-words">
                Ticket #
                {selectedTicket?.ticket?.tid ||
                  selectedTicket?.ticket?.ticketid ||
                  selectedTicket?.ticket?.id ||
                  ''}
              </span>
            </DialogTitle>
            <DialogDescription>
              {selectedTicket?.ticket?.subject || ''}
            </DialogDescription>
          </DialogHeader>

          {isLoadingTicket ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : selectedTicket?.ticket ? (
            <div className="space-y-6">
              {/* Ticket Info */}
              <div className="grid grid-cols-1 gap-x-12 gap-y-6 sm:grid-cols-2">
                <div className="flex flex-col">
                  <Label className="text-muted-foreground text-xs font-semibold mb-1">
                    {t('support.table.status')}
                  </Label>
                  <div>
                    <TicketStatusBadge
                      status={selectedTicket.ticket.status || 'Open'}
                    />
                  </div>
                </div>
                <div className="flex flex-col text-wrap">
                  <Label className="text-muted-foreground text-xs font-semibold mb-1">
                    {t('support.table.department')}
                  </Label>
                  <div className="flex items-center">
                    {(() => {
                      const ticket = selectedTicket.ticket;
                      // Try to get department name from API response
                      let deptName = ticket.deptname || null;

                      // If we have deptid, map it to department name
                      if (!deptName && ticket.deptid) {
                        if (departments.length > 0) {
                          const dept = departments.find(
                            (d) => String(d.id) === String(ticket.deptid)
                          );
                          if (dept?.name) {
                            deptName = dept.name;
                          }
                        }
                      }

                      // Fallback
                      if (!deptName && ticket.deptid) {
                        deptName = `Dept #${ticket.deptid}`;
                      }

                      return <DepartmentBadge department={deptName} />;
                    })()}
                  </div>
                </div>
                <div className="flex flex-col">
                  <Label className="text-muted-foreground text-xs font-semibold mb-1">
                    {t('support.table.priority')}
                  </Label>
                  <div className="text-sm font-medium">
                    {selectedTicket.ticket.priority || 'Medium'}
                  </div>
                </div>
                <div className="flex flex-col">
                  <Label className="text-muted-foreground text-xs font-semibold mb-1">
                    {t('support.form.created')}
                  </Label>
                  <div className="text-sm font-medium">
                    {selectedTicket.ticket.date
                      ? new Date(
                        selectedTicket.ticket.date
                      ).toLocaleString()
                      : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Conversation */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-semibold">
                  <MessageCircle className="h-4 w-4" />
                  Conversation
                </h3>
                <div className="max-h-[400px] space-y-4 overflow-y-auto">
                  {/* Initial Ticket Message */}
                  {selectedTicket.ticket.message && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <User className="text-muted-foreground h-4 w-4" />
                          <span className="font-medium">
                            {selectedTicket.ticket.name || 'You'}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {selectedTicket.ticket.date
                              ? new Date(
                                selectedTicket.ticket.date
                              ).toLocaleString()
                              : ''}
                          </span>
                        </div>
                      </div>
                      <div
                        className="text-sm whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: decodeHtml(selectedTicket.ticket.message),
                        }}
                      />
                      {renderAttachments(
                        selectedTicket.ticket.attachments,
                        selectedTicket.ticket.ticketid ||
                        selectedTicket.ticket.id,
                        selectedTicket.ticket.ticketid ||
                        selectedTicket.ticket.id,
                        'ticket'
                      )}
                    </div>
                  )}

                  {/* Replies */}
                  {selectedTicket.replies &&
                    Array.isArray(selectedTicket.replies) &&
                    selectedTicket.replies.map((reply: any, index: number) => (
                      <div
                        key={index}
                        className={`rounded-lg p-4 ${reply.admin
                          ? 'bg-blue-50/50 dark:bg-blue-950/10'
                          : 'bg-muted/50'
                          }`}
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {reply.admin ? (
                              <Building2 className="h-4 w-4 text-blue-600" />
                            ) : (
                              <User className="text-muted-foreground h-4 w-4" />
                            )}
                            <span className="font-medium">
                              {reply.admin
                                ? reply.name || 'Support Team'
                                : reply.name || 'You'}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {reply.date
                                ? new Date(reply.date).toLocaleString()
                                : ''}
                            </span>
                          </div>
                        </div>
                        <div
                          className="text-sm whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{
                            __html: decodeHtml(reply.message || ''),
                          }}
                        />
                        {renderAttachments(
                          reply.attachments,
                          selectedTicket.ticket.ticketid ||
                          selectedTicket.ticket.id,
                          reply.replyid || reply.id || reply.ticketid,
                          'reply'
                        )}
                      </div>
                    ))}

                  {!selectedTicket.ticket.message &&
                    (!selectedTicket.replies ||
                      selectedTicket.replies.length === 0) && (
                      <div className="text-muted-foreground py-8 text-center">
                        No messages found
                      </div>
                    )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t pt-4">
                {selectedTicket.ticket.status?.toLowerCase() !== 'closed' ? (
                  <>
                    <Button
                      onClick={() => {
                        setIsReplyModalOpen(true);
                        setIsDetailModalOpen(false);
                      }}
                      className="flex-1"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Reply
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleCloseTicket(
                          selectedTicket.ticket.ticketid ||
                          selectedTicket.ticket.id
                        )
                      }
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Close Ticket
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() =>
                      handleReopenTicket(
                        selectedTicket.ticket.ticketid ||
                        selectedTicket.ticket.id
                      )
                    }
                    className="flex-1"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Reopen Ticket
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              No ticket data available
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Ticket Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex min-w-0 items-center gap-2">
              <Plus className="h-5 w-5 shrink-0" />
              <span className="min-w-0 break-words">
                {t('support.newTicket')}
              </span>
            </DialogTitle>
            <DialogDescription>
              {t('support.form.createTicketDesc')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deptid">{t('support.form.department')} *</Label>
              <Select name="deptid" required>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t('support.form.selectDepartment')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">{t('support.form.subject')} *</Label>
              <Input
                id="subject"
                name="subject"
                placeholder={t('support.form.subjectPlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">{t('support.table.priority')}</Label>
              <Select name="priority" defaultValue="Medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t('support.form.message')} *</Label>
              <RichTextEditor
                content={createTicketMessage}
                onChange={setCreateTicketMessage}
                placeholder={t('support.form.messagePlaceholder')}
                minHeight="180px"
              />
            </div>

            {/* File Attachments */}
            <div className="space-y-2">
              <Label>Attachments (optional)</Label>
              <div className="flex flex-col gap-2">
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={createFileInputRef}
                  onChange={handleCreateFileSelect}
                  multiple
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.zip,.rar"
                  className="hidden"
                />

                {/* Add file button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => createFileInputRef.current?.click()}
                  disabled={createAttachments.length >= 5}
                  className="w-fit"
                >
                  <Paperclip className="mr-2 h-4 w-4" />
                  Add Files{' '}
                  {createAttachments.length > 0 &&
                    `(${createAttachments.length}/5)`}
                </Button>

                {/* Selected files list */}
                {createAttachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {createAttachments.map((file, index) => (
                      <div
                        key={index}
                        className="bg-muted/50 flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm"
                      >
                        <FileText className="text-muted-foreground h-4 w-4" />
                        <span className="max-w-[150px] truncate">
                          {file.name}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          ({(file.size / 1024).toFixed(0)}KB)
                        </span>
                        <button
                          type="button"
                          onClick={() => removeCreateAttachment(index)}
                          className="text-muted-foreground transition-colors hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-muted-foreground text-xs">
                  Max 5 files, 500KB each. Supported: images, PDF, documents,
                  archives
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting || !createTicketMessage || createTicketMessage === '<p></p>' || createTicketMessage === '<p><br></p>'}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('support.form.creating')}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t('support.form.createTicket')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reply Modal */}
      <Dialog open={isReplyModalOpen} onOpenChange={setIsReplyModalOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex min-w-0 items-center gap-2">
              <MessageCircle className="h-5 w-5 shrink-0" />
              <span className="min-w-0 break-words">
                Reply to Ticket #
                {selectedTicket?.ticket?.tid || selectedTicket?.ticket?.ticketid || selectedTicket?.ticket?.id}
              </span>
            </DialogTitle>
            <DialogDescription>
              {selectedTicket?.ticket?.subject}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitReply} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reply-message">
                {t('support.form.yourReply')} *
              </Label>
              <RichTextEditor
                content={replyMessage}
                onChange={setReplyMessage}
                placeholder={t('support.form.replyPlaceholder')}
                minHeight="150px"
              />
            </div>

            {/* File Attachments */}
            <div className="space-y-2">
              <Label>Attachments (optional)</Label>
              <div className="flex flex-col gap-2">
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.zip,.rar"
                  className="hidden"
                />

                {/* Add file button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={replyAttachments.length >= 5}
                  className="w-fit"
                >
                  <Paperclip className="mr-2 h-4 w-4" />
                  Add Files{' '}
                  {replyAttachments.length > 0 &&
                    `(${replyAttachments.length}/5)`}
                </Button>

                {/* Selected files list */}
                {replyAttachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {replyAttachments.map((file, index) => (
                      <div
                        key={index}
                        className="bg-muted/50 flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm"
                      >
                        <FileText className="text-muted-foreground h-4 w-4" />
                        <span className="max-w-[150px] truncate">
                          {file.name}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          ({(file.size / 1024).toFixed(0)}KB)
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-muted-foreground transition-colors hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-muted-foreground text-xs">
                  Max 5 files, 500KB each. Supported: images, PDF, documents,
                  archives
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReplyModalOpen(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || !replyMessage || replyMessage === '<p></p>' || replyMessage === '<p><br></p>'}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Reply
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog
        open={imagePreviewModal.isOpen}
        onOpenChange={(open) =>
          setImagePreviewModal({ isOpen: open, url: '', filename: '' })
        }
      >
        <DialogContent className="flex max-h-[95vh] w-[95vw] max-w-4xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="flex-shrink-0 border-b px-6 py-4">
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              <span className="truncate">{imagePreviewModal.filename}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-4">
            <div className="flex h-full items-center justify-center">
              <img
                src={imagePreviewModal.url}
                alt={imagePreviewModal.filename}
                className="max-h-full max-w-full rounded-lg object-contain"
              />
            </div>
          </div>

          <div className="flex flex-shrink-0 justify-end gap-2 border-t px-6 py-4">
            <Button
              variant="outline"
              onClick={() =>
                setImagePreviewModal({ isOpen: false, url: '', filename: '' })
              }
            >
              Close
            </Button>
            <Button
              onClick={() => {
                const link = document.createElement('a');
                link.href = imagePreviewModal.url;
                link.download = imagePreviewModal.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Department Badge Component
function DepartmentBadge({ department }: { department: string | null }) {
  return (
    <Badge variant="outline" className="text-xs">
      <Building2 className="mr-1 h-3 w-3" />
      {department || 'N/A'}
    </Badge>
  );
}

// Ticket Status Badge Component
function TicketStatusBadge({ status }: { status: string }) {
  const { t } = useDashboardTranslation();
  const statusLower = status?.toLowerCase() || 'unknown';

  const statusConfig: Record<string, { bg: string; text: string; icon?: any }> =
  {
    open: {
      bg: 'bg-orange-500/10 border-orange-500/20',
      text: 'text-orange-700 dark:text-orange-400',
      icon: Clock,
    },
    'customer-reply': {
      bg: 'bg-orange-500/10 border-orange-500/20',
      text: 'text-orange-700 dark:text-orange-400',
      icon: MessageCircle,
    },
    answered: {
      bg: 'bg-blue-500/10 border-blue-500/20',
      text: 'text-blue-700 dark:text-blue-400',
      icon: MessageCircle,
    },
    'in progress': {
      bg: 'bg-yellow-500/10 border-yellow-500/20',
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: Clock,
    },
    closed: {
      bg: 'bg-gray-500/10 border-gray-500/20',
      text: 'text-gray-700 dark:text-gray-400',
      icon: CheckCircle2,
    },
    'on hold': {
      bg: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-700 dark:text-red-400',
      icon: XCircle,
    },
  };

  const config = statusConfig[statusLower] || statusConfig.open;
  const Icon = config.icon;
  const statusKey = statusLower.replace(' ', '').replace('-', '');
  const label =
    t(`support.status.${statusKey}`) || t(`support.status.${statusLower}`);

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
