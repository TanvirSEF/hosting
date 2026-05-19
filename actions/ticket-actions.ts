'use server';

import { whmcsApi } from '@/lib/whmcs';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { z } from 'zod';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Discord bot webhook for notifications
const BOT_WEBHOOK_URL = process.env.BOT_WEBHOOK_URL || 'http://209.112.89.142:3011';
const BOT_WEBHOOK_SECRET = process.env.BOT_WEBHOOK_SECRET || 'webbly_ticket_secret_2025';

// Verify user session and get userId
async function getUserId() {
  const cookieStore = cookies();
  const session = (await cookieStore).get('session')?.value;
  if (!session) {
    throw new Error('Unauthorized');
  }
  const { payload } = await jwtVerify(session, JWT_SECRET);
  return payload.userId as string | number;
}

// Schema for creating a new ticket
const createTicketSchema = z.object({
  deptid: z.string().min(1, 'Department is required'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
});

// Schema for replying to a ticket
const replyTicketSchema = z.object({
  ticketid: z.string().or(z.number()),
  message: z.string().min(1, 'Message is required'),
});

/**
 * Get all support departments
 */
export async function getSupportDepartmentsAction() {
  try {
    await getUserId(); // Verify user is authenticated

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
 * Get ticket details with replies
 */
export async function getTicketDetailsAction(ticketId: string | number) {
  try {
    const userId = await getUserId(); // Verify user is authenticated

    const response = await whmcsApi('GetTicket', {
      ticketid: ticketId,
    });

    if (response.result === 'success') {
      // WHMCS API returns ticket data directly in response, NOT in response.ticket
      // Extract replies - the first reply (replyid: 0) is the original message
      const repliesData = response.replies?.reply;
      const allReplies = Array.isArray(repliesData)
        ? repliesData
        : repliesData
          ? [repliesData]
          : [];

      // Separate the original message from actual replies
      const originalMessage = allReplies.find(
        (r: any) => r.replyid === '0' || r.replyid === 0
      );
      const actualReplies = allReplies.filter(
        (r: any) => r.replyid !== '0' && r.replyid !== 0
      );

      // Create ticket object with all necessary fields
      const ticketData = {
        ticketid: response.ticketid,
        tid: response.tid,
        subject: response.subject,
        status: response.status,
        priority: response.priority,
        deptid: response.deptid,
        deptname: response.deptname,
        userid: response.userid,
        name: response.name,
        email: response.email,
        date: response.date,
        lastreply: response.lastreply,
        message: originalMessage?.message || '', // Original message from first reply
        attachments: originalMessage?.attachments || response.attachments || '',
        requestor_name: originalMessage?.requestor_name || response.name,
      };

      return {
        success: true,
        data: {
          ticket: ticketData,
          replies: actualReplies, // Only actual replies, not including the original message
        },
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
 * Get ticket attachment (client portal)
 */
export async function getTicketAttachmentAction(
  ticketId: string | number,
  relatedId: string | number,
  index: number,
  type: 'ticket' | 'reply' = 'reply'
) {
  try {
    await getUserId(); // Verify user is authenticated

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

/**
 * Create a new support ticket
 */
export async function createTicketAction(formData: FormData) {
  try {
    const userId = await getUserId(); // Verify user is authenticated

    const rawData = {
      deptid: formData.get('deptid'),
      subject: formData.get('subject'),
      message: formData.get('message'),
      priority: formData.get('priority') || 'Medium',
    };

    const validatedData = createTicketSchema.parse(rawData);

    // Build API params
    const apiParams: Record<string, any> = {
      deptid: validatedData.deptid,
      subject: validatedData.subject,
      message: validatedData.message,
      priority: validatedData.priority,
      clientid: userId,
    };

    // Handle attachments if present
    const attachmentsJson = formData.get('attachments');
    if (
      attachmentsJson &&
      typeof attachmentsJson === 'string' &&
      attachmentsJson.trim()
    ) {
      try {
        const attachments = JSON.parse(attachmentsJson);
        if (Array.isArray(attachments) && attachments.length > 0) {
          // WHMCS expects: base64 encoded JSON array of {name, data} objects
          const jsonString = JSON.stringify(attachments);
          const base64Attachments = Buffer.from(jsonString).toString('base64');
          apiParams.attachments = base64Attachments;
        }
      } catch (parseError) {
        console.error('Failed to parse attachments:', parseError);
      }
    }

    const response = await whmcsApi('OpenTicket', apiParams);

    if (response.result === 'success') {
      revalidatePath('/dashboard/support', 'page');

      // Return new ticket data for client-side state update
      const newTicket = {
        id: response.ticketid || response.tid,
        tid: response.tid || response.ticketid,
        deptid: validatedData.deptid,
        department: 'Support', // Will be resolved on client side
        subject: validatedData.subject,
        message: validatedData.message,
        priority: validatedData.priority || 'Medium',
        status: 'Open',
        date: new Date().toISOString(),
        lastreply: new Date().toISOString(),
      };

      // Best-effort Discord bot notification — never blocks ticket creation
      try {
        // Fetch user details for the notification
        let userName = 'Unknown';
        let userEmail = 'Unknown';
        try {
          const clientDetails = await whmcsApi('GetClientsDetails', { clientid: userId });
          if (clientDetails.result === 'success') {
            userName = `${clientDetails.client?.firstname || ''} ${clientDetails.client?.lastname || ''}`.trim() || 'Unknown';
            userEmail = clientDetails.client?.email || 'Unknown';
          }
        } catch (_) { /* non-fatal */ }

        await fetch(`${BOT_WEBHOOK_URL}/webhook/support-ticket`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-secret': BOT_WEBHOOK_SECRET,
          },
          body: JSON.stringify({
            type: 'new_ticket',
            ticketId: response.ticketid,
            tid: response.tid,
            subject: validatedData.subject,
            message: validatedData.message,
            priority: validatedData.priority,
            userName,
            userEmail,
          }),
        });
      } catch (webhookErr) {
        console.error('[DISCORD WEBHOOK] Failed to notify bot about new ticket:', webhookErr);
      }

      return {
        success: true,
        ticketId: response.ticketid,
        ticket: newTicket,
        message: 'Ticket created successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to create ticket',
      };
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || 'Validation error',
      };
    }
    return {
      success: false,
      error: error.message || 'Failed to create ticket',
    };
  }
}

/**
 * Reply to a ticket with optional attachments
 * Attachments should be passed as JSON string in format: [{name: string, data: string}]
 * where data is base64 encoded file content
 */
export async function replyTicketAction(formData: FormData) {
  try {
    const userId = await getUserId(); // Verify user is authenticated

    const rawData = {
      ticketid: formData.get('ticketid'),
      message: formData.get('message'),
    };

    const validatedData = replyTicketSchema.parse({
      ticketid: rawData.ticketid,
      message: rawData.message,
    });

    // Build API params
    const apiParams: Record<string, any> = {
      ticketid: validatedData.ticketid,
      message: validatedData.message,
      clientid: userId, // Required for client authentication
    };

    // Handle attachments if present
    // Format: JSON string of [{name: "filename.ext", data: "base64content"}, ...]
    const attachmentsJson = formData.get('attachments');
    if (
      attachmentsJson &&
      typeof attachmentsJson === 'string' &&
      attachmentsJson.trim()
    ) {
      try {
        // Parse and validate attachments
        const attachments = JSON.parse(attachmentsJson);
        if (Array.isArray(attachments) && attachments.length > 0) {
          // WHMCS expects: base64 encoded JSON array of {name, data} objects
          // where data is already base64 encoded file content
          const jsonString = JSON.stringify(attachments);
          const base64Attachments = Buffer.from(jsonString).toString('base64');
          apiParams.attachments = base64Attachments;
        }
      } catch (parseError) {
        console.error('Failed to parse attachments:', parseError);
        // Continue without attachments if parsing fails
      }
    }

    const response = await whmcsApi('AddTicketReply', apiParams);

    if (response.result === 'success') {
      revalidatePath('/dashboard/support', 'page');

      // Best-effort Discord bot notification — never blocks reply submission
      try {
        // Fetch user details for the notification
        let userName = 'Unknown';
        let userEmail = 'Unknown';
        try {
          const clientDetails = await whmcsApi('GetClientsDetails', { clientid: userId });
          if (clientDetails.result === 'success') {
            userName = `${clientDetails.client?.firstname || ''} ${clientDetails.client?.lastname || ''}`.trim() || 'Unknown';
            userEmail = clientDetails.client?.email || 'Unknown';
          }
        } catch (_) { /* non-fatal */ }

        await fetch(`${BOT_WEBHOOK_URL}/webhook/support-ticket`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-secret': BOT_WEBHOOK_SECRET,
          },
          body: JSON.stringify({
            type: 'ticket_reply',
            ticketId: validatedData.ticketid,
            message: validatedData.message,
            userName,
            userEmail,
          }),
        });
      } catch (webhookErr) {
        console.error('[DISCORD WEBHOOK] Failed to notify bot about ticket reply:', webhookErr);
      }

      return {
        success: true,
        message: 'Reply sent successfully',
      };
    } else {
      return {
        success: false,
        error: response.message || 'Failed to send reply',
      };
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || 'Validation error',
      };
    }
    return {
      success: false,
      error: error.message || 'Failed to send reply',
    };
  }
}

/**
 * Close a ticket
 */
export async function closeTicketAction(ticketId: string | number) {
  try {
    await getUserId(); // Verify user is authenticated

    // WHMCS uses UpdateTicket API with status='Closed' for closing tickets
    const response = await whmcsApi('UpdateTicket', {
      ticketid: ticketId,
      status: 'Closed',
    });

    if (response.result === 'success') {
      revalidatePath('/dashboard/support', 'page');
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
 * Reopen a closed ticket
 */
export async function reopenTicketAction(ticketId: string | number) {
  try {
    await getUserId(); // Verify user is authenticated

    const response = await whmcsApi('UpdateTicket', {
      ticketid: ticketId,
      status: 'Open',
    });

    if (response.result === 'success') {
      revalidatePath('/dashboard/support', 'page');
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
