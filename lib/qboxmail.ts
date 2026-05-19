import axios, { AxiosRequestConfig } from 'axios';
import { randomBytes } from 'crypto';

const QBOXMAIL_API_URL = process.env.QBOXMAIL_API_URL || 'https://api.qboxmail.com/api';
const QBOXMAIL_API_TOKEN = process.env.QBOXMAIL_API_TOKEN!;

/**
 * Base QBoxMail API caller with token authentication
 * @param endpoint - API endpoint (e.g., '/domains', '/emails')
 * @param method - HTTP method (GET, POST, PUT, DELETE)
 * @param data - Request payload for POST/PUT requests
 * @returns API response data
 */
export const qboxmailApi = async (
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
) => {
    if (!QBOXMAIL_API_TOKEN) {
        throw new Error('QBOXMAIL_API_TOKEN is not configured');
    }

    const config: AxiosRequestConfig = {
        method,
        url: `${QBOXMAIL_API_URL}${endpoint}`,
        headers: {
            'X-Api-Token': QBOXMAIL_API_TOKEN,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        config.data = data;
    }

    try {
        const response = await axios(config);
        return response.data;
    } catch (error: any) {
        const errData = error.response?.data;
        if (errData && typeof errData === 'object') {
            // Log full error response for debugging validation failures
            console.error('[Qboxmail API] Full error response:', JSON.stringify(errData));
            console.error('[Qboxmail API] Status:', error.response?.status, 'Endpoint:', endpoint, 'Method:', method);

            // Build a detailed error message including field-level validation errors
            const parts: string[] = [];
            if (errData.message) parts.push(errData.message);
            if (errData.error) parts.push(errData.error);
            if (errData.errors && typeof errData.errors === 'object') {
                for (const [field, messages] of Object.entries(errData.errors)) {
                    const msgs = Array.isArray(messages) ? messages.join(', ') : String(messages);
                    parts.push(`${field}: ${msgs}`);
                }
            }
            if (errData.full_messages && Array.isArray(errData.full_messages)) {
                parts.push(...errData.full_messages);
            }
            if (errData.detail) parts.push(errData.detail);

            const errorMsg = parts.length > 0 ? parts.join(' | ') : 'QBoxMail API error';
            throw new Error(errorMsg);
        } else {
            throw error;
        }
    }
};

/**
 * Add a new domain to QBoxMail.
 * @param domainName - The domain name to add.
 * @returns The response from the API.
 */
function generatePassword(length: number = 24): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    const bytes = randomBytes(length);
    return Array.from(bytes, (b: number) => chars[b % chars.length]).join('');
}

// Qboxmail only accepts specific byte values for max_email_quota
const VALID_QUOTA_BYTES = [
    1073741824, 2147483648, 3221225472, 4294967296, 5368709120,
    6442450944, 7516192768, 8589934592, 17179869184, 26843545600,
    53687091200, 107374182400,
];

function mbToQuotaBytes(mb: number): number {
    const target = mb * 1024 * 1024;
    return VALID_QUOTA_BYTES.reduce((prev, curr) =>
        Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
    );
}

export const addDomain = async (domainName: string) => {
    try {
        const postmasterPassword = generatePassword();
        const response = await qboxmailApi('/domains', 'POST', {
            name: domainName,
            postmaster_password: postmasterPassword,
            postmaster_password_confirmation: postmasterPassword,
        });
        return {
            success: true,
            data: response,
            message: `Domain ${domainName} added successfully.`,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || `Failed to add domain ${domainName}.`,
        };
    }
};

export interface QboxmailDomainResult {
    code: string;
    status: string;
    status_detail?: string | null;
    possession_a_record?: string | null;
    dkim_selector?: string | null;
    dkim_public_key?: string | null;
}

/**
 * Helper to get the internal QBoxMail code for a domain name.
 * If the domain is not found, it attempts to add it automatically (Industry Standard Workflow).
 * @param domainName - The domain name (e.g., 'example.com')
 * @returns The domain code (e.g., 'D123456')
 */
