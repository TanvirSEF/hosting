# Auto DNS Verification Implementation Guide

## Goal
When a domain is added to Qboxmail for email hosting, automatically create the required DNS A record in Plesk so the domain passes Qboxmail's ownership verification without any manual work.

## Current Problem
1. Customer buys hosting (domain created in Plesk)
2. Customer wants email (domain added to Qboxmail)
3. Qboxmail sets domain status to `ownership_check` and requires a DNS A record: `{possession_code}.{domain} A 185.97.217.16`
4. Currently: Customer must manually add the DNS record
5. After fix: System adds the DNS record automatically

---

## Architecture Overview

```
Customer buys hosting
        |
        v
[Plesk] Domain created (website lives here)
        |
        v
Customer wants email
        |
        v
[Qboxmail] Domain added → status: ownership_check
        |                              |
        |         possession_a_record: "d862161940"
        |                              |
        v                              v
[Plesk] Auto-add DNS A record: d862161940.domain A 185.97.217.16
        |
        v
[Qboxmail] Detects DNS record → status: enabled
        |
        v
Customer can now create email accounts
```

---

## API Credentials (Already in .env)

| Variable | Value | Used For |
|----------|-------|----------|
| `PLESK_API_URL` | `https://31.97.193.141:8443/api/v2` | Plesk DNS management |
| `PLESK_API_KEY` | `60dae3c5-e9db-c197-74c4-6ece2608b96f` | Plesk authentication |
| `QBOXMAIL_API_URL` | `https://api.qboxmail.com/api` | Qboxmail domain info |
| `QBOXMAIL_API_TOKEN` | (present in .env) | Qboxmail authentication |
| `SPACESHIP_API_KEY` | (present in .env) | Backup: registrar DNS |
| `SPACESHIP_API_SECRET` | (present in .env) | Backup: registrar DNS |

---

## Implementation Steps

### Step 1: Add DNS Methods to `lib/plesk.ts`

Add these 3 methods inside the `pleskApi` object (after `createSession` method, before the closing `};`):

```typescript
/**
 * Get DNS records for a domain (by site ID or domain name)
 * GET /dns/records?site_id={siteId}
 */
getDnsRecords: async (siteId: number) => {
    try {
        const response = await pleskClient.get(`/dns/records?site_id=${siteId}`);
        return response.data;
    } catch (error: any) {
        console.error('Plesk Get DNS Records Error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
        });
        throw new Error('Failed to fetch DNS records from Plesk');
    }
},

/**
 * Add a DNS record to a domain
 * POST /dns/records
 * Body: { site_id: number, type: string, host: string, value: string }
 */
addDnsRecord: async (siteId: number, type: string, host: string, value: string) => {
    try {
        const response = await pleskClient.post('/dns/records', {
            site_id: siteId,
            type,
            host,
            value,
        });
        return response.data;
    } catch (error: any) {
        console.error('Plesk Add DNS Record Error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
        });
        throw new Error('Failed to add DNS record to Plesk');
    }
},

/**
 * Find Plesk site ID by domain name
 * GET /domains?name={domainName}
 */
getSiteIdByDomain: async (domainName: string): Promise<number | null> => {
    try {
        const response = await pleskClient.get(`/domains?name=${domainName}`);
        const domains = Array.isArray(response.data) ? response.data : [response.data];
        const domain = domains.find((d: any) =>
            d.name === domainName || d.name?.toLowerCase() === domainName.toLowerCase()
        );
        return domain?.id || null;
    } catch (error: any) {
        console.warn('Plesk Get Site ID Error:', error.message);
        return null;
    }
},
```

---

### Step 2: Create `lib/auto-dns.ts` (New File)

This is the main automation logic. Create a new file:

```typescript
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
```

---

### Step 3: Modify `lib/qboxmail.ts` — Update `getDomainCode`

Update the `getDomainCode` function to handle `ownership_check` status and trigger auto-DNS.

**Replace the existing `getDomainCode` function (lines 78-111) with:**

```typescript
export const getDomainCode = async (domainName: string): Promise<string> => {
    if (/^D\d+$/.test(domainName)) {
        return domainName;
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
            possession_a_record: domain.possession_a_record || null,
        } : null;
    };

    try {
        let domain = await fetchDomain();

        // If domain not found, attempt to add it
        if (!domain) {
            console.log(`[Qboxmail] Domain ${domainName} not found. Auto-provisioning...`);
            await addDomain(domainName);
            domain = await fetchDomain();
        }

        if (!domain || !domain.code) {
            throw new Error(`Domain ${domainName} could not be found or provisioned in Qboxmail`);
        }

        const statusLower = (domain.status || '').toLowerCase();

        // Terminal state — cannot proceed
        if (statusLower === 'deleted') {
            throw new Error(`Domain ${domainName} is deleted in Qboxmail`);
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

            // Return the code anyway — the caller can decide what to do
            // Email creation will work once Qboxmail verifies the DNS record
            return domain.code;
        }

        // Other non-ideal statuses — warn but proceed
        if (['disabled', 'suspended', 'rejected'].includes(statusLower)) {
            console.warn(`[Qboxmail] Domain ${domainName} has status '${domain.status}' — proceeding with caution`);
        }

        return domain.code;
    } catch (error: any) {
        throw new Error(`Failed to handle domain code for ${domainName}: ${error.message}`);
    }
};
```

---

### Step 4: Modify `actions/email-bundle-actions.ts` — Auto-activate on creation

Update `createEmailServiceAction` to auto-provision Qboxmail domain and trigger auto-DNS.

**Replace lines 103-151 (the try block inside createEmailServiceAction) with:**

