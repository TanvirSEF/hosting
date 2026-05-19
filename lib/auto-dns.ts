import { pleskApi } from '@/lib/plesk';
import { qboxmailApi } from '@/lib/qboxmail';

const QBOXMAIL_OWNERSHIP_IP = '185.97.217.16';

interface AutoDnsResult {
    success: boolean;
    message: string;
    recordAdded?: boolean;
    domainStatus?: string;
    error?: string;
}

/**
 * Get domain info from Qboxmail (including ownership check details)
 */
async function getQboxmailDomainInfo(domainName: string) {
    const response = await qboxmailApi('/domains', 'GET');
    const domains = response.resources || response.domains || response || [];
    return domains.find((d: any) =>
        (d.name || '').toLowerCase() === domainName.toLowerCase() ||
        (d.domain || '').toLowerCase() === domainName.toLowerCase()
    ) || null;
}

/**
 * Check if a DNS record already exists in Plesk (prevent duplicates)
 */
async function dnsRecordExists(siteId: number, host: string, type: string, value: string): Promise<boolean> {
    try {
        const records = await pleskApi.getDnsRecords(siteId);
        const recordList = Array.isArray(records) ? records : records?.records || [];

        return recordList.some((r: any) =>
            r.type === type &&
            (r.host || '').toLowerCase() === host.toLowerCase() &&
            (r.value || '').toLowerCase() === value.toLowerCase()
        );
    } catch {
        return false;
    }
}

/**
 * Automatically add Qboxmail ownership verification DNS record to Plesk
 *
 * Flow:
 * 1. Get domain status from Qboxmail
 * 2. If status is 'enabled' → already verified, skip
 * 3. If status is 'ownership_check' → get possession_a_record
 * 4. Find domain in Plesk (get site_id)
 * 5. Check if DNS record already exists (no duplicates)
 * 6. Add DNS A record: {possession_code}.{domain} A 185.97.217.16
 *
 * @param domainName - The domain name (e.g., 'example.com')
 * @returns Result of the auto-DNS operation
 */
export async function autoSetupQboxmailDns(domainName: string): Promise<AutoDnsResult> {
    try {
        // Step 1: Get domain info from Qboxmail
        const qboxDomain = await getQboxmailDomainInfo(domainName);

        if (!qboxDomain) {
            return {
                success: false,
                message: `Domain ${domainName} not found in Qboxmail`,
            };
        }

        const status = (qboxDomain.status || '').toLowerCase();

        // Step 2: Already verified/enabled — nothing to do
        if (status === 'enabled' || status === 'active') {
            return {
                success: true,
                message: `Domain ${domainName} is already verified (status: ${status})`,
                recordAdded: false,
                domainStatus: status,
            };
        }

        // Step 3: Only handle ownership_check status
        if (status !== 'ownership_check') {
            return {
                success: false,
                message: `Domain ${domainName} has status '${status}' — cannot auto-verify`,
                domainStatus: status,
            };
        }

        // Step 4: Get the possession code from Qboxmail
        const possessionCode = qboxDomain.possession_a_record;
        if (!possessionCode) {
            return {
                success: false,
                message: `Domain ${domainName} has no possession_a_record`,
                domainStatus: status,
            };
        }

        // Step 5: Find domain in Plesk
        const siteId = await pleskApi.getSiteIdByDomain(domainName);
        if (!siteId) {
            return {
                success: false,
                message: `Domain ${domainName} not found in Plesk — cannot add DNS record`,
                domainStatus: status,
            };
        }

        // Step 6: Build DNS record values
        const host = `${possessionCode}.${domainName}.`;
        const type = 'A';
        const value = QBOXMAIL_OWNERSHIP_IP;

        // Step 7: Check if record already exists (idempotent — no duplicates)
        const exists = await dnsRecordExists(siteId, host, type, value);
        if (exists) {
            return {
                success: true,
                message: `DNS A record ${host} already exists in Plesk`,
                recordAdded: false,
                domainStatus: status,
            };
        }

        // Step 8: Add the DNS A record to Plesk
        await pleskApi.addDnsRecord(siteId, type, host, value);

        console.log(`[Auto DNS] Added ownership A record: ${host} → ${value} (Plesk site ${siteId})`);

        return {
            success: true,
            message: `DNS A record ${host} → ${value} added to Plesk`,
            recordAdded: true,
            domainStatus: status,
        };
    } catch (error: any) {
        console.error('[Auto DNS] Error:', error.message);
        return {
            success: false,
            message: 'Auto DNS setup failed',
            error: error.message,
        };
    }
}

/**
 * Also add MX, SPF, and DKIM records for full email setup
 * Call this AFTER ownership is verified
 */
export async function autoSetupEmailDnsRecords(domainName: string): Promise<{
    success: boolean;
    added: string[];
    errors: string[];
}> {
    const added: string[] = [];
    const errors: string[] = [];

    try {
        const siteId = await pleskApi.getSiteIdByDomain(domainName);
        if (!siteId) {
            errors.push(`Domain ${domainName} not found in Plesk`);
            return { success: false, added, errors };
        }

        // Get domain info from Qboxmail for DKIM
        const qboxDomain = await getQboxmailDomainInfo(domainName);
        const dkimSelector = qboxDomain?.dkim_selector;
        const dkimPublicKey = qboxDomain?.dkim_public_key;

        // Records to add (email delivery essentials)
        const records = [
            // MX records
            { type: 'MX', host: `${domainName}.`, value: '10 mx1.qboxmail.com.' },
            { type: 'MX', host: `${domainName}.`, value: '20 mx2.qboxmail.com.' },
            // SPF
            { type: 'TXT', host: `${domainName}.`, value: 'v=spf1 include:spf.qboxmail.com ~all' },
        ];

        // DKIM record (if available)
        if (dkimSelector && dkimPublicKey) {
            records.push({
                type: 'TXT',
                host: `${dkimSelector}._domainkey.${domainName}.`,
                value: `v=DKIM1; k=rsa; p=${dkimPublicKey}`,
            });
        }

        for (const record of records) {
            try {
                const exists = await dnsRecordExists(siteId, record.host, record.type, record.value);
                if (!exists) {
                    await pleskApi.addDnsRecord(siteId, record.type, record.host, record.value);
                    added.push(`${record.type} ${record.host}`);
                } else {
                    added.push(`${record.type} ${record.host} (already exists)`);
                }
            } catch (err: any) {
                errors.push(`Failed to add ${record.type} ${record.host}: ${err.message}`);
            }
        }

        return { success: errors.length === 0, added, errors };
    } catch (error: any) {
        errors.push(error.message);
        return { success: false, added, errors };
    }
}
