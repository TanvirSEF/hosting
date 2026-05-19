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
  MessageSquare,
  Eye,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Loader2,
  Download,
  MoreVertical,
  CheckCircle2,
  XCircle,
  User,
  MessageCircle,
  Send,
  Trash2,
  Clock,
  AlertTriangle,
  Tag,
  Building2,
  FileText,
  Edit,
  ArrowRightLeft,
  StickyNote,
  Paperclip,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getTicketDetailsAction,
  replyTicketAction,
  closeTicketAction,
  reopenTicketAction,
  deleteTicketAction,
  updateTicketAction,
  addTicketNoteAction,
  getTicketNotesAction,
  deleteTicketNoteAction,
  mergeTicketAction,
  getSupportDepartmentsAction,
  getAllClientsAction,
  getClientNameAction,
  getTicketAttachmentAction,
} from '@/actions/admin-ticket-actions';
import { useAdminTranslation } from '@/components/AdminTranslationProvider';

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
  userid: string | number;
  [key: string]: any;
}

interface TicketsTableProps {
  tickets: Ticket[];
}

type SortField =
  | 'tid'
  | 'subject'
  | 'client'
  | 'department'
  | 'lastreply'
  | 'status';
type SortDirection = 'asc' | 'desc';

export function TicketsTable({ tickets: initialTickets }: TicketsTableProps) {
  const { t } = useAdminTranslation();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);

  // Sync state with props
  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  // Auto-refresh every 15 seconds to check for new tickets/replies
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 15000);
    return () => clearInterval(interval);
  }, [router]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('lastreply');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientNames, setClientNames] = useState<
    Record<string | number, string>
  >({});
  const [allClients, setAllClients] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [ticketNotes, setTicketNotes] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [noteMessage, setNoteMessage] = useState('');
  const [mergeTicketId, setMergeTicketId] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<any>(null);
  const [isDeleteNoteDialogOpen, setIsDeleteNoteDialogOpen] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachmentPreviews, setAttachmentPreviews] = useState<
    Record<string, { url: string; contentType?: string }>
  >({});
  const [imagePreviewModal, setImagePreviewModal] = useState<{
    isOpen: boolean;
    url: string;
    filename: string;
  }>({ isOpen: false, url: '', filename: '' });
  const itemsPerPage = 10;

  // Fetch client names, clients list, and departments
  useEffect(() => {
    async function fetchData() {
      // Get all clients for filter
      const clientsResult = await getAllClientsAction();
      if (clientsResult.success) {
        setAllClients(clientsResult.data || []);
      }

      // Get departments
      const deptResult = await getSupportDepartmentsAction();
      if (deptResult.success) {
        setDepartments(deptResult.data || []);
      } else {
      }

      // Log first ticket to see structure
      if (tickets.length > 0) {
      }

      // Get client names for tickets
      const uniqueClientIds = [...new Set(tickets.map((t) => t.userid))];
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

    fetchData();
  }, [tickets]);

  // Auto-fetch image previews when ticket is selected
  useEffect(() => {
    if (!selectedTicket || !selectedTicket.ticket) return;

    const ticket = selectedTicket.ticket;
    const replies = selectedTicket.replies || [];

    // Prefetch ticket attachments
    const ticketFiles = parseAttachments(ticket.attachment);
    ticketFiles.forEach((filename, index) => {
      if (isImageFile(filename)) {
        fetchAttachmentPreview(
          ticket.id,
          ticket.id,
          index,
          'ticket',
          filename
        );
      }
    });

    // Prefetch reply attachments
    replies.forEach((reply: any, replyIndex: number) => {
      const replyFiles = parseAttachments(reply.attachment);
      replyFiles.forEach((filename, fileIndex) => {
        if (isImageFile(filename)) {
          fetchAttachmentPreview(
            ticket.id,
            reply.id || reply.replyid || replyIndex,
            fileIndex,
            'reply',
            filename
          );
        }
      });
    });
  }, [selectedTicket]);

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
          clientNames[ticket.userid]?.toLowerCase().includes(query)
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
      filtered = filtered.filter((ticket) => {
        const deptName =
          ticket.department ||
          ticket.deptname ||
          ticket.departmentname ||
          (ticket.deptid &&
            departments.find((d) => String(d.id) === String(ticket.deptid))
              ?.name) ||
          '';
        return deptName?.toLowerCase() === departmentFilter.toLowerCase();
      });
    }

    // Client filter
    if (clientFilter !== 'all') {
      filtered = filtered.filter(
        (ticket) => String(ticket.userid) === clientFilter
      );
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(
        (ticket) =>
          ticket.priority?.toLowerCase() === priorityFilter.toLowerCase()
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
        case 'client':
          aValue = clientNames[a.userid] || String(a.userid);
          bValue = clientNames[b.userid] || String(b.userid);
          break;
        case 'department':
          aValue = a.department?.toLowerCase() || '';
          bValue = b.department?.toLowerCase() || '';
          break;
        case 'lastreply':
          aValue = new Date(a.lastreply || a.date).getTime();
          bValue = new Date(b.lastreply || b.date).getTime();
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
    tickets,
    searchQuery,
    statusFilter,
    departmentFilter,
    clientFilter,
    priorityFilter,
    sortField,
    sortDirection,
    clientNames,
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
    setIsLoadingDetails(true);
    setIsDetailModalOpen(true);
    setSelectedTicket(ticket);

    try {
      const result = await getTicketDetailsAction(ticket.id);
      if (result.success && result.data) {
        // Ensure we have the ticket data with all fields
        const ticketData = {
          ...result.data.ticket,
          replies: result.data.replies || [],
        };
        setSelectedTicket({ ticket: ticketData, replies: ticketData.replies });

        // Load ticket notes
        const notesResult = await getTicketNotesAction(ticket.id);
        if (notesResult.success) {
          setTicketNotes(notesResult.data || []);
        }
      } else {
        toast.error(result.error || t('support.toast.loadFailed'));
        setIsDetailModalOpen(false);
      }
    } catch (error: any) {
      toast.error(error.message || t('support.toast.loadFailed'));
      setIsDetailModalOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Max 5 files, max 10MB each
      const newFiles = Array.from(files)
        .filter((file) => {
          if (file.size > 10 * 1024 * 1024) {
            toast.error(
              t('support.toast.fileTooLarge', { filename: file.name })
            );
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

  // Helper function to decode HTML entities
  const decodeHtml = (value: string) => {
    if (!value) return '';

    // First decode HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    let decoded = textarea.value;

    // Then strip HTML tags to get plain text
    const div = document.createElement('div');
    div.innerHTML = decoded;
    return div.textContent || div.innerText || decoded;
  };

  // Parse attachments - handle various formats including objects
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

    // Handle string (pipe or comma separated)
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
      <div className="mt-3 flex flex-wrap gap-2">
        {files.map((filename, index) => {
          const key = buildPreviewKey(type, relatedId, index);
          const preview = attachmentPreviews[key];
          const isImage = isImageFile(filename);

          return (
            <div key={index} className="relative">
              {isImage ? (
                <button
                  type="button"
                  onClick={() =>
                    handleOpenAttachment(
                      ticketId,
                      relatedId,
                      index,
                      type,
                      filename
                    )
                  }
                  onMouseEnter={() => {
                    if (!preview) {
                      fetchAttachmentPreview(
                        ticketId,
                        relatedId,
                        index,
                        type,
                        filename
                      );
                    }
                  }}
                  className="group relative overflow-hidden rounded-lg border-2 border-gray-300 transition-all hover:border-primary hover:shadow-lg"
                >
                  {preview?.url ? (
                    <img
                      src={preview.url}
                      alt={filename}
                      className="h-24 w-24 object-cover transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center bg-gray-100">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1">
                    <p className="truncate text-xs text-white">{filename}</p>
                  </div>
                </button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleOpenAttachment(
                      ticketId,
                      relatedId,
                      index,
                      type,
                      filename
                    )
                  }
                  className="h-auto max-w-[200px] flex-col items-start py-2"
                >
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate text-xs">{filename}</span>
                  </div>
                </Button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const handleDownloadAttachment = async (
    ticketId: string | number,
    relatedId: string | number,
    index: number,
    filename: string,
    type: 'ticket' | 'reply' = 'reply'
  ) => {
    try {
      const toastId = toast.loading(t('support.toast.downloadingAttachment'));
      const result = await getTicketAttachmentAction(
        ticketId,
        relatedId,
        index,
        type
      );

      if (result.success && result.data) {
        try {
          const byteCharacters = atob(result.data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], {
            type: result.contentType || 'application/octet-stream',
          });

          // Download
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename || result.filename || 'attachment';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          toast.success(t('support.toast.downloadStarted'), { id: toastId });
        } catch (e) {
          toast.error(t('support.toast.failedToProcessAttachment'), {
            id: toastId,
          });
        }
      } else {
        toast.error(result.error || t('support.toast.failedToGetAttachment'), {
          id: toastId,
        });
      }
    } catch (error) {
      toast.error(t('support.toast.failedToDownloadAttachment'));
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) {
      toast.error(t('support.toast.enterReplyMessage'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Process attachments if any
      let attachmentsJson = undefined;
      if (replyAttachments.length > 0) {
        const attachmentsData = await Promise.all(
          replyAttachments.map(async (file) => ({
            name: file.name,
            data: await fileToBase64(file),
          }))
        );
        attachmentsJson = JSON.stringify(attachmentsData);
      }

      const result = await replyTicketAction(
        selectedTicket.ticket?.id || selectedTicket.id,
        replyMessage.trim(),
        true,
        attachmentsJson
      );

      if (result.success) {
        toast.success(t('support.toast.replySentSuccess'));
        setIsReplyModalOpen(false);
        setReplyMessage('');
        setReplyAttachments([]);
        // Reload ticket details
        await handleViewTicket(selectedTicket.ticket || selectedTicket);
        window.location.reload();
      } else {
        toast.error(result.error || t('support.toast.replySentFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('support.toast.replySentFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseTicket = async (ticket: Ticket) => {
    try {
      const result = await closeTicketAction(ticket.id);
      if (result.success) {
        toast.success(t('support.toast.ticketClosedSuccess'));
        window.location.reload();
      } else {
        toast.error(result.error || t('support.toast.ticketClosedFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('support.toast.ticketClosedFailed'));
    }
  };

  const handleReopenTicket = async (ticket: Ticket) => {
    try {
      const result = await reopenTicketAction(ticket.id);
      if (result.success) {
        toast.success(t('support.toast.ticketReopenedSuccess'));
        window.location.reload();
      } else {
        toast.error(result.error || t('support.toast.ticketReopenedFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('support.toast.ticketReopenedFailed'));
    }
  };

  const handleDeleteTicket = async () => {
    if (!selectedTicket) return;

    try {
      const result = await deleteTicketAction(
        selectedTicket.ticket?.id || selectedTicket.id
      );
      if (result.success) {
        toast.success(t('support.toast.ticketDeletedSuccess'));
        setIsDeleteDialogOpen(false);
        window.location.reload();
      } else {
        toast.error(result.error || t('support.toast.ticketDeletedFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('support.toast.ticketDeletedFailed'));
    }
  };

  const handleUpdateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const updates: any = {};

      if (formData.get('status'))
        updates.status = formData.get('status') as string;
      if (formData.get('priority'))
        updates.priority = formData.get('priority') as string;
      if (formData.get('departmentid'))
        updates.departmentid = formData.get('departmentid') as string;
      if (formData.get('subject'))
        updates.subject = formData.get('subject') as string;

      const result = await updateTicketAction(
        selectedTicket.ticket?.id || selectedTicket.id,
        updates
      );
      if (result.success) {
        toast.success(t('support.toast.ticketUpdatedSuccess'));
        setIsUpdateModalOpen(false);
        window.location.reload();
      } else {
        toast.error(result.error || t('support.toast.ticketUpdatedFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('support.toast.ticketUpdatedFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete || !selectedTicket) return;

    setIsSubmitting(true);
    try {
      const ticketId = selectedTicket.ticket?.id || selectedTicket.id;
      const result = await deleteTicketNoteAction({
        ticketId: ticketId,
        noteId: noteToDelete.id,
      });

      if (result.success) {
        toast.success(t('support.toast.noteDeletedSuccess'));
        setIsDeleteNoteDialogOpen(false);
        setNoteToDelete(null);
        // Reload notes
        const notesResult = await getTicketNotesAction(ticketId);
        if (notesResult.success) {
          setTicketNotes(notesResult.data || []);
        }
      } else {
        toast.error(result.error || t('support.toast.noteDeletedFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('support.toast.noteDeletedFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedTicket || !noteMessage.trim()) {
      toast.error(t('support.toast.enterNote'));
      return;
    }

    const ticketId = selectedTicket.ticket?.id || selectedTicket.id;

    setIsSubmitting(true);
    try {
      const result = await addTicketNoteAction({
        ticketId: ticketId,
        note: noteMessage.trim(),
      });

      if (result.success) {
        toast.success(t('support.toast.noteAddedSuccess'));
        setIsNoteModalOpen(false);
        setNoteMessage('');
        // Reload notes
        const notesResult = await getTicketNotesAction(ticketId);
        if (notesResult.success) {
          setTicketNotes(notesResult.data || []);
        }
      } else {
        toast.error(result.error || t('support.toast.noteAddedFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('support.toast.noteAddedFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMergeTicket = async () => {
    if (!selectedTicket || !mergeTicketId.trim()) {
      toast.error(t('support.toast.enterTicketIdToMerge'));
      return;
    }

    try {
      const result = await mergeTicketAction(
        selectedTicket.ticket?.id || selectedTicket.id,
        mergeTicketId.trim()
      );
      if (result.success) {
        toast.success(t('support.toast.ticketsMergedSuccess'));
        setIsMergeModalOpen(false);
        setMergeTicketId('');
        window.location.reload();
      } else {
        toast.error(result.error || t('support.toast.ticketsMergedFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('support.toast.ticketsMergedFailed'));
    }
  };

  const handleExportTickets = () => {
    // Create CSV content
    const headers = [
      'Ticket #',
      'Subject',
      'Client',
      'Department',
      'Status',
      'Priority',
      'Date',
      'Last Reply',
    ];
    const rows = filteredTickets.map((ticket) => [
      ticket.tid || ticket.id,
      ticket.subject,
      clientNames[ticket.userid] || `Client #${ticket.userid}`,
      ticket.department,
      ticket.status,
      ticket.priority || '',
      ticket.date,
      ticket.lastreply,
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
    a.download = `tickets-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(t('support.toast.exportSuccess'));
  };


  // Get unique values for filters
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(tickets.map((t) => t.status).filter(Boolean));
    return Array.from(statuses);
  }, [tickets]);

  const uniquePriorities = useMemo(() => {
    const priorities = new Set(
      tickets.map((t) => t.priority).filter((p): p is string => Boolean(p))
    );
    return Array.from(priorities);
  }, [tickets]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">
                {t('support.table.title')}
              </CardTitle>
              <CardDescription className="mt-1">
                {t('support.table.description')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportTickets}>
                <Download className="mr-2 h-4 w-4" />
                {t('support.table.export')}
              </Button>
            </div>
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
                      `support.status.${status.toLowerCase().replace(/\s+/g, '').replace(/-/g, '')}`
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
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name?.toLowerCase()}>
                    {dept.name}
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
                <SelectValue placeholder={t('support.table.allClients')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('support.table.allClients')}
                </SelectItem>
                {allClients.map((client) => (
                  <SelectItem key={client.id} value={String(client.id)}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={priorityFilter}
              onValueChange={(value) => {
                setPriorityFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t('support.table.allPriorities')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('support.table.allPriorities')}
                </SelectItem>
                {uniquePriorities.map((priority) => (
                  <SelectItem key={priority} value={priority.toLowerCase()}>
                    {t(`support.priority.${priority.toLowerCase()}`) ||
                      priority ||
                      'N/A'}
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
                  ? t('support.table.noTicketsYet')
                  : t('support.table.noTicketsFound')}
              </h3>
              <p className="text-muted-foreground mx-auto mb-6 max-w-sm">
                {tickets.length === 0
                  ? t('support.table.noTicketsCreated')
                  : t('support.table.adjustFilters')}
              </p>
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
                        field="client"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        {t('support.table.client')}
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
                    const isOpen =
                      ticket.status?.toLowerCase() === 'open' ||
                      ticket.status?.toLowerCase() === 'customer-reply';
                    const isClosed = ticket.status?.toLowerCase() === 'closed';

                    return (
                      <TableRow
                        key={ticket.id}
                        className="group hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                              <MessageSquare className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-foreground group-hover:text-primary font-semibold transition-colors">
                                #{ticket.tid || ticket.id}
                              </div>
                              {ticket.priority && (
                                <div className="text-muted-foreground mt-0.5 text-xs">
                                  <PriorityBadge priority={ticket.priority} />
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-foreground group-hover:text-primary max-w-md font-semibold transition-colors">
                            {ticket.subject}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <User className="text-muted-foreground h-4 w-4" />
                            <div>
                              <div className="text-sm font-medium">
                                {clientNames[ticket.userid] ||
                                  `Client #${ticket.userid}`}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                ID: {ticket.userid}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          {(() => {
                            // Try to get department name in order of preference:
                            // 1. Direct department name fields
                            let deptName =
                              ticket.deptname ||
                              ticket.department ||
                              ticket.departmentname ||
                              null;

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
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="text-muted-foreground h-4 w-4" />
                            <span className="font-medium">
                              {ticket.lastreply || ticket.date}
                            </span>
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
                              title={t('support.table.viewTicket')}
                            >
                              <Eye className="h-3.5 w-3.5" />
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
                                  {t('support.table.actionsLabel')}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTicket(ticket);
                                    setIsReplyModalOpen(true);
                                  }}
                                >
                                  <MessageCircle className="mr-2 h-4 w-4" />
                                  {t('support.table.reply')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTicket(ticket);
                                    setIsUpdateModalOpen(true);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  {t('support.table.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTicket(ticket);
                                    setIsNoteModalOpen(true);
                                  }}
                                >
                                  <StickyNote className="mr-2 h-4 w-4" />
                                  {t('support.table.addNote')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {isClosed ? (
                                  <DropdownMenuItem
                                    onClick={() => handleReopenTicket(ticket)}
                                  >
                                    <Clock className="mr-2 h-4 w-4" />
                                    {t('support.table.reopen')}
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleCloseTicket(ticket)}
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    {t('support.table.close')}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTicket(ticket);
                                    setIsMergeModalOpen(true);
                                  }}
                                >
                                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                                  {t('support.table.merge')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTicket(ticket);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t('support.table.delete')}
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
                {t('support.table.page')} {currentPage} {t('support.table.of')}{' '}
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

      {/* Ticket Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex min-w-0 items-center gap-2">
              <MessageSquare className="h-5 w-5 shrink-0" />
              <span className="min-w-0 break-words">
                {t('support.modal.ticketId', {
                  id:
                    selectedTicket?.ticket?.tid ||
                    selectedTicket?.tid ||
                    selectedTicket?.id,
                })}
              </span>
            </DialogTitle>
            <DialogDescription>
              {selectedTicket?.ticket?.subject || selectedTicket?.subject}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : selectedTicket?.ticket || selectedTicket ? (
            <Tabs defaultValue="conversation" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="conversation" className="text-xs sm:text-sm">
                  {t('support.modal.conversation')}
                </TabsTrigger>
                <TabsTrigger value="details" className="text-xs sm:text-sm">
                  {t('support.modal.details')}
                </TabsTrigger>
                <TabsTrigger value="notes" className="text-xs sm:text-sm">
                  {t('support.modal.internalNotes')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="conversation" className="mt-4 space-y-4">
                {/* Original Ticket Message - Customer's Initial Message */}
                {(() => {
                  // Safe access with null checks
                  if (!selectedTicket) {
                    return (
                      <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-5 dark:border-yellow-700 dark:bg-yellow-950/30">
                        <div className="flex items-center gap-3 text-yellow-800 dark:text-yellow-300">
                          <AlertTriangle className="h-5 w-5" />
                          <div>
                            <div className="font-semibold">
                              {t('support.modal.ticketDataNotAvailable')}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const ticket = selectedTicket.ticket || selectedTicket;
                  const replies = selectedTicket.replies || [];

                  // Ensure ticket exists before accessing properties
                  if (!ticket) {
                    return (
                      <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-5 dark:border-yellow-700 dark:bg-yellow-950/30">
                        <div className="flex items-center gap-3 text-yellow-800 dark:text-yellow-300">
                          <AlertTriangle className="h-5 w-5" />
                          <div>
                            <div className="font-semibold">
                              {t('support.modal.ticketInfoNotAvailable')}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Try multiple possible field names for the original message
                  // Priority: originalMessage > message > initialmessage > first non-admin reply
                  const originalMessage =
                    (ticket && ticket.originalMessage) ||
                    (ticket && ticket.message) ||
                    (ticket && ticket.initialmessage) ||
                    (ticket && ticket.initial_message) ||
                    (ticket && ticket.notes) ||
                    (replies.length > 0 && replies[0] && !replies[0]?.admin
                      ? replies[0]?.message || replies[0]?.reply
                      : null);

                  if (originalMessage) {
                    return (
                      <div className="border-primary/30 from-primary/10 via-primary/5 to-background space-y-3 rounded-lg border-2 bg-gradient-to-br p-5 shadow-md">
                        <div className="flex items-start justify-between">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="bg-primary/20 rounded-full p-2">
                              <User className="text-primary h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-base font-bold">
                                {ticket.userid
                                  ? clientNames[ticket.userid] ||
                                  `Client #${ticket.userid}`
                                  : 'Unknown Client'}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {t('support.modal.customerOriginalMessage')}
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className="bg-primary/20 border-primary/40 text-primary text-xs font-semibold"
                            >
                              {t('support.modal.original')}
                            </Badge>
                            <span className="text-muted-foreground text-xs">
                              {ticket.date || ticket.created || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="bg-background border-primary/20 min-h-[100px] rounded-md border-2 p-4 text-base whitespace-pre-wrap break-words shadow-inner">
                          {decodeHtml(originalMessage)}
                        </div>
                        {/* Attachment View */}
                        {ticket.attachment && renderAttachments(
                          ticket.attachment,
                          ticket.id,
                          ticket.id,
                          'ticket'
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-5 dark:border-yellow-700 dark:bg-yellow-950/30">
                      <div className="flex items-center gap-3 text-yellow-800 dark:text-yellow-300">
                        <AlertTriangle className="h-5 w-5" />
                        <div>
                          <div className="font-semibold">
                            {t('support.modal.originalMessageNotAvailable')}
                          </div>
                          <div className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
                            {t('support.modal.customerMessageNotRetrieved')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Replies */}
                {selectedTicket &&
                  selectedTicket.replies &&
                  selectedTicket.replies.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-muted-foreground mb-2 text-sm font-semibold">
                      {t('support.modal.replies', {
                        count: selectedTicket.replies.length,
                      })}
                      :
                    </div>
                    {selectedTicket.replies.map((reply: any, index: number) => (
                      <div
                        key={index}
                        className={`rounded-lg border p-4 ${reply?.admin ? 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20' : 'bg-muted/30'}`}
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex flex-wrap items-center gap-2">
                            {reply?.admin ? (
                              <>
                                <Tag className="h-4 w-4 text-blue-600" />
                                <Badge
                                  variant="outline"
                                  className="bg-blue-100 text-xs dark:bg-blue-900/30"
                                >
                                  {t('support.modal.admin')}
                                </Badge>
                              </>
                            ) : (
                              <>
                                <User className="text-muted-foreground h-4 w-4" />
                                <Badge variant="outline" className="text-xs">
                                  {t('support.modal.customer')}
                                </Badge>
                              </>
                            )}
                            <span className="font-semibold">
                              {reply?.admin
                                ? t('support.modal.admin')
                                : reply?.name ||
                                reply?.email ||
                                t('support.modal.client')}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {reply?.date || reply?.created || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="bg-background mt-2 rounded-md border p-3 text-sm whitespace-pre-wrap break-words">
                          {decodeHtml(
                            reply?.message ||
                            reply?.reply ||
                            t('support.modal.noMessageContent')
                          )}
                        </div>
                        {/* Reply Attachment */}
                        {reply?.attachment && renderAttachments(
                          reply.attachment,
                          selectedTicket.ticket?.id || selectedTicket.id,
                          reply.id || reply.replyid || index,
                          'reply'
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground py-8 text-center">
                    <MessageCircle className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    <p>{t('support.modal.noRepliesYet')}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="details" className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-x-12 gap-y-6 sm:grid-cols-2">
                  <div className="flex flex-col">
                    <Label className="text-muted-foreground text-xs font-semibold mb-1">
                      {t('support.modal.status')}
                    </Label>
                    <div>
                      <TicketStatusBadge
                        status={
                          (selectedTicket.ticket || selectedTicket).status
                        }
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <Label className="text-muted-foreground text-xs font-semibold mb-1">
                      {t('support.modal.priority')}
                    </Label>
                    <div>
                      {(selectedTicket.ticket || selectedTicket).priority ? (
                        <PriorityBadge
                          priority={
                            (selectedTicket.ticket || selectedTicket).priority
                          }
                        />
                      ) : (
                        <span className="text-sm font-medium">-</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <Label className="text-muted-foreground text-xs font-semibold mb-1">
                      {t('support.modal.department')}
                    </Label>
                    <div className="flex items-center">
                      {(() => {
                        const ticket = selectedTicket.ticket || selectedTicket;
                        // Try to get department name in order of preference:
                        // 1. Direct department name fields
                        let deptName =
                          ticket.deptname ||
                          ticket.department ||
                          ticket.departmentname ||
                          null;

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
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <Label className="text-muted-foreground text-xs font-semibold mb-1">
                      {t('support.modal.date')}
                    </Label>
                    <div className="text-sm font-medium">
                      {(selectedTicket.ticket || selectedTicket).date}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-foreground border-b pb-2 text-sm font-semibold">
                    {t('support.modal.clientInformation')}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        {t('support.modal.client')}
                      </Label>
                      <div className="mt-1 text-sm font-medium">
                        {clientNames[
                          (selectedTicket.ticket || selectedTicket).userid
                        ] ||
                          `Client #${(selectedTicket.ticket || selectedTicket).userid}`}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        {t('support.modal.email')}
                      </Label>
                      <div className="mt-1 text-sm font-medium">
                        {(selectedTicket.ticket || selectedTicket).email || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="mt-4 space-y-4">
                {/* Add New Internal Note */}
                <div className="bg-muted/30 space-y-3 rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <StickyNote className="text-primary h-4 w-4" />
                    <h4 className="text-sm font-semibold">
                      {t('support.modal.addInternalNote')}
                    </h4>
                  </div>
                  <Textarea
                    placeholder={t('support.modal.notePlaceholder')}
                    value={noteMessage}
                    onChange={(e) => setNoteMessage(e.target.value)}
                    className="min-h-[100px] resize-none"
                    disabled={isSubmitting}
                  />
                  <Button
                    onClick={handleAddNote}
                    disabled={isSubmitting || !noteMessage.trim()}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('support.modal.addingNote')}
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {t('support.modal.addInternalNote')}
                      </>
                    )}
                  </Button>
                </div>

                {/* Existing Internal Notes */}
                {ticketNotes.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-muted-foreground text-sm font-semibold">
                      {t('support.modal.previousNotes', {
                        count: String(ticketNotes.length),
                      })}
                    </h4>
                    {ticketNotes.map((note: any, index: number) => (
                      <div
                        key={index}
                        className="group rounded-md border bg-yellow-50 p-3 transition-colors hover:bg-yellow-100 dark:bg-yellow-950/20 dark:hover:bg-yellow-950/30"
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <StickyNote className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-semibold">
                              {t('support.modal.internalNote')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">
                              {note.date || note.created || '-'}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950"
                              onClick={() => {
                                setNoteToDelete(note);
                                setIsDeleteNoteDialogOpen(true);
                              }}
                              title={t('support.modal.deleteNote')}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm whitespace-pre-wrap break-words">
                          {String(
                            note.message ||
                            note.note ||
                            note.text ||
                            t('support.modal.noContent')
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground py-8 text-center">
                    <StickyNote className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    <p>{t('support.modal.noPreviousNotes')}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : null}

          <div className="flex gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDetailModalOpen(false)}
              className="flex-1"
            >
              {t('support.modal.close')}
            </Button>
            {selectedTicket?.ticket && (
              <Button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedTicket(selectedTicket.ticket || selectedTicket);
                  setIsReplyModalOpen(true);
                }}
                className="flex-1"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                {t('support.modal.reply')}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reply Modal */}
      <Dialog open={isReplyModalOpen} onOpenChange={setIsReplyModalOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('support.modal.replyToTicket')}</DialogTitle>
            <DialogDescription>
              {t('support.modal.replyToTicketId', {
                id:
                  selectedTicket?.ticket?.tid ||
                  selectedTicket?.tid ||
                  selectedTicket?.id,
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reply-message">
                {t('support.modal.message')}
              </Label>
              <Textarea
                id="reply-message"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder={t('support.modal.enterReply')}
                rows={6}
                disabled={isSubmitting}
              />
            </div>

            {/* File Attachments */}
            <div className="space-y-2">
              <Label>{t('support.modal.attachmentsOptional')}</Label>
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
                  {t('support.modal.addFiles')}{' '}
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
                  {t('support.modal.attachmentsInfo')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsReplyModalOpen(false);
                  setReplyMessage('');
                }}
                className="flex-1"
                disabled={isSubmitting}
              >
                {t('support.modal.cancel')}
              </Button>
              <Button
                onClick={handleReply}
                className="flex-1"
                disabled={isSubmitting || !replyMessage.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('support.modal.sending')}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t('support.modal.sendReply')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Ticket Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('support.modal.updateTicket')}</DialogTitle>
            <DialogDescription>
              {t('support.modal.updateTicketFor', {
                id:
                  selectedTicket?.ticket?.tid ||
                  selectedTicket?.tid ||
                  selectedTicket?.id,
              })}
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <form onSubmit={handleUpdateTicket} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="update-subject">
                  {t('support.modal.subject')}
                </Label>
                <Input
                  id="update-subject"
                  name="subject"
                  defaultValue={
                    selectedTicket.ticket?.subject || selectedTicket.subject
                  }
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="update-status">
                    {t('support.modal.status')}
                  </Label>
                  <Select
                    name="status"
                    defaultValue={
                      selectedTicket.ticket?.status || selectedTicket.status
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">
                        {t('support.status.open')}
                      </SelectItem>
                      <SelectItem value="Answered">
                        {t('support.status.answered')}
                      </SelectItem>
                      <SelectItem value="Customer-Reply">
                        {t('support.status.customerReply')}
                      </SelectItem>
                      <SelectItem value="Closed">
                        {t('support.status.closed')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="update-priority">
                    {t('support.modal.priority')}
                  </Label>
                  <Select
                    name="priority"
                    defaultValue={
                      selectedTicket.ticket?.priority || selectedTicket.priority
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">
                        {t('support.priority.low')}
                      </SelectItem>
                      <SelectItem value="Medium">
                        {t('support.priority.medium')}
                      </SelectItem>
                      <SelectItem value="High">
                        {t('support.priority.high')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-department">
                  {t('support.modal.department')}
                </Label>
                <Select
                  name="departmentid"
                  defaultValue={String(
                    selectedTicket.ticket?.deptid || selectedTicket.deptid || ''
                  )}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {t('support.modal.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('support.modal.updating')}
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      {t('support.modal.updateTicketButton')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Note Modal */}
      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('support.modal.addInternalNoteTitle')}</DialogTitle>
            <DialogDescription>
              {t('support.modal.addNoteToTicket', {
                id:
                  selectedTicket?.ticket?.tid ||
                  selectedTicket?.tid ||
                  selectedTicket?.id,
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note-message">{t('support.modal.note')}</Label>
              <Textarea
                id="note-message"
                value={noteMessage}
                onChange={(e) => setNoteMessage(e.target.value)}
                placeholder={t('support.modal.enterInternalNote')}
                rows={6}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsNoteModalOpen(false);
                  setNoteMessage('');
                }}
                className="flex-1"
                disabled={isSubmitting}
              >
                {t('support.modal.cancel')}
              </Button>
              <Button
                onClick={handleAddNote}
                className="flex-1"
                disabled={isSubmitting || !noteMessage.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('support.modal.adding')}
                  </>
                ) : (
                  <>
                    <StickyNote className="mr-2 h-4 w-4" />
                    {t('support.modal.addNote')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Merge Ticket Modal */}
      <Dialog open={isMergeModalOpen} onOpenChange={setIsMergeModalOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('support.modal.mergeTickets')}</DialogTitle>
            <DialogDescription>
              {t('support.modal.mergeTicketInto', {
                id:
                  selectedTicket?.ticket?.tid ||
                  selectedTicket?.tid ||
                  selectedTicket?.id,
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="merge-ticket-id">
                {t('support.modal.ticketIdToMerge')}
              </Label>
              <Input
                id="merge-ticket-id"
                value={mergeTicketId}
                onChange={(e) => setMergeTicketId(e.target.value)}
                placeholder={t('support.modal.enterTicketId')}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsMergeModalOpen(false);
                  setMergeTicketId('');
                }}
                className="flex-1"
              >
                {t('support.modal.cancel')}
              </Button>
              <Button onClick={handleMergeTicket} className="flex-1">
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                {t('support.modal.mergeTicketsButton')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('support.modal.deleteTicket')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('support.modal.deleteTicketConfirm', {
                id:
                  selectedTicket?.ticket?.tid ||
                  selectedTicket?.tid ||
                  selectedTicket?.id,
              })}
              <br />
              <br />
              {t('support.modal.deleteTicketWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('support.modal.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTicket}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('support.modal.deleteTicketButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Note Confirmation Dialog */}
      <AlertDialog
        open={isDeleteNoteDialogOpen}
        onOpenChange={setIsDeleteNoteDialogOpen}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('support.modal.deleteInternalNote')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('support.modal.deleteNoteConfirm')}
              <br />
              <br />
              {t('support.modal.deleteNoteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('support.modal.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNote}
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('support.modal.deleting')
                : t('support.modal.deleteNoteButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              {imagePreviewModal.url ? (
                <img
                  src={imagePreviewModal.url}
                  alt={imagePreviewModal.filename}
                  className="max-h-full max-w-full rounded-lg object-contain"
                />
              ) : (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              )}
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

// Ticket Status Badge Component
function TicketStatusBadge({ status }: { status: string }) {
  const { t } = useAdminTranslation();
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
      icon: CheckCircle2,
    },
    closed: {
      bg: 'bg-gray-500/10 border-gray-500/20',
      text: 'text-gray-700 dark:text-gray-400',
      icon: XCircle,
    },
  };

  const config = statusConfig[statusLower] || statusConfig.open;
  const Icon = config.icon;
  const statusKey = statusLower.replace(/\s+/g, '').replace(/-/g, '');
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

// Priority Badge Component
function PriorityBadge({ priority }: { priority: string }) {
  const { t } = useAdminTranslation();
  const priorityLower = priority?.toLowerCase() || 'medium';

  const priorityConfig: Record<string, { bg: string; text: string }> = {
    low: {
      bg: 'bg-green-500/10 border-green-500/20',
      text: 'text-green-700 dark:text-green-400',
    },
    medium: {
      bg: 'bg-yellow-500/10 border-yellow-500/20',
      text: 'text-yellow-700 dark:text-yellow-400',
    },
    high: {
      bg: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-700 dark:text-red-400',
    },
  };

  const config = priorityConfig[priorityLower] || priorityConfig.medium;
  const label = t(`support.priority.${priorityLower}`);

  return (
    <Badge
      variant="outline"
      className={`${config.bg} ${config.text} border px-2 py-0.5 text-xs font-medium`}
    >
      {label}
    </Badge>
  );
}

// Department Badge Component
function DepartmentBadge({ department }: { department: string }) {
  return (
    <Badge variant="outline" className="text-xs">
      <Building2 className="mr-1 h-3 w-3" />
      {department || 'N/A'}
    </Badge>
  );
}
