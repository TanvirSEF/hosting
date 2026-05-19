'use server';

/**
 * Map IANA timezone identifiers to ISO 3166-1 alpha-2 country codes.
 * Covers EU countries with VAT, common markets, and major economies.
 */
function timezoneToCountry(tz: string): string {
    const map: Record<string, string> = {
        // Scandinavia & Nordics
        'Europe/Stockholm': 'SE',
        'Europe/Oslo': 'NO',
        'Europe/Copenhagen': 'DK',
        'Europe/Helsinki': 'FI',
        'Atlantic/Reykjavik': 'IS',
        // Western Europe
        'Europe/Berlin': 'DE',
        'Europe/Busingen': 'DE',
        'Europe/Paris': 'FR',
        'Europe/Madrid': 'ES',
        'Europe/Rome': 'IT',
        'Europe/Amsterdam': 'NL',
        'Europe/Brussels': 'BE',
        'Europe/Vienna': 'AT',
        'Europe/Dublin': 'IE',
        'Europe/Lisbon': 'PT',
        'Europe/Luxembourg': 'LU',
        'Europe/Monaco': 'MC',
        'Europe/Zurich': 'CH',
        'Europe/Vaduz': 'LI',
        // Eastern Europe
        'Europe/Athens': 'GR',
        'Europe/Warsaw': 'PL',
        'Europe/Prague': 'CZ',
        'Europe/Budapest': 'HU',
        'Europe/Bucharest': 'RO',
        'Europe/Sofia': 'BG',
        'Europe/Zagreb': 'HR',
        'Europe/Ljubljana': 'SI',
        'Europe/Skopje': 'MK',
        'Europe/Riga': 'LV',
        'Europe/Tallinn': 'EE',
        'Europe/Vilnius': 'LT',
        'Europe/Kiev': 'UA',
        'Europe/Kyiv': 'UA',
        'Europe/Chisinau': 'MD',
        'Europe/Tiraspol': 'MD',
        'Europe/Mariehamn': 'AX',
        // Southern Europe / Mediterranean
        'Europe/Nicosia': 'CY',
        'Europe/Famagusta': 'CY',
        'Europe/Malta': 'MT',
        'Europe/Gibraltar': 'GI',
        'Europe/Andorra': 'AD',
        'Europe/San_Marino': 'SM',
        'Europe/Vatican': 'VA',
        // Balkans
        'Europe/Belgrade': 'RS',
        'Europe/Podgorica': 'ME',
        'Europe/Sarajevo': 'BA',
        'Europe/Tirane': 'AL',
        'Europe/Kosovo': 'XK',
        // UK
        'Europe/London': 'GB',
        // Russia & CIS
        'Europe/Moscow': 'RU',
        'Europe/Kaliningrad': 'RU',
        'Europe/Samara': 'RU',
        'Europe/Saratov': 'RU',
        'Europe/Ulyanovsk': 'RU',
        'Europe/Volgograd': 'RU',
        'Europe/Astrakhan': 'RU',
        'Europe/Kirov': 'RU',
        'Asia/Yekaterinburg': 'RU',
        'Asia/Omsk': 'RU',
        'Asia/Novosibirsk': 'RU',
        'Asia/Barnaul': 'RU',
        'Asia/Tomsk': 'RU',
        'Asia/Novokuznetsk': 'RU',
        'Asia/Krasnoyarsk': 'RU',
        'Asia/Irkutsk': 'RU',
        'Asia/Chita': 'RU',
        'Asia/Yakutsk': 'RU',
        'Asia/Khandyga': 'RU',
        'Asia/Vladivostok': 'RU',
        'Asia/Ust-Nera': 'RU',
        'Asia/Magadan': 'RU',
        'Asia/Sakhalin': 'RU',
        'Asia/Srednekolymsk': 'RU',
        'Asia/Kamchatka': 'RU',
        'Asia/Anadyr': 'RU',
        'Asia/Tbilisi': 'GE',
        'Asia/Yerevan': 'AM',
        'Asia/Baku': 'AZ',
        // Americas — North
        'America/New_York': 'US',
        'America/Chicago': 'US',
        'America/Denver': 'US',
        'America/Los_Angeles': 'US',
        'America/Anchorage': 'US',
        'America/Juneau': 'US',
        'America/Sitka': 'US',
        'America/Metlakatla': 'US',
        'America/Yakutat': 'US',
        'America/Nome': 'US',
        'America/Adak': 'US',
        'America/Indiana/Indianapolis': 'US',
        'America/Indiana/Vincennes': 'US',
        'America/Indiana/Winamac': 'US',
        'America/Indiana/Petersburg': 'US',
        'America/Indiana/Tell_City': 'US',
        'America/Indiana/Knox': 'US',
        'America/Kentucky/Louisville': 'US',
        'America/Kentucky/Monticello': 'US',
        'America/North_Dakota/Center': 'US',
        'America/North_Dakota/New_Salem': 'US',
        'America/North_Dakota/Beulah': 'US',
        'America/Michigan/Detroit': 'US',
        'America/Michigan/Sault_Ste_Marie': 'US',
        'America/Detroit': 'US',
        'Pacific/Honolulu': 'US',
        'America/Toronto': 'CA',
        'America/Vancouver': 'CA',
        'America/Montreal': 'CA',
        'America/Edmonton': 'CA',
        'America/Winnipeg': 'CA',
        'America/Halifax': 'CA',
        'America/Regina': 'CA',
        'America/St_Johns': 'CA',
        'America/Swift_Current': 'CA',
        'America/Dawson_Creek': 'CA',
        'America/Creston': 'CA',
        'America/Nipigon': 'CA',
        'America/Thunder_Bay': 'CA',
        'America/Pangnirtung': 'CA',
        'America/Iqaluit': 'CA',
        'America/Rankin_Inlet': 'CA',
        'America/Resolute': 'CA',
        'America/Atikokan': 'CA',
        'America/Blanc-Sablon': 'CA',
        'America/Cambridge_Bay': 'CA',
        'America/Glace_Bay': 'CA',
        'America/Goose_Bay': 'CA',
        'America/Moncton': 'CA',
        'America/Whitehorse': 'CA',
        'America/Dawson': 'CA',
        'America/Inuvik': 'CA',
        'America/Nassau': 'BS',
        'America/Jamaica': 'JM',
        'America/Port-au-Prince': 'HT',
        'America/Santo_Domingo': 'DO',
        'America/Havana': 'CU',
        // Americas — Central
        'America/Mexico_City': 'MX',
        'America/Cancun': 'MX',
        'America/Merida': 'MX',
        'America/Monterrey': 'MX',
        'America/Matamoros': 'MX',
        'America/Mazatlan': 'MX',
        'America/Chihuahua': 'MX',
        'America/Ojinaga': 'MX',
        'America/Hermosillo': 'MX',
        'America/Bahia_Banderas': 'MX',
        'America/Tijuana': 'MX',
        'America/Ciudad_Juarez': 'MX',
        'America/Belize': 'BZ',
        'America/Guatemala': 'GT',
        'America/Tegucigalpa': 'HN',
        'America/Managua': 'NI',
        'America/Costa_Rica': 'CR',
        'America/El_Salvador': 'SV',
        'America/Panama': 'PA',
        // Americas — South
        'America/Bogota': 'CO',
        'America/Buenos_Aires': 'AR',
        'America/Sao_Paulo': 'BR',
        'America/Rio_Branco': 'BR',
        'America/Cuiaba': 'BR',
        'America/Santarem': 'BR',
        'America/Bahia': 'BR',
        'America/Belem': 'BR',
        'America/Araguaina': 'BR',
        'America/Maceio': 'BR',
        'America/Recife': 'BR',
        'America/Fortaleza': 'BR',
        'America/Noronha': 'BR',
        'America/Eirunepe': 'BR',
        'America/Porto_Velho': 'BR',
        'America/Manaus': 'BR',
        'America/Porto_Acre': 'BR',
        'America/Santiago': 'CL',
        'America/Punta_Arenas': 'CL',
        'America/Lima': 'PE',
        'America/Quito': 'EC',
        'America/Guayaquil': 'EC',
        'America/Caracas': 'VE',
        'America/La_Paz': 'BO',
        'America/Sucre': 'BO',
        'America/Cochabamba': 'BO',
        'America/Asuncion': 'PY',
        'America/Montevideo': 'UY',
        'America/Paramaribo': 'SR',
        'America/Georgetown': 'GY',
        'America/Cayenne': 'GF',
        // Asia — East
        'Asia/Tokyo': 'JP',
        'Asia/Seoul': 'KR',
        'Asia/Shanghai': 'CN',
        'Asia/Chongqing': 'CN',
        'Asia/Hong_Kong': 'HK',
        'Asia/Macau': 'MO',
        'Asia/Taipei': 'TW',
        'Asia/Ulaanbaatar': 'MN',
        'Asia/Choibalsan': 'MN',
        // Asia — Southeast
        'Asia/Singapore': 'SG',
        'Asia/Kuala_Lumpur': 'MY',
        'Asia/Kuching': 'MY',
        'Asia/Bangkok': 'TH',
        'Asia/Jakarta': 'ID',
        'Asia/Makassar': 'ID',
        'Asia/Jayapura': 'ID',
        'Asia/Pontianak': 'ID',
        'Asia/Manila': 'PH',
        'Asia/Ho_Chi_Minh': 'VN',
        'Asia/Saigon': 'VN',
        'Asia/Phnom_Penh': 'KH',
        'Asia/Vientiane': 'LA',
        'Asia/Yangon': 'MM',
        'Asia/Rangoon': 'MM',
        'Asia/Bandar_Seri_Begawan': 'BN',
        'Asia/Brunei': 'BN',
        'Asia/Timor-Leste': 'TL',
        // Asia — South
        'Asia/Kolkata': 'IN',
        'Asia/Calcutta': 'IN',
        'Asia/Colombo': 'LK',
        'Asia/Dhaka': 'BD',
        'Asia/Kathmandu': 'NP',
        'Asia/Karachi': 'PK',
        'Asia/Kabul': 'AF',
        'Asia/Maldives': 'MV',
        // Asia — West / Middle East
        'Asia/Dubai': 'AE',
        'Asia/Muscat': 'OM',
        'Asia/Qatar': 'QA',
        'Asia/Riyadh': 'SA',
        'Asia/Kuwait': 'KW',
        'Asia/Bahrain': 'BH',
        'Asia/Baghdad': 'IQ',
        'Asia/Amman': 'JO',
        'Asia/Beirut': 'LB',
        'Asia/Jerusalem': 'IL',
        'Asia/Tel_Aviv': 'IL',
        'Asia/Damascus': 'SY',
        'Asia/Ankara': 'TR',
        'Asia/Istanbul': 'TR',
        'Asia/Tehran': 'IR',
        // Oceania
        'Australia/Sydney': 'AU',
        'Australia/Melbourne': 'AU',
        'Australia/Brisbane': 'AU',
        'Australia/Perth': 'AU',
        'Australia/Adelaide': 'AU',
        'Australia/Darwin': 'AU',
        'Australia/Hobart': 'AU',
        'Australia/Lindeman': 'AU',
        'Australia/Lord_Howe': 'AU',
        'Australia/Currie': 'AU',
        'Australia/Eucla': 'AU',
        'Australia/Broken_Hill': 'AU',
        'Pacific/Auckland': 'NZ',
        'Pacific/Chatham': 'NZ',
        'Pacific/Fiji': 'FJ',
        'Pacific/Guam': 'GU',
        'Pacific/Pago_Pago': 'AS',
        'Pacific/Port_Moresby': 'PG',
        // Africa
        'Africa/Cairo': 'EG',
        'Africa/Johannesburg': 'ZA',
        'Africa/Cape_Town': 'ZA',
        'Africa/Lagos': 'NG',
        'Africa/Nairobi': 'KE',
        'Africa/Dar_es_Salaam': 'TZ',
        'Africa/Addis_Ababa': 'ET',
        'Africa/Accra': 'GH',
        'Africa/Algiers': 'DZ',
        'Africa/Tunis': 'TN',
        'Africa/Casablanca': 'MA',
        'Africa/Rabat': 'MA',
        'Africa/Tripoli': 'LY',
        'Africa/Khartoum': 'SD',
        'Africa/Mogadishu': 'SO',
        'Africa/Djibouti': 'DJ',
        'Africa/Kigali': 'RW',
        'Africa/Kampala': 'UG',
        'Africa/Lusaka': 'ZM',
        'Africa/Harare': 'ZW',
        'Africa/Maputo': 'MZ',
        'Africa/Windhoek': 'NA',
        'Africa/Gaborone': 'BW',
        'Africa/Maseru': 'LS',
        'Africa/Mbabane': 'SZ',
        'Africa/Antananarivo': 'MG',
        'Africa/Mauritius': 'MU',
        'Africa/Port_Louis': 'MU',
        'Africa/Victoria': 'SC',
        'Africa/El_Aaiun': 'EH',
        'Africa/Bangui': 'CF',
        'Africa/Brazzaville': 'CG',
        'Africa/Douala': 'CM',
        'Africa/Kinshasa': 'CD',
        'Africa/Libreville': 'GA',
        'Africa/Luanda': 'AO',
        'Africa/Malabo': 'GQ',
        'Africa/Ndjamena': 'TD',
        'Africa/Niamey': 'NE',
        'Africa/Ouagadougou': 'BF',
        'Africa/Bissau': 'GW',
        'Africa/Conakry': 'GN',
        'Africa/Abidjan': 'CI',
        'Africa/Monrovia': 'LR',
        'Africa/Bamako': 'ML',
        'Africa/Nouakchott': 'MR',
        'Africa/Sao_Tome': 'ST',
        'Africa/Lome': 'TG',
        'Indian/Antananarivo': 'MG',
        'Indian/Mauritius': 'MU',
        'Indian/Mahe': 'SC',
        'Indian/Comoro': 'KM',
        'Indian/Mayotte': 'YT',
        'Indian/Reunion': 'RE',
    };
    return map[tz] || 'US';
}