export const getDomainCode = async (domainName: string): Promise<QboxmailDomainResult> => {
    // If it already looks like a code (starts with D and followed by numbers), return it
    if (/^D\d+$/.test(domainName)) {
        return { code: domainName, status: 'unknown' };
    }

    const normalizedDomain = domainName.toLowerCase().trim();

    const fetchDomain = async () => {
        const response = await qboxmailApi('/domains', 'GET');
        const domains = response.resources || response.domains || response || [];
        const domain = domains.find((d: any) =>
            (d.name || '').toLowerCase() === normalizedDomain ||
            (d.domain || '').toLowerCase() === normalizedDomain
        );
        return domain ? {
            code: domain.code,
            status: domain.status,
            status_detail: domain.status_detail || null,
            possession_a_record: domain.possession_a_record || null,
            dkim_selector: domain.dkim_selector || null,
            dkim_public_key: domain.dkim_public_key || null,
        } : null;
    };

    try {
        let domain = await fetchDomain();

        // If domain not found, attempt to add it
        if (!domain) {
            console.log(`[Qboxmail] Domain ${domainName} not found. Auto-provisioning...`);
            const addResult = await addDomain(domainName);
            if (!addResult.success) {
                console.warn(`Auto-provisioning warning for ${domainName}: ${addResult.error}. Retrying domain lookup...`);
            }
            // Always re-fetch: domain may already exist even if add failed
            domain = await fetchDomain();
        }

        if (!domain || !domain.code) {
            throw new Error(`Domain ${domainName} could not be found or provisioned in QBoxMail`);
        }

        const statusLower = (domain.status || '').toLowerCase();

        // Terminal state — cannot proceed
        if (statusLower === 'deleted') {
            throw new Error(`DOMAIN_NOT_ACTIVE:${domainName}`);
        }

        // Needs ownership verification — try auto-DNS setup
        if (statusLower === 'ownership_check') {
            console.log(`[Qboxmail] Domain ${domainName} needs ownership verification. Attempting auto-DNS...`);

            try {
                const { autoSetupQboxmailDns } = await import('@/lib/auto-dns');
                const dnsResult = await autoSetupQboxmailDns(domainName);

                if (dnsResult.success && dnsResult.recordAdded) {
                    console.log(`[Qboxmail] Auto-DNS record added for ${domainName}. Domain may take a few minutes to verify.`);
                } else if (dnsResult.success && !dnsResult.recordAdded) {
                    console.log(`[Qboxmail] DNS record already exists or domain already verified.`);
                } else {
                    console.warn(`[Qboxmail] Auto-DNS failed: ${dnsResult.message}`);
                }
            } catch (autoDnsError: any) {
                console.warn(`[Qboxmail] Auto-DNS error: ${autoDnsError.message}`);
            }

            // Return the domain object — caller can check status
            // Email creation will work once Qboxmail verifies the DNS record
            return domain;
        }

        // Other non-ideal statuses — warn but proceed
        const warningStatuses = ['disabled', 'suspended', 'rejected'];
        if (warningStatuses.includes(statusLower)) {
            console.warn(`Domain ${domainName} has status '${domain.status}' in QBoxMail. Proceeding with caution.`);
        }

        return domain;
    } catch (error: any) {
        if (error.message?.startsWith('DOMAIN_NOT_ACTIVE:') || error.message?.startsWith('DOMAIN_NEEDS_VERIFICATION:')) {
            throw error;
        }
        throw new Error(`Failed to handle domain code for ${domainName}: ${error.message}`);
    }
};

/**
 * Create a new email account
 * @param domainName - Domain name or domain code
 * @param email - Email username (e.g., 'info')
 * @param password - Account password
 * @param firstName - User's first name
 * @param quota - Storage quota in MB (default: 1024)
 * @returns Created email account details
 */
export const createEmailAccount = async (
    domainName: string,
    email: string,
    password: string,
    firstName: string = 'User',
    quota: number = 1024
) => {
    try {
        const { code: domainCode } = await getDomainCode(domainName);
        const response = await qboxmailApi(`/domains/${domainCode}/email_accounts`, 'POST', {
            name: email,
            firstname: firstName,
            password,
            password_confirmation: password,
            max_email_quota: mbToQuotaBytes(quota),
            webmail_date_format: 'DD/MM/YYYY',
        });

        return {
            success: true,
            data: response,
            message: 'Email account created successfully',
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to create email account',
        };
    }
};

/**
 * Delete an email account
 * @param domainName - Domain name or domain code
 * @param email - Email username to delete
 * @returns Success response
 */
export const deleteEmailAccount = async (domainName: string, email: string) => {
    try {
        const { code: domainCode } = await getDomainCode(domainName);
        await qboxmailApi(`/domains/${domainCode}/email_accounts/${email}`, 'DELETE');

        return {
            success: true,
            message: 'Email account deleted successfully',
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to delete email account',
        };
    }
};

/**
 * Update email account password
 * @param domainName - Domain name or domain code
 * @param email - Email username
 * @param newPassword - New password
 * @returns Success response
 */
export const updateEmailPassword = async (
    domainName: string,
    email: string,
    newPassword: string
) => {
    try {
        const { code: domainCode } = await getDomainCode(domainName);
        await qboxmailApi(`/domains/${domainCode}/email_accounts/${email}`, 'PUT', {
            password: newPassword,
            password_confirmation: newPassword,
        });

        return {
            success: true,
            message: 'Password updated successfully',
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to update password',
        };
    }
};

