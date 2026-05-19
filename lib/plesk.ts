import axios from 'axios';
import https from 'https';

const PLESK_API_URL = process.env.PLESK_API_URL || 'https://31.97.193.141:8443/api/v2';
const PLESK_API_KEY = process.env.PLESK_API_KEY || '60dae3c5-e9db-c197-74c4-6ece2608b96f';

// Log warning in production if using defaults
if (process.env.NODE_ENV === 'production' && (!process.env.PLESK_API_URL || !process.env.PLESK_API_KEY)) {
    console.warn('WARNING: Using default Plesk API credentials in production. Please set PLESK_API_URL and PLESK_API_KEY environment variables.');
}

// Log configuration status in development for debugging
if (process.env.NODE_ENV === 'development') {
    const isUsingDefaultUrl = !process.env.PLESK_API_URL;
    const isUsingDefaultKey = !process.env.PLESK_API_KEY;
    if (isUsingDefaultUrl || isUsingDefaultKey) {
        console.warn('[Plesk] Using default configuration:', {
            url: isUsingDefaultUrl ? 'DEFAULT' : 'ENV',
            key: isUsingDefaultKey ? 'DEFAULT' : 'ENV'
        });
    }
}

// Create an https agent to ignore SSL errors if using IP address (common for Plesk)
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

const pleskClient = axios.create({
    baseURL: PLESK_API_URL,
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': PLESK_API_KEY,
        'Accept': 'application/json',
    },
    httpsAgent,
    timeout: 60000, // 60 seconds timeout for long-running CLI calls
});

export interface PleskWPInstance {
    id: number;
    mainDomainId: number;
    siteUrl: string;
    loginUrl: string;
    name: string;
    version: string;
}

export interface CliResponse {
    code: number;
    stdout: string;
    stderr: string;
}

