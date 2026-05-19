import axios from 'axios';

// Spaceship API base URL — per docs: https://docs.spaceship.dev/
const SPACESHIP_API_URL ='https://spaceship.dev';
const SPACESHIP_API_KEY ='nM0M9dvibznLIwDRgeuZ';
const SPACESHIP_API_SECRET ='YnhQDGyllXgVaAlaNg6i1rFTrPgqgf3f0mSsKXeOvbQJkgOSH4SBQUSMS8go7OPL'

// Docs auth example:
//   -H 'X-Api-Key: ...' -H 'X-Api-Secret: ...'
// Note: exact casing matters (X-Api-Key / X-Api-Secret, not X-API-Key)
const spaceshipClient = axios.create({
    baseURL: `${SPACESHIP_API_URL}/api/v1`,
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SPACESHIP_API_KEY,
        'X-API-Secret': SPACESHIP_API_SECRET,
        'User-Agent': 'WebblyHost/1.0 (Domain Registrar API)',
        'Accept': 'application/json',
    },
    timeout: 30000, // 30 second timeout
});

export interface SpaceshipContact {
    firstName: string;
    lastName: string;
    email: string;
    address1: string;
    address2?: string;
    city: string;
    stateProvince: string; // Docs: stateProvince (not "state")
    postalCode: string;    // Docs: postalCode (not "zip")
    country: string;       // ISO 3166-1 alpha-2 (2-letter code)
    phone: string;         // Format: +1.123456789
    phoneExt?: string;
    organization?: string;
    taxNumber?: string;
}

export const spaceshipApi = {
    /**
     * Check domain availability
     * Docs: POST /v1/domains/availability
     * Body: { domains: ["example.com"] }
     * Response: { domains: [{ domain: '...', result: 'available'|'registered', premiumPricing: [...] }] }
     */
    checkAvailability: async (domain: string) => {
        try {
            // Correct endpoint: /domains/available (not /domains/availability)
            const response = await spaceshipClient.post('/domains/available', {
                domains: [domain],
            });
            return response.data;
        } catch (error: any) {
            console.error('Spaceship Availability Check Error:', JSON.stringify({
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                requestBody: { domains: [domain] },
            }, null, 2));
            throw error;
        }
    },

    /**
     * Create / save a contact profile
     * Docs: POST /v1/contacts
     * Returns: { contactId: '...' }
     */
    createContact: async (contact: SpaceshipContact) => {
        try {
            const response = await spaceshipClient.post('/contacts', contact);
            return response.data; // { contactId: '...' }
        } catch (error: any) {
            console.error('Spaceship Create Contact Error:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Register a domain
     * Docs: POST /v1/domains/{domain}
     * Domain goes in the URL path, NOT the body.
     * Returns an async operation (202).
     */
    registerDomain: async (
        domain: string,
        years: number = 1,
        contactId: string,
        privacy: { level: 'standard' | 'high'; userConsent: boolean } = { level: 'high', userConsent: true }
    ) => {
        try {
            const response = await spaceshipClient.post(`/domains/${domain}`, {
                autoRenew: true,
                years,
                privacyProtection: privacy,
                contacts: {
                    registrant: contactId,
                    admin: contactId,
                    tech: contactId,
                    billing: contactId,
                },
            });
            return response.data;
        } catch (error: any) {
            console.error('Spaceship Register Domain Error:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Renew a domain
     * Docs: POST /v1/domains/{domain}/renew
     * Requires: { years, currentExpirationDate }
     */
    renewDomain: async (domain: string, years: number = 1, currentExpirationDate: string) => {
        try {
            const response = await spaceshipClient.post(`/domains/${domain}/renew`, {
                years,
                currentExpirationDate, // ISO 8601 e.g. "2100-01-01T00:00:00.000Z"
            });
            return response.data;
        } catch (error: any) {
            console.error('Spaceship Renew Domain Error:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Transfer a domain
     * Docs: POST /v1/domains/{domain}/transfer
     * Domain goes in the URL path, authCode goes in body.
     */
    transferDomain: async (domain: string, authCode: string, contactId: string) => {
        try {
            const response = await spaceshipClient.post(`/domains/${domain}/transfer`, {
                autoRenew: true,
                privacyProtection: { level: 'high', userConsent: true },
                contacts: {
                    registrant: contactId,
                    admin: contactId,
                    tech: contactId,
                    billing: contactId,
                },
                authCode,
            });
            return response.data;
        } catch (error: any) {
            console.error('Spaceship Transfer Domain Error:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get domain information
     * Docs: GET /v1/domains/{domain}
     */
    getDomainInfo: async (domain: string) => {
        try {
            const response = await spaceshipClient.get(`/domains/${domain}`);
            return response.data;
        } catch (error: any) {
            console.error('Spaceship Get Domain Info Error:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Update Nameservers
     * Docs: PUT /v1/domains/{domain}/nameservers
     * Body: { provider: "custom", hosts: ["ns1.example.com", "ns2.example.com"] }
     */
    updateNameservers: async (domain: string, nameservers: string[]) => {
        try {
            const response = await spaceshipClient.put(`/domains/${domain}/nameservers`, {
                provider: 'custom',
                hosts: nameservers,
            });
            return response.data;
        } catch (error: any) {
            console.error('Spaceship Update Nameservers Error:', error.response?.data || error.message);
            throw error;
        }
    },
};