/**
 * Get email account information
 * @param domainName - Domain name or domain code
 * @param email - Email username
 * @returns Email account details
 */
export const getEmailAccountInfo = async (domainName: string, email: string) => {
    try {
        const { code: domainCode } = await getDomainCode(domainName);
        const response = await qboxmailApi(`/domains/${domainCode}/email_accounts/${email}`, 'GET');

        return {
            success: true,
            data: response,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to get email account info',
        };
    }
};

/**
 * List all email accounts for a domain
 * @param domainName - Domain name or domain code
 * @returns List of email accounts
 */
export const listEmailAccounts = async (domainName: string) => {
    try {
        const { code: domainCode } = await getDomainCode(domainName);
        const response = await qboxmailApi(`/domains/${domainCode}/email_accounts`, 'GET');

        return {
            success: true,
            data: response.resources || response.email_accounts || response.emails || response || [],
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to list email accounts',
            data: [],
        };
    }
};

/**
 * Create an email alias
 * @param domainName - Domain name or domain code
 * @param alias - Alias email address
 * @param destination - Destination email address
 * @returns Success response
 */
export const createEmailAlias = async (
    domainName: string,
    alias: string,
    destination: string
) => {
    try {
        const { code: domainCode } = await getDomainCode(domainName);
        await qboxmailApi(`/domains/${domainCode}/aliases`, 'POST', {
            name: alias,
            destination,
        });

        return {
            success: true,
            message: 'Email alias created successfully',
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to create email alias',
        };
    }
};

/**
 * Update email account quota
 * @param domainName - Domain name or domain code
 * @param email - Email username
 * @param quota - New quota in MB
 * @returns Success response
 */
export const setEmailQuota = async (
    domainName: string,
    email: string,
    quota: number
) => {
    try {
        const { code: domainCode } = await getDomainCode(domainName);
        await qboxmailApi(`/domains/${domainCode}/email_accounts/${email}`, 'PUT', {
            max_email_quota: mbToQuotaBytes(quota),
        });

        return {
            success: true,
            message: 'Email quota updated successfully',
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to update email quota',
        };
    }
};

/**
 * Get list of domains
 * @returns List of domains in QBoxMail account
 */
export const listDomains = async () => {
    try {
        const response = await qboxmailApi('/domains', 'GET');

        return {
            success: true,
            data: response.resources || response.domains || response || [],
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to list domains',
            data: [],
        };
    }
};

/**
 * Get DNS records required for domain verification in QBoxMail
 * @param domainName - The domain name to check
 * @returns DNS records needed or domain status info
 */
export const getDomainDnsRecords = async (domainName: string) => {
    try {
        const normalizedDomain = domainName.toLowerCase().trim();
        const response = await qboxmailApi('/domains', 'GET');
        const domains = response.resources || response.domains || response || [];
        const domain = domains.find((d: any) =>
            (d.name || '').toLowerCase() === normalizedDomain ||
            (d.domain || '').toLowerCase() === normalizedDomain
        );

        if (!domain) {
            return {
                success: false,
                error: `Domain ${domainName} not found in QBoxMail`,
                status: 'not_found',
            };
        }

        const records: { type: string; host: string; value: string; priority?: number }[] = [];
        const statusLower = (domain.status || '').toLowerCase();

        // Ownership verification record (needed when status is ownership_check)
        // Qboxmail requires: {possession_code}.{domain} A 185.97.217.16
        if (domain.possession_a_record) {
            records.push({
                type: 'A',
                host: `${domain.possession_a_record}.${normalizedDomain}`,
                value: '185.97.217.16',
            });
        }

        // MX records for Qboxmail (always needed for email)
        records.push(
            { type: 'MX', host: normalizedDomain, value: 'mx1.qboxmail.com.', priority: 10 },
            { type: 'MX', host: normalizedDomain, value: 'mx2.qboxmail.com.', priority: 20 },
        );

        // SPF record
        records.push({
            type: 'TXT',
            host: normalizedDomain,
            value: '"v=spf1 include:qboxmail.com ~all"',
        });

        // DKIM record if available
        if (domain.dkim_selector && domain.dkim_public_key) {
            records.push({
                type: 'TXT',
                host: `${domain.dkim_selector}.${normalizedDomain}`,
                value: `"${domain.dkim_public_key}"`,
            });
        }

        return {
            success: true,
            status: domain.status,
            statusDetail: domain.status_detail,
            isHealthy: domain.is_healthy,
            needsVerification: statusLower === 'ownership_check',
            possessionCode: domain.possession_a_record || null,
            records,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to get DNS records',
        };
    }
};