export const pleskApi = {
    /**
     * Helper to call WP Toolkit CLI via REST API
     */
    callWpToolkit: async (args: string[]): Promise<any> => {
        try {
            // The endpoint for CLI calls
            const response = await pleskClient.post<CliResponse>('/cli/extension/call', {
                params: ['--call', 'wp-toolkit', ...args],
            });

            if (response.data.code !== 0) {
                throw new Error(response.data.stderr || response.data.stdout || 'Unknown CLI Error');
            }

            // Parse JSON output if requested
            if (args.includes('json') && response.data.stdout) {
                try {
                    return JSON.parse(response.data.stdout);
                } catch (e) {
                    return response.data.stdout;
                }
            }

            return response.data.stdout;
        } catch (error: any) {
            // Use console.warn instead of console.error since callers like getInstances()
            // handle errors gracefully by returning empty arrays
            console.warn('Plesk CLI Error Details:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                config_url: error.config?.url,
                code: error.code // e.g. ECONNREFUSED, ETIMEDOUT
            });

            let errorMessage = 'Failed to execute WP Toolkit command';
            if (error.code === 'ECONNREFUSED') errorMessage = 'Connection Refused: Ensure Plesk server is reachable and port 8443 is open.';
            if (error.code === 'ETIMEDOUT') errorMessage = 'Connection Timeout: The Plesk server took too long to respond.';
            if (error.response?.status === 401) errorMessage = 'Plesk API Authentication Failed (401): The API key is invalid or expired. Please verify PLESK_API_KEY in environment variables.';
            if (error.response?.status === 403) errorMessage = 'Plesk API Access Forbidden (403): Check API key permissions and IP whitelist in Plesk.';
            if (error.response?.data?.stderr) errorMessage = error.response.data.stderr;

            throw new Error(errorMessage);
        }
    },

    /**
     * Get all domains (Using standard REST API)
     * @param name Optional domain name to filter by
     */
    getDomains: async (name?: string): Promise<any[]> => {
        try {
            const url = name ? `/domains?name=${name}` : '/domains';
            const response = await pleskClient.get(url);
            return response.data;
        } catch (error: any) {
            // Enhanced error logging matching callWpToolkit pattern
            const errorDetails = {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                code: error.code,
                config_url: error.config?.url,
            };
            console.error('Plesk getDomains Error:', errorDetails);

            // Provide specific error messages for common issues
            let errorMessage = 'Failed to fetch domains';
            if (error.response?.status === 401) {
                errorMessage = 'Plesk API Authentication Failed (401): The API key is invalid or expired. Please verify PLESK_API_KEY in environment variables.';
            } else if (error.response?.status === 403) {
                errorMessage = 'Plesk API Access Forbidden (403): Check API key permissions and IP whitelist in Plesk.';
            } else if (error.code === 'ECONNREFUSED') {
                errorMessage = 'Connection refused: Ensure Plesk server is reachable and port 8443 is open.';
            } else if (error.code === 'ETIMEDOUT') {
                errorMessage = 'Connection timeout: Plesk server took too long to respond.';
            } else if (error.message) {
                errorMessage = `Failed to fetch domains: ${error.message}`;
            }

            throw new Error(errorMessage);
        }
    },

    /**
     * Get all WordPress instances
     * Returns empty array on error to allow graceful degradation
     */
    getInstances: async (): Promise<PleskWPInstance[]> => {
        try {
            // plesk ext wp-toolkit --list -format json
            const result = await pleskApi.callWpToolkit(['--list', '-format', 'json']);
            return Array.isArray(result) ? result : [];
        } catch (error) {
            // Return empty array instead of throwing to prevent console errors
            // This allows the dashboard to load even when Plesk is unavailable
            return [];
        }
    },

    /**
     * Install WordPress on a domain
     * @param domainId The Plesk internal ID for the domain
     * @param options Optional installation parameters
     */
    installWordPress: async (domainId: number, options?: {
        adminPassword?: string;
        adminEmail?: string;
        adminName?: string;
    }): Promise<any> => {
        // plesk ext wp-toolkit --install -domain-id ID -format json
        // Note: -admin-name is INCORRECT, correct flag is --username or -username
        // This function installs WP with 'admin' user, then we update password separately.
        const args = ['--install', '-domain-id', domainId.toString(), '-format', 'json'];

        // We can't easily set password via env here, so we will use changeAdminPassword after install
        // But if we could, it would be via env var ADMIN_PASSWORD

        if (options?.adminEmail) {
            args.push('-admin-email', options.adminEmail);
        }

        if (options?.adminName) {
            args.push('-username', options.adminName);
        }

        return await pleskApi.callWpToolkit(args);
    },

    /**
     * Change WordPress Admin Password using WP-CLI
     * plesk ext wp-toolkit --wp-cli -instance-id ID -- user update USERNAME --user_pass=PASSWORD
     */
    changeAdminPassword: async (instanceId: number, password: string, username: string = 'admin'): Promise<any> => {
        // Using WP-CLI is robust
        return await pleskApi.callWpToolkit([
            '--wp-cli',
            '-instance-id', instanceId.toString(),
            '--',
            'user', 'update', username,
            `--user_pass=${password}`
        ]);
    },

    /**
     * Get login URL for a WordPress instance with SSO token
     * Uses multiple methods to achieve automatic login
     * @param instanceId The Plesk WP instance ID
     */
    getLoginUrl: async (instanceId: number): Promise<string> => {
        try {
            // Method 1: Try WP Toolkit login URL generation
            try {
                const loginLink = await pleskApi.callWpToolkit([
                    '--login-url',
                    '-instance-id', instanceId.toString(),
                    '-format', 'json'
                ]);

                if (typeof loginLink === 'string') {
                    try {
                        const parsed = JSON.parse(loginLink);
                        const url = parsed.loginUrl || parsed.url || loginLink;
                        if (url && url.includes('token=') || url.includes('sso=')) {
                            return url;
                        }
                    } catch {
                        if (loginLink.includes('token=') || loginLink.includes('sso=')) {
                            return loginLink;
                        }
                    }
                }
            } catch (e) {
                console.log('WP Toolkit login URL not available, trying alternative method');
            }

            // Method 2: Generate temporary admin password and create login URL
            const tempPassword = Math.random().toString(36).slice(-12);
            const adminUsername = 'admin';

            // Set temporary password
            await pleskApi.changeAdminPassword(instanceId, tempPassword, adminUsername);

            // Get WordPress instance details
            const instances = await pleskApi.getInstances();
            const instance = instances.find(i => i.id === instanceId);

            if (!instance) {
                throw new Error('Instance not found');
            }

            // Create login URL with credentials (for automatic login)
            let baseUrl = instance.loginUrl;

            // Fix double wp-login.php issue
            if (baseUrl.includes('/wp-login.php/wp-login.php')) {
                baseUrl = baseUrl.replace('/wp-login.php/wp-login.php', '/wp-login.php');
            } else if (baseUrl.endsWith('/wp-admin/')) {
                baseUrl = baseUrl.replace('/wp-admin/', '/wp-login.php');
            } else if (!baseUrl.includes('/wp-login.php')) {
                baseUrl = baseUrl.replace(/\/$/, '') + '/wp-login.php';
            }

            const loginUrl = `${baseUrl}?log=${encodeURIComponent(adminUsername)}&pwd=${encodeURIComponent(tempPassword)}&rememberme=true`;

            return loginUrl;

        } catch (error: any) {
            console.warn('SSO methods failed, using standard login URL:', error.message);

            // Final fallback to standard login URL
            const instances = await pleskApi.getInstances();
            const instance = instances.find(i => i.id === instanceId);

            if (!instance) {
                throw new Error('Instance not found');
            }

            return instance.loginUrl;
        }
    },

    /**
     * Find WP instance by domain name
     */
    findInstanceByDomain: async (domain: string): Promise<PleskWPInstance | null> => {
        try {
            const instances = await pleskApi.getInstances();
            // Filter by siteUrl containing domain (robust check)
            return instances.find(i => i.siteUrl.includes(domain)) || null;
        } catch (error) {
            return null;
        }
    },

    /**
     * Delete WordPress installation
     * @param instanceId The Plesk WP instance ID
     */
    deleteWordPress: async (instanceId: number): Promise<any> => {
        // plesk ext wp-toolkit --remove -instance-id ID -format json
        return await pleskApi.callWpToolkit(['--remove', '-instance-id', instanceId.toString(), '-format', 'json']);
    },

    /**
     * Call Generic Plesk CLI
     */
    callCli: async (command: string, args: string[]): Promise<any> => {
        try {
            // The endpoint for CLI calls
            const response = await pleskClient.post<CliResponse>('/cli/extension/call', {
                params: ['--call', command, ...args],
            });

            if (response.data.code !== 0) {
                throw new Error(response.data.stderr || response.data.stdout || 'Unknown CLI Error');
            }

            return response.data.stdout;
        } catch (error: any) {
            console.error('Plesk CLI Error:', error.message);
            throw new Error('Failed to execute Plesk CLI command');
        }
    },

    /**
     * Create Plesk Session
     * Uses REST API /sessions which is more modern and robust
     */
    createSession: async (login: string, userIp: string): Promise<string> => {
        try {
            // Method 1: Try REST API (Modern and cleaner)
            try {
                // POST /api/v2/sessions
                const response = await pleskClient.post('/sessions', {
                    login: login,
                    ip_address: userIp
                });

                if (response.data && response.data.key) {
                    return response.data.key;
                }
            } catch (restError: any) {
                console.warn('REST API Session Creation failed. Status:', restError.response?.status, 'Error:', restError.message);
                if (restError.response?.data) {
                    console.warn('REST API Error Details:', JSON.stringify(restError.response.data));
                }
                // Continue to XML fallback
            }

            // Method 2: Fallback to XML API (Legacy but often enabled)
            const baseUrl = new URL(PLESK_API_URL);
            const origin = baseUrl.origin;

            // We must include <source_server> (or c_email/c_phone/starting_url) as required by schema
            const xmlData = `
<packet>
<server>
<create_session>
<login>${login}</login>
<data>
<user_ip>${userIp}</user_ip>
<source_server>${baseUrl.hostname}</source_server>
</data>
</create_session>
</server>
</packet>`;

            const response = await axios.post(`${origin}/enterprise/control/agent.php`, xmlData, {
                headers: {
                    'Content-Type': 'text/xml',
                    'KEY': PLESK_API_KEY,
                    'X-API-Key': PLESK_API_KEY
                },
                httpsAgent,
                timeout: 10000
            });

            const data = response.data;

            // Simple regex match for ID
            const match = data.match(/<id>(.*?)<\/id>/);
            if (match && match[1]) {
                return match[1];
            }

            // Check for error in XML response
            if (data.includes('<status>error</status>')) {
                const errText = data.match(/<errtext>(.*?)<\/errtext>/);
                const msg = errText ? errText[1] : 'Unknown XML API Error';
                console.error('Plesk XML API Error Response:', data);
                throw new Error(msg);
            }

            throw new Error('Failed to parse session ID from Plesk response');

        } catch (error: any) {
            console.error('Plesk Session Creation Final Failure:', {
                message: error.message,
                code: error.code,
                status: error.response?.status,
                data: error.response?.data
            });
            let sessionErrorMessage = error.message;
            if (error.code === 'ECONNREFUSED') {
                sessionErrorMessage = 'Connection refused: Ensure Plesk server is reachable and port 8443 is open.';
            } else if (error.response?.status === 401) {
                sessionErrorMessage = 'Plesk API Authentication Failed (401): The API key is invalid or expired. Please verify PLESK_API_KEY in environment variables.';
            } else if (error.response?.status === 403) {
                sessionErrorMessage = 'Plesk API Access Forbidden (403): Check API key permissions and IP whitelist in Plesk.';
            }
            throw new Error('Failed to create Plesk session: ' + sessionErrorMessage);
        }
    },

    /**
     * Get DNS records for a domain by site ID
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
};
