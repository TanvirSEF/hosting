'use server';

import { whmcsApi } from '@/lib/whmcs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Get ticket details with replies and notes
 */
export async function getTicketDetailsAction(ticketId: string | number) {
  try {
    const response = await whmcsApi('GetTicket', {
      ticketid: ticketId,
    });

    if (response.result === 'success') {
      // Get ticket data - check multiple possible field names
      const ticket = response.ticket || response.tickets?.ticket || response;

      // Get ticket replies - safely handle undefined/null
      const replies = response.replies?.reply || response.reply;
      const replyList = Array.isArray(replies)
        ? replies
        : replies
          ? [replies]
          : [];

      // If still no ticket data, check if response itself is the ticket
      if (
        !ticket ||
        (typeof ticket === 'object' && Object.keys(ticket).length === 0)
      ) {
        return {
          success: false,
          error: 'Ticket data not found in API response',
        };
      }

      // Get client details
      let clientData = null;
      if (ticket.userid) {
        try {
          const clientResponse = await whmcsApi('GetClientsDetails', {
            clientid: ticket.userid,
          });
          if (clientResponse.result === 'success') {
            clientData = clientResponse.client;
          }
        } catch (error) {
          // Client fetch failed, continue without client data
        }
      }

      // Safely get original message from various possible fields
      const firstReply = replyList.length > 0 ? replyList[0] : null;

      const originalMessage =
        (ticket && ticket.message) ||
        (ticket && ticket.initialmessage) ||
        (ticket && ticket.initial_message) ||
        (firstReply &&
          !firstReply.admin &&
          (firstReply.message || firstReply.reply)) ||
        null;

      // Clean ticketData - remove notes object to prevent React rendering errors
      const { notes, ...cleanTicket } = ticket;

      // Ensure we have the original message - check multiple possible fields
      const ticketData = {
        ...cleanTicket,
        originalMessage: originalMessage,
      };

      return {
        success: true,
        data: {
          ticket: ticketData,
          replies: replyList,
        },
        client: clientData,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Ticket not found',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch ticket details',
    };
  }
}

/**
 * Reply to a ticket with optional attachments
 * attachments: JSON string of [{name: string, data: string}] where data is base64 encoded
 */
export async function replyTicketAction(
  ticketId: string | number,
  message: string,
  admin: boolean = true,
  attachments?: string // JSON string of attachments
) {
  try {
    if (!message || message.trim() === '') {
      return {
        success: false,
        error: 'Message is required',
      };
    }

    const apiParams: Record<string, any> = {
      ticketid: ticketId,
      message: message.trim(),
      ...(admin && { adminusername: 'Admin' }),
    };

    // Handle attachments if present
    if (attachments && attachments.trim()) {
      try {
        const attachmentsData = JSON.parse(attachments);
        if (Array.isArray(attachmentsData) && attachmentsData.length > 0) {
          // WHMCS expects: base64 encoded JSON array of {name, data} objects
          const jsonString = JSON.stringify(attachmentsData);
          const base64Attachments = Buffer.from(jsonString).toString('base64');
          apiParams.attachments = base64Attachments;
        }
      } catch (parseError) {
        console.error('Failed to parse attachments:', parseError);
      }
    }

    const response = await whmcsApi('AddTicketReply', apiParams);

    if (response.result === 'success') {
      revalidatePath('/spike/support', 'page');
      return {
        success: true,
        message: 'Reply added successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to add reply',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to add reply',
    };
  }
}

/**
 * Close a ticket
 */
export async function closeTicketAction(ticketId: string | number) {
  try {
    const response = await whmcsApi('UpdateTicket', {
      ticketid: ticketId,
      status: 'Closed',
    });

    if (response.result === 'success') {
      revalidatePath('/spike/support', 'page');
      return {
        success: true,
        message: 'Ticket closed successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to close ticket',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to close ticket',
    };
  }
}

/**
 * Reopen a ticket
 */
export async function reopenTicketAction(ticketId: string | number) {
  try {
    const response = await whmcsApi('UpdateTicket', {
      ticketid: ticketId,
      status: 'Open',
    });

    if (response.result === 'success') {
      revalidatePath('/spike/support', 'page');
      return {
        success: true,
        message: 'Ticket reopened successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to reopen ticket',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to reopen ticket',
    };
  }
}

/**
 * Delete a ticket
 */
export async function deleteTicketAction(ticketId: string | number) {
  try {
    const response = await whmcsApi('DeleteTicket', {
      ticketid: ticketId,
    });

    if (response.result === 'success') {
      revalidatePath('/spike/support', 'page');
      return {
        success: true,
        message: 'Ticket deleted successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to delete ticket',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete ticket',
    };
  }
}

/**
 * Update ticket (status, priority, department, etc.)
 */
export async function updateTicketAction(
  ticketId: string | number,
  updates: {
    status?: string;
    priority?: string;
    departmentid?: string | number;
    subject?: string;
  }
) {
  try {
    const updateData: any = {
      ticketid: ticketId,
    };

    if (updates.status) updateData.status = updates.status;
    if (updates.priority) updateData.priority = updates.priority;
    if (updates.departmentid) updateData.departmentid = updates.departmentid;
    if (updates.subject) updateData.subject = updates.subject;

    const response = await whmcsApi('UpdateTicket', updateData);

    if (response.result === 'success') {
      revalidatePath('/spike/support', 'page');
      return {
        success: true,
        message: 'Ticket updated successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to update ticket',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update ticket',
    };
  }
}

/**
 * Add internal note to ticket
 */
export async function addTicketNoteAction(params: {
  ticketId: string | number;
  note: string;
}) {
  try {
    if (!params.note || params.note.trim() === '') {
      return {
        success: false,
        error: 'Note is required',
      };
    }

    const requestParams = {
      ticketid: params.ticketId,
      message: params.note.trim(), // WHMCS API expects 'message' not 'note'
    };

    const response = await whmcsApi('AddTicketNote', requestParams);

    if (response.result === 'success') {
      revalidatePath('/spike/support', 'page');
      return {
        success: true,
        message: 'Note added successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to add note',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to add note',
    };
  }
}

/**
 * Get ticket notes
 */
export async function getTicketNotesAction(ticketId: string | number) {
  try {
    const response = await whmcsApi('GetTicketNotes', {
      ticketid: ticketId,
    });

    if (response.result === 'success') {
      // WHMCS API actually returns: response.notes.note (nested structure)
      // Each note has: id, admin, date, message, attachments, attachments_removed
      const notes = response.notes?.note || [];

      // Ensure notes is always an array
      const noteList = Array.isArray(notes) ? notes : notes ? [notes] : [];

      return {
        success: true,
        data: noteList,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to fetch ticket notes',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch ticket notes',
    };
  }
}

/**
 * Delete a ticket note
 */
export async function deleteTicketNoteAction(params: {
  ticketId: string | number;
  noteId: string | number;
}) {
  try {
    const response = await whmcsApi('DeleteTicketNote', {
      ticketid: params.ticketId,
      noteid: params.noteId,
    });

    if (response.result === 'success') {
      revalidatePath('/spike/support', 'page');
      return {
        success: true,
        message: 'Note deleted successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to delete note',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete note',
    };
  }
}

/**
 * Merge tickets
 */
export async function mergeTicketAction(
  ticketId: string | number,
  mergeTicketId: string | number
) {
  try {
    const response = await whmcsApi('MergeTicket', {
      ticketid: ticketId,
      mergeticketid: mergeTicketId,
    });

    if (response.result === 'success') {
      revalidatePath('/spike/support', 'page');
      return {
        success: true,
        message: 'Tickets merged successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to merge tickets',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to merge tickets',
    };
  }
}

/**
 * Get all support departments
 */
export async function getSupportDepartmentsAction() {
  try {
    const response = await whmcsApi('GetSupportDepartments', {});

    if (response.result === 'success') {
      const departments = response.departments?.department;
      const deptList = Array.isArray(departments)
        ? departments
        : departments
          ? [departments]
          : [];

      return {
        success: true,
        data: deptList,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to fetch departments',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch support departments',
    };
  }
}

/**
 * Get all clients for filter dropdown
 */
export async function getAllClientsAction() {
  try {
    const response = await whmcsApi('GetClients', {
      limitnum: 1000,
    });

    if (response.result === 'success') {
      const clients = response.clients?.client;
      const clientList = Array.isArray(clients)
        ? clients
        : clients
          ? [clients]
          : [];

      return {
        success: true,
        data: clientList.map((c: any) => ({
          id: c.id,
          name: `${c.firstname} ${c.lastname}`,
          email: c.email,
        })),
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to fetch clients',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch clients',
    };
  }
}

/**
 * Get client name by ID
 */
export async function getClientNameAction(clientId: string | number) {
  try {
    const response = await whmcsApi('GetClientsDetails', {
      clientid: clientId,
    });

    if (response.result === 'success') {
      return {
        success: true,
        name: `${response.client.firstname} ${response.client.lastname}`,
        email: response.client.email,
      };
    } else {
      return {
        success: false,
        error: 'Client not found',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch client name',
    };
  }
}

/**
 * Get ticket attachment
 */
export async function getTicketAttachmentAction(
  ticketId: string | number,
  relatedId: string | number,
  index: number,
  type: 'ticket' | 'reply' = 'reply'
) {
  try {
    const response = await whmcsApi('GetTicketAttachment', {
      ticketid: ticketId,
      relatedid: relatedId, // id of the ticket or reply
      index: index, // Attachment index (0-based)
      type: type, // "ticket" or "reply" (optional, default reply)
    });

    if (response.result === 'success') {
      return {
        success: true,
        data: response.data, // Base64 encoded file data
        filename: response.filename,
        contentType: response.contenttype,
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to get attachment',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get attachment',
    };
  }
}