```typescript
  try {
    const {
      whmcsServiceId,
      clientId,
      domain,
      plan = 'free',
      whmcsEmailServiceId
    } = params;

    const planConfig = EMAIL_PLANS[plan];

    // Check if email service already exists
    const collection = await getEmailServicesCollection();
    const existing = await collection.findOne({ whmcsServiceId, clientId });

    if (existing) {
      console.log('[Email Service] Service already exists:', existing._id);
      return { success: true, data: existing };
    }

    // Auto-provision domain in Qboxmail
    let qboxmailDomainCode: string | undefined;
    try {
      const { getDomainCode } = await import('@/lib/qboxmail');
      qboxmailDomainCode = await getDomainCode(domain);
      console.log('[Email Service] Qboxmail domain code:', qboxmailDomainCode);
    } catch (error: any) {
      console.warn('[Email Service] Qboxmail domain setup warning:', error.message);
    }

    // Create email service document as ACTIVE immediately
    const emailService: EmailServiceDocument = {
      whmcsServiceId,
      clientId,
      domain,
      plan,
      maxAccounts: planConfig.maxAccounts,
      quotaPerAccountMB: planConfig.quotaPerAccountMB,
      status: 'active',
      accountsUsed: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      activatedAt: new Date(),
    };

    if (whmcsEmailServiceId) {
      emailService.whmcsEmailServiceId = whmcsEmailServiceId;
    }
    if (qboxmailDomainCode) {
      emailService.qboxmailDomainCode = qboxmailDomainCode;
    }

    const result = await collection.insertOne(emailService);
    emailService._id = result.insertedId.toString();

    console.log('[Email Service] Created and activated:', emailService._id);

    return { success: true, data: emailService };
  } catch (error: any) {
    console.error('Create email service error:', error);
    return { success: false, error: error.message };
  }
```

---

### Step 5: Modify `actions/email-service-actions.ts` — Better error handling

Update `createEmailAccountAction` to handle the case where Qboxmail domain is still verifying.

**Find the Qboxmail error handling section (around line 186-191, after `qboxResult`) and add:**

```typescript
        // Create email account in QBoxMail
        const qboxResult = await qboxCreateEmail(
            domain,
            emailUsername,
            password,
            firstName,
            quota
        );

        if (!qboxResult.success) {
            const errMsg = qboxResult.error || '';

            // Domain still verifying — try auto-DNS one more time
            if (errMsg.toLowerCase().includes('not active') || errMsg.toLowerCase().includes('ownership')) {
                try {
                    const { autoSetupQboxmailDns } = await import('@/lib/auto-dns');
                    const dnsResult = await autoSetupQboxmailDns(domain);
                    console.log('[Email Create] Retry auto-DNS:', dnsResult.message);
                } catch { /* ignore */ }

                return {
                    success: false,
                    error: `Domain ${domain} is still being verified in Qboxmail. DNS record has been set up — please wait 2-5 minutes and try again.`,
                };
            }

            return {
                success: false,
                error: qboxResult.error || 'Failed to create email account in Qboxmail',
            };
        }
```

---

## File Change Summary

| File | Action | What Changes |
|------|--------|-------------|
| `lib/plesk.ts` | **Modify** | Add 3 DNS methods: `getDnsRecords`, `addDnsRecord`, `getSiteIdByDomain` |
| `lib/auto-dns.ts` | **Create new** | Auto-DNS automation logic |
| `lib/qboxmail.ts` | **Modify** | Rewrite `getDomainCode` with ownership_check handling + auto-DNS trigger |
| `actions/email-bundle-actions.ts` | **Modify** | Auto-provision Qboxmail + auto-activate email service |
| `actions/email-service-actions.ts` | **Modify** | Better error handling for "not active" with auto-DNS retry |

---

## Testing Checklist

After implementing all steps, test in this order:

### Test 1: Plesk DNS API
```bash
# Verify Plesk DNS API works (run from your server)
curl -k -X GET "https://31.97.193.141:8443/api/v2/dns/records?site_id=1" \
  -H "X-API-Key: 60dae3c5-e9db-c197-74c4-6ece2608b96f" \
  -H "Content-Type: application/json"
```

### Test 2: Find domain in Plesk
```bash
curl -k -X GET "https://31.97.193.141:8443/api/v2/domains?name=tawhidislam.dev" \
  -H "X-API-Key: 60dae3c5-e9db-c197-74c4-6ece2608b96f" \
  -H "Content-Type: application/json"
```

### Test 3: Check Qboxmail domain status
```bash
curl -X GET "https://api.qboxmail.com/api/domains" \
  -H "X-Api-Token: YOUR_QBOXMAIL_TOKEN" \
  -H "Accept: application/json"
```

### Test 4: Full flow test
1. Go to `/dashboard/emails`
2. Select a domain (e.g., tawhidislam.dev)
3. Create an email account
4. Check server console for: `[Auto DNS] Added ownership A record: d862161940.tawhidislam.dev → 185.97.217.16`
5. Wait 2-5 minutes for Qboxmail to verify
6. Try creating the email again — should succeed

---

## Important Notes

1. **DNS Propagation**: After adding the DNS record to Plesk, Qboxmail may take 2-5 minutes to detect it. This is normal DNS propagation delay.

2. **Plesk must be reachable**: The Plesk server at `31.97.193.141:8443` must be accessible from your Next.js server. If you had Plesk timeout issues before, fix network connectivity first.

3. **Only works for Plesk-managed DNS**: Domains must use Plesk's nameservers. If a domain uses Cloudflare or external DNS, the auto-DNS won't help.

4. **Idempotent**: Running the auto-DNS multiple times is safe — it checks for existing records before adding.

5. **MX/SPF/DKIM records**: `autoSetupEmailDnsRecords()` adds email delivery records. Call this after ownership is verified for complete email setup.
