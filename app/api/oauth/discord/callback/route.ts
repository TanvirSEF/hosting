import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // Dynamic redirect
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const REDIRECT_URI = `${proto}://${host}/api/oauth/discord/callback`;

    if (!code || !state) {
        return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    // Decode email from state
    const email = Buffer.from(state, 'base64').toString('utf-8');

    try {
        if (!CLIENT_SECRET) {
            throw new Error('Missing DISCORD_CLIENT_SECRET in environment');
        }

        // Exchange code for token
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: CLIENT_ID!,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
            }),
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error('Discord Token Error:', error);
            return NextResponse.json({ error: 'Failed to get token' }, { status: 500 });
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Get User ID
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!userResponse.ok) {
            return NextResponse.json({ error: 'Failed to get user info' }, { status: 500 });
        }

        const userData = await userResponse.json();
        const discordId = userData.id;

        // Call Bot Webhook to Link User
        const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
        const BOT_WEBHOOK_URL = process.env.BOT_WEBHOOK_URL || 'http://localhost:3001';
        const GUILD_ID = process.env.DISCORD_GUILD_ID || '1052629807403376700';
        let redirectTo = `https://discord.com/channels/${GUILD_ID}`; // Fallback to guild

        try {
            console.log(`[OAUTH] Calling bot webhook: ${BOT_WEBHOOK_URL}/webhook/link-user for ${email} / ${discordId}`);
            const linkResponse = await fetch(`${BOT_WEBHOOK_URL}/webhook/link-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-webhook-secret': WEBHOOK_SECRET || '',
                },
                body: JSON.stringify({
                    discordId,
                    email,
                    accessToken, // Pass token so bot can join them to guild if needed
                }),
            });

            console.log(`[OAUTH] Bot response: ${linkResponse.status}`);
            if (linkResponse.ok) {
                const linkData = await linkResponse.json();
                console.log(`[OAUTH] Link data:`, linkData);
                // If the bot linked a ticket and returned its URL, redirect there directly
                if (linkData.channelUrl) {
                    redirectTo = linkData.channelUrl;
                }
            } else {
                const errText = await linkResponse.text();
                console.error(`[OAUTH] Bot webhook error ${linkResponse.status}: ${errText}`);
            }
        } catch (botErr: any) {
            console.error('[OAUTH] Bot unreachable (ECONNREFUSED?):', botErr.message);
        }

        return NextResponse.redirect(redirectTo);

    } catch (error: any) {
        console.error('OAuth Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 });
    }
}
