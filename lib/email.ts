import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send password reset email
 * @param to - Recipient email address
 * @param resetToken - Password reset token
 * @param name - User's name
 * @returns Email send result
 */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  name: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://webblyhosting.com';
  const resetUrl = `${appUrl}/en/reset-password/${resetToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'WebblyHosting <noreply@webblyhosting.com>',
      to: [to],
      subject: 'Reset Your Password - WebblyHosting',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">WebblyHosting</h1>
            </div>
            
            <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>
              
              <p style="color: #4b5563; font-size: 16px;">Hi ${name},</p>
              
              <p style="color: #4b5563; font-size: 16px;">
                We received a request to reset your password for your WebblyHosting account. 
                Click the button below to create a new password:
              </p>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${resetUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 14px 35px; 
                          text-decoration: none; 
                          border-radius: 6px; 
                          font-weight: 600;
                          font-size: 16px;
                          display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color: #8b5cf6; font-size: 14px; word-break: break-all;">
                ${resetUrl}
              </p>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  ⚠️ <strong>Important:</strong> This link will expire in 1 hour. 
                  If you didn't request a password reset, please ignore this email.
                </p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Need help? Contact our support team at 
                <a href="mailto:support@webblyhosting.com" style="color: #8b5cf6; text-decoration: none;">
                  support@webblyhosting.com
                </a>
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p style="margin: 5px 0;">© 2025 WebblyHosting. All rights reserved.</p>
              <p style="margin: 5px 0;">This is an automated email. Please do not reply.</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    throw error;
  }
}

/**
 * Send test email to verify Resend configuration
 * @param to - Test email address
 */
export async function sendTestEmail(to: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'WebblyHosting <onboarding@resend.dev>',
      to: [to],
      subject: 'Test Email - WebblyHosting',
      html: '<p>This is a test email from WebblyHosting. Your email configuration is working!</p>',
    });

    if (error) {
      throw new Error(`Test email failed: ${error.message}`);
    }

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    throw error;
  }
}

/**
 * Send contact form email to admin
 * @param data - Contact form data
 */
export async function sendContactFormEmail(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    throw new Error('Server configuration error: ADMIN_EMAIL not set');
  }

  const emailSubject = data.subject
    ? `[${data.subject}] New Contact Form Submission`
    : `New Contact Form Submission from ${data.firstName} ${data.lastName}`;

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'WebblyHosting Contact <contact@webblyhosting.com>',
      to: [adminEmail],
      replyTo: data.email,
      subject: emailSubject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>New Contact Form Submission</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #8C52FF;">New Contact Form Submission</h2>
              <p>You have received a new message from the contact form on your website.</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 150px;">Name:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.firstName} ${data.lastName}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                  <a href="mailto:${data.email}" style="color: #8C52FF;">${data.email}</a>
                </td>
              </tr>
              ${
                data.phone
                  ? `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Phone:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                  <a href="tel:${data.phone}" style="color: #333; text-decoration: none;">${data.phone}</a>
                </td>
              </tr>
              `
                  : ''
              }
              ${
                data.subject
                  ? `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Subject:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.subject}</td>
              </tr>
              `
                  : ''
              }
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; vertical-align: top;">Message:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; white-space: pre-wrap;">${data.message}</td>
              </tr>
            </table>
            
            <div style="margin-top: 30px; font-size: 14px; color: #6b7280; text-align: center;">
              <p>Reply to this email to respond directly to ${data.firstName}.</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return { success: true, messageId: emailData?.id };
  } catch (error: any) {
    throw error;
  }
}

/**
 * Send welcome email to new users
 * @param to - New user's email address
 * @param name - User's first name
 */
export async function sendWelcomeEmail(to: string, name: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const dashboardUrl = `${appUrl}/dashboard`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'WebblyHosting <noreply@webblyhosting.com>',
      to: [to],
      subject: 'Welcome to WebblyHosting! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to WebblyHosting</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">WebblyHosting</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Premium Web Hosting Solutions</p>
            </div>
            
            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">Welcome aboard, ${name}! 🎉</h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.8;">
                Thank you for choosing <strong>WebblyHosting</strong> for your web hosting needs. 
                We're thrilled to have you as part of our community!
              </p>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.8;">
                Your account has been successfully created and you're all set to get started. 
                Here's what you can do next:
              </p>
              
              <div style="background: #f9fafb; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #1f2937; margin-top: 0; font-size: 18px; margin-bottom: 15px;">🚀 Quick Start Guide</h3>
                <ul style="color: #4b5563; font-size: 15px; line-height: 2; margin: 0; padding-left: 20px;">
                  <li>Browse our hosting plans and services</li>
                  <li>Register or transfer your domain</li>
                  <li>Set up your first website</li>
                  <li>Explore our knowledge base</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${dashboardUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 16px 40px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: 600;
                          font-size: 16px;
                          display: inline-block;
                          box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                  Access Your Dashboard →
                </a>
              </div>
              
              <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af; font-size: 15px; line-height: 1.6;">
                  💡 <strong>Pro Tip:</strong> Complete your profile in the dashboard to unlock all features 
                  and get personalized recommendations for your hosting needs.
                </p>
              </div>
              
              <div style="border-top: 1px solid #e5e7eb; margin-top: 35px; padding-top: 25px;">
                <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 15px;">Need Help?</h3>
                <p style="color: #6b7280; font-size: 15px; margin: 0;">
                  Our support team is here to help you 24/7. Feel free to reach out:
                </p>
                <p style="margin: 15px 0 0 0;">
                  <a href="mailto:support@webblyhosting.com" style="color: #8b5cf6; text-decoration: none; font-weight: 500;">
                    📧 support@webblyhosting.com
                  </a>
                </p>
              </div>
            </div>
            
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; padding: 25px 30px; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                Follow us for updates and tips:
              </p>
              <div style="margin: 15px 0;">
                <a href="#" style="color: #8b5cf6; text-decoration: none; margin: 0 10px; font-size: 14px;">Twitter</a>
                <span style="color: #d1d5db;">•</span>
                <a href="#" style="color: #8b5cf6; text-decoration: none; margin: 0 10px; font-size: 14px;">Facebook</a>
                <span style="color: #d1d5db;">•</span>
                <a href="#" style="color: #8b5cf6; text-decoration: none; margin: 0 10px; font-size: 14px;">LinkedIn</a>
              </div>
            </div>
            
            <div style="text-align: center; padding: 25px 20px; color: #9ca3af; font-size: 13px;">
              <p style="margin: 5px 0;">© 2025 WebblyHosting. All rights reserved.</p>
              <p style="margin: 5px 0;">This is an automated email. Please do not reply.</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      throw new Error(`Failed to send welcome email: ${error.message}`);
    }

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    throw error;
  }
}

/**
 * Send custom email from admin
 * @param to - Recipient email
 * @param subject - Email subject
 * @param htmlContent - HTML content (body)
 * @param name - Optional client name for personalization
 */
export async function sendCustomEmail(
  to: string,
  subject: string,
  htmlContent: string,
  name: string = 'Valued Client'
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'WebblyHosting <noreply@webblyhosting.com>',
      to: [to],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">WebblyHosting</h1>
            </div>
            
            <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="color: #4b5563; font-size: 16px;">Hello ${name},</p>
              
              <div style="color: #4b5563; font-size: 16px; margin-bottom: 30px;">
                ${htmlContent.replace(/\n/g, '<br />')}
              </div>
              
              <div style="border-top: 1px solid #e5e7eb; margin-top: 35px; padding-top: 25px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Best regards,<br>
                  <strong>WebblyHosting Support Team</strong>
                </p>
              </div>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p style="margin: 5px 0;">© 2025 WebblyHosting. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    throw error;
  }
}
