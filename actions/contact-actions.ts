'use server';

import { z } from 'zod';
import { sendContactFormEmail } from '@/lib/email';
import { getContactSubmissionsCollection } from '@/lib/db';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Bot webhook 
const BOT_WEBHOOK_URL = process.env.BOT_WEBHOOK_URL || 'http://localhost:3001';
const BOT_WEBHOOK_SECRET = process.env.BOT_WEBHOOK_SECRET || '';

async function sendToBotTicket(data: {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  phone?: string;
  subject?: string;
}) {
  try {
    const res = await fetch(`${BOT_WEBHOOK_URL}/webhook/ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': BOT_WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        subject: data.subject || 'General Enquiry',
        message: data.message,
        language: 'en',
      }),
    });
    if (!res.ok) {
      console.error('[BOT TICKET] Failed:', res.status, await res.text());
    }
  } catch (err) {
    // Non-fatal — bot may be offline, don't block the form submission
    console.error('[BOT TICKET] Could not reach bot webhook:', err);
  }
}

async function sendToDiscord(data: {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  phone?: string;
  subject?: string;
}) {
  if (!DISCORD_WEBHOOK_URL) return;

  try {
    const embed = {
      title: '📬 New Contact Form Submission',
      description: `**From:** ${data.firstName} ${data.lastName}\n**Email:** [${data.email}](mailto:${data.email})`,
      color: 9196287, // #8C52FF (Brand Color)
      thumbnail: {
        url: 'https://webblyhosting.comhttps://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/webblymediablack.svg', // Using the logo found in public/images
      },
      fields: [
        ...(data.phone ? [{ name: '📞 Phone', value: data.phone, inline: true }] : []),
        ...(data.subject ? [{ name: '📌 Subject', value: data.subject, inline: true }] : []),
        {
          name: '📝 Message',
          value: data.message.length > 1024 ? data.message.substring(0, 1021) + '...' : data.message
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'WebblyHost Contact System',
        icon_url: 'https://webblyhosting.comhttps://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/favicon.webp',
      },
    };

    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'WebblyHost Bot',
        avatar_url: 'https://webblyhosting.comhttps://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/webblymediablack.svg',
        embeds: [embed],
      }),
    });
  } catch (error) {
    console.error('Failed to send Discord notification:', error);
  }
}

// Define validation schema
// Define validation schema
const contactFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export type ContactFormState = {
  success: boolean;
  message?: string;
  discordChannelUrl?: string;
  errors?: {
    firstName?: string[];
    lastName?: string[];
    email?: string[];
    phone?: string[];
    subject?: string[];
    message?: string[];
  };
};

export async function submitContactForm(
  prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const rawData = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    email: formData.get('email') as string,
    phone: (formData.get('phone') as string) || undefined,
    subject: (formData.get('subject') as string) || undefined,
    message: formData.get('message') as string,
  };

  // Validate data
  const validatedFields = contactFormSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please fix the errors below.',
    };
  }

  try {
    // Save to database
    const collection = await getContactSubmissionsCollection();
    await collection.insertOne({
      ...validatedFields.data,
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send email
    await sendContactFormEmail(validatedFields.data);

    // Send simple embed to Discord channel (existing)
    await sendToDiscord(validatedFields.data);

    // Also create a private ticket channel via the bot — capture the channel URL
    let discordChannelUrl: string | undefined;
    try {
      const res = await fetch(`${BOT_WEBHOOK_URL}/webhook/ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': BOT_WEBHOOK_SECRET,
        },
        body: JSON.stringify({
          name: `${validatedFields.data.firstName} ${validatedFields.data.lastName}`,
          email: validatedFields.data.email,
          subject: validatedFields.data.subject || 'General Enquiry',
          message: validatedFields.data.message,
          language: 'en',
        }),
      });
      if (res.ok) {
        const json = await res.json();
        discordChannelUrl = json.channelUrl ?? undefined;
      } else {
        console.error('[BOT TICKET] Failed:', res.status, await res.text());
      }
    } catch (err) {
      console.error('[BOT TICKET] Could not reach bot webhook:', err);
    }

    return {
      success: true,
      message: "Message sent! We'll get back to you shortly.",
      discordChannelUrl,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Something went wrong. Please try again later.',
    };
  }
}