/**
 * Detect user's country from their IP address
 * Uses multiple geolocation services with fallback.
 *
 * @param clientTimezone - The user's browser timezone (e.g. 'Europe/Stockholm').
 *   Always pass `Intl.DateTimeFormat().resolvedOptions().timeZone` from the client.
 *   When IP-based detection disagrees with the timezone (VPN / proxy / CDN edge),
 *   IP-based detection takes priority to allow users to specify their location via VPNs.
 */
export async function detectCountryFromIP(clientTimezone?: string) {
    // Pre-compute timezone-based country so we can compare with IP results
    const tzCountry = clientTimezone ? timezoneToCountry(clientTimezone) : null;

    if (process.env.NODE_ENV === 'development' && process.env.DEV_COUNTRY_CODE) {
        return {
            success: true,
            country: process.env.DEV_COUNTRY_CODE,
            countryName: 'Development Mode',
            city: 'Local',
            region: 'Dev',
            ip: '127.0.0.1'
        };
    }

    try {
        const { headers } = await import('next/headers');
        const headersList = await headers();

        // 1. Cloudflare Detection (Primary)
        const cfCountry = headersList.get('cf-ipcountry');
        const cfIP = headersList.get('cf-connecting-ip');

        if (cfCountry && cfIP) {
            const ipCountry = cfCountry.toUpperCase();

            console.log(`[Geolocation] Cloudflare Country Detected: ${cfCountry}`);

            if (tzCountry && ipCountry !== tzCountry) {
                console.log(`[Geolocation] CF says ${ipCountry} but timezone says ${tzCountry}, using IP country (${ipCountry})`);
            }

            return {
                success: true,
                country: ipCountry,
                countryName: ipCountry,
                city: headersList.get('cf-ipcity') || null,
                region: headersList.get('cf-region-code') || null,
                timezone: headersList.get('cf-timezone') || null,
                ip: cfIP
            };
        }

        // 2. Vercel Detection (Secondary)
        const vercelCountry = headersList.get('x-vercel-ip-country');
        const vercelIP = headersList.get('x-forwarded-for') || headersList.get('x-real-ip');

        if (vercelCountry) {
            const ip = typeof vercelIP === 'string' ? vercelIP.split(',')[0] : (vercelIP || 'Unknown');
            const ipCountry = vercelCountry.toUpperCase();

            console.log(`[Geolocation] Vercel Country Detected: ${vercelCountry}`);

            if (tzCountry && ipCountry !== tzCountry) {
                console.log(`[Geolocation] Vercel says ${ipCountry} but timezone says ${tzCountry}, using IP country (${ipCountry})`);
            }

            return {
                success: true,
                country: ipCountry,
                countryName: ipCountry,
                city: headersList.get('x-vercel-ip-city') || null,
                region: headersList.get('x-vercel-ip-region') || null,
                timezone: headersList.get('x-vercel-ip-timezone') || null,
                ip: ip
            };
        }

        // 3. Manual IP Check (No Country Header)
        await getUserIP(); // Just run it to check IP presence if needed silently

    } catch (error) {
        console.error('Geolocation processing failed:', error);
    }

    // Final Fallback — use client timezone when available, otherwise server timezone
    const tz = clientTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const defaultCountry = timezoneToCountry(tz);
    console.log(`[Geolocation] Fallback: timezone "${tz}" → country "${defaultCountry}"`);

    return {
        success: false,
        country: defaultCountry,
        countryName: defaultCountry,
        city: 'Unknown',
        region: 'Unknown',
        ip: 'Unknown'
    };
}

/**
 * Get user's IP address from request headers
 * Works with Cloudflare, Vercel, and standard deployments
 */
export async function getUserIP() {
    try {
        const { headers } = await import('next/headers');
        const headersList = await headers();

        // Try Cloudflare header
        const cfIP = headersList.get('cf-connecting-ip');
        if (cfIP) return cfIP;

        // Try X-Forwarded-For
        const forwardedFor = headersList.get('x-forwarded-for');
        if (forwardedFor) {
            return forwardedFor.split(',')[0].trim();
        }

        // Try X-Real-IP
        const realIP = headersList.get('x-real-ip');
        if (realIP) return realIP;

        return null;
    } catch (error) {
        console.error('Failed to get user IP:', error);
        return null;
    }
}
